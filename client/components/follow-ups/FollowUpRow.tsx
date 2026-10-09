'use client';
import { Task, Priority } from '@/types/task';
import { FollowUpSummary } from '@/types/followUp';
import { formatDate } from '@/lib/dates';
import MethodBadge from './MethodBadge';
import { ListTodo, Plus, Calendar, AlertTriangle, User, ArrowRight, Clock } from 'lucide-react';

interface FollowUpRowProps {
  task: Task;
  index: number;
  selected: boolean;
  selectMode: boolean;
  escalationThreshold?: number;
  escalationEnabled?: boolean;
  onSelect: (id: string) => void;
  onOpenHistory: (task: Task) => void;
  onAddFollowUp?: (task: Task) => void;
  onQuickAdd?: (task: Task) => void;
}

const PRIORITY_BADGE: Record<Priority, string> = {
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
};

export default function FollowUpRow({
  task,
  index,
  selected,
  selectMode,
  escalationThreshold = 3,
  escalationEnabled = false,
  onSelect,
  onOpenHistory,
  onAddFollowUp,
  onQuickAdd,
}: FollowUpRowProps) {
  const handleAdd = onAddFollowUp || onQuickAdd;
  const summary: FollowUpSummary | undefined = task.followUpSummary;
  const count = summary?.count ?? 0;
  const isOverdue = summary?.isOverdue ?? false;
  const isEscalated = escalationEnabled && count >= escalationThreshold && task.workStatus !== 'Completed';

  const nextAction = summary?.lastNextAction;
  const nextDate = summary?.nextFollowUpDate;
  const contactPerson = summary?.lastContactPerson || task.contactPerson;

  return (
    <tr
      className={`fu-row ${selected ? 'selected' : ''}`}
      style={{
        transition: 'background var(--duration-fast)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <td style={{ width: '1%', whiteSpace: 'nowrap', textAlign: 'center', padding: '12px 14px' }}>
        {selectMode ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(task._id)}
            style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }}
            aria-label={`Select task ${task.taskId}`}
          />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
            {index + 1}
          </span>
        )}
      </td>

      <td style={{ minWidth: 200, maxWidth: 280, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              color: 'var(--accent)',
              fontWeight: 700,
              background: 'var(--accent-subtle)',
              padding: '1px 5px',
              borderRadius: 4,
            }}
          >
            {task.taskId}
          </span>
          <span className={PRIORITY_BADGE[task.priority]} style={{ fontSize: 10, padding: '1px 6px' }}>
            {task.priority}
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 4,
              fontWeight: 600,
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {task.workStatus}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenHistory(task)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            textAlign: 'left',
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: 13,
            lineHeight: 1.4,
            cursor: 'pointer',
            display: 'block',
            width: '100%',
          }}
          className="hover-underline"
          title={`Click to open follow-up history for ${task.title}`}
        >
          {task.title}
        </button>

        {contactPerson && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            <User style={{ width: 11, height: 11, opacity: 0.7 }} />
            <span>To: <strong style={{ color: 'var(--text-secondary)' }}>{contactPerson}</strong></span>
          </div>
        )}
      </td>

      <td style={{ width: '1%', whiteSpace: 'nowrap', padding: '12px 14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: count > 0 ? 'var(--bg-elevated)' : 'var(--bg-surface)',
              color: count > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            💬 {count} {count === 1 ? 'log' : 'logs'}
          </span>

          {isEscalated && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--high)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
              title="Escalation threshold reached"
            >
              <AlertTriangle style={{ width: 10, height: 10 }} />
              Threshold ({count}/{escalationThreshold})
            </span>
          )}
        </div>
      </td>

      <td style={{ minWidth: 200, maxWidth: 300, padding: '12px 14px' }}>
        {count > 0 && (summary?.lastCommunicated || summary?.lastDate) ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {summary.lastMethod && (
                <MethodBadge method={summary.lastMethod as any} />
              )}
              {summary.lastDate && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {formatDate(summary.lastDate)}
                </span>
              )}
            </div>

            {summary.lastCommunicated && (
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  margin: '0 0 3px',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
                title={summary.lastCommunicated}
              >
                {summary.lastCommunicated}
              </p>
            )}

            {summary.lastResponse && (
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--completed)',
                  margin: 0,
                  lineHeight: 1.4,
                  borderLeft: '2px solid var(--completed)',
                  paddingLeft: 6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={`Response: ${summary.lastResponse}`}
              >
                ↳ {summary.lastResponse}
              </p>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            No follow-ups recorded yet
          </span>
        )}
      </td>

      <td style={{ minWidth: 160, maxWidth: 240, padding: '12px 14px' }}>
        {nextAction || nextDate ? (
          <div>
            {nextAction && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                    letterSpacing: '0.04em',
                    flexShrink: 0,
                  }}
                >
                  Next:
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={nextAction}
                >
                  {nextAction}
                </span>
              </div>
            )}

            {nextDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Clock style={{ width: 11, height: 11, color: isOverdue ? 'var(--high)' : 'var(--text-muted)' }} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isOverdue ? 700 : 500,
                    color: isOverdue ? 'var(--high)' : 'var(--text-secondary)',
                  }}
                >
                  {formatDate(nextDate)}
                </span>

                {isOverdue && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: 'var(--high)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    Overdue
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
        )}
      </td>

      <td style={{ width: '1%', whiteSpace: 'nowrap', textAlign: 'right', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onOpenHistory(task)}
            style={{
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
            title="View complete communication timeline"
          >
            <ListTodo style={{ width: 13, height: 13, color: 'var(--accent)' }} />
            History
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleAdd?.(task)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
            title="Add Follow-Up"
          >
            <Plus style={{ width: 13, height: 13, strokeWidth: 2.5 }} />
            Add Follow-Up
          </button>
        </div>
      </td>
    </tr>
  );
}
