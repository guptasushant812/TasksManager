'use client';
import { useState } from 'react';
import { useAiDraft } from '@/hooks/useAiDraft';
import { useTasks } from '@/hooks/useTasks';
import { TaskDraft, Priority, WorkStatus } from '@/types/task';
import TaskFormFields from './TaskFormFields';
import { Sparkles, AlertCircle, CheckCircle2, Trash2, ArrowLeft, Save } from 'lucide-react';

interface AiInputFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

type Step = 'input' | 'preview';

export default function AiInputForm({ onSaved, onCancel }: AiInputFormProps) {
  const [step, setStep] = useState<Step>('input');
  const [rawText, setRawText] = useState('');
  const [drafts, setDrafts] = useState<TaskDraft[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { loading: aiLoading, error: aiError, warning, generateDrafts } = useAiDraft();
  const { createTask } = useTasks();

  async function handleGenerate() {
    if (!rawText.trim()) {
      setErrors({ rawText: 'Please describe your task first' });
      return;
    }
    setErrors({});
    const result = await generateDrafts(rawText);
    if (result && result.length > 0) {
      setDrafts(result);
      setStep('preview');
    }
  }

  function handleDraftChange(index: number, field: string, value: string) {
    setDrafts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    if (errors[`${index}-${field}`]) {
      setErrors((e) => { const n = { ...e }; delete n[`${index}-${field}`]; return n; });
    }
  }

  function validateDrafts(): boolean {
    const errs: Record<string, string> = {};
    drafts.forEach((d, i) => {
      if (!d.title.trim()) errs[`${i}-title`] = 'Title is required';
      if (!d.date) errs[`${i}-date`] = 'Task date is required';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (drafts.length === 0 || !validateDrafts()) return;
    setSaving(true);
    try {
      await Promise.all(drafts.map(d => createTask({
        ...d,
        priority: (d.priority || 'Medium') as Priority,
        workStatus: (d.workStatus || 'Pending') as WorkStatus,
        date: d.date ? new Date(d.date).toISOString() : new Date().toISOString(),
        dueDate: d.dueDate ? new Date(d.dueDate).toISOString() : undefined,
        userId: null,
      })));
      onSaved();
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to save tasks' });
    } finally {
      setSaving(false);
    }
  }

  function removeDraft(index: number) {
    setDrafts(prev => prev.filter((_, i) => i !== index));
    if (drafts.length === 1) {
      setStep('input');
    }
  }

  // ── Step 1: Raw text input ───────────────────────────────────────────────
  if (step === 'input') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: '16px', marginBottom: 20,
          background: 'var(--accent-subtle)', border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 'var(--radius-lg)', fontSize: 13, color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Sparkles style={{ width: 14, height: 14 }} /> AI Task Structuring
          </strong>
          Write your task in plain language — exactly as you'd describe it verbally or in a message.
          The AI will extract and structure it into a timesheet-ready format for your review.
        </div>

        <div style={{ marginBottom: 4 }}>
          <label className="label" htmlFor="ai-raw-input">Describe your task(s)</label>
          <textarea
            id="ai-raw-input"
            className="input"
            placeholder={`Example:\n\nAttach 2 notices to the Department Communication ISO File — Working on Saturday 22.08.2026, reporting time on attendance.pdf. NBA Committee Visit scheduled 28th to 30th — given by Sachin Oak sir, date 10-07-2026. Currently pending, waiting for approval.`}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            style={{ resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
          />
          {errors.rawText && <span style={{ fontSize: 11, color: 'var(--high)', marginTop: 6, display: 'block' }}>{errors.rawText}</span>}
          {aiError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--high)', marginTop: 8, padding: '8px 12px', background: 'var(--high-bg)', borderRadius: 'var(--radius-sm)' }}>
              <AlertCircle style={{ width: 14, height: 14 }} /> {aiError}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', justifyContent: 'flex-end', margin: '24px -24px -24px -24px', paddingRight: 24, paddingLeft: 24, paddingBottom: 24, background: 'var(--bg-surface)' }}>
          <button className="btn btn-ghost" onClick={onCancel} disabled={aiLoading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={aiLoading} style={{ background: 'var(--accent)' }}>
            {aiLoading ? (
              <><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Structuring…</>
            ) : (
              <><Sparkles style={{ width: 14, height: 14 }} /> Structure with AI</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Editable preview ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px', marginBottom: 20,
        background: 'var(--completed-bg)', border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: 'var(--radius-lg)', fontSize: 13,
      }}>
        <CheckCircle2 style={{ width: 24, height: 24, color: 'var(--completed)' }} />
        <div>
          <span style={{ fontWeight: 600, color: 'var(--completed)' }}>AI Draft Ready</span>
          <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>Review and edit {drafts.length} task{drafts.length !== 1 ? 's' : ''} before saving</div>
        </div>
        <button
          onClick={() => setStep('input')}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <ArrowLeft style={{ width: 12, height: 12 }} /> Re-generate
        </button>
      </div>

      {warning && (
        <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--pending-bg)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--pending)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle style={{ width: 16, height: 16 }} /> {warning}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 24 }}>
        {drafts.map((draft, i) => {
          const draftErrors: Record<string, string> = {};
          if (errors[`${i}-title`]) draftErrors.title = errors[`${i}-title`];
          if (errors[`${i}-date`]) draftErrors.date = errors[`${i}-date`];

          return (
            <div key={i} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Task {i + 1}</h3>
                <button 
                  onClick={() => removeDraft(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--high)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Trash2 style={{ width: 14, height: 14 }} /> Remove
                </button>
              </div>
              
              <TaskFormFields
                data={{ ...draft, priority: draft.priority as Priority | '', workStatus: draft.workStatus as WorkStatus | '' }}
                onChange={(field, val) => handleDraftChange(i, field, val)}
                errors={draftErrors}
              />
            </div>
          );
        })}
      </div>

      {errors.submit && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--high-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--high)' }}>
          {errors.submit}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', justifyContent: 'flex-end', margin: '0 -24px -24px -24px', paddingRight: 24, paddingLeft: 24, paddingBottom: 24, background: 'var(--bg-elevated)', position: 'sticky', bottom: -24 }}>
        <button className="btn btn-ghost" onClick={onCancel} disabled={saving}>Discard All</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Saving {drafts.length} Tasks…</>
          ) : (
            <><Save style={{ width: 14, height: 14 }} /> Save {drafts.length} Task{drafts.length !== 1 ? 's' : ''}</>
          )}
        </button>
      </div>
    </div>
  );
}
