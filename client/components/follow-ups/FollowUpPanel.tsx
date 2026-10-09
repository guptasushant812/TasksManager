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
import { ArrowLeft, Plus, Trash2, X, ChevronDown, ChevronUp, User, Calendar, AlertCircle } from 'lucide-react';
import AutoResizeTextarea from '@/components/ui/AutoResizeTextarea';

interface FollowUpPanelProps {
  task: Task;
  onClose: () => void;
  onTaskUpdated?: () => void;
  initialAddMode?: boolean;
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
        <div className="fu-panel-header" style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExportMenu filters={{}} selectedIds={[task._id]} isPanel={true} />

            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingFollowUp(null);
                setShowForm(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 13 }}
            >
              <Plus style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
              Add Follow-Up
            </button>
          </div>
        </div>

        <div className="fu-panel-task-info" style={{ padding: '16px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  color: 'var(--accent)',
                  fontWeight: 700,
                  background: 'var(--accent-subtle)',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                {task.taskId}
              </span>
              <span className={`badge ${statusBadgeClass}`} style={{ fontSize: 11 }}>
                {task.workStatus}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Priority: <strong style={{ color: 'var(--text-primary)' }}>{task.priority}</strong>
              </span>
            </div>

            {task.description && (
              <button
                type="button"
                onClick={() => setShowFullDesc(!showFullDesc)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {showFullDesc ? 'Hide Details' : 'Details'}
                {showFullDesc ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
              </button>
            )}
          </div>

          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px',
              lineHeight: 1.4,
            }}
          >
            {task.title}
          </h3>

          {showFullDesc && task.description && (
            <div
              className="animate-slide-down"
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                padding: '8px 12px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 8,
                border: '1px solid var(--border-subtle)',
              }}
            >
              {task.description}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 16,
              fontSize: 12,
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {task.contactPerson && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <User style={{ width: 12, height: 12, opacity: 0.7 }} />
                <span>Contact:</span>
                <strong style={{ color: 'var(--text-secondary)' }}>{task.contactPerson}</strong>
              </span>
            )}
            {task.givenBy && (
              <span>
                Given by: <strong style={{ color: 'var(--text-secondary)' }}>{task.givenBy}</strong>
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Calendar style={{ width: 12, height: 12, opacity: 0.7 }} />
              <span>Created:</span>
              <strong style={{ color: 'var(--text-secondary)' }}>{formatDate(task.date)}</strong>
            </span>
          </div>
        </div>

        {isOverdue && (
          <div className="fu-overdue-banner animate-slide-down" style={{ margin: '12px 20px 0' }}>
            <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span>Overdue — Action was scheduled for {formatDate(nextFollowUpDate!)}</span>
          </div>
        )}

        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <EscalationBanner
            taskId={task._id}
            activeFollowUpCount={activeCount}
            taskStatus={task.workStatus}
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
