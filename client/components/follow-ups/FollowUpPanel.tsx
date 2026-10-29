'use client';
import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/task';
import { FollowUp, FollowUpFormData } from '@/types/followUp';
import { useFollowUps } from '@/hooks/useFollowUps';
import { formatDate } from '@/lib/dates';
import FollowUpTimeline from './FollowUpTimeline';
import FollowUpForm from './FollowUpForm';
import EscalationBanner from './EscalationBanner';
import ExportMenu from '../tasks/ExportMenu';
import { ArrowLeft, Plus, Trash2, X, ChevronDown, ChevronUp, User, Calendar, AlertCircle, FileText } from 'lucide-react';
import AutoResizeTextarea from '@/components/ui/AutoResizeTextarea';

interface FollowUpPanelProps {
  task: Task;
  onClose: () => void;
  onTaskUpdated?: () => void;
  initialAddMode?: boolean;
}

function renderFormattedDescription(desc: string) {
  if (!desc) return null;
  const lines = desc.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, lineHeight: 1.6 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: 4 }} />;
        }
        const isBullet = /^[-*•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);
        if (isBullet) {
          const content = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingLeft: 4 }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  marginTop: 8,
                  flexShrink: 0,
                  opacity: 0.85,
                }}
              />
              <span style={{ color: 'var(--text-secondary)', flex: 1, wordBreak: 'break-word' }}>{content}</span>
            </div>
          );
        }
        return (
          <p key={idx} style={{ margin: 0, color: 'var(--text-primary)', fontWeight: idx === 0 && lines.length > 1 ? 600 : 400, wordBreak: 'break-word' }}>
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function FollowUpPanel({ task, onClose, onTaskUpdated, initialAddMode = false }: FollowUpPanelProps) {
  const {
    followUps,
    loading,
    error,
    fetchFollowUps,
    createFollowUp,
    updateFollowUp,
    deleteFollowUp,
    uploadAttachments,
    deleteAttachment,
  } = useFollowUps(task._id);

  const [showForm, setShowForm] = useState(initialAddMode);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FollowUp | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const activeCount = followUps.filter((fu) => !fu.isDeleted).length;

  // Find the latest active follow-up's nextFollowUpDate
  const latestActive = followUps.find((fu) => !fu.isDeleted);
  const nextFollowUpDate = latestActive?.nextFollowUpDate;
  const isOverdue = nextFollowUpDate && new Date(nextFollowUpDate) < new Date() && task.workStatus !== 'Completed';

  const handleSave = useCallback(
    async (data: FollowUpFormData, files: File[], removedAttachmentIds: string[] = []) => {
      let savedFollowUp: FollowUp;
      if (editingFollowUp) {
        savedFollowUp = await updateFollowUp(editingFollowUp._id, data);
      } else {
        savedFollowUp = await createFollowUp(data, files && files.length > 0);
      }

      if (files && files.length > 0) {
        await uploadAttachments(savedFollowUp._id, files);
      }

      if (removedAttachmentIds && removedAttachmentIds.length > 0) {
        for (const attId of removedAttachmentIds) {
          await deleteAttachment(savedFollowUp._id, attId);
        }
      }

      setShowForm(false);
      setEditingFollowUp(null);
      await fetchFollowUps();
      onTaskUpdated?.();
    },
    [editingFollowUp, createFollowUp, updateFollowUp, uploadAttachments, deleteAttachment, fetchFollowUps, onTaskUpdated]
  );

  function handleEdit(fu: FollowUp) {
    setEditingFollowUp(fu);
    setShowForm(true);
  }

  function handleDeletePrompt(fu: FollowUp) {
    setDeleteTarget(fu);
    setDeleteReason('');
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget || !deleteReason.trim()) return;
    setDeleting(true);
    try {
      await deleteFollowUp(deleteTarget._id, deleteReason.trim());
      setDeleteTarget(null);
      setDeleteReason('');
      await fetchFollowUps();
      onTaskUpdated?.();
    } catch {
      // error handled by hook
    } finally {
      setDeleting(false);
    }
  }

  const handleRefresh = useCallback(
    (includeDeleted?: boolean) => {
      fetchFollowUps(includeDeleted);
    },
    [fetchFollowUps]
  );

  const statusBadgeClass =
    task.workStatus === 'Completed'
      ? 'badge-completed'
      : task.workStatus === 'InProgress'
      ? 'badge-inprogress'
      : 'badge-pending';

  return (
    <>
      <div className="fu-panel-backdrop" onClick={onClose} />

      <div className="fu-panel fu-panel-redesign" role="dialog" aria-modal="true" aria-label={`Follow-Up History for ${task.taskId}`}>
        <div className="fu-panel-header">
          <button
            onClick={onClose}
            className="fu-panel-back-btn"
            title="Back to workspace"
            aria-label="Back"
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            <span className="fu-panel-back-text">Back</span>
          </button>

          <div className="fu-panel-header-actions">
            <ExportMenu filters={{}} selectedIds={[task._id]} isPanel={true} />

            <button
              className="btn btn-primary fu-add-btn"
              onClick={() => {
                setEditingFollowUp(null);
                setShowForm(true);
              }}
              title="Add follow-up entry"
            >
              <Plus style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
              <span>Add Follow-Up</span>
            </button>
          </div>
        </div>

        <div className="fu-panel-task-info">
          <div className="fu-task-meta-top">
            <span className="fu-task-id-badge">
              {task.taskId}
            </span>
            <span className={`badge ${statusBadgeClass}`}>
              {task.workStatus}
            </span>
            <span className="fu-task-priority">
              Priority: <strong>{task.priority}</strong>
            </span>
          </div>

          <h3 className="fu-task-title">
            {task.title}
          </h3>

          <div className="fu-task-meta-row">
            {task.contactPerson && (
              <span className="fu-meta-item">
                <User style={{ width: 12, height: 12, opacity: 0.7 }} />
                <span>Contact:</span>
                <strong>{task.contactPerson}</strong>
              </span>
            )}
            {task.givenBy && (
              <span className="fu-meta-item">
                <span>Given by:</span>
                <strong>{task.givenBy}</strong>
              </span>
            )}
            <span className="fu-meta-item">
              <Calendar style={{ width: 12, height: 12, opacity: 0.7 }} />
              <span>Created:</span>
              <strong>{formatDate(task.date)}</strong>
            </span>
          </div>

          {task.description && (
            <div className="fu-desc-section">
              <button
                type="button"
                className={`fu-desc-toggle ${showFullDesc ? 'is-open' : ''}`}
                onClick={() => setShowFullDesc(!showFullDesc)}
                aria-expanded={showFullDesc}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText style={{ width: 12, height: 12 }} />
                  <span style={{ fontWeight: 600 }}>Description</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, opacity: 0.8 }}>{showFullDesc ? 'Hide' : 'View'}</span>
                  <ChevronDown
                    style={{
                      width: 12,
                      height: 12,
                      transform: showFullDesc ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </div>
              </button>

              {showFullDesc && (
                <div className="fu-desc-content animate-slide-down">
                  {renderFormattedDescription(task.description)}
                </div>
              )}
            </div>
          )}
        </div>

        {isOverdue && (
          <div className="fu-overdue-banner animate-slide-down" style={{ margin: '12px 20px 0' }}>
            <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span>Overdue — Action was scheduled for {formatDate(nextFollowUpDate!)}</span>
          </div>
        )}

        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <EscalationBanner
            key={task._id}
            taskId={task._id}
            activeFollowUpCount={activeCount}
            taskStatus={task.workStatus}
            followUpsLoading={loading}
          />
        </div>

        {error && (
          <div
            style={{
              margin: '12px 20px',
              padding: '10px 14px',
              background: 'var(--high-bg)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              color: 'var(--high)',
            }}
          >
            {error}
          </div>
        )}

        {showForm && (
          <FollowUpForm
            key={editingFollowUp ? editingFollowUp._id : 'new'}
            defaultContactPerson={task.contactPerson || ''}
            editingFollowUp={editingFollowUp}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingFollowUp(null);
            }}
          />
        )}

        <div style={{ padding: '16px 20px 32px', flex: 1, overflowY: 'auto' }}>
          <FollowUpTimeline
            followUps={followUps}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDeletePrompt}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      {deleteTarget && (
        <div
          className="modal-overlay"
          style={{ zIndex: 200 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Delete Follow-Up #{deleteTarget.followUpNumber}
              </h3>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              This will remove the follow-up log from the active count and exports. Please provide a reason:
            </p>

            <div style={{ marginBottom: 18 }}>
              <label className="label" htmlFor="delete-reason">
                Deletion Reason <span style={{ color: 'var(--high)' }}>*</span>
              </label>
              <AutoResizeTextarea
                id="delete-reason"
                placeholder="e.g. Duplicate communication entry, logged under wrong task..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                minHeight={64}
                maxHeight={200}
                allowManualResize={true}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleting || !deleteReason.trim()}
              >
                <Trash2 style={{ width: 14, height: 14 }} />
                {deleting ? 'Deleting…' : 'Delete Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
