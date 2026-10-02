'use client';
import { useTaskContext } from '@/context/TaskContext';
import Header from '@/components/layout/Header';
import SummaryCards from '@/components/dashboard/SummaryCards';
import DashboardScopeBar from '@/components/dashboard/DashboardScopeBar';
import TaskTable from '@/components/tasks/TaskTable';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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

        {/* Page header — clear hierarchy, purposeful */}
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>Task overview and quick filters.</p>
          </div>
        </div>

        {/* Time Scope Bar */}
        <section>
          <DashboardScopeBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableYears={availableYears}
            onRefresh={handleTaskCreated}
            isRefreshing={summaryLoading}
          />
        </section>

        {/* Summary metrics */}
        <section>
          <SummaryCards
            summary={summary}
            loading={summaryLoading}
            activeStatus={filters.status || ''}
            onStatusClick={handleStatusClick}
          />
        </section>

        {/* Tasks Overview */}
        <section style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Tasks Overview {filters.status ? `(${filters.status})` : ''}
            </h2>
          </div>

          {/* We reuse the TaskTable component which automatically syncs with the context filters */}
          <TaskTable filters={filters} onFiltersChange={handleFiltersChange} refreshKey={refreshKey} />
        </section>        {/* Action — clear next step */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/tasks" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ fontSize: 13, padding: '8px 16px' }}>
              View Tasks
              <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
