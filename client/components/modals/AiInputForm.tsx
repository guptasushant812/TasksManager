'use client';
import { useState, useEffect } from 'react';
import { useAiDraft } from '@/hooks/useAiDraft';
import { useTasks } from '@/hooks/useTasks';
import { TaskDraft, Priority, WorkStatus } from '@/types/task';
import TaskFormFields from './TaskFormFields';
import { 
  Sparkles, AlertCircle, CheckCircle2, Trash2, ArrowLeft, 
  Save, RefreshCw, X, AlertTriangle, Plus 
} from 'lucide-react';

const STORAGE_KEY = 'tasksmanager_ai_draft_state_v1';

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

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
  const [isHydrated, setIsHydrated] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Single-task regeneration state
  const [activeRegenIndex, setActiveRegenIndex] = useState<number | null>(null);
  const [regenInstruction, setRegenInstruction] = useState('');
  const [justRegeneratedIndex, setJustRegeneratedIndex] = useState<number | null>(null);

  const { 
    loading: aiLoading, 
    regeneratingIndex, 
    error: aiError, 
    warning, 
    generateDrafts, 
    regenerateSingleDraft,
    setError: setAiError
  } = useAiDraft();

  const { createTask } = useTasks();

  // ── 1. Restore draft from localStorage on mount ────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.rawText === 'string') {
            setRawText(parsed.rawText);
          }
          if (Array.isArray(parsed.drafts) && parsed.drafts.length > 0) {
            setDrafts(parsed.drafts.map((d: any) => ({ ...d, id: d.id || generateId() })));
            setStep('preview');
          } else if (parsed.step === 'input' || parsed.step === 'preview') {
            setStep(parsed.step);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load AI draft from localStorage:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // ── 2. Persist draft to localStorage on any state change ──────────────────
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (!rawText.trim() && drafts.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          step,
          rawText,
          drafts,
          updatedAt: Date.now()
        }));
      }
    } catch (e) {
      console.error('Failed to persist AI draft to localStorage:', e);
    }
  }, [step, rawText, drafts, isHydrated]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!rawText.trim()) {
      setErrors({ rawText: 'Describe your task first.' });
      return;
    }
    setErrors({});
    const result = await generateDrafts(rawText);
    if (result && result.length > 0) {
      setDrafts(result.map(d => ({ ...d, id: d.id || generateId() })));
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
      // Successfully saved: clean up draft storage
      localStorage.removeItem(STORAGE_KEY);
      onSaved();
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to save tasks' });
    } finally {
      setSaving(false);
    }
  }

  function removeDraft(index: number) {
    setDrafts(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setStep('input');
      }
      return updated;
    });
    if (activeRegenIndex === index) {
      setActiveRegenIndex(null);
      setRegenInstruction('');
    }
  }

  function handleAddNewTaskManually() {
    const today = new Date().toISOString().split('T')[0];
    setDrafts(prev => [
      ...prev,
      {
        id: generateId(),
        title: '',
        description: '',
        givenBy: '',
        contactPerson: '',
        priority: 'Medium',
        workStatus: 'Pending',
        reason: '',
        remarks: '',
        inProgressReason: '',
        pendingReason: '',
        completedRemarks: '',
        date: today,
        dueDate: '',
      }
    ]);
  }

  function handleDiscard() {
    localStorage.removeItem(STORAGE_KEY);
    setRawText('');
    setDrafts([]);
    setStep('input');
    setErrors({});
    setShowDiscardConfirm(false);
    setActiveRegenIndex(null);
    setRegenInstruction('');
  }

  // ── Single Task Regeneration ──────────────────────────────────────────────
  async function handleConfirmRegen(index: number) {
    const task = drafts[index];
    if (!task) return;

    const result = await regenerateSingleDraft(task, index, regenInstruction, rawText);
    if (result) {
      setDrafts(prev => {
        const next = [...prev];
        next[index] = { ...result, id: task.id || generateId() };
        return next;
      });
      setActiveRegenIndex(null);
      setRegenInstruction('');
      setJustRegeneratedIndex(index);
      setTimeout(() => {
        setJustRegeneratedIndex(prev => prev === index ? null : prev);
      }, 3500);
    }
  }

  // ── Discard Confirmation Modal Overlay ───────────────────────────────────
  const renderDiscardModal = () => (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(2px)', zIndex: 50, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div className="card animate-scale-in" style={{
        maxWidth: 400, width: '100%', background: 'var(--bg-elevated)',
        border: '2px solid var(--high)', padding: 20, boxShadow: 'var(--box-shadow-brutalist)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--high)', marginBottom: 12 }}>
          <AlertTriangle style={{ width: 22, height: 22 }} />
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Discard this draft?</h4>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 18 }}>
          {step === 'preview' 
            ? `Any unsaved changes across ${drafts.length} generated task${drafts.length !== 1 ? 's' : ''} will be permanently removed.` 
            : 'Your entered task description text will be permanently cleared.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={() => setShowDiscardConfirm(false)}
          >
            Keep Draft
          </button>
          <button 
            type="button" 
            className="btn" 
            style={{ background: 'var(--high)', color: '#fff' }} 
            onClick={handleDiscard}
          >
            Yes, Discard
          </button>
        </div>
      </div>
    </div>
  );

  // ── Step 1: Raw text input ───────────────────────────────────────────────
  if (step === 'input') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {showDiscardConfirm && renderDiscardModal()}

        <div style={{
          padding: '16px', marginBottom: 16,
          background: 'var(--accent-subtle)', border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 'var(--radius-lg)', fontSize: 13, color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <strong style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Sparkles style={{ width: 14, height: 14 }} /> AI Task Structuring
            </strong>
            {rawText.trim().length > 0 && (
              <span style={{ fontSize: 11, color: 'var(--completed)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 style={{ width: 12, height: 12 }} /> Draft saved locally
              </span>
            )}
          </div>
          Describe tasks in plain English, Marathi, or Hinglish. AI will organize the fields for you.
        </div>

        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="label" htmlFor="ai-raw-input" style={{ margin: 0 }}>Describe your task(s)</label>
            {rawText.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(true)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--high)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <Trash2 style={{ width: 12, height: 12 }} /> Discard draft
              </button>
            )}
          </div>

          <textarea
            id="ai-raw-input"
            className="input"
            placeholder={`Examples (English, Marathi, or Hinglish):

1. HOD sir ni sangitla exam timetable tayar karaycha aahe. Subtasks: a) batch count b) room allocation. Aaj submit kela.
2. Follow up with IT floor router repair sathi. Pending aahe karan technician udya yenar.
3. Attach 2 notices to Department Communication ISO File — given by Sachin Oak sir, date 10-07-2026.`}
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

        <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', justifyContent: 'space-between', alignItems: 'center', margin: '24px -24px -24px -24px', paddingRight: 24, paddingLeft: 24, paddingBottom: 24, background: 'var(--bg-surface)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Closing will preserve your draft automatically.
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={onCancel} disabled={aiLoading}>
              Close
            </button>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={aiLoading} style={{ background: 'var(--accent)' }}>
              {aiLoading ? (
                <><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Structuring…</>
              ) : (
                <><Sparkles style={{ width: 14, height: 14 }} /> Structure with AI</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Editable preview ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {showDiscardConfirm && renderDiscardModal()}

      {/* Top Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px', marginBottom: 20,
        background: 'var(--completed-bg)', border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: 'var(--radius-lg)', fontSize: 13,
      }}>
        <CheckCircle2 style={{ width: 24, height: 24, color: 'var(--completed)', flexShrink: 0 }} />
        <div>
          <span style={{ fontWeight: 600, color: 'var(--completed)' }}>Tasks Ready</span>
          <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
            Review or edit details before saving.
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setStep('input')}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm, 6px)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-elevated)';
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            title="Edit the original raw prompt"
          >
            <ArrowLeft style={{ width: 13, height: 13 }} /> Edit Prompt
          </button>
          <button
            type="button"
            onClick={() => setShowDiscardConfirm(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--high)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4
            }}
            title="Discard this entire draft"
          >
            <Trash2 style={{ width: 12, height: 12 }} /> Discard All
          </button>
        </div>
      </div>

      {warning && (
        <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--pending-bg)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--pending)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle style={{ width: 16, height: 16 }} /> {warning}
        </div>
      )}

      {aiError && (
        <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--high-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--high)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle style={{ width: 16, height: 16 }} /> {aiError}
        </div>
      )}

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 24 }}>
        {drafts.map((draft, i) => {
          const draftErrors: Record<string, string> = {};
          if (errors[`${i}-title`]) draftErrors.title = errors[`${i}-title`];
          if (errors[`${i}-date`]) draftErrors.date = errors[`${i}-date`];

          const isThisRegenerating = regeneratingIndex === i;
          const isRegenBoxOpen = activeRegenIndex === i;
          const wasJustRegenerated = justRegeneratedIndex === i;

          return (
            <div 
              key={draft.id || i} 
              className="card animate-fade-in" 
              style={{ 
                padding: 20, 
                position: 'relative',
                borderTop: '1px solid var(--accent)', // Clean green divider line matching Image 2
                borderLeft: isThisRegenerating ? '2px solid var(--accent)' : wasJustRegenerated ? '2px solid var(--completed)' : undefined,
                transition: 'border 0.2s ease'
              }}
            >
              {/* Card Header matching Image 2 */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 16,
                  paddingBottom: 10,
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
                      margin: 0 
                    }}
                  >
                    TASK {i + 1}
                  </h3>
                  {wasJustRegenerated && (
                    <span style={{
                      fontSize: 11, 
                      fontWeight: 800, 
                      background: 'var(--completed-bg)',
                      color: 'var(--completed)', 
                      padding: '2px 8px', 
                      borderRadius: 9999,
                      border: '1px solid var(--completed)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <CheckCircle2 style={{ width: 11, height: 11 }} /> Regenerated!
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Single-Task Regenerate Button matching Image 2 */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isRegenBoxOpen) {
                        setActiveRegenIndex(null);
                        setRegenInstruction('');
                      } else {
                        setActiveRegenIndex(i);
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
                      transition: 'all 0.15s ease'
                    }}
                    title="Regenerate only this specific task with AI"
                  >
                    <RefreshCw style={{ width: 12, height: 12, animation: isThisRegenerating ? 'spin 1s linear infinite' : 'none' }} />
                    <span>{isThisRegenerating ? 'Regenerating…' : 'Regenerate'}</span>
                  </button>

                  {/* Remove Task Button (ONLY shown when drafts.length > 1) */}
                  {drafts.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeDraft(i)}
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
                        transition: 'opacity 0.15s ease'
                      }}
                      title={`Remove Task ${i + 1}`}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Single-Task Refinement Box */}
              {isRegenBoxOpen && (
                <div style={{
                  padding: 14, marginBottom: 18,
                  background: 'var(--bg-elevated)', border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 10
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles style={{ width: 13, height: 13 }} /> Refine Task {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveRegenIndex(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    className="input"
                    placeholder="Optional instruction: e.g., 'Make title punchier', 'Pending on Dean signature'..."
                    value={regenInstruction}
                    onChange={(e) => setRegenInstruction(e.target.value)}
                    style={{ fontSize: 12, padding: '8px 10px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmRegen(i);
                      }
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => setActiveRegenIndex(null)}
                      disabled={isThisRegenerating}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '4px 12px', fontSize: 12, background: 'var(--accent)' }}
                      onClick={() => handleConfirmRegen(i)}
                      disabled={isThisRegenerating}
                    >
                      {isThisRegenerating ? 'Regenerating…' : 'Improve This Task'}
                    </button>
                  </div>
                </div>
              )}

              {/* Form Fields for this Draft */}
              <div style={{ opacity: isThisRegenerating ? 0.4 : 1, pointerEvents: isThisRegenerating ? 'none' : 'auto', transition: 'opacity 0.2s ease' }}>
                <TaskFormFields
                  data={{ ...draft, priority: draft.priority as Priority | '', workStatus: draft.workStatus as WorkStatus | '' }}
                  onChange={(field, val) => handleDraftChange(i, field, val)}
                  errors={draftErrors}
                />
              </div>
            </div>
          );
        })}

        {/* Add Another Task Button matching Image 1 */}
        <button
          type="button"
          onClick={handleAddNewTaskManually}
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
            transition: 'all 0.15s ease'
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
          <Plus style={{ width: 15, height: 15 }} /> Add Another Task
        </button>
      </div>

      {errors.submit && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--high-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--high)' }}>
          {errors.submit}
        </div>
      )}

      {/* Sticky Bottom Actions Bar */}
      <div style={{
        display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 16,
        borderTop: '1px solid var(--border-subtle)', justifyContent: 'space-between',
        alignItems: 'center', margin: '0 -24px -24px -24px', paddingRight: 24,
        paddingLeft: 24, paddingBottom: 24, background: 'var(--bg-elevated)',
        position: 'sticky', bottom: -24, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={onCancel} 
            disabled={saving || regeneratingIndex !== null}
            title="Close modal without losing your draft"
          >
            Close
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={() => setShowDiscardConfirm(true)} 
            disabled={saving || regeneratingIndex !== null}
            style={{ color: 'var(--high)' }}
          >
            Discard
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving || regeneratingIndex !== null}
          >
            {saving ? (
              <><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Saving {drafts.length} Tasks…</>
            ) : (
              <><Save style={{ width: 14, height: 14 }} /> Save {drafts.length} Task{drafts.length !== 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

