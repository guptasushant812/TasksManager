'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { TaskFilters, WorkStatus } from '@/types/task';
import NewTaskModal from '../modals/NewTaskModal';
import ShareModal from '../modals/ShareModal';
import { 
  Bell, 
  Plus, 
  X, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Share2, 
  Sliders, 
  Info,
  Lock,
  LogOut
} from 'lucide-react';
import { useTaskContext } from '@/context/TaskContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  filters: TaskFilters;
  onTaskCreated: () => void;
}

interface NotificationPreferences {
  overdueAlerts: boolean;
  escalationAlerts: boolean;
  soundAlerts: boolean;
  dailyDigest: boolean;
}

const DEFAULT_NOTIF_PREFS: NotificationPreferences = {
  overdueAlerts: true,
  escalationAlerts: true,
  soundAlerts: false,
  dailyDigest: true,
};

export default function Header({ filters, onTaskCreated }: HeaderProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifPreferences, setNotifPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIF_PREFS);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const taskContext = useTaskContext();
  const summary = taskContext?.summary;
  const overdueCount = summary?.overdueFollowUps || 0;
  const escalatedCount = summary?.escalatedTasks || 0;

  // Sync notification preferences from settings
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const saved = localStorage.getItem('notificationPreferences');
        if (saved) {
          const parsed = JSON.parse(saved);
          setNotifPreferences(prev => ({ ...prev, ...parsed }));
        }
      } catch {}
    };

    loadPreferences();

    const handleExternalChange = () => {
      setTimeout(loadPreferences, 0);
    };

    window.addEventListener('storage', handleExternalChange);
    window.addEventListener('notificationPreferencesChanged', handleExternalChange);
    return () => {
      window.removeEventListener('storage', handleExternalChange);
      window.removeEventListener('notificationPreferencesChanged', handleExternalChange);
    };
  }, []);

  // Only show alerts enabled in settings
  const showOverdue = notifPreferences.overdueAlerts && overdueCount > 0;
  const showEscalated = notifPreferences.escalationAlerts && escalatedCount > 0;
  const activeAlertsCount = (showOverdue ? overdueCount : 0) + (showEscalated ? escalatedCount : 0);
  const isAnyAlertMuted = !notifPreferences.overdueAlerts || !notifPreferences.escalationAlerts;
  const activeTasksCount = (summary?.inProgress || 0) + (summary?.pending || 0);

  // Play audio cue if enabled in settings
  const playChime = useCallback((type: 'alert' | 'clear') => {
    if (!notifPreferences.soundAlerts || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'alert') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      } else {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
      }
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  }, [notifPreferences.soundAlerts]);

  const toggleNotifOpen = () => {
    const nextState = !notifOpen;
    setNotifOpen(nextState);
    if (nextState) {
      playChime(activeAlertsCount > 0 ? 'alert' : 'clear');
    }
  };

  const handleStatusFilter = (status: WorkStatus) => {
    setNotifOpen(false);
    if (taskContext?.handleStatusClick) {
      taskContext.handleStatusClick(status);
    }
  };

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent | TouchEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }
    if (profileOpen || notifOpen) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('touchstart', handleClick, { passive: true });
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen, notifOpen]);

  return (
    <>
      <header className="app-header sticky top-0 z-40">
        <div className="header-actions">
          <div className="header-actions-group">
            <button
              type="button"
              className="header-btn header-btn-share"
              onClick={() => setShowShareModal(true)}
              title="Share Public Link"
              aria-label="Share"
            >
              <Share2 className="header-share-icon" style={{ width: 15, height: 15, strokeWidth: 2.5, flexShrink: 0 }} />
              <span className="header-share-text">Share</span>
            </button>

            <button
              id="btn-new-task"
              type="button"
              className="header-btn header-btn-new-task"
              onClick={() => setShowModal(true)}
              title="Create New Task"
            >
              <Plus style={{ width: 16, height: 16, strokeWidth: 3, flexShrink: 0 }} />
              <span className="header-new-task-text">
                <span className="header-new-task-word">New </span>Task
              </span>
            </button>
          </div>

          <div className="header-divider" role="separator" aria-orientation="vertical" />

          <div className="header-utility-group">
            <div ref={notifRef} className="header-notif-wrapper">
              <button
                type="button"
                className={`header-btn header-notif-btn ${notifOpen ? 'is-open' : ''}`}
                onClick={toggleNotifOpen}
                aria-label={`Notifications${activeAlertsCount > 0 ? ` (${activeAlertsCount} active alerts)` : ''}`}
                title={activeAlertsCount > 0 ? `${activeAlertsCount} items require attention` : 'Notifications'}
                aria-expanded={notifOpen}
                aria-haspopup="dialog"
              >
                <Bell style={{ width: 18, height: 18, strokeWidth: 2.5 }} />
                {activeAlertsCount > 0 && (
                  <span className="header-notif-badge">
                    {activeAlertsCount > 9 ? '9+' : activeAlertsCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  className="header-notif-dropdown"
                  role="region"
                  aria-label="Notification Center"
                >
                  <div className="header-notif-header">
                    <div className="header-notif-title-wrap">
                      <Bell className="header-notif-title-icon" />
                      <h2 className="header-notif-title">
                        Notification Center
                      </h2>
                    </div>
                    <div className="header-notif-header-actions">
                      {activeAlertsCount > 0 ? (
                        <span className="header-notif-status-badge is-alert">
                          {activeAlertsCount} Alert{activeAlertsCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="header-notif-status-badge is-clear">
                          All clear
                        </span>
                      )}
                      <button
                        type="button"
                        className="header-notif-close-btn"
                        onClick={() => setNotifOpen(false)}
                        aria-label="Close notification center"
                        title="Close"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="header-notif-list">
                    {showOverdue && (
                      <Link
                        href="/follow-ups"
                        onClick={() => setNotifOpen(false)}
                        className="header-notif-item is-overdue"
                      >
                        <Clock className="header-notif-item-icon text-high" />
                        <div className="header-notif-item-content">
                          <div className="header-notif-item-title text-high">
                            {overdueCount} Overdue Follow-Up{overdueCount > 1 ? 's' : ''}
                          </div>
                          <div className="header-notif-item-desc">
                            Scheduled follow-up dates passed without resolution.
                          </div>
                        </div>
                        <ArrowRight className="header-notif-item-arrow text-high" />
                      </Link>
                    )}

                    {showEscalated && (
                      <Link
                        href="/tasks"
                        onClick={() => setNotifOpen(false)}
                        className="header-notif-item is-escalated"
                      >
                        <AlertTriangle className="header-notif-item-icon text-medium" />
                        <div className="header-notif-item-content">
                          <div className="header-notif-item-title text-medium">
                            {escalatedCount} Escalated Task{escalatedCount > 1 ? 's' : ''}
                          </div>
                          <div className="header-notif-item-desc">
                            Tasks reached or exceeded escalation limits.
                          </div>
                        </div>
                        <ArrowRight className="header-notif-item-arrow text-medium" />
                      </Link>
                    )}

                    {notifPreferences.dailyDigest && (
                      <div className="header-notif-digest">
                        <div className="header-notif-digest-header">
                          <span className="header-notif-digest-title">Work Snapshot</span>
                          <span className="header-notif-digest-badge">Daily Digest</span>
                        </div>
                        <div className="header-notif-digest-grid">
                          <Link
                            href="/tasks?status=Pending"
                            onClick={() => handleStatusFilter('Pending')}
                            className="header-notif-digest-pill is-pending"
                            title="Filter Pending Tasks"
                          >
                            <span className="header-notif-digest-dot" />
                            <span className="header-notif-digest-label">Pending</span>
                            <span className="header-notif-digest-num">{summary?.pending || 0}</span>
                          </Link>
                          <Link
                            href="/tasks?status=InProgress"
                            onClick={() => handleStatusFilter('InProgress')}
                            className="header-notif-digest-pill is-inprogress"
                            title="Filter In-Progress Tasks"
                          >
                            <span className="header-notif-digest-dot" />
                            <span className="header-notif-digest-label">In Progress</span>
                            <span className="header-notif-digest-num">{summary?.inProgress || 0}</span>
                          </Link>
                          <Link
                            href="/tasks?status=Completed"
                            onClick={() => handleStatusFilter('Completed')}
                            className="header-notif-digest-pill is-completed"
                            title="Filter Completed Tasks"
                          >
                            <span className="header-notif-digest-dot" />
                            <span className="header-notif-digest-label">Done</span>
                            <span className="header-notif-digest-num">{summary?.completed || 0}</span>
                          </Link>
                        </div>
                      </div>
                    )}

                    {activeAlertsCount === 0 && !notifPreferences.dailyDigest && (
                      <div className="header-notif-empty">
                        <CheckCircle2 className="header-notif-empty-icon" />
                        <span className="header-notif-empty-title">
                          All tasks &amp; follow-ups on track
                        </span>
                        <span className="header-notif-empty-desc">
                          No overdue milestones or threshold alerts.
                        </span>
                      </div>
                    )}

                    {isAnyAlertMuted && (
                      <div className="header-notif-muted-notice">
                        <Info size={12} className="header-notif-muted-icon" />
                        <span>
                          {!notifPreferences.overdueAlerts && !notifPreferences.escalationAlerts
                            ? 'Overdue & Escalation alerts muted'
                            : !notifPreferences.overdueAlerts
                              ? 'Overdue alerts muted'
                              : 'Escalation alerts muted'}
                          {' in Settings'}
                        </span>
                      </div>
                    )}

                    <div className="header-notif-footer">
                      <Link
                        href="/settings?tab=notifications"
                        onClick={() => setNotifOpen(false)}
                        className="header-notif-settings-link"
                        title="Configure Notification Preferences in Settings"
                      >
                        <Sliders size={12} />
                        <span>Configure in Settings</span>
                      </Link>
                      <span className="header-notif-active-summary">
                        Active: <strong>{activeTasksCount} {activeTasksCount === 1 ? 'task' : 'tasks'}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className={`header-btn header-user-btn ${profileOpen ? 'is-open' : ''}`}
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="User menu"
            >
              SG
            </button>

            {profileOpen && (
              <div
                className="animate-slide-down"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 12px)',
                  zIndex: 50,
                  width: 240,
                  maxWidth: 'calc(100vw - 24px)',
                  background: 'var(--bg-surface)',
                  border: 'var(--border-width-layout) solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--box-shadow-brutalist)',
                  overflow: 'hidden',
                  padding: '12px',
                }}
              >
                <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Sushant Gupta</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Workspace Admin</div>
                </div>

                <Link href="/settings" onClick={() => setProfileOpen(false)} style={{ textDecoration: 'none' }}>
                  <button
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: 500,
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <Sliders size={15} style={{ marginRight: 8, opacity: 0.85 }} />
                    Settings
                  </button>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    if (typeof window !== 'undefined') {
                      const currentPath = window.location.pathname + window.location.search;
                      if (currentPath && currentPath !== '/') {
                        sessionStorage.setItem('lockedReturnUrl', currentPath);
                      }
                    }
                    localStorage.setItem('isAppLocked', 'true');
                    window.dispatchEvent(new Event('storage'));
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <Lock size={15} style={{ marginRight: 8, opacity: 0.85 }} />
                  Lock Workspace
                </button>

                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('lockedReturnUrl');
                    }
                    localStorage.setItem('isAppLocked', 'true');
                    window.dispatchEvent(new Event('storage'));
                    router.replace('/');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    color: 'var(--high)',
                    fontSize: 13,
                    fontWeight: 500,
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--high-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <LogOut size={15} style={{ marginRight: 8, opacity: 0.85 }} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

      {showShareModal && (
        <div
          className="modal-overlay share-modal-overlay"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="modal-box share-modal-box"
            style={{
              maxWidth: 520,
              padding: '24px 26px',
              borderRadius: 'var(--radius-xl)',
              background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.05), transparent 70%), var(--bg-surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 34,
                    height: 34,
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.28)',
                    color: '#10b981',
                  }}
                >
                  <Share2 style={{ width: 16, height: 16 }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  Share Public Link
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="brutalist-hover"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all 0.15s ease',
                }}
                aria-label="Close"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <ShareModal onClose={() => setShowShareModal(false)} />
          </div>
        </div>
      )}

      {showModal && (
        <NewTaskModal
          defaultFilters={filters}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); onTaskCreated(); }}
        />
      )}
    </>
  );
}
