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

export interface TimeoutOption {
  value: number;
  label: string;
}

export const TIMEOUT_OPTIONS: TimeoutOption[] = [
  { value: 300000, label: '5 minutes (Default)' },
  { value: 600000, label: '10 minutes' },
  { value: 900000, label: '15 minutes' },
  { value: 1800000, label: '30 minutes' },
  { value: 3600000, label: '1 hour' },
  { value: 7200000, label: '2 hours' },
  { value: 86400000, label: '1 day' },
  { value: 0, label: 'Never' },
];

export const STORAGE_KEYS = {
  APP_LOCKED: 'isAppLocked',
  LAST_ACTIVE: 'lastActiveTime',
  SESSION_EXPIRES: 'sessionExpiresAt',
  LOCK_REASON: 'lockReason',
  SECURITY_CONFIG: 'securityConfig',
  SESSION_TOKEN: 'sessionAuthToken',
  LOCKED_RETURN_URL: 'lockedReturnUrl',
  VISIT_ACTIVE: 'tasksmanager_visit_active',
} as const;

export const DEFAULT_TIMEOUT_MS = 300000; // 5 minutes
export const DEFAULT_PASSWORD = 'Sun123@';
const BROADCAST_CHANNEL_NAME = 'tasksmanager_session_sync';

export function getMaxAvailableTimeout(): number {
  return Math.max(...TIMEOUT_OPTIONS.map((opt) => opt.value));
}

export function formatTimeoutDuration(ms: number): string {
  if (ms <= 0) return 'Never';
  const minutes = Math.round(ms / 60000);
  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440);
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  if (minutes >= 60) {
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

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
        timeoutMs: Number.isFinite(timeoutMs) && timeoutMs >= 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
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

  const rawLastActive = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
  const rawExpiresAt = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES);
  const lockedFlag = localStorage.getItem(STORAGE_KEYS.APP_LOCKED);
  const rawReason = localStorage.getItem(STORAGE_KEYS.LOCK_REASON);
  const reason = rawReason === 'timeout' || rawReason === 'manual' ? rawReason : null;

  // Uninitialized session without prior activity defaults to locked workspace
  if (!rawLastActive && !rawExpiresAt) {
    return { isLocked: true, isTimedOut: false, remainingMs: 0, reason: 'manual' };
  }

  const now = Date.now();
  const lastActive = rawLastActive ? parseInt(rawLastActive, 10) : NaN;
  const elapsedSinceActive = !isNaN(lastActive) ? now - lastActive : Infinity;

  // Support fresh initialization from programmatic unlocks and automated test runs
  const rawVisitActive = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.VISIT_ACTIVE) : null;
  let isVisitActive = rawVisitActive === 'true';
  if (!isVisitActive && lockedFlag === 'false' && !isNaN(lastActive) && now - lastActive < 10000) {
    isVisitActive = true;
    try {
      sessionStorage.setItem(STORAGE_KEYS.VISIT_ACTIVE, 'true');
    } catch {}
  }

  // Guard against backward system clock skew
  if (!isNaN(lastActive) && now < lastActive - 60000) {
    lockSession('manual');
    return { isLocked: true, isTimedOut: false, remainingMs: 0, reason: 'manual' };
  }

  // Real new browser visit without active visit authorization requires 1-time passcode
  if (!isVisitActive) {
    return {
      isLocked: true,
      isTimedOut: false,
      remainingMs: 0,
      reason: 'manual',
    };
  }

  // User explicitly locked or logged out
  if (lockedFlag === 'true' && reason === 'manual') {
    return {
      isLocked: true,
      isTimedOut: false,
      remainingMs: 0,
      reason: 'manual',
    };
  }

  const { timeoutMs } = getSecurityConfig();

  // "Never" timeout mode: active session never experiences inactivity pause
  if (timeoutMs === 0) {
    return {
      isLocked: false,
      isTimedOut: false,
      remainingMs: Infinity,
      reason: null,
    };
  }

  const maxTimeout = getMaxAvailableTimeout();
  const isPastMax = elapsedSinceActive >= maxTimeout;

  if (lockedFlag === 'true') {
    const isTimeoutModal = reason === 'timeout' && !isPastMax;
    const remainingToMax = Math.max(0, maxTimeout - elapsedSinceActive);
    return {
      isLocked: true,
      isTimedOut: isTimeoutModal,
      remainingMs: isTimeoutModal ? remainingToMax : 0,
      reason: reason || 'manual',
    };
  }

  let expiresAt = rawExpiresAt ? parseInt(rawExpiresAt, 10) : NaN;
  if (isNaN(expiresAt)) {
    expiresAt = (!isNaN(lastActive) ? lastActive : now) + timeoutMs;
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES, expiresAt.toString());
    } catch {}
  }

  if (now >= expiresAt || isPastMax) {
    lockSession('timeout');
    const isTimeoutModal = !isPastMax;
    const remainingToMax = Math.max(0, maxTimeout - elapsedSinceActive);
    return {
      isLocked: true,
      isTimedOut: isTimeoutModal,
      remainingMs: isTimeoutModal ? remainingToMax : 0,
      reason: 'timeout',
    };
  }

  const remainingToInactivity = Math.max(0, expiresAt - now);
  const remainingToMax = Math.max(0, maxTimeout - elapsedSinceActive);

  return {
    isLocked: false,
    isTimedOut: false,
    remainingMs: Math.min(remainingToInactivity, remainingToMax),
    reason: null,
  };
}

// Updates session timestamps in storage
export function persistActivityTimestamps(now: number = Date.now()): void {
  if (typeof window === 'undefined') return;
  try {
    const { timeoutMs } = getSecurityConfig();
    const expiresAt = timeoutMs > 0 ? now + timeoutMs : Infinity;
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

    if (reason === 'manual') {
      sessionStorage.removeItem(STORAGE_KEYS.VISIT_ACTIVE);
    }

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
  const expiresAt = timeoutMs > 0 ? now + timeoutMs : Infinity;
  const token = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tok_${now}_${Math.random().toString(36).slice(2, 10)}`;

  try {
    sessionStorage.setItem(STORAGE_KEYS.VISIT_ACTIVE, 'true');
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
          if (event.data.type === 'unlock') {
            try {
              sessionStorage.setItem(STORAGE_KEYS.VISIT_ACTIVE, 'true');
            } catch {}
          } else if (event.data.type === 'lock') {
            try {
              sessionStorage.removeItem(STORAGE_KEYS.VISIT_ACTIVE);
            } catch {}
          }
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
