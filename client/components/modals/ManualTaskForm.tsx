'use client';
import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { toIsoDate } from '@/lib/dates';
import { Priority, WorkStatus, TaskFilters } from '@/types/task';
import TaskFormFields from './TaskFormFields';
import { Save } from 'lucide-react';

interface ManualTaskFormProps {
  defaultFilters: TaskFilters;
  onSaved: () => void;
  onCancel: () => void;
}

const EMPTY: {
  title: string; description: string; givenBy: string; contactPerson: string;
  priority: Priority | ''; workStatus: WorkStatus | '';
  reason: string; remarks: string; date: string; dueDate: string;
} = {
  title: '', description: '', givenBy: '', contactPerson: '',
  priority: 'Medium', workStatus: 'Pending',
  reason: '', remarks: '',
  date: toIsoDate(new Date()),
  dueDate: '',
};

export default function ManualTaskForm({ defaultFilters, onSaved, onCancel }: ManualTaskFormProps) {
  const [data, setData] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { createTask } = useTasks();

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

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      await createTask({
        ...data,
        priority: (data.priority || 'Medium') as Priority,
        workStatus: (data.workStatus || 'Pending') as WorkStatus,
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        userId: null,
      });
      onSaved();
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to save task' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TaskFormFields data={data} onChange={handleChange} errors={errors} />

      {errors.submit && (
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--high-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--high)' }}>
          {errors.submit}
        </div>
      )}

      {/* Footer sticky bar hack - handled by wrapper padding visually */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', justifyContent: 'flex-end', margin: '24px -24px -24px -24px', paddingRight: 24, paddingLeft: 24, paddingBottom: 24, background: 'var(--bg-surface)' }}>
        <button className="btn btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Saving…</>
          ) : (
            <><Save style={{ width: 14, height: 14 }} /> Save Task</>
          )}
        </button>
      </div>
    </div>
  );
}
