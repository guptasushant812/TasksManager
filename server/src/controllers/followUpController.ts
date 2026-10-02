import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import FollowUp, { getNextFollowUpNumber } from '../models/FollowUp';
import Task from '../models/Task';

// ── GET /api/tasks/:taskId/follow-ups ─────────────────────────────────────────
export async function listFollowUps(req: Request, res: Response, next: NextFunction) {
  try {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    const includeDeleted = req.query.includeDeleted === 'true';
    const filter: Record<string, unknown> = { taskId };
    if (!includeDeleted) filter.isDeleted = false;

    const followUps = await FollowUp.find(filter)
      .sort({ followUpNumber: -1, createdAt: -1, followUpDate: -1 })
      .lean();

    const followUpIds = followUps.map((fu) => fu._id);
    const attachments = await mongoose.model('FollowUpAttachment').find({ followUpId: { $in: followUpIds } }).select('-data').lean();
    
    const attachmentsByFollowUp = attachments.reduce((acc: Record<string, any[]>, att) => {
      const fuId = att.followUpId.toString();
      if (!acc[fuId]) acc[fuId] = [];
      acc[fuId].push(att);
      return acc;
    }, {});

    const enrichedFollowUps = followUps.map((fu) => ({
      ...fu,
      attachments: attachmentsByFollowUp[fu._id.toString()] || [],
    }));

    res.json({ data: enrichedFollowUps });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/tasks/:taskId/follow-ups ────────────────────────────────────────
export async function createFollowUp(req: Request, res: Response, next: NextFunction) {
  try {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const { communicated, method, methodOther, contactPerson,
            responseReceived, notes, nextAction, nextFollowUpDate,
            followUpDate } = req.body;

    // Validate required field
    if (!communicated || (typeof communicated === 'string' && !communicated.trim())) {
      res.status(400).json({ error: '"communicated" is required' });
      return;
    }

    // Duplicate detection: same task, same communicated text, within 1 minute
    const fuDate = followUpDate ? new Date(followUpDate) : new Date();
    const oneMinAgo = new Date(fuDate.getTime() - 60_000);
    const oneMinAhead = new Date(fuDate.getTime() + 60_000);
    const duplicate = await FollowUp.findOne({
      taskId,
      isDeleted: false,
      communicated: communicated.trim(),
      followUpDate: { $gte: oneMinAgo, $lte: oneMinAhead },
    });
    if (duplicate) {
      res.status(409).json({ error: 'A similar follow-up was already recorded at this time.' });
      return;
    }

    const taskObjectId = new mongoose.Types.ObjectId(taskId);
    const followUpNumber = await getNextFollowUpNumber(taskObjectId);



    const followUp = new FollowUp({
      taskId: taskObjectId,
      followUpNumber,
      followUpDate: fuDate,
      method: method || 'Phone',
      methodOther: methodOther || '',
      contactPerson: contactPerson || task.contactPerson || '',
      communicated: communicated.trim(),
      responseReceived: responseReceived || '',
      notes: notes || '',
      nextAction: nextAction || '',
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
    });

    await followUp.save();



    res.status(201).json(followUp);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/tasks/:taskId/follow-ups/:id ─────────────────────────────────────
export async function getFollowUp(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid follow-up ID' });
      return;
    }

    const followUp = await FollowUp.findById(id).lean();
    if (!followUp) {
      res.status(404).json({ error: 'Follow-up not found' });
      return;
    }

    res.json(followUp);
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/tasks/:taskId/follow-ups/:id ─────────────────────────────────────
export async function updateFollowUp(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid follow-up ID' });
      return;
    }

    const existing = await FollowUp.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Follow-up not found' });
      return;
    }
    if (existing.isDeleted) {
      res.status(400).json({ error: 'Cannot edit a deleted follow-up' });
      return;
    }

    const allowedFields = [
      'followUpDate', 'method', 'methodOther', 'contactPerson',
      'communicated', 'responseReceived', 'notes', 'nextAction', 'nextFollowUpDate',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'followUpDate' || field === 'nextFollowUpDate') {
          updates[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const followUp = await FollowUp.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json(followUp);
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/tasks/:taskId/follow-ups/:id (soft delete) ────────────────────
export async function deleteFollowUp(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid follow-up ID' });
      return;
    }

    const { reason } = req.body || {};
    if (!reason || (typeof reason === 'string' && !reason.trim())) {
      res.status(400).json({ error: 'A reason is required to delete a follow-up' });
      return;
    }

    const followUp = await FollowUp.findById(id);
    if (!followUp) {
      res.status(404).json({ error: 'Follow-up not found' });
      return;
    }
    if (followUp.isDeleted) {
      res.status(400).json({ error: 'Follow-up is already deleted' });
      return;
    }

    followUp.isDeleted = true;
    followUp.deletedReason = reason.trim();
    await followUp.save();

    res.json({ message: 'Follow-up soft-deleted', id });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/tasks/:taskId/follow-ups/:id/attachments ────────────────────────
export async function uploadAttachments(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid follow-up ID' });
      return;
    }

    const followUp = await FollowUp.findById(id);
    if (!followUp) {
      res.status(404).json({ error: 'Follow-up not found' });
      return;
    }

    const newAttachments = (req.files as Express.Multer.File[] || []).map((file: any) => ({
      url: file.path,
      public_id: file.filename,
      filename: file.originalname,
    }));

    followUp.attachments.push(...newAttachments);
    await followUp.save();



    res.json(followUp);
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/tasks/:taskId/follow-ups/:id/attachments/:attachmentId ────────
export async function deleteAttachment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, attachmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid follow-up ID' });
      return;
    }

    const followUp = await FollowUp.findById(id);
    if (!followUp) {
      res.status(404).json({ error: 'Follow-up not found' });
      return;
    }

    const attachmentIndex = followUp.attachments.findIndex((a: any) => a._id.toString() === attachmentId);
    if (attachmentIndex === -1) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Delete from Cloudinary
    const { cloudinary } = await import('../services/uploadService');
    await cloudinary.uploader.destroy(followUp.attachments[attachmentIndex].public_id);

    followUp.attachments.splice(attachmentIndex, 1);
    await followUp.save();

    res.json(followUp);
  } catch (err) {
    next(err);
  }
}
