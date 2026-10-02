'use client';
import { useState, useEffect, useRef } from 'react';
import { useEscalation } from '@/hooks/useEscalation';
import { CheckCircle2, AlertTriangle, Send, Settings2 } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import EscalationConfigModal from './EscalationConfigModal';

interface EscalationBannerProps {
  taskId: string;
  activeFollowUpCount: number;
  taskStatus: string;
  onOpenConfig?: () => void;
}

export default function EscalationBanner({
  taskId,
  activeFollowUpCount,
  taskStatus,
  onOpenConfig,
}: EscalationBannerProps) {
  const { settings, loading } = useEscalation();
  const { escalateTask } = useTasks();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const prevCountRef = useRef(activeFollowUpCount);

  useEffect(() => {
    if (!loading && settings?.enabled) {
      // Prompt modal when hitting the threshold exactly
      if (activeFollowUpCount > prevCountRef.current && activeFollowUpCount === settings.threshold) {
        setShowConfirmModal(true);
      }
      prevCountRef.current = activeFollowUpCount;
    }
  }, [activeFollowUpCount, loading, settings]);

  if (loading || !settings || !settings.enabled) return null;

  const threshold = settings.threshold;
  const isEscalated = activeFollowUpCount >= threshold;

  async function handleConfirmEscalate() {
    setShowConfirmModal(false);
    setEscalating(true);
    try {
      await escalateTask(taskId);
      setSuccessMessage('Escalation email successfully sent to management.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(`Couldn't send escalation email: ${err.message}`);
    } finally {
      setEscalating(false);
    }
  }

  const handleOpenSettings = () => {
    if (onOpenConfig) {
      onOpenConfig();
    } else {
      setShowConfigModal(true);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Alert Banner for escalated tasks */}
      {isEscalated ? (
        <div
          className="animate-slide-up"
          style={{
            background: taskStatus === 'Completed' ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.06)',
            border: `1px solid ${taskStatus === 'Completed' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            borderLeft: `4px solid ${taskStatus === 'Completed' ? 'var(--completed)' : 'var(--high)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            color: taskStatus === 'Completed' ? 'var(--completed)' : 'var(--high)',
          }}
        >
          <div
            style={{
              background: taskStatus === 'Completed' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              padding: 8,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {taskStatus === 'Completed' ? (
              <CheckCircle2 style={{ width: 18, height: 18 }} />
            ) : (
              <AlertTriangle style={{ width: 18, height: 18 }} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>
                Escalation Threshold Reached ({activeFollowUpCount}/{threshold})
              </span>
              <button
                type="button"
                onClick={handleOpenSettings}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Settings2 style={{ width: 11, height: 11 }} />
                Rules
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0', lineHeight: 1.4 }}>
              {taskStatus === 'Completed'
                ? 'Task is marked completed. Escalation alert resolved.'
                : 'High communication volume reached. Management notification recommended.'}
            </p>
          </div>

          {taskStatus !== 'Completed' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowConfirmModal(true)}
              disabled={escalating}
              style={{
                fontSize: 12,
                padding: '6px 12px',
                background: 'var(--high)',
                borderColor: 'var(--high)',
                color: '#fff',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {escalating ? (
                'Sending…'
              ) : (
                <>
                  <Send style={{ width: 12, height: 12 }} /> Escalate Email
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        /* Non-escalated progress indicator when enabled */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--text-muted)',
            padding: '4px 0',
          }}
        >
          <span>
            Escalation Threshold: <strong style={{ color: 'var(--text-secondary)' }}>{activeFollowUpCount}</strong> / {threshold} logs
          </span>
          <button
            type="button"
            onClick={handleOpenSettings}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 11,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Settings2 style={{ width: 11, height: 11 }} />
            Rules
          </button>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div
          className="animate-slide-up"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'var(--completed)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 1000,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <CheckCircle2 style={{ width: 16, height: 16 }} />
          {successMessage}
        </div>
      )}

      {/* Escalation Confirm Modal */}
      {showConfirmModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowConfirmModal(false)}
          style={{ zIndex: 200 }}
        >
          <div
            className="modal-box animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440, padding: 0, overflow: 'hidden' }}
          >
            <div style={{ background: 'var(--bg-elevated)', padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                <Send style={{ width: 16, height: 16, color: 'var(--accent)' }} />
                Send Escalation Email
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                Notify leadership regarding this task’s communication status
              </p>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.5 }}>
                An automated email briefing will be dispatched containing:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6 }}>
                <li>Chronological follow-up timeline & outcomes</li>
                <li>Latest response & outstanding next action</li>
                <li>Designated Manager, HOD, and DyHOD recipients</li>
              </ul>
            </div>
            <div
              style={{
                padding: '14px 24px',
                background: 'var(--bg-elevated)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button className="btn btn-ghost" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmEscalate}
                style={{ background: 'var(--high)', borderColor: 'var(--high)', color: '#fff' }}
              >
                Send Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centralized config modal opened from rules link */}
      {showConfigModal && (
        <EscalationConfigModal onClose={() => setShowConfigModal(false)} />
      )}
    </div>
  );
}
