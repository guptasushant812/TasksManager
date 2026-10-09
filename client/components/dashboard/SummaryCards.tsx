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
    <div className="summary-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="summary-cards-grid">
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
                  fontSize: 14,
                  fontWeight: 750,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  color: isActive ? '#fff' : color,
                  transition: 'color 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                  {label}
                </span>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '9999px',
                  boxShadow: isActive ? '0 0 8px rgba(255,255,255,0.6)' : `0 0 8px ${color}`,
                  background: isActive ? '#fff' : color,
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                }} />
              </div>

              {loading && count === 0 ? (
                <div className="skeleton" style={{ height: 48, width: 64, marginTop: 4, borderRadius: 'var(--radius-sm)' }} />
              ) : (
                <span className="summary-count" style={{
                  color: isActive ? '#fff' : color,
                }}>
                  {count}
                </span>
              )}

              <span style={{ fontSize: 11, fontWeight: 650, letterSpacing: '0.03em', textTransform: 'uppercase', color: isActive ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)' }}>
                {isActive ? 'Filtered · Click to clear' : 'Click to filter'}
              </span>
            </div>
          );
        })}
      </div>

      {(summary.overdueFollowUps !== undefined || summary.escalatedTasks !== undefined) && (
        <div className="summary-secondary-grid">
          <Link
            href="/follow-ups"
            className="group/action"
            style={{ textDecoration: 'none' }}
            title="View all overdue follow-ups"
          >
            <div
              className="summary-action-card brutalist-hover"
              style={{
                borderInlineStart: summary.overdueFollowUps ? '4px solid var(--high)' : 'var(--border-width-layout) solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  borderRadius: '10px',
                  background: summary.overdueFollowUps ? 'var(--high-bg, #fee2e2)' : 'var(--bg-hover)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: summary.overdueFollowUps ? 'var(--high)' : 'var(--text-muted)',
                  transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                  <PhoneCall style={{ width: 17, height: 17 }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Overdue Follow-Ups
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: summary.overdueFollowUps ? 'var(--high)' : 'var(--text-muted)', marginTop: 2 }}>
                    {summary.overdueFollowUps ? `${summary.overdueFollowUps} awaiting response · Click to view` : 'No overdue items'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: summary.overdueFollowUps ? 'var(--high)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {summary.overdueFollowUps || 0}
                </span>
                <ArrowRight className="rtl-flip transition-transform duration-300 group-hover/action:translate-x-1" style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
              </div>
            </div>
          </Link>

          <Link
            href="/tasks"
            className="group/action"
            style={{ textDecoration: 'none' }}
            title="Inspect escalated tasks"
          >
            <div
              className="summary-action-card brutalist-hover"
              style={{
                borderInlineStart: summary.escalatedTasks ? '4px solid var(--medium)' : 'var(--border-width-layout) solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  borderRadius: '10px',
                  background: summary.escalatedTasks ? 'var(--medium-bg, #fef9c3)' : 'var(--bg-hover)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: summary.escalatedTasks ? 'var(--medium)' : 'var(--text-muted)',
                  transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                  <AlertTriangle style={{ width: 17, height: 17 }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Escalated Tasks
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: summary.escalatedTasks ? 'var(--medium)' : 'var(--text-muted)', marginTop: 2 }}>
                    {summary.escalatedTasks ? `${summary.escalatedTasks} threshold alerts · Click to review` : 'All within threshold'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: summary.escalatedTasks ? 'var(--medium)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {summary.escalatedTasks || 0}
                </span>
                <ArrowRight className="rtl-flip transition-transform duration-300 group-hover/action:translate-x-1" style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
