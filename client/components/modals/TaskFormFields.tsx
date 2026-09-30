'use client';

// Shared form field component used by ManualTaskForm, EditTaskModal, and AiPreviewForm
import { useState, useEffect } from 'react';
import { Priority, WorkStatus } from '@/types/task';

const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];
const STATUSES: WorkStatus[] = ['InProgress', 'Pending', 'Completed'];

interface FormData {
  title: string;
  description: string;
  givenBy: string;
  contactPerson: string;
  priority: Priority | '';
  workStatus: WorkStatus | '';
  reason: string;
  remarks: string;
  inProgressReason?: string;
  pendingReason?: string;
  completedRemarks?: string;
  date: string;
  dueDate: string;
}

interface TaskFormFieldsProps {
  data: FormData;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export default function TaskFormFields({ data, onChange, errors = {} }: TaskFormFieldsProps) {
  // Active tab for viewing/editing reason notes: default to current workStatus
  const initialStatus = data.workStatus === 'Completed' || data.workStatus === 'InProgress' || data.workStatus === 'Pending' 
    ? data.workStatus 
    : 'Pending';
  const [activeReasonTab, setActiveReasonTab] = useState<WorkStatus>(initialStatus);

  // When workStatus changes, automatically sync active reason tab to match
  useEffect(() => {
    if (data.workStatus === 'InProgress' || data.workStatus === 'Pending' || data.workStatus === 'Completed') {
      setActiveReasonTab(data.workStatus);
    }
  }, [data.workStatus]);

  // Current values for each status
  const currentPending = data.pendingReason !== undefined 
    ? data.pendingReason 
    : (data.workStatus === 'Pending' ? data.reason : '');
  const currentInProgress = data.inProgressReason !== undefined 
    ? data.inProgressReason 
    : (data.workStatus === 'InProgress' ? data.reason : '');
  const currentCompleted = data.completedRemarks !== undefined 
    ? data.completedRemarks 
    : (data.workStatus === 'Completed' ? data.remarks : '');

  // Handle updates to specific status reasons without erasing other statuses
  function handleReasonChange(status: WorkStatus, val: string) {
    if (status === 'Pending') {
      onChange('pendingReason', val);
      if (data.workStatus === 'Pending') {
        onChange('reason', val);
      }
    } else if (status === 'InProgress') {
      onChange('inProgressReason', val);
      if (data.workStatus === 'InProgress') {
        onChange('reason', val);
      }
    } else if (status === 'Completed') {
      onChange('completedRemarks', val);
      if (data.workStatus === 'Completed') {
        onChange('remarks', val);
      }
    }
  }

  // Count non-empty reason notes across statuses for comparison strip
  const hasMultipleNotes = (currentPending ? 1 : 0) + (currentInProgress ? 1 : 0) + (currentCompleted ? 1 : 0) > 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Title */}
      <div>
        <label className="label" htmlFor="field-title">Task Title *</label>
        <input
          id="field-title"
          className="input"
          type="text"
          placeholder="Enter a clear, concise task title"
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          style={{ borderColor: errors.title ? 'var(--high)' : undefined }}
        />
        {errors.title && <span style={{ fontSize: 11, color: 'var(--high)', marginTop: 4, display: 'block' }}>{errors.title}</span>}
      </div>

      {/* Description */}
      <div>
        <label className="label" htmlFor="field-description">Description</label>
        <textarea
          id="field-description"
          className="input"
          placeholder="Full task description — what needs to be done, references, etc."
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          rows={3}
          style={{ resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>

      {/* Given By & Contact Person */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label className="label" htmlFor="field-givenBy">Given By</label>
          <input
            id="field-givenBy"
            className="input"
            type="text"
            placeholder="Who assigned this task"
            value={data.givenBy}
            onChange={(e) => onChange('givenBy', e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="field-contactPerson">Contact Person</label>
          <input
            id="field-contactPerson"
            className="input"
            type="text"
            placeholder="Person to follow up with"
            value={data.contactPerson}
            onChange={(e) => onChange('contactPerson', e.target.value)}
          />
        </div>
      </div>

      {/* Priority & Status row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label className="label">Priority</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange('priority', data.priority === p ? '' : p)}
                className={`pill ${data.priority === p ? 'active' : ''}`}
                style={{ flex: 1, fontSize: 12, textAlign: 'center' }}
              >{p}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Work Status</label>
          <select
            id="field-workStatus"
            className="input"
            value={data.workStatus}
            onChange={(e) => onChange('workStatus', e.target.value)}
          >
            <option value="">Select status…</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Date row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label className="label" htmlFor="field-date">Task Date *</label>
          <input
            id="field-date"
            className="input"
            type="date"
            value={data.date}
            onChange={(e) => onChange('date', e.target.value)}
            style={{ borderColor: errors.date ? 'var(--high)' : undefined }}
          />
          {errors.date && <span style={{ fontSize: 11, color: 'var(--high)', marginTop: 4, display: 'block' }}>{errors.date}</span>}
        </div>
        <div>
          <label className="label" htmlFor="field-dueDate">Due Date</label>
          <input
            id="field-dueDate"
            className="input"
            type="date"
            value={data.dueDate}
            onChange={(e) => onChange('dueDate', e.target.value)}
          />
        </div>
      </div>

      {/* ── Status Reasons / Remarks (Preserved across status changes) ────────── */}
      <div className="animate-fade-in" style={{
        marginTop: 4,
        padding: '14px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface)'
      }}>
        {/* Status Tab Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUSES.map((status) => {
              const isActiveTab = activeReasonTab === status;
              const isTaskStatus = data.workStatus === status;
              const hasData = status === 'Pending' ? !!currentPending : status === 'InProgress' ? !!currentInProgress : !!currentCompleted;
              const statusColor = status === 'Pending' ? 'var(--pending)' : status === 'InProgress' ? 'var(--inprogress)' : 'var(--completed)';
              const statusBg = status === 'Pending' ? 'var(--pending-bg)' : status === 'InProgress' ? 'var(--inprogress-bg)' : 'var(--completed-bg)';

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setActiveReasonTab(status)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    fontWeight: isActiveTab ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: isActiveTab ? `1px solid ${statusColor}` : '1px solid var(--border)',
                    background: isActiveTab ? statusBg : 'var(--bg-elevated)',
                    color: isActiveTab ? statusColor : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {status === 'Completed' ? 'Remarks' : `Reason (${status})`}
                  {isTaskStatus && (
                    <span style={{ fontSize: 9, background: statusColor, color: '#000', padding: '1px 4px', borderRadius: 4, fontWeight: 700 }}>
                      Current
                    </span>
                  )}
                  {hasData && !isTaskStatus && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} title="Saved note exists" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reason for Pending */}
        {activeReasonTab === 'Pending' && (
          <div className="animate-fade-in">
            <label className="label" htmlFor="field-reason-pending">
              Reason for Pending {data.workStatus !== 'Pending' && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Recorded when Pending)</span>}
            </label>
            <textarea
              id="field-reason-pending"
              className="input"
              placeholder="Why is this task pending or delayed?"
              value={currentPending}
              onChange={(e) => handleReasonChange('Pending', e.target.value)}
              rows={2}
              style={{ resize: 'vertical', borderColor: 'var(--pending)' }}
            />
          </div>
        )}

        {/* Reason for InProgress */}
        {activeReasonTab === 'InProgress' && (
          <div className="animate-fade-in">
            <label className="label" htmlFor="field-reason-inprogress">
              Reason for InProgress {data.workStatus !== 'InProgress' && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Recorded when InProgress)</span>}
            </label>
            <textarea
              id="field-reason-inprogress"
              className="input"
              placeholder="Notes on current progress or blockers"
              value={currentInProgress}
              onChange={(e) => handleReasonChange('InProgress', e.target.value)}
              rows={2}
              style={{ resize: 'vertical', borderColor: 'var(--inprogress)' }}
            />
          </div>
        )}

        {/* Remarks */}
        {activeReasonTab === 'Completed' && (
          <div className="animate-fade-in">
            <label className="label" htmlFor="field-remarks-completed">
              Remarks {data.workStatus !== 'Completed' && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Recorded when Completed)</span>}
            </label>
            <textarea
              id="field-remarks-completed"
              className="input"
              placeholder="What was completed or delivered"
              value={currentCompleted}
              onChange={(e) => handleReasonChange('Completed', e.target.value)}
              rows={2}
              style={{ resize: 'vertical', borderColor: 'var(--completed)' }}
            />
          </div>
        )}

        {/* Status History & Notes Strip */}
        {hasMultipleNotes && (
          <div style={{
            marginTop: 12,
            padding: '10px 12px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            lineHeight: 1.5
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
              Status History & Notes
            </div>
            {currentPending && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                <span style={{ color: 'var(--pending)', fontWeight: 600, minWidth: 85 }}>[Pending]:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{currentPending}</span>
              </div>
            )}
            {currentInProgress && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                <span style={{ color: 'var(--inprogress)', fontWeight: 600, minWidth: 85 }}>[InProgress]:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{currentInProgress}</span>
              </div>
            )}
            {currentCompleted && (
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ color: 'var(--completed)', fontWeight: 600, minWidth: 85 }}>[Completed]:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{currentCompleted}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

