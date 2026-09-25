'use client';
import { useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import TaskTable from '@/components/tasks/TaskTable';
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
    limit: 10,
    sort: 'date',
    order: 'desc',
  });

  const handleFiltersChange = useCallback((partial: Partial<TaskFilters>) => {
    setLocalFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header filters={localFilters} onTaskCreated={handleTaskCreated} />

      <main style={{ flex: 1, padding: '32px 32px 48px', maxWidth: 1400, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Follow-Ups
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>
              Tasks with active follow-up communications.
            </p>
          </div>
        </div>

        <section>
          <CascadingFilterNav
            filters={localFilters}
            onFiltersChange={handleFiltersChange}
            availableYears={availableYears}
          />
        </section>

        <section style={{ flex: 1, minHeight: 0 }}>
          <TaskTable filters={localFilters} onFiltersChange={handleFiltersChange} refreshKey={refreshKey} mode="follow-ups" />
        </section>
      </main>
    </div>
  );
}
