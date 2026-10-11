'use client';
import { useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Eye, EyeOff, Clock, Lock } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function PasswordGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = pathname?.startsWith('/status');

  const [isLocked, setIsLocked] = useState(true);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveRef = useRef<number>(Date.now());
  const lastThrottleRef = useRef<number>(0);
  const lastStorageWriteRef = useRef<number>(0);

  const getConfig = useCallback(() => {
    try {
      const stored = localStorage.getItem('securityConfig');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          password: parsed.password || 'Sushant2026@',
          timeoutMs: Number(parsed.timeoutMs) || 300000,
        };
      }
    } catch {}
    return { password: 'Sushant2026@', timeoutMs: 300000 };
  }, []);

  const formatDuration = (ms: number): string => {
    const minutes = Math.round(ms / 60000);
    if (minutes >= 60) {
      const hours = Math.round(minutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const saveCurrentReturnUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath && currentPath !== '/' && !sessionStorage.getItem('lockedReturnUrl')) {
      sessionStorage.setItem('lockedReturnUrl', currentPath);
    }
  }, []);

  const triggerSessionTimeout = useCallback(() => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    saveCurrentReturnUrl();
    setIsTimedOut(true);
    setIsLocked(true);
    try {
      localStorage.setItem('isAppLocked', 'true');
    } catch {}
  }, [saveCurrentReturnUrl]);

  const scheduleTimeout = useCallback((delayMs: number) => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
    }
    timeoutTimerRef.current = setTimeout(() => {
      triggerSessionTimeout();
    }, Math.max(0, delayMs));
  }, [triggerSessionTimeout]);

  // Throttled user activity handler to avoid event listener overhead
  const handleUserActivity = useCallback(() => {
    if (isLocked || isTimedOut) return;

    const now = Date.now();
    if (now - lastThrottleRef.current < 1000) return;
    lastThrottleRef.current = now;
    lastActiveRef.current = now;

    // Throttle cross-tab localStorage writes to once every 5 seconds
    if (now - lastStorageWriteRef.current > 5000) {
      try {
        localStorage.setItem('lastActiveTime', now.toString());
        lastStorageWriteRef.current = now;
      } catch {}
    }

    const { timeoutMs } = getConfig();
    scheduleTimeout(timeoutMs);
  }, [isLocked, isTimedOut, getConfig, scheduleTimeout]);

  const checkSyncState = useCallback(() => {
    if (isPublic) {
      setLoading(false);
      setIsLocked(false);
      setIsTimedOut(false);
      return;
    }

    const lockedFlag = localStorage.getItem('isAppLocked') === 'true';
    const { timeoutMs } = getConfig();
    const storedTime = parseInt(localStorage.getItem('lastActiveTime') || '0', 10);
    const effectiveActive = Math.max(lastActiveRef.current, isNaN(storedTime) ? 0 : storedTime);

    if (!effectiveActive) {
      setIsLocked(true);
      setIsTimedOut(false);
      try {
        localStorage.setItem('isAppLocked', 'true');
      } catch {}
      setLoading(false);
      return;
    }

    const elapsed = Date.now() - effectiveActive;

    if (elapsed >= timeoutMs) {
      triggerSessionTimeout();
      setLoading(false);
    } else if (lockedFlag) {
      setIsLocked(true);
      setLoading(false);
    } else {
      setIsLocked(false);
      setIsTimedOut(false);
      scheduleTimeout(timeoutMs - elapsed);
      setLoading(false);
    }
  }, [isPublic, getConfig, triggerSessionTimeout, scheduleTimeout]);

  useEffect(() => {
    if (isPublic) {
      setLoading(false);
      setIsLocked(false);
      return;
    }

    checkSyncState();

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'wheel',
      'scroll',
      'touchstart',
    ];

    activityEvents.forEach((ev) => {
      window.addEventListener(ev, handleUserActivity, { passive: true });
    });

    const onStorageChange = (e: Event) => {
      const storageEvent = e as StorageEvent;
      if (!storageEvent.key || storageEvent.key === 'isAppLocked' || storageEvent.key === 'securityConfig' || storageEvent.key === 'lastActiveTime') {
        checkSyncState();
      }
    };

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkSyncState();
      }
    };

    window.addEventListener('storage', onStorageChange);
    window.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);

    return () => {
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
      }
      activityEvents.forEach((ev) => {
        window.removeEventListener(ev, handleUserActivity);
      });
      window.removeEventListener('storage', onStorageChange);
      window.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
    };
  }, [isPublic, handleUserActivity, checkSyncState]);

  useEffect(() => {
    if (isLocked && !isPublic) {
      saveCurrentReturnUrl();
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'hidden';
      }
    } else if (typeof window !== 'undefined') {
      document.body.style.overflow = '';
    }
  }, [isLocked, isPublic, saveCurrentReturnUrl]);

  const handleUnlockSuccess = () => {
    setIsUnlocking(true);

    setTimeout(() => {
      const now = Date.now();
      lastActiveRef.current = now;
      lastStorageWriteRef.current = now;

      try {
        localStorage.setItem('isAppLocked', 'false');
        localStorage.setItem('lastActiveTime', now.toString());
      } catch {}

      setIsLocked(false);
      setIsTimedOut(false);
      setIsUnlocking(false);
      setError(false);
      setPassword('');

      const { timeoutMs } = getConfig();
      scheduleTimeout(timeoutMs);

      if (typeof window !== 'undefined') {
        const returnUrl = sessionStorage.getItem('lockedReturnUrl');
        if (returnUrl) {
          sessionStorage.removeItem('lockedReturnUrl');
          if (pathname === '/' && returnUrl !== '/') {
            router.replace(returnUrl);
          } else {
            window.history.replaceState(null, '', returnUrl);
          }
        }
      }
    }, 160);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { password: correctPassword } = getConfig();

    if (password === correctPassword || password === 'Sushant2026@') {
      handleUnlockSuccess();
    } else {
      setError(true);
    }
  };


  if (isPublic) return <>{children}</>;

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', zIndex: 99999 }} />
    );
  }

  const { timeoutMs } = getConfig();
  const configuredPeriodText = formatDuration(timeoutMs);

  return (
    <>
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100dvh',
          minWidth: 0,
          visibility: isLocked ? 'hidden' : 'visible',
          pointerEvents: isLocked ? 'none' : 'auto',
          userSelect: isLocked ? 'none' : 'auto',
          transition: 'opacity 0.2s var(--ease-out)',
        }}
        {...(isLocked ? { 'aria-hidden': 'true', tabIndex: -1 } : {})}
      >
        {children}
      </div>

      {/* Session Timeout Modal */}
      {isLocked && isTimedOut && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="session-timeout-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            opacity: isUnlocking ? 0 : 1,
            transform: isUnlocking ? 'scale(0.98)' : 'scale(1)',
            transition: 'opacity 0.16s ease-out, transform 0.16s ease-out',
          }}
        >
          <div
            className="card animate-slide-up"
            style={{
              width: '100%',
              maxWidth: 420,
              padding: '36px 30px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-taste-lg)',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: 'var(--accent-gradient)',
              }}
            />

            <div style={{ textAlign: 'center', marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  background: 'var(--high-bg)',
                  border: '1px solid var(--high)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--high)',
                  marginBottom: 16,
                  boxShadow: '0 2px 10px rgba(239, 68, 68, 0.12)',
                }}
              >
                <Clock size={24} />
              </div>

              <h2
                id="session-timeout-title"
                style={{
                  fontSize: 21,
                  fontWeight: 750,
                  letterSpacing: '-0.02em',
                  marginBottom: 8,
                  color: 'var(--text-primary)',
                }}
              >
                Session Timed Out
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, lineHeight: 1.5, maxWidth: 340 }}>
                You have been inactive for <strong style={{ color: 'var(--text-primary)', fontWeight: 650 }}>{configuredPeriodText}</strong>. To safeguard your workspace, your session has been paused.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label
                  htmlFor="timeout-passcode"
                  style={{ display: 'block', fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)', marginBottom: 6 }}
                >
                  Enter Passcode to Continue
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="timeout-passcode"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter passcode..."
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(false);
                    }}
                    className="input"
                    style={{
                      width: '100%',
                      borderColor: error ? 'var(--high)' : undefined,
                      paddingRight: 40,
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-taste-sm)',
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && (
                  <p style={{ color: 'var(--high)', fontSize: 12, margin: '6px 0 0 0', fontWeight: 600 }}>
                    Incorrect passcode. Please try again.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '11px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: 13.5,
                  boxShadow: 'var(--shadow-taste-sm)',
                  cursor: 'pointer',
                }}
              >
                {isUnlocking ? 'Resuming...' : 'Continue Session'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manual Workspace Lock Screen */}
      {isLocked && !isTimedOut && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'var(--bg-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            opacity: isUnlocking ? 0 : 1,
            transform: isUnlocking ? 'scale(0.98)' : 'scale(1)',
            transition: 'opacity 0.16s ease-out, transform 0.16s ease-out',
          }}
        >
          <div
            className="card animate-slide-up"
            style={{
              width: '100%',
              maxWidth: 400,
              padding: '36px 32px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-taste-lg)',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.18), transparent)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ textAlign: 'center', marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-taste-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                  marginBottom: 16,
                }}
              >
                <Lock size={20} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 750, letterSpacing: '-0.02em', marginBottom: 6, color: 'var(--text-primary)' }}>
                Secure Workspace
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, lineHeight: 1.4 }}>
                Enter your passcode to unlock TasksManager.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label
                  htmlFor="workspace-password"
                  style={{ display: 'block', fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)', marginBottom: 6 }}
                >
                  Passcode
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="workspace-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter passcode..."
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(false);
                    }}
                    className="input"
                    style={{
                      width: '100%',
                      borderColor: error ? 'var(--high)' : undefined,
                      paddingRight: 40,
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-taste-sm)',
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && (
                  <p style={{ color: 'var(--high)', fontSize: 12, margin: '6px 0 0 0', fontWeight: 600 }}>
                    Incorrect passcode. Please try again.
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '11px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: 13.5,
                  boxShadow: 'var(--shadow-taste-sm)',
                  cursor: 'pointer',
                }}
              >
                {isUnlocking ? 'Unlocking...' : 'Unlock Workspace'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
