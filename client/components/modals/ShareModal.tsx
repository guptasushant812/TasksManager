'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Copy, RefreshCw, Globe } from 'lucide-react';

interface ShareModalProps {
  onClose: () => void;
}

export default function ShareModal({ onClose }: ShareModalProps) {
  const { settings, loading, toggleShare, regenerateToken } = useSettings();
  const [copied, setCopied] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
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
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  };

  const handleRegenerate = async () => {
    if (confirm('Are you sure? Anyone with the old link will immediately lose access.')) {
      setIsToggling(true);
      await regenerateToken();
      setIsToggling(false);
    }
  };

  return (
    <div>
      <div className="card" style={{ padding: 24, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe style={{ width: 16, height: 16, color: 'var(--accent)' }} />
            Enable Public Sharing
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Anyone with the link can view your tasks.
          </p>
        </div>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={settings.isPublicShareEnabled} 
            onChange={handleToggle}
            disabled={isToggling}
            style={{ accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer' }} 
          />
          <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 13 }}>Active</span>
        </label>
      </div>

      {settings.isPublicShareEnabled && (
        <div className="animate-fade-in card" style={{ padding: 20 }}>
          <label className="label">Your Public Link</label>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input 
              className="input" 
              value={shareUrl} 
              readOnly 
              style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)' }} 
            />
            <button className="btn btn-primary" onClick={handleCopy} style={{ minWidth: 100, justifyContent: 'center' }}>
              {copied ? '✓ Copied' : <><Copy style={{ width: 14, height: 14 }} /> Copy</>}
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Share securely with your team or clients.</span>
            <button className="btn btn-ghost" onClick={handleRegenerate} disabled={isToggling} style={{ fontSize: 12, padding: '4px 8px', color: 'var(--high)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <RefreshCw style={{ width: 12, height: 12 }} />
              Regenerate Link
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', textAlign: 'right' }}>
        <button className="btn btn-ghost" onClick={onClose}>Close Panel</button>
      </div>
    </div>
  );
}
