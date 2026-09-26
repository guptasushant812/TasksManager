'use client';
import { useState } from 'react';
import { Task, Priority, WorkStatus } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import { toIsoDate } from '@/lib/dates';
import TaskFormFields from './TaskFormFields';
import { X, Save } from 'lucide-react';

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditTaskModal({ task, onClose, onSaved }: EditTaskModalProps) {
  const [data, setData] = useState({
    title: task.title,
    description: task.description,
    givenBy: task.givenBy,
    contactPerson: task.contactPerson || '',
    priority: task.priority as Priority | '',
    workStatus: task.workStatus as WorkStatus | '',
    reason: task.reason,
    remarks: task.remarks,
    date: toIsoDate(task.date),
    dueDate: task.dueDate ? toIsoDate(task.dueDate) : '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { updateTask } = useTasks();

  function handleChange(field: string, value: string) {
    setData((d) => ({ ...d, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!data.title.trim()) errs.title = 'Title is required';
    if (!data.date) errs.date = 'Task date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateTask(task._id, {
        ...data,
        priority: (data.priority || 'Medium') as Priority,
        workStatus: (data.workStatus || 'Pending') as WorkStatus,
        date: new Date(data.date).toISOString(),
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      });
      onSaved();
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to update task' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box animate-slide-up" style={{ padding: 0 }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: 'var(--border-width-layout) solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'var(--bg-elevated)' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Edit Task</h2>
            <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{task.taskId}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', padding: 4
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
          <TaskFormFields data={data} onChange={handleChange} errors={errors} />

          {errors.submit && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--high-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--high)' }}>
              {errors.submit}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: 'var(--border-width-layout) solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Saving…</>
            ) : (
              <><Save style={{ width: 14, height: 14 }} /> Update Task</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
