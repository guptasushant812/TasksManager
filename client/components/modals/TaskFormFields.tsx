'use client';

// Shared form field component used by ManualTaskForm and AiPreviewForm

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
  date: string;
  dueDate: string;
}

interface TaskFormFieldsProps {
  data: FormData;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export default function TaskFormFields({ data, onChange, errors = {} }: TaskFormFieldsProps) {
  const showReason  = data.workStatus === 'InProgress' || data.workStatus === 'Pending';
  const showRemarks = data.workStatus === 'Completed';

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

      {/* Reason (conditional) */}
      {showReason && (
        <div className="animate-fade-in">
          <label className="label" htmlFor="field-reason">
            Reason for {data.workStatus}
          </label>
          <textarea
            id="field-reason"
            className="input"
            placeholder="Why is this task pending or in progress?"
            value={data.reason}
            onChange={(e) => onChange('reason', e.target.value)}
            rows={2}
            style={{ resize: 'vertical', borderColor: 'var(--pending)', boxShadow: '0 0 0 1px rgba(245,158,11,0.1)' }}
          />
        </div>
      )}

      {/* Remarks (conditional) */}
      {showRemarks && (
        <div className="animate-fade-in">
          <label className="label" htmlFor="field-remarks">Remarks (What was done)</label>
          <textarea
            id="field-remarks"
            className="input"
            placeholder="Describe what was completed or accomplished…"
            value={data.remarks}
            onChange={(e) => onChange('remarks', e.target.value)}
            rows={2}
            style={{ resize: 'vertical', borderColor: 'var(--completed)', boxShadow: '0 0 0 1px rgba(34,197,94,0.1)' }}
          />
        </div>
      )}
    </div>
  );
}
