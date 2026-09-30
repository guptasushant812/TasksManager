'use client';
import { Summary, WorkStatus } from '@/types/task';

import Link from 'next/link';
import { ArrowRight, AlertTriangle, PhoneCall } from 'lucide-react';

interface SummaryCardsProps {
  summary: Summary;
  loading: boolean;
  activeStatus: WorkStatus | '';
  onStatusClick: (status: WorkStatus | '') => void;
}

const CARDS: { key: WorkStatus; label: string; varName: string; activeClass: string }[] = [
  { key: 'InProgress', label: 'In Progress', varName: '--inprogress', activeClass: 'active-inprogress' },
  { key: 'Pending', label: 'Pending', varName: '--pending', activeClass: 'active-pending' },
  { key: 'Completed', label: 'Completed', varName: '--completed', activeClass: 'active-completed' },
];

export default function SummaryCards({ summary, loading, activeStatus, onStatusClick }: SummaryCardsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Primary metrics */}
      <div className="summary-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {CARDS.map(({ key, label, varName, activeClass }) => {
          const isActive = activeStatus === key;
          const color = `var(${varName})`;
          const count = key === 'InProgress' ? summary.inProgress
            : key === 'Pending' ? summary.pending
              : summary.completed;

          return (
            <div
              key={key}
              id={`summary-card-${key.toLowerCase()}`}
              className={`summary-card ${isActive ? activeClass : ''}`}
              onClick={() => onStatusClick(isActive ? '' : key)}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={`Filter by ${label}: ${count} tasks`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onStatusClick(isActive ? '' : key); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: isActive ? '#fff' : color,
                  transition: 'color 0.2s',
                }}>
                  {label}
                </span>
                {/* Status indicator dot */}
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: 0,
                  border: '2px solid var(--border)',
                  background: isActive ? '#fff' : color,
                  transition: 'background 0.2s',
                }} />
              </div>

              {loading && count === 0 ? (
                <div className="skeleton" style={{ height: 48, width: 64, marginTop: 4, borderRadius: 'var(--radius-sm)' }} />
              ) : (
                <span style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: isActive ? '#fff' : color,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {count}
                </span>
              )}

              <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#fff' : 'var(--text-muted)' }}>
                {isActive ? 'FILTERED — CLICK TO CLEAR' : 'CLICK TO FILTER'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Secondary metrics row — Information-rich and directly actionable */}
      {(summary.overdueFollowUps !== undefined || summary.escalatedTasks !== undefined) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <Link
            href="/follow-ups"
            style={{ textDecoration: 'none' }}
            title="View all overdue follow-ups"
          >
            <div
              className="summary-card"
              style={{
                padding: '20px',
                cursor: 'pointer',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderLeft: summary.overdueFollowUps ? '4px solid var(--high)' : 'var(--border-width-layout) solid var(--border)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                e.currentTarget.style.boxShadow = 'var(--box-shadow-brutalist)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: summary.overdueFollowUps ? 'var(--high-bg, #fee2e2)' : 'var(--bg-hover)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: summary.overdueFollowUps ? 'var(--high)' : 'var(--text-muted)'
                }}>
                  <PhoneCall style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                    Overdue Follow-Ups
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: summary.overdueFollowUps ? 'var(--high)' : 'var(--text-muted)', marginTop: 2 }}>
                    {summary.overdueFollowUps ? `${summary.overdueFollowUps} awaiting response • Click to view` : 'No overdue items'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: summary.overdueFollowUps ? 'var(--high)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {summary.overdueFollowUps || 0}
                </span>
                <ArrowRight style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
              </div>
            </div>
          </Link>

          <Link
            href="/tasks"
            style={{ textDecoration: 'none' }}
            title="Inspect escalated tasks"
          >
            <div
              className="summary-card"
              style={{
                padding: '20px',
                cursor: 'pointer',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderLeft: summary.escalatedTasks ? '4px solid var(--medium)' : 'var(--border-width-layout) solid var(--border)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                e.currentTarget.style.boxShadow = 'var(--box-shadow-brutalist)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: summary.escalatedTasks ? 'var(--medium-bg, #fef9c3)' : 'var(--bg-hover)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: summary.escalatedTasks ? 'var(--medium)' : 'var(--text-muted)'
                }}>
                  <AlertTriangle style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                    Escalated Tasks
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: summary.escalatedTasks ? 'var(--medium)' : 'var(--text-muted)', marginTop: 2 }}>
                    {summary.escalatedTasks ? `${summary.escalatedTasks} threshold alerts • Click to review` : 'All within threshold'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: summary.escalatedTasks ? 'var(--medium)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {summary.escalatedTasks || 0}
                </span>
                <ArrowRight style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
