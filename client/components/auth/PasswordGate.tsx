'use client';
import { useState, useEffect, ReactNode, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function PasswordGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname?.startsWith('/status');

  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper to get fresh config
  const getConfig = () => {
    try {
      const stored = localStorage.getItem('securityConfig');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    // default 5 minutes = 300000 ms
    return { password: 'TasksManager2026@', timeoutMs: 300000 };
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

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { password: correctPassword } = getConfig();
    if (password === correctPassword) {
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
      <div className="card animate-slide-up" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8, color: 'var(--text-primary)' }}>Secure Access</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Please enter the password to access TasksManager.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <input
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              className="input"
              style={{ borderColor: error ? 'var(--high)' : undefined }}
              autoFocus
            />
            {error && <p style={{ color: 'var(--high)', fontSize: 12, margin: '8px 0 0 0', fontWeight: 700 }}>Incorrect password.</p>}
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
