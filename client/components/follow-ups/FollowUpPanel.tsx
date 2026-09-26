'use client';
import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/task';
import { FollowUp, FollowUpFormData } from '@/types/followUp';
import { useFollowUps } from '@/hooks/useFollowUps';
import { formatDate } from '@/lib/dates';
import FollowUpTimeline from './FollowUpTimeline';
import FollowUpForm from './FollowUpForm';
import EscalationBanner from './EscalationBanner';
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react';

interface FollowUpPanelProps {
  task: Task;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

export default function FollowUpPanel({ task, onClose, onTaskUpdated }: FollowUpPanelProps) {
  const { followUps, loading, error, fetchFollowUps, createFollowUp, updateFollowUp, deleteFollowUp, uploadAttachments, deleteAttachment } = useFollowUps(task._id);
  const [showForm, setShowForm] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FollowUp | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const activeCount = followUps.filter((fu) => !fu.isDeleted).length;

  // Find the latest active follow-up's nextFollowUpDate
  const latestActive = followUps.find((fu) => !fu.isDeleted);
  const nextFollowUpDate = latestActive?.nextFollowUpDate;
  const isOverdue = nextFollowUpDate && new Date(nextFollowUpDate) < new Date() && task.workStatus !== 'Completed';

  const handleSave = useCallback(async (data: FollowUpFormData, files: File[], removedAttachmentIds: string[] = []) => {
    let savedFollowUp: FollowUp;
    if (editingFollowUp) {
      savedFollowUp = await updateFollowUp(editingFollowUp._id, data);
    } else {
      savedFollowUp = await createFollowUp(data);
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
  }, [editingFollowUp, createFollowUp, updateFollowUp, uploadAttachments, deleteAttachment, fetchFollowUps, onTaskUpdated]);

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

  const handleRefresh = useCallback((includeDeleted?: boolean) => {
    fetchFollowUps(includeDeleted);
  }, [fetchFollowUps]);

  const statusBadgeClass = task.workStatus === 'Completed' ? 'badge-completed'
    : task.workStatus === 'InProgress' ? 'badge-inprogress' : 'badge-pending';

  return (
    <>
      <div className="fu-panel-backdrop" onClick={onClose} />

      <div className="fu-panel">
        <div className="fu-panel-header">
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px 12px' }}>
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Back
          </button>
          
          <button
            className="btn btn-primary"
            onClick={() => { setEditingFollowUp(null); setShowForm(true); }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            Add Follow-Up
          </button>
        </div>

        <div className="fu-panel-task-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent)', fontWeight: 600, background: 'var(--accent-subtle)', padding: '2px 6px', borderRadius: 4 }}>
              {task.taskId}
            </span>
            <span className={`badge ${statusBadgeClass}`}>
              {task.workStatus}
            </span>
          </div>
          
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3 }}>
            {task.title}
          </h3>
          
          {task.description && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
              {task.description}
            </p>
          )}
          
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            {task.contactPerson && <span>Contact: <strong style={{ color: 'var(--text-secondary)' }}>{task.contactPerson}</strong></span>}
            {task.givenBy && <span>Given by: <strong style={{ color: 'var(--text-secondary)' }}>{task.givenBy}</strong></span>}
            <span>Date: <strong style={{ color: 'var(--text-secondary)' }}>{formatDate(task.date)}</strong></span>
          </div>
        </div>

        {isOverdue && (
          <div className="fu-overdue-banner animate-slide-down">
            ⚠️ Overdue — Scheduled for {formatDate(nextFollowUpDate!)}
          </div>
        )}

        <div style={{ padding: '0 20px', flexShrink: 0 }}>
          <EscalationBanner 
            activeFollowUpCount={activeCount} 
            taskStatus={task.workStatus} 
          />
        </div>

        {error && (
          <div style={{ margin: '0 20px 16px', padding: '12px 16px', background: 'var(--high-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--high)' }}>
            {error}
          </div>
        )}

        {showForm && (
          <FollowUpForm
            key={editingFollowUp ? editingFollowUp._id : 'new'}
            defaultContactPerson={task.contactPerson || ''}
            editingFollowUp={editingFollowUp}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingFollowUp(null); }}
          />
        )}

        <div style={{ padding: '0 20px', flex: 1, overflowY: 'auto' }}>
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
        <div className="modal-overlay" style={{ zIndex: 200 }} onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Delete Follow-Up #{deleteTarget.followUpNumber}
              </h3>
              <button onClick={() => setDeleteTarget(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              This follow-up will be marked as deleted but preserved for audit purposes. Please provide a reason.
            </p>
            
            <div style={{ marginBottom: 20 }}>
              <label className="label" htmlFor="delete-reason">Reason for deletion <span style={{ color: 'var(--high)' }}>*</span></label>
              <textarea
                id="delete-reason"
                className="input"
                placeholder="Why is this follow-up being removed?"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
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
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
