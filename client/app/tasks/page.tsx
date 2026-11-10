'use client';
import { useEffect } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import Header from '@/components/layout/Header';
import TaskTable from '@/components/tasks/TaskTable';
import TaskScopeNav from '@/components/tasks/TaskScopeNav';
import { WorkStatus, TaskFilters } from '@/types/task';

export default function TasksPage() {
  const {
    taskFilters,
    setTaskFilters,
    handleTaskFiltersChange,
    refreshKey,
    handleTaskCreated,
    availableYears,
  } = useTaskContext();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      if (!params.toString()) return;

      setTaskFilters((prev) => {
        const updated: TaskFilters = {
          ...prev,
          page: 1,
          search: params.get('search') || '',
          status: (params.get('status') as WorkStatus) || '',
          priority: (params.get('priority') as TaskFilters['priority']) || '',
          givenBy: params.get('givenBy') || '',
          overdueOnly: params.get('overdueOnly') || '',
          escalatedOnly: params.get('escalatedOnly') || '',
          sort: params.get('sort') || 'taskId',
          order: (params.get('order') as 'asc' | 'desc') || 'desc',
        };

        if (params.get('allTime') === 'true') {
          updated.year = '';
          updated.month = '';
          updated.day = '';
          updated.weekIndex = undefined;
          updated.weekStart = undefined;
          updated.dateFrom = '';
          updated.dateTo = '';
        } else {
          if (params.has('year')) updated.year = params.get('year') || '';
          if (params.has('month')) updated.month = params.get('month') || '';
          if (params.has('day')) updated.day = params.get('day') || '';
          if (params.has('weekIndex')) {
            const raw = params.get('weekIndex');
            updated.weekIndex = raw !== null && raw !== '' ? Number(raw) : undefined;
          }
          if (params.has('weekStart')) updated.weekStart = params.get('weekStart') || '';
          if (params.has('dateFrom')) updated.dateFrom = params.get('dateFrom') || '';
          if (params.has('dateTo')) updated.dateTo = params.get('dateTo') || '';
        }

        return updated;
      });
    };

    applyUrlParams();
    window.addEventListener('popstate', applyUrlParams);
    return () => window.removeEventListener('popstate', applyUrlParams);
  }, [setTaskFilters]);

  return (
    <div className="page-layout">
      <Header filters={taskFilters} onTaskCreated={handleTaskCreated} />

      <main className="page-content">
        <div className="page-header">
          <div>
            <h1>Tasks</h1>
            <p>View, manage, and follow up on your tasks.</p>
          </div>
        </div>

        <section>
          <TaskScopeNav
            filters={taskFilters}
            onFiltersChange={handleTaskFiltersChange}
            availableYears={availableYears}
          />
        </section>

        <section style={{ flex: 1, minHeight: 0 }}>
          <TaskTable
            filters={taskFilters}
            onFiltersChange={handleTaskFiltersChange}
            refreshKey={refreshKey}
          />
        </section>
      </main>
    </div>
  );
}
