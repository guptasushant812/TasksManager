'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { useTaskContext } from '@/context/TaskContext';
import { useEscalation } from '@/hooks/useEscalation';
import { 
  Settings as SettingsIcon, 
  AlertTriangle, 
  Bell, 
  Shield, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  X, 
  Palette, 
  Volume2, 
  Mail, 
  Clock, 
  Smartphone,
  Save,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid
} from 'lucide-react';

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
];

export default function SettingsPage() {
  const { filters, handleTaskCreated } = useTaskContext();
  const [activeTab, setActiveTab] = useState('general');
  const [mobileNavMode, setMobileNavMode] = useState<'scroll' | 'grid'>('scroll');
  const navListRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll boundary to reveal edge gradient masks & chevron buttons
  const checkNavScroll = useCallback(() => {
    const el = navListRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    const el = navListRef.current;
    if (!el) return;
    checkNavScroll();
    el.addEventListener('scroll', checkNavScroll, { passive: true });
    window.addEventListener('resize', checkNavScroll);
    return () => {
      el.removeEventListener('scroll', checkNavScroll);
      window.removeEventListener('resize', checkNavScroll);
    };
  }, [checkNavScroll, activeTab, mobileNavMode]);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (mobileNavMode === 'scroll') {
      const el = navListRef.current;
      if (!el) return;
      const targetBtn = el.querySelector<HTMLElement>(`[data-tab-id="${tabId}"]`);
      if (targetBtn) {
        const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        targetBtn.scrollIntoView({
          behavior: isReducedMotion ? 'auto' : 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  };

  const handleScrollNav = (direction: 'left' | 'right') => {
    const el = navListRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -160 : 160;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: offset, behavior: isReducedMotion ? 'auto' : 'smooth' });
  };

  const handleKeyDownTab = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = TABS.length - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      const nextTab = TABS[nextIndex];
      handleSelectTab(nextTab.id);
      const el = navListRef.current;
      const targetBtn = el?.querySelector<HTMLElement>(`[data-tab-id="${nextTab.id}"]`);
      targetBtn?.focus();
    }
  };

  const { settings, updateSettings, loading } = useEscalation();
  const [isSaving, setIsSaving] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);
  const [themeSuccess, setThemeSuccess] = useState(false);

  // Local settings for escalation
  const [localSettings, setLocalSettings] = useState({ 
    enabled: false, 
    threshold: 3,
    managerEmail: '',
    hodEmail: '',
    dyhodEmail: '',
    ccEmail: ''
  });

  // Security password state
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Notifications preferences state (persisted locally)
  const [notifPreferences, setNotifPreferences] = useState({
    overdueAlerts: true,
    escalationAlerts: true,
    soundAlerts: false,
    dailyDigest: true,
  });
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    try {
      let saved = localStorage.theme || document.documentElement.getAttribute('data-theme') || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      if (saved === 'botanical' || saved === 'warm' || saved === 'emerald') {
        saved = 'dark';
        localStorage.theme = 'dark';
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      }
      setCurrentTheme(saved);
    } catch {}

    try {
      const savedNotifs = localStorage.getItem('notificationPreferences');
      if (savedNotifs) {
        setNotifPreferences(JSON.parse(savedNotifs));
      }
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

  const handleToggleNotif = (key: keyof typeof notifPreferences) => {
    setNotifPreferences(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('notificationPreferences', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        setNotifSaved(true);
        setTimeout(() => setNotifSaved(false), 2500);
      } catch {}
      return updated;
    });
  };

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
    <div className="page-layout">
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main className="page-content" style={{ maxWidth: 1100 }}>
        <div className="settings-layout">

          {/* Settings Navigation Bar (Adaptive Sidebar / Touch Scroll Bar with Visual Affordances) */}
          <aside className="settings-nav" aria-label="Settings Categories">
            <div className="settings-nav-header">
              <h1 className="settings-nav-title">Settings</h1>

              {/* Mobile View Mode Switcher: Scroll ↔ vs 2x2 Grid ⊞ */}
              <div className="settings-nav-mode-toggle" role="group" aria-label="Tab Layout Mode">
                <button
                  type="button"
                  onClick={() => setMobileNavMode('scroll')}
                  className={`settings-mode-btn ${mobileNavMode === 'scroll' ? 'active' : ''}`}
                  title="Horizontal Scroll View"
                  aria-pressed={mobileNavMode === 'scroll'}
                >
                  <SlidersHorizontal size={12} />
                  <span>Scroll</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileNavMode('grid')}
                  className={`settings-mode-btn ${mobileNavMode === 'grid' ? 'active' : ''}`}
                  title="2x2 Grid View (All tabs visible)"
                  aria-pressed={mobileNavMode === 'grid'}
                >
                  <LayoutGrid size={12} />
                  <span>Grid (All)</span>
                </button>
              </div>
            </div>

            {/* In Grid Mode (all 4 tabs immediately accessible on mobile without scrolling) */}
            {mobileNavMode === 'grid' ? (
              <nav className="settings-nav-grid" role="tablist" aria-label="Settings Tabs">
                {TABS.map((tab, idx) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      data-tab-id={tab.id}
                      onClick={() => handleSelectTab(tab.id)}
                      onKeyDown={(e) => handleKeyDownTab(e, idx)}
                      className={`settings-nav-btn ${isActive ? 'active' : ''}`}
                      role="tab"
                      aria-selected={isActive}
                      type="button"
                    >
                      <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            ) : (
              /* In Scroll Mode (with dynamic edge gradients, chevrons, and step dots) */
              <>
                <div className="settings-nav-scroll-container">
                  {/* Left scroll chevron */}
                  {canScrollLeft && (
                    <button
                      type="button"
                      onClick={() => handleScrollNav('left')}
                      className="settings-nav-chevron settings-nav-chevron-left"
                      aria-label="Scroll tabs left"
                      title="Previous tabs"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}

                  <div 
                    className={`settings-nav-scroll-wrap ${canScrollLeft ? 'has-overflow-left' : ''} ${canScrollRight ? 'has-overflow-right' : ''}`}
                  >
                    <nav 
                      ref={navListRef}
                      className="settings-nav-list" 
                      role="tablist"
                      aria-label="Settings Tabs"
                    >
                      {TABS.map((tab, idx) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            data-tab-id={tab.id}
                            onClick={() => handleSelectTab(tab.id)}
                            onKeyDown={(e) => handleKeyDownTab(e, idx)}
                            className={`settings-nav-btn ${isActive ? 'active' : ''}`}
                            role="tab"
                            aria-selected={isActive}
                            type="button"
                          >
                            <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Right scroll chevron */}
                  {canScrollRight && (
                    <button
                      type="button"
                      onClick={() => handleScrollNav('right')}
                      className="settings-nav-chevron settings-nav-chevron-right"
                      aria-label="Scroll tabs right"
                      title="More tabs"
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>

                {/* Mobile Scroll Meta & Dot Progress Indicator */}
                <div className="settings-nav-meta">
                  <span className="settings-nav-hint">
                    {canScrollRight ? 'Swipe tabs or tap › for more' : 'All tabs visible'}
                  </span>
                  <div className="settings-nav-dots" role="presentation">
                    {TABS.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleSelectTab(tab.id)}
                          className={`settings-nav-dot ${isActive ? 'active' : ''}`}
                          title={`Go to ${tab.label}`}
                          aria-label={`Go to ${tab.label}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </aside>

          {/* Settings Content & Container Query Context */}
          <section className="settings-content">
            
            {/* ── GENERAL PREFERENCES TAB ─────────────────────────────────── */}
            {activeTab === 'general' && (
              <div className="animate-fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="settings-header">
                  <h2>General Preferences</h2>
                  <p>Manage application themes, visual appearance, and interface customization.</p>
                </div>

                <div className="settings-card">
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <div className="settings-row-title">Active Color Theme</div>
                      <p className="settings-row-desc">
                        Select a curated color palette. Switching themes updates your dashboard, typography, and controls.
                      </p>
                    </div>
                    {themeSuccess && (
                      <span style={{ fontSize: 12, color: 'var(--completed)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                        <CheckCircle2 size={16} /> Theme applied successfully
                      </span>
                    )}
                  </div>

                  {/* Interactive Theme Selection Grid with Intrinsic Cards */}
                  <div className="settings-theme-grid">
                    {THEME_OPTIONS.map((theme) => {
                      const isSelected = currentTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => handleSelectTheme(theme.id)}
                          className={`settings-theme-card ${isSelected ? 'active' : ''}`}
                        >
                          <div className="settings-theme-card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  backgroundColor: theme.primaryColor,
                                  display: 'inline-block',
                                  boxShadow: `0 0 8px ${theme.primaryColor}80`,
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {theme.name.split('(')[0].trim()}
                              </span>
                            </div>
                            <span
                              className="settings-theme-badge"
                              style={{
                                background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-hover)',
                                color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                                border: `1px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                              }}
                            >
                              {isSelected ? 'Active' : 'Select'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBlock: '4px' }}>
                            <span
                              title="Base Surface Color"
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 4,
                                backgroundColor: theme.bgColor,
                                border: '1px solid var(--border)',
                                display: 'inline-block',
                              }}
                            />
                            <span
                              title="Primary Brand Accent"
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 4,
                                backgroundColor: theme.primaryColor,
                                border: '1px solid rgba(255,255,255,0.2)',
                                display: 'inline-block',
                              }}
                            />
                          </div>

                          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                            {theme.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── ESCALATION POLICIES TAB ─────────────────────────────────── */}
            {activeTab === 'escalation' && (
              <div className="animate-fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="settings-header">
                  <h2>Escalation Policies</h2>
                  <p>Configure automatic warnings and designated email recipients when tasks require excess follow-ups.</p>
                </div>

                {loading && !settings ? (
                  <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    <div className="animate-spin" style={{ width: 22, height: 22, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 10px' }} />
                    Loading policies…
                  </div>
                ) : (
                  <div className="settings-card">
                    {/* Enable Toggle */}
                    <div className="settings-row">
                      <div className="settings-row-text">
                        <div className="settings-row-title">Enable Escalation Alerts</div>
                        <p className="settings-row-desc">
                          Shows automated high-priority warning flags across the dashboard for tasks exceeding follow-up limits.
                        </p>
                      </div>
                      <div className="settings-row-action">
                        <button
                          onClick={() => setLocalSettings(s => ({ ...s, enabled: !s.enabled }))}
                          role="switch"
                          aria-checked={localSettings.enabled}
                          type="button"
                          style={{
                            width: 44,
                            height: 24,
                            borderRadius: 24,
                            flexShrink: 0,
                            background: localSettings.enabled ? 'var(--accent)' : 'var(--bg-elevated)',
                            border: `1px solid ${localSettings.enabled ? 'var(--accent)' : 'var(--border)'}`,
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: 2,
                            left: localSettings.enabled ? 22 : 2,
                            transition: 'left 0.2s var(--ease-smooth)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                          }} />
                        </button>
                      </div>
                    </div>

                    <div style={{ height: 1, background: 'var(--border-subtle)' }} />

                    {/* Follow-up Threshold */}
                    <div className="settings-row" style={{
                      opacity: localSettings.enabled ? 1 : 0.4,
                      transition: 'opacity 0.2s',
                      pointerEvents: localSettings.enabled ? 'auto' : 'none',
                    }}>
                      <div className="settings-row-text">
                        <div className="settings-row-title">Follow-Up Threshold</div>
                        <p className="settings-row-desc">
                          Number of active follow-ups required on a single task before escalation triggers.
                        </p>
                      </div>
                      <div className="settings-row-action">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          disabled={!localSettings.enabled}
                          value={localSettings.threshold}
                          onChange={(e) => setLocalSettings(s => ({ ...s, threshold: parseInt(e.target.value) || 1 }))}
                          className="input"
                          style={{ width: 80, textAlign: 'center', fontSize: 14, padding: '8px 12px' }}
                        />
                      </div>
                    </div>

                    <div style={{ height: 1, background: 'var(--border-subtle)' }} />

                    {/* Intrinsic Email Recipients Grid */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      opacity: localSettings.enabled ? 1 : 0.4,
                      transition: 'opacity 0.2s',
                      pointerEvents: localSettings.enabled ? 'auto' : 'none',
                    }}>
                      <div>
                        <div className="settings-row-title">Escalation Recipients</div>
                        <p className="settings-row-desc">
                          Authorized leadership email addresses to notify when a task crosses the threshold.
                        </p>
                      </div>

                      <div className="settings-recipients-grid">
                        <div className="settings-field-group">
                          <label className="settings-field-label">Manager Email</label>
                          <input
                            type="email"
                            placeholder="manager@example.com"
                            value={localSettings.managerEmail}
                            onChange={e => setLocalSettings(s => ({ ...s, managerEmail: e.target.value }))}
                            className="input"
                            style={{ width: '100%', fontSize: 14, padding: '9px 12px' }}
                          />
                        </div>

                        <div className="settings-field-group">
                          <label className="settings-field-label">HOD Email</label>
                          <input
                            type="email"
                            placeholder="hod@example.com"
                            value={localSettings.hodEmail}
                            onChange={e => setLocalSettings(s => ({ ...s, hodEmail: e.target.value }))}
                            className="input"
                            style={{ width: '100%', fontSize: 14, padding: '9px 12px' }}
                          />
                        </div>

                        <div className="settings-field-group">
                          <label className="settings-field-label">DyHOD Email</label>
                          <input
                            type="email"
                            placeholder="dyhod@example.com"
                            value={localSettings.dyhodEmail}
                            onChange={e => setLocalSettings(s => ({ ...s, dyhodEmail: e.target.value }))}
                            className="input"
                            style={{ width: '100%', fontSize: 14, padding: '9px 12px' }}
                          />
                        </div>

                        <div className="settings-field-group">
                          <label className="settings-field-label">CC Email (Your Email)</label>
                          <input
                            type="email"
                            placeholder="you@example.com"
                            value={localSettings.ccEmail}
                            onChange={e => setLocalSettings(s => ({ ...s, ccEmail: e.target.value }))}
                            className="input"
                            style={{ width: '100%', fontSize: 14, padding: '9px 12px' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        style={{ fontSize: 13, padding: '9px 24px', display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                            Saving…
                          </>
                        ) : (
                          <>
                            <Save size={15} />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── NOTIFICATIONS PREFERENCES TAB ───────────────────────────── */}
            {activeTab === 'notifications' && (
              <div className="animate-fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="settings-header">
                  <h2>Notification Preferences</h2>
                  <p>Fine-tune when and how you receive alerts, reminder sounds, and milestone updates.</p>
                </div>

                <div className="settings-card">
                  {notifSaved && (
                    <div style={{ padding: '8px 12px', background: 'var(--low-bg)', border: '1px solid var(--low)', borderRadius: 'var(--radius-md)', color: 'var(--low)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} /> Notification preferences updated
                    </div>
                  )}

                  {/* Overdue Alerts */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <div className="settings-row-title">Overdue Milestone Warnings</div>
                      <p className="settings-row-desc">
                        Highlight overdue tasks and follow-ups with high-priority amber/red indicators.
                      </p>
                    </div>
                    <div className="settings-row-action">
                      <button
                        onClick={() => handleToggleNotif('overdueAlerts')}
                        role="switch"
                        aria-checked={notifPreferences.overdueAlerts}
                        type="button"
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 24,
                          flexShrink: 0,
                          background: notifPreferences.overdueAlerts ? 'var(--accent)' : 'var(--bg-elevated)',
                          border: `1px solid ${notifPreferences.overdueAlerts ? 'var(--accent)' : 'var(--border)'}`,
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: 2,
                          left: notifPreferences.overdueAlerts ? 22 : 2,
                          transition: 'left 0.2s var(--ease-smooth)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                        }} />
                      </button>
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'var(--border-subtle)' }} />

                  {/* Escalation Alerts */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <div className="settings-row-title">Escalation Notification Banner</div>
                      <p className="settings-row-desc">
                        Show real-time alerts in the top Notification Center when tasks exceed threshold.
                      </p>
                    </div>
                    <div className="settings-row-action">
                      <button
                        onClick={() => handleToggleNotif('escalationAlerts')}
                        role="switch"
                        aria-checked={notifPreferences.escalationAlerts}
                        type="button"
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 24,
                          flexShrink: 0,
                          background: notifPreferences.escalationAlerts ? 'var(--accent)' : 'var(--bg-elevated)',
                          border: `1px solid ${notifPreferences.escalationAlerts ? 'var(--accent)' : 'var(--border)'}`,
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: 2,
                          left: notifPreferences.escalationAlerts ? 22 : 2,
                          transition: 'left 0.2s var(--ease-smooth)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                        }} />
                      </button>
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'var(--border-subtle)' }} />

                  {/* Daily Morning Digest */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <div className="settings-row-title">Daily Morning Digest</div>
                      <p className="settings-row-desc">
                        Show a quick status breakdown of today&apos;s pending tasks upon first dashboard visit.
                      </p>
                    </div>
                    <div className="settings-row-action">
                      <button
                        onClick={() => handleToggleNotif('dailyDigest')}
                        role="switch"
                        aria-checked={notifPreferences.dailyDigest}
                        type="button"
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 24,
                          flexShrink: 0,
                          background: notifPreferences.dailyDigest ? 'var(--accent)' : 'var(--bg-elevated)',
                          border: `1px solid ${notifPreferences.dailyDigest ? 'var(--accent)' : 'var(--border)'}`,
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: 2,
                          left: notifPreferences.dailyDigest ? 22 : 2,
                          transition: 'left 0.2s var(--ease-smooth)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                        }} />
                      </button>
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'var(--border-subtle)' }} />

                  {/* Audible Feedback */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <div className="settings-row-title">Subtle Audio Cues</div>
                      <p className="settings-row-desc">
                        Play brief audio tones when completing tasks or resolving overdue items.
                      </p>
                    </div>
                    <div className="settings-row-action">
                      <button
                        onClick={() => handleToggleNotif('soundAlerts')}
                        role="switch"
                        aria-checked={notifPreferences.soundAlerts}
                        type="button"
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 24,
                          flexShrink: 0,
                          background: notifPreferences.soundAlerts ? 'var(--accent)' : 'var(--bg-elevated)',
                          border: `1px solid ${notifPreferences.soundAlerts ? 'var(--accent)' : 'var(--border)'}`,
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: 2,
                          left: notifPreferences.soundAlerts ? 22 : 2,
                          transition: 'left 0.2s var(--ease-smooth)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                        }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECURITY CONFIGURATION TAB ──────────────────────────────── */}
            {activeTab === 'security' && (
              <div className="animate-fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="settings-header">
                  <h2>Security Configuration</h2>
                  <p>Manage access control passwords, automatic session timeouts, and manual app locks.</p>
                </div>

                <div className="settings-card">
                  {/* Master Password Form */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <div className="settings-row-title">Master Application Password</div>
                      <p className="settings-row-desc">
                        Change the secret code required to unlock your workspace.
                      </p>
                    </div>
                    
                    <form 
                      onSubmit={handleUpdatePassword} 
                      className="settings-password-form"
                    >
                      <div className="settings-password-input-wrap">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="New password…"
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
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 4,
                          }}
                          title={showPassword ? 'Hide password' : 'Show password'}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ fontSize: 13, padding: '8px 16px', whiteSpace: 'nowrap' }}
                      >
                        Update
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
                      <CheckCircle2 size={14} /> Password updated successfully.
                    </div>
                  )}

                  <div style={{ height: 1, background: 'var(--border-subtle)' }} />

                  {/* Auth Timeout */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <div className="settings-row-title">Auto-Lock Inactivity Timeout</div>
                      <p className="settings-row-desc">
                        Automatically lock the screen after idle inactivity to protect sensitive client data.
                      </p>
                    </div>
                    <div className="settings-row-action">
                      <select
                        className="input"
                        style={{ width: 'min(200px, 100%)', fontSize: 14, padding: '8px 12px' }}
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
                  </div>

                  <div style={{ height: 1, background: 'var(--border-subtle)' }} />

                  {/* Manual Lock Application */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <div className="settings-row-title">Immediate Workspace Lock</div>
                      <p className="settings-row-desc">
                        Lock the application immediately. You will need your master password to resume work.
                      </p>
                    </div>
                    <div className="settings-row-action">
                      <button
                        className="btn"
                        style={{
                          background: 'transparent',
                          color: 'var(--high)',
                          borderColor: 'var(--high)',
                          padding: '8px 16px',
                          fontSize: 13,
                        }}
                        onClick={() => {
                          localStorage.setItem('isAppLocked', 'true');
                          window.dispatchEvent(new Event('storage'));
                        }}
                      >
                        Lock Workspace
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Theme Confirmation Modal (Responsive dialog) */}
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
              padding: 'clamp(12px, 4vw, 24px)',
            }}
            onClick={handleCancelTheme}
          >
            <div
              className="card animate-fade-in"
              style={{
                maxWidth: 440,
                width: '100%',
                padding: 'clamp(18px, 4vw, 24px)',
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
