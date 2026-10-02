'use client';
import { Task } from '@/types/task';
import { formatDate } from '@/lib/dates';
import { AlertTriangle, CheckCircle, Clock, MessageSquare, Flame, Check, PhoneCall, Pencil, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface AttentionSectionProps {
  tasks: Task[];
  loading: boolean;
  onCompleteTask: (task: Task) => Promise<void>;
  onQuickFollowUp: (task: Task) => void;
  onEditTask: (task: Task) => void;
}

interface AttentionItem {
  task: Task;
  urgencyType: 'overdue' | 'followup_overdue' | 'escalated' | 'due_today' | 'due_soon' | 'high_priority';
  urgencyLabel: string;
  urgencyColor: string;
  urgencyBg: string;
  urgencyIcon: React.ReactNode;
  urgencyScore: number;
}

export default function AttentionSection({
  tasks,
  loading,
  onCompleteTask,
  onQuickFollowUp,
  onEditTask,
}: AttentionSectionProps) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dayAfterTomorrowStart = new Date(todayStart);
  dayAfterTomorrowStart.setDate(dayAfterTomorrowStart.getDate() + 2);

  const attentionItems: AttentionItem[] = [];

  tasks.forEach((t) => {
    if (t.workStatus === 'Completed') return;

    const dueDateObj = t.dueDate ? new Date(t.dueDate) : null;
    const isOverdue = dueDateObj ? dueDateObj < todayStart : false;
    const isDueToday = dueDateObj ? dueDateObj >= todayStart && dueDateObj < tomorrowStart : false;
    const isDueSoon = dueDateObj ? dueDateObj >= tomorrowStart && dueDateObj < dayAfterTomorrowStart : false;
    const hasOverdueFollowUp = Boolean(t.followUpSummary?.isOverdue);
    const isEscalated = Boolean(t.followUpSummary && t.followUpSummary.count >= 3);
    const isHighPriority = t.priority === 'High';

    if (isOverdue && dueDateObj) {
      const diffDays = Math.max(1, Math.round((todayStart.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)));
      attentionItems.push({
        task: t,
        urgencyType: 'overdue',
        urgencyLabel: `Overdue by ${diffDays}d`,
        urgencyColor: 'var(--high)',
        urgencyBg: 'var(--high-bg)',
        urgencyIcon: <Clock style={{ width: 12, height: 12 }} />,
        urgencyScore: 100 + diffDays,
      });
    } else if (hasOverdueFollowUp) {
      attentionItems.push({
        task: t,
        urgencyType: 'followup_overdue',
        urgencyLabel: 'Follow-Up Overdue',
        urgencyColor: 'var(--high)',
        urgencyBg: 'var(--high-bg)',
        urgencyIcon: <MessageSquare style={{ width: 12, height: 12 }} />,
        urgencyScore: 90,
      });
    } else if (isEscalated) {
      attentionItems.push({
        task: t,
        urgencyType: 'escalated',
        urgencyLabel: `Escalated (${t.followUpSummary?.count} logs)`,
        urgencyColor: 'var(--medium)',
        urgencyBg: 'var(--medium-bg)',
        urgencyIcon: <AlertTriangle style={{ width: 12, height: 12 }} />,
        urgencyScore: 80,
      });
    } else if (isDueToday) {
      attentionItems.push({
        task: t,
        urgencyType: 'due_today',
        urgencyLabel: 'Due Today',
        urgencyColor: 'var(--medium)',
        urgencyBg: 'var(--medium-bg)',
        urgencyIcon: <AlertTriangle style={{ width: 12, height: 12 }} />,
        urgencyScore: 70,
      });
    } else if (isDueSoon) {
      attentionItems.push({
        task: t,
        urgencyType: 'due_soon',
        urgencyLabel: 'Due Tomorrow',
        urgencyColor: 'var(--inprogress)',
        urgencyBg: 'var(--inprogress-bg)',
        urgencyIcon: <Clock style={{ width: 12, height: 12 }} />,
        urgencyScore: 50,
      });
    } else if (isHighPriority) {
      attentionItems.push({
        task: t,
        urgencyType: 'high_priority',
        urgencyLabel: 'High Priority',
        urgencyColor: 'var(--high)',
        urgencyBg: 'var(--high-bg)',
        urgencyIcon: <Flame style={{ width: 12, height: 12 }} />,
        urgencyScore: 40,
      });
    }
  });

  attentionItems.sort((a, b) => b.urgencyScore - a.urgencyScore);

  const displayedItems = attentionItems.slice(0, 5);
  const remainingCount = attentionItems.length - displayedItems.length;

  return (
    <div
      className="card"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: attentionItems.length > 0 ? 'var(--high-bg)' : 'var(--low-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: attentionItems.length > 0 ? 'var(--high)' : 'var(--completed)',
            }}
          >
            {attentionItems.length > 0 ? (
              <AlertTriangle style={{ width: 15, height: 15 }} />
            ) : (
              <CheckCircle style={{ width: 15, height: 15 }} />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  margin: 0,
                  color: 'var(--text-primary)',
                }}
              >
                Requires Attention
              </h2>
              {attentionItems.length > 0 && (
                <span
                  style={{
                    background: 'var(--high)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 900,
                    padding: '1px 7px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {attentionItems.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0 0', fontWeight: 600 }}>
              Overdue deadlines, pending follow-up responses, and escalated items.
            </p>
          </div>
        </div>

        {attentionItems.length > 0 && (
          <Link href="/tasks?status=Pending" style={{ textDecoration: 'none' }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--accent)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              View in Tasks <ArrowRight style={{ width: 13, height: 13 }} />
            </span>
          </Link>
        )}
      </div>

      {loading && attentionItems.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="skeleton" style={{ height: 56, borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ height: 56, borderRadius: 'var(--radius-md)' }} />
        </div>
      ) : attentionItems.length === 0 ? (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            background: 'var(--bg-hover)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-full)',
              background: 'var(--low-bg)',
              color: 'var(--completed)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            <CheckCircle style={{ width: 20, height: 20 }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
            You're all caught up
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            No overdue deadlines, urgent follow-ups, or escalated items right now.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayedItems.map(({ task, urgencyLabel, urgencyColor, urgencyBg, urgencyIcon }) => (
            <div
              key={task._id}
              className="brutalist-hover"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                padding: '12px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${urgencyColor}`,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: urgencyBg,
                      color: urgencyColor,
                    }}
                  >
                    {urgencyIcon}
                    {urgencyLabel}
                  </span>

                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--accent)',
                    }}
                  >
                    {task.taskId}
                  </span>

                  <span
                    className={`badge badge-${task.priority.toLowerCase()}`}
                    style={{ fontSize: 10, padding: '1px 6px' }}
                  >
                    {task.priority}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  {task.title}
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {task.dueDate && <span>Due: {formatDate(task.dueDate)}</span>}
                  {task.contactPerson && <span>Contact: {task.contactPerson}</span>}
                  {task.givenBy && <span>Given by: {task.givenBy}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => onQuickFollowUp(task)}
                  className="brutalist-hover"
                  style={{
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Quickly record a communication log"
                >
                  <PhoneCall style={{ width: 12, height: 12 }} />
                  <span>Log Follow-Up</span>
                </button>

                <button
                  type="button"
                  onClick={() => onEditTask(task)}
                  className="brutalist-hover"
                  style={{
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 8px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  title="Edit task"
                >
                  <Pencil style={{ width: 12, height: 12 }} />
                </button>

                <button
                  type="button"
                  onClick={() => onCompleteTask(task)}
                  className="brutalist-hover"
                  style={{
                    background: 'var(--low-bg)',
                    border: '1px solid var(--completed)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'var(--completed)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Mark this task as Completed"
                >
                  <Check style={{ width: 13, height: 13, strokeWidth: 3 }} />
                  <span>Mark Done</span>
                </button>
              </div>
            </div>
          ))}

          {remainingCount > 0 && (
            <div style={{ textAlign: 'center', paddingTop: 4 }}>
              <Link href="/tasks?status=Pending" style={{ textDecoration: 'none' }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  + {remainingCount} more items requiring attention. View all in Tasks →
                </span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
