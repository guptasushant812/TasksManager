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
        className={`fixed inset-y-0 left-0 z-[70] transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        style={{
          width: 'var(--sidebar-width)',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Brand */}
        <div style={{
          height: 64,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-192.png"
              alt="TasksManager Logo"
              width={32}
              height={32}
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                objectFit: 'contain',
              }}
            />
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              TasksManager
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 12px' }}>
          <div style={{
            padding: '0 14px',
            marginBottom: 10,
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Navigation
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
                  <div className={`nav-item ${isActive ? 'active' : ''}`}>
                    <item.icon style={{ width: 18, height: 18 }} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom nav */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {BOTTOM_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
                  <div className={`nav-item ${isActive ? 'active' : ''}`}>
                    <item.icon style={{ width: 18, height: 18 }} />
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
