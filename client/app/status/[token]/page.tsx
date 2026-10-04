'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Task, Priority } from '@/types/task';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/dates';
import {
  Search,
  LayoutDashboard,
  CheckSquare,
  Activity,
  Timer,
  Target,
  Clock,
  Calendar,
  User,
  UserPlus,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  AlertCircle,
} from 'lucide-react';

interface PublicStatusData {
  all?: Task[];
  today: Task[];
  inProgress?: Task[];
  pending: Task[];
  completed: Task[];
  counts: {
    total: number;
    today: number;
    inProgress: number;
    pending: number;
    completed: number;
  };
  tasks?: Task[];
}

type TabType = 'today' | 'inProgress' | 'pending' | 'completed';

const ITEMS_PER_PAGE = 5;

export default function PublicStatusPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Default goal: show only today's tasks first
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [page, setPage] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTabSwitching, setIsTabSwitching] = useState(false);

  // Smooth scroll page and main container to top
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
      const mainEl = document.querySelector('.public-main');
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Tab change with top scroll & MNC-grade reload animation
  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    scrollToTop();
    setIsTabSwitching(true);
    setActiveTab(newTab);
    setMobileMenuOpen(false);
    setPage(1);
    setTimeout(() => {
      setIsTabSwitching(false);
    }, 320);
  };

  // Page change with top scroll & reload animation
  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage) return;
    scrollToTop();
    setIsTabSwitching(true);
    setPage(newPage);
    setTimeout(() => {
      setIsTabSwitching(false);
    }, 260);
  };

  // Theme synchronization: defaults to neo-dark theme ('dark') on first load,
  // or automatically applies whatever theme the user selected in settings (localStorage.theme).
  useEffect(() => {
    try {
      const applyTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        const themeToApply = savedTheme || 'dark';

        document.documentElement.setAttribute('data-theme', themeToApply);
        if (themeToApply === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      };

      applyTheme();
      window.addEventListener('storage', applyTheme);
      return () => window.removeEventListener('storage', applyTheme);
    } catch { }
  }, []);

  const fetchStatus = useCallback(async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const result = await apiFetch<PublicStatusData>(`/api/public/status/${token}`);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid link or access denied.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Periodic silent background sync every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchStatus(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Reset pagination whenever activeTab or search changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  // Raw list for currently selected category
  const rawTabTasks = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'today') return data.today || [];
    if (activeTab === 'inProgress') return data.inProgress || [];
    if (activeTab === 'pending') return data.pending || [];
    if (activeTab === 'completed') return data.completed || [];
    return [];
  }, [data, activeTab]);

  // Client-side search and latest-first sorting (TK-005, TK-004, etc.)
  const sortedAndFilteredTasks = useMemo(() => {
    let list = [...rawTabTasks];

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((t) =>
        (t.taskId && t.taskId.toLowerCase().includes(q)) ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.givenBy && t.givenBy.toLowerCase().includes(q)) ||
        (t.contactPerson && t.contactPerson.toLowerCase().includes(q)) ||
        (t.reason && t.reason.toLowerCase().includes(q)) ||
        (t.remarks && t.remarks.toLowerCase().includes(q))
      );
    }

    // Sort by taskId descending: higher/latest task ID number first (e.g. TK-005 before TK-004)
    list.sort((a, b) => {
      const idA = a.taskId || '';
      const idB = b.taskId || '';
      return idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
    });

    return list;
  }, [rawTabTasks, search]);

  // Pagination calculations: show only top 5 data per page
  const totalTasks = sortedAndFilteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalTasks / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedAndFilteredTasks, currentPage]);

  // Compute 5-page window: < 1 2 3 4 5 > without ellipsis jumps
  const visiblePages = useMemo(() => {
    const MAX_PAGES = 5;
    if (totalPages <= MAX_PAGES) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, currentPage - Math.floor(MAX_PAGES / 2));
    let end = start + MAX_PAGES - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - MAX_PAGES + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [totalPages, currentPage]);

  const activeTitle =
    activeTab === 'today' ? "Today's Focus" :
      activeTab === 'inProgress' ? "In Progress Tasks" :
        activeTab === 'pending' ? "Pending Queue" : "Completed Tasks";

  if (loading) {
    return (
      <div className="public-layout">
        {/* Mobile / Tablet Top Header Skeleton */}
        <header className="public-mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              background: 'var(--accent)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 900,
              color: '#000',
            }}>
              T
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', display: 'block', lineHeight: 1.2 }}>
                TasksManager
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Project Status
              </span>
            </div>
          </div>
        </header>

        <aside className="public-sidebar">
          <div style={{ height: '64px', padding: '0 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <div className="skeleton" style={{ width: 140, height: 24, borderRadius: 6 }} />
          </div>
          <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ width: '100%', height: 42, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: '100%', height: 42, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: '100%', height: 42, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: '100%', height: 42, borderRadius: 6 }} />
          </div>
        </aside>
        <main className="public-main">
          <div className="skeleton" style={{ width: '40%', height: 36, marginBottom: 12, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: '25%', height: 18, marginBottom: 36, borderRadius: 4 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ width: '100%', height: 140, borderRadius: 'var(--radius-lg, 8px)' }} />
            <div className="skeleton" style={{ width: '100%', height: 140, borderRadius: 'var(--radius-lg, 8px)' }} />
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 16 }}>
        <div className="card animate-slide-up" style={{ padding: '40px 32px', textAlign: 'center', maxWidth: 420, width: '100%', border: 'var(--border-width-layout, 1px) solid var(--border)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--high-bg, rgba(255, 51, 102, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--high)' }}>
            <AlertCircle style={{ width: 28, height: 28 }} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>Access Restricted</h2>
          <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
            {error || 'This public status link is inactive, private, or has expired.'}
          </p>
          <button className="btn btn-ghost" onClick={() => fetchStatus()}>
            <RefreshCw style={{ width: 14, height: 14 }} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const categoryTabs: { id: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    {
      id: 'today',
      label: "Today's Focus",
      icon: <Target style={{ width: 15, height: 15 }} />,
      count: data.counts.today,
    },
    {
      id: 'inProgress',
      label: 'In Progress',
      icon: <Activity style={{ width: 15, height: 15 }} />,
      count: data.counts.inProgress,
    },
    {
      id: 'pending',
      label: 'Pending',
      icon: <Timer style={{ width: 15, height: 15 }} />,
      count: data.counts.pending,
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: <CheckSquare style={{ width: 15, height: 15 }} />,
      count: data.counts.completed,
    },
  ];

  return (
    <div className="public-layout">
      {/* MNC-grade Top Loading Bar */}
      {isTabSwitching && (
        <div className="loading-bar">
          <div className="loading-bar-inner" />
        </div>
      )}

      {/* ── Mobile / Tablet Top Header: Always visible on load with brand logo & project status ── */}
      <header className="public-mobile-header animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34,
            height: 34,
            background: 'var(--accent)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            fontWeight: 900,
            color: '#000',
            boxShadow: '0 0 10px var(--accent-subtle)',
          }}>
            T
          </div>
          <div>
            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', display: 'block', lineHeight: 1.2 }}>
              TasksManager
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Project Status
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--completed)',
            display: 'inline-block',
            boxShadow: '0 0 6px var(--completed)',
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
            Live
          </span>
        </div>
      </header>

      {/* ── Desktop Sidebar Navigation (Hidden on Tablet / Mobile) ────────────────── */}
      <aside className="public-sidebar">
        {/* Brand Header matching main module style */}
        <div style={{
          height: '64px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              background: 'var(--accent)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 900,
              color: '#000',
            }}>
              T
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', display: 'block', lineHeight: 1.2 }}>
                TasksManager
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Project Status
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Categories matching main sidebar */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 12px', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '0 14px',
            marginBottom: 10,
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Categories
          </div>

          <nav className="public-sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {categoryTabs.map((cat) => (
              <SidebarButton
                key={cat.id}
                label={cat.label}
                icon={cat.icon}
                count={cat.count}
                active={activeTab === cat.id}
                onClick={() => handleTabChange(cat.id)}
              />
            ))}
          </nav>
        </div>

        {/* Bottom Status Information matching main module bottom area */}
        <div style={{ padding: '16px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'inline-block',
              boxShadow: '0 0 8px var(--accent)',
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
              Live Feed Active
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Read-only secure view • Real-time status
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <main className="public-main">
        {/* Content Header with clean search and sync */}
        <header className="animate-fade-in" style={{
          marginBottom: 16,
          paddingBottom: 18,
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 2.2vw, 28px)', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 4px', color: 'var(--text-primary)' }}>
              {activeTitle}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, fontWeight: 600 }}>
              Showing {totalTasks} task{totalTasks !== 1 ? 's' : ''} in this view.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 360 }}>
            {/* Clean Instant Search Bar */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: 12, top: 11, width: 15, height: 15, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                placeholder="Search tasks..."
                style={{
                  width: '100%',
                  paddingLeft: 36,
                  paddingRight: search ? 32 : 12,
                  height: 38,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 6px)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: 10,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 2,
                  }}
                  title="Clear search"
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              )}
            </div>

            {/* Sync Button */}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => fetchStatus(true)}
              disabled={refreshing}
              title="Refresh status feed"
              aria-label="Refresh status feed"
              style={{ height: 38, paddingInline: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800 }}
            >
              <RefreshCw style={{ width: 14, height: 14, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              <span className="hide-on-mobile">Sync</span>
            </button>
          </div>
        </header>

        {/* ── Mobile / Tablet Card Filter Buttons (2x2 Grid with counts) ── */}
        <div className="public-mobile-filter-chips">
          {categoryTabs.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`public-filter-chip ${isActive ? 'active' : ''}`}
                onClick={() => handleTabChange(cat.id)}
              >
                <div className="chip-left">
                  <span className="chip-icon">{cat.icon}</span>
                  <span className="chip-label">{cat.label}</span>
                </div>
                <span className="chip-badge">{cat.count}</span>
              </button>
            );
          })}
        </div>

        {/* ── Task Cards Feed ─────────────────────────────────────────── */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }} className="animate-slide-up" key={`${activeTab}-${page}`}>
          {isTabSwitching ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
            </div>
          ) : totalTasks === 0 ? (
            <div
              className="card"
              style={{
                padding: '64px 24px',
                color: 'var(--text-muted)',
                fontSize: 14,
                textAlign: 'center',
                border: '1px dashed var(--border)',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg, 8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                margin: 'auto 0',
              }}
            >
              <AlertCircle style={{ width: 40, height: 40, opacity: 0.4, color: 'var(--text-muted)' }} />
              <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 16 }}>
                {search
                  ? 'No tasks matching your search query.'
                  : activeTab === 'today'
                    ? 'No tasks scheduled for today.'
                    : `No tasks found in ${activeTitle.toLowerCase()}.`}
              </div>
              {search && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setSearch('')}
                  style={{ marginTop: 8 }}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {paginatedTasks.map((task, index) => {
                const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
                const taskNumber = totalTasks - globalIndex;

                return (
                  <article
                    key={task._id}
                    className="card"
                    style={{
                      padding: '22px 26px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg, 8px)',
                      boxShadow: 'none',
                      transition: 'border-color 0.15s ease',
                      animation: `slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.03}s forwards`,
                    }}
                  >
                    {/* Header: Task Number, Title and Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontWeight: 900,
                              letterSpacing: '0.02em',
                              fontSize: 12,
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                              padding: '2px 9px',
                              borderRadius: 'var(--radius-sm, 4px)',
                            }}
                            title={task.taskId ? `Task ID: ${task.taskId}` : undefined}
                          >
                            #{taskNumber}
                          </span>

                          <h2 style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            lineHeight: 1.35,
                            letterSpacing: '-0.01em',
                          }}>
                            {task.title}
                          </h2>
                        </div>

                        {/* Metadata Row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                          {task.givenBy && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-subtle)',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-sm, 4px)',
                              fontSize: 12,
                            }}>
                              <UserPlus style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                              <span>Given by: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{task.givenBy}</strong></span>
                            </div>
                          )}

                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm, 4px)',
                            fontSize: 12,
                          }}>
                            <Calendar style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                            <span>Created: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatDate(task.createdAt || task.date)}</strong></span>
                          </div>

                          {task.contactPerson && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-subtle)',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-sm, 4px)',
                              fontSize: 12,
                            }}>
                              <User style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                              <span>Contact: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{task.contactPerson}</strong></span>
                            </div>
                          )}

                          {task.dueDate && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-subtle)',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-sm, 4px)',
                              fontSize: 12,
                            }}>
                              <Clock style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                              <span>Due: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatDate(task.dueDate)}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {task.priority && <PriorityBadge priority={task.priority} />}
                        {activeTab === 'today' && <StatusBadge status={task.workStatus} />}
                      </div>
                    </div>

                    {/* Task Description */}
                    {task.description && (
                      <p style={{
                        margin: 0,
                        fontSize: 14,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}>
                        {task.description}
                      </p>
                    )}

                    {/* Reason / Remarks Note Box */}
                    {(task.reason || task.remarks) && (() => {
                      const isPendingNote = Boolean(task.reason && (activeTab === 'pending' || task.workStatus === 'Pending'));
                      const isCompletedNote = Boolean(task.remarks && (activeTab === 'completed' || task.workStatus === 'Completed'));

                      const noteLabel = isPendingNote ? 'Pending Reason' : isCompletedNote ? 'Completed Remarks' : 'Status Note';
                      const themeColor = isPendingNote ? '#f59e0b' : isCompletedNote ? '#22c55e' : '#0ea5e9';
                      const bgTint = isPendingNote ? 'rgba(245, 158, 11, 0.08)' : isCompletedNote ? 'rgba(34, 197, 94, 0.08)' : 'rgba(14, 165, 233, 0.08)';
                      const borderTint = isPendingNote ? 'rgba(245, 158, 11, 0.28)' : isCompletedNote ? 'rgba(34, 197, 94, 0.28)' : 'rgba(14, 165, 233, 0.28)';
                      const NoteIcon = isPendingNote ? AlertCircle : isCompletedNote ? CheckSquare : Activity;

                      return (
                        <div style={{
                          marginTop: 4,
                          padding: '12px 16px',
                          background: bgTint,
                          borderRadius: 'var(--radius-sm, 6px)',
                          border: `1px solid ${borderTint}`,
                          fontSize: 13,
                          lineHeight: 1.5,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            color: themeColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            <NoteIcon style={{ width: 13, height: 13, color: themeColor }} />
                            <span>{noteLabel}</span>
                          </div>
                          <div style={{ color: 'var(--text-primary)', fontSize: 13.5, lineHeight: 1.55, fontWeight: 500 }}>
                            {task.reason || task.remarks}
                          </div>
                        </div>
                      );
                    })()}
                  </article>
                );
              })}
            </div>
          )}

          {/* ── Pagination (Only shown when there are more than 5 tasks / > 1 page) ──────── */}
          {totalTasks > ITEMS_PER_PAGE && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              marginTop: 18,
              marginBottom: 20,
              background: 'var(--bg-surface)',
              border: 'var(--border-width-layout) solid var(--border)',
              borderRadius: 'var(--radius-md, 8px)',
              boxShadow: 'var(--box-shadow-brutalist-sm)',
              fontSize: 13,
              color: 'var(--text-primary)',
              fontWeight: 800,
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <span>
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalTasks)} of {totalTasks}
              </span>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <PaginationBtn
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  title="Previous Page"
                >
                  <ChevronLeft style={{ width: 14, height: 14 }} />
                </PaginationBtn>

                {visiblePages.map((p) => {
                  const isActive = p === currentPage;
                  return (
                    <PaginationBtn
                      key={p}
                      active={isActive}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </PaginationBtn>
                  );
                })}

                <PaginationBtn
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  title="Next Page"
                >
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </PaginationBtn>
              </div>
            </div>
          )}
        </section>

        {/* ── Clean & Professional Minimal Footer ─── */}
        <footer className="public-footer">
          <div>
            © {new Date().getFullYear()} <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>TasksManager</strong> by <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Sushant Gupta</span>. All Rights Reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}

function SidebarButton({
  label,
  icon,
  count,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`nav-item ${active ? 'active' : ''}`}
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        justifyContent: 'space-between',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon}
        <span>{label}</span>
      </div>
      <span
        style={{
          marginLeft: 'auto',
          background: active ? 'var(--accent)' : 'var(--bg-elevated)',
          color: active ? '#000000' : 'var(--text-secondary)',
          border: active ? 'none' : '1px solid var(--border)',
          padding: '1px 7px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 800,
          minWidth: 22,
          textAlign: 'center',
          lineHeight: '16px',
        }}
      >
        {count}
      </span>
    </button>
  );
}

function TaskCardSkeleton() {
  return (
    <div
      style={{
        padding: '22px 26px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg, 8px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="skeleton" style={{ width: 64, height: 22, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: 240, height: 22, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 90, height: 22, borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div className="skeleton" style={{ width: 140, height: 26, borderRadius: 'var(--radius-sm, 4px)' }} />
        <div className="skeleton" style={{ width: 150, height: 26, borderRadius: 'var(--radius-sm, 4px)' }} />
        <div className="skeleton" style={{ width: 160, height: 26, borderRadius: 'var(--radius-sm, 4px)' }} />
      </div>
      <div className="skeleton" style={{ width: '85%', height: 16, borderRadius: 4 }} />
      <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 4 }} />
      <div className="skeleton" style={{ width: '100%', height: 42, borderRadius: 6 }} />
    </div>
  );
}

function PaginationBtn({
  children,
  active,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      className={`brutalist-hover ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{
        background: active ? 'var(--text-primary)' : 'var(--bg-surface)',
        color: active ? 'var(--bg-base)' : 'var(--text-primary)',
        border: 'var(--border-width-layout) solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        minWidth: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13,
        fontWeight: 900,
        opacity: disabled ? 0.3 : 1,
        padding: '0 6px',
        boxShadow: active ? 'none' : 'var(--box-shadow-brutalist-sm)',
        transform: active ? 'translate(2px, 2px)' : 'none',
        transition: 'all 0.1s ease',
      }}
    >
      {children}
    </button>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const p = priority.toLowerCase();
  const config =
    p === 'high'
      ? {
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.14)',
          border: 'rgba(239, 68, 68, 0.35)',
          dot: '#ef4444',
          glow: '0 0 6px rgba(239, 68, 68, 0.5)',
        }
      : p === 'medium'
      ? {
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.14)',
          border: 'rgba(245, 158, 11, 0.35)',
          dot: '#f59e0b',
          glow: '0 0 6px rgba(245, 158, 11, 0.5)',
        }
      : {
          color: '#0ea5e9',
          bg: 'rgba(14, 165, 233, 0.14)',
          border: 'rgba(14, 165, 233, 0.35)',
          dot: '#0ea5e9',
          glow: '0 0 6px rgba(14, 165, 233, 0.5)',
        };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 'var(--radius-sm, 6px)',
        background: config.bg,
        border: `1px solid ${config.border}`,
        fontSize: 11,
        fontWeight: 800,
        color: config.color,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: config.dot,
          boxShadow: config.glow,
          display: 'inline-block',
        }}
      />
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const config =
    status === 'Completed'
      ? {
          color: '#22c55e',
          bg: 'rgba(34, 197, 94, 0.14)',
          border: 'rgba(34, 197, 94, 0.35)',
          dot: '#22c55e',
          glow: '0 0 6px rgba(34, 197, 94, 0.5)',
        }
      : status === 'InProgress'
      ? {
          color: '#0ea5e9',
          bg: 'rgba(14, 165, 233, 0.14)',
          border: 'rgba(14, 165, 233, 0.35)',
          dot: '#0ea5e9',
          glow: '0 0 6px rgba(14, 165, 233, 0.5)',
        }
      : {
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.14)',
          border: 'rgba(245, 158, 11, 0.35)',
          dot: '#f59e0b',
          glow: '0 0 6px rgba(245, 158, 11, 0.5)',
        };

  const label = status === 'InProgress' ? 'In Progress' : status;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 'var(--radius-sm, 6px)',
        background: config.bg,
        border: `1px solid ${config.border}`,
        fontSize: 11,
        fontWeight: 800,
        color: config.color,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: config.dot,
          boxShadow: config.glow,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}
