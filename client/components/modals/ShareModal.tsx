'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import {
  Copy,
  RefreshCw,
  Globe,
  AlertTriangle,
  CheckCircle2,
  X,
  Link2,
  Lock,
  Check,
} from 'lucide-react';

interface ShareModalProps {
  onClose: () => void;
}

export default function ShareModal({ onClose }: ShareModalProps) {
  const { settings, loading, toggleShare, regenerateToken } = useSettings();
  const [copied, setCopied] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2400);
      return () => clearTimeout(t);
    }
  }, [copied]);

  if (loading || !settings) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div
          className="animate-spin"
          style={{
            width: 24,
            height: 24,
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            margin: '0 auto 12px',
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Loading sharing settings…</span>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/status/${settings.publicShareToken}`
    : '';

  const handleToggle = async () => {
    setIsToggling(true);
    await toggleShare(!settings.isPublicShareEnabled);
    setIsToggling(false);
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  };

  const executeRegenerate = async () => {
    setShowRegenerateConfirm(false);
    setIsToggling(true);
    try {
      await regenerateToken();
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div>
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Globe
            style={{
              width: 17,
              height: 17,
              color: settings.isPublicShareEnabled ? '#10b981' : 'var(--text-muted)',
              transition: 'color 0.25s ease',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Enable Public Sharing
          </span>
        </div>

        <div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.isPublicShareEnabled}
            disabled={isToggling}
            onClick={handleToggle}
            style={{
              position: 'relative',
              width: 44,
              height: 24,
              borderRadius: 9999,
              border: 'none',
              cursor: isToggling ? 'not-allowed' : 'pointer',
              background: settings.isPublicShareEnabled ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
              transition: 'background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
              padding: 2,
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              opacity: isToggling ? 0.6 : 1,
              boxShadow: settings.isPublicShareEnabled ? '0 0 12px rgba(16, 185, 129, 0.35)' : 'none',
            }}
            title={settings.isPublicShareEnabled ? 'Click to disable sharing' : 'Click to enable sharing'}
          >
            <span
              style={{
                display: 'block',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
                transform: settings.isPublicShareEnabled ? 'translateX(20px)' : 'translateX(0)',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </button>
        </div>
      </div>

      {settings.isPublicShareEnabled ? (
        <div
          className="share-card-enter"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            marginBottom: 16,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              YOUR PUBLIC LINK
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '3px 4px 3px 10px',
              marginBottom: 10,
              gap: 8,
              transition: 'border-color 0.15s ease',
            }}
          >
            <Link2 style={{ width: 14, height: 14, color: 'var(--text-muted)', flexShrink: 0 }} />

            <input
              value={shareUrl}
              readOnly
              style={{
                flex: 1,
                minWidth: 0,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '6px 0',
                fontSize: 12.5,
                fontFamily: 'JetBrains Mono, monospace',
                color: '#34d399',
              }}
            />

            <button
              type="button"
              onClick={handleCopy}
              className="brutalist-hover"
              title={copied ? 'Copied!' : 'Copy link to clipboard'}
              aria-label="Copy link to clipboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: copied ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-hover)',
                border: copied ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border)',
                color: copied ? '#10b981' : 'var(--text-secondary)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {copied ? (
                <Check style={{ width: 15, height: 15, color: '#10b981' }} />
              ) : (
                <Copy style={{ width: 14, height: 14 }} />
              )}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowRegenerateConfirm(true)}
              disabled={isToggling}
              className="brutalist-hover"
              style={{
                background: 'transparent',
                border: '1px solid rgba(248, 113, 113, 0.25)',
                borderRadius: 'var(--radius-sm)',
                color: '#f87171',
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 8px',
                cursor: isToggling ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
              title="Invalidate current link and create a new secure token"
            >
              <RefreshCw
                style={{
                  width: 11,
                  height: 11,
                  transition: 'transform 0.3s ease',
                }}
                className={isToggling ? 'animate-spin' : ''}
              />
              <span>Regenerate Link</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className="share-card-enter"
          style={{
            padding: '24px 20px',
            textAlign: 'center',
            background: 'var(--bg-hover)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 16,
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Lock style={{ width: 18, height: 18, opacity: 0.6 }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Public sharing is disabled
          </span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingTop: 14,
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="brutalist-hover"
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.02em',
            padding: '7px 18px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          CLOSE PANEL
        </button>
      </div>

      {copied && (
        <div className="app-toast app-toast-success" role="status">
          <div className="app-toast-icon">
            <CheckCircle2 style={{ width: 16, height: 16 }} />
          </div>
          <span className="app-toast-text">Public share link copied to clipboard!</span>
          <button
            type="button"
            className="app-toast-dismiss"
            onClick={() => setCopied(false)}
            aria-label="Dismiss toast"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}

      {showRegenerateConfirm && (
        <div className="app-dialog-overlay" onClick={() => setShowRegenerateConfirm(false)}>
          <div
            className="app-dialog-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <div className="app-dialog-accent-bar app-dialog-accent-amber" />

            <div className="app-dialog-header">
              <div className="app-dialog-header-left">
                <div className="app-dialog-icon-wrap app-dialog-icon-amber">
                  <AlertTriangle style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div className="app-dialog-eyebrow app-dialog-eyebrow-amber">
                    SECURITY NOTICE
                  </div>
                  <h3 className="app-dialog-title">Regenerate Link?</h3>
                </div>
              </div>
              <button
                type="button"
                className="app-dialog-close-btn"
                onClick={() => setShowRegenerateConfirm(false)}
                aria-label="Close dialog"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="app-dialog-body">
              <p className="app-dialog-desc">
                Anyone with the existing public link will <strong>immediately lose access</strong> to your tasks board. A brand-new secure link will be created.
              </p>

              <div className="app-dialog-card">
                <div className="app-dialog-row">
                  <span className="app-dialog-label">Status</span>
                  <span className="app-dialog-value" style={{ color: '#fbbf24' }}>Old link invalidated</span>
                </div>
                <div className="app-dialog-row">
                  <span className="app-dialog-label">Action</span>
                  <span className="app-dialog-value">New token created</span>
                </div>
              </div>
            </div>

            <div className="app-dialog-footer">
              <button
                type="button"
                className="app-dialog-btn-cancel"
                onClick={() => setShowRegenerateConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app-dialog-btn-action app-dialog-btn-amber"
                onClick={executeRegenerate}
              >
                <RefreshCw style={{ width: 14, height: 14 }} />
                Regenerate Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
