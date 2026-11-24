'use client';
import { useState, useEffect, useRef } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAiDraft } from '@/hooks/useAiDraft';
import { toIsoDate } from '@/lib/dates';
import { Priority, WorkStatus, TaskFilters, TaskDraft } from '@/types/task';
import TaskFormFields from './TaskFormFields';
import { normalizeGivenBy } from '@/lib/normalizeGivenBy';
import { validateSingleField, validateTaskForm } from '@/lib/taskValidation';
import {
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  X,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { fetchManualDraftState, saveManualDraftState, deleteManualDraftState } from '@/lib/aiDraftService';

export type SyncStatus = 'idle' | 'saving' | 'synced' | 'local_only';

interface ManualTaskFormProps {
  defaultFilters: TaskFilters;
  onSaved: () => void;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSyncStatusChange?: (status: SyncStatus, isRestoring: boolean) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
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

function isDraftDirty(d: DraftTask, defaultFilters?: TaskFilters): boolean {
  const defaultDate = defaultFilters?.day ? toIsoDate(defaultFilters.day) : toIsoDate(new Date());
  const defaultPriority = (defaultFilters?.priority as Priority) || 'Medium';
  const defaultStatus = (defaultFilters?.status as WorkStatus) || 'Pending';
  const defaultGivenBy = (defaultFilters?.givenBy || '').trim();

  if (d.title.trim().length > 0) return true;
  if (d.description.trim().length > 0) return true;
  if (d.contactPerson.trim().length > 0) return true;
  if ((d.givenBy || '').trim() !== defaultGivenBy) return true;
  if (d.priority && d.priority !== defaultPriority) return true;
  if (d.workStatus && d.workStatus !== defaultStatus) return true;
  if (d.dueDate && d.dueDate.trim().length > 0) return true;
  if (d.date && d.date !== defaultDate) return true;
  if (
    (d.inProgressReason && d.inProgressReason.trim().length > 0) ||
    (d.pendingReason && d.pendingReason.trim().length > 0) ||
    (d.completedRemarks && d.completedRemarks.trim().length > 0) ||
    (d.reason && d.reason.trim().length > 0) ||
    (d.remarks && d.remarks.trim().length > 0)
  ) {
    return true;
  }
  return false;
}

export default function ManualTaskForm({ defaultFilters, onSaved, onCancel, onDirtyChange, onSyncStatusChange, onProcessingChange }: ManualTaskFormProps) {
  const [drafts, setDrafts] = useState<DraftTask[]>([createEmptyDraft(defaultFilters)]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [isRestoring, setIsRestoring] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPayloadRef = useRef<string>('');
  const isDeletingRef = useRef(false);

  const [activeRegenId, setActiveRegenId] = useState<string | null>(null);
  const [regenInstruction, setRegenInstruction] = useState('');
  const [justImprovedId, setJustImprovedId] = useState<string | null>(null);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    cancelText: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  const { createTask } = useTasks();
  const {
    loading: aiLoading,
    regeneratingIndex,
    error: aiError,
    regenerateSingleDraft,
    setError: setAiError,
  } = useAiDraft();

  const isDirty = drafts.length > 1 || drafts.some((d) => isDraftDirty(d, defaultFilters));
  const isProcessing = saving || regeneratingIndex !== null;
  const firstIncompleteIndex = drafts.findIndex((d) => Object.keys(validateTaskForm(d)).length > 0);
  const canAddAnother = firstIncompleteIndex === -1;
  const incompleteTaskNum = firstIncompleteIndex !== -1 ? firstIncompleteIndex + 1 : 1;

  useEffect(() => {
    onProcessingChange?.(isProcessing);
    return () => {
      onProcessingChange?.(false);
    };
  }, [isProcessing, onProcessingChange]);

  useEffect(() => {
    let isMounted = true;
    setIsRestoring(true);

    fetchManualDraftState()
      .then((res) => {
        if (!isMounted || isDeletingRef.current) return;
        const manualDrafts = res?.drafts;

        if (Array.isArray(manualDrafts) && manualDrafts.length > 0) {
          const restoredDrafts: DraftTask[] = manualDrafts.map((d: any) => ({
            id: d.id || generateId(),
            title: d.title || '',
            description: d.description || '',
            givenBy: d.givenBy || defaultFilters?.givenBy || '',
            contactPerson: d.contactPerson || '',
            priority: (d.priority as Priority) || 'Medium',
            workStatus: (d.workStatus as WorkStatus) || 'Pending',
            reason: d.reason || '',
            remarks: d.remarks || '',
            pendingReason: d.pendingReason || '',
            inProgressReason: d.inProgressReason || '',
            completedRemarks: d.completedRemarks || '',
            date: d.date || (defaultFilters?.day ? toIsoDate(defaultFilters.day) : toIsoDate(new Date())),
            dueDate: d.dueDate || '',
          }));

          setDrafts(restoredDrafts);
          lastSavedPayloadRef.current = JSON.stringify(restoredDrafts.map(({ id, ...rest }) => rest));
          setSyncStatus('synced');
        } else {
          setSyncStatus('idle');
        }
      })
      .catch((e) => {
        console.error('Failed to load manual draft from cloud:', e);
      })
      .finally(() => {
        if (isMounted) {
          setIsRestoring(false);
          setIsHydrated(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || isRestoring || isDeletingRef.current) return;

    if (!isDirty) {
      deleteManualDraftState();
      lastSavedPayloadRef.current = '';
      setSyncStatus('idle');
      return;
    }

    const cleanDrafts = drafts.map(({ id, ...rest }) => rest);
    const currentPayload = JSON.stringify(cleanDrafts);
    if (currentPayload === lastSavedPayloadRef.current) {
      return;
    }

    setSyncStatus('saving');
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(async () => {
      if (isDeletingRef.current) return;
      const success = await saveManualDraftState(cleanDrafts as TaskDraft[]);
      if (success) {
        lastSavedPayloadRef.current = currentPayload;
        setSyncStatus('synced');
      } else {
        setSyncStatus('local_only');
      }
    }, 700);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [drafts, isDirty, isHydrated, isRestoring]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => {
      onDirtyChange?.(false);
    };
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    onSyncStatusChange?.(syncStatus, isRestoring);
  }, [syncStatus, isRestoring, onSyncStatusChange]);

  function handleDraftChange(id: string, field: string, value: string) {
    if (field === 'dueDate') {
      const currentDraft = drafts.find((d) => d.id === id);
      if (value && currentDraft?.date && value < currentDraft.date) {
        setDrafts((prev) =>
          prev.map((d) => (d.id === id ? { ...d, dueDate: '' } : d))
        );
        setErrors((prev) => ({
          ...prev,
          [`${id}-dueDate`]: 'Cannot be before task date',
        }));
        return;
      }
    }
    if (field === 'date') {
      const currentDraft = drafts.find((d) => d.id === id);
      if (value && currentDraft?.dueDate && currentDraft.dueDate < value) {
        setDrafts((prev) =>
          prev.map((d) => (d.id === id ? { ...d, date: value, dueDate: '' } : d))
        );
        setErrors((prev) => ({
          ...prev,
          [`${id}-dueDate`]: 'Cannot be before task date',
        }));
        return;
      }
    }

    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );

    const currentDraft = drafts.find((d) => d.id === id);
    const updatedDraft = currentDraft ? { ...currentDraft, [field]: value } : { [field]: value };
    const fieldErr = validateSingleField(field, value, updatedDraft as any);

    setErrors((prev) => {
      const next = { ...prev };
      if (fieldErr) {
        next[`${id}-${field}`] = fieldErr;
        if (field === 'pendingReason' && updatedDraft.workStatus === 'Pending') next[`${id}-reason`] = fieldErr;
        if (field === 'inProgressReason' && updatedDraft.workStatus === 'InProgress') next[`${id}-reason`] = fieldErr;
        if (field === 'completedRemarks' && updatedDraft.workStatus === 'Completed') next[`${id}-remarks`] = fieldErr;
      } else {
        delete next[`${id}-${field}`];
        if (field === 'pendingReason') delete next[`${id}-reason`];
        if (field === 'inProgressReason') delete next[`${id}-reason`];
        if (field === 'completedRemarks') delete next[`${id}-remarks`];
      }
      if (field === 'dueDate' && !fieldErr) {
        delete next[`${id}-dueDate`];
      }
      if (field === 'date' && (!updatedDraft.dueDate || (value && updatedDraft.dueDate >= value))) {
        delete next[`${id}-dueDate`];
      }
      return next;
    });
  }

  useEffect(() => {
    if (drafts.length <= 1 && isSelectMode) {
      setIsSelectMode(false);
      setSelectedTaskIds(new Set());
    }
  }, [drafts.length, isSelectMode]);

  function handleAddAnotherTask() {
    if (!canAddAnother) return;
    setDrafts((prev) => [...prev, createEmptyDraft(defaultFilters)]);
  }

  function handleDiscardClick() {
    if (drafts.length === 1) {
      setConfirmDialog({
        isOpen: true,
        title: 'Discard this draft?',
        description: 'All unsaved details you entered in this form will be permanently cleared.',
        cancelText: 'Keep Draft',
        confirmText: 'Yes, Discard',
        onConfirm: () => {
          isDeletingRef.current = true;
          deleteManualDraftState();
          setDrafts([createEmptyDraft(defaultFilters)]);
          setErrors({});
          setActiveRegenId(null);
          setRegenInstruction('');
          setSyncStatus('idle');
          lastSavedPayloadRef.current = '';
          setTimeout(() => {
            isDeletingRef.current = false;
          }, 500);
        },
      });
    } else {
      setIsSelectMode(true);
      setSelectedTaskIds(new Set());
    }
  }

  function handlePromptDiscardSelected() {
    const count = selectedTaskIds.size;
    if (count === 0) return;

    const isAll = count === drafts.length;

    setConfirmDialog({
      isOpen: true,
      title: isAll
        ? 'Discard all drafts?'
        : count === 1
        ? 'Discard selected task?'
        : `Discard ${count} selected tasks?`,
      description: isAll
        ? 'All unsaved tasks and entered details will be cleared and reset.'
        : count === 1
        ? 'The selected task and its entered details will be removed from your list.'
        : `The ${count} selected tasks and their entered details will be removed from your list.`,
      cancelText: count === 1 ? 'Keep Task' : 'Keep Tasks',
      confirmText: 'Yes, Discard',
      onConfirm: () => {
        if (isAll) {
          isDeletingRef.current = true;
          deleteManualDraftState();
          setDrafts([createEmptyDraft(defaultFilters)]);
          setErrors({});
          setActiveRegenId(null);
          setRegenInstruction('');
          setSyncStatus('idle');
          lastSavedPayloadRef.current = '';
          setIsSelectMode(false);
          setSelectedTaskIds(new Set());
          setTimeout(() => {
            isDeletingRef.current = false;
          }, 500);
        } else {
          setDrafts((prev) => prev.filter((d) => !selectedTaskIds.has(d.id)));
          setIsSelectMode(false);
          setSelectedTaskIds(new Set());
        }
      },
    });
  }

  function promptRemoveDraft(draft: DraftTask, index: number) {
    if (drafts.length <= 1) return;

    const taskNum = index + 1;
    const taskTitle = draft.title.trim();

    setConfirmDialog({
      isOpen: true,
      title: `Remove Task ${taskNum}?`,
      description: taskTitle
        ? `Task ${taskNum} ("${taskTitle}") and its entered details will be removed from your list.`
        : `Task ${taskNum} and its entered details will be removed from your list.`,
      cancelText: 'Keep Task',
      confirmText: 'Yes, Remove',
      onConfirm: () => {
        setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
        if (activeRegenId === draft.id) {
          setActiveRegenId(null);
          setRegenInstruction('');
        }
      },
    });
  }

  async function handleImproveWithAi(draft: DraftTask, index: number) {
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

  function validateDrafts(): boolean {
    const errs: Record<string, string> = {};
    drafts.forEach((d) => {
      const fieldErrs = validateTaskForm(d);
      Object.entries(fieldErrs).forEach(([field, msg]) => {
        errs[`${d.id}-${field}`] = msg;
      });
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (drafts.length === 0 || !validateDrafts()) return;
    setSaving(true);
    try {
      for (const d of drafts) {
        const status = (d.workStatus || 'Pending') as WorkStatus;
        const ipReason = d.inProgressReason || (status === 'InProgress' ? d.reason : '');
        const pReason = d.pendingReason || (status === 'Pending' ? d.reason : '');
        const cRemarks = d.completedRemarks || (status === 'Completed' ? d.remarks : '');

        await createTask({
          ...d,
          givenBy: normalizeGivenBy(d.givenBy),
          priority: (d.priority || 'Medium') as Priority,
          workStatus: status,
          inProgressReason: ipReason,
          pendingReason: pReason,
          completedRemarks: cRemarks,
          reason: status === 'InProgress' ? ipReason : status === 'Pending' ? pReason : '',
          remarks: status === 'Completed' ? cRemarks : '',
          date: d.date ? new Date(d.date).toISOString() : new Date().toISOString(),
          dueDate: d.dueDate ? new Date(d.dueDate).toISOString() : undefined,
          userId: null,
        });
      }
      isDeletingRef.current = true;
      await deleteManualDraftState();
      onSaved();
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to save tasks' });
    } finally {
      setSaving(false);
    }
  }

  const renderConfirmDialog = () => {
    if (!confirmDialog || !confirmDialog.isOpen) return null;

    return (
      <div
        className="app-dialog-overlay"
        style={{ zIndex: 1000 }}
        onClick={(e) => e.stopPropagation()}
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
                <h3 className="app-dialog-title">{confirmDialog.title}</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setConfirmDialog(null)}
              className="app-dialog-close-btn"
              aria-label="Close"
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <div className="app-dialog-body">
            <p className="app-dialog-desc" style={{ marginBottom: 0 }}>
              {confirmDialog.description}
            </p>
          </div>

          <div className="app-dialog-footer">
            <button
              type="button"
              className="app-dialog-btn-cancel"
              onClick={() => setConfirmDialog(null)}
            >
              {confirmDialog.cancelText}
            </button>
            <button
              type="button"
              className="app-dialog-btn-action app-dialog-btn-danger"
              onClick={() => {
                const action = confirmDialog.onConfirm;
                setConfirmDialog(null);
                action();
              }}
            >
              {confirmDialog.confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1, overflow: 'hidden', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div 
        className="manual-task-form-body" 
        style={{ 
          flex: 1, 
          minHeight: 0, 
          overflowY: 'auto', 
          overflowX: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '1.25rem',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
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

        {drafts.map((draft, i) => {
          const fieldNames = [
            'title',
            'description',
            'givenBy',
            'contactPerson',
            'date',
            'dueDate',
            'priority',
            'workStatus',
            'reason',
            'remarks',
            'pendingReason',
            'inProgressReason',
            'completedRemarks',
          ];
          const draftErrors: Record<string, string> = {};
          fieldNames.forEach((f) => {
            if (errors[`${draft.id}-${f}`]) {
              draftErrors[f] = errors[`${draft.id}-${f}`];
            }
          });

          const isThisRegenerating = regeneratingIndex === i;
          const isRegenBoxOpen = activeRegenId === draft.id;
          const wasJustImproved = justImprovedId === draft.id;
          const isSelectedForDiscard = isSelectMode && selectedTaskIds.has(draft.id);

          return (
            <div
              key={draft.id}
              className="card manual-task-card animate-fade-in"
              style={{
                position: 'relative',
                borderTop: '1px solid var(--accent)',
                borderLeft: isThisRegenerating ? '2px solid var(--accent)' : wasJustImproved ? '2px solid var(--completed)' : undefined,
                border: isSelectedForDiscard ? '1px solid rgba(239, 68, 68, 0.45)' : undefined,
                boxShadow: isSelectedForDiscard ? '0 0 12px -2px rgba(239, 68, 68, 0.2)' : undefined,
                transition: 'border 0.2s ease, box-shadow 0.2s ease',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div className="manual-task-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {isSelectMode && (
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '4px',
                        borderRadius: 'var(--radius-sm, 4px)',
                        background: isSelectedForDiscard ? 'var(--high-bg)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelectedForDiscard ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--border-subtle)',
                        transition: 'all 0.15s ease',
                      }}
                      title="Select task to discard"
                    >
                      <input
                        type="checkbox"
                        checked={isSelectedForDiscard}
                        onChange={() => {
                          setSelectedTaskIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(draft.id)) {
                              next.delete(draft.id);
                            } else {
                              next.add(draft.id);
                            }
                            return next;
                          });
                        }}
                        style={{
                          accentColor: 'var(--high)',
                          cursor: 'pointer',
                          width: 16,
                          height: 16,
                          margin: 0,
                          display: 'block',
                        }}
                        aria-label={`Select Task ${i + 1} to discard`}
                      />
                    </label>
                  )}

                  <h3
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      fontWeight: 900,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: 'var(--text-primary)',
                      margin: 0,
                      whiteSpace: 'nowrap',
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

                <div className="manual-task-card-actions">
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

                  {drafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => promptRemoveDraft(draft, i)}
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

              <div
                className="manual-task-card-body"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
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

                <div
                  style={{
                    opacity: isThisRegenerating ? 0.45 : 1,
                    pointerEvents: isThisRegenerating ? 'none' : 'auto',
                    transition: 'opacity 0.2s ease',
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
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
            </div>
          );
        })}

        <div
          title={
            !canAddAnother
              ? `Fill in required fields (*) in Task ${incompleteTaskNum} before adding another task`
              : 'Add another task card'
          }
          style={{
            width: '100%',
            maxWidth: '100%',
            cursor: !canAddAnother ? 'not-allowed' : 'pointer',
          }}
        >
          <button
            type="button"
            onClick={handleAddAnotherTask}
            disabled={!canAddAnother}
            style={{
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              padding: '14px 20px',
              background: canAddAnother ? 'var(--bg-surface)' : 'transparent',
              border: canAddAnother ? '2px dashed var(--border)' : '1.5px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: canAddAnother ? 'var(--text-secondary)' : 'var(--text-muted)',
              cursor: canAddAnother ? 'pointer' : 'not-allowed',
              opacity: canAddAnother ? 1 : 0.45,
              pointerEvents: canAddAnother ? 'auto' : 'none',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.04em',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (canAddAnother) {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
              }
            }}
            onMouseLeave={(e) => {
              if (canAddAnother) {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <Plus style={{ width: 16, height: 16 }} /> Add Another Task
          </button>
        </div>

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

      <div 
        className="manual-task-footer"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {isSelectMode
            ? `Select tasks above to discard (${selectedTaskIds.size} selected)`
            : 'Closing will preserve your draft automatically.'}
        </span>

        {isSelectMode ? (
          <div className="manual-task-footer-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setIsSelectMode(false);
                setSelectedTaskIds(new Set());
              }}
              disabled={saving || regeneratingIndex !== null}
              style={{ fontSize: 13 }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                if (selectedTaskIds.size === drafts.length) {
                  setSelectedTaskIds(new Set());
                } else {
                  setSelectedTaskIds(new Set(drafts.map((d) => d.id)));
                }
              }}
              disabled={saving || regeneratingIndex !== null}
              style={{ fontSize: 13 }}
            >
              {selectedTaskIds.size === drafts.length ? 'Deselect All' : 'Select All'}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={handlePromptDiscardSelected}
              disabled={saving || regeneratingIndex !== null || selectedTaskIds.size === 0}
              style={{
                color: 'var(--high)',
                background: selectedTaskIds.size > 0 ? 'var(--high-bg)' : 'transparent',
                border: selectedTaskIds.size > 0 ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
                opacity: selectedTaskIds.size === 0 ? 0.45 : 1,
                cursor: selectedTaskIds.size === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <Trash2 style={{ width: 14, height: 14 }} />
              <span>Discard{selectedTaskIds.size > 0 ? ` (${selectedTaskIds.size})` : ''}</span>
            </button>
          </div>
        ) : (
          <div className="manual-task-footer-primary">
            {isDirty && (
              <button
                type="button"
                className="btn btn-ghost animate-fade-in"
                onClick={handleDiscardClick}
                disabled={saving || regeneratingIndex !== null}
                style={{
                  color: 'var(--high)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                }}
                title="Discard entered task details"
              >
                <Trash2 style={{ width: 14, height: 14 }} />
                <span>Discard</span>
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
        )}
      </div>

      {renderConfirmDialog()}
    </div>
  );
}