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
  Sun,
  Moon,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Grid3X3,
  Table,
  Layers,
  Sparkles,
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
  const [isDark, setIsDark] = useState(false);
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  // View mode options: 'glass' (Modern Rich Glass Cards), 'grid' (2-Column Grid), 'table' (Clean Dashboard Table), 'expanded' (Streamlined List)
  const [viewMode, setViewMode] = useState<'glass' | 'grid' | 'table' | 'expanded'>('glass');

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

  useEffect(() => {
    try {
      const darkActive = document.documentElement.classList.contains('dark');
      setIsDark(darkActive);
    } catch {}
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.theme = 'light';
    }
    window.dispatchEvent(new Event('storage'));
  };

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

  return (
    <div className="public-layout">
      {/* MNC-grade Top Loading Bar */}
      {isTabSwitching && (
        <div className="loading-bar">
          <div className="loading-bar-inner" />
        </div>
      )}

      {/* ── Sidebar Navigation matching Main Module ────────────────── */}
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

          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isDark ? <Sun style={{ width: 15, height: 15, color: '#f59e0b' }} /> : <Moon style={{ width: 15, height: 15, color: 'var(--text-primary)' }} />}
          </button>
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
            <SidebarButton
              label="Today's Focus"
              icon={<Target style={{ width: 17, height: 17 }} />}
              count={data.counts.today}
              active={activeTab === 'today'}
              onClick={() => handleTabChange('today')}
            />

            <SidebarButton
              label="In Progress"
              icon={<Activity style={{ width: 17, height: 17 }} />}
              count={data.counts.inProgress}
              active={activeTab === 'inProgress'}
              onClick={() => handleTabChange('inProgress')}
            />

            <SidebarButton
              label="Pending"
              icon={<Timer style={{ width: 17, height: 17 }} />}
              count={data.counts.pending}
              active={activeTab === 'pending'}
              onClick={() => handleTabChange('pending')}
            />

            <SidebarButton
              label="Completed"
              icon={<CheckSquare style={{ width: 17, height: 17 }} />}
              count={data.counts.completed}
              active={activeTab === 'completed'}
              onClick={() => handleTabChange('completed')}
            />
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
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 2.2vw, 28px)', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--text-primary)' }}>
              {activeTitle}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, fontWeight: 600 }}>
              Showing {totalTasks} task{totalTasks !== 1 ? 's' : ''} in this view.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* View Mode Switcher (Allows comparing all 4 options live) */}
            <div className="public-view-switcher" title="Select Layout Mode">
              <button
                type="button"
                className={`public-view-btn ${viewMode === 'glass' ? 'active' : ''}`}
                onClick={() => setViewMode('glass')}
                title="Option 1: Modern Rich Glass Cards"
              >
                <Sparkles style={{ width: 13, height: 13 }} />
                <span>Modern Glass</span>
              </button>
              <button
                type="button"
                className={`public-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Option 2: 2-Column Responsive Grid"
              >
                <Grid3X3 style={{ width: 13, height: 13 }} />
                <span>Grid Cards</span>
              </button>
              <button
                type="button"
                className={`public-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Option 3: Dashboard Table View"
              >
                <Table style={{ width: 13, height: 13 }} />
                <span>Table</span>
              </button>
              <button
                type="button"
                className={`public-view-btn ${viewMode === 'expanded' ? 'active' : ''}`}
                onClick={() => setViewMode('expanded')}
                title="Option 4: Streamlined List"
              >
                <Layers style={{ width: 13, height: 13 }} />
                <span>List</span>
              </button>
            </div>

            {/* Clean Instant Search Bar */}
            <div style={{ position: 'relative', width: 220 }}>
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

        {/* ── Option 2 & 4: Top Interactive Metric Summary Cards ─────── */}
        <div className="public-metrics-grid">
          <div
            className={`public-metric-card ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => handleTabChange('today')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: activeTab === 'today' ? 'var(--accent)' : 'var(--text-muted)' }}>
                Today's Focus
              </span>
              <Target style={{ width: 14, height: 14, color: 'var(--inprogress)' }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {data.counts.today}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              {activeTab === 'today' ? 'Active Filter • Click to browse' : 'Targeted priority tasks'}
            </div>
          </div>

          <div
            className={`public-metric-card ${activeTab === 'inProgress' ? 'active' : ''}`}
            onClick={() => handleTabChange('inProgress')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: activeTab === 'inProgress' ? 'var(--accent)' : 'var(--text-muted)' }}>
                In Progress
              </span>
              <Activity style={{ width: 14, height: 14, color: 'var(--inprogress)' }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--inprogress)', lineHeight: 1 }}>
              {data.counts.inProgress}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              {activeTab === 'inProgress' ? 'Active Filter • Click to browse' : 'Currently being executed'}
            </div>
          </div>

          <div
            className={`public-metric-card ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => handleTabChange('pending')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: activeTab === 'pending' ? 'var(--accent)' : 'var(--text-muted)' }}>
                Pending Queue
              </span>
              <Timer style={{ width: 14, height: 14, color: 'var(--pending)' }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--pending)', lineHeight: 1 }}>
              {data.counts.pending}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              {activeTab === 'pending' ? 'Active Filter • Click to browse' : 'Awaiting follow-up / action'}
            </div>
          </div>

          <div
            className={`public-metric-card ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => handleTabChange('completed')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: activeTab === 'completed' ? 'var(--accent)' : 'var(--text-muted)' }}>
                Completed
              </span>
              <CheckSquare style={{ width: 14, height: 14, color: 'var(--completed)' }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--completed)', lineHeight: 1 }}>
              {data.counts.completed}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              {activeTab === 'completed' ? 'Active Filter • Click to browse' : 'Successfully fulfilled'}
            </div>
          </div>
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
          ) : viewMode === 'table' ? (
            /* ── OPTION 3: Sleek Dashboard Table Layout ─────────────────── */
            <div className="public-table-wrap">
              <table className="public-table">
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>Task ID</th>
                    <th style={{ minWidth: 220 }}>Task Title & Description</th>
                    <th>Created By / Assignee</th>
                    <th>Date / Due</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Details / Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTasks.map((task) => {
                    return (
                      <tr key={task._id}>
                        <td>
                          <span
                            className="pill"
                            style={{
                              fontWeight: 900,
                              fontSize: 11,
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                              padding: '3px 8px',
                              display: 'inline-block',
                            }}
                          >
                            {task.taskId || '—'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13.5, marginBottom: 4 }}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45, maxWidth: 360 }}>
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700 }}>
                            {task.givenBy || '—'}
                          </div>
                          {task.contactPerson && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              Contact: {task.contactPerson}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                            {formatDate(task.createdAt || task.date)}
                          </div>
                          {task.dueDate && (
                            <div style={{ fontSize: 11, color: 'var(--high)', fontWeight: 700 }}>
                              Due: {formatDate(task.dueDate)}
                            </div>
                          )}
                        </td>
                        <td>
                          {task.priority ? <PriorityBadge priority={task.priority} /> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td>
                          <StatusBadge status={task.workStatus} />
                        </td>
                        <td style={{ maxWidth: 260 }}>
                          {task.reason && (
                            <div style={{ fontSize: 11.5, color: 'var(--pending)', fontWeight: 600, marginBottom: 2 }}>
                              <strong>Reason:</strong> {task.reason}
                            </div>
                          )}
                          {task.remarks && (
                            <div style={{ fontSize: 11.5, color: 'var(--completed)', fontWeight: 600 }}>
                              <strong>Remarks:</strong> {task.remarks}
                            </div>
                          )}
                          {!task.reason && !task.remarks && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── OPTION 2: 2-Column Responsive Card Grid ────────────────── */
            <div className="public-cards-grid">
              {paginatedTasks.map((task, index) => {
                const statusAccentColor =
                  task.workStatus === 'Completed' ? 'var(--completed)' :
                  task.workStatus === 'InProgress' ? 'var(--inprogress)' : 'var(--pending)';

                return (
                  <article
                    key={task._id}
                    className="card brutalist-hover"
                    style={{
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 12,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderTop: `4px solid ${statusAccentColor}`,
                      borderRadius: 'var(--radius-lg, 10px)',
                      animation: `slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.03}s forwards`,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        {task.taskId && (
                          <span
                            className="pill"
                            style={{
                              fontWeight: 900,
                              fontSize: 11,
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                              padding: '2px 8px',
                            }}
                          >
                            {task.taskId}
                          </span>
                        )}
                        <div style={{ display: 'flex', gap: 6 }}>
                          {task.priority && <PriorityBadge priority={task.priority} />}
                          <StatusBadge status={task.workStatus} />
                        </div>
                      </div>

                      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                        {task.title}
                      </h2>

                      {task.description && (
                        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, maxHeight: 72, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div>
                      {/* Meta chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                        {task.givenBy && (
                          <span style={{ background: 'var(--bg-hover)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                            👤 {task.givenBy}
                          </span>
                        )}
                        <span style={{ background: 'var(--bg-hover)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                          📅 {formatDate(task.createdAt || task.date)}
                        </span>
                      </div>

                      {(task.reason || task.remarks) && (
                        <div style={{
                          padding: '8px 10px',
                          background: 'var(--bg-hover)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          borderLeft: `3px solid ${task.reason ? 'var(--pending)' : 'var(--completed)'}`,
                          fontSize: 11.5,
                        }}>
                          {task.reason && <div><strong style={{ color: 'var(--pending)' }}>Reason:</strong> {task.reason}</div>}
                          {task.remarks && <div><strong style={{ color: 'var(--completed)' }}>Remarks:</strong> {task.remarks}</div>}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : viewMode === 'glass' ? (
            /* ── OPTION 1: Ultra-Modern Glassmorphic Frosted Cards ───────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {paginatedTasks.map((task, index) => {
                const statusAccentColor =
                  task.workStatus === 'Completed' ? 'var(--completed)' :
                  task.workStatus === 'InProgress' ? 'var(--inprogress)' : 'var(--pending)';

                return (
                  <article
                    key={task._id}
                    className="public-glass-card"
                    style={{
                      borderLeft: `5px solid ${statusAccentColor}`,
                      animation: `slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.03}s forwards`,
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          {task.taskId && (
                            <span
                              className="pill"
                              style={{
                                fontWeight: 900,
                                letterSpacing: '0.04em',
                                fontSize: 11,
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                padding: '2px 8px',
                              }}
                            >
                              {task.taskId}
                            </span>
                          )}

                          <h2 style={{
                            margin: 0,
                            fontSize: 'clamp(1rem, 0.95rem + 0.35vw, 1.2rem)',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            lineHeight: 1.35,
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
                              background: 'var(--bg-hover)',
                              border: '1px solid var(--border-subtle)',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-sm, 6px)',
                            }}>
                              <UserPlus style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                              <span>Given by: <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{task.givenBy}</strong></span>
                            </div>
                          )}

                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border-subtle)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm, 6px)',
                          }}>
                            <Calendar style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                            <span>Created: <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatDate(task.createdAt || task.date)}</strong></span>
                          </div>

                          {task.contactPerson && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: 'var(--bg-hover)',
                              border: '1px solid var(--border-subtle)',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-sm, 6px)',
                            }}>
                              <User style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                              <span>Contact: <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{task.contactPerson}</strong></span>
                            </div>
                          )}

                          {task.dueDate && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: 'var(--bg-hover)',
                              border: '1px solid var(--border-subtle)',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-sm, 6px)',
                            }}>
                              <Clock style={{ width: 12, height: 12, color: 'var(--high)' }} />
                              <span>Due: <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatDate(task.dueDate)}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {task.priority && <PriorityBadge priority={task.priority} />}
                        <StatusBadge status={task.workStatus} />
                      </div>
                    </div>

                    {/* Task Description */}
                    {task.description && (
                      <p style={{
                        margin: 0,
                        fontSize: 13.5,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}>
                        {task.description}
                      </p>
                    )}

                    {/* Reason / Remarks Callout Box */}
                    {(task.reason || task.remarks) && (
                      <div style={{
                        marginTop: 2,
                        padding: '12px 16px',
                        background: 'var(--bg-hover)',
                        borderRadius: 'var(--radius-md, 6px)',
                        border: '1px solid var(--border)',
                        borderLeft: `4px solid ${task.reason ? 'var(--pending)' : 'var(--completed)'}`,
                        fontSize: 13,
                        lineHeight: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}>
                        {task.reason && (
                          <div>
                            <strong style={{ color: 'var(--pending)', fontWeight: 800, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.04em' }}>
                              Reason:{' '}
                            </strong>
                            <span style={{ color: 'var(--text-primary)' }}>{task.reason}</span>
                          </div>
                        )}
                        {task.remarks && (
                          <div>
                            <strong style={{ color: 'var(--completed)', fontWeight: 800, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.04em' }}>
                              Remarks:{' '}
                            </strong>
                            <span style={{ color: 'var(--text-primary)' }}>{task.remarks}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            /* ── OPTION 4: Streamlined List ──────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {paginatedTasks.map((task, index) => {
                const statusAccentColor =
                  task.workStatus === 'Completed' ? 'var(--completed)' :
                  task.workStatus === 'InProgress' ? 'var(--inprogress)' : 'var(--pending)';

                return (
                  <article
                    key={task._id}
                    className="card brutalist-hover"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderLeft: `4px solid ${statusAccentColor}`,
                      borderRadius: 'var(--radius-md, 8px)',
                      flexWrap: 'wrap',
                      animation: `slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.02}s forwards`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="pill" style={{ fontSize: 10.5, fontWeight: 900, padding: '1px 6px' }}>{task.taskId}</span>
                        <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)' }}>{task.title}</h3>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Given by: <strong style={{ color: 'var(--text-secondary)' }}>{task.givenBy || 'N/A'}</strong> • {formatDate(task.createdAt || task.date)}
                        {task.reason && <span style={{ color: 'var(--pending)', marginLeft: 8 }}>• Reason: {task.reason}</span>}
                        {task.remarks && <span style={{ color: 'var(--completed)', marginLeft: 8 }}>• Remarks: {task.remarks}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {task.priority && <PriorityBadge priority={task.priority} />}
                      <StatusBadge status={task.workStatus} />
                    </div>
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

        {/* ── Professional Clean Footer (PDF Format Style, Pinned at Bottom) ─── */}
        <footer style={{
          marginTop: 'auto',
          paddingTop: 24,
          paddingBottom: 24,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck style={{ width: 16, height: 16, color: 'var(--completed)' }} />
            <span>
              Read-only Protected View • <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>TasksManager</strong> by <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Sushant Gupta</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, fontWeight: 600 }}>
            <span>© {new Date().getFullYear()} All Rights Reserved.</span>
            <span>•</span>
            <span style={{ color: 'var(--completed)', fontWeight: 700 }}>Live Feed Active</span>
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
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg, 8px)',
        boxShadow: 'var(--box-shadow-brutalist-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="skeleton" style={{ width: 64, height: 22, borderRadius: 999 }} />
          <div className="skeleton" style={{ width: 240, height: 22, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 999 }} />
          <div className="skeleton" style={{ width: 90, height: 22, borderRadius: 999 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div className="skeleton" style={{ width: 140, height: 26, borderRadius: 'var(--radius-sm, 6px)' }} />
        <div className="skeleton" style={{ width: 150, height: 26, borderRadius: 'var(--radius-sm, 6px)' }} />
        <div className="skeleton" style={{ width: 160, height: 26, borderRadius: 'var(--radius-sm, 6px)' }} />
      </div>
      <div className="skeleton" style={{ width: '85%', height: 16, borderRadius: 4 }} />
      <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 4 }} />
      <div className="skeleton" style={{ width: '100%', height: 38, borderRadius: 6 }} />
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
  let color = 'var(--text-secondary)';
  let bg = 'var(--bg-hover)';
  let border = 'var(--border)';

  if (p === 'high') {
    color = 'var(--high)';
    bg = 'var(--high-bg, rgba(255, 51, 102, 0.1))';
    border = 'var(--high)';
  } else if (p === 'medium') {
    color = 'var(--medium)';
    bg = 'var(--medium-bg, rgba(255, 0, 255, 0.1))';
    border = 'var(--medium)';
  } else if (p === 'low') {
    color = 'var(--low)';
    bg = 'var(--low-bg, rgba(0, 212, 255, 0.1))';
    border = 'var(--low)';
  }

  return (
    <span style={{
      color,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 'var(--radius-full, 9999px)',
      padding: '3px 10px',
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = 'var(--text-secondary)';
  let bg = 'var(--bg-hover)';
  let border = 'var(--border)';

  if (status === 'Completed') {
    color = 'var(--completed)';
    bg = 'var(--completed-bg, rgba(0, 255, 136, 0.1))';
    border = 'var(--completed)';
  } else if (status === 'InProgress') {
    color = 'var(--inprogress)';
    bg = 'var(--inprogress-bg, rgba(0, 212, 255, 0.1))';
    border = 'var(--inprogress)';
  } else if (status === 'Pending') {
    color = 'var(--pending)';
    bg = 'var(--pending-bg, rgba(255, 0, 255, 0.1))';
    border = 'var(--pending)';
  }

  return (
    <span style={{
      color,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 'var(--radius-full, 9999px)',
      padding: '3px 10px',
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {status === 'InProgress' ? 'In Progress' : status}
    </span>
  );
}
