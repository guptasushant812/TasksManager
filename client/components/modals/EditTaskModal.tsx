'use client';
import { useState } from 'react';
import { Task, Priority, WorkStatus } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import { toIsoDate } from '@/lib/dates';
import TaskFormFields from './TaskFormFields';
import { X, Save, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAiDraft } from '@/hooks/useAiDraft';
import AiQuotaModal from './AiQuotaModal';

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
        title: 'AI Generation Successful', 
        message: 'Task fields updated beautifully with AI suggestions.' 
      });
      setTimeout(() => setShowSuccessPopup(null), 3500);
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
        title: 'Task Updated',
        message: 'Your task has been successfully updated.',
      });
      setTimeout(() => {
        setShowSuccessPopup(null);
        onSaved();
      }, 2000);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to update task' });
    } finally {
      setSaving(false);
    }
  }

  // ── Confirmation & Success Modals ──────────────────────────────────────────
  const renderUpdateConfirmModal = () => (
    <div className="app-dialog-overlay" style={{ zIndex: 1100 }} onClick={() => setShowUpdateConfirm(false)}>
      <div className="app-dialog-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="app-dialog-accent-bar" style={{ background: 'var(--accent)' }} />
        <div className="app-dialog-header">
          <div className="app-dialog-header-left">
            <div className="app-dialog-icon-wrap" style={{ background: 'rgba(0, 255, 102, 0.1)', color: 'var(--accent)' }}>
              <Save style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <div className="app-dialog-eyebrow" style={{ color: 'var(--accent)' }}>Confirm Action</div>
              <h3 className="app-dialog-title">Update Task?</h3>
            </div>
          </div>
          <button type="button" onClick={() => setShowUpdateConfirm(false)} className="app-dialog-close-btn">
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div className="app-dialog-body">
          <p className="app-dialog-desc" style={{ marginBottom: 0 }}>Are you sure you want to save these changes to the task?</p>
        </div>
        <div className="app-dialog-footer">
          <button type="button" className="app-dialog-btn-cancel" onClick={() => setShowUpdateConfirm(false)}>No, Cancel</button>
          <button type="button" className="app-dialog-btn-action" style={{ background: 'var(--accent)', color: '#000' }} onClick={handleSave}>
            Yes, Update
          </button>
        </div>
      </div>
    </div>
  );

  const renderSuccessModal = () => {
    if (!showSuccessPopup) return null;
    return (
      <div className="app-dialog-overlay" style={{ zIndex: 1200 }}>
        <div className="app-dialog-box animate-slide-up" style={{ maxWidth: 380, textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(0, 255, 102, 0.1)', color: 'var(--accent)', marginBottom: 16 }}>
            <CheckCircle2 style={{ width: 32, height: 32 }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{showSuccessPopup.title}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{showSuccessPopup.message}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      {showUpdateConfirm && renderUpdateConfirmModal()}
      {renderSuccessModal()}
      
      <div 
        className="modal-box animate-slide-up" 
        style={{ 
          maxWidth: 780, 
          width: '100%', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          padding: 0 
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: 'var(--border-width-layout) solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'var(--bg-elevated)', flexShrink: 0 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 }}>
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
                    style={{ minWidth: 220, height: 32, fontSize: 12, padding: '0 10px', margin: 0, border: 'none', background: 'transparent' }}
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

        {/* Content */}
        <div style={{ padding: '16px 24px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
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

        {/* Footer */}
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
    </div>
  );
}
