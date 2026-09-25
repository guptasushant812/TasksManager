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

    // Get today's start and end date objects for querying Mongoose Date fields
    const todayStr = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    // Fetch tasks
    const [todayTasks, pendingTasks, completedTasks] = await Promise.all([
      // Tasks with date exactly today
      Task.find({ date: { $gte: startOfDay, $lte: endOfDay } }).sort({ createdAt: -1 }),
      // All pending / in-progress tasks
      Task.find({ workStatus: { $in: ['Pending', 'InProgress'] } }).sort({ createdAt: -1 }),
      // All completed tasks
      Task.find({ workStatus: 'Completed' }).sort({ createdAt: -1 }),
    ]);

    res.json({
      today: {
        count: todayTasks.length,
        tasks: todayTasks,
      },
      pending: {
        count: pendingTasks.length,
        tasks: pendingTasks,
      },
      completed: {
        count: completedTasks.length,
        tasks: completedTasks,
      },
    });

  } catch (err) {
    next(err);
  }
}
