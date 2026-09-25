'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useTaskContext } from '@/context/TaskContext';
import { useEscalation } from '@/hooks/useEscalation';
import { Settings as SettingsIcon, AlertTriangle, Bell, Shield } from 'lucide-react';

const TABS = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'escalation', label: 'Escalation', icon: AlertTriangle },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function SettingsPage() {
  const { filters, handleTaskCreated } = useTaskContext();
  const [activeTab, setActiveTab] = useState('escalation');

  const { settings, updateSettings, loading } = useEscalation();
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({ enabled: false, threshold: 3 });

  useEffect(() => {
    if (settings) {
      setLocalSettings({ enabled: settings.enabled, threshold: settings.threshold });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings(localSettings);
    setTimeout(() => setIsSaving(false), 500);
  };

  const hasChanges = localSettings.enabled !== settings?.enabled || localSettings.threshold !== settings?.threshold;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header filters={filters} onTaskCreated={handleTaskCreated} />

      <main style={{ flex: 1, padding: '32px 32px 48px', maxWidth: 1100, margin: '0 auto', width: '100%', display: 'flex', gap: 40 }}>

        {/* Settings navigation */}
        <aside style={{ width: 200, flexShrink: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 20px 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Settings
          </h1>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    background: isActive ? 'var(--accent-subtle)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <Icon style={{ width: 15, height: 15 }} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Settings content */}
        <section style={{ flex: 1, paddingTop: 4 }}>
          {activeTab === 'escalation' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Escalation Policies</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                  Configure automatic warnings when tasks require excessive follow-ups.
                </p>
              </div>

              {loading && !settings ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 10px' }} />
                  Loading…
                </div>
              ) : (
                <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Toggle */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                        Enable Escalation Alerts
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Shows a warning banner on tasks exceeding the follow-up threshold.
                      </div>
                    </div>
                    <button
                      onClick={() => setLocalSettings(s => ({ ...s, enabled: !s.enabled }))}
                      role="switch"
                      aria-checked={localSettings.enabled}
                      style={{
                        width: 40, height: 22, borderRadius: 22, flexShrink: 0,
                        background: localSettings.enabled ? 'var(--accent)' : 'var(--bg-elevated)',
                        border: `1px solid ${localSettings.enabled ? 'var(--accent)' : 'var(--border)'}`,
                        position: 'relative', cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 2, left: localSettings.enabled ? 21 : 2,
                        transition: 'left 0.2s var(--ease-smooth)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }} />
                    </button>
                  </div>

                  <div style={{ height: 1, background: 'var(--border-subtle)' }} />

                  {/* Threshold */}
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    opacity: localSettings.enabled ? 1 : 0.35,
                    transition: 'opacity 0.2s',
                    pointerEvents: localSettings.enabled ? 'auto' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                        Follow-Up Threshold
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Number of active follow-ups before escalation triggers.
                      </div>
                    </div>
                    <input
                      type="number"
                      min="1"
                      disabled={!localSettings.enabled}
                      value={localSettings.threshold}
                      onChange={(e) => setLocalSettings(s => ({ ...s, threshold: parseInt(e.target.value) || 1 }))}
                      className="input"
                      style={{ width: 64, textAlign: 'center', fontSize: 14, padding: '6px 10px' }}
                    />
                  </div>

                  {/* Save */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={isSaving || !hasChanges}
                      style={{ fontSize: 13, padding: '8px 20px' }}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin" style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                          Saving…
                        </>
                      ) : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'escalation' && (
            <div className="animate-fade-in card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Coming Soon</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>This section is under development.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
