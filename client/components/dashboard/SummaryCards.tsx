'use client';
import { Summary, WorkStatus } from '@/types/task';

import Link from 'next/link';
import { ArrowRight, AlertTriangle, PhoneCall } from 'lucide-react';

interface SummaryCardsProps {
  summary: Summary;
  loading: boolean;
  activeStatus: WorkStatus | '';
  onStatusClick: (status: WorkStatus | '') => void;
  activeSecondaryFilter?: 'overdue' | 'escalated' | '';
  onSecondaryFilterClick?: (filter: 'overdue' | 'escalated') => void;
}

const CARDS: { key: WorkStatus; label: string; varName: string; activeClass: string }[] = [
  { key: 'InProgress', label: 'In Progress', varName: '--inprogress', activeClass: 'active-inprogress' },
  { key: 'Pending', label: 'Pending', varName: '--pending', activeClass: 'active-pending' },
  { key: 'Completed', label: 'Completed', varName: '--completed', activeClass: 'active-completed' },
];

export default function SummaryCards({
  summary,
  loading,
  activeStatus,
  onStatusClick,
  activeSecondaryFilter = '',
  onSecondaryFilterClick,
}: SummaryCardsProps) {
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
                  fontSize: 13,
                  fontWeight: 750,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: isActive ? '#fff' : color,
                  transition: 'color 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                  {label}
                </span>
                <div style={{
                  width: 9,
                  height: 9,
                  borderRadius: '9999px',
                  boxShadow: isActive ? '0 0 8px rgba(255,255,255,0.7)' : `0 0 8px ${color}`,
                  background: isActive ? '#fff' : color,
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                }} />
              </div>

              {loading && count === 0 ? (
                <div className="skeleton" style={{ height: 44, width: 64, marginTop: 4, borderRadius: 'var(--radius-sm)' }} />
              ) : (
                <span className="summary-count" style={{
                  color: isActive ? '#fff' : color,
                }}>
                  {count}
                </span>
              )}

              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: isActive ? 'rgba(255,255,255,0.95)' : 'var(--text-muted)' }}>
                {isActive ? 'Filtered · Click to clear' : 'Click to filter'}
              </span>
            </div>
          );
        })}
      </div>

      {(summary.overdueFollowUps !== undefined || summary.escalatedTasks !== undefined) && (
        <div className="summary-secondary-grid">
          {(() => {
            const isOverdueActive = activeSecondaryFilter === 'overdue';
            const count = summary.overdueFollowUps || 0;
            return (
              <div
                id="summary-card-overdue"
                className={`summary-action-card brutalist-hover ${isOverdueActive ? 'active-overdue' : ''}`}
                onClick={() => onSecondaryFilterClick?.('overdue')}
                role="button"
                tabIndex={0}
                aria-pressed={isOverdueActive}
                aria-label={`Filter by overdue follow-ups: ${count} tasks`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSecondaryFilterClick?.('overdue');
                  }
                }}
                style={{
                  cursor: 'pointer',
                  borderInlineStart: isOverdueActive
                    ? '4px solid var(--high)'
                    : summary.overdueFollowUps
                    ? '4px solid var(--high)'
                    : 'var(--border-width-layout) solid var(--border)',
                  background: isOverdueActive ? 'rgba(239, 68, 68, 0.08)' : undefined,
                  boxShadow: isOverdueActive ? '0 0 0 1px var(--high)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: '10px',
                    background: isOverdueActive ? 'var(--high)' : summary.overdueFollowUps ? 'var(--high-bg, #fee2e2)' : 'var(--bg-hover)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isOverdueActive ? '#fff' : summary.overdueFollowUps ? 'var(--high)' : 'var(--text-muted)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}>
                    <PhoneCall style={{ width: 17, height: 17 }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Overdue Follow-Ups
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: isOverdueActive ? 'var(--high)' : summary.overdueFollowUps ? 'var(--high)' : 'var(--text-muted)', marginTop: 2 }}>
                      {isOverdueActive ? 'Filtered · Click to clear' : summary.overdueFollowUps ? `${summary.overdueFollowUps} awaiting response · Click to filter` : 'No overdue items · Click to filter'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: isOverdueActive ? 'var(--high)' : summary.overdueFollowUps ? 'var(--high)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {count}
                  </span>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isOverdueActive ? 'var(--high)' : 'transparent',
                    boxShadow: isOverdueActive ? '0 0 6px var(--high)' : 'none',
                  }} />
                </div>
              </div>
            );
          })()}

          {(() => {
            const isEscalatedActive = activeSecondaryFilter === 'escalated';
            const count = summary.escalatedTasks || 0;
            return (
              <div
                id="summary-card-escalated"
                className={`summary-action-card brutalist-hover ${isEscalatedActive ? 'active-escalated' : ''}`}
                onClick={() => onSecondaryFilterClick?.('escalated')}
                role="button"
                tabIndex={0}
                aria-pressed={isEscalatedActive}
                aria-label={`Filter by escalated tasks: ${count} tasks`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSecondaryFilterClick?.('escalated');
                  }
                }}
                style={{
                  cursor: 'pointer',
                  borderInlineStart: isEscalatedActive
                    ? '4px solid var(--medium)'
                    : summary.escalatedTasks
                    ? '4px solid var(--medium)'
                    : 'var(--border-width-layout) solid var(--border)',
                  background: isEscalatedActive ? 'rgba(234, 179, 8, 0.08)' : undefined,
                  boxShadow: isEscalatedActive ? '0 0 0 1px var(--medium)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: '10px',
                    background: isEscalatedActive ? 'var(--medium)' : summary.escalatedTasks ? 'var(--medium-bg, #fef9c3)' : 'var(--bg-hover)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isEscalatedActive ? '#fff' : summary.escalatedTasks ? 'var(--medium)' : 'var(--text-muted)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}>
                    <AlertTriangle style={{ width: 17, height: 17 }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Escalated Tasks
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: isEscalatedActive ? 'var(--medium)' : summary.escalatedTasks ? 'var(--medium)' : 'var(--text-muted)', marginTop: 2 }}>
                      {isEscalatedActive ? 'Filtered · Click to clear' : summary.escalatedTasks ? `${summary.escalatedTasks} threshold alerts · Click to filter` : 'All within threshold · Click to filter'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: isEscalatedActive ? 'var(--medium)' : summary.escalatedTasks ? 'var(--medium)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {count}
                  </span>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isEscalatedActive ? 'var(--medium)' : 'transparent',
                    boxShadow: isEscalatedActive ? '0 0 6px var(--medium)' : 'none',
                  }} />
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
