'use client';
import { useEffect } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import Header from '@/components/layout/Header';
import TaskTable from '@/components/tasks/TaskTable';
import TaskScopeNav from '@/components/tasks/TaskScopeNav';
import { WorkStatus } from '@/types/task';

export default function TasksPage() {
  const {
    taskFilters,
    handleTaskFiltersChange,
    refreshKey,
    handleTaskCreated,
    availableYears,
  } = useTaskContext();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return;

    const statusParam = params.get('status') as WorkStatus | null;
    if (statusParam) {
      handleTaskFiltersChange({ status: statusParam, page: 1 });
    }
  }, [handleTaskFiltersChange]);

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
