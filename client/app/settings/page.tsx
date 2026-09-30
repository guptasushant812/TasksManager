'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useTaskContext } from '@/context/TaskContext';
import { useEscalation } from '@/hooks/useEscalation';
import { Settings as SettingsIcon, AlertTriangle, Bell, Shield, Eye, EyeOff, CheckCircle2, X } from 'lucide-react';

const TABS = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'escalation', label: 'Escalation', icon: AlertTriangle },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  bgColor: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    name: 'Cyberpunk (Dark & Neon)',
    description: 'Deep void background with high-contrast electric green and neon accents.',
    primaryColor: '#00ff88',
    bgColor: '#0a0a0f',
  },
  {
    id: 'light',
    name: 'Neo-Brutalist (Clean White)',
    description: 'Minimalist white surface with crisp borders and purple accents.',
    primaryColor: '#8b5cf6',
    bgColor: '#ffffff',
  },
  {
    id: 'slate',
    name: 'Midnight Slate (Deep Blue)',
    description: 'Deep oceanic navy slate with sky blue highlights and subtle borders.',
    primaryColor: '#38bdf8',
    bgColor: '#0b1120',
  },
  {
    id: 'warm',
    name: 'Charcoal Amber (Warm Dark)',
    description: 'Obsidian dark palette with warm golden amber accents.',
    primaryColor: '#f59e0b',
    bgColor: '#121214',
  },
  {
    id: 'emerald',
    name: 'Matrix Emerald (Forest Green)',
    description: 'Deep forest green tones with mint emerald accents.',
    primaryColor: '#10b981',
    bgColor: '#05130b',
  },
];

export default function SettingsPage() {
  const { filters, handleTaskCreated } = useTaskContext();
  const [activeTab, setActiveTab] = useState('general');

  const { settings, updateSettings, loading } = useEscalation();
  const [isSaving, setIsSaving] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);
  const [themeSuccess, setThemeSuccess] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.theme || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      setCurrentTheme(saved);
    } catch {}
  }, []);

  const handleSelectTheme = (newThemeId: string) => {
    if (newThemeId === currentTheme) return;
    setPendingTheme(newThemeId);
  };

  const handleConfirmTheme = () => {
    if (!pendingTheme) return;
    const themeId = pendingTheme;
    document.documentElement.setAttribute('data-theme', themeId);
    if (themeId === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    localStorage.theme = themeId;
    window.dispatchEvent(new Event('storage'));
    setCurrentTheme(themeId);
    setPendingTheme(null);
    setThemeSuccess(true);
    setTimeout(() => setThemeSuccess(false), 3000);
  };

  const handleCancelTheme = () => {
    setPendingTheme(null);
  };
  const [localSettings, setLocalSettings] = useState({ 
    enabled: false, 
    threshold: 3,
    managerEmail: '',
    hodEmail: '',
    dyhodEmail: '',
    ccEmail: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleUpdatePassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newPassword.trim();
    if (!trimmed) {
      setPasswordError('Enter a password first');
      return;
    }
    if (trimmed.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      return;
    }

    try {
      const current = JSON.parse(localStorage.getItem('securityConfig') || '{"password":"Sushant2026@","timeoutMs":300000}');
      current.password = trimmed;
      localStorage.setItem('securityConfig', JSON.stringify(current));
      window.dispatchEvent(new Event('storage'));
      setPasswordSaved(true);
      setPasswordError('');
      setNewPassword('');
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch {
      setPasswordError('Could not save password');
    }
  };

  useEffect(() => {
    if (settings) {
      setLocalSettings({ 
        enabled: settings.enabled, 
        threshold: settings.threshold,
        managerEmail: settings.managerEmail || '',
        hodEmail: settings.hodEmail || '',
        dyhodEmail: settings.dyhodEmail || '',
        ccEmail: settings.ccEmail || ''
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings(localSettings);
    setTimeout(() => setIsSaving(false), 500);
  };

  const hasChanges = 
    localSettings.enabled !== settings?.enabled || 
    localSettings.threshold !== settings?.threshold ||
    localSettings.managerEmail !== (settings?.managerEmail || '') ||
    localSettings.hodEmail !== (settings?.hodEmail || '') ||
    localSettings.dyhodEmail !== (settings?.dyhodEmail || '') ||
    localSettings.ccEmail !== (settings?.ccEmail || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main style={{ flex: 1, padding: 'clamp(16px, 4vw, 32px) clamp(12px, 3vw, 32px) 48px', maxWidth: 1100, margin: '0 auto', width: '100%', display: 'flex', gap: 'clamp(20px, 4vw, 40px)', flexWrap: 'wrap' }}>

        {/* Settings navigation */}
        <aside style={{ width: 200, flexShrink: 0, minWidth: 'min(200px, 100%)' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 20px 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Settings
          </h1>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    background: isActive ? 'var(--accent-subtle)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <Icon style={{ width: 15, height: 15 }} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Settings content */}
        <section style={{ flex: 1, paddingTop: 4 }}>
          {activeTab === 'escalation' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Escalation Policies</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                  Configure automatic warnings when tasks require excessive follow-ups.
                </p>
              </div>

              {loading && !settings ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 10px' }} />
                  Loading…
                </div>
              ) : (
                <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Toggle */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                        Enable Escalation Alerts
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Shows a warning banner on tasks exceeding the follow-up threshold.
                      </div>
                    </div>
                    <button
                      onClick={() => setLocalSettings(s => ({ ...s, enabled: !s.enabled }))}
                      role="switch"
                      aria-checked={localSettings.enabled}
                      style={{
                        width: 40, height: 22, borderRadius: 22, flexShrink: 0,
                        background: localSettings.enabled ? 'var(--accent)' : 'var(--bg-elevated)',
                        border: `1px solid ${localSettings.enabled ? 'var(--accent)' : 'var(--border)'}`,
                        position: 'relative', cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 2, left: localSettings.enabled ? 21 : 2,
                        transition: 'left 0.2s var(--ease-smooth)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }} />
                    </button>
                  </div>

                  <div style={{ height: 1, background: 'var(--border-subtle)' }} />

                  {/* Threshold */}
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    opacity: localSettings.enabled ? 1 : 0.35,
                    transition: 'opacity 0.2s',
                    pointerEvents: localSettings.enabled ? 'auto' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                        Follow-Up Threshold
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Number of active follow-ups before escalation triggers.
                      </div>
                    </div>
                    <input
                      type="number"
                      min="1"
                      disabled={!localSettings.enabled}
                      value={localSettings.threshold}
                      onChange={(e) => setLocalSettings(s => ({ ...s, threshold: parseInt(e.target.value) || 1 }))}
                      className="input"
                      style={{ width: 64, textAlign: 'center', fontSize: 14, padding: '6px 10px' }}
                    />
                  </div>

                  <div style={{ height: 1, background: 'var(--border-subtle)' }} />

                  {/* Emails */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 16,
                    opacity: localSettings.enabled ? 1 : 0.35,
                    transition: 'opacity 0.2s',
                    pointerEvents: localSettings.enabled ? 'auto' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                        Escalation Recipients
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
                        Email addresses to notify when a task is escalated.
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Manager Email</label>
                        <input type="email" placeholder="manager@example.com" value={localSettings.managerEmail} onChange={e => setLocalSettings(s => ({ ...s, managerEmail: e.target.value }))} className="input" style={{ width: '100%', fontSize: 14, padding: '8px 12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>HOD Email</label>
                        <input type="email" placeholder="hod@example.com" value={localSettings.hodEmail} onChange={e => setLocalSettings(s => ({ ...s, hodEmail: e.target.value }))} className="input" style={{ width: '100%', fontSize: 14, padding: '8px 12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>DyHOD Email</label>
                        <input type="email" placeholder="dyhod@example.com" value={localSettings.dyhodEmail} onChange={e => setLocalSettings(s => ({ ...s, dyhodEmail: e.target.value }))} className="input" style={{ width: '100%', fontSize: 14, padding: '8px 12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>CC Email (Your Email)</label>
                        <input type="email" placeholder="you@example.com" value={localSettings.ccEmail} onChange={e => setLocalSettings(s => ({ ...s, ccEmail: e.target.value }))} className="input" style={{ width: '100%', fontSize: 14, padding: '8px 12px' }} />
                      </div>
                    </div>
                  </div>

                  {/* Save */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={isSaving || !hasChanges}
                      style={{ fontSize: 13, padding: '8px 20px' }}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin" style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                          Saving…
                        </>
                      ) : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'general' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>General Preferences</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                  Manage global application settings and aesthetics.
                </p>
              </div>

              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Theme Option List */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                      Application Theme
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Select a visual theme. Changing themes will ask for your confirmation.
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {themeSuccess && (
                      <span style={{ fontSize: 12, color: 'var(--low)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={14} /> Theme applied
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '6px 12px' }}>
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: THEME_OPTIONS.find(t => t.id === currentTheme)?.primaryColor || 'var(--accent)',
                          display: 'inline-block',
                          boxShadow: '0 0 6px rgba(0,0,0,0.3)',
                          flexShrink: 0
                        }}
                      />
                      <select
                        value={currentTheme}
                        onChange={(e) => handleSelectTheme(e.target.value)}
                        className="bg-transparent"
                        style={{
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          outline: 'none',
                          padding: '2px 4px',
                        }}
                      >
                        {THEME_OPTIONS.map((theme) => (
                          <option
                            key={theme.id}
                            value={theme.id}
                            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                          >
                            {theme.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Security Configuration</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                  Manage access control and authentication timeouts.
                </p>
              </div>

              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Auth Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ maxWidth: 360 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                        Master Password
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Set the password required to access the application.
                      </div>
                    </div>
                    <form 
                      onSubmit={handleUpdatePassword} 
                      style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
                    >
                      <div style={{ position: 'relative', width: 220 }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="New password..."
                          className="input"
                          value={newPassword}
                          style={{ width: '100%', fontSize: 14, padding: '8px 36px 8px 12px' }}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            if (passwordError) setPasswordError('');
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                            background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                          }}
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ fontSize: 13, padding: '8px 16px', whiteSpace: 'nowrap' }}
                      >
                        Save Password
                      </button>
                    </form>
                  </div>
                  {passwordError && (
                    <div style={{ fontSize: 12, color: 'var(--high)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} /> {passwordError}
                    </div>
                  )}
                  {passwordSaved && (
                    <div style={{ fontSize: 12, color: 'var(--completed)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} /> Password updated.
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: 'var(--border-subtle)' }} />

                {/* Auth Timeout */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                      Session Timeout
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Lock the application after a period of inactivity or when you leave.
                    </div>
                  </div>
                  <select
                    className="input"
                    style={{ width: 200, fontSize: 14, padding: '8px 12px' }}
                    onChange={(e) => {
                      const current = JSON.parse(localStorage.getItem('securityConfig') || '{"password":"Sushant2026@","timeoutMs":300000}');
                      current.timeoutMs = parseInt(e.target.value);
                      localStorage.setItem('securityConfig', JSON.stringify(current));
                      window.dispatchEvent(new Event('storage'));
                    }}
                    defaultValue={
                      (() => {
                        try {
                          const conf = JSON.parse(localStorage.getItem('securityConfig') || '{}');
                          return conf.timeoutMs || 300000;
                        } catch(e) { return 300000; }
                      })()
                    }
                  >
                    <option value="300000">5 minutes (Default)</option>
                    <option value="600000">10 minutes</option>
                    <option value="900000">15 minutes</option>
                    <option value="1800000">30 minutes</option>
                    <option value="3600000">1 hour</option>
                  </select>
                </div>

                <div style={{ height: 1, background: 'var(--border-subtle)' }} />

                {/* Lock Application */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                      Lock Application
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Manually lock the app right now. You will need the master password to unlock.
                    </div>
                  </div>
                  <button
                    className="btn"
                    style={{
                      background: 'transparent',
                      color: 'var(--high)',
                      borderColor: 'var(--high)',
                      padding: '8px 16px',
                      fontSize: 14,
                    }}
                    onClick={() => {
                      localStorage.setItem('isAppLocked', 'true');
                      window.dispatchEvent(new Event('storage'));
                    }}
                  >
                    Lock Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'escalation' && activeTab !== 'general' && activeTab !== 'security' && (
            <div className="animate-fade-in card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Coming Soon</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>This section is under development.</p>
            </div>
          )}
        </section>
      </main>

      {/* Theme Confirmation Modal */}
      {pendingTheme && (() => {
        const targetTheme = THEME_OPTIONS.find(t => t.id === pendingTheme);

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={handleCancelTheme}
          >
            <div
              className="card animate-fade-in"
              style={{
                maxWidth: 440,
                width: '100%',
                padding: '24px',
                background: 'var(--bg-surface)',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-lg, 8px)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Apply New Theme?
                </h3>
                <button
                  onClick={handleCancelTheme}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to change the theme? This will update the color scheme and appearance across the entire website.
              </p>

              {/* Theme Preview Card */}
              {targetTheme && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md, 6px)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-elevated)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          backgroundColor: targetTheme.primaryColor,
                          border: '2px solid rgba(255,255,255,0.2)',
                          display: 'inline-block',
                          boxShadow: `0 0 8px ${targetTheme.primaryColor}80`,
                        }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {targetTheme.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span
                        title="Background base color"
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 3,
                          backgroundColor: targetTheme.bgColor,
                          border: '1px solid var(--border)',
                          display: 'inline-block',
                        }}
                      />
                      <span
                        title="Accent color"
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 3,
                          backgroundColor: targetTheme.primaryColor,
                          display: 'inline-block',
                        }}
                      />
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {targetTheme.description}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={handleCancelTheme}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md, 6px)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmTheme}
                  style={{
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md, 6px)',
                    cursor: 'pointer',
                  }}
                >
                  Apply Theme
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
