'use client';
import { Summary, WorkStatus } from '@/types/task';

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

              <span style={{
                fontSize: 48,
                fontWeight: 900,
                color: isActive ? '#fff' : color,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {count}
              </span>

              <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#fff' : 'var(--text-muted)' }}>
                {isActive ? 'FILTERED — CLICK TO CLEAR' : 'CLICK TO FILTER'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Secondary metrics row */}
      {(summary.overdueFollowUps !== undefined || summary.escalatedTasks !== undefined) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="summary-card" style={{ padding: '24px 20px', cursor: 'default', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-primary)' }}>Overdue Follow-Ups</span>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase' }}>Awaiting response</div>
            </div>
            <span style={{ fontSize: 32, fontWeight: 900, color: summary.overdueFollowUps ? 'var(--high)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {summary.overdueFollowUps || 0}
            </span>
          </div>
          <div className="summary-card" style={{ padding: '24px 20px', cursor: 'default', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-primary)' }}>Escalated</span>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase' }}>Exceeding threshold</div>
            </div>
            <span style={{ fontSize: 32, fontWeight: 900, color: summary.escalatedTasks ? 'var(--high)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {summary.escalatedTasks || 0}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
