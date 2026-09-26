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
  { key: 'Pending',    label: 'Pending',     varName: '--pending',    activeClass: 'active-pending' },
  { key: 'Completed',  label: 'Completed',   varName: '--completed',  activeClass: 'active-completed' },
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
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  color: isActive ? color : 'var(--text-muted)',
                  transition: 'color 0.2s',
                }}>
                  {label}
                </span>
                {/* Status indicator dot */}
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: color,
                  opacity: isActive ? 1 : 0.4,
                  transition: 'opacity 0.2s',
                }} />
              </div>

              {loading ? (
                <div style={{ height: 36, display: 'flex', alignItems: 'center' }}>
                  <div className="animate-spin" style={{
                    width: 16, height: 16,
                    border: `2px solid ${color}`,
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    opacity: 0.5,
                  }} />
                </div>
              ) : (
                <span style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}>
                  {count}
                </span>
              )}

              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {isActive ? 'Filtered — click to clear' : 'Click to filter'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Secondary metrics row */}
      {(summary.overdueFollowUps !== undefined || summary.escalatedTasks !== undefined) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="summary-card" style={{ padding: '14px 20px', cursor: 'default', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>Overdue Follow-Ups</span>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Awaiting response</div>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: summary.overdueFollowUps ? 'var(--high)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {summary.overdueFollowUps || 0}
            </span>
          </div>
          <div className="summary-card" style={{ padding: '14px 20px', cursor: 'default', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>Escalated</span>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Exceeding threshold</div>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: summary.escalatedTasks ? 'var(--high)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {summary.escalatedTasks || 0}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
