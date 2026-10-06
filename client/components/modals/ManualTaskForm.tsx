'use client';
import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAiDraft } from '@/hooks/useAiDraft';
import { toIsoDate } from '@/lib/dates';
import { Priority, WorkStatus, TaskFilters, TaskDraft } from '@/types/task';
import TaskFormFields from './TaskFormFields';
import {
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ManualTaskFormProps {
  defaultFilters: TaskFilters;
  onSaved: () => void;
  onCancel: () => void;
}

interface DraftTask extends TaskDraft {
  id: string;
}

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyDraft(defaultFilters?: TaskFilters): DraftTask {
  return {
    id: generateId(),
    title: '',
    description: '',
    givenBy: defaultFilters?.givenBy || '',
    contactPerson: '',
    priority: (defaultFilters?.priority as Priority) || 'Medium',
    workStatus: (defaultFilters?.status as WorkStatus) || 'Pending',
    reason: '',
    remarks: '',
    inProgressReason: '',
    pendingReason: '',
    completedRemarks: '',
    date: defaultFilters?.day ? toIsoDate(defaultFilters.day) : toIsoDate(new Date()),
    dueDate: '',
  };
}

export default function ManualTaskForm({ defaultFilters, onSaved, onCancel }: ManualTaskFormProps) {
  const [drafts, setDrafts] = useState<DraftTask[]>([createEmptyDraft(defaultFilters)]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Single-task AI refinement state
  const [activeRegenId, setActiveRegenId] = useState<string | null>(null);
  const [regenInstruction, setRegenInstruction] = useState('');
  const [justImprovedId, setJustImprovedId] = useState<string | null>(null);

  const { createTask } = useTasks();
  const {
    loading: aiLoading,
    regeneratingIndex,
    error: aiError,
    regenerateSingleDraft,
    setError: setAiError,
  } = useAiDraft();

  // ── Draft field change handler ─────────────────────────────────────────────
  function handleDraftChange(id: string, field: string, value: string) {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
    if (errors[`${id}-${field}`]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[`${id}-${field}`];
        return next;
      });
    }
  }

  // ── Add another task draft ─────────────────────────────────────────────────
  function handleAddAnotherTask() {
    setDrafts((prev) => [...prev, createEmptyDraft(defaultFilters)]);
  }

  // ── Remove individual task draft ───────────────────────────────────────────
  function handleRemoveDraft(id: string) {
    // Only allow remove when more than 1 task exists
    if (drafts.length <= 1) return;

    setDrafts((prev) => prev.filter((d) => d.id !== id));
    if (activeRegenId === id) {
      setActiveRegenId(null);
      setRegenInstruction('');
    }
  }

  // ── Discard all unsaved drafts ─────────────────────────────────────────────
  function handleConfirmDiscard() {
    setDrafts([createEmptyDraft(defaultFilters)]);
    setErrors({});
    setShowDiscardConfirm(false);
    setActiveRegenId(null);
    setRegenInstruction('');
    if (setAiError) setAiError(null);
    onCancel();
  }

  // ── Single-task AI improvement ─────────────────────────────────────────────
  async function handleImproveWithAi(draft: DraftTask, index: number) {
    // Check if task has meaningful user content
    if (!draft.title.trim() && !draft.description.trim()) {
      setErrors((prev) => ({
        ...prev,
        [`${draft.id}-ai`]: 'Enter a title or description first before improving with AI.',
      }));
      return;
    }

    if (errors[`${draft.id}-ai`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`${draft.id}-ai`];
        return next;
      });
    }

    const result = await regenerateSingleDraft(draft, index, regenInstruction);
    if (result) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === draft.id
            ? {
                ...d,
                title: result.title || d.title,
                description: result.description || d.description,
                givenBy: result.givenBy || d.givenBy,
                contactPerson: result.contactPerson || d.contactPerson,
                priority: (result.priority as Priority) || d.priority,
                workStatus: (result.workStatus as WorkStatus) || d.workStatus,
                reason: result.reason !== undefined ? result.reason : d.reason,
                remarks: result.remarks !== undefined ? result.remarks : d.remarks,
                date: result.date || d.date,
                dueDate: result.dueDate || d.dueDate,
              }
            : d
        )
      );
      setActiveRegenId(null);
      setRegenInstruction('');
      setJustImprovedId(draft.id);
      setTimeout(() => {
        setJustImprovedId((prev) => (prev === draft.id ? null : prev));
      }, 3500);
    }
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validateDrafts(): boolean {
    const errs: Record<string, string> = {};
    drafts.forEach((d, i) => {
      if (!d.title.trim()) {
        errs[`${d.id}-title`] = `Task ${i + 1}: Title is required`;
      }
      if (!d.date) {
        errs[`${d.id}-date`] = `Task ${i + 1}: Date is required`;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Save all tasks ─────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (drafts.length === 0 || !validateDrafts()) return;
    setSaving(true);
    try {
      for (const d of drafts) {
        await createTask({
          ...d,
          priority: (d.priority || 'Medium') as Priority,
          workStatus: (d.workStatus || 'Pending') as WorkStatus,
          inProgressReason: d.inProgressReason || (d.workStatus === 'InProgress' ? d.reason : ''),
          pendingReason: d.pendingReason || (d.workStatus === 'Pending' ? d.reason : ''),
          completedRemarks: d.completedRemarks || (d.workStatus === 'Completed' ? d.remarks : ''),
          date: d.date ? new Date(d.date).toISOString() : new Date().toISOString(),
          dueDate: d.dueDate ? new Date(d.dueDate).toISOString() : undefined,
          userId: null,
        });
      }
      onSaved();
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to save tasks' });
    } finally {
      setSaving(false);
    }
  }

  const hasDirtyContent = drafts.some(
    (d) => d.title.trim().length > 0 || d.description.trim().length > 0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1, overflow: 'hidden' }}>
      {/* ── Discard Confirmation Modal Overlay ─────────────────────────────────── */}
      {showDiscardConfirm && (
        <div
          className="app-dialog-overlay"
          onClick={() => setShowDiscardConfirm(false)}
        >
          <div
            className="app-dialog-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <div className="app-dialog-accent-bar app-dialog-accent-danger" />

            <div className="app-dialog-header">
              <div className="app-dialog-header-left">
                <div className="app-dialog-icon-wrap app-dialog-icon-danger">
                  <AlertTriangle style={{ width: 22, height: 22 }} />
                </div>
                <div>
                  <div className="app-dialog-eyebrow app-dialog-eyebrow-danger">
                    Warning
                  </div>
                  <h3 className="app-dialog-title">Discard Unsaved Tasks?</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="app-dialog-close-btn"
                aria-label="Close"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="app-dialog-body">
              <p className="app-dialog-desc" style={{ marginBottom: 0 }}>
                {drafts.length > 1
                  ? `Are you sure you want to discard all ${drafts.length} unsaved task drafts? All entered content will be lost.`
                  : 'Are you sure you want to discard this unsaved task? All entered content will be lost.'}
              </p>
            </div>

            <div className="app-dialog-footer">
              <button
                type="button"
                className="app-dialog-btn-cancel"
                onClick={() => setShowDiscardConfirm(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className="app-dialog-btn-action app-dialog-btn-danger"
                onClick={handleConfirmDiscard}
              >
                Yes, Discard All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Scrollable Form Body (The ONLY scrollable element) ───────────────── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Global AI Error Banner */}
        {aiError && (
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--high-bg)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              color: 'var(--high)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{aiError}</span>
          </div>
        )}

        {/* ── Task Drafts List ─────────────────────────────────────────────────── */}
        {drafts.map((draft, i) => {
          const draftErrors: Record<string, string> = {};
          if (errors[`${draft.id}-title`]) draftErrors.title = errors[`${draft.id}-title`];
          if (errors[`${draft.id}-date`]) draftErrors.date = errors[`${draft.id}-date`];

          const isThisRegenerating = regeneratingIndex === i;
          const isRegenBoxOpen = activeRegenId === draft.id;
          const wasJustImproved = justImprovedId === draft.id;

          return (
            <div
              key={draft.id}
              className="card animate-fade-in"
              style={{
                padding: '16px 18px',
                position: 'relative',
                borderTop: '1px solid var(--accent)', // Clean green divider line matching Image 2
                borderLeft: isThisRegenerating ? '2px solid var(--accent)' : wasJustImproved ? '2px solid var(--completed)' : undefined,
                transition: 'border 0.2s ease',
              }}
            >
              {/* Card Header matching Image 2 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13.5,
                      fontWeight: 900,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    TASK {i + 1}
                  </h3>

                  {wasJustImproved && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        background: 'var(--completed-bg)',
                        color: 'var(--completed)',
                        padding: '2px 8px',
                        borderRadius: 9999,
                        border: '1px solid var(--completed)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <CheckCircle2 style={{ width: 11, height: 11 }} /> Improved!
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Single-Task Regenerate / Improve with AI Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isRegenBoxOpen) {
                        setActiveRegenId(null);
                        setRegenInstruction('');
                      } else {
                        setActiveRegenId(draft.id);
                        setRegenInstruction('');
                      }
                    }}
                    disabled={isThisRegenerating || saving}
                    style={{
                      background: isRegenBoxOpen ? 'var(--accent-subtle)' : 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm, 4px)',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      color: 'var(--accent)',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                    title="Improve or refine this task using AI"
                  >
                    <RefreshCw
                      style={{
                        width: 12,
                        height: 12,
                        animation: isThisRegenerating ? 'spin 1s linear infinite' : 'none',
                      }}
                    />
                    <span>{isThisRegenerating ? 'Improving…' : 'Regenerate'}</span>
                  </button>

                  {/* Remove Task Button (ONLY shown when drafts.length > 1) */}
                  {drafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDraft(draft.id)}
                      disabled={isThisRegenerating || saving}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--high)',
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 6px',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'opacity 0.15s ease',
                      }}
                      title={`Remove Task ${i + 1}`}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inline AI Guidance Error */}
              {errors[`${draft.id}-ai`] && (
                <div
                  style={{
                    marginBottom: 14,
                    padding: '8px 12px',
                    background: 'var(--high-bg)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    color: 'var(--high)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertCircle style={{ width: 13, height: 13 }} />
                  <span>{errors[`${draft.id}-ai`]}</span>
                </div>
              )}

              {/* Inline Single-Task Refinement Box */}
              {isRegenBoxOpen && (
                <div
                  style={{
                    padding: 14,
                    marginBottom: 18,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--accent)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Sparkles style={{ width: 13, height: 13 }} /> Improve Task {i + 1} with AI
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveRegenId(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>

                  <input
                    type="text"
                    className="input"
                    placeholder="Optional instruction: e.g., 'Make title punchier', 'Add action items'..."
                    value={regenInstruction}
                    onChange={(e) => setRegenInstruction(e.target.value)}
                    style={{ fontSize: 12, padding: '8px 10px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleImproveWithAi(draft, i);
                      }
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => setActiveRegenId(null)}
                      disabled={isThisRegenerating}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '4px 14px', fontSize: 12, background: 'var(--accent)' }}
                      onClick={() => handleImproveWithAi(draft, i)}
                      disabled={isThisRegenerating}
                    >
                      {isThisRegenerating ? (
                        <><div className="animate-spin" style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Improving…</>
                      ) : (
                        <><Sparkles style={{ width: 12, height: 12 }} /> Improve This Task</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Form Fields for this Draft */}
              <div
                style={{
                  opacity: isThisRegenerating ? 0.45 : 1,
                  pointerEvents: isThisRegenerating ? 'none' : 'auto',
                  transition: 'opacity 0.2s ease',
                }}
              >
                <TaskFormFields
                  data={{
                    ...draft,
                    priority: draft.priority as Priority | '',
                    workStatus: draft.workStatus as WorkStatus | '',
                  }}
                  onChange={(field, val) => handleDraftChange(draft.id, field, val)}
                  errors={draftErrors}
                />
              </div>
            </div>
          );
        })}

        {/* ── Add Another Task Button matching Image 1 ────────────────────────── */}
        <button
          type="button"
          onClick={handleAddAnotherTask}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: 'var(--bg-surface)',
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.04em',
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Plus style={{ width: 16, height: 16 }} /> Add Another Task
        </button>

      {errors.submit && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            background: 'var(--high-bg)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--high)',
          }}
        >
          {errors.submit}
        </div>
      )}

      </div>

      {/* ── Fixed Bottom Actions Bar ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle)',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-elevated)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={saving || regeneratingIndex !== null}
          >
            Cancel
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {(drafts.length > 1 || hasDirtyContent) && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowDiscardConfirm(true)}
              disabled={saving || regeneratingIndex !== null}
              style={{ color: 'var(--high)' }}
            >
              Discard All
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving || regeneratingIndex !== null}
          >
            {saving ? (
              <>
                <div
                  className="animate-spin"
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                  }}
                />
                <span>Saving {drafts.length > 1 ? `${drafts.length} Tasks` : 'Task'}…</span>
              </>
            ) : (
              <>
                <Save style={{ width: 14, height: 14 }} />
                <span>Save {drafts.length > 1 ? `${drafts.length} Tasks` : 'Task'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
