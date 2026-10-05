'use client';
import { useState, useRef, useEffect } from 'react';
import { TaskFilters } from '@/types/task';
import NewTaskModal from '../modals/NewTaskModal';
import ShareModal from '../modals/ShareModal';
import { Bell, Plus, X, AlertTriangle, Clock, CheckCircle2, ArrowRight, Share2 } from 'lucide-react';
import { useTaskContext } from '@/context/TaskContext';
import Link from 'next/link';

interface HeaderProps {
  filters: TaskFilters;
  onTaskCreated: () => void;
}

export default function Header({ filters, onTaskCreated }: HeaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const taskContext = useTaskContext();
  const summary = taskContext?.summary;
  const overdueCount = summary?.overdueFollowUps || 0;
  const escalatedCount = summary?.escalatedTasks || 0;
  const totalAlerts = overdueCount + escalatedCount;
  const activeTasksCount = (summary?.inProgress || 0) + (summary?.pending || 0);

  // Close dropdowns on outside click, touch, or Escape key
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
      <header className="app-header">
        {/* Actions */}
        <div className="header-actions">
          {/* Workspace Action Group */}
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

          {/* Visual Divider between workspace actions and personal utilities */}
          <div className="header-divider" role="separator" aria-orientation="vertical" />

          {/* Personal Utility Group */}
          <div className="header-utility-group">
            {/* Notification bell & popover */}
            <div ref={notifRef} className="header-notif-wrapper">
              <button
                type="button"
                className={`header-btn header-notif-btn ${notifOpen ? 'is-open' : ''}`}
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label={`Notifications${totalAlerts > 0 ? ` (${totalAlerts} active alerts)` : ''}`}
                title={totalAlerts > 0 ? `${totalAlerts} items require attention` : 'Notifications'}
                aria-expanded={notifOpen}
                aria-haspopup="dialog"
              >
                <Bell style={{ width: 18, height: 18, strokeWidth: 2.5 }} />
                {totalAlerts > 0 && (
                  <span className="header-notif-badge">
                    {totalAlerts > 9 ? '9+' : totalAlerts}
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
                      {totalAlerts > 0 ? (
                        <span className="header-notif-status-badge is-alert">
                          {totalAlerts} Alert{totalAlerts > 1 ? 's' : ''}
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
                    {overdueCount > 0 && (
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
                            Scheduled dates passed without logged resolution.
                          </div>
                        </div>
                        <ArrowRight className="header-notif-item-arrow text-high" />
                      </Link>
                    )}

                    {escalatedCount > 0 && (
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

                    {totalAlerts === 0 && (
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

                    <div className="header-notif-footer">
                      <span>Active tasks:</span>
                      <strong className="header-notif-footer-val">
                        {activeTasksCount} {activeTasksCount === 1 ? 'task' : 'tasks'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile avatar */}
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
                {/* User info */}
                <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Sushant Gupta</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Workspace Admin</div>
                </div>

                {[
                  { label: 'Settings', href: '/settings' },
                  { label: 'Logout', href: '#' },
                ].map((item) => (
                  <Link key={item.label} href={item.href} onClick={() => setProfileOpen(false)} style={{ textDecoration: 'none' }}>
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '8px 12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: item.label === 'Logout' ? 'var(--high)' : 'var(--text-secondary)',
                        fontSize: 13,
                        fontWeight: 400,
                        textAlign: 'left',
                        transition: 'all 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                        e.currentTarget.style.color = item.label === 'Logout' ? 'var(--high)' : 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = item.label === 'Logout' ? 'var(--high)' : 'var(--text-secondary)';
                      }}
                    >
                      {item.label}
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-box" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Share Public Link</h3>
              <button
                onClick={() => setShowShareModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 'var(--radius-sm)' }}
                aria-label="Close"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <ShareModal onClose={() => setShowShareModal(false)} />
          </div>
        </div>
      )}

      {/* New Task Modal */}
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
