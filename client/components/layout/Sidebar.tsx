'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, PhoneCall, Settings, HelpCircle, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Follow-Ups', href: '/follow-ups', icon: PhoneCall },
];

const BOTTOM_ITEMS = [
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Help', href: '/help', icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide sidebar on public status pages
  if (pathname?.startsWith('/status/')) return null;

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-[70] p-2 rounded-lg"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? (
          <X className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
        ) : (
          <Menu className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 65 }}
          className="lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: 'var(--sidebar-width)',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          borderRight: '4px solid var(--border)',
          boxShadow: '4px 0px 0px 0px var(--border)',
        }}
      >
        {/* Brand */}
        <div style={{
          height: 64,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '4px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              background: 'var(--accent)',
              border: '4px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 900,
              color: '#000',
              boxShadow: '2px 2px 0px 0px var(--border)',
            }}>
              T
            </div>
            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TasksManager
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
          <div style={{
            padding: '0 8px',
            marginBottom: 12,
            fontSize: 12,
            fontWeight: 900,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Navigation
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: isActive ? 'var(--bg-hover)' : 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontWeight: 900,
                    fontSize: 14,
                    textTransform: 'uppercase',
                    transition: 'all 0.1s',
                    border: '4px solid var(--border)',
                    boxShadow: isActive ? '4px 4px 0px 0px var(--border)' : 'none',
                    transform: isActive ? 'translate(-2px, -2px)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                      e.currentTarget.style.transform = 'translate(-2px, -2px)';
                      e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-surface)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translate(2px, 2px)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onMouseUp={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'translate(-2px, -2px)';
                      e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)';
                    }
                  }}>
                    <item.icon style={{ width: 18, height: 18, strokeWidth: 3 }} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom nav */}
        <div style={{ padding: '24px 16px', borderTop: '4px solid var(--border)' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {BOTTOM_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: isActive ? 'var(--bg-hover)' : 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontWeight: 900,
                    fontSize: 14,
                    textTransform: 'uppercase',
                    transition: 'all 0.1s',
                    border: '4px solid var(--border)',
                    boxShadow: isActive ? '4px 4px 0px 0px var(--border)' : 'none',
                    transform: isActive ? 'translate(-2px, -2px)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                      e.currentTarget.style.transform = 'translate(-2px, -2px)';
                      e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-surface)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translate(2px, 2px)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onMouseUp={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'translate(-2px, -2px)';
                      e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)';
                    }
                  }}>
                    <item.icon style={{ width: 18, height: 18, strokeWidth: 3 }} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
