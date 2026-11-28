import crypto from 'crypto';

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

const ipAttemptStore = new Map<string, AttemptRecord>();

// Clean up stale attempt records periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipAttemptStore.entries()) {
    if (record.lockedUntil && now > record.lockedUntil) {
      ipAttemptStore.delete(ip);
    } else if (!record.lockedUntil && now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
      ipAttemptStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export function checkBruteForceLock(ip: string): { isLocked: boolean; remainingSeconds: number } {
  const now = Date.now();
  const record = ipAttemptStore.get(ip);
  if (!record || !record.lockedUntil) {
    return { isLocked: false, remainingSeconds: 0 };
  }

  if (now >= record.lockedUntil) {
    ipAttemptStore.delete(ip);
    return { isLocked: false, remainingSeconds: 0 };
  }

  const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
  return { isLocked: true, remainingSeconds };
}

export function recordFailedAttempt(ip: string): { isLocked: boolean; remainingAttempts: number; lockoutSeconds: number } {
  const now = Date.now();
  let record = ipAttemptStore.get(ip);

  if (!record || now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    record = { count: 1, firstAttemptAt: now, lockedUntil: null };
  } else {
    record.count += 1;
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    ipAttemptStore.set(ip, record);
    return { isLocked: true, remainingAttempts: 0, lockoutSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
  }

  ipAttemptStore.set(ip, record);
  return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - record.count, lockoutSeconds: 0 };
}

export function resetFailedAttempts(ip: string): void {
  ipAttemptStore.delete(ip);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password.trim(), salt, 64).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  const trimmed = password.trim();

  // Modern scrypt verification
  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, expectedKey] = parts;
    const derivedKey = crypto.scryptSync(trimmed, salt, 64).toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(derivedKey, 'hex'), Buffer.from(expectedKey, 'hex'));
    } catch {
      return false;
    }
  }

  // Legacy SHA-256 fallback compatibility
  const legacyHash = crypto.createHash('sha256').update(`tasksmanager_salt_${trimmed}`).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(legacyHash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return legacyHash === storedHash;
  }
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return false;
  try {
    const { hostname } = new URL(origin);
    if (
      allowedOrigins.includes(origin) ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.vercel.app')
    ) {
      return true;
    }
  } catch {}
  return false;
}

export function getSessionCookieOptions(maxAge?: number) {
  const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    ...(typeof maxAge === 'number' && maxAge > 0 ? { maxAge } : {}),
  };
}

