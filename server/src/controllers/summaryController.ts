import { Request, Response, NextFunction } from 'express';
import { PipelineStage } from 'mongoose';
import Task from '../models/Task';
import EscalationSettings from '../models/EscalationSettings';
import { buildQuery } from '../utils/buildQuery';

export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { filter } = buildQuery(req.query);

    const statusCounts = await Task.aggregate([
      { $match: filter },
      { $group: { _id: '$workStatus', count: { $sum: 1 } } }
    ]);

    const counts: Record<string, number> = {};
    let total = 0;
    for (const s of statusCounts) {
      if (s._id) counts[s._id] = s.count;
      total += s.count;
    }

    const now = new Date();

    const activePipeline: PipelineStage[] = [
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

    const [activeTasksData, settings] = await Promise.all([
      Task.aggregate(activePipeline),
      EscalationSettings.findOne().lean(),
    ]);

    const threshold = settings?.threshold ?? 3;
    const escalationsEnabled = settings?.enabled ?? false;

    let overdueFollowUps = 0;
    let escalatedTasks = 0;

    for (const task of activeTasksData) {
      const isFuOverdue = Boolean(task.hasOverdueFu || (task.lastFu?.nextFollowUpDate && new Date(task.lastFu.nextFollowUpDate) < now));
      const isDueOverdue = Boolean(task.dueDate && new Date(task.dueDate) < now);

      if (isFuOverdue || isDueOverdue) overdueFollowUps++;
      if (escalationsEnabled && task.fuCount >= threshold) escalatedTasks++;
    }

    res.json({
      inProgress: counts.InProgress || 0,
      pending: counts.Pending || 0,
      completed: counts.Completed || 0,
      total,
      overdueFollowUps,
      escalatedTasks,
    });
  } catch (err) {
    next(err);
  }
}
