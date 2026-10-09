import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task';
import { buildQuery } from '../utils/buildQuery';

export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { filter } = buildQuery(req.query);

    const statusCounts = await Task.aggregate([
      { $match: filter },
      { $group: { _id: '$workStatus', count: { $sum: 1 } } }
    ]);
    
    let inProgress = 0, pending = 0, completed = 0, total = 0;
    statusCounts.forEach(s => {
      if (s._id === 'InProgress') inProgress = s.count;
      if (s._id === 'Pending') pending = s.count;
      if (s._id === 'Completed') completed = s.count;
      total += s.count;
    });

    // Follow-up metrics for active tasks
    let overdueFollowUps = 0;
    let escalatedTasks = 0;

    const activePipeline: any[] = [
      { $match: { ...filter, workStatus: { $ne: 'Completed' } } },
      {
        $lookup: {
          from: 'followups', // exact collection name in MongoDB
          localField: '_id',
          foreignField: 'taskId',
          pipeline: [
            { $match: { isDeleted: false } },
            { $sort: { followUpNumber: -1 } },
          ],
          as: 'followUps'
        }
      },
      {
        $project: {
          fuCount: { $size: '$followUps' },
          lastFu: { $arrayElemAt: ['$followUps', 0] }
        }
      }
    ];

    const activeTasksData = await Task.aggregate(activePipeline);

    const now = new Date();
    const settings = await mongoose.model('EscalationSettings').findOne().lean() as any;
    const threshold = settings?.threshold || 3;
    const escalationsEnabled = settings?.enabled || false;

    activeTasksData.forEach(t => {
      if (t.lastFu?.nextFollowUpDate && new Date(t.lastFu.nextFollowUpDate) < now) {
        overdueFollowUps++;
      }
      if (escalationsEnabled && t.fuCount >= threshold) {
        escalatedTasks++;
      }
    });

    res.json({ inProgress, pending, completed, total, overdueFollowUps, escalatedTasks });
  } catch (err) {
    next(err);
  }
}
