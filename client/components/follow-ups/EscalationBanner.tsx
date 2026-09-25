'use client';
import { useState } from 'react';
import { useEscalation } from '@/hooks/useEscalation';
import { Settings, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface EscalationBannerProps {
  activeFollowUpCount: number;
  taskStatus: string;
}

export default function EscalationBanner({ activeFollowUpCount, taskStatus }: EscalationBannerProps) {
  const { settings, updateSettings, loading } = useEscalation();
  const [showSettings, setShowSettings] = useState(false);
  const [tempThreshold, setTempThreshold] = useState<number | ''>('');
  
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
        </div>
      )}
    </div>
  );
}
