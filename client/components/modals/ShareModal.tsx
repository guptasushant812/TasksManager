'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import {
  RefreshCw,
  Globe,
  AlertTriangle,
  X,
  Link2,
  Copy,
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 0 20px',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
              border: 'var(--border-width-layout, 1px) solid var(--border)',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            <Globe style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              Public Access
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {settings.isPublicShareEnabled ? 'Link is currently active' : 'Link is currently disabled'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: settings.isPublicShareEnabled ? 'var(--completed, #10b981)' : 'var(--text-muted)',
            }}
          >
            {settings.isPublicShareEnabled ? 'On' : 'Off'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.isPublicShareEnabled}
            disabled={isToggling}
            onClick={handleToggle}
            style={{
              position: 'relative',
              width: 46,
              height: 26,
              borderRadius: 9999,
              border: 'none',
              cursor: isToggling ? 'not-allowed' : 'pointer',
              background: settings.isPublicShareEnabled ? 'var(--completed, #10b981)' : 'var(--bg-hover)',
              transition: 'background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              padding: 3,
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              opacity: isToggling ? 0.6 : 1,
            }}
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

      {settings.isPublicShareEnabled && (
        <div className="share-url-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              Direct URL
            </span>

            <button
              type="button"
              onClick={() => setShowRegenerateConfirm(true)}
              disabled={isToggling}
              className="brutalist-hover"
              style={{
                background: 'var(--bg-surface)',
                border: 'var(--border-width-layout, 1px) solid var(--border)',
                borderRadius: 'var(--radius-sm, 6px)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                padding: '5px 12px',
                cursor: isToggling ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--text-muted)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <RefreshCw
                style={{
                  width: 12,
                  height: 12,
                  transition: 'transform 0.3s ease',
                }}
                className={isToggling ? 'animate-spin' : ''}
              />
              <span>Regenerate</span>
            </button>
          </div>

          <div className="share-url-group">
            <div
              className="share-url-box"
              onClick={handleCopy}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopy(); } }}
              title="Click to copy URL"
            >
              <Link2 className="share-url-icon" />
              <div className="share-url-text">
                {shareUrl}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="share-copy-btn brutalist-hover"
            >
              {copied ? (
                <>
                  <Check style={{ width: 13, height: 13 }} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy style={{ width: 13, height: 13 }} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 16,
          borderTop: 'var(--border-width-layout, 1px) solid var(--border-subtle)',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
          Public visitors have view-only access.
        </span>

        <button
          type="button"
          onClick={onClose}
          className="brutalist-hover"
          style={{
            background: 'var(--bg-hover)',
            border: 'var(--border-width-layout, 1px) solid var(--border)',
            borderRadius: 'var(--radius-sm, 6px)',
            color: 'var(--text-primary)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.02em',
            padding: '8px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          CLOSE PANEL
        </button>
      </div>

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
