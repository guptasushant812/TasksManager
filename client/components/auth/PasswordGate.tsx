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
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password..."
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              className="input"
              style={{ width: '100%', borderColor: error ? 'var(--high)' : undefined, paddingRight: 36 }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: 12, top: 12, // assuming input padding is standard
                background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
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
