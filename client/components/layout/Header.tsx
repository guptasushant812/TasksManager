'use client';
import { useState, useRef, useEffect } from 'react';
import { TaskFilters } from '@/types/task';
import NewTaskModal from '../modals/NewTaskModal';
import ShareModal from '../modals/ShareModal';
import { ChevronRight, Bell, Plus, X, AlertTriangle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  const taskContext = useTaskContext();
  const summary = taskContext?.summary;
  const overdueCount = summary?.overdueFollowUps || 0;
  const escalatedCount = summary?.escalatedTasks || 0;
  const totalAlerts = overdueCount + escalatedCount;

  const getPageName = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/tasks') return 'Tasks';
    if (pathname === '/follow-ups') return 'Follow-Ups';
    if (pathname === '/settings') return 'Settings';
    if (pathname === '/help') return 'Help';
    return '';
  };

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
      <header style={{
        height: 64,
        borderBottom: '1px solid var(--border)',
        boxSizing: 'border-box',
        background: 'var(--bg-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(16px, 3vw, 24px)',
        gap: 12,
      }}>
        {/* Current Page Title */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }} aria-label="Current page">
          <span
            style={{
              color: 'var(--text-primary)',
              fontWeight: 900,
              fontSize: 15,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {getPageName()}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-ghost brutalist-hover"
            onClick={() => setShowShareModal(true)}
            style={{
              height: 36,
              padding: '0 14px',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            Share
          </button>

          <button
            id="btn-new-task"
            className="btn btn-primary brutalist-hover"
            onClick={() => setShowModal(true)}
            style={{
              height: 36,
              padding: '0 14px',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxSizing: 'border-box',
            }}
          >
            <Plus style={{ width: 14, height: 14, strokeWidth: 3 }} />
            <span>New Task</span>
          </button>

          {/* Notification bell & popover */}
          <div ref={notifRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label={`Notifications${totalAlerts > 0 ? ` (${totalAlerts} active alerts)` : ''}`}
              title={totalAlerts > 0 ? `${totalAlerts} items require attention` : 'Notifications'}
              className="brutalist-hover"
              style={{
                width: 36,
                height: 36,
                background: notifOpen ? 'var(--bg-hover)' : 'var(--bg-surface)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                padding: 0,
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: notifOpen ? 'none' : 'var(--box-shadow-brutalist-sm)',
                position: 'relative',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
                flexShrink: 0,
              }}
            >
              <Bell style={{ width: 16, height: 16, strokeWidth: 2.2 }} />
              {totalAlerts > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: overdueCount > 0 ? 'var(--high)' : 'var(--accent)',
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 700,
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--bg-surface)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
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
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="User menu"
              className="brutalist-hover"
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--medium)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 900,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                boxShadow: profileOpen ? 'none' : 'var(--box-shadow-brutalist-sm)',
                boxSizing: 'border-box',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
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
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
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
