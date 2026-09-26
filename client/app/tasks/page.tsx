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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main style={{ flex: 1, padding: 'clamp(16px, 4vw, 32px) clamp(12px, 3vw, 32px) 48px', maxWidth: 1400, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 3vw, 24px)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Tasks</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>View, manage, and follow up on your tasks.</p>
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
