export interface SecurityConfig {
  timeoutMs: number;
  maxSessionMs: number;
}

export interface SessionStatus {
  isLocked: boolean;
  isTimedOut: boolean;
  remainingInactivityMs: number;
  remainingMaxSessionMs: number;
  remainingMs: number;
  reason: 'timeout' | 'manual' | 'max_duration' | null;
}

export interface TimeoutOption {
  value: number;
  label: string;
}

export const TIMEOUT_OPTIONS: TimeoutOption[] = [
  { value: 300000, label: '5 minutes' },
  { value: 600000, label: '10 minutes' },
  { value: 900000, label: '15 minutes (Default)' },
  { value: 1800000, label: '30 minutes' },
  { value: 3600000, label: '1 hour' },
  { value: 0, label: 'Never' },
];

export const STORAGE_KEYS = {
  APP_LOCKED: 'isAppLocked',
  LAST_ACTIVE: 'lastActiveTime',
  SESSION_EXPIRES: 'sessionExpiresAt',
  LOGIN_TIME: 'sessionLoginTime',
  LOCK_REASON: 'lockReason',
  SECURITY_CONFIG: 'securityConfig',
  SESSION_TOKEN: 'sessionAuthToken',
  LOCKED_RETURN_URL: 'lockedReturnUrl',
  VISIT_ACTIVE: 'tasksmanager_visit_active',
  PASSWORD_UPDATED_AT: 'sessionPasswordUpdatedAt',
} as const;

export const DEFAULT_TIMEOUT_MS = 900000; // 15 minutes
export const DEFAULT_MAX_SESSION_MS = 3600000; // 1 hour
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

export function getSecurityConfig(): SecurityConfig {
  if (typeof window === 'undefined') {
    return { timeoutMs: DEFAULT_TIMEOUT_MS, maxSessionMs: DEFAULT_MAX_SESSION_MS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECURITY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.password) {
        delete parsed.password;
        try {
          localStorage.setItem(STORAGE_KEYS.SECURITY_CONFIG, JSON.stringify(parsed));
        } catch {}
      }
      const timeoutMs = Number(parsed.timeoutMs);
      const validTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs >= 0 ? timeoutMs : DEFAULT_TIMEOUT_MS;

      let maxSessionMs: number;
      if (validTimeoutMs === 0) {
        maxSessionMs = 0; // Never mode applies across session limits
      } else if (Number.isFinite(Number(parsed.maxSessionMs)) && Number(parsed.maxSessionMs) > 0) {
        maxSessionMs = Number(parsed.maxSessionMs);
      } else {
        // Standard maximum session duration: 3x inactivity timeout (e.g. 10m -> 30m, 15m -> 45m/1h)
        maxSessionMs = Math.max(validTimeoutMs * 3, getMaxAvailableTimeout());
      }

      return {
        timeoutMs: validTimeoutMs,
        maxSessionMs,
      };
    }
  } catch {}
  return { timeoutMs: DEFAULT_TIMEOUT_MS, maxSessionMs: DEFAULT_MAX_SESSION_MS };
}

export function getSessionStatus(isPublicRoute: boolean = false): SessionStatus {
  if (isPublicRoute || typeof window === 'undefined') {
    return {
      isLocked: false,
      isTimedOut: false,
      remainingInactivityMs: Infinity,
      remainingMaxSessionMs: Infinity,
      remainingMs: Infinity,
      reason: null,
    };
  }

  const rawLastActive = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
  const rawLoginTime = localStorage.getItem(STORAGE_KEYS.LOGIN_TIME);
  const rawExpiresAt = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES);
  const lockedFlag = localStorage.getItem(STORAGE_KEYS.APP_LOCKED);
  const rawReason = localStorage.getItem(STORAGE_KEYS.LOCK_REASON);
  const token = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);

  // Uninitialized session without prior activity or explicit unlocked flag defaults to main Password Gate
  if (lockedFlag === null || (!rawLastActive && lockedFlag !== 'false') || (!token && lockedFlag !== 'false')) {
    return {
      isLocked: true,
      isTimedOut: false,
      remainingInactivityMs: 0,
      remainingMaxSessionMs: 0,
      remainingMs: 0,
      reason: 'manual',
    };
  }

  const now = Date.now();
  const { timeoutMs, maxSessionMs } = getSecurityConfig();

  const lastActive = rawLastActive ? parseInt(rawLastActive, 10) : NaN;
  let loginTime = rawLoginTime ? parseInt(rawLoginTime, 10) : NaN;
  if (isNaN(loginTime)) {
    loginTime = !isNaN(lastActive) ? lastActive : now;
    try {
      localStorage.setItem(STORAGE_KEYS.LOGIN_TIME, loginTime.toString());
    } catch {}
  }

  // Stage 2: Check Maximum Session Duration
  const isMaxSessionExpired = maxSessionMs > 0 && now - loginTime >= maxSessionMs;

  if (isMaxSessionExpired) {
    lockSession('max_duration');
    return {
      isLocked: true,
      isTimedOut: false,
      remainingInactivityMs: 0,
      remainingMaxSessionMs: 0,
      remainingMs: 0,
      reason: 'max_duration',
    };
  }

  const remainingMaxSessionMs = maxSessionMs > 0 ? Math.max(0, maxSessionMs - (now - loginTime)) : Infinity;

  // Handle explicitly locked or timed out states
  if (lockedFlag === 'true') {
    if (rawReason === 'timeout') {
      // Inactivity timeout page (Stage 1) - user can enter passcode to continue before max duration
      return {
        isLocked: true,
        isTimedOut: true,
        remainingInactivityMs: 0,
        remainingMaxSessionMs,
        remainingMs: remainingMaxSessionMs,
        reason: 'timeout',
      };
    }

    // Main Password Gate
    return {
      isLocked: true,
      isTimedOut: false,
      remainingInactivityMs: 0,
      remainingMaxSessionMs: 0,
      remainingMs: 0,
      reason: rawReason === 'max_duration' ? 'max_duration' : 'manual',
    };
  }

  // "Never" timeout mode: active session never expires due to inactivity
  if (timeoutMs === 0) {
    return {
      isLocked: false,
      isTimedOut: false,
      remainingInactivityMs: Infinity,
      remainingMaxSessionMs,
      remainingMs: remainingMaxSessionMs,
      reason: null,
    };
  }

  if (isNaN(lastActive)) {
    return {
      isLocked: true,
      isTimedOut: false,
      remainingInactivityMs: 0,
      remainingMaxSessionMs: 0,
      remainingMs: 0,
      reason: 'manual',
    };
  }

  let expiresAt = rawExpiresAt ? parseInt(rawExpiresAt, 10) : NaN;
  if (isNaN(expiresAt)) {
    expiresAt = lastActive + timeoutMs;
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES, expiresAt.toString());
    } catch {}
  }

  // Stage 1: Check Inactivity Timeout
  if (now >= expiresAt || now - lastActive >= timeoutMs) {
    lockSession('timeout');
    return {
      isLocked: true,
      isTimedOut: true,
      remainingInactivityMs: 0,
      remainingMaxSessionMs,
      remainingMs: remainingMaxSessionMs,
      reason: 'timeout',
    };
  }

  const remainingInactivityMs = Math.max(0, expiresAt - now);
  const effectiveRemainingMs = Math.min(remainingInactivityMs, remainingMaxSessionMs);

  return {
    isLocked: false,
    isTimedOut: false,
    remainingInactivityMs,
    remainingMaxSessionMs,
    remainingMs: effectiveRemainingMs,
    reason: null,
  };
}

export function persistActivityTimestamps(now: number = Date.now()): void {
  if (typeof window === 'undefined') return;
  try {
    const lockedFlag = localStorage.getItem(STORAGE_KEYS.APP_LOCKED);
    if (lockedFlag === 'true') return;

    const { timeoutMs } = getSecurityConfig();
    const expiresAt = timeoutMs > 0 ? now + timeoutMs : Infinity;
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, now.toString());
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES, expiresAt.toString());
  } catch {}
}

export function lockSession(reason: 'timeout' | 'manual' | 'max_duration', returnUrl?: string): void {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);

  try {
    localStorage.setItem(STORAGE_KEYS.APP_LOCKED, 'true');
    localStorage.setItem(STORAGE_KEYS.LOCK_REASON, reason);

    if (reason === 'manual' || reason === 'max_duration') {
      localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.PASSWORD_UPDATED_AT);
      localStorage.removeItem(STORAGE_KEYS.LOGIN_TIME);
    }

    if (returnUrl && returnUrl !== '/' && !sessionStorage.getItem(STORAGE_KEYS.LOCKED_RETURN_URL)) {
      sessionStorage.setItem(STORAGE_KEYS.LOCKED_RETURN_URL, returnUrl);
    }
  } catch {}

  // Notify backend in background for audit tracking
  try {
    const endpoint = reason === 'timeout'
      ? '/api/settings/session-timeout'
      : '/api/settings/logout';

    const reasonLabel = reason === 'timeout'
      ? 'Session Timeout'
      : reason === 'max_duration'
        ? 'Maximum Session Duration Reached'
        : 'Manual Logout';

    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    const apiBase = rawApiUrl && (rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://'))
      ? rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '')
      : '';
    const fullEndpoint = `${apiBase}${endpoint}`;

    if (navigator.sendBeacon) {
      const data = JSON.stringify({ sessionToken: token, reason: reasonLabel });
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(fullEndpoint, blob);
    } else {
      fetch(fullEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-session-token': token } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ sessionToken: token, reason: reasonLabel }),
      }).catch(() => {});
    }
  } catch {}

  broadcastSessionEvent(reason === 'timeout' ? 'timeout' : 'lock');
}

export function unlockSession(
  passwordUpdatedAt?: string | null,
  customToken?: string | null,
  isResume: boolean = false
): string {
  if (typeof window === 'undefined') return '';
  const now = Date.now();
  const { timeoutMs } = getSecurityConfig();
  const expiresAt = timeoutMs > 0 ? now + timeoutMs : Infinity;
  const token = customToken || localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN) || '';

  try {
    localStorage.setItem(STORAGE_KEYS.APP_LOCKED, 'false');
    localStorage.setItem(STORAGE_KEYS.LOCK_REASON, '');
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, now.toString());
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES, expiresAt.toString());
    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);

    // Only fresh logins establish a new session login timestamp.
    // Continuing from Session Timeout preserves the original login timestamp.
    if (!isResume || !localStorage.getItem(STORAGE_KEYS.LOGIN_TIME)) {
      localStorage.setItem(STORAGE_KEYS.LOGIN_TIME, now.toString());
    }

    if (passwordUpdatedAt) {
      localStorage.setItem(STORAGE_KEYS.PASSWORD_UPDATED_AT, passwordUpdatedAt);
    }
  } catch {}

  broadcastSessionEvent('unlock');
  return token;
}

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
      key === STORAGE_KEYS.LOGIN_TIME ||
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

export function isSessionActive(): boolean {
  return !getSessionStatus().isLocked;
}
