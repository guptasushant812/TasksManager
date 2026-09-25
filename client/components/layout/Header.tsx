'use client';
import { useState, useRef, useEffect } from 'react';
import { TaskFilters } from '@/types/task';
import NewTaskModal from '../modals/NewTaskModal';
import ShareModal from '../modals/ShareModal';
import { ChevronRight, Bell, Plus, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  filters: TaskFilters;
  onTaskCreated: () => void;
}

export default function Header({ filters, onTaskCreated }: HeaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const getPageName = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/tasks') return 'Tasks';
    if (pathname === '/follow-ups') return 'Follow-Ups';
    if (pathname === '/settings') return 'Settings';
    if (pathname === '/help') return 'Help';
    return '';
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  return (
    <>
      <header style={{
        height: 56,
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-base)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', fontSize: 13 }} aria-label="Breadcrumb">
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>TasksManager</span>
          <ChevronRight style={{ width: 14, height: 14, margin: '0 6px', color: 'var(--text-muted)', opacity: 0.5 }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{getPageName()}</span>
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowShareModal(true)}
            style={{ fontSize: 13, padding: '6px 12px', height: 32 }}
          >
            Share
          </button>

          <button
            id="btn-new-task"
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            style={{ fontSize: 13, padding: '6px 14px', height: 32 }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            New Task
          </button>

          {/* Notification bell */}
          <button
            type="button"
            aria-label="Notifications"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Bell style={{ width: 18, height: 18 }} />
          </button>

          {/* Profile avatar */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="User menu"
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              AG
            </button>

            {profileOpen && (
              <div
                className="animate-slide-down"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  zIndex: 50,
                  width: 240,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                  padding: '8px',
                }}
              >
                {/* User info */}
                <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Antigravity</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Workspace Admin</div>
                </div>

                {[
                  { label: 'Settings', href: '/settings' },
                  { label: 'Logout', href: '#' },
                ].map((item) => (
                  <button
                    key={item.label}
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
