'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Copy, RefreshCw, Globe, AlertTriangle, CheckCircle2, X } from 'lucide-react';

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
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 12px' }} />
        Loading sharing settings…
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
      <div className="card" style={{ padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ minWidth: 220, flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe style={{ width: 17, height: 17, color: 'var(--accent)' }} />
            Enable Public Sharing
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Anyone with the public link can view your active tasks board.
          </p>
        </div>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
          <input 
            type="checkbox" 
            checked={settings.isPublicShareEnabled} 
            onChange={handleToggle}
            disabled={isToggling}
            style={{ accentColor: 'var(--accent)', width: 18, height: 18, cursor: 'pointer' }} 
          />
          <span style={{ color: settings.isPublicShareEnabled ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 700, fontSize: 13 }}>
            {settings.isPublicShareEnabled ? 'Active' : 'Disabled'}
          </span>
        </label>
      </div>

      {settings.isPublicShareEnabled && (
        <div className="animate-fade-in card" style={{ padding: '18px 20px' }}>
          <label className="label" style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Public Link</label>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input 
              className="input" 
              value={shareUrl} 
              readOnly 
              style={{ flex: 1, minWidth: 220, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)' }} 
            />
            <button 
              type="button"
              className="btn btn-primary" 
              onClick={handleCopy} 
              style={{ minWidth: 110, justifyContent: 'center' }}
            >
              {copied ? '✓ Copied' : <><Copy style={{ width: 14, height: 14 }} /> Copy Link</>}
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Share securely with your team or clients.</span>
            <button 
              type="button"
              className="btn btn-ghost" 
              onClick={() => setShowRegenerateConfirm(true)} 
              disabled={isToggling} 
              style={{ fontSize: 12, padding: '6px 10px', color: 'var(--high)', borderColor: 'rgba(239, 68, 68, 0.25)' }}
            >
              <RefreshCw style={{ width: 12, height: 12 }} />
              Regenerate Link
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', textAlign: 'right' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Close Panel</button>
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
