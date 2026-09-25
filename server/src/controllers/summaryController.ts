import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task';
import { buildQuery } from '../utils/buildQuery';

// ── GET /api/summary ──────────────────────────────────────────────────────────
export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { filter } = buildQuery(req.query);

    // Run all three counts in parallel
    const [inProgress, pending, completed, total] = await Promise.all([
      Task.countDocuments({ ...filter, workStatus: 'InProgress' }),
      Task.countDocuments({ ...filter, workStatus: 'Pending' }),
      Task.countDocuments({ ...filter, workStatus: 'Completed' }),
      Task.countDocuments(filter),
    ]);

    // Follow-up metrics
    const activeTasks = await Task.find({ ...filter, workStatus: { $ne: 'Completed' } }).select('_id').lean();
    const activeTaskIds = activeTasks.map((t) => t._id);

    let overdueFollowUps = 0;
    let escalatedTasks = 0;

    if (activeTaskIds.length > 0) {
      const summaries = await mongoose.model('FollowUp').aggregate([
        { $match: { taskId: { $in: activeTaskIds }, isDeleted: false } },
        { $sort: { followUpNumber: -1 } },
        {
          $group: {
            _id: '$taskId',
            count: { $sum: 1 },
            nextFollowUpDate: { $first: '$nextFollowUpDate' },
          },
        },
      ]);

      const now = new Date();
      // Fetch settings to know the threshold
      const settings = await mongoose.model('EscalationSettings').findOne().lean() as any;
      const threshold = settings?.threshold || 3;
      const escalationsEnabled = settings?.enabled || false;

      for (const s of summaries) {
        if (s.nextFollowUpDate && new Date(s.nextFollowUpDate) < now) {
          overdueFollowUps++;
        }
        if (escalationsEnabled && s.count >= threshold) {
          escalatedTasks++;
        }
      }
    }

    res.json({ inProgress, pending, completed, total, overdueFollowUps, escalatedTasks });
  } catch (err) {
    next(err);
  }
}
