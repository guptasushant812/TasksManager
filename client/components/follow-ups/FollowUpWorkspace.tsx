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
import FollowUpAddModal from './FollowUpAddModal';
import { Filter, CheckSquare, Trash2, ChevronLeft, ChevronRight, Sparkles, Plus, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SHORT_MONTHS, toIsoDate, formatDate } from '@/lib/dates';

interface EmptyStateAction {
  label: string;
  variant: 'primary' | 'ghost';
  onClick: () => void;
}

interface EmptyStateConfig {
  title: string;
  description: string;
  actions: EmptyStateAction[];
}

function getFollowUpEmptyStateConfig({
  filters,
  onFiltersChange,
  onClearSearch,
}: {
  filters: TaskFilters;
  onFiltersChange: (f: Partial<TaskFilters>) => void;
  onClearSearch: () => void;
}): EmptyStateConfig {
  const now = new Date();
  const currentYearStr = now.getFullYear().toString();
  const currentMonthStr = (now.getMonth() + 1).toString();
  const todayIso = toIsoDate(now);

  const isToday = Boolean(filters.day && (filters.day === todayIso || filters.day.startsWith(todayIso)));
  const hasSpecificDay = Boolean(filters.day);
  const hasWeek = Boolean(filters.weekIndex && filters.month) && !hasSpecificDay;
  const hasMonth = Boolean(filters.month) && !hasSpecificDay && !hasWeek;
  const monthName = filters.month ? (SHORT_MONTHS[parseInt(filters.month, 10) - 1] || 'this month') : '';
  const yearText = filters.year || currentYearStr;
  const isYearOnly = Boolean(filters.year) && !filters.month && !hasSpecificDay;

  const status = filters.status;
  const statusLabel =
    status === 'InProgress' ? 'In Progress' :
    status === 'Pending' ? 'Pending' :
    status === 'Completed' ? 'Completed' : '';

  const hasSearch = Boolean(filters.search?.trim());
  const hasPriority = Boolean(filters.priority);

  if (hasSearch) {
    return {
      title: `No follow-ups matching "${filters.search}"`,
      description: 'No follow-up communication matches your search query in this view. Try adjusting your keyword or clearing the search filter.',
      actions: [
        {
          label: 'Clear Search',
          variant: 'primary',
          onClick: onClearSearch,
        },
      ],
    };
  }

  // 1. Today Scope
  if (isToday) {
    if (status) {
      return {
        title: `No ${statusLabel.toLowerCase()} follow-ups for today`,
        description: `There are currently no follow-up logs or reminders for "${statusLabel}" tasks scheduled for today.`,
        actions: [
          {
            label: "View All Today's Follow-Ups",
            variant: 'primary',
            onClick: () => onFiltersChange({ status: '', page: 1 }),
          },
          {
            label: 'View This Month',
            variant: 'ghost',
            onClick: () => onFiltersChange({ day: '', page: 1 }),
          },
        ],
      };
    }

    if (hasPriority) {
      return {
        title: `No ${filters.priority} priority follow-ups today`,
        description: `No follow-ups for ${filters.priority} priority tasks are scheduled for today.`,
        actions: [
          {
            label: 'Clear Priority',
            variant: 'primary',
            onClick: () => onFiltersChange({ priority: '', page: 1 }),
          },
          {
            label: "View All Today's Follow-Ups",
            variant: 'ghost',
            onClick: () => onFiltersChange({ priority: '', status: '', page: 1 }),
          },
        ],
      };
    }

    return {
      title: 'No follow-ups scheduled for today',
      description: 'You have no communication logs or scheduled follow-up actions due today.',
      actions: [
        {
          label: 'View This Month',
          variant: 'primary',
          onClick: () => onFiltersChange({ day: '', page: 1 }),
        },
        {
          label: 'View All Time',
          variant: 'ghost',
          onClick: () => onFiltersChange({ day: '', month: '', year: '', page: 1 }),
        },
      ],
    };
  }

  // Specific Day (not today)
  if (hasSpecificDay) {
    const formattedDay = formatDate(filters.day!);
    if (status) {
      return {
        title: `No ${statusLabel.toLowerCase()} follow-ups on ${formattedDay}`,
        description: `No follow-ups for "${statusLabel}" tasks were recorded on ${formattedDay}.`,
        actions: [
          {
            label: `View All on ${formattedDay}`,
            variant: 'primary',
            onClick: () => onFiltersChange({ status: '', page: 1 }),
          },
          {
            label: 'View Full Month',
            variant: 'ghost',
            onClick: () => onFiltersChange({ day: '', page: 1 }),
          },
        ],
      };
    }
    return {
      title: `No follow-ups found for ${formattedDay}`,
      description: 'There are no follow-up communication records on this specific date.',
      actions: [
        {
          label: 'View Full Month',
          variant: 'primary',
          onClick: () => onFiltersChange({ day: '', page: 1 }),
        },
        {
          label: 'View All Time',
          variant: 'ghost',
          onClick: () => onFiltersChange({ day: '', month: '', year: '', page: 1 }),
        },
      ],
    };
  }

  // Week Scope
  if (hasWeek) {
    if (status) {
      return {
        title: `No ${statusLabel.toLowerCase()} follow-ups in Week ${filters.weekIndex}`,
        description: `There are no follow-ups for "${statusLabel}" tasks recorded in Week ${filters.weekIndex} of ${monthName} ${yearText}.`,
        actions: [
          {
            label: `View All in Week ${filters.weekIndex}`,
            variant: 'primary',
            onClick: () => onFiltersChange({ status: '', page: 1 }),
          },
          {
            label: 'View Full Month',
            variant: 'ghost',
            onClick: () => onFiltersChange({ weekIndex: undefined, dateFrom: '', dateTo: '', page: 1 }),
          },
        ],
      };
    }

    if (hasPriority) {
      return {
        title: `No ${filters.priority} priority follow-ups in Week ${filters.weekIndex}`,
        description: `No follow-ups matching ${filters.priority} priority exist in Week ${filters.weekIndex} (${monthName} ${yearText}).`,
        actions: [
          {
            label: 'Clear Priority',
            variant: 'primary',
            onClick: () => onFiltersChange({ priority: '', page: 1 }),
          },
          {
            label: 'View Full Month',
            variant: 'ghost',
            onClick: () => onFiltersChange({ weekIndex: undefined, dateFrom: '', dateTo: '', page: 1 }),
          },
        ],
      };
    }

    return {
      title: `No follow-ups found for Week ${filters.weekIndex}`,
      description: `There are no follow-up records in Week ${filters.weekIndex} (${monthName} ${yearText}).`,
      actions: [
        {
          label: 'View Full Month',
          variant: 'primary',
          onClick: () => onFiltersChange({ weekIndex: undefined, dateFrom: '', dateTo: '', page: 1 }),
        },
        {
          label: `View All Months (${yearText})`,
          variant: 'ghost',
          onClick: () => onFiltersChange({ month: '', weekIndex: undefined, day: '', dateFrom: '', dateTo: '', page: 1 }),
        },
      ],
    };
  }

  // 2. Specific Month Scope
  if (hasMonth) {
    const currentMo = parseInt(filters.month || '1', 10);
    const prevMonth = currentMo === 1 ? '12' : String(currentMo - 1);

    if (status) {
      return {
        title: `No ${statusLabel.toLowerCase()} follow-ups in ${monthName} ${yearText}`,
        description: `There are no follow-ups for "${statusLabel}" tasks recorded in ${monthName} ${yearText}.`,
        actions: [
          {
            label: `View All Follow-Ups for ${monthName}`,
            variant: 'primary',
            onClick: () => onFiltersChange({ status: '', page: 1 }),
          },
          {
            label: `View All Months (${yearText})`,
            variant: 'ghost',
            onClick: () => onFiltersChange({ status: '', month: '', weekIndex: undefined, day: '', page: 1 }),
          },
        ],
      };
    }

    if (hasPriority) {
      return {
        title: `No ${filters.priority} priority follow-ups in ${monthName} ${yearText}`,
        description: `There are no follow-ups matching ${filters.priority} priority tasks in ${monthName} ${yearText}.`,
        actions: [
          {
            label: 'Clear Priority',
            variant: 'primary',
            onClick: () => onFiltersChange({ priority: '', page: 1 }),
          },
          {
            label: `View All Months (${yearText})`,
            variant: 'ghost',
            onClick: () => onFiltersChange({ month: '', weekIndex: undefined, day: '', page: 1 }),
          },
        ],
      };
    }

    return {
      title: `No follow-ups found for ${monthName} ${yearText}`,
      description: 'You are viewing a specific month with no follow-ups yet. Your previous follow-ups are safe in other months.',
      actions: [
        {
          label: `View All Months (${yearText})`,
          variant: 'primary',
          onClick: () => onFiltersChange({ month: '', weekIndex: undefined, day: '', page: 1 }),
        },
        {
          label: 'View Previous Month',
          variant: 'ghost',
          onClick: () => onFiltersChange({ month: prevMonth, weekIndex: undefined, day: '', page: 1 }),
        },
      ],
    };
  }

  // 3. Year Scope
  if (isYearOnly) {
    if (status) {
      return {
        title: `No ${statusLabel.toLowerCase()} follow-ups in ${yearText}`,
        description: `No follow-ups for "${statusLabel}" tasks were found across any months of ${yearText}.`,
        actions: [
          {
            label: `View All Follow-Ups in ${yearText}`,
            variant: 'primary',
            onClick: () => onFiltersChange({ status: '', page: 1 }),
          },
          {
            label: 'View All Time',
            variant: 'ghost',
            onClick: () => onFiltersChange({ year: '', month: '', day: '', status: '', page: 1 }),
          },
        ],
      };
    }

    return {
      title: `No follow-ups found for ${yearText}`,
      description: `There are no communication records logged across any months in ${yearText}.`,
      actions: [
        {
          label: 'View Current Month',
          variant: 'primary',
          onClick: () => onFiltersChange({ year: currentYearStr, month: currentMonthStr, day: '', page: 1 }),
        },
        {
          label: 'View All Time',
          variant: 'ghost',
          onClick: () => onFiltersChange({ year: '', month: '', day: '', page: 1 }),
        },
      ],
    };
  }

  // 4. All Time Scope
  if (status) {
    return {
      title: `No ${statusLabel.toLowerCase()} follow-ups found`,
      description: `There are no follow-up records currently associated with "${statusLabel}" tasks.`,
      actions: [
        {
          label: 'View All Follow-Ups',
          variant: 'primary',
          onClick: () => onFiltersChange({ status: '', page: 1 }),
        },
        {
          label: 'Reset Filters',
          variant: 'ghost',
          onClick: () => onFiltersChange({ status: '', year: currentYearStr, month: currentMonthStr, day: '', priority: '', search: '', page: 1 }),
        },
      ],
    };
  }

  if (hasPriority) {
    return {
      title: `No ${filters.priority} priority follow-ups found`,
      description: `No follow-up records matching ${filters.priority} priority exist in the workspace.`,
      actions: [
        {
          label: 'Clear Priority',
          variant: 'primary',
          onClick: () => onFiltersChange({ priority: '', page: 1 }),
        },
      ],
    };
  }

  return {
    title: 'No follow-up records found',
    description: 'Tasks with logged communication history, reminders, or scheduled next actions will appear here.',
    actions: [
      {
        label: 'Reset Filters',
        variant: 'primary',
        onClick: () => onFiltersChange({ year: currentYearStr, month: currentMonthStr, day: '', status: '', priority: '', search: '', page: 1 }),
      },
    ],
  };
}

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
  const [addFollowUpTask, setAddFollowUpTask] = useState<Task | null>(null);

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

  // Keep searchInput in sync when reset or changed by parent filters
  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  // Auto-search as user types with smooth debounce
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      if (searchInput !== (filters.search || '')) {
        onFiltersChange({ search: searchInput, page: 1 });
      }
    }, 350);
    return () => clearTimeout(searchDebounce.current);
  }, [searchInput, filters.search, onFiltersChange]);

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

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <ExportMenu
            filters={{ ...filters, hasFollowUps: 'true' }}
            selectedIds={selectedIds}
            totalTasks={selectedIds.length > 0 ? selectedIds.length : (pagination?.total ?? tasks.length)}
          />
        </div>
      </div>

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
          (() => {
            const emptyState = getFollowUpEmptyStateConfig({
              filters,
              onFiltersChange,
              onClearSearch: () => {
                setSearchInput('');
                onFiltersChange({ search: '', page: 1 });
              },
            });
            return (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <div style={{ maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
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
                    {emptyState.title}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {emptyState.description}
                  </p>
                  {emptyState.actions.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {emptyState.actions.map((act) => (
                        <button
                          key={act.label}
                          type="button"
                          className={`btn ${act.variant === 'primary' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={act.onClick}
                          style={{ fontSize: 13, padding: '7px 16px' }}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <>
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
                          onAddFollowUp={setAddFollowUpTask}
                        />
                      ))}
                </tbody>
              </table>
            </div>

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
                  onAddFollowUp={setAddFollowUpTask}
                />
              ))}
            </div>
          </>
        )}

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

      {activeHistoryTask && (
        <FollowUpPanel
          task={activeHistoryTask}
          onClose={() => setActiveHistoryTask(null)}
          onTaskUpdated={() => {
            fetchTasks({ ...filters, hasFollowUps: 'true', limit: filters.limit || 15 }, true);
          }}
        />
      )}

      {addFollowUpTask && (
        <FollowUpAddModal
          task={addFollowUpTask}
          onClose={() => setAddFollowUpTask(null)}
          onSaved={() => {
            fetchTasks({ ...filters, hasFollowUps: 'true', limit: filters.limit || 15 }, true);
          }}
        />
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
