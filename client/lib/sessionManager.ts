export interface SecurityConfig {
  password?: string;
  timeoutMs: number;
}

export interface SessionStatus {
  isLocked: boolean;
  isTimedOut: boolean;
  remainingMs: number;
  reason: 'timeout' | 'manual' | null;
}

export const STORAGE_KEYS = {
  APP_LOCKED: 'isAppLocked',
  LAST_ACTIVE: 'lastActiveTime',
  SESSION_EXPIRES: 'sessionExpiresAt',
  LOCK_REASON: 'lockReason',
  SECURITY_CONFIG: 'securityConfig',
  SESSION_TOKEN: 'sessionAuthToken',
  LOCKED_RETURN_URL: 'lockedReturnUrl',
} as const;

export const DEFAULT_TIMEOUT_MS = 300000; // 5 minutes
export const DEFAULT_PASSWORD = 'Sun123@';
const BROADCAST_CHANNEL_NAME = 'tasksmanager_session_sync';

// Returns configured password and inactivity timeout duration
export function getSecurityConfig(): SecurityConfig {
  if (typeof window === 'undefined') {
    return { password: DEFAULT_PASSWORD, timeoutMs: DEFAULT_TIMEOUT_MS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECURITY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      const timeoutMs = Number(parsed.timeoutMs);
      return {
        password: parsed.password || DEFAULT_PASSWORD,
        timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
      };
    }
  } catch {}
  return { password: DEFAULT_PASSWORD, timeoutMs: DEFAULT_TIMEOUT_MS };
}

// Evaluates timestamp deadline against current time without depending on active timers
export function getSessionStatus(isPublicRoute: boolean = false): SessionStatus {
  if (isPublicRoute || typeof window === 'undefined') {
    return { isLocked: false, isTimedOut: false, remainingMs: Infinity, reason: null };
  }

  const lockedFlag = localStorage.getItem(STORAGE_KEYS.APP_LOCKED);
  const rawReason = localStorage.getItem(STORAGE_KEYS.LOCK_REASON);
  const reason = rawReason === 'timeout' || rawReason === 'manual' ? rawReason : null;

  if (lockedFlag === 'true') {
    return {
      isLocked: true,
      isTimedOut: reason === 'timeout',
      remainingMs: 0,
      reason: reason || 'manual',
    };
  }

  const { timeoutMs } = getSecurityConfig();
  const rawLastActive = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
  const rawExpiresAt = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES);

  // If no activity has ever been recorded, treat as locked initial state
  if (!rawLastActive && !rawExpiresAt) {
    return { isLocked: true, isTimedOut: false, remainingMs: 0, reason: 'manual' };
  }

  const now = Date.now();
  const lastActive = rawLastActive ? parseInt(rawLastActive, 10) : NaN;

  // Protect against backward clock tampering: if system time jumped back by > 1 minute
  if (!isNaN(lastActive) && now < lastActive - 60000) {
    lockSession('timeout');
    return { isLocked: true, isTimedOut: true, remainingMs: 0, reason: 'timeout' };
  }

  // Derive target expiration deadline
  let expiresAt = rawExpiresAt ? parseInt(rawExpiresAt, 10) : NaN;
  if (isNaN(expiresAt)) {
    expiresAt = (!isNaN(lastActive) ? lastActive : now) + timeoutMs;
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES, expiresAt.toString());
    } catch {}
  }

  // Session has reached or exceeded its deadline
  if (now >= expiresAt) {
    lockSession('timeout');
    return { isLocked: true, isTimedOut: true, remainingMs: 0, reason: 'timeout' };
  }

  return {
    isLocked: false,
    isTimedOut: false,
    remainingMs: Math.max(0, expiresAt - now),
    reason: null,
  };
}

// Updates session timestamps in storage
export function persistActivityTimestamps(now: number = Date.now()): void {
  if (typeof window === 'undefined') return;
  try {
    const { timeoutMs } = getSecurityConfig();
    const expiresAt = now + timeoutMs;
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, now.toString());
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES, expiresAt.toString());
  } catch {}
}

// Locks workspace immediately and clears session auth token
export function lockSession(reason: 'timeout' | 'manual', returnUrl?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.APP_LOCKED, 'true');
    localStorage.setItem(STORAGE_KEYS.LOCK_REASON, reason);
    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);

    if (returnUrl && returnUrl !== '/' && !sessionStorage.getItem(STORAGE_KEYS.LOCKED_RETURN_URL)) {
      sessionStorage.setItem(STORAGE_KEYS.LOCKED_RETURN_URL, returnUrl);
    }
  } catch {}

  broadcastSessionEvent(reason === 'timeout' ? 'timeout' : 'lock');
}

// Unlocks workspace and issues a fresh session authorization token
export function unlockSession(updatedPassword?: string): string {
  if (typeof window === 'undefined') return '';
  const now = Date.now();
  const { timeoutMs } = getSecurityConfig();
  const expiresAt = now + timeoutMs;
  const token = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tok_${now}_${Math.random().toString(36).slice(2, 10)}`;

  try {
    localStorage.setItem(STORAGE_KEYS.APP_LOCKED, 'false');
    localStorage.setItem(STORAGE_KEYS.LOCK_REASON, '');
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, now.toString());
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES, expiresAt.toString());
    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);

    if (updatedPassword) {
      const config = getSecurityConfig();
      config.password = updatedPassword;
      localStorage.setItem(STORAGE_KEYS.SECURITY_CONFIG, JSON.stringify(config));
    }
  } catch {}

  broadcastSessionEvent('unlock');
  return token;
}

// Broadcasts session lifecycle changes across tabs using BroadcastChannel with storage fallback
export function broadcastSessionEvent(type: 'lock' | 'unlock' | 'activity' | 'timeout'): void {
  if (typeof window === 'undefined') return;
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type, timestamp: Date.now() });
      channel.close();
    }
  } catch {}
  window.dispatchEvent(new Event('storage'));
}

// Subscribes to cross-tab session synchronization events
export function subscribeToSessionEvents(onEvent: (type: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let channel: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type) {
          onEvent(event.data.type);
        }
      };
    } catch {}
  }

  const handleStorage = (event: StorageEvent) => {
    const key = event.key;
    if (
      !key ||
      key === STORAGE_KEYS.APP_LOCKED ||
      key === STORAGE_KEYS.SESSION_EXPIRES ||
      key === STORAGE_KEYS.LOCK_REASON ||
      key === STORAGE_KEYS.SECURITY_CONFIG ||
      key === STORAGE_KEYS.LAST_ACTIVE
    ) {
      onEvent('storage');
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) {
      try {
        channel.close();
      } catch {}
    }
    window.removeEventListener('storage', handleStorage);
  };
}

// Helper for defense-in-depth API protection
export function isSessionActive(): boolean {
  return !getSessionStatus().isLocked;
}
