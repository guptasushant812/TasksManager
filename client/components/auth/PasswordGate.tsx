'use client';
import { useState, useEffect, ReactNode, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function PasswordGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname?.startsWith('/status');

  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Helper to get fresh config
  const getConfig = () => {
    try {
      const stored = localStorage.getItem('securityConfig');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          password: parsed.password || 'Sushant2026@',
          timeoutMs: parsed.timeoutMs || 300000
        };
      }
    } catch (e) {}
    // default 5 minutes = 300000 ms
    return { password: 'Sushant2026@', timeoutMs: 300000 };
  };

  useEffect(() => {
    // Throttled activity tracker
    let lastUpdate = Date.now();
    const updateActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > 5000) { // only write to localStorage every 5s max
        localStorage.setItem('lastActiveTime', now.toString());
        lastUpdate = now;
      }
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    const checkAuth = () => {
      // Manual explicit lock takes precedence
      if (localStorage.getItem('isAppLocked') === 'true') {
        setIsLocked(true);
        setLoading(false);
        return;
      }

      const { timeoutMs } = getConfig();
      const lastActive = localStorage.getItem('lastActiveTime');
      
      if (lastActive) {
        const timePassed = Date.now() - parseInt(lastActive);
        if (timePassed > timeoutMs) {
          setIsLocked(true);
          localStorage.setItem('isAppLocked', 'true'); // lock it formally
        } else {
          setIsLocked(false);
        }
      } else {
        // First visit ever
        setIsLocked(true);
        localStorage.setItem('isAppLocked', 'true');
      }
      setLoading(false);
    };

    checkAuth();
    const interval = setInterval(checkAuth, 2000); 

    window.addEventListener('storage', checkAuth);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { password: correctPassword } = getConfig();
    
    // Accept either the user's updated password OR the initial default fallback "Sushant2026@"
    if (password === correctPassword || password === 'Sushant2026@') {
      localStorage.setItem('isAppLocked', 'false');
      localStorage.setItem('lastActiveTime', Date.now().toString());
      
      setIsLocked(false);
      setError(false);
      setPassword('');
    } else {
      setError(true);
    }
  };

  if (isPublic) return <>{children}</>;
  
  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', zIndex: 99999 }}>
      </div>
    );
  }
  
  if (!isLocked) return <>{children}</>;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24
    }}>
      <div className="card animate-slide-up" style={{
        width: '100%',
        maxWidth: 400,
        padding: '36px 32px',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-taste-lg)',
        border: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Top micro-sheen line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.18), transparent)',
          pointerEvents: 'none',
        }} />

        <div style={{ textAlign: 'center', marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
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
          }}>
            <Eye size={20} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 750, letterSpacing: '-0.02em', marginBottom: 6, color: 'var(--text-primary)' }}>
            Secure Workspace
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, lineHeight: 1.4 }}>
            Enter your passcode to unlock TasksManager.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label htmlFor="workspace-password" style={{ display: 'block', fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Passcode
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="workspace-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password..."
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
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
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <p style={{ color: 'var(--high)', fontSize: 12, margin: '6px 0 0 0', fontWeight: 600 }}>Incorrect passcode. Please try again.</p>}
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
            Unlock Workspace
          </button>
        </form>
      </div>
    </div>
  );
}
