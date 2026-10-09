'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task, Priority, WorkStatus } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import { toIsoDate } from '@/lib/dates';
import TaskFormFields from './TaskFormFields';
import { X, Save, Sparkles, RefreshCw, Check } from 'lucide-react';
import { useAiDraft } from '@/hooks/useAiDraft';
import AiQuotaModal from './AiQuotaModal';

const STATUS_BADGE: Record<string, string> = {
  InProgress: 'badge-inprogress',
  Pending: 'badge-pending',
  Completed: 'badge-completed',
};

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
    reason: task.reason || '',
    remarks: task.remarks || '',
    inProgressReason: task.inProgressReason || (task.workStatus === 'InProgress' ? task.reason : ''),
    pendingReason: task.pendingReason || (task.workStatus === 'Pending' ? task.reason : ''),
    completedRemarks: task.completedRemarks || (task.workStatus === 'Completed' ? task.remarks : ''),
    date: toIsoDate(task.date),
    dueDate: task.dueDate ? toIsoDate(task.dueDate) : '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { updateTask } = useTasks();

  const [isRegenOpen, setIsRegenOpen] = useState(false);
  const [regenInstruction, setRegenInstruction] = useState('');
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState<{ title: string; message: string } | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Ensure modal content starts at top
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }
    const timer = setTimeout(() => {
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = 0;
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving && !showUpdateConfirm) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saving, showUpdateConfirm, onClose]);

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

  const handleCloseSuccess = () => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    const isAiModal = showSuccessPopup?.title?.includes('AI') || showSuccessPopup?.message?.includes('AI');
    setShowSuccessPopup(null);
    if (!isAiModal) {
      onSaved();
    }
  };

  useEffect(() => {
    if (!showSuccessPopup) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        handleCloseSuccess();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuccessPopup]);

  async function handleRegenerate() {
    const result = await regenerateSingleDraft(
      data,
      0,
      regenInstruction,
      data.description
    );
    if (result) {
      setData((prev) => ({
        ...prev,
        ...result,
        date: result.date ? toIsoDate(result.date) : prev.date,
        dueDate: result.dueDate ? toIsoDate(result.dueDate) : prev.dueDate,
      }));
      setIsRegenOpen(false);
      setRegenInstruction('');
      
      setShowSuccessPopup({ 
        title: 'Task updated successfully', 
        message: 'AI suggestions have been applied.', 
      });
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        setShowSuccessPopup(null);
      }, 3500);
    }
  }

  function handleTriggerUpdate() {
    if (!validate()) return;
    setShowUpdateConfirm(true);
  }

  async function handleSave() {
    setShowUpdateConfirm(false);
    setSaving(true);
    try {
      await updateTask(task._id, {
        ...data,
        priority: (data.priority || 'Medium') as Priority,
        workStatus: (data.workStatus || 'Pending') as WorkStatus,
        date: new Date(data.date).toISOString(),
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      });
      
      setShowSuccessPopup({
        title: 'Task updated successfully',
        message: 'Your changes have been saved.',
      });
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        setShowSuccessPopup(null);
        onSaved();
      }, 3500);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to update task' });
    } finally {
      setSaving(false);
    }
  }

  // Confirmation and success dialogs
  const renderUpdateConfirmModal = () => (
    <div className="app-dialog-overlay" style={{ zIndex: 1100 }} onClick={() => setShowUpdateConfirm(false)}>
      <div 
        className="app-dialog-box animate-slide-up" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 450, marginInline: 'clamp(12px, 3vw, 16px)', width: 'min(450px, calc(100vw - 24px))' }}
      >
        <div className="app-dialog-accent-bar app-dialog-accent-success" />
        <div className="app-dialog-header">
          <div className="app-dialog-header-left">
            <div className="app-dialog-icon-wrap app-dialog-icon-success">
              <Save style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <div className="app-dialog-eyebrow app-dialog-eyebrow-success">CONFIRM UPDATE</div>
              <h3 className="app-dialog-title">Update Task?</h3>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setShowUpdateConfirm(false)} 
            className="app-dialog-close-btn"
            aria-label="Close confirmation dialog"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="app-dialog-body">
          <p className="app-dialog-desc">
            Please review the updated details before saving changes to this task.
          </p>

          <div className="app-dialog-card">
            <div className="app-dialog-row">
              <span className="app-dialog-label">Task ID</span>
              <span className="app-dialog-value" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>
                {task.taskId}
              </span>
            </div>
            <div className="app-dialog-row">
              <span className="app-dialog-label">Title</span>
              <span className="app-dialog-value" style={{ maxWidth: 'min(240px, 60vw)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {data.title}
              </span>
            </div>
            <div className="app-dialog-row">
              <span className="app-dialog-label">Status</span>
              <span className="app-dialog-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: data.workStatus === 'Completed' ? '#34d399' : data.workStatus === 'InProgress' ? '#60a5fa' : '#fbbf24' }} />
                {data.workStatus || 'Pending'}
              </span>
            </div>
            <div className="app-dialog-row">
              <span className="app-dialog-label">Priority</span>
              <span className="app-dialog-value">{data.priority || 'Medium'}</span>
            </div>
            {data.dueDate && (
              <div className="app-dialog-row">
                <span className="app-dialog-label">Due Date</span>
                <span className="app-dialog-value">{data.dueDate}</span>
              </div>
            )}
          </div>
        </div>

        <div className="app-dialog-footer">
          <button 
            type="button" 
            className="app-dialog-btn-cancel" 
            onClick={() => setShowUpdateConfirm(false)}
            style={{ minHeight: 44 }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="app-dialog-btn-action" 
            style={{ background: 'var(--accent)', color: '#000', fontWeight: 700, minHeight: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }} 
            onClick={handleSave}
            disabled={saving}
          >
            <Save style={{ width: 16, height: 16 }} />
            {saving ? 'Updating…' : 'Yes, Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSuccessModal = () => {
    if (!showSuccessPopup) return null;
    const currentStatus = data.workStatus || task.workStatus || 'Pending';
    return (
      <div 
        className="app-dialog-overlay" 
        style={{ zIndex: 1200 }} 
        onClick={handleCloseSuccess}
        role="dialog"
        aria-modal="true"
        aria-labelledby="saas-success-title"
      >
        <div 
          className="saas-success-modal" 
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            type="button"
            className="saas-modal-close-btn"
            onClick={handleCloseSuccess}
            aria-label="Close dialog"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>

          <div className="saas-success-header">
            <div className="saas-success-icon-wrap">
              <Check style={{ width: 18, height: 18, strokeWidth: 2.5 }} />
            </div>

            <h3 id="saas-success-title" className="saas-success-title">
              {showSuccessPopup.title}
            </h3>
            <p className="saas-success-subtitle">
              {showSuccessPopup.message}
            </p>
          </div>

          <div className="saas-task-summary">
            <div className="saas-task-summary-main">
              <span className="saas-task-id">{task.taskId}</span>
              <span className="saas-task-title" title={data.title}>
                {data.title}
              </span>
            </div>
            <div className="saas-task-summary-meta">
              <span className={`badge ${STATUS_BADGE[currentStatus] || 'badge-pending'}`}>
                {currentStatus}
              </span>
            </div>
          </div>

          <div className="saas-success-footer">
            <button
              type="button"
              className="saas-btn-done"
              onClick={handleCloseSuccess}
              autoFocus
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      {showUpdateConfirm && renderUpdateConfirmModal()}
      {renderSuccessModal()}
      
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
          margin: 'auto',
        }}
      >
        <div style={{ paddingBlock: 16, paddingInline: 24, borderBottom: 'var(--border-width-layout) solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'var(--bg-elevated)', flexShrink: 0 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInlineEnd: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Edit Task</h2>
              <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{task.taskId}</p>
            </div>
            
            <div style={{ position: 'relative' }}>
              {isRegenOpen ? (
                <div 
                  className="animate-slide-up"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    background: 'var(--bg-surface)', 
                    border: '1px solid var(--accent)', 
                    padding: '6px 8px', 
                    borderRadius: 'var(--radius-md)' 
                  }}
                >
                  <input
                    type="text"
                    value={regenInstruction}
                    onChange={(e) => setRegenInstruction(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRegenerate(); }}
                    placeholder="Instructions (optional)..."
                    className="input"
                    style={{ flex: 1, minWidth: 'min(220px, 100%)', height: 32, fontSize: 12, paddingInline: 10, margin: 0, border: 'none', background: 'transparent' }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsRegenOpen(false)}
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', height: 28, fontSize: 11 }}
                    disabled={isRegenerating}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="btn btn-primary"
                    style={{ padding: '4px 12px', height: 28, fontSize: 11, background: 'var(--accent)', color: '#000' }}
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? <RefreshCw className="animate-spin" style={{ width: 12, height: 12 }} /> : <Sparkles style={{ width: 12, height: 12 }} />}
                  </button>
                </div>
              ) : (
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
                  }}
                >
                  <Sparkles style={{ width: 14, height: 14 }} />
                  Regenerate with AI
                </button>
              )}
            </div>
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

        <div ref={contentScrollRef} className="modal-body-content" style={{ padding: '16px 24px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {rateLimitInfo && (
            <AiQuotaModal
              rateLimitInfo={rateLimitInfo}
              selectedModel={selectedModel}
              onSelectModel={updateSelectedModel}
              customApiKey={customApiKey}
              onSaveCustomKey={updateCustomApiKey}
              onRetry={() => {
                clearRateLimit();
                handleRegenerate();
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
          <button className="btn btn-primary" onClick={handleTriggerUpdate} disabled={saving}>
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
