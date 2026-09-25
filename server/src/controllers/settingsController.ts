import { Request, Response, NextFunction } from 'express';
import Settings from '../models/Settings';
import crypto from 'crypto';

// Get settings
export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

// Update settings (toggle public share)
export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { isPublicShareEnabled } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    if (typeof isPublicShareEnabled === 'boolean') {
      settings.isPublicShareEnabled = isPublicShareEnabled;
    }
    
    await settings.save();
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

// Regenerate public share token
export async function regenerateToken(req: Request, res: Response, next: NextFunction) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    settings.publicShareToken = crypto.randomBytes(16).toString('hex');
    await settings.save();
    
    res.json(settings);
  } catch (err) {
    next(err);
  }
}
