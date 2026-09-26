'use client';
import { useTaskContext } from '@/context/TaskContext';
import Header from '@/components/layout/Header';
import SummaryCards from '@/components/dashboard/SummaryCards';
import CascadingFilterNav from '@/components/dashboard/CascadingFilterNav';
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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main style={{ padding: 'clamp(16px, 4vw, 32px) clamp(12px, 3vw, 32px) 48px', maxWidth: 1100, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vw, 32px)' }}>
        
        {/* Page header — clear hierarchy, purposeful */}
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
            Task overview and quick filters.
          </p>
        </div>

        {/* Time Filters */}
        <section>
          <CascadingFilterNav
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableYears={availableYears}
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
