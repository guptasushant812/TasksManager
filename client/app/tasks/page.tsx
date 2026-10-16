'use client';
import { useState, useCallback, useEffect } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import Header from '@/components/layout/Header';
import TaskTable from '@/components/tasks/TaskTable';
import TaskScopeNav from '@/components/tasks/TaskScopeNav';
import { TaskFilters, WorkStatus } from '@/types/task';

export default function TasksPage() {
  const {
    refreshKey,
    handleTaskCreated,
    availableYears,
  } = useTaskContext();

  const today = new Date();
  const [taskFilters, setTaskFilters] = useState<TaskFilters>(() => ({
    year: today.getFullYear().toString(),
    month: (today.getMonth() + 1).toString(),
    sort: 'taskId',
    order: 'desc',
    page: 1,
    limit: 10,
  }));

  // Synchronize incoming query parameters when navigated from dashboard buttons
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return;

    setTaskFilters((prev) => {
      const updated: TaskFilters = { ...prev, page: 1 };

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
        if (params.has('weekIndex')) updated.weekIndex = Number(params.get('weekIndex'));
        if (params.has('weekStart')) updated.weekStart = params.get('weekStart') || '';
        if (params.has('dateFrom')) updated.dateFrom = params.get('dateFrom') || '';
        if (params.has('dateTo')) updated.dateTo = params.get('dateTo') || '';
      }

      if (params.has('status')) updated.status = (params.get('status') as WorkStatus) || '';
      if (params.has('priority')) updated.priority = (params.get('priority') as TaskFilters['priority']) || '';
      if (params.has('overdueOnly')) updated.overdueOnly = params.get('overdueOnly') || '';
      if (params.has('escalatedOnly')) updated.escalatedOnly = params.get('escalatedOnly') || '';
      if (params.has('search')) updated.search = params.get('search') || '';
      if (params.has('givenBy')) updated.givenBy = params.get('givenBy') || '';

      return updated;
    });
  }, []);

  const handleFiltersChange = useCallback((partial: Partial<TaskFilters>) => {
    setTaskFilters((prev) => ({
      ...prev,
      ...partial,
      page: partial.page ?? 1,
    }));
  }, []);

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
            onFiltersChange={handleFiltersChange}
            availableYears={availableYears}
          />
        </section>

        <section style={{ flex: 1, minHeight: 0 }}>
          <TaskTable
            filters={taskFilters}
            onFiltersChange={handleFiltersChange}
            refreshKey={refreshKey}
          />
        </section>
      </main>
    </div>
  );
}
