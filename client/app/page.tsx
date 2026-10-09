'use client';
import { useTaskContext } from '@/context/TaskContext';
import Header from '@/components/layout/Header';
import SummaryCards from '@/components/dashboard/SummaryCards';
import DashboardScopeBar from '@/components/dashboard/DashboardScopeBar';
import TaskTable from '@/components/tasks/TaskTable';

export default function DashboardPage() {
  const {
    filters,
    handleFiltersChange,
    summary,
    summaryLoading,
    handleTaskCreated,
    availableYears,
    handleStatusClick,
    refreshKey
  } = useTaskContext();

  return (
    <div className="page-layout">
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main className="page-content">
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>Task overview and quick filters.</p>
          </div>
        </div>

        <section>
          <DashboardScopeBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableYears={availableYears}
            onRefresh={handleTaskCreated}
            isRefreshing={summaryLoading}
          />
        </section>

        <section>
          <SummaryCards
            summary={summary}
            loading={summaryLoading}
            activeStatus={filters.status || ''}
            onStatusClick={handleStatusClick}
          />
        </section>

        <section style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBlockEnd: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Tasks Overview {filters.status ? `(${filters.status})` : ''}
            </h2>
          </div>

          <TaskTable
            filters={filters}
            onFiltersChange={handleFiltersChange}
            refreshKey={refreshKey}
            isDashboard={true}
          />
        </section>
      </main>
    </div>
  );
}
