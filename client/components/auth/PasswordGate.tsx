'use client';
import { useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Eye, EyeOff, Clock, Lock } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch, BASE_URL } from '@/lib/api';
import {
  getSessionStatus,
  persistActivityTimestamps,
  lockSession,
  unlockSession,
  subscribeToSessionEvents,
  getSecurityConfig,
  STORAGE_KEYS,
  formatTimeoutDuration,
} from '@/lib/sessionManager';

const isPublicPath = (path?: string | null): boolean => {
  if (!path) return false;
  return (
    path === '/status' ||
    path.startsWith('/status/') ||
    path === '/status/' ||
    path === '/_not-found' ||
    path.startsWith('/_not-found')
  );
};

export default function PasswordGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = isPublicPath(pathname) || (typeof window !== 'undefined' && isPublicPath(window.location.pathname));

  const [mounted, setMounted] = useState(false);
  const [isLocked, setIsLocked] = useState(!isPublic);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Incorrect passcode. Please try again.');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);

  // Synchronize lock status for protected routes without SSR hydration mismatches
  const syncStatus = mounted && !isPublic ? getSessionStatus(false) : null;
  const effectiveLocked = !isPublic && (mounted && syncStatus ? syncStatus.isLocked : isLocked);
  const effectiveTimedOut = effectiveLocked && (syncStatus ? syncStatus.isTimedOut : isTimedOut);

  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutInputRef = useRef<HTMLInputElement>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const checkSyncStateRef = useRef<() => void>(() => {});
  const lastThrottleRef = useRef<number>(0);
  const lastStorageWriteRef = useRef<number>(0);

  const saveCurrentReturnUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath && currentPath !== '/' && !sessionStorage.getItem(STORAGE_KEYS.LOCKED_RETURN_URL)) {
      sessionStorage.setItem(STORAGE_KEYS.LOCKED_RETURN_URL, currentPath);
    }
  }, []);

  const triggerSessionTimeout = useCallback(() => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    saveCurrentReturnUrl();
    lockSession('timeout');
    checkSyncStateRef.current();
  }, [saveCurrentReturnUrl]);

  const triggerMaxSessionExpiration = useCallback(() => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    saveCurrentReturnUrl();
    lockSession('max_duration');
    checkSyncStateRef.current();
  }, [saveCurrentReturnUrl]);

  const scheduleTimeout = useCallback((inactivityDelayMs: number, maxSessionDelayMs: number) => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }

    if (inactivityDelayMs > 0 && Number.isFinite(inactivityDelayMs)) {
      timeoutTimerRef.current = setTimeout(() => {
        triggerSessionTimeout();
      }, inactivityDelayMs);
    }

    if (maxSessionDelayMs > 0 && Number.isFinite(maxSessionDelayMs)) {
      maxDurationTimerRef.current = setTimeout(() => {
        triggerMaxSessionExpiration();
      }, maxSessionDelayMs);
    }
  }, [triggerSessionTimeout, triggerMaxSessionExpiration]);

  const checkSyncState = useCallback(() => {
    if (isPublic) {
      setLoading(false);
      setIsLocked(false);
      setIsTimedOut(false);
      return;
    }

    const status = getSessionStatus(isPublic);

    if (status.isLocked) {
      saveCurrentReturnUrl();
      setIsLocked(true);
      setIsTimedOut(status.isTimedOut);

      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }

      // If in Session Timeout stage, continue countdown toward maximum session expiration
      if (status.isTimedOut && status.remainingMaxSessionMs > 0 && Number.isFinite(status.remainingMaxSessionMs)) {
        if (maxDurationTimerRef.current) {
          clearTimeout(maxDurationTimerRef.current);
        }
        maxDurationTimerRef.current = setTimeout(() => {
          triggerMaxSessionExpiration();
        }, status.remainingMaxSessionMs);
      } else if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }

      setLoading(false);
      return;
    }

    setIsLocked(false);
    setIsTimedOut(false);
    setLoading(false);
    scheduleTimeout(status.remainingInactivityMs, status.remainingMaxSessionMs);
  }, [isPublic, saveCurrentReturnUrl, scheduleTimeout, triggerMaxSessionExpiration]);

  checkSyncStateRef.current = checkSyncState;

  const handleUserActivity = useCallback(() => {
    if (isLocked || isTimedOut) return;

    const { timeoutMs, maxSessionMs } = getSecurityConfig();
    if (timeoutMs === 0 && maxSessionMs === 0) return;

    const now = Date.now();
    if (now - lastThrottleRef.current < 1500) return;
    lastThrottleRef.current = now;

    // Persist activity to storage throttled to avoid layout thrashing
    if (now - lastStorageWriteRef.current > 3000) {
      persistActivityTimestamps(now);
      lastStorageWriteRef.current = now;
    }

    const status = getSessionStatus(false);
    if (!status.isLocked) {
      scheduleTimeout(status.remainingInactivityMs, status.remainingMaxSessionMs);
    }
  }, [isLocked, isTimedOut, scheduleTimeout]);

  useEffect(() => {
    setMounted(true);
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

    const unsubscribeEvents = subscribeToSessionEvents(() => {
      checkSyncState();
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSyncState();
      } else if (!isLocked && !isPublic) {
        persistActivityTimestamps(Date.now());
      }
    };

    const onPageHide = () => {
      if (!isLocked && !isPublic) {
        persistActivityTimestamps(Date.now());
      }
    };

    const onFocus = () => {
      checkSyncState();
    };

    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', checkSyncState);
    window.addEventListener('focus', onFocus);

    return () => {
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
      }
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
      }
      activityEvents.forEach((ev) => {
        window.removeEventListener(ev, handleUserActivity);
      });
      unsubscribeEvents();
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', checkSyncState);
      window.removeEventListener('focus', onFocus);
    };
  }, [isPublic, handleUserActivity, checkSyncState]);

  useEffect(() => {
    if (effectiveLocked && !isPublic) {
      saveCurrentReturnUrl();
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'hidden';
      }
    } else if (typeof window !== 'undefined') {
      document.body.style.overflow = '';
    }
  }, [effectiveLocked, isPublic, saveCurrentReturnUrl]);

  useEffect(() => {
    if (!effectiveLocked || isPublic) return;

    const timer = setTimeout(() => {
      const activeInput = effectiveTimedOut ? timeoutInputRef.current : inputRef.current;
      if (activeInput) {
        activeInput.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeInput = effectiveTimedOut ? timeoutInputRef.current : inputRef.current;

      // 1. Ctrl + A (or Cmd + A): Select ONLY the passcode input box text
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        if (activeInput) {
          e.preventDefault();
          activeInput.focus();
          activeInput.select();
        }
        return;
      }

      // 2. Escape: Clear the passcode input box and keep focus
      if (e.key === 'Escape') {
        e.preventDefault();
        setPassword('');
        setError(false);
        if (activeInput) {
          activeInput.focus();
        }
        return;
      }

      // 3. Enter: Trigger unlock if not already focused on submit button or input
      if (e.key === 'Enter') {
        if (document.activeElement !== activeInput) {
          const submitBtn = document.querySelector('form button[type="submit"]') as HTMLButtonElement | null;
          if (submitBtn && !submitBtn.disabled) {
            e.preventDefault();
            submitBtn.click();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [effectiveLocked, effectiveTimedOut, isPublic]);

  const handleUnlockSuccess = (
    passwordUpdatedAt?: string | null,
    sessionToken?: string | null,
    isResume: boolean = false
  ) => {
    setIsUnlocking(true);

    unlockSession(passwordUpdatedAt, sessionToken, isResume);

    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }

    setIsLocked(false);
    setIsTimedOut(false);
    setIsUnlocking(false);
    setError(false);
    setPassword('');

    const status = getSessionStatus(false);
    scheduleTimeout(status.remainingInactivityMs, status.remainingMaxSessionMs);

    if (typeof window !== 'undefined') {
      const returnUrl = sessionStorage.getItem(STORAGE_KEYS.LOCKED_RETURN_URL);
      if (returnUrl) {
        sessionStorage.removeItem(STORAGE_KEYS.LOCKED_RETURN_URL);
        if (pathname === '/' && returnUrl !== '/') {
          router.replace(returnUrl);
        } else {
          window.history.replaceState(null, '', returnUrl);
        }
      }
    }
  };

  useEffect(() => {
    // Ping health once on initial landing to pre-warm serverless or cold instances
    fetch(`${BASE_URL}/api/health`).catch(() => {});
  }, []);

  const triggerErrorFeedback = useCallback((customMsg?: string) => {
    setError(true);
    setErrorMessage(customMsg || 'Incorrect passcode. Please try again.');
    setShake(true);
    setTimeout(() => setShake(false), 380);

    setTimeout(() => {
      const activeInput = effectiveTimedOut ? timeoutInputRef.current : inputRef.current;
      if (activeInput) {
        activeInput.focus();
        activeInput.select();
      }
    }, 40);
  }, [effectiveTimedOut]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = password.trim();
    if (!trimmed || isVerifying || isUnlocking) return;

    const isResume = effectiveTimedOut;
    setError(false);
    setIsVerifying(true);

    try {
      const { timeoutMs, maxSessionMs } = getSecurityConfig();
      const res = await apiFetch<{
        valid: boolean;
        sessionToken?: string;
        passwordUpdatedAt?: string | null;
        error?: string;
        locked?: boolean;
        remainingSeconds?: number;
      }>('/api/settings/verify-password', {
        method: 'POST',
        body: { password: trimmed, timeoutMs, maxSessionMs },
      });

      if (res.valid) {
        handleUnlockSuccess(res.passwordUpdatedAt || null, res.sessionToken || null, isResume);
      } else {
        triggerErrorFeedback(res.error || 'Incorrect passcode. Please try again.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Verification failed. Please try again.';
      triggerErrorFeedback(msg);
    } finally {
      setIsVerifying(false);
      setTimeout(() => {
        const activeInput = effectiveTimedOut ? timeoutInputRef.current : inputRef.current;
        if (activeInput) {
          activeInput.focus();
          activeInput.select();
        }
      }, 50);
    }
  };

  if (isPublic) return <>{children}</>;

  if (loading && !effectiveLocked) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', zIndex: 99999 }} />
    );
  }

  const { timeoutMs } = getSecurityConfig();
  const configuredPeriodText = formatTimeoutDuration(timeoutMs);

  return (
    <>
      <div
        suppressHydrationWarning
        style={{
          display: effectiveLocked ? 'none' : 'flex',
          width: '100%',
          height: '100dvh',
          minWidth: 0,
          visibility: effectiveLocked ? 'hidden' : 'visible',
          pointerEvents: effectiveLocked ? 'none' : 'auto',
          userSelect: effectiveLocked ? 'none' : 'auto',
          transition: 'opacity 0.2s var(--ease-out)',
        }}
        {...(effectiveLocked ? { 'aria-hidden': 'true', tabIndex: -1 } : {})}
      >
        {children}
      </div>

      {/* Session Timeout Modal */}
      {effectiveLocked && effectiveTimedOut && (
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
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          <div
            className={`card animate-slide-up ${shake ? 'animate-shake' : ''}`}
            onCopy={(e: React.ClipboardEvent<HTMLDivElement>) => {
              if (document.activeElement !== timeoutInputRef.current) {
                e.preventDefault();
              }
            }}
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
              userSelect: 'none',
              WebkitUserSelect: 'none',
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

            <div style={{ textAlign: 'center', marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none', WebkitUserSelect: 'none' }}>
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
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                Session Timed Out
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, lineHeight: 1.5, maxWidth: 340, userSelect: 'none', WebkitUserSelect: 'none' }}>
                You have been inactive for <strong style={{ color: 'var(--text-primary)', fontWeight: 650 }}>{configuredPeriodText}</strong>. To safeguard your workspace, your session has been paused.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label
                  htmlFor="timeout-passcode"
                  style={{ display: 'block', fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)', marginBottom: 6, userSelect: 'none', WebkitUserSelect: 'none' }}
                >
                  Enter Passcode to Continue
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={timeoutInputRef}
                    id="timeout-passcode"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter passcode..."
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setPassword('');
                        setError(false);
                      }
                    }}
                    disabled={isVerifying || isUnlocking}
                    className={`input ${shake ? 'animate-shake' : ''}`}
                    style={{
                      width: '100%',
                      borderColor: error ? 'var(--high)' : undefined,
                      paddingRight: 40,
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-taste-sm)',
                      cursor: isVerifying || isUnlocking ? 'not-allowed' : undefined,
                      opacity: isVerifying || isUnlocking ? 0.7 : 1,
                      userSelect: 'text',
                      WebkitUserSelect: 'text',
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isVerifying || isUnlocking}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: isVerifying || isUnlocking ? 'not-allowed' : 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                      opacity: isVerifying || isUnlocking ? 0.5 : 1,
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && (
                  <p style={{ color: 'var(--high)', fontSize: 12, margin: '6px 0 0 0', fontWeight: 600, userSelect: 'none', WebkitUserSelect: 'none' }}>
                    {errorMessage}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifying || isUnlocking}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '11px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: 13.5,
                  boxShadow: 'var(--shadow-taste-sm)',
                  cursor: isVerifying || isUnlocking ? 'not-allowed' : 'pointer',
                  opacity: isVerifying || isUnlocking ? 0.7 : 1,
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                {isUnlocking ? 'Resuming...' : isVerifying ? 'Verifying...' : 'Continue Session'}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* Manual Workspace Lock Screen */}
      {effectiveLocked && !effectiveTimedOut && (
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
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          <div
            className={`card animate-slide-up ${shake ? 'animate-shake' : ''}`}
            onCopy={(e: React.ClipboardEvent<HTMLDivElement>) => {
              if (document.activeElement !== inputRef.current) {
                e.preventDefault();
              }
            }}
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
              userSelect: 'none',
              WebkitUserSelect: 'none',
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

            <div style={{ textAlign: 'center', marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none', WebkitUserSelect: 'none' }}>
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
              <h1 style={{ fontSize: 22, fontWeight: 750, letterSpacing: '-0.02em', marginBottom: 6, color: 'var(--text-primary)', userSelect: 'none', WebkitUserSelect: 'none' }}>
                Secure Workspace
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, lineHeight: 1.4, userSelect: 'none', WebkitUserSelect: 'none' }}>
                Enter your passcode to unlock TasksManager.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label
                  htmlFor="workspace-password"
                  style={{ display: 'block', fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)', marginBottom: 6, userSelect: 'none', WebkitUserSelect: 'none' }}
                >
                  Passcode
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={inputRef}
                    id="workspace-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter passcode..."
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setPassword('');
                        setError(false);
                      }
                    }}
                    disabled={isVerifying || isUnlocking}
                    className={`input ${shake ? 'animate-shake' : ''}`}
                    style={{
                      width: '100%',
                      borderColor: error ? 'var(--high)' : undefined,
                      paddingRight: 40,
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-taste-sm)',
                      cursor: isVerifying || isUnlocking ? 'not-allowed' : undefined,
                      opacity: isVerifying || isUnlocking ? 0.7 : 1,
                      userSelect: 'text',
                      WebkitUserSelect: 'text',
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isVerifying || isUnlocking}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: isVerifying || isUnlocking ? 'not-allowed' : 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                      opacity: isVerifying || isUnlocking ? 0.5 : 1,
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && (
                  <p style={{ color: 'var(--high)', fontSize: 12, margin: '6px 0 0 0', fontWeight: 600, userSelect: 'none', WebkitUserSelect: 'none' }}>
                    {errorMessage}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isVerifying || isUnlocking}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '11px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: 13.5,
                  boxShadow: 'var(--shadow-taste-sm)',
                  cursor: isVerifying || isUnlocking ? 'not-allowed' : 'pointer',
                  opacity: isVerifying || isUnlocking ? 0.7 : 1,
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                {isUnlocking ? 'Unlocking...' : isVerifying ? 'Verifying...' : 'Unlock Workspace'}
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
