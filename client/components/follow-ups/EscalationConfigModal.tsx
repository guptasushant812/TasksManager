'use client';
import { useState, useEffect } from 'react';
import { useEscalation } from '@/hooks/useEscalation';
import { RecipientItem } from '@/types/escalation';
import EscalationRecipientsManager from './EscalationRecipientsManager';
import {
  ShieldAlert,
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface EscalationConfigModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

export default function EscalationConfigModal({ onClose, onSaved }: EscalationConfigModalProps) {
  const { settings, updateSettings, loading, error } = useEscalation();
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState<number | ''>(3);

  const [toRecipients, setToRecipients] = useState<RecipientItem[]>([]);
  const [ccRecipients, setCcRecipients] = useState<RecipientItem[]>([]);
  const [bccRecipients, setBccRecipients] = useState<RecipientItem[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled ?? false);
      setThreshold(settings.threshold ?? 3);

      if (Array.isArray(settings.toRecipients) && settings.toRecipients.length > 0) {
        setToRecipients(settings.toRecipients);
      } else {
        const legacyTo: RecipientItem[] = [];
        if (settings.managerEmail) legacyTo.push({ email: settings.managerEmail, tag: 'Manager' });
        if (settings.hodEmail) legacyTo.push({ email: settings.hodEmail, tag: 'HOD' });
        if (settings.dyhodEmail) legacyTo.push({ email: settings.dyhodEmail, tag: 'Dy.HOD' });
        setToRecipients(legacyTo);
      }

      if (Array.isArray(settings.ccRecipients) && settings.ccRecipients.length > 0) {
        setCcRecipients(settings.ccRecipients);
      } else if (settings.ccEmail) {
        const legacyCc = settings.ccEmail
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean)
          .map((email) => ({ email, tag: 'CC' }));
        setCcRecipients(legacyCc);
      } else {
        setCcRecipients([]);
      }

      if (Array.isArray(settings.bccRecipients) && settings.bccRecipients.length > 0) {
        setBccRecipients(settings.bccRecipients);
      } else {
        setBccRecipients([]);
      }
    }
  }, [settings]);

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    setValidationError('');

    if (enabled) {
      if (typeof threshold !== 'number' || threshold < 1) {
        setValidationError('Threshold must be at least 1 follow-up.');
        return;
      }

      // Require at least one leadership role in TO when enabled
      if (toRecipients.length === 0) {
        setValidationError(
          'At least one primary recipient (Manager, HOD, or Dy.HOD) is required in TO when escalation is enabled.'
        );
        return;
      }

      const hasPrimaryRole = toRecipients.some((r) =>
        /manager|hod|dy.*hod|deputy/i.test(r.tag)
      );

      if (!hasPrimaryRole) {
        setValidationError(
          'Please ensure at least one recipient in TO is assigned the role of Manager, HOD, or Dy.HOD.'
        );
        return;
      }
    }

    setSaving(true);
    try {
      await updateSettings({
        enabled,
        threshold: typeof threshold === 'number' ? threshold : 3,
        toRecipients,
        ccRecipients,
        bccRecipients,
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
      <div
        className="modal-box animate-slide-up"
        style={{
          maxWidth: 640,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-elevated)',
            flexShrink: 0,
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

        <div
          style={{
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            overflowY: 'auto',
            flex: 1,
          }}
        >
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
              <label
                htmlFor="modal-escalation-toggle"
                style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                Enable Automatic Escalation
              </label>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Alert users and allow email escalations when a task hits threshold.
              </p>
            </div>
            <input
              id="modal-escalation-toggle"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
          </div>

          <div style={{ opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? 'auto' : 'none' }}>
            <label className="label" htmlFor="modal-threshold-input" style={{ fontWeight: 600 }}>
              Escalation Threshold (Number of Follow-Ups)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <input
                id="modal-threshold-input"
                type="number"
                min="1"
                max="50"
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

          <div
            style={{
              opacity: enabled ? 1 : 0.5,
              pointerEvents: enabled ? 'auto' : 'none',
            }}
          >
            <EscalationRecipientsManager
              toRecipients={toRecipients}
              setToRecipients={setToRecipients}
              ccRecipients={ccRecipients}
              setCcRecipients={setCcRecipients}
              bccRecipients={bccRecipients}
              setBccRecipients={setBccRecipients}
              disabled={!enabled || loading}
            />
          </div>

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
            <span>These settings apply to all tasks and communication logs system-wide.</span>
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

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || loading}
              style={{ minWidth: 140 }}
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
        </div>
      </div>
    </div>
  );
}
