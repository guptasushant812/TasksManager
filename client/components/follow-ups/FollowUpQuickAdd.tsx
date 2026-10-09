'use client';
import { useState } from 'react';
import { FollowUpMethod, FOLLOW_UP_METHODS } from '@/types/followUp';
import { Task } from '@/types/task';
import { useFollowUps } from '@/hooks/useFollowUps';
import { X, Save } from 'lucide-react';
import AutoResizeTextarea from '@/components/ui/AutoResizeTextarea';

interface FollowUpQuickAddProps {
  task: Task;
  onClose: () => void;
  onAdded: () => void;
}

function nowDateTimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function FollowUpQuickAdd({ task, onClose, onAdded }: FollowUpQuickAddProps) {
  const { createFollowUp } = useFollowUps(task._id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [date, setDate] = useState(nowDateTimeLocal());
  const [method, setMethod] = useState<FollowUpMethod>('Phone');
  const [communicated, setCommunicated] = useState('');
  const [response, setResponse] = useState('');

  async function handleSubmit() {
    if (!communicated.trim()) {
      setError('What you communicated is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createFollowUp({
        followUpDate: date,
        method,
        methodOther: '',
        contactPerson: task.contactPerson || '',
        communicated,
        responseReceived: response,
        notes: '',
        nextAction: '',
        nextFollowUpDate: '',
      });
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ zIndex: 100 }}>
      <div className="modal-box animate-slide-up" style={{ padding: 0, width: '100%', maxWidth: 520 }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'var(--bg-elevated)' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Quick Follow-Up</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
              For <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{task.taskId}</span>: {task.title}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '20px 24px', maxHeight: 'calc(95vh - 130px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Date & Time */}
            <div>
              <label className="label">Date & Time</label>
              <input 
                type="datetime-local" 
                className="input" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                onClick={(e) => 'showPicker' in e.currentTarget && (e.currentTarget as any).showPicker()}
              />
            </div>
            
            {/* Method */}
            <div>
              <label className="label">Contact Method</label>
              <select 
                className="input" 
                value={method} 
                onChange={e => setMethod(e.target.value as FollowUpMethod)}
              >
                {FOLLOW_UP_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Communicated */}
          <div>
            <label className="label">What was communicated? <span style={{ color: 'var(--high)' }}>*</span></label>
            <AutoResizeTextarea 
              value={communicated} 
              onChange={e => setCommunicated(e.target.value)} 
              placeholder="e.g., Sent a reminder email regarding the Q3 report..." 
              minHeight={60}
              maxHeight={200}
              allowManualResize={true}
            />
          </div>

          {/* Response */}
          <div>
            <label className="label">Response received <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
            <AutoResizeTextarea 
              value={response} 
              onChange={e => setResponse(e.target.value)} 
              placeholder="e.g., They said they will complete it by tomorrow" 
              minHeight={50}
              maxHeight={180}
              allowManualResize={true}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--high-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--high)' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Saving…</>
            ) : (
              <><Save style={{ width: 14, height: 14 }} /> Save Follow-Up</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
