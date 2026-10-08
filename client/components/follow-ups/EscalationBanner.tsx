'use client';
import { useState, useEffect, useRef } from 'react';
import { useEscalation } from '@/hooks/useEscalation';
import { CheckCircle2, AlertTriangle, Send, Settings2, X } from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState('');

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
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err: any) {
      setErrorMessage(`Couldn't send escalation email: ${err?.message || 'Server error'}`);
      setTimeout(() => setErrorMessage(''), 5000);
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

      {/* Success Notification Pop */}
      {successMessage && (
        <div className="app-toast app-toast-success" role="status">
          <div className="app-toast-icon">
            <CheckCircle2 style={{ width: 16, height: 16 }} />
          </div>
          <span className="app-toast-text">{successMessage}</span>
          <button
            type="button"
            className="app-toast-dismiss"
            onClick={() => setSuccessMessage('')}
            aria-label="Dismiss message"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}

      {/* Error Notification Pop */}
      {errorMessage && (
        <div className="app-toast app-toast-danger" role="alert">
          <div className="app-toast-icon">
            <AlertTriangle style={{ width: 16, height: 16 }} />
          </div>
          <span className="app-toast-text">{errorMessage}</span>
          <button
            type="button"
            className="app-toast-dismiss"
            onClick={() => setErrorMessage('')}
            aria-label="Dismiss error"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}

      {/* Escalation Confirm Modal */}
      {showConfirmModal && (
        <div
          className="app-dialog-overlay"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="app-dialog-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <div className="app-dialog-accent-bar app-dialog-accent-primary" />

            <div className="app-dialog-header">
              <div className="app-dialog-header-left">
                <div className="app-dialog-icon-wrap app-dialog-icon-primary">
                  <Send style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div className="app-dialog-eyebrow app-dialog-eyebrow-primary">
                    Executive Communication
                  </div>
                  <h3 className="app-dialog-title">Send Escalation Email</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="app-dialog-close-btn"
                aria-label="Close"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="app-dialog-body">
              <p className="app-dialog-desc">
                An automated email briefing will be dispatched containing:
              </p>
              <div className="app-dialog-card" style={{ gap: 8, margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>•</span> Chronological follow-up timeline & outcomes
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>•</span> Latest response & outstanding next action
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>•</span> Configured TO, CC, and BCC escalation recipients
                </div>
              </div>
            </div>

            <div className="app-dialog-footer">
              <button
                type="button"
                className="app-dialog-btn-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app-dialog-btn-action app-dialog-btn-primary"
                onClick={handleConfirmEscalate}
              >
                <Send style={{ width: 14, height: 14 }} />
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
