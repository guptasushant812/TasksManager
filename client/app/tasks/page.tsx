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

  // Parse optional URL search params (e.g. /tasks?status=Pending)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get('status');
      if (statusParam) {
        setTaskFilters((prev) => ({
          ...prev,
          status: statusParam as WorkStatus,
          page: 1,
        }));
      }
    }
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
