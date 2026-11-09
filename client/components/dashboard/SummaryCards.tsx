'use client';
import { Summary, WorkStatus } from '@/types/task';
import { AlertTriangle, PhoneCall, LucideIcon } from 'lucide-react';

interface SummaryCardsProps {
  summary: Summary;
  loading: boolean;
  activeStatus: WorkStatus | '';
  onStatusClick: (status: WorkStatus | '') => void;
  activeSecondaryFilter?: 'overdue' | 'escalated' | '';
  onSecondaryFilterClick?: (filter: 'overdue' | 'escalated') => void;
}

const PRIMARY_CARDS: { key: WorkStatus; label: string; countKey: keyof Summary; varName: string; activeClass: string }[] = [
  { key: 'InProgress', label: 'In Progress', countKey: 'inProgress', varName: '--inprogress', activeClass: 'active-inprogress' },
  { key: 'Pending', label: 'Pending', countKey: 'pending', varName: '--pending', activeClass: 'active-pending' },
  { key: 'Completed', label: 'Completed', countKey: 'completed', varName: '--completed', activeClass: 'active-completed' },
];

interface SecondaryCardConfig {
  key: 'overdue' | 'escalated';
  id: string;
  label: string;
  icon: LucideIcon;
  colorVar: string;
  bgVar: string;
  activeBg: string;
  activeClass: string;
  getCount: (summary: Summary) => number;
  getSubtitle: (isActive: boolean, count: number) => string;
}

const SECONDARY_CARDS: SecondaryCardConfig[] = [
  {
    key: 'overdue',
    id: 'summary-card-overdue',
    label: 'Overdue Follow-Ups',
    icon: PhoneCall,
    colorVar: 'var(--high)',
    bgVar: 'var(--high-bg, #fee2e2)',
    activeBg: 'rgba(239, 68, 68, 0.08)',
    activeClass: 'active-overdue',
    getCount: (s) => s.overdueFollowUps || 0,
    getSubtitle: (isActive, count) =>
      isActive
        ? 'Filtered · Click to clear'
        : count
        ? `${count} awaiting response · Click to filter`
        : 'No overdue items · Click to filter',
  },
  {
    key: 'escalated',
    id: 'summary-card-escalated',
    label: 'Escalated Tasks',
    icon: AlertTriangle,
    colorVar: 'var(--medium)',
    bgVar: 'var(--medium-bg, #fef9c3)',
    activeBg: 'rgba(234, 179, 8, 0.08)',
    activeClass: 'active-escalated',
    getCount: (s) => s.escalatedTasks || 0,
    getSubtitle: (isActive, count) =>
      isActive
        ? 'Filtered · Click to clear'
        : count
        ? `${count} threshold alerts · Click to filter`
        : 'All within threshold · Click to filter',
  },
];

export default function SummaryCards({
  summary,
  loading,
  activeStatus,
  onStatusClick,
  activeSecondaryFilter = '',
  onSecondaryFilterClick,
}: SummaryCardsProps) {
  const showSecondary = summary.overdueFollowUps !== undefined || summary.escalatedTasks !== undefined;

  return (
    <div className="summary-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="summary-cards-grid">
        {PRIMARY_CARDS.map(({ key, label, countKey, varName, activeClass }) => {
          const isActive = activeStatus === key;
          const color = `var(${varName})`;
          const count = (summary[countKey] as number) || 0;

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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onStatusClick(isActive ? '' : key);
                }
              }}
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
                <span className="summary-count" style={{ color: isActive ? '#fff' : color }}>
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

      {showSecondary && (
        <div className="summary-secondary-grid">
          {SECONDARY_CARDS.map(({ key, id, label, icon: Icon, colorVar, bgVar, activeBg, activeClass, getCount, getSubtitle }) => {
            const isActive = activeSecondaryFilter === key;
            const count = getCount(summary);
            const hasItems = count > 0;

            return (
              <div
                key={key}
                id={id}
                className={`summary-action-card brutalist-hover ${isActive ? activeClass : ''}`}
                onClick={() => onSecondaryFilterClick?.(key)}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={`Filter by ${label.toLowerCase()}: ${count} tasks`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSecondaryFilterClick?.(key);
                  }
                }}
                style={{
                  cursor: 'pointer',
                  borderInlineStart: (isActive || hasItems)
                    ? `4px solid ${colorVar}`
                    : 'var(--border-width-layout) solid var(--border)',
                  background: isActive ? activeBg : undefined,
                  boxShadow: isActive ? `0 0 0 1px ${colorVar}` : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: '10px',
                    background: isActive ? colorVar : hasItems ? bgVar : 'var(--bg-hover)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? '#fff' : hasItems ? colorVar : 'var(--text-muted)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}>
                    <Icon style={{ width: 17, height: 17 }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: (isActive || hasItems) ? colorVar : 'var(--text-muted)', marginTop: 2 }}>
                      {getSubtitle(isActive, count)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: (isActive || hasItems) ? colorVar : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {count}
                  </span>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isActive ? colorVar : 'transparent',
                    boxShadow: isActive ? `0 0 6px ${colorVar}` : 'none',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
