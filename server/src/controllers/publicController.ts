import { Request, Response, NextFunction } from 'express';
import Settings from '../models/Settings';
import Task from '../models/Task';

export async function getPublicStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;

    const settings = await Settings.findOne();
    
    // Check if sharing is enabled and token matches
    if (!settings || !settings.isPublicShareEnabled || settings.publicShareToken !== token) {
      res.status(403).json({ error: 'This public link is invalid or disabled.' });
      return;
    }

    // Natural numeric ordering for task IDs (e.g. TK-010 before TK-009)
    const collation = { locale: 'en', numericOrdering: true };

    // Fetch all active, non-deleted tasks
    const allTasks = await Task.find({ isDeleted: { $ne: true } })
      .collation(collation)
      .sort({ taskId: -1 })
      .lean();

    // Today's date calculations (comparing both ISO date strings and local timestamps)
    const now = new Date();
    const todayIso = now.toISOString().split('T')[0];
    const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const isTodayTask = (t: any) => {
      if (t.date) {
        const d = new Date(t.date);
        const iso = d.toISOString().split('T')[0];
        const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (iso === todayIso || local === localTodayStr || iso === localTodayStr || local === todayIso) return true;
      }
      return false;
    };

    const todayTasks = allTasks.filter(isTodayTask);
    const inProgressTasks = allTasks.filter((t) => t.workStatus === 'InProgress');
    const pendingTasks = allTasks.filter((t) => t.workStatus === 'Pending');
    const completedTasks = allTasks.filter((t) => t.workStatus === 'Completed');

    res.json({
      all: allTasks,
      today: todayTasks,
      inProgress: inProgressTasks,
      pending: pendingTasks,
      completed: completedTasks,
      counts: {
        total: allTasks.length,
        today: todayTasks.length,
        inProgress: inProgressTasks.length,
        pending: pendingTasks.length,
        completed: completedTasks.length,
      },
      // Default to today's tasks for initial view
      tasks: todayTasks,
    });

  } catch (err) {
    next(err);
  }
}
