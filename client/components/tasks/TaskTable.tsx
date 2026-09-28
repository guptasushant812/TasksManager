'use client';
import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { Task, TaskFilters, Pagination } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import TaskRow from './TaskRow';
import SearchBar from './SearchBar';
import FilterSortPanel from './FilterSortPanel';
import ExportMenu from './ExportMenu';
import { formatDate, getDayName, getWeeksInMonth } from '@/lib/dates';
import EditTaskModal from '../modals/EditTaskModal';
import NewTaskModal from '../modals/NewTaskModal';
import FollowUpPanel from '../follow-ups/FollowUpPanel';
import FollowUpQuickAdd from '../follow-ups/FollowUpQuickAdd';
import { Filter, CheckSquare, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface TaskTableProps {
  filters: TaskFilters;
  onFiltersChange: (f: Partial<TaskFilters>) => void;
  refreshKey: number;
  mode?: 'tasks' | 'follow-ups';
}

const SORT_COLUMNS: { key: string; label: string }[] = [
  { key: 'sr', label: '#' },
  { key: 'title', label: 'Task' },
  { key: 'description', label: 'Description' },
  { key: 'givenBy', label: 'Given By' },
  { key: 'priority', label: 'Priority' },
  { key: 'workStatus', label: 'Status' },
  { key: 'date', label: 'Date' },
  { key: 'reason', label: 'Reason / Remarks' },
  { key: 'actions', label: 'Actions' },
];

export default function TaskTable({ filters, onFiltersChange, refreshKey, mode = 'tasks' }: TaskTableProps) {
  const { tasks, pagination, loading, error, fetchTasks, deleteTask, deleteManyTasks } = useTasks();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [followUpTask, setFollowUpTask] = useState<Task | null>(null);
  const [quickFollowUpTask, setQuickFollowUpTask] = useState<Task | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Fetch whenever filters or refreshKey changes
  useEffect(() => {
    fetchTasks({ ...filters, limit: filters.limit || 20 });
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchTasks({ ...filters, limit: filters.limit || 20 }, true);
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
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tasks.map((t) => t._id));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await deleteTask(id);
    fetchTasks({ ...filters, limit: filters.limit || 20 });
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected task(s)?`)) return;
    try {
      await deleteManyTasks(selectedIds);
      setSelectedIds([]);
      fetchTasks({ ...filters, limit: filters.limit || 20 });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete selected tasks');
    }
  };

  const handleSort = (field: string) => {
    const sortable = ['title', 'date', 'dueDate', 'priority', 'workStatus', 'createdAt'];
    if (!sortable.includes(field)) return;
    const newOrder = filters.sort === field && filters.order === 'desc' ? 'asc' : 'desc';
    onFiltersChange({ sort: field, order: newOrder });
  };

  const activeFiltersCount = [
    filters.status, filters.priority, filters.givenBy,
    filters.dateFrom, filters.dateTo
  ].filter(Boolean).length;

  return (
    <div>
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <SearchBar value={searchInput} onChange={setSearchInput} />

        <div ref={filterRef} style={{ position: 'relative' }}>
          <button
            id="btn-filter-sort"
            className="btn btn-ghost"
            onClick={() => setShowFilter(!showFilter)}
            style={{ position: 'relative' }}
          >
            <Filter style={{ width: 14, height: 14 }} />
            Filter
            {activeFiltersCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--accent)', color: '#fff',
                borderRadius: '50%', width: 16, height: 16,
                fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700,
              }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
          {showFilter && (
            <FilterSortPanel
              filters={filters}
              onFiltersChange={(f) => { onFiltersChange(f); }}
              onClose={() => setShowFilter(false)}
            />
          )}
        </div>

        <button
          id="btn-select-mode"
          className={`btn ${selectMode ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setSelectMode(!selectMode); setSelectedIds([]); }}
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

        <ExportMenu
          filters={filters}
          selectedIds={selectedIds}
          totalTasks={selectedIds.length > 0 ? selectedIds.length : (pagination?.total ?? tasks.length)}
          onAddNewTask={() => setShowNewTaskModal(true)}
        />
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative' }}>
        {loading && (
          <div className="loading-bar">
            <div className="loading-bar-inner" />
          </div>
        )}
        {error ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: 'var(--high)', marginBottom: 6, fontSize: 13 }}>⚠ {error}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Make sure the server is running on port 4000</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="task-table">
              <thead>
                <tr>
                  {SORT_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => {
                        if (col.key === 'sr' && selectMode) { toggleSelectAll(); return; }
                        handleSort(col.key);
                      }}
                      style={{ cursor: col.key === 'actions' ? 'default' : 'pointer' }}
                    >
                      {col.key === 'sr' && selectMode ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.length === tasks.length && tasks.length > 0}
                          onChange={toggleSelectAll}
                          style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }}
                        />
                      ) : (
                        <span>
                          {col.label}
                          {filters.sort === col.key && (
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
                {loading && tasks.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td colSpan={10} style={{ padding: '16px 24px' }}>
                        <div className="skeleton" style={{ height: 20, width: '100%', opacity: 1 - i * 0.15 }} />
                      </td>
                    </tr>
                  ))
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                      <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No tasks found</p>
                      <p style={{ fontSize: 12 }}>
                        {activeFiltersCount > 0 ? 'Try clearing some filters' : 'Create your first task using the "+ New Task" button'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    let weeksInMonth: any[] = [];
                    if (filters.month && filters.year) {
                      weeksInMonth = getWeeksInMonth(parseInt(filters.year), parseInt(filters.month));
                    }
                    
                    let lastWeekKey = '';
                    
                    return tasks.map((task, i) => {
                      const showWeekGroup = filters.month && filters.sort === 'date';
                      let weekGroupHeader = null;

                      if (showWeekGroup) {
                        const d = new Date(task.date);
                        const taskTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                        
                        const weekObj = weeksInMonth.find(w => {
                           const s = new Date(w.start.getFullYear(), w.start.getMonth(), w.start.getDate()).getTime();
                           const e = new Date(w.end.getFullYear(), w.end.getMonth(), w.end.getDate()).getTime();
                           return taskTime >= s && taskTime <= e;
                        });
                        
                        const weekTitle = weekObj ? `Week ${weekObj.index}` : `Week of ${formatDate(task.date)}`;
                        const weekSubtitle = weekObj ? `${formatDate(weekObj.start)} – ${formatDate(weekObj.end)}` : null;
                        const weekKey = weekObj ? `week-${weekObj.index}` : `week-${task.date}`;

                        if (weekKey !== lastWeekKey) {
                          lastWeekKey = weekKey;
                          weekGroupHeader = (
                            <tr key={`group-${weekKey}`}>
                              <td colSpan={10} style={{
                                padding: '12px 16px',
                                background: 'var(--bg-elevated)',
                                borderBottom: '1px solid var(--border-subtle)',
                                borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                                  <span style={{
                                    fontWeight: 700,
                                    color: 'var(--accent)',
                                    fontSize: 11,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                  }}>
                                    {weekTitle}
                                  </span>
                                  {weekSubtitle && (
                                    <span style={{
                                      fontSize: 12,
                                      fontWeight: 500,
                                      color: 'var(--text-secondary)',
                                      letterSpacing: '0.02em'
                                    }}>
                                      {weekSubtitle}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      }

                      return (
                        <Fragment key={task._id}>
                          {weekGroupHeader}
                          <TaskRow
                            task={task}
                            index={i}
                            selected={selectedIds.includes(task._id)}
                            selectMode={selectMode}
                            followUpSummary={task.followUpSummary}
                            mode={mode}
                            onSelect={toggleSelect}
                            onEdit={setEditTask}
                            onDelete={handleDelete}
                            onFollowUp={setFollowUpTask}
                            onQuickFollowUp={setQuickFollowUpTask}
                          />
                        </Fragment>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────── */}
        {!loading && tasks.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px',
            borderTop: 'var(--border-width-layout) solid var(--border)',
            fontSize: 14, color: 'var(--text-primary)', fontWeight: 700
          }}>
            <span>
              {(pagination.page - 1) * (filters.limit || 10) + 1}–{Math.min(pagination.page * (filters.limit || 10), pagination.total)} of {pagination.total}
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <PaginationBtn
                disabled={pagination.page === 1}
                onClick={() => onFiltersChange({ page: Math.max(1, pagination.page - 1) })}
              >
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </PaginationBtn>

              {Array.from({ length: pagination.pages }).map((_, idx) => {
                const p = idx + 1;
                if (pagination.pages > 7) {
                  if (p !== 1 && p !== pagination.pages && Math.abs(p - pagination.page) > 1) {
                    if (p === 2 || p === pagination.pages - 1) return <span key={p} style={{ padding: '0 2px', opacity: 0.3, fontSize: 11 }}>…</span>;
                    return null;
                  }
                }
                const isActive = p === pagination.page;
                return (
                  <PaginationBtn
                    key={p}
                    active={isActive}
                    onClick={() => onFiltersChange({ page: p })}
                  >
                    {p}
                  </PaginationBtn>
                );
              })}

              <PaginationBtn
                disabled={pagination.page === pagination.pages}
                onClick={() => onFiltersChange({ page: Math.min(pagination.pages, pagination.page + 1) })}
              >
                <ChevronRight style={{ width: 14, height: 14 }} />
              </PaginationBtn>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editTask && (
        <EditTaskModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onSaved={() => { setEditTask(null); fetchTasks({ ...filters, limit: filters.limit || 10 }); }}
        />
      )}

      {/* New task modal (triggered from Zero-Defect export validation or toolbar) */}
      {showNewTaskModal && (
        <NewTaskModal
          defaultFilters={filters}
          onClose={() => setShowNewTaskModal(false)}
          onSaved={() => {
            setShowNewTaskModal(false);
            fetchTasks({ ...filters, limit: filters.limit || 20 });
          }}
        />
      )}

      {/* Follow-up panel */}
      {followUpTask && (
        <FollowUpPanel
          task={followUpTask}
          onClose={() => setFollowUpTask(null)}
          onTaskUpdated={() => fetchTasks({ ...filters, limit: filters.limit || 10 }, true)}
        />
      )}

      {/* Quick Add modal */}
      {quickFollowUpTask && (
        <FollowUpQuickAdd
          task={quickFollowUpTask}
          onClose={() => setQuickFollowUpTask(null)}
          onAdded={() => fetchTasks({ ...filters, limit: filters.limit || 10 }, true)}
        />
      )}
    </div>
  );
}

/* Pagination button — extracted for consistency */
function PaginationBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: active ? 'var(--text-primary)' : 'var(--bg-surface)',
        color: active ? 'var(--bg-base)' : 'var(--text-primary)',
        border: 'var(--border-width-layout) solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        minWidth: 32, height: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 14, fontWeight: 900,
        transition: 'all 0.1s',
        opacity: disabled ? 0.3 : 1,
        padding: '0 4px',
        boxShadow: active || disabled ? 'none' : 'var(--box-shadow-brutalist-sm)',
        transform: active || disabled ? 'translate(2px, 2px)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.transform = 'translate(-2px, -2px)';
          e.currentTarget.style.boxShadow = 'var(--box-shadow-brutalist)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.background = 'var(--bg-surface)';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'var(--box-shadow-brutalist-sm)';
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translate(2px, 2px)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      onMouseUp={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.transform = 'translate(-2px, -2px)';
          e.currentTarget.style.boxShadow = 'var(--box-shadow-brutalist)';
        }
      }}
    >
      {children}
    </button>
  );
}
