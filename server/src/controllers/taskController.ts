import { Request, Response, NextFunction } from 'express';
import Task, { getNextTaskId } from '../models/Task';
import FollowUp from '../models/FollowUp';
import { buildQuery } from '../utils/buildQuery';

// ── GET /api/tasks ────────────────────────────────────────────────────────────
export async function listTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const { filter, sort, page, limit, skip } = buildQuery(req.query);
    
    // Support for hasFollowUps query param
    if (req.query.hasFollowUps === 'true') {
      const distinctTaskIds = await FollowUp.distinct('taskId', { isDeleted: false });
      if (filter._id) {
        // If there's already an _id filter (unlikely, but safe), intersect them
        filter._id = { ...filter._id, $in: distinctTaskIds };
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
        { $sort: { followUpNumber: -1 } },
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
    const taskId = await getNextTaskId();
    const task = new Task({ ...req.body, taskId });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/tasks/:id ────────────────────────────────────────────────────────
export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────
export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    await FollowUp.deleteMany({ taskId: req.params.id });
    res.json({ message: 'Task deleted', id: req.params.id });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/tasks (bulk) ──────────────────────────────────────────────────
export async function deleteManyTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids array required' });
      return;
    }
    const [result] = await Promise.all([
      Task.deleteMany({ _id: { $in: ids } }),
      FollowUp.deleteMany({ taskId: { $in: ids } }),
    ]);
    res.json({ message: 'Tasks deleted', count: result.deletedCount });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/tasks/:id/escalate ───────────────────────────────────────────────
export async function escalateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const { sendEscalationEmail } = await import('../services/emailService');
    const mongoose = (await import('mongoose')).default;
    
    const settings = await mongoose.model('EscalationSettings').findOne().lean() as any;
    if (!settings || !settings.enabled) {
      res.status(400).json({ error: 'Escalation is not enabled in settings' });
      return;
    }

    // Wait slightly to ensure Cloudinary webhooks or file streaming has perfectly settled in MongoDB
    await new Promise(resolve => setTimeout(resolve, 1500));

    const allFollowUps = await FollowUp.find({ taskId: id, isDeleted: false }).sort({ followUpNumber: 1 }).lean();
    const activeCount = allFollowUps.length;

    await sendEscalationEmail(task, activeCount, settings, allFollowUps);
    
    res.json({ message: 'Escalation email sent successfully' });
  } catch (err) {
    next(err);
  }
}
