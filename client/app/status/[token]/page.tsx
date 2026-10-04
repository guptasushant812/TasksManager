'use client';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Task, TaskFilters, Priority, WorkStatus } from '@/types/task';
import { apiFetch, buildQueryString } from '@/lib/api';
import { formatDate, getYearRange, toIsoDate } from '@/lib/dates';
import CascadingFilterNav from '@/components/dashboard/CascadingFilterNav';
import SearchBar from '@/components/tasks/SearchBar';
import FilterSortPanel from '@/components/tasks/FilterSortPanel';
import ExportMenu from '@/components/tasks/ExportMenu';
import {
  LayoutDashboard,
  CheckSquare,
  Square,
  Printer,
  RefreshCw,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  UserPlus,
  ShieldCheck,
  Filter,
  X,
  Layers,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

interface PublicStatusResponse {
  tasks: Task[];
  total: number;
  counts: {
    total: number;
    today: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

const SORT_LABELS: Record<string, string> = {
  taskId: 'Task ID',
  date: 'Task Date',
  dueDate: 'Due Date',
  title: 'Title',
  priority: 'Priority',
  workStatus: 'Status',
  createdAt: 'Created At',
};

export default function PublicStatusPage() {
  const { token } = useParams<{ token: string }>();

  // Time & field filters state
  const today = new Date();
  const [filters, setFilters] = useState<TaskFilters>({
    year: today.getFullYear().toString(),
    month: (today.getMonth() + 1).toString(),
    sort: 'taskId',
    order: 'desc',
    page: 1,
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    today: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Search & interaction states
  const [searchInput, setSearchInput] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusTab, setStatusTab] = useState<'all' | 'today' | 'InProgress' | 'Pending' | 'Completed'>('all');
  const [isDark, setIsDark] = useState(false);

  const availableYears = useMemo(() => getYearRange(2022), []);
  const filterRef = useRef<HTMLDivElement>(null);

  // Theme synchronization
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

  // Fetch status data from public endpoint
  const fetchStatus = useCallback(async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const queryParams: Record<string, string | number | undefined> = {
        year: filters.year,
        month: filters.month,
        weekStart: filters.weekStart,
        weekIndex: filters.weekIndex,
        day: filters.day,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        status: filters.status,
        priority: filters.priority,
        givenBy: filters.givenBy,
        sort: filters.sort || 'taskId',
        order: filters.order || 'desc',
        search: filters.search,
      };

      const qs = buildQueryString(queryParams);
      const result = await apiFetch<PublicStatusResponse>(`/api/public/status/${token}${qs}`);

      setTasks(result.tasks || []);
      if (result.counts) {
        setCounts(result.counts);
      }
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid link or access denied.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, filters]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Periodic silent polling
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchStatus(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Handle filter changes from CascadingFilterNav or FilterSortPanel
  const handleFiltersChange = (partial: Partial<TaskFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  // Active filters calculation
  const isCustomSort = Boolean((filters.sort && filters.sort !== 'taskId') || (filters.order && filters.order === 'asc'));
  const activeFiltersCount = [
    filters.status,
    filters.priority,
    filters.givenBy,
    filters.dateFrom,
    filters.dateTo,
    isCustomSort ? 'customSort' : '',
  ].filter(Boolean).length;

  // Filter tasks based on searchInput and statusTab
  const displayedTasks = useMemo(() => {
    const todayStr = toIsoDate(new Date());
    let list = [...tasks];

    // Status Tab filter
    if (statusTab === 'today') {
      list = list.filter((t) => {
        if (!t.date) return false;
        return toIsoDate(t.date) === todayStr;
      });
    } else if (statusTab !== 'all') {
      list = list.filter((t) => t.workStatus === statusTab);
    }

    // Client-side search for instantaneous responsiveness
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase().trim();
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

    return list;
  }, [tasks, statusTab, searchInput]);

  const toggleSelectTask = (taskId: string) => {
    setSelectedIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedTasks.map((t) => t._id));
    }
  };

  // Loading skeleton state
  if (loading) {
    return (
      <div className="public-portal">
        <header className="public-topbar">
          <div className="skeleton" style={{ width: 150, height: 32, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 100, height: 32, borderRadius: 6 }} />
        </header>
        <div className="public-container">
          <div className="skeleton" style={{ width: '100%', height: 160, borderRadius: 12 }} />
          <div className="skeleton" style={{ width: '100%', height: 48, borderRadius: 8 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="skeleton" style={{ width: '100%', height: 140, borderRadius: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 140, borderRadius: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 140, borderRadius: 12 }} />
          </div>
        </div>
      </div>
    );
  }

  // Error access state
  if (error || !token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 16 }}>
        <div className="card animate-slide-up" style={{ padding: '40px 32px', textAlign: 'center', maxWidth: 440, width: '100%', border: 'var(--border-width-layout, 1px) solid var(--border)' }}>
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
    <div className="public-portal">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="public-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            background: 'var(--bg-surface)',
            border: 'var(--border-width-layout) solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            boxShadow: 'var(--box-shadow-brutalist-sm)',
          }}>
            <LayoutDashboard style={{ width: 18, height: 18, strokeWidth: 2.5 }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                TasksManager
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full, 9999px)',
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--accent)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
                Live Portal
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              Read-only transparent project deliverables feed
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => window.print()}
            title="Print or Export as PDF"
            aria-label="Print or Export as PDF"
            style={{ height: 38, paddingInline: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800 }}
          >
            <Printer style={{ width: 14, height: 14 }} />
            <span className="hide-on-mobile">Print</span>
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ height: 38, width: 38, padding: 0, justifyContent: 'center' }}
          >
            {isDark ? <Sun style={{ width: 16, height: 16, color: '#f59e0b' }} /> : <Moon style={{ width: 16, height: 16, color: 'var(--text-primary)' }} />}
          </button>
        </div>
      </header>

      {/* ── Main Container ───────────────────────────────────────────── */}
      <main className="public-container animate-fade-in">
        
        {/* 1. Time Navigation (CascadingFilterNav) */}
        <CascadingFilterNav
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableYears={availableYears}
        />

        {/* 2. Interactive Status Tabs Bar */}
        <div style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          paddingBottom: 2,
        }}>
          {[
            { id: 'all', label: 'All Tasks', count: counts.total || tasks.length, color: 'var(--text-primary)' },
            { id: 'today', label: "Today's Focus", count: counts.today, color: 'var(--inprogress)' },
            { id: 'InProgress', label: 'In Progress', count: counts.inProgress, color: 'var(--inprogress)' },
            { id: 'Pending', label: 'Pending', count: counts.pending, color: 'var(--pending)' },
            { id: 'Completed', label: 'Completed', count: counts.completed, color: 'var(--completed)' },
          ].map((tab) => {
            const isTabActive = statusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusTab(tab.id as typeof statusTab)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'var(--border-width-layout) solid var(--border)',
                  background: isTabActive ? 'var(--text-primary)' : 'var(--bg-surface)',
                  color: isTabActive ? 'var(--bg-base)' : 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: isTabActive ? 'none' : 'var(--box-shadow-brutalist-sm)',
                  transform: isTabActive ? 'translate(2px, 2px)' : 'none',
                  transition: 'all 0.1s ease',
                  flexShrink: 0,
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  background: isTabActive ? 'var(--bg-base)' : 'var(--bg-elevated)',
                  color: isTabActive ? 'var(--text-primary)' : tab.color,
                  borderRadius: 'var(--radius-full, 9999px)',
                  padding: '1px 7px',
                  fontSize: 11,
                  fontWeight: 900,
                  border: '1px solid var(--border)',
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. Toolbar (Search, Filter, Select, Export) */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchBar value={searchInput} onChange={setSearchInput} />

          {/* Filter button */}
          <div ref={filterRef} style={{ position: 'relative' }}>
            <button
              id="btn-filter-sort"
              className={`btn ${activeFiltersCount > 0 ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setShowFilterModal(!showFilterModal)}
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Filter style={{ width: 14, height: 14 }} />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span style={{
                  background: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  fontSize: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  border: '1px solid var(--border)',
                }}>
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {showFilterModal && (
              <FilterSortPanel
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClose={() => setShowFilterModal(false)}
              />
            )}
          </div>

          {/* Selection mode */}
          <button
            id="btn-select-mode"
            className={`btn ${selectMode ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setSelectMode(!selectMode);
              setSelectedIds([]);
            }}
          >
            <CheckSquare style={{ width: 14, height: 14 }} />
            Select
            {selectedIds.length > 0 && ` (${selectedIds.length})`}
          </button>

          {/* Export Menu */}
          <ExportMenu
            filters={filters}
            selectedIds={selectedIds}
            totalTasks={selectedIds.length > 0 ? selectedIds.length : displayedTasks.length}
          />
        </div>

        {/* 4. Active Filters Chips Bar */}
        {activeFiltersCount > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            padding: '8px 12px',
            background: 'var(--bg-surface)',
            border: 'var(--border-width-layout) solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--box-shadow-brutalist-sm)',
            fontSize: 12,
            fontWeight: 700,
          }}>
            <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>
              <Filter style={{ width: 12, height: 12 }} />
              Active Filters ({activeFiltersCount}):
            </span>

            {filters.status && (
              <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '3px 8px' }}>
                <span>Status: <strong>{filters.status}</strong></span>
                <button
                  type="button"
                  onClick={() => handleFiltersChange({ status: '', page: 1 })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'inline-flex' }}
                  title="Remove status filter"
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </span>
            )}

            {filters.priority && (
              <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '3px 8px' }}>
                <span>Priority: <strong>{filters.priority}</strong></span>
                <button
                  type="button"
                  onClick={() => handleFiltersChange({ priority: '', page: 1 })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'inline-flex' }}
                  title="Remove priority filter"
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </span>
            )}

            {filters.givenBy && (
              <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '3px 8px' }}>
                <span>Given By: <strong>{filters.givenBy}</strong></span>
                <button
                  type="button"
                  onClick={() => handleFiltersChange({ givenBy: '', page: 1 })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'inline-flex' }}
                  title="Remove givenBy filter"
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </span>
            )}

            {(filters.dateFrom || filters.dateTo) && (
              <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '3px 8px' }}>
                <span>Date: <strong>{filters.dateFrom || 'Any'} → {filters.dateTo || 'Any'}</strong></span>
                <button
                  type="button"
                  onClick={() => handleFiltersChange({ dateFrom: '', dateTo: '', page: 1 })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'inline-flex' }}
                  title="Remove date range filter"
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </span>
            )}

            {isCustomSort && (
              <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '3px 8px' }}>
                <span>Sort: <strong>{SORT_LABELS[filters.sort || 'taskId'] || filters.sort}</strong> ({filters.order === 'asc' ? 'Asc' : 'Desc'})</span>
                <button
                  type="button"
                  onClick={() => handleFiltersChange({ sort: 'taskId', order: 'desc', page: 1 })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'inline-flex' }}
                  title="Reset sort to default"
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={() => handleFiltersChange({ status: '', priority: '', givenBy: '', dateFrom: '', dateTo: '', sort: 'taskId', order: 'desc', page: 1 })}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--high)',
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                cursor: 'pointer',
                marginLeft: 'auto',
                padding: '2px 6px',
                textDecoration: 'underline',
              }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Selection mode banner */}
        {selectMode && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: 'var(--bg-elevated)',
            border: 'var(--border-width-layout) solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--box-shadow-brutalist-sm)',
            fontSize: 13,
            fontWeight: 800,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={toggleSelectAll}
                style={{ padding: '4px 10px', fontSize: 12 }}
              >
                {selectedIds.length === displayedTasks.length && displayedTasks.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
              <span>{selectedIds.length} of {displayedTasks.length} tasks selected</span>
            </div>

            {selectedIds.length > 0 && (
              <span style={{ color: 'var(--accent)', fontSize: 12 }}>
                Use Export dropdown to download selected items.
              </span>
            )}
          </div>
        )}

        {/* 5. Task Cards Feed (Container Query architecture) */}
        <section className="public-task-card-container">
          {displayedTasks.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '60px 24px',
                textAlign: 'center',
                border: 'var(--border-width-layout) dashed var(--border)',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg, 12px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <AlertCircle style={{ width: 44, height: 44, color: 'var(--text-muted)', opacity: 0.5 }} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                No Tasks Found
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', maxWidth: 420 }}>
                {searchInput || activeFiltersCount > 0 || statusTab !== 'all'
                  ? 'No tasks match your selected time range and filter settings. Try clearing the filters.'
                  : 'There are currently no tasks recorded in this time range.'}
              </p>
              {(searchInput || activeFiltersCount > 0 || statusTab !== 'all') && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setSearchInput('');
                    setStatusTab('all');
                    handleFiltersChange({ status: '', priority: '', givenBy: '', dateFrom: '', dateTo: '', weekIndex: undefined, day: '', sort: 'taskId', order: 'desc', page: 1 });
                  }}
                  style={{ marginTop: 8 }}
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {displayedTasks.map((task) => {
                const statusBorderColor =
                  task.workStatus === 'Completed' ? 'var(--completed)' :
                  task.workStatus === 'InProgress' ? 'var(--inprogress)' : 'var(--pending)';

                const isSelected = selectedIds.includes(task._id);

                return (
                  <article
                    key={task._id}
                    className="public-task-card"
                    style={{
                      borderLeft: `5px solid ${statusBorderColor}`,
                      borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                    }}
                    onClick={() => {
                      if (selectMode) toggleSelectTask(task._id);
                    }}
                  >
                    {/* Header Row: Title & Badges */}
                    <div className="public-task-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                        {selectMode && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectTask(task._id);
                            }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            {isSelected ? (
                              <CheckSquare style={{ width: 18, height: 18, color: 'var(--accent)' }} />
                            ) : (
                              <Square style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />
                            )}
                          </div>
                        )}

                        {task.taskId && (
                          <span
                            className="pill"
                            style={{
                              fontWeight: 900,
                              letterSpacing: '0.04em',
                              fontSize: 12,
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                              padding: '3px 8px',
                              flexShrink: 0,
                            }}
                          >
                            {task.taskId}
                          </span>
                        )}

                        <h2 style={{
                          margin: 0,
                          fontSize: 'clamp(1rem, 0.95rem + 0.35vw, 1.25rem)',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          lineHeight: 1.35,
                        }}>
                          {task.title}
                        </h2>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {task.priority && <PriorityBadge priority={task.priority} />}
                        <StatusBadge status={task.workStatus} />
                      </div>
                    </div>

                    {/* Metadata Chips Row */}
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

                    {/* Task Description */}
                    {task.description && (
                      <p style={{
                        margin: 0,
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {task.description}
                      </p>
                    )}

                    {/* Reason & Remarks Callout Box */}
                    {(task.reason || task.remarks) && (
                      <div
                        className="public-callout"
                        style={{
                          borderLeft: `4px solid ${task.reason ? 'var(--pending)' : 'var(--completed)'}`,
                        }}
                      >
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
          )}
        </section>

        {/* 6. Footer */}
        <footer style={{
          marginTop: 24,
          paddingTop: 24,
          borderTop: 'var(--border-width-layout) solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck style={{ width: 16, height: 16, color: 'var(--completed)' }} />
            <span>Read-only protected view • TasksManager</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span>Showing {displayedTasks.length} task{displayedTasks.length !== 1 ? 's' : ''}</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 800, padding: 0 }}
            >
              Back to Top ↑
            </button>
          </div>
        </footer>

      </main>
    </div>
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

function StatusBadge({ status }: { status: WorkStatus | string }) {
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
