'use client';
import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { Task, TaskFilters, Pagination } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import TaskRow from './TaskRow';
import SearchBar from './SearchBar';
import FilterSortPanel from './FilterSortPanel';
import ExportMenu from './ExportMenu';
import { formatDate, getDayName, getWeeksInMonth, SHORT_MONTHS } from '@/lib/dates';
import EditTaskModal from '../modals/EditTaskModal';
import NewTaskModal from '../modals/NewTaskModal';
import FollowUpPanel from '../follow-ups/FollowUpPanel';
import FollowUpQuickAdd from '../follow-ups/FollowUpQuickAdd';
import Link from 'next/link';
import { Filter, CheckSquare, Trash2, ChevronLeft, ChevronRight, ArrowRight, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TaskTableProps {
  filters: TaskFilters;
  onFiltersChange: (f: Partial<TaskFilters>) => void;
  refreshKey: number;
  mode?: 'tasks' | 'follow-ups';
  isDashboard?: boolean;
}

const SORT_COLUMNS: { key: string; label: string }[] = [
  { key: 'taskId', label: '#' },
  { key: 'title', label: 'Task' },
  { key: 'description', label: 'Description' },
  { key: 'givenBy', label: 'Given By' },
  { key: 'priority', label: 'Priority' },
  { key: 'workStatus', label: 'Status' },
  { key: 'date', label: 'Date' },
  { key: 'reason', label: 'Reason / Remarks' },
  { key: 'actions', label: 'Actions' },
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

export default function TaskTable({ filters, onFiltersChange, refreshKey, mode = 'tasks', isDashboard = false }: TaskTableProps) {
  const { tasks, pagination, loading, error, fetchTasks, deleteTask, deleteManyTasks } = useTasks();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [followUpTask, setFollowUpTask] = useState<Task | null>(null);
  const [quickFollowUpTask, setQuickFollowUpTask] = useState<Task | null>(null);

  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const tableLimit = isDashboard ? 5 : (filters.limit || 20);
  const displayedTasks = isDashboard ? tasks.slice(0, 5) : tasks;

  // Fetch whenever filters or refreshKey changes
  useEffect(() => {
    fetchTasks({ ...filters, limit: tableLimit });
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchTasks({ ...filters, limit: tableLimit }, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [filters, refreshKey, fetchTasks, tableLimit]);

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

  const handleDelete = (id: string) => {
    const target = tasks.find((t) => t._id === id);
    if (target) {
      setTaskToDelete(target);
    } else {
      setTaskToDelete({ _id: id, taskId: id, title: 'Selected task' } as Task);
    }
  };

  const executeSingleDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTask(taskToDelete._id);
      const deletedTaskId = taskToDelete.taskId;
      setTaskToDelete(null);
      fetchTasks({ ...filters, limit: tableLimit });
      setDeleteSuccessMsg(`Task ${deletedTaskId} deleted successfully`);
      setTimeout(() => setDeleteSuccessMsg(null), 3500);
    } catch (err) {
      setDeleteErrorMsg(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setIsDeleting(false);
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
      fetchTasks({ ...filters, limit: tableLimit });
      setDeleteSuccessMsg(`Successfully deleted ${count} task${count > 1 ? 's' : ''}`);
      setTimeout(() => setDeleteSuccessMsg(null), 3500);
    } catch (err) {
      setDeleteErrorMsg(err instanceof Error ? err.message : 'Failed to delete selected tasks');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSort = (field: string) => {
    const sortField = field === 'sr' ? 'taskId' : field;
    const sortable = ['taskId', 'title', 'date', 'dueDate', 'priority', 'workStatus', 'createdAt'];
    if (!sortable.includes(sortField)) return;
    const newOrder = (filters.sort === sortField || (!filters.sort && sortField === 'taskId')) && filters.order === 'desc' ? 'asc' : 'desc';
    onFiltersChange({ sort: sortField, order: newOrder });
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
    <div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <SearchBar value={searchInput} onChange={setSearchInput} />

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

      {activeFiltersCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 12,
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

      <div className="glass task-table-wrapper" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative' }}>
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
          <div className="task-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="task-table">
              <thead>
                <tr>
                  {SORT_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => {
                        if (col.key === 'taskId' && selectMode) { toggleSelectAll(); return; }
                        handleSort(col.key);
                      }}
                      style={{ cursor: col.key === 'actions' ? 'default' : 'pointer' }}
                    >
                      {col.key === 'taskId' && selectMode ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.length === displayedTasks.length && displayedTasks.length > 0}
                          onChange={toggleSelectAll}
                          style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }}
                        />
                      ) : (
                        <span>
                          {col.label}
                          {(filters.sort === col.key || (col.key === 'taskId' && (!filters.sort || filters.sort === 'taskId'))) && (
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
                    <tr key={`skeleton-${i}`} className="skeleton-row">
                      <td colSpan={10} style={{ padding: '16px 24px' }}>
                        <div className="skeleton" style={{ height: 20, width: '100%', opacity: 1 - i * 0.15 }} />
                      </td>
                    </tr>
                  ))
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                      <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {filters.month 
                            ? `No tasks found for ${SHORT_MONTHS[parseInt(filters.month || '1', 10) - 1] || 'this month'} ${filters.year || ''}`
                            : 'No tasks found'
                          }
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                          {filters.month
                            ? 'You are viewing a specific month with no tasks yet. Your previous tasks are safe in other months.'
                            : activeFiltersCount > 0 
                              ? 'No tasks match your current filters.' 
                              : 'Create your first task using the "+ New Task" button.'
                          }
                        </p>
                        {filters.month && (
                          <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => onFiltersChange({ month: '', weekIndex: undefined, day: '', page: 1 })}
                              style={{ fontSize: 13, padding: '7px 16px' }}
                            >
                              View All Months ({filters.year || '2026'})
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => {
                                const currentMo = parseInt(filters.month || '1', 10);
                                const prevMonth = currentMo === 1 ? '12' : String(currentMo - 1);
                                onFiltersChange({ month: prevMonth, weekIndex: undefined, day: '', page: 1 });
                              }}
                              style={{ fontSize: 13, padding: '7px 16px' }}
                            >
                              View Previous Month
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    let weeksInMonth: any[] = [];
                    if (filters.month && filters.year) {
                      weeksInMonth = getWeeksInMonth(parseInt(filters.year), parseInt(filters.month));
                    }
                    
                    let lastWeekKey = '';
                    
                    return displayedTasks.map((task, i) => {
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

        {!loading && (isDashboard ? tasks.slice(0, 5).length > 0 : tasks.length > 0) && (
          isDashboard ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderTop: 'var(--border-width-layout) solid var(--border)',
              background: 'var(--bg-surface)',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>
                Showing top {Math.min(5, tasks.length)} latest tasks of {pagination.total} total
              </span>
              <Link href="/tasks" style={{ textDecoration: 'none' }}>
                <button
                  className="btn btn-primary brutalist-hover"
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '7px 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>View All Tasks</span>
                  <ArrowRight className="rtl-flip" style={{ width: 14, height: 14 }} />
                </button>
              </Link>
            </div>
          ) : (
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
          )
        )}
      </div>

      {editTask && (
        <EditTaskModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onSaved={() => { setEditTask(null); fetchTasks({ ...filters, limit: tableLimit }); }}
        />
      )}

      {showNewTaskModal && (
        <NewTaskModal
          defaultFilters={filters}
          onClose={() => setShowNewTaskModal(false)}
          onSaved={() => {
            setShowNewTaskModal(false);
            fetchTasks({ ...filters, limit: tableLimit });
          }}
        />
      )}

      {followUpTask && (
        <FollowUpPanel
          task={followUpTask}
          onClose={() => setFollowUpTask(null)}
          onTaskUpdated={() => fetchTasks({ ...filters, limit: tableLimit }, true)}
        />
      )}

      {quickFollowUpTask && (
        <FollowUpQuickAdd
          task={quickFollowUpTask}
          onClose={() => setQuickFollowUpTask(null)}
          onAdded={() => fetchTasks({ ...filters, limit: tableLimit }, true)}
        />
      )}

      {taskToDelete && (
        <div className="app-dialog-overlay" onClick={() => !isDeleting && setTaskToDelete(null)}>
          <div
            className="app-dialog-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 450 }}
          >
            <div className="app-dialog-accent-bar app-dialog-accent-danger" />

            <div className="app-dialog-header">
              <div className="app-dialog-header-left">
                <div className="app-dialog-icon-wrap app-dialog-icon-danger">
                  <Trash2 style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div className="app-dialog-eyebrow app-dialog-eyebrow-danger">
                    CONFIRM DELETION
                  </div>
                  <h3 className="app-dialog-title">Delete Task?</h3>
                </div>
              </div>
              <button
                type="button"
                className="app-dialog-close-btn"
                onClick={() => !isDeleting && setTaskToDelete(null)}
                aria-label="Close dialog"
                disabled={isDeleting}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="app-dialog-body">
              <p className="app-dialog-desc">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>

              <div className="app-dialog-card">
                {taskToDelete.taskId && (
                  <div className="app-dialog-row">
                    <span className="app-dialog-label">Task ID</span>
                    <span className="app-dialog-value" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>
                      {taskToDelete.taskId}
                    </span>
                  </div>
                )}
                <div className="app-dialog-row">
                  <span className="app-dialog-label">Title</span>
                  <span className="app-dialog-value" style={{ maxWidth: 260, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {taskToDelete.title}
                  </span>
                </div>
                {taskToDelete.workStatus && (
                  <div className="app-dialog-row">
                    <span className="app-dialog-label">Status</span>
                    <span className="app-dialog-value">{taskToDelete.workStatus}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="app-dialog-footer">
              <button
                type="button"
                className="app-dialog-btn-cancel"
                onClick={() => setTaskToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app-dialog-btn-action app-dialog-btn-danger"
                onClick={executeSingleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>Deleting…</>
                ) : (
                  <>
                    <Trash2 style={{ width: 14, height: 14 }} />
                    Delete Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                Are you sure you want to delete these <strong>{selectedIds.length}</strong> selected tasks? All associated follow-up logs will also be permanently removed.
              </p>

              <div className="app-dialog-card">
                <div className="app-dialog-row">
                  <span className="app-dialog-label">Tasks to Delete</span>
                  <span className="app-dialog-value" style={{ color: '#f87171' }}>
                    {selectedIds.length} Tasks
                  </span>
                </div>
                <div className="app-dialog-row">
                  <span className="app-dialog-label">Action</span>
                  <span className="app-dialog-value">Permanent removal</span>
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

      {deleteErrorMsg && (
        <div className="app-dialog-overlay" onClick={() => setDeleteErrorMsg(null)}>
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
                    ACTION ERROR
                  </div>
                  <h3 className="app-dialog-title">Deletion Failed</h3>
                </div>
              </div>
              <button
                type="button"
                className="app-dialog-close-btn"
                onClick={() => setDeleteErrorMsg(null)}
                aria-label="Close dialog"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="app-dialog-body">
              <p className="app-dialog-desc">{deleteErrorMsg}</p>
            </div>

            <div className="app-dialog-footer">
              <button
                type="button"
                className="app-dialog-btn-action app-dialog-btn-danger"
                onClick={() => setDeleteErrorMsg(null)}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSuccessMsg && (
        <div className="app-toast app-toast-success" role="status">
          <div className="app-toast-icon">
            <CheckCircle2 style={{ width: 16, height: 16 }} />
          </div>
          <span className="app-toast-text">{deleteSuccessMsg}</span>
          <button
            type="button"
            className="app-toast-dismiss"
            onClick={() => setDeleteSuccessMsg(null)}
            aria-label="Dismiss toast"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}
    </div>
  );
}

function PaginationBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      className={`brutalist-hover ${active ? 'active' : ''}`}
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
        opacity: disabled ? 0.3 : 1,
        padding: '0 4px',
      }}
    >
      {children}
    </button>
  );
}
