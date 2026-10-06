'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Task, TaskFilters } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import { useEscalation } from '@/hooks/useEscalation';
import FollowUpRow from './FollowUpRow';
import FollowUpCard from './FollowUpCard';
import SearchBar from '../tasks/SearchBar';
import FilterSortPanel from '../tasks/FilterSortPanel';
import ExportMenu from '../tasks/ExportMenu';
import FollowUpPanel from './FollowUpPanel';
import FollowUpQuickAdd from './FollowUpQuickAdd';
import { Filter, CheckSquare, Trash2, ChevronLeft, ChevronRight, Sparkles, Plus, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SHORT_MONTHS } from '@/lib/dates';

interface FollowUpWorkspaceProps {
  filters: TaskFilters;
  onFiltersChange: (f: Partial<TaskFilters>) => void;
  refreshKey: number;
}

const SORTABLE_COLUMNS: { key: string; label: string; width?: string }[] = [
  { key: 'sr', label: '#', width: '1%' },
  { key: 'title', label: 'Task & Context' },
  { key: 'followUpCount', label: 'Logs & State', width: '1%' },
  { key: 'latestFollowUp', label: 'Latest Communication' },
  { key: 'nextFollowUp', label: 'Next Action & Date' },
  { key: 'actions', label: 'Actions', width: '1%' },
];

const SORT_LABELS: Record<string, string> = {
  taskId: 'Task ID',
  date: 'Task Date',
  dueDate: 'Due Date',
  title: 'Title',
  priority: 'Priority',
  workStatus: 'Status',
  createdAt: 'Created At',
};

export default function FollowUpWorkspace({ filters, onFiltersChange, refreshKey }: FollowUpWorkspaceProps) {
  const { tasks, pagination, loading, error, fetchTasks, deleteManyTasks } = useTasks();
  const { settings } = useEscalation();

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [activeHistoryTask, setActiveHistoryTask] = useState<Task | null>(null);
  const [quickAddTask, setQuickAddTask] = useState<Task | null>(null);

  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Fetch tasks when filters or refreshKey changes
  useEffect(() => {
    fetchTasks({ ...filters, hasFollowUps: 'true', limit: filters.limit || 15 });
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchTasks({ ...filters, hasFollowUps: 'true', limit: filters.limit || 15 }, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [filters, refreshKey, fetchTasks]);

  // Debounce search input
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ search: searchInput, page: 1 });
      }
    }, 350);
    return () => clearTimeout(searchDebounce.current);
  }, [searchInput]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tasks.map((t) => t._id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const executeBulkDelete = async () => {
    setIsDeleting(true);
    setShowBulkDeleteConfirm(false);
    try {
      const count = selectedIds.length;
      await deleteManyTasks(selectedIds);
      setSelectedIds([]);
      fetchTasks({ ...filters, hasFollowUps: 'true', limit: filters.limit || 15 });
      setDeleteSuccess(`Successfully deleted ${count} task${count > 1 ? 's' : ''}`);
      setTimeout(() => setDeleteSuccess(null), 3500);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete selected tasks');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSort = (field: string) => {
    const sortableMap: Record<string, string> = {
      sr: 'taskId',
      taskId: 'taskId',
      title: 'title',
      date: 'date',
      latestFollowUp: 'date',
      nextFollowUp: 'dueDate',
    };
    const mapped = sortableMap[field];
    if (!mapped) return;
    const newOrder = (filters.sort === mapped || (!filters.sort && mapped === 'taskId')) && filters.order === 'desc' ? 'asc' : 'desc';
    onFiltersChange({ sort: mapped, order: newOrder });
  };

  const isCustomSort = Boolean((filters.sort && filters.sort !== 'taskId') || (filters.order && filters.order === 'asc'));

  const activeFiltersCount = [
    filters.status,
    filters.priority,
    filters.givenBy,
    filters.dateFrom,
    filters.dateTo,
    isCustomSort ? 'customSort' : '',
  ].filter(Boolean).length;

  return (
    <div className="follow-up-workspace">
      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div
        className="fu-toolbar"
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          marginBottom: 14,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', flex: 1, minWidth: 260 }}>
          <SearchBar value={searchInput} onChange={setSearchInput} />

          {/* Filter button */}
          <div ref={filterRef} style={{ position: 'relative' }}>
            <button
              id="btn-filter-sort"
              className={`btn ${activeFiltersCount > 0 ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setShowFilter(!showFilter)}
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Filter style={{ width: 14, height: 14 }} />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span
                  style={{
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
                  }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {showFilter && (
              <FilterSortPanel
                filters={filters}
                onFiltersChange={(f) => {
                  onFiltersChange(f);
                }}
                onClose={() => setShowFilter(false)}
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

          {selectMode && selectedIds.length > 0 && (
            <button className="btn btn-danger" onClick={handleDeleteSelected}>
              <Trash2 style={{ width: 14, height: 14 }} />
              Delete {selectedIds.length}
            </button>
          )}
        </div>

        {/* Right Actions: Export Menu */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <ExportMenu
            filters={{ ...filters, hasFollowUps: 'true' }}
            selectedIds={selectedIds}
            totalTasks={selectedIds.length > 0 ? selectedIds.length : (pagination?.total ?? tasks.length)}
          />
        </div>
      </div>

      {/* ── Active Filters Chips Bar ───────────────────────────────── */}
      {activeFiltersCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 14,
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
                onClick={() => onFiltersChange({ status: '', page: 1 })}
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
                onClick={() => onFiltersChange({ priority: '', page: 1 })}
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
                onClick={() => onFiltersChange({ givenBy: '', page: 1 })}
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
                onClick={() => onFiltersChange({ dateFrom: '', dateTo: '', page: 1 })}
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
                onClick={() => onFiltersChange({ sort: 'taskId', order: 'desc', page: 1 })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'inline-flex' }}
                title="Reset sort to default"
              >
                <X style={{ width: 12, height: 12 }} />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={() => onFiltersChange({ status: '', priority: '', givenBy: '', dateFrom: '', dateTo: '', sort: 'taskId', order: 'desc', page: 1 })}
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

      {/* ── Main Follow-Up Container ────────────────────────────────────────── */}
      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative' }}>
        {loading && (
          <div className="loading-bar">
            <div className="loading-bar-inner" />
          </div>
        )}

        {error ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ color: 'var(--high)', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>⚠ {error}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Make sure the server is reachable.</p>
          </div>
        ) : tasks.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
            <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles style={{ width: 22, height: 22 }} />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {filters.month
                  ? `No follow-ups found for ${SHORT_MONTHS[parseInt(filters.month || '1', 10) - 1] || 'this month'} ${filters.year || ''}`
                  : 'No follow-up records found'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {activeFiltersCount > 0
                  ? 'No follow-up communication matches your current active filters.'
                  : 'Tasks with logged communication logs, reminders, or next actions will appear here.'}
              </p>
              {filters.month && (
                <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onFiltersChange({ month: '', weekIndex: undefined, day: '', page: 1 })}
                    style={{ fontSize: 13, padding: '7px 16px' }}
                  >
                    View All Months ({filters.year || '2026'})
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table (Hidden on small mobile screens via CSS) */}
            <div className="fu-desktop-table" style={{ overflowX: 'auto' }}>
              <table className="task-table fu-table">
                <thead>
                  <tr>
                    {SORTABLE_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => {
                          if (col.key === 'sr' && selectMode) {
                            toggleSelectAll();
                            return;
                          }
                          handleSort(col.key);
                        }}
                        style={{
                          cursor: col.key === 'actions' ? 'default' : 'pointer',
                          width: col.width,
                        }}
                      >
                        {col.key === 'sr' && selectMode ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.length === tasks.length && tasks.length > 0}
                            onChange={toggleSelectAll}
                            style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }}
                            aria-label="Select all tasks"
                          />
                        ) : (
                          <span>
                            {col.label}
                            {(filters.sort === col.key || (col.key === 'sr' && (filters.sort === 'taskId' || !filters.sort))) && (
                              <span style={{ marginLeft: 4, opacity: 0.6 }}>
                                {filters.order === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && tasks.length === 0
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`fu-skel-${i}`}>
                          <td colSpan={6} style={{ padding: '16px 20px' }}>
                            <div className="skeleton" style={{ height: 24, width: '100%', opacity: 1 - i * 0.18 }} />
                          </td>
                        </tr>
                      ))
                    : tasks.map((task, i) => (
                        <FollowUpRow
                          key={task._id}
                          task={task}
                          index={i}
                          selected={selectedIds.includes(task._id)}
                          selectMode={selectMode}
                          escalationThreshold={settings?.threshold ?? 3}
                          escalationEnabled={settings?.enabled ?? false}
                          onSelect={toggleSelect}
                          onOpenHistory={setActiveHistoryTask}
                          onQuickAdd={setQuickAddTask}
                        />
                      ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Visible only on <= 768px via CSS) */}
            <div className="fu-mobile-cards" style={{ display: 'none', flexDirection: 'column', gap: 12, padding: 12 }}>
              {tasks.map((task) => (
                <FollowUpCard
                  key={task._id}
                  task={task}
                  selected={selectedIds.includes(task._id)}
                  selectMode={selectMode}
                  escalationThreshold={settings?.threshold ?? 3}
                  escalationEnabled={settings?.enabled ?? false}
                  onSelect={toggleSelect}
                  onOpenHistory={setActiveHistoryTask}
                  onQuickAdd={setQuickAddTask}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Pagination ──────────────────────────────────────────────────────── */}
        {!loading && tasks.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderTop: 'var(--border-width-layout) solid var(--border)',
              fontSize: 13,
              color: 'var(--text-primary)',
              fontWeight: 700,
              background: 'var(--bg-elevated)',
            }}
          >
            <span>
              {(pagination.page - 1) * (filters.limit || 15) + 1}–
              {Math.min(pagination.page * (filters.limit || 15), pagination.total)} of {pagination.total}
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                className="btn btn-ghost"
                disabled={pagination.page === 1}
                onClick={() => onFiltersChange({ page: Math.max(1, pagination.page - 1) })}
                style={{ padding: '4px 8px', minWidth: 32, height: 32 }}
                aria-label="Previous page"
              >
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>

              {Array.from({ length: pagination.pages }).map((_, idx) => {
                const p = idx + 1;
                if (pagination.pages > 7) {
                  if (p !== 1 && p !== pagination.pages && Math.abs(p - pagination.page) > 1) {
                    if (p === 2 || p === pagination.pages - 1)
                      return (
                        <span key={p} style={{ padding: '0 2px', opacity: 0.3, fontSize: 11 }}>
                          …
                        </span>
                      );
                    return null;
                  }
                }
                const isActive = p === pagination.page;
                return (
                  <button
                    key={p}
                    className={`btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => onFiltersChange({ page: p })}
                    style={{
                      padding: '2px 8px',
                      minWidth: 30,
                      height: 30,
                      fontSize: 12,
                      fontWeight: isActive ? 800 : 500,
                    }}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                className="btn btn-ghost"
                disabled={pagination.page === pagination.pages}
                onClick={() => onFiltersChange({ page: Math.min(pagination.pages, pagination.page + 1) })}
                style={{ padding: '4px 8px', minWidth: 32, height: 32 }}
                aria-label="Next page"
              >
                <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Follow-Up Detail History (Slide-over drawer / modal) ─────────────── */}
      {activeHistoryTask && (
        <FollowUpPanel
          task={activeHistoryTask}
          onClose={() => setActiveHistoryTask(null)}
          onTaskUpdated={() => {
            fetchTasks({ ...filters, hasFollowUps: 'true', limit: filters.limit || 15 }, true);
          }}
        />
      )}

      {/* ── Quick Add Follow-Up Modal ────────────────────────────────────────── */}
      {quickAddTask && (
        <FollowUpQuickAdd
          task={quickAddTask}
          onClose={() => setQuickAddTask(null)}
          onAdded={() => {
            fetchTasks({ ...filters, hasFollowUps: 'true', limit: filters.limit || 15 }, true);
          }}
        />
      )}

      {/* ── Bulk Delete Confirmation Modal ─────────────────────────────────── */}
      {showBulkDeleteConfirm && (
        <div className="app-dialog-overlay" onClick={() => !isDeleting && setShowBulkDeleteConfirm(false)}>
          <div
            className="app-dialog-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <div className="app-dialog-accent-bar app-dialog-accent-danger" />

            <div className="app-dialog-header">
              <div className="app-dialog-header-left">
                <div className="app-dialog-icon-wrap app-dialog-icon-danger">
                  <Trash2 style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div className="app-dialog-eyebrow app-dialog-eyebrow-danger">
                    BULK DELETION
                  </div>
                  <h3 className="app-dialog-title">Delete {selectedIds.length} Tasks?</h3>
                </div>
              </div>
              <button
                type="button"
                className="app-dialog-close-btn"
                onClick={() => !isDeleting && setShowBulkDeleteConfirm(false)}
                aria-label="Close dialog"
                disabled={isDeleting}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="app-dialog-body">
              <p className="app-dialog-desc">
                Are you sure you want to permanently delete these <strong>{selectedIds.length}</strong> selected tasks? All associated follow-up logs and records will be deleted.
              </p>

              <div className="app-dialog-card">
                <div className="app-dialog-row">
                  <span className="app-dialog-label">Selected Count</span>
                  <span className="app-dialog-value" style={{ color: '#f87171' }}>
                    {selectedIds.length} Tasks
                  </span>
                </div>
                <div className="app-dialog-row">
                  <span className="app-dialog-label">Impact</span>
                  <span className="app-dialog-value">Permanent & irreversible</span>
                </div>
              </div>
            </div>

            <div className="app-dialog-footer">
              <button
                type="button"
                className="app-dialog-btn-cancel"
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app-dialog-btn-action app-dialog-btn-danger"
                onClick={executeBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>Deleting…</>
                ) : (
                  <>
                    <Trash2 style={{ width: 14, height: 14 }} />
                    Delete {selectedIds.length} Tasks
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Error Modal ─────────────────────────────────────────────── */}
      {deleteError && (
        <div className="app-dialog-overlay" onClick={() => setDeleteError(null)}>
          <div
            className="app-dialog-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <div className="app-dialog-accent-bar app-dialog-accent-danger" />

            <div className="app-dialog-header">
              <div className="app-dialog-header-left">
                <div className="app-dialog-icon-wrap app-dialog-icon-danger">
                  <AlertTriangle style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div className="app-dialog-eyebrow app-dialog-eyebrow-danger">
                    DELETE ERROR
                  </div>
                  <h3 className="app-dialog-title">Deletion Failed</h3>
                </div>
              </div>
              <button
                type="button"
                className="app-dialog-close-btn"
                onClick={() => setDeleteError(null)}
                aria-label="Close dialog"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="app-dialog-body">
              <p className="app-dialog-desc">
                {deleteError}
              </p>
            </div>

            <div className="app-dialog-footer">
              <button
                type="button"
                className="app-dialog-btn-action app-dialog-btn-danger"
                onClick={() => setDeleteError(null)}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Toast Pop ──────────────────────────────────────────────── */}
      {deleteSuccess && (
        <div className="app-toast app-toast-success" role="status">
          <div className="app-toast-icon">
            <CheckCircle2 style={{ width: 16, height: 16 }} />
          </div>
          <span className="app-toast-text">{deleteSuccess}</span>
          <button
            type="button"
            className="app-toast-dismiss"
            onClick={() => setDeleteSuccess(null)}
            aria-label="Dismiss toast"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}
    </div>
  );
}
