'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { TaskFilters, WorkStatus, Summary } from '@/types/task';
import { useSummary } from '@/hooks/useSummary';
import { getYearRange, toIsoDate } from '@/lib/dates';
import { BASE_URL } from '@/lib/api';
import { subscribeToSessionEvents } from '@/lib/sessionManager';

interface TaskContextValue {
  filters: TaskFilters;
  setFilters: React.Dispatch<React.SetStateAction<TaskFilters>>;
  handleFiltersChange: (partial: Partial<TaskFilters>) => void;
  summary: Summary;
  summaryLoading: boolean;
  refreshKey: number;
  handleTaskCreated: () => void;
  availableYears: number[];
  handleStatusClick: (status: WorkStatus | '') => void;
  handleSecondaryFilterClick: (type: 'overdue' | 'escalated') => void;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

const currentYear = new Date().getFullYear();
const START_YEAR = 2022;

export function TaskProvider({ children }: { children: ReactNode }) {
  const today = new Date();
  const [filters, setFilters] = useState<TaskFilters>({
    year: today.getFullYear().toString(),
    month: (today.getMonth() + 1).toString(),
    sort: 'taskId',
    order: 'desc',
    page: 1,
    limit: 10,
  });
  
  const [refreshKey, setRefreshKey] = useState(0);
  const { summary, loading: summaryLoading, fetchSummary } = useSummary();
  const availableYears = getYearRange(START_YEAR);

  const summaryFilters: TaskFilters = useMemo(() => ({
    year: filters.year,
    month: filters.month,
    day: filters.day,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    status: filters.status,
  }), [filters.year, filters.month, filters.day, filters.dateFrom, filters.dateTo, filters.status]);

  useEffect(() => {
    // Initial silent warm-up ping to wake up backend if asleep on Render free tier
    fetch(`${BASE_URL}/api/health`).catch(() => {});
  }, []);

  useEffect(() => {
    return subscribeToSessionEvents((type) => {
      if (type === 'unlock') {
        setRefreshKey((k) => k + 1);
        fetchSummary(summaryFilters);
      }
    });
  }, [summaryFilters, fetchSummary]);

  useEffect(() => {
    fetchSummary(summaryFilters);
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchSummary(summaryFilters, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [summaryFilters, fetchSummary]);

  const handleFiltersChange = useCallback((partial: Partial<TaskFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial, page: partial.page ?? 1 }));
  }, []);

  const handleStatusClick = useCallback((status: WorkStatus | '') => {
    setFilters((prev) => ({
      ...prev,
      status,
      overdueOnly: undefined,
      escalatedOnly: undefined,
      page: 1,
    }));
  }, []);

  const handleSecondaryFilterClick = useCallback((type: 'overdue' | 'escalated') => {
    setFilters((prev) => {
      if (type === 'overdue') {
        const isCurrentlyActive = prev.overdueOnly === 'true';
        return {
          ...prev,
          overdueOnly: isCurrentlyActive ? undefined : 'true',
          escalatedOnly: undefined,
          status: '',
          day: '',
          page: 1,
        };
      } else {
        const isCurrentlyActive = prev.escalatedOnly === 'true';
        return {
          ...prev,
          escalatedOnly: isCurrentlyActive ? undefined : 'true',
          overdueOnly: undefined,
          status: '',
          day: '',
          page: 1,
        };
      }
    });
  }, []);

  const handleTaskCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
    fetchSummary(summaryFilters);
  }, [fetchSummary, summaryFilters]);

  return (
    <TaskContext.Provider value={{
      filters, setFilters, handleFiltersChange,
      summary, summaryLoading, refreshKey, handleTaskCreated,
      availableYears, handleStatusClick, handleSecondaryFilterClick
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTaskContext must be used within a TaskProvider');
  return context;
}
