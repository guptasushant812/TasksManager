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
    <div className="page-layout">
      <Header filters={localFilters} onTaskCreated={handleTaskCreated} />

      <main className="page-content">
        <div className="page-header">
          <div>
            <h1>Follow-Ups</h1>
            <p>Tasks with active follow-up communications.</p>
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
