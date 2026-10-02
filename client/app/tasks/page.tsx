'use client';
import { useTaskContext } from '@/context/TaskContext';
import Header from '@/components/layout/Header';
import TaskTable from '@/components/tasks/TaskTable';

import CascadingFilterNav from '@/components/dashboard/CascadingFilterNav';

export default function TasksPage() {
  const {
    filters,
    handleFiltersChange,
    refreshKey,
    handleTaskCreated,
    availableYears,
  } = useTaskContext();

  return (
    <div className="page-layout">
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main className="page-content">
        
        <div className="page-header">
          <div>
            <h1>Tasks</h1>
            <p>View, manage, and follow up on your tasks.</p>
          </div>
        </div>

        <section>
          <CascadingFilterNav
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableYears={availableYears}
          />
        </section>

        <section style={{ flex: 1, minHeight: 0 }}>
          <TaskTable
            filters={filters}
            onFiltersChange={handleFiltersChange}
            refreshKey={refreshKey}
          />
        </section>
      </main>
    </div>
  );
}
