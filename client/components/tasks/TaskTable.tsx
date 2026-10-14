'use client';
import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { Task, TaskFilters, Pagination } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import TaskRow from './TaskRow';
import SearchBar from './SearchBar';
import FilterSortPanel from './FilterSortPanel';
import ExportMenu from './ExportMenu';
import { formatDate, getDayName, getWeeksInMonth, SHORT_MONTHS, toIsoDate } from '@/lib/dates';
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

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'ghost';
}

interface EmptyStateConfig {
  title: string;
  description: string;
  actions: EmptyStateAction[];
}

function getEmptyStateConfig({
  filters,
  onFiltersChange,
  onAddNewTask,
  onClearSearch,
}: {
  filters: TaskFilters;
  onFiltersChange: (f: Partial<TaskFilters>) => void;
  onAddNewTask: () => void;
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
  const hasFollowUps = filters.hasFollowUps === 'true';
  const isOverdueFilter = filters.overdueOnly === 'true';
  const isEscalatedFilter = filters.escalatedOnly === 'true';

  if (hasSearch) {
    return {
      title: `No tasks matching "${filters.search}"`,
      description: 'No tasks match your search query in this view. Try adjusting your keyword or clearing the search filter.',
      actions: [
        {
          label: 'Clear Search',
          variant: 'primary',
          onClick: onClearSearch,
        },
      ],
    };
  }

  // 1. Today Filter Scope
  if (isToday) {
    if (isOverdueFilter) {
      return {
        title: 'No overdue follow-ups for today',
        description: 'All follow-up actions scheduled for today are on track with no overdue items.',
        actions: [
          {
            label: "View All Today's Tasks",
            variant: 'primary',
            onClick: () => onFiltersChange({ overdueOnly: undefined, page: 1 }),
          },
          {
            label: 'View This Month',
            variant: 'ghost',
            onClick: () => onFiltersChange({ day: '', page: 1 }),
          },
        ],
      };
    }

    if (isEscalatedFilter) {
      return {
        title: 'No escalated tasks for today',
        description: 'All tasks scheduled for today are within communication thresholds.',
        actions: [
          {
            label: "View All Today's Tasks",
            variant: 'primary',
            onClick: () => onFiltersChange({ escalatedOnly: undefined, page: 1 }),
          },
          {
            label: 'View This Month',
            variant: 'ghost',
            onClick: () => onFiltersChange({ day: '', page: 1 }),
          },
        ],
      };
    }

    if (status) {
      return {
        title: `No ${statusLabel.toLowerCase()} tasks for today`,
        description: `There are currently no tasks marked as "${statusLabel}" scheduled for today.`,
        actions: [
          {
            label: "View All Today's Tasks",
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
        title: `No ${filters.priority} priority tasks today`,
        description: `No tasks marked with ${filters.priority} priority are scheduled for today.`,
        actions: [
          {
            label: 'Clear Priority',
            variant: 'primary',
            onClick: () => onFiltersChange({ priority: '', page: 1 }),
          },
          {
            label: "View All Today's Tasks",
            variant: 'ghost',
            onClick: () => onFiltersChange({ priority: '', status: '', page: 1 }),
          },
        ],
      };
    }

    return {
      title: 'No tasks scheduled for today',
      description: 'You have no tasks created or scheduled for today.',
      actions: [
        {
          label: '+ Create Task for Today',
          variant: 'primary',
          onClick: onAddNewTask,
        },
        {
          label: 'View This Month',
          variant: 'ghost',
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
    if (isOverdueFilter) {
      return {
        title: `No overdue follow-ups on ${formattedDay}`,
        description: `No overdue follow-ups were found for tasks on ${formattedDay}.`,
        actions: [
          {
            label: `View All on ${formattedDay}`,
            variant: 'primary',
            onClick: () => onFiltersChange({ overdueOnly: undefined, page: 1 }),
          },
          {
            label: 'View Full Month',
            variant: 'ghost',
            onClick: () => onFiltersChange({ day: '', page: 1 }),
          },
        ],
      };
    }

    if (isEscalatedFilter) {
      return {
        title: `No escalated tasks on ${formattedDay}`,
        description: `No tasks on ${formattedDay} exceeded the escalation threshold.`,
        actions: [
          {
            label: `View All on ${formattedDay}`,
            variant: 'primary',
            onClick: () => onFiltersChange({ escalatedOnly: undefined, page: 1 }),
          },
          {
            label: 'View Full Month',
            variant: 'ghost',
            onClick: () => onFiltersChange({ day: '', page: 1 }),
          },
        ],
      };
    }

    if (status) {
      return {
        title: `No ${statusLabel.toLowerCase()} tasks on ${formattedDay}`,
        description: `No tasks with "${statusLabel}" status were found on ${formattedDay}.`,
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
      title: `No tasks found for ${formattedDay}`,
      description: 'There are no tasks recorded on this specific date.',
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
    if (isOverdueFilter) {
      return {
        title: `No overdue follow-ups in Week ${filters.weekIndex}`,
        description: `All follow-up tasks in Week ${filters.weekIndex} are within schedule.`,
        actions: [
          {
            label: `View All in Week ${filters.weekIndex}`,
            variant: 'primary',
            onClick: () => onFiltersChange({ overdueOnly: undefined, page: 1 }),
          },
          {
            label: 'View Full Month',
            variant: 'ghost',
            onClick: () => onFiltersChange({ weekIndex: undefined, dateFrom: '', dateTo: '', page: 1 }),
          },
        ],
      };
    }

    if (isEscalatedFilter) {
      return {
        title: `No escalated tasks in Week ${filters.weekIndex}`,
        description: `No tasks exceeded the escalation threshold in Week ${filters.weekIndex}.`,
        actions: [
          {
            label: `View All in Week ${filters.weekIndex}`,
            variant: 'primary',
            onClick: () => onFiltersChange({ escalatedOnly: undefined, page: 1 }),
          },
          {
            label: 'View Full Month',
            variant: 'ghost',
            onClick: () => onFiltersChange({ weekIndex: undefined, dateFrom: '', dateTo: '', page: 1 }),
          },
        ],
      };
    }

    if (status) {
      return {
        title: `No ${statusLabel.toLowerCase()} tasks in Week ${filters.weekIndex}`,
        description: `There are no tasks with "${statusLabel}" status recorded in Week ${filters.weekIndex} (${monthName} ${yearText}).`,
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
        title: `No ${filters.priority} priority tasks in Week ${filters.weekIndex}`,
        description: `No tasks matching ${filters.priority} priority exist in Week ${filters.weekIndex} (${monthName} ${yearText}).`,
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
      title: `No tasks found for Week ${filters.weekIndex}`,
      description: `There are no tasks recorded in Week ${filters.weekIndex} (${monthName} ${yearText}).`,
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

    if (isOverdueFilter) {
      return {
        title: `No overdue follow-ups in ${monthName} ${yearText}`,
        description: `All follow-up communication in ${monthName} ${yearText} is within schedule with no overdue items.`,
        actions: [
          {
            label: `View All Tasks for ${monthName}`,
            variant: 'primary',
            onClick: () => onFiltersChange({ overdueOnly: undefined, page: 1 }),
          },
          {
            label: `View All Months (${yearText})`,
            variant: 'ghost',
            onClick: () => onFiltersChange({ overdueOnly: undefined, month: '', weekIndex: undefined, day: '', page: 1 }),
          },
        ],
      };
    }

    if (isEscalatedFilter) {
      return {
        title: `No escalated tasks in ${monthName} ${yearText}`,
        description: `All tasks in ${monthName} ${yearText} are within the maximum follow-up threshold.`,
        actions: [
          {
            label: `View All Tasks for ${monthName}`,
            variant: 'primary',
            onClick: () => onFiltersChange({ escalatedOnly: undefined, page: 1 }),
          },
          {
            label: `View All Months (${yearText})`,
            variant: 'ghost',
            onClick: () => onFiltersChange({ escalatedOnly: undefined, month: '', weekIndex: undefined, day: '', page: 1 }),
          },
        ],
      };
    }

    if (status) {
      return {
        title: `No ${statusLabel.toLowerCase()} tasks in ${monthName} ${yearText}`,
        description: `There are no tasks with "${statusLabel}" status recorded for ${monthName} ${yearText}.`,
        actions: [
          {
            label: `View All Tasks for ${monthName}`,
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
        title: `No ${filters.priority} priority tasks in ${monthName} ${yearText}`,
        description: `There are no tasks matching ${filters.priority} priority in ${monthName} ${yearText}.`,
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

    if (hasFollowUps) {
      return {
        title: `No follow-ups recorded for ${monthName} ${yearText}`,
        description: `None of the tasks in ${monthName} ${yearText} have follow-up communication logs.`,
        actions: [
          {
            label: `View All Tasks for ${monthName}`,
            variant: 'primary',
            onClick: () => onFiltersChange({ hasFollowUps: undefined, page: 1 }),
          },
        ],
      };
    }

    return {
      title: `No tasks found for ${monthName} ${yearText}`,
      description: 'You are viewing a specific month with no tasks yet. Your previous tasks are safe in other months.',
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

  // 3. Year Scope (all months of a year)
  if (isYearOnly) {
    if (isOverdueFilter) {
      return {
        title: `No overdue follow-ups in ${yearText}`,
        description: `No overdue follow-up items were found across ${yearText}.`,
        actions: [
          {
            label: `View All Tasks in ${yearText}`,
            variant: 'primary',
            onClick: () => onFiltersChange({ overdueOnly: undefined, page: 1 }),
          },
          {
            label: 'View All Time',
            variant: 'ghost',
            onClick: () => onFiltersChange({ overdueOnly: undefined, year: '', month: '', day: '', status: '', page: 1 }),
          },
        ],
      };
    }

    if (isEscalatedFilter) {
      return {
        title: `No escalated tasks in ${yearText}`,
        description: `No tasks exceeded the escalation threshold across ${yearText}.`,
        actions: [
          {
            label: `View All Tasks in ${yearText}`,
            variant: 'primary',
            onClick: () => onFiltersChange({ escalatedOnly: undefined, page: 1 }),
          },
          {
            label: 'View All Time',
            variant: 'ghost',
            onClick: () => onFiltersChange({ escalatedOnly: undefined, year: '', month: '', day: '', status: '', page: 1 }),
          },
        ],
      };
    }

    if (status) {
      return {
        title: `No ${statusLabel.toLowerCase()} tasks in ${yearText}`,
        description: `No tasks with "${statusLabel}" status were found across any months of ${yearText}.`,
        actions: [
          {
            label: `View All Tasks in ${yearText}`,
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
      title: `No tasks found for ${yearText}`,
      description: `There are no tasks recorded across any months in ${yearText}.`,
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
  if (isOverdueFilter) {
    return {
      title: 'No overdue follow-ups found',
      description: 'All follow-up communication in your workspace is on track with zero overdue items.',
      actions: [
        {
          label: 'View All Tasks',
          variant: 'primary',
          onClick: () => onFiltersChange({ overdueOnly: undefined, page: 1 }),
        },
        {
          label: 'Reset Filters',
          variant: 'ghost',
          onClick: () => onFiltersChange({ overdueOnly: undefined, year: currentYearStr, month: currentMonthStr, day: '', page: 1 }),
        },
      ],
    };
  }

  if (isEscalatedFilter) {
    return {
      title: 'No escalated tasks found',
      description: 'All tasks in your workspace are within acceptable communication limits.',
      actions: [
        {
          label: 'View All Tasks',
          variant: 'primary',
          onClick: () => onFiltersChange({ escalatedOnly: undefined, page: 1 }),
        },
        {
          label: 'Reset Filters',
          variant: 'ghost',
          onClick: () => onFiltersChange({ escalatedOnly: undefined, year: currentYearStr, month: currentMonthStr, day: '', page: 1 }),
        },
      ],
    };
  }

  if (status) {
    return {
      title: `No ${statusLabel.toLowerCase()} tasks found`,
      description: `There are no tasks currently marked as "${statusLabel}" in your workspace.`,
      actions: [
        {
          label: 'View All Tasks',
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
      title: `No ${filters.priority} priority tasks found`,
      description: `No tasks matching ${filters.priority} priority exist in the workspace.`,
      actions: [
        {
          label: 'Clear Priority',
          variant: 'primary',
          onClick: () => onFiltersChange({ priority: '', page: 1 }),
        },
      ],
    };
  }

  if (hasFollowUps) {
    return {
      title: 'No tasks with follow-ups',
      description: 'None of your tasks have follow-up entries yet.',
      actions: [
        {
          label: 'View All Tasks',
          variant: 'primary',
          onClick: () => onFiltersChange({ hasFollowUps: undefined, page: 1 }),
        },
      ],
    };
  }

  return {
    title: 'No tasks in workspace',
    description: 'Your workspace has no tasks. Get started by creating your first task.',
    actions: [
      {
        label: '+ Create New Task',
        variant: 'primary',
        onClick: onAddNewTask,
      },
    ],
  };
}

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

  const commitSearch = useCallback((value: string) => {
    clearTimeout(searchDebounce.current);
    setSearchInput(value);
    if (value !== (filters.search || '')) {
      onFiltersChange({ search: value, page: 1 });
    }
  }, [filters.search, onFiltersChange]);

  const handleClearSearch = useCallback(() => {
    clearTimeout(searchDebounce.current);
    setSearchInput('');
    if (filters.search) {
      onFiltersChange({ search: '', page: 1 });
    }
  }, [filters.search, onFiltersChange]);

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
    }, 260);
    return () => clearTimeout(searchDebounce.current);
  }, [searchInput, filters.search, onFiltersChange]);

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
    filters.overdueOnly === 'true' ? 'overdue' : '',
    filters.escalatedOnly === 'true' ? 'escalated' : '',
    isCustomSort ? 'customSort' : '',
  ].filter(Boolean).length;

  return (
    <div>
      <div className="task-toolbar-container">
        <div className="task-toolbar-search-col">
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={commitSearch}
            onClear={handleClearSearch}
          />
        </div>

        <div className={`task-toolbar-actions-col ${selectMode && selectedIds.length > 0 ? 'has-delete' : ''}`}>
          <div ref={filterRef} className="task-toolbar-filter-wrap">
            <button
              id="btn-filter-sort"
              className={`btn ${activeFiltersCount > 0 ? 'btn-primary' : 'btn-ghost'} task-toolbar-btn`}
              onClick={() => setShowFilter(!showFilter)}
              style={{ position: 'relative' }}
              title="Filter and sort tasks"
            >
              <Filter style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="task-toolbar-badge">
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
            className={`btn ${selectMode ? 'btn-primary' : 'btn-ghost'} task-toolbar-btn`}
            onClick={() => { setSelectMode(!selectMode); setSelectedIds([]); }}
            title="Toggle multi-select mode"
          >
            <CheckSquare style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span>Select</span>
            {selectedIds.length > 0 && (
              <span className="task-toolbar-badge">
                {selectedIds.length}
              </span>
            )}
          </button>

          {selectMode && selectedIds.length > 0 && (
            <button
              className="btn btn-danger task-toolbar-btn task-toolbar-btn-delete"
              onClick={handleDeleteSelected}
              title={`Delete ${selectedIds.length} selected tasks`}
            >
              <Trash2 style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span>Delete</span>
            </button>
          )}

          <div className="task-toolbar-export-wrap">
            <ExportMenu
              filters={filters}
              selectedIds={selectedIds}
              totalTasks={selectedIds.length > 0 ? selectedIds.length : (pagination?.total ?? tasks.length)}
              onAddNewTask={() => setShowNewTaskModal(true)}
            />
          </div>
        </div>
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

          {filters.overdueOnly === 'true' && (
            <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--high)', padding: '3px 8px', color: 'var(--high)' }}>
              <span>Filter: <strong>Overdue Follow-Ups</strong></span>
              <button
                type="button"
                onClick={() => onFiltersChange({ overdueOnly: undefined, page: 1 })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--high)', padding: 0, display: 'inline-flex' }}
                title="Remove overdue filter"
              >
                <X style={{ width: 12, height: 12 }} />
              </button>
            </span>
          )}

          {filters.escalatedOnly === 'true' && (
            <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(234, 179, 8, 0.12)', border: '1px solid var(--medium)', padding: '3px 8px', color: 'var(--medium)' }}>
              <span>Filter: <strong>Escalated Tasks</strong></span>
              <button
                type="button"
                onClick={() => onFiltersChange({ escalatedOnly: undefined, page: 1 })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--medium)', padding: 0, display: 'inline-flex' }}
                title="Remove escalation filter"
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
            <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 440, marginInline: 'auto', lineHeight: 1.5 }}>
              {typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                ? 'Unable to reach backend server. If hosted on Render free tier, the instance may be spinning up from sleep (~30–50s).'
                : 'Make sure the backend server is running on port 4000.'}
            </p>
            <button
              type="button"
              onClick={() => fetchTasks({ ...filters, limit: tableLimit })}
              style={{
                marginTop: 14,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 'var(--radius-sm, 6px)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              Retry Connection
            </button>
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
                  (() => {
                    const emptyState = getEmptyStateConfig({
                      filters,
                      onFiltersChange,
                      onAddNewTask: () => setShowNewTaskModal(true),
                      onClearSearch: () => {
                        setSearchInput('');
                        onFiltersChange({ search: '', page: 1 });
                      },
                    });
                    return (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                          <div style={{ maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {emptyState.title}
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                              {emptyState.description}
                            </p>
                            {emptyState.actions.length > 0 && (
                              <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
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
                        </td>
                      </tr>
                    );
                  })()
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
