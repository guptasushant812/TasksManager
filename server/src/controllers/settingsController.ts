import { Request, Response, NextFunction } from 'express';
import Settings from '../models/Settings';
import crypto from 'crypto';

function hashMasterPassword(password: string): string {
  return crypto.createHash('sha256').update(`tasksmanager_salt_${password.trim()}`).digest('hex');
}

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    const data: any = settings.toObject ? settings.toObject() : { ...settings };
    delete data.masterPasswordHash;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { isPublicShareEnabled, aiKeys, preferredAiModel, activeAiProvider } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    if (typeof isPublicShareEnabled === 'boolean') {
      settings.isPublicShareEnabled = isPublicShareEnabled;
    }

    if (aiKeys && typeof aiKeys === 'object') {
      settings.aiKeys = {
        gemini: typeof aiKeys.gemini === 'string' ? aiKeys.gemini.trim() : (settings.aiKeys?.gemini || ''),
        groq: typeof aiKeys.groq === 'string' ? aiKeys.groq.trim() : (settings.aiKeys?.groq || ''),
        grok: typeof aiKeys.grok === 'string' ? aiKeys.grok.trim() : (settings.aiKeys?.grok || ''),
      };
    }

    if (typeof preferredAiModel === 'string') {
      settings.preferredAiModel = preferredAiModel;
    }

    if (typeof activeAiProvider === 'string') {
      settings.activeAiProvider = activeAiProvider;
    }
    
    await settings.save();
    const data: any = settings.toObject ? settings.toObject() : { ...settings };
    delete data.masterPasswordHash;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function regenerateToken(req: Request, res: Response, next: NextFunction) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    settings.publicShareToken = crypto.randomBytes(16).toString('hex');
    await settings.save();
    
    const data: any = settings.toObject ? settings.toObject() : { ...settings };
    delete data.masterPasswordHash;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function verifyMasterPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { password } = req.body;
    if (typeof password !== 'string' || !password.trim()) {
      res.json({ valid: false });
      return;
    }

    const trimmed = password.trim();
    const inputHash = hashMasterPassword(trimmed);

    const settings = await Settings.findOne({}, 'masterPasswordHash').lean();

    if (settings && settings.masterPasswordHash) {
      res.json({ valid: settings.masterPasswordHash === inputHash });
      return;
    }

    // Fall back to default passcode if no custom password was set yet
    const isDefault = trimmed === 'Sun123@' || trimmed === 'Sushant2026@';
    res.json({ valid: isDefault });
  } catch (err) {
    next(err);
  }
}

export async function updateMasterPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { newPassword } = req.body;
    if (typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters long' });
      return;
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.masterPasswordHash = hashMasterPassword(newPassword);
    settings.passwordUpdatedAt = new Date();
    await settings.save();

    res.json({ success: true, message: 'Master application password updated successfully' });
  } catch (err) {
    next(err);
  }
}
