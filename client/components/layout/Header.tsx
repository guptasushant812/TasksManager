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
        height: 64,
        borderBottom: '4px solid var(--border)',
        background: 'var(--bg-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(12px, 3vw, 24px)',
        gap: 8,
      }}>
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', fontSize: 16, minWidth: 0, overflow: 'hidden' }} aria-label="Breadcrumb">
          <span className="breadcrumb-prefix" style={{ color: 'var(--text-primary)', fontWeight: 900, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>TasksManager</span>
          <ChevronRight className="breadcrumb-prefix" style={{ width: 18, height: 18, margin: '0 6px', color: 'var(--text-primary)', strokeWidth: 3, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{getPageName()}</span>
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowShareModal(true)}
          >
            Share
          </button>

          <button
            id="btn-new-task"
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus style={{ width: 16, height: 16, strokeWidth: 3 }} />
            New Task
          </button>

          {/* Notification bell */}
          <button
            type="button"
            aria-label="Notifications"
            style={{
              background: 'var(--bg-surface)',
              border: '4px solid var(--border)',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '4px 4px 0px 0px var(--border)',
              transition: 'all 0.1s',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = 'none'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)'; }}
          >
            <Bell style={{ width: 18, height: 18, strokeWidth: 3 }} />
          </button>

          {/* Profile avatar */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="User menu"
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--medium)',
                border: '4px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 900,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                boxShadow: '4px 4px 0px 0px var(--border)',
                transition: 'all 0.1s',
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = 'none'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)'; }}
            >
              AG
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
                  border: '4px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '8px 8px 0px 0px var(--border)',
                  overflow: 'hidden',
                  padding: '12px',
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
