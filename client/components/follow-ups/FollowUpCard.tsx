'use client';
import { Task, Priority } from '@/types/task';
import { FollowUpSummary } from '@/types/followUp';
import { formatDate } from '@/lib/dates';
import MethodBadge from './MethodBadge';
import { ListTodo, Plus, Clock, User, AlertTriangle } from 'lucide-react';

interface FollowUpCardProps {
  task: Task;
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

export default function FollowUpCard({
  task,
  selected,
  selectMode,
  escalationThreshold = 3,
  escalationEnabled = false,
  onSelect,
  onOpenHistory,
  onAddFollowUp,
  onQuickAdd,
}: FollowUpCardProps) {
  const handleAdd = onAddFollowUp || onQuickAdd;
  const summary: FollowUpSummary | undefined = task.followUpSummary;
  const count = summary?.count ?? 0;
  const isOverdue = summary?.isOverdue ?? false;
  const isEscalated = escalationEnabled && count >= escalationThreshold && task.workStatus !== 'Completed';

  const nextAction = summary?.lastNextAction;
  const nextDate = summary?.nextFollowUpDate;
  const contactPerson = summary?.lastContactPerson || task.contactPerson;

  return (
    <div
      className={`card fu-card ${selected ? 'selected' : ''}`}
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: 'var(--bg-surface)',
        border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {selectMode && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(task._id)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
              aria-label={`Select task ${task.taskId}`}
            />
          )}
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: 'var(--accent)',
              fontWeight: 700,
              background: 'var(--accent-subtle)',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            {task.taskId}
          </span>
          <span className={PRIORITY_BADGE[task.priority]} style={{ fontSize: 10, padding: '1px 6px' }}>
            {task.priority}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            💬 {count} logs
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
                gap: 2,
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--high)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <AlertTriangle style={{ width: 10, height: 10 }} />
              Escalated
            </span>
          )}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => onOpenHistory(task)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            textAlign: 'left',
            color: 'var(--text-primary)',
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1.4,
            cursor: 'pointer',
            display: 'block',
            width: '100%',
          }}
        >
          {task.title}
        </button>

        {contactPerson && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
            <User style={{ width: 12, height: 12, opacity: 0.7 }} />
            <span>To: <strong style={{ color: 'var(--text-secondary)' }}>{contactPerson}</strong></span>
          </div>
        )}
      </div>

      {count > 0 && (summary?.lastCommunicated || summary?.lastDate) ? (
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {summary.lastMethod && <MethodBadge method={summary.lastMethod as any} />}
              {summary.lastDate && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(summary.lastDate)}</span>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Latest
            </span>
          </div>

          {summary.lastCommunicated && (
            <p style={{ margin: '0 0 4px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {summary.lastCommunicated}
            </p>
          )}

          {summary.lastResponse && (
            <p
              style={{
                margin: 0,
                color: 'var(--completed)',
                lineHeight: 1.4,
                borderLeft: '2px solid var(--completed)',
                paddingLeft: 6,
              }}
            >
              ↳ {summary.lastResponse}
            </p>
          )}
        </div>
      ) : (
        <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-muted)' }}>
          No communication logged yet
        </div>
      )}

      {(nextAction || nextDate) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '8px 12px',
            background: isOverdue ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-surface)',
            border: `1px dashed ${isOverdue ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.04em' }}>
              Next Step:
            </span>
            <p style={{ margin: '2px 0 0', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nextAction || 'Follow up'}
            </p>
          </div>

          {nextDate && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock style={{ width: 11, height: 11, color: isOverdue ? 'var(--high)' : 'var(--text-muted)' }} />
                <span style={{ fontWeight: isOverdue ? 700 : 500, color: isOverdue ? 'var(--high)' : 'var(--text-secondary)' }}>
                  {formatDate(nextDate)}
                </span>
              </div>
              {isOverdue && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--high)',
                    marginTop: 2,
                  }}
                >
                  Overdue
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onOpenHistory(task)}
          style={{
            minHeight: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontWeight: 600,
            fontSize: 13,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <ListTodo style={{ width: 15, height: 15, color: 'var(--accent)' }} />
          History ({count})
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleAdd?.(task)}
          style={{
            minHeight: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <Plus style={{ width: 15, height: 15, strokeWidth: 2.5 }} />
          Add Follow-Up
        </button>
      </div>
    </div>
  );
}
