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

export async function getPasswordStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await Settings.findOne({}, 'passwordUpdatedAt').lean();
    res.json({
      passwordUpdatedAt: settings?.passwordUpdatedAt ? new Date(settings.passwordUpdatedAt).toISOString() : null,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMasterPasswordHash(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await Settings.findOne({}, 'masterPasswordHash passwordUpdatedAt').lean();
    const hash = settings?.masterPasswordHash || null;
    res.json({ 
      hash, 
      passwordUpdatedAt: settings?.passwordUpdatedAt ? new Date(settings.passwordUpdatedAt).toISOString() : null 
    });
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

    const settings = await Settings.findOne({}, 'masterPasswordHash passwordUpdatedAt').lean();
    const passwordUpdatedAt = settings?.passwordUpdatedAt ? new Date(settings.passwordUpdatedAt).toISOString() : null;

    if (settings && settings.masterPasswordHash) {
      const valid = settings.masterPasswordHash === inputHash;
      res.json({ valid, passwordUpdatedAt: valid ? passwordUpdatedAt : null });
      return;
    }

    const initialDefaultPassword = process.env.INITIAL_MASTER_PASSWORD;
    const isDefault = initialDefaultPassword ? hashMasterPassword(initialDefaultPassword) === inputHash : false;
    res.json({ valid: isDefault, passwordUpdatedAt });
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

    const newHash = hashMasterPassword(newPassword);
    const updatedAt = new Date();
    settings.masterPasswordHash = newHash;
    settings.passwordUpdatedAt = updatedAt;
    await settings.save();

    res.json({
      success: true,
      message: 'Master application password updated successfully',
      passwordUpdatedAt: updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
