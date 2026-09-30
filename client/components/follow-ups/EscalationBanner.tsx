'use client';
import { useState, useEffect, useRef } from 'react';
import { useEscalation } from '@/hooks/useEscalation';
import { Settings, X, CheckCircle2, AlertTriangle } from 'lucide-react';

import { Send } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';

interface EscalationBannerProps {
  taskId: string;
  activeFollowUpCount: number;
  taskStatus: string;
}

export default function EscalationBanner({ taskId, activeFollowUpCount, taskStatus }: EscalationBannerProps) {
  const { settings, updateSettings, loading } = useEscalation();
  const { escalateTask } = useTasks();
  const [showSettings, setShowSettings] = useState(false);
  const [tempThreshold, setTempThreshold] = useState<number | ''>('');
  const [escalating, setEscalating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const prevCountRef = useRef(activeFollowUpCount);
  
  useEffect(() => {
    if (!loading && settings?.enabled) {
      // Only pop up automatically EXACTLY when hitting the threshold (not for 4, 5, etc)
      if (activeFollowUpCount > prevCountRef.current && activeFollowUpCount === settings.threshold) {
        setShowConfirmModal(true);
      }
      prevCountRef.current = activeFollowUpCount;
    }
  }, [activeFollowUpCount, loading, settings]);

  if (loading || !settings) return null;

  const threshold = settings.threshold;
  const isEscalated = settings.enabled && activeFollowUpCount >= threshold;

  async function handleSaveSettings() {
    if (typeof tempThreshold === 'number' && tempThreshold > 0) {
      await updateSettings({ threshold: tempThreshold });
    }
    setShowSettings(false);
  }

  function handleOpenSettings() {
    setTempThreshold(settings!.threshold);
    setShowSettings(true);
  }

  async function handleConfirmEscalate() {
    setShowConfirmModal(false);
    setEscalating(true);
    try {
      await escalateTask(taskId);
      setSuccessMessage('Escalation email sent.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(`Couldn't send email: ${err.message}`);
    } finally {
      setEscalating(false);
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Settings Panel */}
      {showSettings ? (
        <div className="card animate-slide-down" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings style={{ width: 14, height: 14 }} />
              Escalation Settings
            </span>
            <button onClick={() => setShowSettings(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={settings.enabled} 
                onChange={(e) => updateSettings({ enabled: e.target.checked })} 
                style={{ accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 13 }}>Enable Escalation Alerts</span>
            </label>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: settings.enabled ? 1 : 0.5, pointerEvents: settings.enabled ? 'auto' : 'none', paddingLeft: 24 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Alert when follow-ups reach:</span>
              <input 
                type="number" 
                min="1" 
                value={tempThreshold}
                onChange={(e) => setTempThreshold(parseInt(e.target.value) || '')}
                disabled={!settings.enabled}
                className="input"
                style={{ width: 60, padding: '4px 8px', fontSize: 13, textAlign: 'center' }}
              />
              <button 
                className="btn btn-primary"
                onClick={handleSaveSettings}
                disabled={!settings.enabled}
                style={{ padding: '6px 12px', fontSize: 12 }}
              >Save</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: isEscalated ? 12 : 0 }}>
          <button 
            className="btn btn-ghost"
            onClick={handleOpenSettings}
            style={{ fontSize: 12, padding: '4px 10px' }}
          >
            <Settings style={{ width: 12, height: 12 }} />
            Configure
          </button>
        </div>
      )}

      {/* Alert Banner */}
      {isEscalated && (
        <div className="animate-slide-up" style={{ 
          background: taskStatus === 'Completed' ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)', 
          border: `1px solid ${taskStatus === 'Completed' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, 
          borderLeft: `3px solid ${taskStatus === 'Completed' ? 'var(--completed)' : 'var(--high)'}`,
          borderRadius: 'var(--radius-md)', 
          padding: '12px 16px', 
          display: 'flex', 
          gap: 12, 
          alignItems: 'center',
          color: taskStatus === 'Completed' ? 'var(--completed)' : 'var(--high)',
        }}>
          <div style={{ 
            background: taskStatus === 'Completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: 8,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {taskStatus === 'Completed' ? <CheckCircle2 style={{ width: 20, height: 20 }} /> : <AlertTriangle style={{ width: 20, height: 20 }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
              Escalation Threshold Reached ({activeFollowUpCount}/{threshold})
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {taskStatus === 'Completed' 
                ? 'Task is marked complete. No further action needed.' 
                : 'Task requires immediate attention based on follow-up volume.'}
            </div>
          </div>
          {taskStatus !== 'Completed' && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowConfirmModal(true)}
              disabled={escalating}
              style={{ fontSize: 13, padding: '8px 16px', background: 'var(--high)', borderColor: 'var(--high)', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}
            >
              {escalating ? 'Sending...' : <><Send style={{ width: 14, height: 14 }} /> Escalate to Management</>}
            </button>
          )}
        </div>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div className="animate-slide-up" style={{
          position: 'fixed', bottom: 24, right: 24, background: '#10b981', color: 'white',
          padding: '12px 20px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 8, zIndex: 1000, fontWeight: 500, fontSize: 14
        }}>
          <CheckCircle2 style={{ width: 18, height: 18 }} />
          {successMessage}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)} style={{ zIndex: 200 }}>
          <div className="modal-box animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, padding: 0, overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '20px 24px', color: 'white' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Send style={{ width: 18, height: 18, color: '#3b82f6' }} />
                Confirm Escalation
              </h3>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                Send an escalation email to management?
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.6 }}>
                <li>Includes task history and timeline</li>
                <li>Attaches uploaded files and notes</li>
                <li>Notifies Manager, HOD, and DyHOD</li>
              </ul>
            </div>
            <div style={{ padding: '16px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirmEscalate} style={{ background: '#3b82f6', borderColor: '#3b82f6' }}>
                Send Escalation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
