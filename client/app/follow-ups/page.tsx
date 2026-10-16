'use client';
import { useState, useCallback, useEffect } from 'react';
import Header from '@/components/layout/Header';
import FollowUpWorkspace from '@/components/follow-ups/FollowUpWorkspace';
import TaskScopeNav from '@/components/tasks/TaskScopeNav';
import { useTaskContext } from '@/context/TaskContext';
import { TaskFilters, WorkStatus } from '@/types/task';

export default function FollowUpsPage() {
  const { handleTaskCreated, refreshKey, availableYears } = useTaskContext();

  const today = new Date();
  const [localFilters, setLocalFilters] = useState<TaskFilters>({
    year: today.getFullYear().toString(),
    month: (today.getMonth() + 1).toString(),
    hasFollowUps: 'true',
    page: 1,
    limit: 15,
    sort: 'taskId',
    order: 'desc',
  });

  // Synchronize incoming query parameters when navigated from dashboard buttons
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return;

    setLocalFilters((prev) => {
      const updated: TaskFilters = { ...prev, page: 1, hasFollowUps: 'true' };

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
    setLocalFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <div className="page-layout">
      <Header filters={localFilters} onTaskCreated={handleTaskCreated} />

      <main className="page-content">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
              Follow-Up Workspace
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
              Manage communication timelines, contact responses, and pending next actions.
            </p>
          </div>
        </div>

        <section style={{ marginBottom: 16 }}>
          <TaskScopeNav
            filters={localFilters}
            onFiltersChange={handleFiltersChange}
            availableYears={availableYears}
            entityName="follow-ups"
          />
        </section>

        <section style={{ flex: 1, minHeight: 0 }}>
          <FollowUpWorkspace
            filters={localFilters}
            onFiltersChange={handleFiltersChange}
            refreshKey={refreshKey}
          />
        </section>
      </main>
    </div>
  );
}
