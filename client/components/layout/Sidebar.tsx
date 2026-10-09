'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, PhoneCall, Settings, HelpCircle, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

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

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Hide sidebar on public status pages
  if (pathname?.startsWith('/status/')) return null;

  return (
    <>
      {!mobileOpen && (
        <button
          type="button"
          className="sidebar-mobile-toggle lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Toggle navigation"
          aria-expanded={false}
        >
          <Menu className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
        </button>
      )}

      {mobileOpen && (
        <div
          className="sidebar-mobile-overlay lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar fixed inset-y-0 left-0 z-[70] transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="app-sidebar-brand">
          <Link
            href="/"
            className="group/brand"
            style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flex: 1, minWidth: 0 }}
            onClick={() => setMobileOpen(false)}
          >
            <span
              className="relative flex items-center justify-center overflow-hidden"
              style={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-taste-sm)',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-192.png"
                alt="TasksManager Logo"
                width={26}
                height={26}
                className="transition-transform duration-300 group-hover/brand:scale-110"
                style={{
                  width: 26,
                  height: 26,
                  objectFit: 'contain',
                }}
              />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 15, fontWeight: 750, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                TasksManager
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
                Workbench
              </span>
            </div>
          </Link>

          <button
            type="button"
            className="sidebar-drawer-close lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="app-sidebar-nav">
          <div className="app-sidebar-eyebrow">
            Navigation
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

        <div className="app-sidebar-bottom">
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
