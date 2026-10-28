'use client';
import { useState } from 'react';
import { Sparkles, Clock, Key, ArrowRight, ExternalLink, RefreshCw, X, Check, ShieldCheck, Cpu } from 'lucide-react';
import { RateLimitState } from '@/hooks/useAiDraft';

interface AiQuotaModalProps {
  rateLimitInfo: RateLimitState;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  customApiKey: string;
  onSaveCustomKey: (key: string, provider: string) => void;
  onRetry: (keyOverride?: string, providerOverride?: string) => void;
  onSwitchToManual?: () => void;
  onClose: () => void;
}

export default function AiQuotaModal({
  rateLimitInfo,
  selectedModel,
  onSelectModel,
  customApiKey,
  onSaveCustomKey,
  onRetry,
  onSwitchToManual,
  onClose,
}: AiQuotaModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState(customApiKey || '');
  const [showKeyForm, setShowKeyForm] = useState(true);
  const [keySaved, setKeySaved] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSaveKey = async () => {
    const key = apiKeyInput.trim();
    if (!key) return;
    setValidationError(null);
    setValidating(true);
    const provider = key.startsWith('gsk_') ? 'groq' : key.startsWith('xai-') ? 'grok' : 'gemini';

    try {
      const res = await fetch('/api/ai-draft/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, provider }),
      });
      const data = await res.json().catch(() => ({ valid: true }));
      if (data && data.valid === false) {
        setValidationError(data.message || 'Key validation failed. Please check your key.');
        setValidating(false);
        return;
      }
    } catch {
      // Proceed on network test failure
    }

    setValidating(false);
    onSaveCustomKey(key, provider);
    setKeySaved(true);
    setTimeout(() => {
      onRetry(key, provider);
    }, 150);
  };

  const handleClearKey = () => {
    setApiKeyInput('');
    onSaveCustomKey('', 'gemini');
    setKeySaved(false);
    setValidationError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'var(--bg-surface, #121218)',
          border: '2px solid var(--border, #2a2a38)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-lg, 14px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90dvh',
        }}
      >
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-subtle, #1e1e28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-elevated, #171720)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: rateLimitInfo.isCustomKeyError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                border: rateLimitInfo.isCustomKeyError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: rateLimitInfo.isCustomKeyError ? '#ef4444' : '#eab308',
              }}
            >
              <Sparkles style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                {rateLimitInfo.isCustomKeyError ? 'AI Key Verification Needed' : 'Daily AI Limit Reached'}
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Your text is safely preserved — enter a key or switch to manual
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div
          style={{
            padding: '20px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {rateLimitInfo.isCustomKeyError ? (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md, 10px)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontSize: 13, fontWeight: 700 }}>
                <Key style={{ width: 16, height: 16 }} />
                <span>Custom Key Error</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {rateLimitInfo.message}
              </p>
            </div>
          ) : (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md, 10px)',
                background: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#facc15', fontSize: 13, fontWeight: 700 }}>
                <Clock style={{ width: 16, height: 16 }} />
                <span>Standard Model Quota Exhausted</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                The free-tier daily request allowance on the default AI endpoint has reached its limit. Enter your own free Gemini API key below to continue without waiting.
                {rateLimitInfo.retryAfter && (
                  <span style={{ display: 'block', marginTop: 4, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Estimated quota reset: {rateLimitInfo.retryAfter}
                  </span>
                )}
              </p>
            </div>
          )}

          <div
            style={{
              border: '1px solid var(--border-subtle, #1e1e28)',
              borderRadius: 'var(--radius-md, 10px)',
              background: 'var(--bg-elevated, #171720)',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setShowKeyForm(!showKeyForm)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key style={{ width: 15, height: 15, color: '#38bdf8' }} />
                <span>1. Add Your Own Free API Key (Unlimited)</span>
              </div>
              <span style={{ fontSize: 11, color: '#38bdf8' }}>
                {showKeyForm ? 'Hide' : 'Enter key →'}
              </span>
            </button>

            {showKeyForm && (
              <div style={{ padding: '0 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border-subtle)' }}>
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  You can get a free Google Gemini key in under 30 seconds from Google AI Studio. It is stored securely on your browser.
                </p>

                {customApiKey && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(0, 255, 102, 0.06)', border: '1px solid rgba(0, 255, 102, 0.2)', borderRadius: 6, fontSize: 11 }}>
                    <span style={{ color: 'var(--accent, #00ff66)', fontWeight: 600 }}>
                      Active saved key: ••••••••{customApiKey.slice(-4)}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearKey}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, textDecoration: 'underline' }}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {validationError && (
                  <div style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 6, fontSize: 11.5, color: '#f87171' }}>
                    {validationError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="password"
                    placeholder="AIzaSy... or AQ.Ab8..."
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      setValidationError(null);
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--bg-surface)',
                      border: validationError ? '1px solid #ef4444' : '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveKey}
                    disabled={!apiKeyInput.trim() || validating}
                    style={{
                      background: 'var(--accent, #00ff66)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: validating ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      opacity: apiKeyInput.trim() && !validating ? 1 : 0.6,
                    }}
                  >
                    {validating ? <RefreshCw className="animate-spin" style={{ width: 14, height: 14 }} /> : keySaved ? <Check style={{ width: 14, height: 14 }} /> : <ShieldCheck style={{ width: 14, height: 14 }} />}
                    {validating ? 'Verifying...' : keySaved ? 'Saved!' : 'Save & Retry'}
                  </button>
                </div>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 11.5,
                    color: '#38bdf8',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontWeight: 600,
                  }}
                >
                  Get free Gemini API key on Google AI Studio <ExternalLink style={{ width: 12, height: 12 }} />
                </a>
              </div>
            )}
          </div>

          {onSwitchToManual && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 8, border: '1px dashed var(--border)' }}>
              <div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                  2. Don't want to wait?
                </span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                  Transfer your draft directly into the manual form
                </span>
              </div>
              <button
                type="button"
                onClick={onSwitchToManual}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Use Manual Form
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border-subtle, #1e1e28)',
            background: 'var(--bg-surface, #121218)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ fontSize: 13, padding: '8px 16px' }}
          >
            Back to Draft
          </button>
          <button
            type="button"
            onClick={() => {
              const key = apiKeyInput.trim();
              if (key) {
                const provider = key.startsWith('gsk_') ? 'groq' : key.startsWith('xai-') ? 'grok' : 'gemini';
                onSaveCustomKey(key, provider);
                onRetry(key, provider);
              } else if (customApiKey) {
                const provider = customApiKey.startsWith('gsk_') ? 'groq' : customApiKey.startsWith('xai-') ? 'grok' : 'gemini';
                onRetry(customApiKey, provider);
              } else {
                onRetry();
              }
            }}
            className="btn btn-primary"
            style={{
              background: 'var(--accent, #00ff66)',
              color: '#000',
              fontWeight: 800,
              fontSize: 13,
              padding: '8px 20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
            Retry with Gemini
          </button>
        </div>
      </div>
    </div>
  );
}
