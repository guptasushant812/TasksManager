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

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (profileOpen || notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
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
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className={`header-btn header-notif-btn ${notifOpen ? 'is-open' : ''}`}
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label={`Notifications${totalAlerts > 0 ? ` (${totalAlerts} active alerts)` : ''}`}
                title={totalAlerts > 0 ? `${totalAlerts} items require attention` : 'Notifications'}
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
                className="animate-slide-down card"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 10px)',
                  zIndex: 60,
                  width: 320,
                  maxWidth: 'calc(100vw - 24px)',
                  padding: 16,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 8px)',
                  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell style={{ width: 15, height: 15, color: 'var(--text-primary)' }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Notification Center
                    </span>
                  </div>
                  {totalAlerts > 0 ? (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'var(--high-bg, #fee2e2)', color: 'var(--high)' }}>
                      {totalAlerts} Alert{totalAlerts > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: 'var(--low-bg, #dcfce7)', color: 'var(--low)' }}>
                      All clear
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {overdueCount > 0 && (
                    <Link
                      href="/follow-ups"
                      onClick={() => setNotifOpen(false)}
                      style={{
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: 10,
                        background: 'var(--high-bg, #fee2e2)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 6,
                        color: 'var(--text-primary)',
                        transition: 'transform 0.1s ease',
                      }}
                    >
                      <Clock style={{ width: 16, height: 16, color: 'var(--high)', flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--high)' }}>
                          {overdueCount} Overdue Follow-Up{overdueCount > 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                          Scheduled dates passed without logged resolution.
                        </div>
                      </div>
                      <ArrowRight style={{ width: 14, height: 14, color: 'var(--high)', alignSelf: 'center' }} />
                    </Link>
                  )}

                  {escalatedCount > 0 && (
                    <Link
                      href="/tasks"
                      onClick={() => setNotifOpen(false)}
                      style={{
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: 10,
                        background: 'var(--medium-bg, #fef9c3)',
                        border: '1px solid rgba(234, 179, 8, 0.25)',
                        borderRadius: 6,
                        color: 'var(--text-primary)',
                        transition: 'transform 0.1s ease',
                      }}
                    >
                      <AlertTriangle style={{ width: 16, height: 16, color: 'var(--medium)', flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--medium)' }}>
                          {escalatedCount} Escalated Task{escalatedCount > 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                          Tasks reached or exceeded escalation limits.
                        </div>
                      </div>
                      <ArrowRight style={{ width: 14, height: 14, color: 'var(--medium)', alignSelf: 'center' }} />
                    </Link>
                  )}

                  {totalAlerts === 0 && (
                    <div style={{ padding: '16px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 style={{ width: 24, height: 24, color: 'var(--completed)' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                        All tasks & follow-ups on track
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        No overdue milestones or threshold alerts.
                      </span>
                    </div>
                  )}

                  <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>Active tasks:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {(summary?.inProgress || 0) + (summary?.pending || 0)} tasks
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
