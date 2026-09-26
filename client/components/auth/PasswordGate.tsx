'use client';
import { useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function PasswordGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname?.startsWith('/status');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper to get fresh config
  const getConfig = () => {
    try {
      const stored = localStorage.getItem('securityConfig');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { password: 'TasksManager2026@', timeoutMs: 15 * 60 * 1000 };
  };

  useEffect(() => {
    const checkAuth = () => {
      const authTime = localStorage.getItem('authTime');
      const { timeoutMs } = getConfig();
      
      if (authTime) {
        const timePassed = Date.now() - parseInt(authTime);
        if (timePassed < timeoutMs) {
          setIsAuthenticated(true);
        } else {
          // Expired. Check if user is busy with a modal or typing.
          const isBusy = !!document.querySelector('.modal-overlay') || 
                         document.activeElement?.tagName === 'INPUT' || 
                         document.activeElement?.tagName === 'TEXTAREA';
          if (isBusy) {
            return; // Delay lockout
          }
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuth();
    const interval = setInterval(checkAuth, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { password: correctPassword } = getConfig();
    if (password === correctPassword) {
      localStorage.setItem('authTime', Date.now().toString());
      setIsAuthenticated(true);
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
  
  if (isAuthenticated) return <>{children}</>;

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
