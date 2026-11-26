import { Request, Response, NextFunction } from 'express';
import Settings from '../models/Settings';

export async function sessionValidator(req: Request, res: Response, next: NextFunction) {
  if (
    req.path.startsWith('/public') ||
    req.path.startsWith('/settings/verify-password') ||
    req.path.startsWith('/settings/password-status') ||
    req.path.startsWith('/f/') ||
    req.path === '/health'
  ) {
    return next();
  }

  const clientUpdatedAt = req.headers['x-password-updated-at'];
  if (typeof clientUpdatedAt === 'string' && clientUpdatedAt.trim()) {
    try {
      const clientTime = new Date(clientUpdatedAt).getTime();
      if (!isNaN(clientTime)) {
        const settings = await Settings.findOne({}, 'passwordUpdatedAt').lean();
        if (settings?.passwordUpdatedAt) {
          const serverTime = new Date(settings.passwordUpdatedAt).getTime();
          if (serverTime > clientTime + 1000) {
            res.status(401).json({
              error: 'PASSWORD_CHANGED',
              message: 'Master password has been updated. Please unlock with your new password.',
            });
            return;
          }
        }
      }
    } catch {}
  }

  next();
}
