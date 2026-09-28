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

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (/[\r\n]/.test(email)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidEmailList(emails: string): boolean {
  if (!emails || typeof emails !== 'string') return true;
  if (/[\r\n]/.test(emails)) return false;
  const list = emails.split(',').map((e) => e.trim()).filter(Boolean);
  return list.every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

// Update escalation settings
export async function updateEscalationSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { threshold, enabled, managerEmail, hodEmail, dyhodEmail, ccEmail } = req.body;
    let settings = await EscalationSettings.findOne();
    if (!settings) {
      settings = new EscalationSettings();
    }

    if (typeof threshold === 'number') {
      settings.threshold = Math.max(1, Math.min(50, Math.floor(threshold)));
    }
    if (typeof enabled === 'boolean') {
      settings.enabled = enabled;
    }

    if (typeof managerEmail === 'string') {
      const trimmed = managerEmail.trim();
      if (trimmed && !isValidEmail(trimmed)) {
        res.status(400).json({ error: 'Invalid Manager email address format' });
        return;
      }
      settings.managerEmail = trimmed;
    }

    if (typeof hodEmail === 'string') {
      const trimmed = hodEmail.trim();
      if (trimmed && !isValidEmail(trimmed)) {
        res.status(400).json({ error: 'Invalid HOD email address format' });
        return;
      }
      settings.hodEmail = trimmed;
    }

    if (typeof dyhodEmail === 'string') {
      const trimmed = dyhodEmail.trim();
      if (trimmed && !isValidEmail(trimmed)) {
        res.status(400).json({ error: 'Invalid Dy. HOD email address format' });
        return;
      }
      settings.dyhodEmail = trimmed;
    }

    if (typeof ccEmail === 'string') {
      const trimmed = ccEmail.trim();
      if (trimmed && !isValidEmailList(trimmed)) {
        res.status(400).json({ error: 'One or more CC email addresses are invalid (comma-separated expected)' });
        return;
      }
      settings.ccEmail = trimmed;
    }
    
    await settings.save();
    res.json(settings);
  } catch (err) {
    next(err);
  }
}
