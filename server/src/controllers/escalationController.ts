import { Request, Response, NextFunction } from 'express';
import EscalationSettings from '../models/EscalationSettings';

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (/[\r\n]/.test(email)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function sanitizeRecipients(list: any): { email: string; tag: string }[] {
  if (!Array.isArray(list)) return [];
  const results: { email: string; tag: string }[] = [];
  for (const item of list) {
    if (!item) continue;
    const email = typeof item.email === 'string' ? item.email.trim() : '';
    const tag = typeof item.tag === 'string' && item.tag.trim() ? item.tag.trim() : 'Member';
    if (email) {
      results.push({ email, tag });
    }
  }
  return results;
}

// Get singleton escalation settings
export async function getEscalationSettings(req: Request, res: Response, next: NextFunction) {
  try {
    let settings = await EscalationSettings.findOne();
    if (!settings) {
      settings = new EscalationSettings();
      await settings.save();
    }

    // Auto-populate toRecipients if empty and legacy fields exist
    if (
      (!settings.toRecipients || settings.toRecipients.length === 0) &&
      (settings.managerEmail || settings.hodEmail || settings.dyhodEmail)
    ) {
      const initialTo: { email: string; tag: string }[] = [];
      if (settings.managerEmail) initialTo.push({ email: settings.managerEmail, tag: 'Manager' });
      if (settings.hodEmail) initialTo.push({ email: settings.hodEmail, tag: 'HOD' });
      if (settings.dyhodEmail) initialTo.push({ email: settings.dyhodEmail, tag: 'Dy.HOD' });
      settings.toRecipients = initialTo;
    }

    if ((!settings.ccRecipients || settings.ccRecipients.length === 0) && settings.ccEmail) {
      settings.ccRecipients = settings.ccEmail
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
        .map((email) => ({ email, tag: 'CC' }));
    }

    res.json(settings);
  } catch (err) {
    next(err);
  }
}

// Update escalation settings
export async function updateEscalationSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      threshold,
      enabled,
      toRecipients,
      ccRecipients,
      bccRecipients,
      managerEmail,
      hodEmail,
      dyhodEmail,
      ccEmail,
    } = req.body;

    let settings = await EscalationSettings.findOne();
    if (!settings) {
      settings = new EscalationSettings();
    }

    if (typeof threshold === 'number') {
      settings.threshold = Math.max(1, Math.min(50, Math.floor(threshold)));
    }

    const isEnabled = typeof enabled === 'boolean' ? enabled : settings.enabled;
    settings.enabled = isEnabled;

    // Process toRecipients
    let parsedTo: { email: string; tag: string }[] = [];
    if (toRecipients !== undefined) {
      parsedTo = sanitizeRecipients(toRecipients);
      for (const item of parsedTo) {
        if (!isValidEmail(item.email)) {
          res.status(400).json({ error: `Invalid email address in TO list: ${item.email}` });
          return;
        }
      }
      settings.toRecipients = parsedTo;
    } else {
      parsedTo = settings.toRecipients || [];
    }

    // Process ccRecipients
    let parsedCc: { email: string; tag: string }[] = [];
    if (ccRecipients !== undefined) {
      parsedCc = sanitizeRecipients(ccRecipients);
      for (const item of parsedCc) {
        if (!isValidEmail(item.email)) {
          res.status(400).json({ error: `Invalid email address in CC list: ${item.email}` });
          return;
        }
      }
      settings.ccRecipients = parsedCc;
    } else {
      parsedCc = settings.ccRecipients || [];
    }

    // Process bccRecipients
    let parsedBcc: { email: string; tag: string }[] = [];
    if (bccRecipients !== undefined) {
      parsedBcc = sanitizeRecipients(bccRecipients);
      for (const item of parsedBcc) {
        if (!isValidEmail(item.email)) {
          res.status(400).json({ error: `Invalid email address in BCC list: ${item.email}` });
          return;
        }
      }
      settings.bccRecipients = parsedBcc;
    } else {
      parsedBcc = settings.bccRecipients || [];
    }

    // Validation: At least one primary recipient (Manager, HOD, or Dy.HOD) in TO when enabled
    if (isEnabled) {
      const hasAnyTo = parsedTo.length > 0;
      const hasLegacyTo = Boolean(managerEmail?.trim() || hodEmail?.trim() || dyhodEmail?.trim());

      if (!hasAnyTo && !hasLegacyTo) {
        res.status(400).json({
          error: 'Please fill at least one primary recipient (Manager, HOD, or Dy.HOD) in TO when automatic escalation is enabled.',
        });
        return;
      }
    }

    // Keep legacy single-field values synchronized for backward compatibility
    if (toRecipients !== undefined) {
      const mgr = parsedTo.find((r) => /manager/i.test(r.tag))?.email || '';
      const hod = parsedTo.find((r) => /^hod$/i.test(r.tag) || (/\bhod\b/i.test(r.tag) && !/dy/i.test(r.tag)))?.email || '';
      const dyhod = parsedTo.find((r) => /dy.*hod|deputy/i.test(r.tag))?.email || '';

      settings.managerEmail = mgr || (parsedTo[0]?.email || '');
      settings.hodEmail = hod;
      settings.dyhodEmail = dyhod;
    } else {
      if (typeof managerEmail === 'string') settings.managerEmail = managerEmail.trim();
      if (typeof hodEmail === 'string') settings.hodEmail = hodEmail.trim();
      if (typeof dyhodEmail === 'string') settings.dyhodEmail = dyhodEmail.trim();
    }

    if (ccRecipients !== undefined) {
      settings.ccEmail = parsedCc.map((r) => r.email).join(', ');
    } else if (typeof ccEmail === 'string') {
      settings.ccEmail = ccEmail.trim();
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    next(err);
  }
}
