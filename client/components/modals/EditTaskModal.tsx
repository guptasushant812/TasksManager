'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Task, Priority, WorkStatus } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import { toIsoDate } from '@/lib/dates';
import TaskFormFields from './TaskFormFields';
import { normalizeGivenBy } from '@/lib/normalizeGivenBy';
import { X, Save, Sparkles, RefreshCw, Check, CloudCheck, CheckCircle2 } from 'lucide-react';
import { useAiDraft } from '@/hooks/useAiDraft';
import AiQuotaModal from './AiQuotaModal';
import { fetchTaskInstruction, saveTaskInstruction } from '@/lib/aiDraftService';

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSaved: (message?: string) => void;
}

export default function EditTaskModal({ task, onClose, onSaved }: EditTaskModalProps) {
  const initialData = useMemo(() => ({
    title: task.title || '',
    description: task.description || '',
    givenBy: task.givenBy || '',
    contactPerson: task.contactPerson || '',
    priority: (task.priority || '') as Priority | '',
    workStatus: (task.workStatus || '') as WorkStatus | '',
    reason: task.reason || '',
    remarks: task.remarks || '',
    inProgressReason: task.inProgressReason || (task.workStatus === 'InProgress' ? task.reason : '') || '',
    pendingReason: task.pendingReason || (task.workStatus === 'Pending' ? task.reason : '') || '',
    completedRemarks: task.completedRemarks || (task.workStatus === 'Completed' ? task.remarks : '') || '',
    date: toIsoDate(task.date),
    dueDate: task.dueDate ? toIsoDate(task.dueDate) : '',
  }), [task]);

  const [data, setData] = useState(initialData);

  const currentTaskIdRef = useRef(task._id);
  useEffect(() => {
    if (task._id !== currentTaskIdRef.current) {
      currentTaskIdRef.current = task._id;
      setData(initialData);
    }
  }, [task._id, initialData]);

  const isDirty = useMemo(() => {
    return (
      (data.title || '') !== initialData.title ||
      (data.description || '') !== initialData.description ||
      (data.givenBy || '') !== initialData.givenBy ||
      (data.contactPerson || '') !== initialData.contactPerson ||
      (data.priority || '') !== initialData.priority ||
      (data.workStatus || '') !== initialData.workStatus ||
      (data.date || '') !== initialData.date ||
      (data.dueDate || '') !== initialData.dueDate ||
      (data.inProgressReason || '') !== initialData.inProgressReason ||
      (data.pendingReason || '') !== initialData.pendingReason ||
      (data.completedRemarks || '') !== initialData.completedRemarks
    );
  }, [data, initialData]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { updateTask } = useTasks();

  const [isRegenOpen, setIsRegenOpen] = useState(false);
  const taskKey = task.taskId || task._id;
  const [regenInstruction, setRegenInstruction] = useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(`tasksmanager_regen_inst_${taskKey}`) || '';
  });
  const [isRestoringInstruction, setIsRestoringInstruction] = useState(true);
  const [instructionSyncStatus, setInstructionSyncStatus] = useState<'idle' | 'saving' | 'synced' | 'local_only'>('idle');
  const lastSavedInstructionRef = useRef<string>('');
  const saveInstructionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInstructionHydratedRef = useRef(false);

  useEffect(() => {
    const key = task.taskId || task._id;
    let active = true;
    setIsRestoringInstruction(true);
    isInstructionHydratedRef.current = false;

    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(`tasksmanager_regen_inst_${key}`) || '' : '';
    setRegenInstruction(cached);
    if (cached) {
      setInstructionSyncStatus('local_only');
    }

    fetchTaskInstruction(key)
      .then((cloudInstruction) => {
        if (!active) return;
        if (typeof cloudInstruction === 'string' && cloudInstruction) {
          setRegenInstruction(cloudInstruction);
          lastSavedInstructionRef.current = cloudInstruction;
          setInstructionSyncStatus('synced');
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`tasksmanager_regen_inst_${key}`, cloudInstruction);
          }
        } else {
          if (!cached) {
            setRegenInstruction('');
            lastSavedInstructionRef.current = '';
            setInstructionSyncStatus('idle');
          }
        }
      })
      .catch(() => {
        if (!active) return;
        if (!cached) setInstructionSyncStatus('idle');
      })
      .finally(() => {
        if (active) {
          setIsRestoringInstruction(false);
          isInstructionHydratedRef.current = true;
        }
      });

    return () => {
      active = false;
      if (saveInstructionTimerRef.current) {
        clearTimeout(saveInstructionTimerRef.current);
      }
    };
  }, [task.taskId, task._id]);

  useEffect(() => {
    if (!isInstructionHydratedRef.current || isRestoringInstruction) return;

    const key = task.taskId || task._id;
    const trimmed = regenInstruction.trim();

    if (!trimmed) {
      if (lastSavedInstructionRef.current) {
        saveTaskInstruction(key, '');
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(`tasksmanager_regen_inst_${key}`);
        }
        lastSavedInstructionRef.current = '';
      }
      setInstructionSyncStatus('idle');
      return;
    }

    if (trimmed === lastSavedInstructionRef.current) {
      return;
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`tasksmanager_regen_inst_${key}`, regenInstruction);
    }

    setInstructionSyncStatus('saving');
    if (saveInstructionTimerRef.current) {
      clearTimeout(saveInstructionTimerRef.current);
    }

    saveInstructionTimerRef.current = setTimeout(async () => {
      const saved = await saveTaskInstruction(key, trimmed);
      if (saved) {
        lastSavedInstructionRef.current = trimmed;
        setInstructionSyncStatus('synced');
      } else {
        setInstructionSyncStatus('local_only');
      }
    }, 700);

    return () => {
      if (saveInstructionTimerRef.current) {
        clearTimeout(saveInstructionTimerRef.current);
      }
    };
  }, [regenInstruction, task.taskId, task._id, isRestoringInstruction]);

  const instructionValidation = useMemo(() => {
    const trimmed = regenInstruction.trim();
    const charCount = trimmed.length;
    if (!trimmed) {
      return {
        isValid: false,
        wordCount: 0,
        charCount: 0,
        hint: 'Minimum 2 words required',
      };
    }
    const words = trimmed.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (wordCount < 2 || charCount < 5) {
      return {
        isValid: false,
        wordCount,
        charCount,
        hint: 'Minimum 2 words required (e.g. "Add attendance count")',
      };
    }

    return {
      isValid: true,
      wordCount,
      charCount,
      hint: `${wordCount} words (${charCount} characters)`,
    };
  }, [regenInstruction]);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const aiNoticeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const savingRef = useRef(saving);
  savingRef.current = saving;
  const showUpdateConfirmRef = useRef(showUpdateConfirm);
  showUpdateConfirmRef.current = showUpdateConfirm;
  const isRegenOpenRef = useRef(isRegenOpen);
  isRegenOpenRef.current = isRegenOpen;
  const isRegeneratingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !savingRef.current && !isRegeneratingRef.current) {
        if (isRegenOpenRef.current) {
          setIsRegenOpen(false);
        } else if (showUpdateConfirmRef.current) {
          setShowUpdateConfirm(false);
        } else {
          onCloseRef.current();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      if (aiNoticeTimeoutRef.current) clearTimeout(aiNoticeTimeoutRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const {
    regeneratingIndex,
    error: aiError,
    rateLimitInfo,
    selectedModel,
    customApiKey,
    updateSelectedModel,
    updateCustomApiKey,
    clearRateLimit,
    regenerateSingleDraft,
    setError: setAiError,
  } = useAiDraft();

  const isRegenerating = regeneratingIndex === 0;
  isRegeneratingRef.current = isRegenerating;
  const canRegenerate = instructionValidation.isValid && !isRegenerating;

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

  async function handleRegenerate(keyOverride?: string, providerOverride?: string) {
    if (!canRegenerate) return;
    const key = task.taskId || task._id;
    const trimmed = regenInstruction.trim();

    saveTaskInstruction(key, trimmed);
    lastSavedInstructionRef.current = trimmed;
    setInstructionSyncStatus('synced');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`tasksmanager_regen_inst_${key}`, trimmed);
    }

    const result = await regenerateSingleDraft(
      data,
      0,
      trimmed,
      data.description,
      keyOverride,
      providerOverride
    );
    if (result) {
      setData((prev) => ({
        ...prev,
        ...result,
        date: result.date ? toIsoDate(result.date) : prev.date,
        dueDate: result.dueDate ? toIsoDate(result.dueDate) : prev.dueDate,
      }));
      setIsRegenOpen(false);
      setAiNotice('AI suggestions applied');
      if (aiNoticeTimeoutRef.current) clearTimeout(aiNoticeTimeoutRef.current);
      aiNoticeTimeoutRef.current = setTimeout(() => {
        setAiNotice(null);
      }, 3000);
    }
  }

  function handleTriggerUpdate() {
    if (!isDirty || saving) return;
    if (!validate()) return;
    setShowUpdateConfirm(true);
  }

  async function handleSave() {
    setSaving(true);
    const status = (data.workStatus || 'Pending') as WorkStatus;
    const ipReason = data.inProgressReason !== undefined ? data.inProgressReason : (status === 'InProgress' ? data.reason : '');
    const pReason = data.pendingReason !== undefined ? data.pendingReason : (status === 'Pending' ? data.reason : '');
    const cRemarks = data.completedRemarks !== undefined ? data.completedRemarks : (status === 'Completed' ? data.remarks : '');

    try {
      await updateTask(task._id, {
        ...data,
        givenBy: normalizeGivenBy(data.givenBy),
        priority: (data.priority || 'Medium') as Priority,
        workStatus: status,
        inProgressReason: ipReason,
        pendingReason: pReason,
        completedRemarks: cRemarks,
        reason: status === 'InProgress' ? ipReason : status === 'Pending' ? pReason : '',
        remarks: status === 'Completed' ? cRemarks : '',
        date: new Date(data.date).toISOString(),
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      });

      const key = task.taskId || task._id;
      saveTaskInstruction(key, '');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`tasksmanager_regen_inst_${key}`);
      }
      setRegenInstruction('');
      lastSavedInstructionRef.current = '';
      setInstructionSyncStatus('idle');

      setShowUpdateConfirm(false);
      onSaved(`Task ${task.taskId} updated successfully`);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to update task' });
      setShowUpdateConfirm(false);
    } finally {
      setSaving(false);
    }
  }

  const renderUpdateConfirmModal = () => (
    <div
      className="app-dialog-overlay"
      style={{ zIndex: 1100 }}
      onClick={() => !saving && setShowUpdateConfirm(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-task-update-title"
    >
      <div 
        className="app-dialog-box animate-slide-up" 
        onClick={(e) => e.stopPropagation()} 
        style={{
          maxWidth: 420,
          width: 'min(420px, calc(100vw - 24px))',
          marginInline: 'clamp(12px, 3vw, 16px)',
          borderRadius: 14,
          overflow: 'hidden',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="app-dialog-accent-bar app-dialog-accent-success" style={{ height: 2.5 }} />
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
        }}>
          <h3
            id="confirm-task-update-title"
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Confirm Task Update?
          </h3>
          <button 
            type="button" 
            onClick={() => !saving && setShowUpdateConfirm(false)} 
            className="app-dialog-close-btn"
            aria-label="Close confirmation dialog"
            disabled={saving}
            style={{ padding: 4 }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
          <div
            className="app-dialog-card"
            style={{
              margin: 0,
              padding: '12px 14px',
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Task ID</span>
              <span style={{
                fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--accent, #10b981)',
                background: 'var(--accent-subtle, rgba(16, 185, 129, 0.12))',
                padding: '2px 8px',
                borderRadius: 4,
                letterSpacing: '0.02em',
              }}>
                {task.taskId}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', paddingTop: 1 }}>Title</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  textAlign: 'right',
                  maxWidth: '260px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={data.title}
              >
                {data.title}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 600,
                color: data.workStatus === 'Completed' ? '#34d399' : data.workStatus === 'InProgress' ? '#60a5fa' : '#fbbf24',
              }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: data.workStatus === 'Completed' ? '#34d399' : data.workStatus === 'InProgress' ? '#60a5fa' : '#fbbf24',
                  }}
                />
                {data.workStatus || 'Pending'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Priority</span>
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: data.priority === 'High' ? '#f43f5e' : data.priority === 'Medium' ? '#a78bfa' : '#38bdf8',
                background: data.priority === 'High' ? 'rgba(244, 63, 94, 0.12)' : data.priority === 'Medium' ? 'rgba(167, 139, 250, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                padding: '2px 8px',
                borderRadius: 4,
              }}>
                {data.priority || 'Medium'}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10,
          padding: '12px 20px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
        }}>
          <button 
            type="button" 
            className="app-dialog-btn-cancel" 
            onClick={() => setShowUpdateConfirm(false)}
            disabled={saving}
            style={{
              height: 38,
              minHeight: 38,
              padding: '0 16px',
              fontSize: 13,
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="app-dialog-btn-action" 
            style={{
              height: 38,
              minHeight: 38,
              padding: '0 18px',
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--accent, #10b981)',
              color: '#042416',
              borderRadius: 8,
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }} 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%' }} />
                <span>Saving…</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderRegenModal = () => (
    <div
      className="app-dialog-overlay"
      style={{ zIndex: 1100 }}
      onClick={() => !isRegenerating && setIsRegenOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="regen-dialog-title"
    >
      <div
        className="app-dialog-box animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 460,
          width: 'min(460px, calc(100vw - 24px))',
          marginInline: 'clamp(12px, 3vw, 16px)',
          borderRadius: 14,
          overflow: 'hidden',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="app-dialog-accent-bar app-dialog-accent-success" style={{ height: 2.5 }} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(16, 185, 129, 0.14)',
                color: 'var(--accent, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles style={{ width: 16, height: 16 }} />
            </div>
            <div>
              <h3
                id="regen-dialog-title"
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Regenerate with AI
              </h3>
              <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                {task.taskId}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {isRestoringInstruction ? (
              <span className="ai-sync-chip saving">
                <RefreshCw style={{ width: 11, height: 11, flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                Checking cloud draft…
              </span>
            ) : regenInstruction.trim().length > 0 ? (
              <span
                className={`ai-sync-chip ${instructionSyncStatus === 'saving' ? 'saving' : instructionSyncStatus === 'synced' ? 'synced' : 'local'}`}
                title={instructionSyncStatus === 'synced' ? 'Instruction synced across devices' : undefined}
              >
                {instructionSyncStatus === 'saving' ? (
                  <>
                    <RefreshCw style={{ width: 11, height: 11, flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                    Syncing to cloud…
                  </>
                ) : instructionSyncStatus === 'synced' ? (
                  <>
                    <CloudCheck style={{ width: 12, height: 12, flexShrink: 0 }} />
                    Synced across devices
                  </>
                ) : (
                  <>
                    <CheckCircle2 style={{ width: 11, height: 11, flexShrink: 0 }} />
                    Draft saved locally
                  </>
                )}
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => !isRegenerating && setIsRegenOpen(false)}
              className="app-dialog-close-btn"
              aria-label="Close regeneration dialog"
              disabled={isRegenerating}
              style={{ padding: 4 }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 20px', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <label
              htmlFor="regen-instruction-textarea"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Instructions or Guidance
            </label>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: instructionValidation.isValid ? 'var(--accent, #10b981)' : regenInstruction.trim() ? '#f59e0b' : 'var(--text-muted)',
                transition: 'color 0.15s ease',
              }}
            >
              {instructionValidation.hint}
            </span>
          </div>

          <textarea
            id="regen-instruction-textarea"
            value={regenInstruction}
            onChange={(e) => setRegenInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (canRegenerate) handleRegenerate();
              }
            }}
            placeholder="Please note add the point of counting, clarify next steps..."
            rows={4}
            className="input"
            style={{
              width: '100%',
              minHeight: 100,
              maxHeight: 220,
              fontSize: 13,
              lineHeight: 1.5,
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${regenInstruction.trim() && !instructionValidation.isValid ? 'rgba(245, 158, 11, 0.45)' : 'var(--border)'}`,
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              resize: 'vertical',
            }}
            disabled={isRegenerating}
            autoFocus
          />

          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            Tip: Press <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 10 }}>Ctrl</kbd> + <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 10 }}>Enter</kbd> to regenerate quickly.
          </p>

          {aiError && (
            <div
              style={{
                padding: '8px 12px',
                background: 'var(--high-bg)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--high)',
              }}
            >
              {aiError}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '12px 20px 16px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
          }}
        >
          <button
            type="button"
            className="app-dialog-btn-cancel"
            onClick={() => setIsRegenOpen(false)}
            disabled={isRegenerating}
            style={{
              height: 38,
              minHeight: 38,
              padding: '0 16px',
              fontSize: 13,
              borderRadius: 8,
              cursor: isRegenerating ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="app-dialog-btn-action"
            onClick={() => canRegenerate && handleRegenerate()}
            disabled={!canRegenerate}
            style={{
              height: 38,
              minHeight: 38,
              padding: '0 18px',
              fontSize: 13,
              fontWeight: 600,
              background: canRegenerate ? 'var(--accent, #10b981)' : 'var(--bg-hover, #242738)',
              color: canRegenerate ? '#042416' : 'var(--text-muted, #8b92a5)',
              borderRadius: 8,
              border: 'none',
              cursor: canRegenerate ? 'pointer' : 'not-allowed',
              opacity: canRegenerate ? 1 : 0.45,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
            title={!instructionValidation.isValid ? instructionValidation.hint : 'Regenerate with AI'}
          >
            {isRegenerating ? (
              <>
                <RefreshCw className="animate-spin" style={{ width: 14, height: 14 }} />
                <span>Regenerating…</span>
              </>
            ) : (
              <>
                <Sparkles style={{ width: 14, height: 14 }} />
                <span>Regenerate</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      {showUpdateConfirm && renderUpdateConfirmModal()}
      {isRegenOpen && renderRegenModal()}
      
      <div 
        className="modal-box animate-slide-up" 
        style={{ 
          maxWidth: 780, 
          width: 'min(780px, 96vw)', 
          maxHeight: 'min(92dvh, 880px)', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          padding: 0,
          margin: 'auto 0',
          marginInline: 0,
        }}
      >
        <div style={{ paddingBlock: 16, paddingInline: 'clamp(14px, 3.5vw, 24px)', borderBottom: 'var(--border-width-layout) solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', flexShrink: 0, gap: 12 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInlineEnd: 8, flexWrap: 'wrap', gap: 10, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Edit Task</h2>
                <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{task.taskId}</p>
              </div>
              {aiNotice && (
                <span className="animate-fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#34d399', background: 'rgba(16, 185, 129, 0.12)', padding: '3px 8px', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <Check style={{ width: 12, height: 12, strokeWidth: 2.5 }} />
                  {aiNotice}
                </span>
              )}
            </div>
            
            <div>
              <button
                type="button"
                onClick={() => setIsRegenOpen(true)}
                className="btn btn-ghost"
                style={{ 
                  fontSize: 12, 
                  color: 'var(--accent)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6,
                  padding: '6px 12px',
                  border: '1px dashed var(--accent)',
                  borderRadius: 6,
                  cursor: isRegenerating ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
                disabled={isRegenerating}
                title="Regenerate task fields with AI"
              >
                {isRegenerating ? (
                  <RefreshCw className="animate-spin" style={{ width: 14, height: 14 }} />
                ) : (
                  <Sparkles style={{ width: 14, height: 14 }} />
                )}
                <span>Regenerate with AI</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close edit task modal"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 6,
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div ref={contentScrollRef} className="modal-body-content" style={{ padding: '16px 24px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {rateLimitInfo && (
            <AiQuotaModal
              rateLimitInfo={rateLimitInfo}
              selectedModel={selectedModel}
              onSelectModel={updateSelectedModel}
              customApiKey={customApiKey}
              onSaveCustomKey={updateCustomApiKey}
              onRetry={(keyOverride, providerOverride) => {
                clearRateLimit();
                handleRegenerate(keyOverride, providerOverride);
              }}
              onClose={clearRateLimit}
            />
          )}

          {aiError && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--high-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--high)' }}>
              {aiError}
            </div>
          )}

          <div style={{ opacity: isRegenerating ? 0.6 : 1, transition: 'opacity 0.2s', pointerEvents: isRegenerating ? 'none' : 'auto' }}>
            <TaskFormFields data={data} onChange={handleChange} errors={errors} />
          </div>

          {errors.submit && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--high-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--high)' }}>
              {errors.submit}
            </div>
          )}
        </div>

        <div className="edit-task-modal-footer" style={{ padding: '14px 24px', borderTop: 'var(--border-width-layout) solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleTriggerUpdate}
            disabled={saving || !isDirty}
            title={!isDirty ? 'No changes made' : 'Update Task'}
          >
            {saving ? (
              <><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Saving…</>
            ) : (
              <><Save style={{ width: 14, height: 14 }} /> Update Task</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
