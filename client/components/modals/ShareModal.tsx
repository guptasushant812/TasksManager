'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '@/hooks/useSettings';
import {
  Globe,
  Link2,
  Copy,
  Check,
  RefreshCw,
  X,
  AlertTriangle,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface ShareModalProps {
  onClose: () => void;
}

export default function ShareModal({ onClose }: ShareModalProps) {
  const { settings, loading, toggleShare, regenerateToken } = useSettings();
  const [copied, setCopied] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showRegenerateConfirm) {
          setShowRegenerateConfirm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRegenerateConfirm, onClose]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  if (!mounted) return null;

  const shareUrl = typeof window !== 'undefined' && settings?.publicShareToken
    ? `${window.location.origin}/status/${settings.publicShareToken}`
    : '';

  const handleToggle = async () => {
    if (!settings || isToggling) return;
    setIsToggling(true);
    try {
      await toggleShare(!settings.isPublicShareEnabled);
    } finally {
      setIsToggling(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2400);
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
    <>
      {createPortal(
        <div
          className="modal-overlay share-modal-overlay"
          onClick={onClose}
        >
          <div
            className="modal-box share-modal-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            aria-describedby="share-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="share-modal-header">
              <div>
                <h3 id="share-modal-title" className="share-modal-title">
                  Share Public Link
                </h3>
                <p id="share-modal-desc" className="share-modal-desc">
                  Anyone with this link will be able to view this page.
                </p>
              </div>
              <button
                type="button"
                className="share-modal-close-btn"
                onClick={onClose}
                aria-label="Close share modal"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {loading || !settings ? (
              <div style={{ padding: '44px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div
                  className="animate-spin"
                  style={{
                    width: 26,
                    height: 26,
                    border: '2px solid var(--border)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                    margin: '0 auto 12px',
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 500 }}>Loading share settings…</span>
              </div>
            ) : (
              <div>
                <div className={`share-access-card ${settings.isPublicShareEnabled ? 'active' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <div className={`share-access-icon-wrap ${settings.isPublicShareEnabled ? 'active' : 'inactive'}`}>
                      <Globe style={{ width: 20, height: 20 }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          Public Access
                        </span>
                        <span className={`share-access-badge ${settings.isPublicShareEnabled ? 'active' : 'inactive'}`}>
                          <span className="share-access-badge-dot" />
                          {settings.isPublicShareEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.35 }}>
                        {settings.isPublicShareEnabled
                          ? 'Link is active and accessible to visitors'
                          : 'Link is disabled and blocked from access'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.isPublicShareEnabled}
                    aria-label="Toggle public access"
                    disabled={isToggling}
                    onClick={handleToggle}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggle();
                      }
                    }}
                    className={`share-switch ${settings.isPublicShareEnabled ? 'active' : 'inactive'}`}
                  >
                    <span className="share-switch-thumb" />
                  </button>
                </div>

                {settings.isPublicShareEnabled ? (
                  <div className="share-url-card share-card-enter">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Link2 style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Direct URL
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowRegenerateConfirm(true)}
                        disabled={isToggling}
                        className="share-regen-btn"
                        title="Generate a new secure link (invalidates the existing link)"
                        aria-label="Regenerate link"
                      >
                        <RefreshCw
                          style={{ width: 12, height: 12 }}
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
                        aria-label="Public board share URL. Click to copy."
                        title="Click to copy link"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCopy();
                          }
                        }}
                      >
                        <Link2 className="share-url-icon" />
                        <div className="share-url-text">
                          {shareUrl}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopy}
                        className={`share-copy-btn ${copied ? 'copied' : ''}`}
                        aria-label={copied ? 'Link copied' : 'Copy link to clipboard'}
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
                ) : (
                  <div className="share-paused-card share-card-enter">
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-md, 10px)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      <Lock style={{ width: 16, height: 16 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Public sharing is paused
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                        Turn on Public Access above whenever you want to generate and share your live board link.
                      </div>
                    </div>
                  </div>
                )}

                <div className="share-modal-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
                    <ShieldCheck
                      style={{ width: 15, height: 15, color: 'var(--completed, #10b981)', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                      Public visitors have view-only access.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="share-footer-close-btn"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {showRegenerateConfirm &&
        createPortal(
          <div
            className="app-dialog-overlay"
            style={{ zIndex: 1100 }}
            onClick={() => setShowRegenerateConfirm(false)}
          >
            <div
              className="app-dialog-box"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="share-regen-title"
              aria-describedby="share-regen-desc"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 440,
                width: 'min(440px, calc(100vw - 28px))',
                margin: 'auto',
              }}
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
                    <h3 id="share-regen-title" className="app-dialog-title">
                      Regenerate Link?
                    </h3>
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
                <p id="share-regen-desc" className="app-dialog-desc">
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
          </div>,
          document.body
        )}
    </>
  );
}
