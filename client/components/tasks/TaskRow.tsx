'use client';
import { Task, Priority, WorkStatus } from '@/types/task';
import { formatDate } from '@/lib/dates';
import { FollowUpSummary } from '@/types/followUp';
import { Pencil, Trash2, Zap, ListTodo } from 'lucide-react';

interface TaskRowProps {
  task: Task;
  index: number;
  selected: boolean;
  selectMode: boolean;
  followUpSummary?: FollowUpSummary;
  onSelect: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onFollowUp: (task: Task) => void;
  onQuickFollowUp: (task: Task) => void;
  mode?: 'tasks' | 'follow-ups';
}

const PRIORITY_BADGE: Record<Priority, string> = {
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
};

const STATUS_BADGE: Record<WorkStatus, string> = {
  InProgress: 'badge-inprogress',
  Pending: 'badge-pending',
  Completed: 'badge-completed',
};

export default function TaskRow({ task, index, selected, selectMode, followUpSummary, onSelect, onEdit, onDelete, onFollowUp, onQuickFollowUp, mode = 'tasks' }: TaskRowProps) {
  const showReason  = task.workStatus === 'InProgress' || task.workStatus === 'Pending';
  const showRemarks = task.workStatus === 'Completed';
  const fuCount = followUpSummary?.count || 0;
  const fuOverdue = followUpSummary?.isOverdue || false;

  return (
    <tr className={selected ? 'selected' : ''}>
      {/* Checkbox / Sr No */}
      <td style={{ width: '1%', whiteSpace: 'nowrap', textAlign: 'center' }}>
        {selectMode ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(task._id)}
            style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{index + 1}</span>
        )}
      </td>

      {/* Task */}
      <td style={{ minWidth: 140, maxWidth: 200, whiteSpace: 'normal', wordWrap: 'break-word' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: 'var(--accent)',
            fontWeight: 600,
            background: 'var(--accent-subtle)',
            padding: '1px 5px',
            borderRadius: 4,
          }}>
            {task.taskId}
          </span>
          {task.dueDate && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Due: {formatDate(task.dueDate)}
            </span>
          )}
        </div>
        <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13, display: 'block', lineHeight: 1.4 }}>
          {task.title}
        </span>
      </td>

      {/* Description */}
      <td style={{ minWidth: 100, maxWidth: 160, whiteSpace: 'normal', wordWrap: 'break-word' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, display: 'block', wordBreak: 'break-word' }}>
          {task.description || '—'}
        </span>
      </td>

      {/* Given By */}
      <td style={{ width: '1%', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 12 }}>{task.givenBy || '—'}</span>
      </td>

      {/* Priority */}
      <td style={{ width: '1%', whiteSpace: 'nowrap' }}>
        <span className={PRIORITY_BADGE[task.priority]}>
          {task.priority}
        </span>
      </td>

      {/* Work Status */}
      <td style={{ width: '1%', whiteSpace: 'nowrap' }}>
        <span className={STATUS_BADGE[task.workStatus]}>
          {task.workStatus}
        </span>
      </td>

      {/* Date */}
      <td style={{ width: '1%', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 12 }}>{formatDate(task.date)}</span>
      </td>

      {/* Reason / Remarks / Follow-up */}
      <td style={{ minWidth: 100, maxWidth: 140, whiteSpace: 'normal', wordWrap: 'break-word' }}>
        {mode === 'follow-ups' && fuCount > 0 && followUpSummary?.lastCommunicated ? (
          <div>
            <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>Latest Follow-Up</span>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{followUpSummary.lastCommunicated}</p>
            {followUpSummary.lastResponse && (
              <p style={{ fontSize: 12, color: 'var(--completed)', marginTop: 3, lineHeight: 1.4, borderLeft: '2px solid var(--border)', paddingLeft: 6 }}>
                {followUpSummary.lastResponse}
              </p>
            )}
          </div>
        ) : showReason && task.reason ? (
          <div>
            <span style={{ fontSize: 10, color: 'var(--pending)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>Reason</span>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{task.reason}</p>
          </div>
        ) : showRemarks && task.remarks ? (
          <div>
            <span style={{ fontSize: 10, color: 'var(--completed)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>Remarks</span>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{task.remarks}</p>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
        )}
      </td>

      {/* Actions */}
      <td style={{ width: '1%', whiteSpace: 'nowrap' }}>
        <div className="task-actions" style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ActionBtn title="Edit" icon={<Pencil style={{ width: 14, height: 14 }} />} onClick={() => onEdit(task)} />
          <ActionBtn title="Delete" icon={<Trash2 style={{ width: 14, height: 14 }} />} onClick={() => onDelete(task._id)} hoverColor="var(--high)" />
          
          {mode === 'tasks' && (
            <ActionBtn title="Quick follow-up" icon={<Zap style={{ width: 14, height: 14 }} />} onClick={() => onQuickFollowUp(task)} hoverColor="var(--accent)" />
          )}
          
          {mode === 'follow-ups' && (
            <div style={{ position: 'relative' }}>
              <ActionBtn
                title="Follow-ups"
                icon={<ListTodo style={{ width: 14, height: 14 }} />}
                onClick={() => onFollowUp(task)}
                defaultColor={fuOverdue ? 'var(--high)' : undefined}
              />
              {fuCount > 0 && (
                <span style={{
                  position: 'absolute', top: -3, right: -3,
                  background: fuOverdue ? 'var(--high)' : 'var(--accent)',
                  color: '#fff', fontSize: 9, fontWeight: 700,
                  borderRadius: 999, minWidth: 14, height: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', lineHeight: 1,
                }}>
                  {fuCount}
                </span>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

/* Reusable inline action button — consistent hit target, clean */
function ActionBtn({ title, icon, onClick, hoverColor, defaultColor }: {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  hoverColor?: string;
  defaultColor?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)',
        border: 'var(--border-width-layout) solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: 4,
        cursor: 'pointer',
        color: defaultColor || 'var(--text-primary)',
        transition: 'all 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--box-shadow-brutalist-sm)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hoverColor || 'var(--bg-hover)';
        if (hoverColor) e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--bg-surface)';
        if (hoverColor) e.currentTarget.style.color = defaultColor || 'var(--text-primary)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translate(2px, 2px)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translate(0, 0)';
        e.currentTarget.style.boxShadow = 'var(--box-shadow-brutalist-sm)';
      }}
    >
      {icon}
    </button>
  );
}
