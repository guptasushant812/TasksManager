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
    let overdueFollowUps = 0, escalatedTasks = 0;
    statusCounts.forEach(s => {
      if (s._id === 'InProgress') inProgress = s.count;
      if (s._id === 'Pending') pending = s.count;
      if (s._id === 'Completed') completed = s.count;
      total += s.count;
    });

    const now = new Date();

    const activePipeline: any[] = [
      { $match: { isDeleted: { $ne: true }, workStatus: { $ne: 'Completed' } } },
      {
        $lookup: {
          from: 'followups',
          localField: '_id',
          foreignField: 'taskId',
          pipeline: [
            { $match: { isDeleted: false } },
            { $sort: { followUpNumber: -1, createdAt: -1 } },
          ],
          as: 'followUps'
        }
      },
      {
        $project: {
          dueDate: 1,
          fuCount: { $size: '$followUps' },
          lastFu: { $arrayElemAt: ['$followUps', 0] },
          hasOverdueFu: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: '$followUps',
                    as: 'fu',
                    cond: {
                      $and: [
                        { $ne: ['$$fu.nextFollowUpDate', null] },
                        { $lt: ['$$fu.nextFollowUpDate', now] }
                      ]
                    }
                  }
                }
              },
              0
            ]
          }
        }
      }
    ];

    const activeTasksData = await Task.aggregate(activePipeline);

    const settings = await mongoose.model('EscalationSettings').findOne().lean() as any;
    const threshold = settings?.threshold || 3;
    const escalationsEnabled = settings?.enabled || false;

    activeTasksData.forEach(t => {
      const isFuOverdue = Boolean(t.hasOverdueFu || (t.lastFu?.nextFollowUpDate && new Date(t.lastFu.nextFollowUpDate) < now));
      const isDueOverdue = Boolean(t.dueDate && new Date(t.dueDate) < now);
      if (isFuOverdue || isDueOverdue) {
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
