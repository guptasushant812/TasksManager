'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/api';
import { 
  Sparkles, 
  Zap, 
  Cpu, 
  Key, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Save, 
  Trash2, 
  RefreshCw, 
  ExternalLink,
  RotateCcw,
  X
} from 'lucide-react';

interface AiKeys {
  gemini: string;
  groq: string;
  grok: string;
}

type ProviderKey = 'gemini' | 'groq' | 'grok';

interface ValidationState {
  status: 'idle' | 'validating' | 'valid' | 'invalid';
  message?: string;
}

interface ModelOption {
  id: string;
  name: string;
  tag: string;
  description: string;
  icon: typeof Sparkles;
  isRecommended?: boolean;
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'auto',
    name: 'Automatic Backup',
    tag: 'Most Reliable',
    description: 'Uses Google Gemini first. If limits are reached, it automatically switches to Groq or xAI Grok so your work is never interrupted.',
    icon: Sparkles,
    isRecommended: true,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Google Gemini',
    tag: 'Fast & Balanced',
    description: 'Great for everyday use. Quickly turns rough notes and thoughts into clean, organized tasks.',
    icon: Zap,
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'Groq',
    tag: 'Fastest Speed',
    description: 'Delivers near-instant responses. Best when you want your tasks drafted with zero waiting time.',
    icon: Cpu,
  },
  {
    id: 'grok-4.7',
    name: 'xAI Grok',
    tag: 'Best for Complex Notes',
    description: 'Handles long, detailed descriptions and complicated instructions with high attention to detail.',
    icon: Cpu,
  },
];

const PROVIDER_METADATA: Record<ProviderKey, { name: string; consoleUrl: string; placeholder: string; prefixHint: string }> = {
  gemini: {
    name: 'Google Gemini',
    consoleUrl: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIzaSy... or AQ.Ab8...',
    prefixHint: 'Starts with AIzaSy or AQ',
  },
  groq: {
    name: 'Groq',
    consoleUrl: 'https://console.groq.com/keys',
    placeholder: 'gsk_...',
    prefixHint: 'Starts with gsk_',
  },
  grok: {
    name: 'xAI Grok',
    consoleUrl: 'https://console.x.ai/',
    placeholder: 'xai-...',
    prefixHint: 'Starts with xai-',
  },
};

export default function AiEngineConfig() {
  const [mounted, setMounted] = useState(false);
  const [preferredModel, setPreferredModel] = useState('auto');
  const [activeProvider, setActiveProvider] = useState<ProviderKey>('gemini');
  
  const [savedKeys, setSavedKeys] = useState<AiKeys>({ gemini: '', groq: '', grok: '' });
  const [inputKeys, setInputKeys] = useState<AiKeys>({ gemini: '', groq: '', grok: '' });
  const [validations, setValidations] = useState<Record<ProviderKey, ValidationState>>({
    gemini: { status: 'idle' },
    groq: { status: 'idle' },
    grok: { status: 'idle' },
  });

  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (type: 'success' | 'danger', message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const debounceTimers = useRef<Record<ProviderKey, NodeJS.Timeout | null>>({
    gemini: null,
    groq: null,
    grok: null,
  });

  const latestInputRef = useRef<AiKeys>(inputKeys);
  latestInputRef.current = inputKeys;

  useEffect(() => {
    setMounted(true);
    let active = true;
    apiFetch<any>('/api/settings')
      .then((data) => {
        if (!active || !data) return;
        if (data.preferredAiModel) {
          setPreferredModel(data.preferredAiModel);
        }
        if (data.activeAiProvider && ['gemini', 'groq', 'grok'].includes(data.activeAiProvider)) {
          setActiveProvider(data.activeAiProvider);
        }
        if (data.aiKeys && typeof data.aiKeys === 'object') {
          const loaded: AiKeys = {
            gemini: (data.aiKeys.gemini || '').trim(),
            groq: (data.aiKeys.groq || '').trim(),
            grok: (data.aiKeys.grok || '').trim(),
          };
          setSavedKeys(loaded);
          setInputKeys(loaded);

          setValidations({
            gemini: loaded.gemini ? { status: 'valid', message: 'Active & Verified' } : { status: 'idle' },
            groq: loaded.groq ? { status: 'valid', message: 'Active & Verified' } : { status: 'idle' },
            grok: loaded.grok ? { status: 'valid', message: 'Active & Verified' } : { status: 'idle' },
          });
        }
      })
      .catch(() => {});

    return () => {
      active = false;
      Object.values(debounceTimers.current).forEach((t) => {
        if (t) clearTimeout(t);
      });
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleSelectModel = async (modelId: string) => {
    setPreferredModel(modelId);
    try {
      await apiFetch('/api/settings', {
        method: 'PATCH',
        body: { preferredAiModel: modelId },
      });
      const selectedModelName = MODEL_OPTIONS.find((m) => m.id === modelId)?.name || modelId;
      showToast('success', `Preferred AI model set to ${selectedModelName}.`);
    } catch {
      showToast('danger', 'Failed to update preferred AI model.');
    }
  };

  const validateKeyOnline = async (provider: ProviderKey, keyToTest: string) => {
    try {
      const data = await apiFetch<{ valid: boolean; message?: string }>('/api/ai-draft/validate-key', {
        method: 'POST',
        body: { apiKey: keyToTest, provider },
      });

      if (latestInputRef.current[provider].trim() !== keyToTest) return;

      if (data?.valid) {
        setValidations((prev) => ({
          ...prev,
          [provider]: {
            status: 'valid',
            message: `Key verified successfully with ${PROVIDER_METADATA[provider].name}.`,
          },
        }));
      } else {
        setValidations((prev) => ({
          ...prev,
          [provider]: {
            status: 'invalid',
            message: data?.message || 'Key validation failed. Please check the key.',
          },
        }));
      }
    } catch (err: any) {
      if (latestInputRef.current[provider].trim() !== keyToTest) return;
      const msg = err?.message || 'Could not connect to validation service. Please check your network.';
      setValidations((prev) => ({
        ...prev,
        [provider]: {
          status: 'invalid',
          message: msg,
        },
      }));
    }
  };

  const handleKeyChange = (val: string) => {
    const trimmed = val.trim();

    let targetProvider = activeProvider;
    if (trimmed.startsWith('xai-') && activeProvider !== 'grok') {
      targetProvider = 'grok';
      setActiveProvider('grok');
    } else if (trimmed.startsWith('gsk_') && activeProvider !== 'groq') {
      targetProvider = 'groq';
      setActiveProvider('groq');
    } else if (trimmed.startsWith('AIzaSy') && activeProvider !== 'gemini') {
      targetProvider = 'gemini';
      setActiveProvider('gemini');
    }

    setInputKeys((prev) => ({ ...prev, [targetProvider]: val }));

    if (debounceTimers.current[targetProvider]) {
      clearTimeout(debounceTimers.current[targetProvider]!);
      debounceTimers.current[targetProvider] = null;
    }

    const currentSavedKey = (savedKeys[targetProvider] || '').trim();

    if (trimmed && trimmed === currentSavedKey) {
      setValidations((prev) => ({
        ...prev,
        [targetProvider]: { status: 'valid', message: 'Active & Verified' },
      }));
      return;
    }

    if (!trimmed) {
      setValidations((prev) => ({
        ...prev,
        [targetProvider]: { status: 'idle' },
      }));
      return;
    }

    if (trimmed.length < 8) {
      setValidations((prev) => ({
        ...prev,
        [targetProvider]: { status: 'idle' },
      }));
      return;
    }

    setValidations((prev) => ({
      ...prev,
      [targetProvider]: {
        status: 'validating',
        message: `Verifying key with ${PROVIDER_METADATA[targetProvider].name}...`,
      },
    }));

    debounceTimers.current[targetProvider] = setTimeout(() => {
      validateKeyOnline(targetProvider, trimmed);
    }, 500);
  };

  const handleSaveOrUpdateKey = async () => {
    const currentInput = (inputKeys[activeProvider] || '').trim();
    const isExistingKey = Boolean(savedKeys[activeProvider]?.trim());
    const isCurrentlyModified = currentInput !== (savedKeys[activeProvider] || '').trim();
    const provName = PROVIDER_METADATA[activeProvider].name;

    if (!currentInput) {
      showToast('danger', `Please enter a valid ${provName} API key.`);
      return;
    }

    if (isSaving) return;

    if (debounceTimers.current[activeProvider]) {
      clearTimeout(debounceTimers.current[activeProvider]!);
      debounceTimers.current[activeProvider] = null;
    }

    if (isExistingKey && !isCurrentlyModified && validations[activeProvider]?.status === 'valid') {
      setSaveStatus('Key verified');
      setTimeout(() => setSaveStatus(null), 2500);
      showToast('success', `${provName} key is verified and up to date.`);
      return;
    }

    setIsSaving(true);

    try {
      let isKeyValid = validations[activeProvider]?.status === 'valid' && !isCurrentlyModified;

      if (!isKeyValid) {
        setValidations((prev) => ({
          ...prev,
          [activeProvider]: { status: 'validating', message: `Verifying key with ${provName}...` },
        }));

        const data = await apiFetch<{ valid: boolean; message?: string }>('/api/ai-draft/validate-key', {
          method: 'POST',
          body: { apiKey: currentInput, provider: activeProvider },
        });

        if (data?.valid) {
          isKeyValid = true;
          setValidations((prev) => ({
            ...prev,
            [activeProvider]: { status: 'valid', message: 'Active & Verified' },
          }));
        } else {
          const errText = data?.message || `Invalid ${provName} API key. Please check your key.`;
          setValidations((prev) => ({
            ...prev,
            [activeProvider]: { status: 'invalid', message: errText },
          }));
          showToast('danger', errText);
          setIsSaving(false);
          return;
        }
      }

      const nextSaved = { ...savedKeys, [activeProvider]: currentInput };
      await apiFetch('/api/settings', {
        method: 'PATCH',
        body: {
          aiKeys: nextSaved,
          activeAiProvider: activeProvider,
        },
      });

      setSavedKeys(nextSaved);
      setValidations((prev) => ({
        ...prev,
        [activeProvider]: { status: 'valid', message: 'Active & Verified' },
      }));
      setSaveStatus(isExistingKey ? 'Key updated' : 'Key saved');
      setTimeout(() => setSaveStatus(null), 2500);

      showToast(
        'success',
        isExistingKey ? `${provName} API key updated successfully!` : `${provName} API key saved successfully!`
      );
    } catch (err: any) {
      const msg = err?.message || 'Failed to save key to cloud database.';
      setValidations((prev) => ({
        ...prev,
        [activeProvider]: { status: 'invalid', message: msg },
      }));
      showToast('danger', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    const nextSaved = { ...savedKeys, [activeProvider]: '' };

    try {
      await apiFetch('/api/settings', {
        method: 'PATCH',
        body: {
          aiKeys: nextSaved,
        },
      });

      setSavedKeys(nextSaved);
      setInputKeys((prev) => ({ ...prev, [activeProvider]: '' }));
      setValidations((prev) => ({
        ...prev,
        [activeProvider]: { status: 'idle' },
      }));
      setSaveStatus('Key deleted');
      setTimeout(() => setSaveStatus(null), 2500);

      const provName = PROVIDER_METADATA[activeProvider].name;
      showToast('danger', `${provName} API key removed.`);
    } catch {
      setValidations((prev) => ({
        ...prev,
        [activeProvider]: {
          status: 'invalid',
          message: 'Failed to delete key. Please try again.',
        },
      }));
      showToast('danger', 'Failed to delete key. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRevertKey = () => {
    const original = savedKeys[activeProvider] || '';
    setInputKeys((prev) => ({ ...prev, [activeProvider]: original }));
    setValidations((prev) => ({
      ...prev,
      [activeProvider]: original
        ? { status: 'valid', message: 'Active & Verified' }
        : { status: 'idle' },
    }));
  };

  const currentProviderMeta = PROVIDER_METADATA[activeProvider];
  const currentInputValue = inputKeys[activeProvider] || '';
  const currentSavedValue = savedKeys[activeProvider] || '';
  const hasSavedKey = Boolean(currentSavedValue.trim());
  const isModified = currentInputValue.trim() !== currentSavedValue.trim();
  const currentValidation = validations[activeProvider];

  const isPrimaryDisabled = isSaving || (!hasSavedKey && !currentInputValue.trim());

  return (
    <section className="settings-card ai-config-card" aria-labelledby="ai-config-heading">
      <div className="settings-row">
        <div className="settings-row-text">
          <h2 id="ai-config-heading" className="settings-row-title ai-heading-row">
            <Sparkles size={18} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <span>AI Assistant Settings</span>
          </h2>
          <p className="settings-row-desc">
            Choose which AI helps you draft tasks, or keep automatic backup enabled so your work is never paused by daily limits.
          </p>
        </div>
      </div>

      <div className="ai-section-body">
        <div className="ai-subheading-row">
          <label className="ai-subheading-title">Preferred AI Model</label>
          <span className="ai-subheading-note">Pick a single model or let the app switch automatically</span>
        </div>

        <div className="ai-model-grid" role="radiogroup" aria-label="Preferred AI Model">
          {MODEL_OPTIONS.map((m) => {
            const isSelected = preferredModel === m.id;
            const Icon = m.icon;

            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectModel(m.id)}
                className={`ai-model-card ${isSelected ? 'active' : ''}`}
              >
                <div className="ai-model-card-header">
                  <div className="ai-model-card-title-wrap">
                    <Icon size={16} className="ai-model-icon" aria-hidden="true" />
                    <span className="ai-model-name">{m.name}</span>
                  </div>
                  <div className="ai-model-radio" aria-hidden="true">
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                <div className="ai-model-tags">
                  <span className="ai-model-tag">{m.tag}</span>
                  {m.isRecommended && <span className="ai-model-badge-rec">Recommended</span>}
                </div>

                <p className="ai-model-desc">{m.description}</p>
              </button>
            );
          })}
        </div>

        <div className="ai-route-banner" role="status">
          <div className="ai-route-banner-main">
            <span className="ai-route-pulse" aria-hidden="true" />
            <span className="ai-route-label">
              {preferredModel === 'auto' ? (
                <>
                  <strong>Active Route:</strong> Google Gemini ➔ Groq ➔ xAI Grok (switches automatically if needed)
                </>
              ) : (
                <>
                  <strong>Direct Route:</strong> Using{' '}
                  {MODEL_OPTIONS.find((m) => m.id === preferredModel)?.name || preferredModel} only
                </>
              )}
            </span>
          </div>

          {preferredModel !== 'auto' && (
            <button
              type="button"
              onClick={() => handleSelectModel('auto')}
              className="ai-route-switch-btn"
            >
              Switch to Automatic Backup
            </button>
          )}
        </div>
      </div>

      <div className="ai-keys-section">
        <div className="ai-keys-header">
          <div className="ai-keys-header-title">
            <Key size={16} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <label className="ai-subheading-title">Personal API Keys</label>
            <span className="ai-optional-pill">Optional</span>
          </div>
          {saveStatus && (
            <span className="ai-save-badge animate-fade-in" role="status">
              <CheckCircle2 size={13} aria-hidden="true" />
              <span>{saveStatus}</span>
            </span>
          )}
        </div>

        <p className="settings-row-desc">
          Free shared AI usage is already included. If you have your own provider key, you can add it here for private, uninterrupted access.
        </p>

        <div className="ai-provider-tabs" role="tablist" aria-label="API Providers">
          {(['gemini', 'groq', 'grok'] as ProviderKey[]).map((prov) => {
            const isSaved = Boolean(savedKeys[prov]?.trim());
            const isActive = activeProvider === prov;

            return (
              <button
                key={prov}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveProvider(prov);
                  setShowKey(false);
                }}
                className={`ai-provider-tab ${isActive ? 'active' : ''}`}
              >
                <span>{PROVIDER_METADATA[prov].name}</span>
                {isSaved && <span className="ai-tab-dot" title="Key saved and active" />}
              </button>
            );
          })}
        </div>

        <div className="ai-key-input-block">
          <div className="ai-key-input-row">
            <div className="ai-input-wrap">
              <input
                type={showKey ? 'text' : 'password'}
                value={currentInputValue}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder={currentProviderMeta.placeholder}
                className="ai-key-input"
                aria-label={`${currentProviderMeta.name} API Key`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Hide key' : 'Show key'}
                className="ai-input-eye-btn"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div className="ai-key-actions">
              <button
                type="button"
                onClick={handleSaveOrUpdateKey}
                disabled={isPrimaryDisabled}
                className="ai-btn-primary"
              >
                {isSaving ? (
                  <RefreshCw size={13} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Save size={13} aria-hidden="true" />
                )}
                <span>
                  {isSaving 
                    ? (hasSavedKey ? 'Updating...' : 'Saving...') 
                    : (hasSavedKey ? 'Update Key' : 'Save Key')}
                </span>
              </button>

              {hasSavedKey && isModified && (
                <button
                  type="button"
                  onClick={handleRevertKey}
                  title="Revert to saved key"
                  className="ai-btn-ghost"
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  <span>Cancel</span>
                </button>
              )}

              {hasSavedKey && (
                <button
                  type="button"
                  onClick={handleDeleteKey}
                  disabled={isDeleting || isSaving}
                  title="Delete key from database"
                  className="ai-btn-danger"
                >
                  {isDeleting ? (
                    <RefreshCw size={13} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 size={13} aria-hidden="true" />
                  )}
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="ai-key-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ai-key-hint">{currentProviderMeta.prefixHint}</span>
              {hasSavedKey && !isModified && (
                <span className="ai-status-pill saved">
                  <CheckCircle2 size={12} aria-hidden="true" />
                  <span>Active & Verified</span>
                </span>
              )}
            </div>

            <a
              href={currentProviderMeta.consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ai-console-link"
            >
              <span>Get API key from {currentProviderMeta.name}</span>
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>

          {currentValidation.status === 'validating' && (
            <div className="ai-test-alert validating animate-fade-in" role="status">
              <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
              <span>{currentValidation.message || 'Verifying key...'}</span>
            </div>
          )}

          {isModified && currentValidation.status === 'valid' && (
            <div className="ai-test-alert success animate-fade-in" role="status">
              <CheckCircle2 size={14} aria-hidden="true" />
              <span>{currentValidation.message || 'Key verified. Ready to save.'}</span>
            </div>
          )}

          {currentValidation.status === 'invalid' && (
            <div className="ai-test-alert error animate-fade-in" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              <span>{currentValidation.message || 'Key validation failed.'}</span>
            </div>
          )}
        </div>
      </div>

      {mounted && toast && typeof document !== 'undefined' && createPortal(
        <div className={`app-toast app-toast-${toast.type}`} role="status" aria-live="polite">
          <div className="app-toast-icon">
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          </div>
          <span className="app-toast-text">{toast.message}</span>
          <button
            type="button"
            className="app-toast-dismiss"
            onClick={() => setToast(null)}
            aria-label="Dismiss toast"
          >
            <X size={14} />
          </button>
        </div>,
        document.body
      )}
    </section>
  );
}
