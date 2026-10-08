'use client';
import { useState, useEffect } from 'react';
import { useEscalation } from '@/hooks/useEscalation';
import { ShieldAlert, X, Save, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface EscalationConfigModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

export default function EscalationConfigModal({ onClose, onSaved }: EscalationConfigModalProps) {
  const { settings, updateSettings, loading, error } = useEscalation();
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState<number | ''>(3);
  const [managerEmail, setManagerEmail] = useState('');
  const [hodEmail, setHodEmail] = useState('');
  const [dyhodEmail, setDyhodEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled ?? false);
      setThreshold(settings.threshold ?? 3);
      setManagerEmail(settings.managerEmail || '');
      setHodEmail(settings.hodEmail || '');
      setDyhodEmail(settings.dyhodEmail || '');
      setCcEmail(settings.ccEmail || '');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (enabled) {
      if (typeof threshold !== 'number' || threshold < 1) {
        setValidationError('Threshold must be at least 1 follow-up.');
        return;
      }
    }

    setSaving(true);
    try {
      await updateSettings({
        enabled,
        threshold: typeof threshold === 'number' ? threshold : 3,
        managerEmail: managerEmail.trim(),
        hodEmail: hodEmail.trim(),
        dyhodEmail: dyhodEmail.trim(),
        ccEmail: ccEmail.trim(),
      });
      setSaveSuccess(true);
      onSaved?.();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save escalation configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 120 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box animate-slide-up" style={{ maxWidth: 640, width: '94vw', padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Escalation Configuration
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                System-level follow-up communication thresholds & recipient rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: 6, borderRadius: 'var(--radius-sm)' }}
            aria-label="Close modal"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--high-bg)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--high)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {validationError && (
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--high-bg)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--high)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Master Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <label htmlFor="escalation-toggle" style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer' }}>
                Enable Automatic Escalation
              </label>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Alert users and allow email escalations when a task hits threshold.
              </p>
            </div>
            <input
              id="escalation-toggle"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
          </div>

          {/* Threshold Setting */}
          <div style={{ opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? 'auto' : 'none' }}>
            <label className="label" htmlFor="threshold-input" style={{ fontWeight: 600 }}>
              Escalation Threshold (Number of Follow-Ups)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <input
                id="threshold-input"
                type="number"
                min="1"
                max="20"
                className="input"
                style={{ width: 90, textAlign: 'center', fontWeight: 700 }}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                disabled={!enabled || loading}
              />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                follow-ups before a task is marked as escalated
              </span>
            </div>
          </div>

          {/* Recipient Emails Grid */}
          <div style={{ opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Escalation Recipients
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              <div>
                <label className="label" htmlFor="manager-email">Manager Email</label>
                <input
                  id="manager-email"
                  type="email"
                  className="input"
                  style={{ fontSize: 13.5, padding: '10px 14px', width: '100%' }}
                  placeholder="manager@example.com"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  disabled={!enabled || loading}
                />
              </div>

              <div>
                <label className="label" htmlFor="hod-email">HOD Email</label>
                <input
                  id="hod-email"
                  type="email"
                  className="input"
                  style={{ fontSize: 13.5, padding: '10px 14px', width: '100%' }}
                  placeholder="hod@example.com"
                  value={hodEmail}
                  onChange={(e) => setHodEmail(e.target.value)}
                  disabled={!enabled || loading}
                />
              </div>

              <div>
                <label className="label" htmlFor="dyhod-email">Deputy HOD Email</label>
                <input
                  id="dyhod-email"
                  type="email"
                  className="input"
                  style={{ fontSize: 13.5, padding: '10px 14px', width: '100%' }}
                  placeholder="dyhod@example.com"
                  value={dyhodEmail}
                  onChange={(e) => setDyhodEmail(e.target.value)}
                  disabled={!enabled || loading}
                />
              </div>

              <div>
                <label className="label" htmlFor="cc-email">CC Email</label>
                <input
                  id="cc-email"
                  type="email"
                  className="input"
                  style={{ fontSize: 13.5, padding: '10px 14px', width: '100%' }}
                  placeholder="alerts@example.com"
                  value={ccEmail}
                  onChange={(e) => setCcEmail(e.target.value)}
                  disabled={!enabled || loading}
                />
              </div>
            </div>
          </div>

          {/* Footer Info & Full Settings link */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span>
              These settings apply to all tasks and communication logs system-wide.
            </span>
            <Link
              href="/settings"
              onClick={onClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--accent)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Open Full Settings <ExternalLink style={{ width: 12, height: 12 }} />
            </Link>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || loading}
              style={{ minWidth: 120 }}
            >
              {saving ? (
                <>Saving…</>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 style={{ width: 14, height: 14 }} /> Saved!
                </>
              ) : (
                <>
                  <Save style={{ width: 14, height: 14 }} /> Save Configuration
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
