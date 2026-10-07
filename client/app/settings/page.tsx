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
  LayoutGrid,
  Sparkles,
  Cpu,
  Key,
  ExternalLink,
  ShieldCheck
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

  // AI Assistant Preferences & Fallback Key
  const [preferredAiModel, setPreferredAiModel] = useState('auto');
  const [customAiKey, setCustomAiKey] = useState('');
  const [aiKeySaved, setAiKeySaved] = useState(false);

  useEffect(() => {
    try {
      const m = localStorage.getItem('tasksmanager_preferred_ai_model');
      if (m) setPreferredAiModel(m);
      const k = localStorage.getItem('tasksmanager_custom_ai_key');
      if (k) setCustomAiKey(k);
    } catch {}
  }, []);

  const handleSaveAiModel = (model: string) => {
    setPreferredAiModel(model);
    try {
      localStorage.setItem('tasksmanager_preferred_ai_model', model);
    } catch {}
  };

  const handleSaveCustomAiKey = (key: string) => {
    setCustomAiKey(key);
    try {
      if (key.trim()) {
        localStorage.setItem('tasksmanager_custom_ai_key', key.trim());
      } else {
        localStorage.removeItem('tasksmanager_custom_ai_key');
      }
      setAiKeySaved(true);
      setTimeout(() => setAiKeySaved(false), 2500);
    } catch {}
  };

  // Check scroll boundary to reveal edge gradient masks & chevron buttons
  const checkNavScroll = useCallback(() => {
    const el = navListRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  // Support direct deep-linking to tabs (e.g. /settings?tab=notifications)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const hash = window.location.hash.replace('#', '');
      const initialTab = tabParam || hash;
      if (initialTab && TABS.some(t => t.id === initialTab)) {
        setActiveTab(initialTab);
      }
    }
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordConfirmModal, setShowPasswordConfirmModal] = useState(false);

  // Escalation confirmation & success state
  const [showEscalationConfirmModal, setShowEscalationConfirmModal] = useState(false);
  const [escalationSaved, setEscalationSaved] = useState(false);
  const [escalationSaveError, setEscalationSaveError] = useState<string | null>(null);

  // Inactivity timeout state
  const [timeoutSaved, setTimeoutSaved] = useState(false);
  const [timeoutSavedMsg, setTimeoutSavedMsg] = useState('');

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
    setTimeout(() => {
      window.dispatchEvent(new Event('storage'));
    }, 0);
    setCurrentTheme(themeId);
    setPendingTheme(null);
    setThemeSuccess(true);
    setTimeout(() => setThemeSuccess(false), 3000);
  };

  const handleCancelTheme = () => {
    setPendingTheme(null);
  };

  const handleToggleNotif = (key: keyof typeof notifPreferences) => {
    const updated = { ...notifPreferences, [key]: !notifPreferences[key] };
    setNotifPreferences(updated);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2500);

    try {
      localStorage.setItem('notificationPreferences', JSON.stringify(updated));
      setTimeout(() => {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('notificationPreferencesChanged', { detail: updated }));
      }, 0);
    } catch {}
  };

  const handleInitiatePasswordUpdate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();
    if (!trimmed) {
      setPasswordError('Please enter a new password first.');
      return;
    }
    if (trimmed.length < 4) {
      setPasswordError('Password must be at least 4 characters long.');
      return;
    }
    if (trimmed !== trimmedConfirm) {
      setPasswordError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }
    setPasswordError('');
    setShowPasswordConfirmModal(true);
  };

  const handleConfirmPasswordUpdate = () => {
    try {
      const trimmed = newPassword.trim();
      const current = JSON.parse(localStorage.getItem('securityConfig') || '{"password":"Sushant2026@","timeoutMs":300000}');
      current.password = trimmed;
      localStorage.setItem('securityConfig', JSON.stringify(current));
      setTimeout(() => {
        window.dispatchEvent(new Event('storage'));
      }, 0);
      
      setPasswordSaved(true);
      setPasswordError('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordConfirmModal(false);
      setTimeout(() => setPasswordSaved(false), 5000);
    } catch {
      setPasswordError('Could not save password to storage.');
      setShowPasswordConfirmModal(false);
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

  const handleInitiateEscalationSave = () => {
    setShowEscalationConfirmModal(true);
  };

  const handleConfirmEscalationSave = async () => {
    setIsSaving(true);
    setShowEscalationConfirmModal(false);
    setEscalationSaveError(null);
    try {
      await updateSettings(localSettings);
      setEscalationSaved(true);
      setTimeout(() => setEscalationSaved(false), 5000);
    } catch (err: any) {
      setEscalationSaveError(err?.message || 'Failed to update escalation settings.');
    } finally {
      setIsSaving(false);
    }
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

                {/* ── AI Assistant & Multi-Engine Configuration Card ── */}
                <div className="settings-card" style={{ marginTop: 20 }}>
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <div className="settings-row-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sparkles size={18} style={{ color: 'var(--accent)' }} />
                        <span>AI Assistant & Multi-Engine Configuration</span>
                      </div>
                      <p className="settings-row-desc">
                        Manage default AI models, multi-provider auto-fallback chains, and optional personal API keys.
                      </p>
                    </div>
                  </div>

                  {/* Engine Selection */}
                  <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'block' }}>
                      Preferred AI Model
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                      {[
                        { id: 'auto', name: 'Gemini 1.5 Flash', badge: 'Default Flagship', desc: 'Standard next-gen model for structured task extraction' },
                      ].map((m) => {
                        const isSelected = preferredAiModel === m.id || (m.id === 'auto' && preferredAiModel === 'auto');
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSaveAiModel(m.id)}
                            style={{
                              background: isSelected ? 'rgba(0, 255, 102, 0.08)' : 'var(--bg-elevated)',
                              border: isSelected ? '1.5px solid var(--accent, #00ff66)' : '1px solid var(--border)',
                              borderRadius: '8px',
                              padding: '12px 14px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                                {m.name}
                              </span>
                              <span style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: isSelected ? 'var(--accent)' : 'var(--bg-surface)',
                                color: isSelected ? '#000' : 'var(--text-muted)'
                              }}>
                                {m.badge}
                              </span>
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                              {m.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Personal Free API Key */}
                  <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.01)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Key size={15} style={{ color: '#38bdf8' }} />
                        <span>Personal API Key (Optional — Never Hits Shared Quotas)</span>
                      </label>
                      {aiKeySaved && (
                        <span style={{ fontSize: 12, color: 'var(--completed)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={14} /> Key saved to browser
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                      Paste your own free Google Gemini API key to bypass shared limits. Stored safely only in your browser storage.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="password"
                        placeholder="AIzaSy... or AQ.Ab8..."
                        value={customAiKey}
                        onChange={(e) => setCustomAiKey(e.target.value)}
                        style={{
                          flex: 1,
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          padding: '8px 12px',
                          fontSize: 12,
                          color: 'var(--text-primary)',
                          fontFamily: 'monospace',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCustomAiKey(customAiKey)}
                        style={{
                          background: 'var(--accent, #00ff66)',
                          color: '#000',
                          border: 'none',
                          borderRadius: 6,
                          padding: '8px 16px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Save size={14} /> Save Key
                      </button>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                      >
                        Get free Google Gemini API key (Google AI Studio) <ExternalLink size={12} />
                      </a>
                    </div>
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
                    {/* Escalation Success Alert */}
                    {escalationSaved && (
                      <div className="app-inline-alert app-inline-alert-success animate-fade-in" role="status">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircle2 size={18} />
                          <span>Escalation policies saved and synchronized successfully!</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEscalationSaved(false)}
                          style={{ background: 'transparent', border: 'none', color: 'currentColor', cursor: 'pointer', padding: 2 }}
                          aria-label="Dismiss alert"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}

                    {/* Escalation Error Alert */}
                    {escalationSaveError && (
                      <div style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 59, 48, 0.1)',
                        border: '1px solid var(--high)',
                        borderRadius: 'var(--radius-md, 6px)',
                        color: 'var(--high)',
                        fontSize: 13,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <AlertTriangle size={18} />
                        <span>{escalationSaveError}</span>
                      </div>
                    )}

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
                        onClick={handleInitiateEscalationSave}
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
                    <div className="app-inline-alert app-inline-alert-success animate-fade-in" role="status">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={16} />
                        <span>Notification preferences updated successfully</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifSaved(false)}
                        style={{ background: 'transparent', border: 'none', color: 'currentColor', cursor: 'pointer', padding: 2 }}
                        aria-label="Dismiss alert"
                      >
                        <X size={15} />
                      </button>
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
                  {/* Password Success Alert Banner */}
                  {passwordSaved && (
                    <div className="app-inline-alert app-inline-alert-success animate-fade-in" role="status">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={18} />
                        <span>Master Application Password updated successfully! Your workspace is secured.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPasswordSaved(false)}
                        style={{ background: 'transparent', border: 'none', color: 'currentColor', cursor: 'pointer', padding: 2 }}
                        aria-label="Dismiss message"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {/* Password Error Alert Banner */}
                  {passwordError && (
                    <div className="app-inline-alert app-inline-alert-danger animate-fade-in" role="alert">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={18} />
                        <span>{passwordError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPasswordError('')}
                        style={{ background: 'transparent', border: 'none', color: 'currentColor', cursor: 'pointer', padding: 2 }}
                        aria-label="Dismiss error"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {/* Master Password Form */}
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <div className="settings-row-title">Master Application Password</div>
                      <p className="settings-row-desc">
                        Change the secret code required to unlock your workspace. Requires at least 4 characters.
                      </p>
                    </div>
                    
                    <form 
                      onSubmit={handleInitiatePasswordUpdate} 
                      className="settings-password-form"
                    >
                      {/* New Password Input */}
                      <div className="settings-password-input-wrap">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="New password (min 4 characters)…"
                          className="input"
                          value={newPassword}
                          style={{ width: '100%', fontSize: 14, padding: '9px 36px 9px 12px' }}
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

                      {/* Confirm New Password Input */}
                      <div className="settings-password-input-wrap">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password…"
                          className="input"
                          value={confirmPassword}
                          style={{ width: '100%', fontSize: 14, padding: '9px 36px 9px 12px' }}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (passwordError) setPasswordError('');
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ fontSize: 13, padding: '9px 20px', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}
                      >
                        Update Password
                      </button>
                    </form>
                  </div>

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
                          const val = parseInt(e.target.value);
                          const current = JSON.parse(localStorage.getItem('securityConfig') || '{"password":"Sushant2026@","timeoutMs":300000}');
                          current.timeoutMs = val;
                          localStorage.setItem('securityConfig', JSON.stringify(current));
                          setTimeout(() => {
                            window.dispatchEvent(new Event('storage'));
                          }, 0);
                          const minutes = Math.round(val / 60000);
                          setTimeoutSavedMsg(`Auto-lock inactivity timeout set to ${minutes} minute${minutes > 1 ? 's' : ''}.`);
                          setTimeoutSaved(true);
                          setTimeout(() => setTimeoutSaved(false), 4000);
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
                          setTimeout(() => {
                            window.dispatchEvent(new Event('storage'));
                          }, 0);
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
      {/* Timeout feedback toast pop */}
      {timeoutSaved && (
        <div className="app-toast app-toast-success" role="status">
          <div className="app-toast-icon">
            <CheckCircle2 size={16} />
          </div>
          <span className="app-toast-text">{timeoutSavedMsg}</span>
          <button
            type="button"
            className="app-toast-dismiss"
            onClick={() => setTimeoutSaved(false)}
            aria-label="Dismiss toast"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Password Update Confirmation Modal */}
      {showPasswordConfirmModal && (
        <div
          className="app-dialog-overlay"
          onClick={() => setShowPasswordConfirmModal(false)}
        >
          <div
            className="app-dialog-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <div className="app-dialog-accent-bar app-dialog-accent-primary" />

            <div className="app-dialog-header">
              <div className="app-dialog-header-left">
                <div className="app-dialog-icon-wrap app-dialog-icon-primary">
                  <Shield style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div className="app-dialog-eyebrow app-dialog-eyebrow-primary">
                    Security Verification
                  </div>
                  <h3 className="app-dialog-title">Confirm Password Update</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordConfirmModal(false)}
                className="app-dialog-close-btn"
                aria-label="Close"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="app-dialog-body">
              <p className="app-dialog-desc">
                Are you sure you want to update your Master Application Password? You will need this new password to unlock your workspace.
              </p>

              <div className="app-dialog-card" style={{ margin: 0 }}>
                <div className="app-dialog-row">
                  <span className="app-dialog-label">New Password:</span>
                  <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>
                    {newPassword}
                  </span>
                </div>
              </div>
            </div>

            <div className="app-dialog-footer">
              <button
                type="button"
                className="app-dialog-btn-cancel"
                onClick={() => setShowPasswordConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app-dialog-btn-action app-dialog-btn-primary"
                onClick={handleConfirmPasswordUpdate}
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Policies Confirmation Modal */}
      {showEscalationConfirmModal && (
        <div
          className="app-dialog-overlay"
          onClick={() => setShowEscalationConfirmModal(false)}
        >
          <div
            className="app-dialog-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460 }}
          >
            <div className="app-dialog-accent-bar app-dialog-accent-amber" />

            <div className="app-dialog-header">
              <div className="app-dialog-header-left">
                <div className="app-dialog-icon-wrap app-dialog-icon-amber">
                  <AlertTriangle style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div className="app-dialog-eyebrow app-dialog-eyebrow-amber">
                    Policy Configuration
                  </div>
                  <h3 className="app-dialog-title">Save Escalation Policies?</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEscalationConfirmModal(false)}
                className="app-dialog-close-btn"
                aria-label="Close"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="app-dialog-body">
              <p className="app-dialog-desc">
                Are you sure you want to update and apply these escalation alert settings?
              </p>

              <div className="app-dialog-card" style={{ margin: 0, gap: 10 }}>
                <div className="app-dialog-row">
                  <span className="app-dialog-label">Status:</span>
                  <span style={{ fontWeight: 700, color: localSettings.enabled ? 'var(--completed)' : 'var(--text-secondary)' }}>
                    {localSettings.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="app-dialog-row">
                  <span className="app-dialog-label">Follow-up Threshold:</span>
                  <span className="app-dialog-value">
                    {localSettings.threshold} follow-ups
                  </span>
                </div>
                {localSettings.managerEmail && (
                  <div className="app-dialog-row">
                    <span className="app-dialog-label">Manager Email:</span>
                    <span className="app-dialog-value">{localSettings.managerEmail}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="app-dialog-footer">
              <button
                type="button"
                className="app-dialog-btn-cancel"
                onClick={() => setShowEscalationConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app-dialog-btn-action app-dialog-btn-amber"
                onClick={handleConfirmEscalationSave}
              >
                Save Policies
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
