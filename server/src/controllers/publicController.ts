import { Request, Response, NextFunction } from 'express';
import Settings from '../models/Settings';
import Task from '../models/Task';
import { buildQuery } from '../utils/buildQuery';

export async function getPublicStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;

    const settings = await Settings.findOne();
    
    // Check if sharing is enabled and token matches
    if (!settings || !settings.isPublicShareEnabled || settings.publicShareToken !== token) {
      res.status(403).json({ error: 'This public link is invalid or disabled.' });
      return;
    }

    const { filter, sort } = buildQuery(req.query);

    // Natural numeric ordering for task IDs (e.g. TK-10 before TK-9)
    const collation = { locale: 'en', numericOrdering: true };

    const tasks = await Task.find(filter)
      .collation(collation)
      .sort(sort)
      .lean();

    // Summary counts for the public page
    const todayStr = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    const [todayCount, pendingCount, inProgressCount, completedCount, totalCount] = await Promise.all([
      Task.countDocuments({ isDeleted: { $ne: true }, date: { $gte: startOfDay, $lte: endOfDay } }),
      Task.countDocuments({ isDeleted: { $ne: true }, workStatus: 'Pending' }),
      Task.countDocuments({ isDeleted: { $ne: true }, workStatus: 'InProgress' }),
      Task.countDocuments({ isDeleted: { $ne: true }, workStatus: 'Completed' }),
      Task.countDocuments({ isDeleted: { $ne: true } }),
    ]);

    // Backward compatibility with legacy today/pending/completed splits
    const todayTasks = tasks.filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date).toISOString().split('T')[0];
      return d === todayStr;
    });
    const pendingTasks = tasks.filter((t) => t.workStatus === 'Pending' || t.workStatus === 'InProgress');
    const completedTasks = tasks.filter((t) => t.workStatus === 'Completed');

    res.json({
      tasks,
      total: tasks.length,
      counts: {
        total: totalCount,
        today: todayCount,
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
      },
      today: {
        count: todayCount,
        tasks: todayTasks,
      },
      pending: {
        count: pendingCount + inProgressCount,
        tasks: pendingTasks,
      },
      completed: {
        count: completedCount,
        tasks: completedTasks,
      },
    });

  } catch (err) {
    next(err);
  }
}
