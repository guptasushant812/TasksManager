'use client';
import { useTaskContext } from '@/context/TaskContext';
import Header from '@/components/layout/Header';
import SummaryCards from '@/components/dashboard/SummaryCards';
import CascadingFilterNav from '@/components/dashboard/CascadingFilterNav';
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
    handleStatusClick
  } = useTaskContext();

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main style={{ padding: '32px 32px 48px', maxWidth: 1100, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* Page header — clear hierarchy, purposeful */}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
            Task overview and quick filters.
          </p>
        </div>

        {/* Summary metrics */}
        <section>
          <SummaryCards
            summary={summary}
            loading={summaryLoading}
            activeStatus={filters.status || ''}
            onStatusClick={handleStatusClick}
          />
        </section>



        {/* Action — clear next step */}
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
