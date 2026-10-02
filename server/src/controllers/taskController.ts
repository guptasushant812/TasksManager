import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Task, { getNextTaskId } from '../models/Task';
import FollowUp from '../models/FollowUp';
import { buildQuery } from '../utils/buildQuery';

const ALLOWED_TASK_PRIORITIES = ['High', 'Medium', 'Low'];
const ALLOWED_TASK_STATUSES = ['InProgress', 'Pending', 'Completed'];

// ── GET /api/tasks ────────────────────────────────────────────────────────────
export async function listTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const { filter, sort, page, limit, skip } = buildQuery(req.query);
    
    // Support for hasFollowUps query param
    if (req.query.hasFollowUps === 'true') {
      const distinctTaskIds = await FollowUp.distinct('taskId', { isDeleted: false });
      if (filter._id) {
        filter._id = { ...(filter._id as object), $in: distinctTaskIds };
      } else {
        filter._id = { $in: distinctTaskIds };
      }
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Task.countDocuments(filter),
    ]);

    const taskIds = tasks.map((t) => t._id);
    let tasksWithFollowUps = tasks;

    if (taskIds.length > 0) {
      const summaries = await FollowUp.aggregate([
        { $match: { taskId: { $in: taskIds }, isDeleted: false } },
        { $sort: { followUpDate: -1, createdAt: -1, followUpNumber: -1 } },
        {
          $group: {
            _id: '$taskId',
            count: { $sum: 1 },
            lastDate: { $first: '$followUpDate' },
            lastMethod: { $first: '$method' },
            lastCommunicated: { $first: '$communicated' },
            lastResponse: { $first: '$responseReceived' },
            nextFollowUpDate: { $first: '$nextFollowUpDate' },
          },
        },
      ]);

      const now = new Date();
      const summaryMap = new Map<string, {
        count: number;
        lastDate: string | null;
        lastMethod: string | null;
        lastCommunicated: string | null;
        lastResponse: string | null;
        nextFollowUpDate: string | null;
        isOverdue: boolean;
      }>();

      for (const s of summaries) {
        const nextDate = s.nextFollowUpDate ? new Date(s.nextFollowUpDate) : null;
        summaryMap.set(s._id.toString(), {
          count: s.count,
          lastDate: s.lastDate ? new Date(s.lastDate).toISOString() : null,
          lastMethod: s.lastMethod || null,
          lastCommunicated: s.lastCommunicated || null,
          lastResponse: s.lastResponse || null,
          nextFollowUpDate: s.nextFollowUpDate ? new Date(s.nextFollowUpDate).toISOString() : null,
          isOverdue: nextDate ? nextDate < now : false,
        });
      }

      tasksWithFollowUps = tasks.map((task) => {
        const summary = summaryMap.get(task._id.toString()) || {
          count: 0,
          lastDate: null,
          lastMethod: null,
          lastCommunicated: null,
          lastResponse: null,
          nextFollowUpDate: null,
          isOverdue: false,
        };
        if (task.workStatus === 'Completed') {
          summary.isOverdue = false;
        }
        return {
          ...task,
          followUpSummary: summary,
        };
      });
    }

    res.json({
      data: tasksWithFollowUps,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/tasks ───────────────────────────────────────────────────────────
export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      title,
      description,
      givenBy,
      contactPerson,
      priority,
      workStatus,
      reason,
      remarks,
      date,
      dueDate,
      userId,
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    if (title.trim().length > 300) {
      res.status(400).json({ error: 'Title cannot exceed 300 characters' });
      return;
    }

    if (!date) {
      res.status(400).json({ error: 'Task date is required' });
      return;
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Invalid task date format' });
      return;
    }

    let parsedDueDate: Date | null = null;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        res.status(400).json({ error: 'Invalid due date format' });
        return;
      }
    }

    const validatedPriority = ALLOWED_TASK_PRIORITIES.includes(priority) ? priority : 'Medium';
    const validatedStatus = ALLOWED_TASK_STATUSES.includes(workStatus) ? workStatus : 'Pending';

    const rawReason = typeof reason === 'string' ? reason.trim() : '';
    const rawRemarks = typeof remarks === 'string' ? remarks.trim() : '';
    let ipReason = typeof req.body.inProgressReason === 'string' ? req.body.inProgressReason.trim() : '';
    let pReason = typeof req.body.pendingReason === 'string' ? req.body.pendingReason.trim() : '';
    let cRemarks = typeof req.body.completedRemarks === 'string' ? req.body.completedRemarks.trim() : '';

    if (validatedStatus === 'InProgress' && !ipReason && rawReason) {
      ipReason = rawReason;
    } else if (validatedStatus === 'Pending' && !pReason && rawReason) {
      pReason = rawReason;
    } else if (validatedStatus === 'Completed' && !cRemarks && rawRemarks) {
      cRemarks = rawRemarks;
    }

    const taskId = await getNextTaskId();
    const task = new Task({
      taskId,
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      givenBy: typeof givenBy === 'string' ? givenBy.trim() : '',
      contactPerson: typeof contactPerson === 'string' ? contactPerson.trim() : '',
      priority: validatedPriority,
      workStatus: validatedStatus,
      reason: rawReason,
      remarks: rawRemarks,
      inProgressReason: ipReason,
      pendingReason: pReason,
      completedRemarks: cRemarks,
      date: parsedDate,
      dueDate: parsedDueDate,
      userId: typeof userId === 'string' ? userId.trim() : null,
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/tasks/:id ────────────────────────────────────────────────────────
export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    const existingTask = await Task.findById(id);
    if (!existingTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const updates: Record<string, unknown> = {};

    if (req.body.title !== undefined) {
      if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
        res.status(400).json({ error: 'Title cannot be empty' });
        return;
      }
      if (req.body.title.trim().length > 300) {
        res.status(400).json({ error: 'Title cannot exceed 300 characters' });
        return;
      }
      updates.title = req.body.title.trim();
    }

    if (req.body.date !== undefined) {
      const parsedDate = new Date(req.body.date);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ error: 'Invalid task date format' });
        return;
      }
      updates.date = parsedDate;
    }

    if (req.body.dueDate !== undefined) {
      if (!req.body.dueDate) {
        updates.dueDate = null;
      } else {
        const parsedDue = new Date(req.body.dueDate);
        if (isNaN(parsedDue.getTime())) {
          res.status(400).json({ error: 'Invalid due date format' });
          return;
        }
        updates.dueDate = parsedDue;
      }
    }

    if (req.body.priority !== undefined) {
      if (!ALLOWED_TASK_PRIORITIES.includes(req.body.priority)) {
        res.status(400).json({ error: 'Invalid priority value' });
        return;
      }
      updates.priority = req.body.priority;
    }

    if (req.body.workStatus !== undefined) {
      if (!ALLOWED_TASK_STATUSES.includes(req.body.workStatus)) {
        res.status(400).json({ error: 'Invalid work status value' });
        return;
      }
      updates.workStatus = req.body.workStatus;
    }

    for (const strField of ['description', 'givenBy', 'contactPerson', 'reason', 'remarks', 'inProgressReason', 'pendingReason', 'completedRemarks']) {
      if (req.body[strField] !== undefined) {
        updates[strField] = typeof req.body[strField] === 'string' ? req.body[strField].trim() : '';
      }
    }

    // Synchronize current status reason
    const effectiveStatus = (updates.workStatus as string) || existingTask.workStatus;
    if (effectiveStatus === 'InProgress') {
      if (updates.inProgressReason !== undefined) {
        updates.reason = updates.inProgressReason;
      } else if (updates.reason !== undefined) {
        updates.inProgressReason = updates.reason;
      } else if (!updates.inProgressReason && existingTask.inProgressReason) {
        updates.reason = existingTask.inProgressReason;
      }
    } else if (effectiveStatus === 'Pending') {
      if (updates.pendingReason !== undefined) {
        updates.reason = updates.pendingReason;
      } else if (updates.reason !== undefined) {
        updates.pendingReason = updates.reason;
      } else if (!updates.pendingReason && existingTask.pendingReason) {
        updates.reason = existingTask.pendingReason;
      }
    } else if (effectiveStatus === 'Completed') {
      if (updates.completedRemarks !== undefined) {
        updates.remarks = updates.completedRemarks;
      } else if (updates.remarks !== undefined) {
        updates.completedRemarks = updates.remarks;
      } else if (!updates.completedRemarks && existingTask.completedRemarks) {
        updates.remarks = existingTask.completedRemarks;
      }
    }

    const task = await Task.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    res.json(task);
  } catch (err) {
    next(err);
  }
}

// ── Helper to resequence Task IDs ──────────────────────────────────────────────
async function resequenceTaskIds() {
  const tasks = await Task.find({ isDeleted: { $ne: true } }).sort({ createdAt: 1 });
  for (let i = 0; i < tasks.length; i++) {
    const num = String(i + 1).padStart(4, '0');
    const newTaskId = `TK-${num}`;
    if (tasks[i].taskId !== newTaskId) {
      await Task.updateOne({ _id: tasks[i]._id }, { $set: { taskId: newTaskId } });
    }
  }
  
  // Update the counter to match the new total length
  const Counter = mongoose.models.Counter;
  if (Counter) {
    await Counter.updateOne(
      { _id: 'taskId' },
      { $set: { seq: tasks.length } },
      { upsert: true }
    );
  }
}

// ── DELETE /api/tasks/:id (Soft-Delete) ────────────────────────────────────────
export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    const task = await Task.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date(), deletedReason: 'User deleted task' },
      { new: true }
    );
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    await FollowUp.updateMany({ taskId: id }, { isDeleted: true, deletedReason: 'Parent task deleted' });
    
    // Resequence tasks after deletion
    await resequenceTaskIds();
    
    res.json({ message: 'Task deleted', id });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/tasks (bulk Soft-Delete) ───────────────────────────────────────
export async function deleteManyTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'A non-empty array of task IDs is required' });
      return;
    }
    if (ids.length > 500) {
      res.status(400).json({ error: 'Cannot delete more than 500 tasks in a single operation' });
      return;
    }

    const validIds = ids.filter((id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      res.status(400).json({ error: 'No valid task IDs provided' });
      return;
    }

    const [result] = await Promise.all([
      Task.updateMany({ _id: { $in: validIds } }, { isDeleted: true, deletedAt: new Date(), deletedReason: 'Bulk deleted by user' }),
      FollowUp.updateMany({ taskId: { $in: validIds } }, { isDeleted: true, deletedReason: 'Parent task deleted' }),
    ]);
    
    // Resequence tasks once after bulk deletion
    await resequenceTaskIds();
    
    res.json({ message: 'Tasks deleted', count: result.modifiedCount });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/tasks/:id/restore ───────────────────────────────────────────────
export async function restoreTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    const task = await Task.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null, deletedReason: '' },
      { new: true }
    );
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    await FollowUp.updateMany({ taskId: id, deletedReason: 'Parent task deleted' }, { isDeleted: false, deletedReason: '' });
    
    await resequenceTaskIds();
    res.json({ message: 'Task restored', task });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/tasks/:id/escalate ───────────────────────────────────────────────
export async function escalateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const { sendEscalationEmail } = await import('../services/emailService');
    
    const settings = await mongoose.model('EscalationSettings').findOne().lean() as any;
    if (!settings || !settings.enabled) {
      res.status(400).json({ error: 'Escalation is not enabled in settings' });
      return;
    }

    // Wait slightly to ensure Cloudinary webhooks or file streaming has settled in MongoDB
    await new Promise(resolve => setTimeout(resolve, 1500));

    const allFollowUps = await FollowUp.find({ taskId: id, isDeleted: false })
      .sort({ followUpDate: -1, createdAt: -1, followUpNumber: -1 })
      .lean();
    const activeCount = allFollowUps.length;

    await sendEscalationEmail(task, activeCount, settings, allFollowUps);
    
    res.json({ message: 'Escalation email sent successfully' });
  } catch (err) {
    next(err);
  }
}
