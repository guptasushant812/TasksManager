import { Request, Response, NextFunction } from 'express';
import EscalationSettings from '../models/EscalationSettings';

// Get singleton escalation settings
export async function getEscalationSettings(req: Request, res: Response, next: NextFunction) {
  try {
    let settings = await EscalationSettings.findOne();
    if (!settings) {
      settings = new EscalationSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

// Update escalation settings
export async function updateEscalationSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { threshold, enabled } = req.body;
    let settings = await EscalationSettings.findOne();
    if (!settings) {
      settings = new EscalationSettings();
    }
    if (typeof threshold === 'number') settings.threshold = threshold;
    if (typeof enabled === 'boolean') settings.enabled = enabled;
    
    await settings.save();
    res.json(settings);
  } catch (err) {
    next(err);
  }
}
