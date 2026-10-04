'use client';
import { useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import FollowUpWorkspace from '@/components/follow-ups/FollowUpWorkspace';
import CascadingFilterNav from '@/components/dashboard/CascadingFilterNav';
import { useTaskContext } from '@/context/TaskContext';
import { TaskFilters } from '@/types/task';

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
          <CascadingFilterNav
            filters={localFilters}
            onFiltersChange={handleFiltersChange}
            availableYears={availableYears}
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
