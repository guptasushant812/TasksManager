'use client';
import { Task, Priority, WorkStatus } from '@/types/task';
import { formatDate } from '@/lib/dates';
import { FollowUpSummary } from '@/types/followUp';
import { Pencil, Trash2, ListTodo } from 'lucide-react';

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
  onQuickFollowUp?: (task: Task) => void;
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
    <tr className={`task-row ${selected ? 'selected' : ''}`.trim()} data-task-id={task._id}>
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

      <td style={{ minWidth: 140, maxWidth: 200, whiteSpace: 'normal', wordWrap: 'break-word' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
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
          {fuCount > 0 && (
            <span
              style={{
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 4,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                background: fuOverdue ? 'rgba(239,68,68,0.12)' : 'var(--bg-secondary)',
                color: fuOverdue ? 'var(--high)' : 'var(--text-muted)',
                border: `1px solid ${fuOverdue ? 'rgba(239,68,68,0.25)' : 'var(--border-subtle)'}`,
              }}
              title={fuOverdue ? 'Overdue follow-up response pending' : `${fuCount} follow-up logs recorded`}
            >
              💬 {fuCount} {fuOverdue ? '• Overdue' : ''}
            </span>
          )}
        </div>
        <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13, display: 'block', lineHeight: 1.4 }}>
          {task.title}
        </span>
      </td>

      <td style={{ minWidth: 100, maxWidth: 160, whiteSpace: 'normal', wordWrap: 'break-word' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, display: 'block', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {task.description || '—'}
        </span>
      </td>

      <td style={{ width: '1%', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 12 }}>{task.givenBy || '—'}</span>
      </td>

      <td style={{ width: '1%', whiteSpace: 'nowrap' }}>
        <span className={PRIORITY_BADGE[task.priority]}>
          {task.priority}
        </span>
      </td>

      <td style={{ width: '1%', whiteSpace: 'nowrap' }}>
        <span className={STATUS_BADGE[task.workStatus]}>
          {task.workStatus}
        </span>
      </td>

      <td style={{ width: '1%', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 12 }}>{formatDate(task.date)}</span>
      </td>

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
        ) : (
          <div>
            {task.workStatus === 'Completed' && (task.completedRemarks || task.remarks) ? (
              <div>
                <span style={{ fontSize: 10, color: 'var(--completed)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>Remarks</span>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                  {task.completedRemarks || task.remarks}
                </p>
              </div>
            ) : task.workStatus === 'InProgress' && (task.inProgressReason || task.reason) ? (
              <div>
                <span style={{ fontSize: 10, color: 'var(--inprogress)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>InProgress Note</span>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                  {task.inProgressReason || task.reason}
                </p>
              </div>
            ) : task.workStatus === 'Pending' && (task.pendingReason || task.reason) ? (
              <div>
                <span style={{ fontSize: 10, color: 'var(--pending)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>Pending Reason</span>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                  {task.pendingReason || task.reason}
                </p>
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
            )}

            {/* Previous stage notes if different from current */}
            {task.workStatus !== 'Pending' && task.pendingReason && task.pendingReason !== task.reason && (
              <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px dashed var(--border-subtle)' }}>
                <span style={{ fontSize: 9, color: 'var(--pending)', fontWeight: 600, textTransform: 'uppercase' }}>Pending Reason</span>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0', lineHeight: 1.3 }}>{task.pendingReason}</p>
              </div>
            )}
            {task.workStatus !== 'InProgress' && task.inProgressReason && task.inProgressReason !== task.reason && (
              <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px dashed var(--border-subtle)' }}>
                <span style={{ fontSize: 9, color: 'var(--inprogress)', fontWeight: 600, textTransform: 'uppercase' }}>InProgress Note</span>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0', lineHeight: 1.3 }}>{task.inProgressReason}</p>
              </div>
            )}
          </div>
        )}
      </td>

      <td style={{ width: '1%', whiteSpace: 'nowrap' }}>
        <div className="task-actions" style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ActionBtn title="Edit" icon={<Pencil style={{ width: 14, height: 14 }} />} onClick={() => onEdit(task)} />
          <ActionBtn title="Delete" icon={<Trash2 style={{ width: 14, height: 14 }} />} onClick={() => onDelete(task._id)} hoverColor="var(--high)" />
          
          <div style={{ position: 'relative' }}>
            <ActionBtn
              title={fuCount > 0 ? `Follow-ups (${fuCount})` : "Add follow-up"}
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
                pointerEvents: 'none',
              }}>
                {fuCount}
              </span>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

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
      aria-label={title}
      onClick={onClick}
      className="brutalist-hover"
      style={{
        background: 'var(--bg-surface)',
        border: 'var(--border-width-layout) solid var(--border)',
        borderRadius: '6px',
        padding: '5px',
        cursor: 'pointer',
        color: defaultColor || 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: 'var(--shadow-taste-sm)',
      }}
      onMouseEnter={(e) => {
        if (hoverColor) {
          e.currentTarget.style.background = hoverColor;
          e.currentTarget.style.color = '#fff';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverColor) {
          e.currentTarget.style.background = 'var(--bg-surface)';
          e.currentTarget.style.color = defaultColor || 'var(--text-primary)';
        }
      }}
    >
      {icon}
    </button>
  );
}
