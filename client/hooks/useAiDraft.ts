'use client';
import { useState, useCallback, useEffect } from 'react';
import { TaskDraft } from '@/types/task';
import { apiFetch } from '@/lib/api';

export interface RateLimitState {
  isExceeded: boolean;
  message: string;
  exhaustedProviders: string[];
  retryAfter?: string;
  isCustomKeyError?: boolean;
}

interface AiDraftResponse {
  drafts?: TaskDraft[];
  warning?: string;
  rateLimitExceeded?: boolean;
  apiKeyError?: boolean;
  message?: string;
  exhaustedProviders?: string[];
  retryAfter?: string;
  providerUsed?: string;
  modelUsed?: string;
  fallbackTriggered?: boolean;
  fallbackReason?: string;
}

interface AiRegenResponse {
  task?: TaskDraft;
  warning?: string;
  rateLimitExceeded?: boolean;
  apiKeyError?: boolean;
  message?: string;
  exhaustedProviders?: string[];
  retryAfter?: string;
  providerUsed?: string;
  modelUsed?: string;
  fallbackTriggered?: boolean;
  fallbackReason?: string;
}

export function useAiDraft() {
  const [loading, setLoading] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitState | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [customProvider, setCustomProvider] = useState<string>('gemini');

  const getStoredUserKeys = useCallback((): { gemini?: string; groq?: string; grok?: string } => {
    if (typeof window === 'undefined') return {};
    const gemini = localStorage.getItem('tasksmanager_ai_key_gemini') || '';
    const groq = localStorage.getItem('tasksmanager_ai_key_groq') || '';
    const grok = localStorage.getItem('tasksmanager_ai_key_grok') || '';
    const legacyKey = localStorage.getItem('tasksmanager_custom_ai_key') || '';
    const legacyProvider = localStorage.getItem('tasksmanager_custom_ai_provider') || '';

    const keys: { gemini?: string; groq?: string; grok?: string } = {};
    if (gemini) keys.gemini = gemini;
    if (groq) keys.groq = groq;
    if (grok) keys.grok = grok;

    if (legacyKey) {
      if (legacyKey.startsWith('xai-') || legacyProvider === 'grok') {
        if (!keys.grok) keys.grok = legacyKey;
      } else if (legacyKey.startsWith('gsk_') || legacyProvider === 'groq') {
        if (!keys.groq) keys.groq = legacyKey;
      } else {
        if (!keys.gemini) keys.gemini = legacyKey;
      }
    }
    return keys;
  }, []);

  // Hydrate custom key and preference from cloud settings
  useEffect(() => {
    apiFetch<any>('/api/settings')
      .then((data) => {
        if (data?.preferredAiModel) setSelectedModel(data.preferredAiModel);
        const prov = (data?.activeAiProvider || 'gemini') as 'gemini' | 'groq' | 'grok';
        setCustomProvider(prov);
        if (data?.aiKeys && typeof data.aiKeys === 'object') {
          const key = data.aiKeys[prov] || data.aiKeys.gemini || data.aiKeys.groq || data.aiKeys.grok || '';
          if (key) setCustomApiKey(key);
        }
      })
      .catch(() => {});
  }, []);

  const updateSelectedModel = useCallback((model: string) => {
    setSelectedModel(model);
    apiFetch('/api/settings', {
      method: 'PATCH',
      body: { preferredAiModel: model },
    }).catch(() => {});
  }, []);

  const updateCustomApiKey = useCallback((key: string, provider: string = 'gemini') => {
    const trimmed = key.trim();
    setCustomApiKey(trimmed);
    setCustomProvider(provider);
    apiFetch('/api/settings', {
      method: 'PATCH',
      body: {
        aiKeys: { [provider]: trimmed },
        activeAiProvider: provider,
      },
    }).catch(() => {});
  }, []);

  const clearRateLimit = useCallback(() => {
    setRateLimitInfo(null);
  }, []);

  const clearFallbackNotice = useCallback(() => {
    setFallbackNotice(null);
  }, []);

  const generateDrafts = useCallback(async (
    rawText: string,
    keyOverride?: string,
    providerOverride?: string
  ): Promise<TaskDraft[] | null> => {
    setLoading(true);
    setError(null);
    setWarning(null);
    setRateLimitInfo(null);
    setFallbackNotice(null);

    const storedKey = typeof window !== 'undefined' ? localStorage.getItem('tasksmanager_custom_ai_key') : null;
    const storedProvider = typeof window !== 'undefined' ? localStorage.getItem('tasksmanager_custom_ai_provider') : null;

    const effectiveKey = (keyOverride ?? (customApiKey || undefined) ?? (storedKey || undefined) ?? '').trim();
    const effectiveProvider = (providerOverride ?? (customProvider || undefined) ?? (storedProvider || undefined) ?? 'gemini').trim();

    const userKeys = getStoredUserKeys();
    if (effectiveKey) {
      userKeys[effectiveProvider as 'gemini' | 'groq' | 'grok'] = effectiveKey;
    }

    try {
      const res = await apiFetch<AiDraftResponse>('/api/ai-draft', {
        method: 'POST',
        body: { 
          rawText,
          preferredModel: selectedModel !== 'auto' ? selectedModel : undefined,
          customApiKey: effectiveKey || undefined,
          customProvider: effectiveKey ? effectiveProvider : undefined,
          userApiKeys: Object.values(userKeys).some(Boolean) ? userKeys : undefined,
        },
      });

      if (res.apiKeyError) {
        setRateLimitInfo({
          isExceeded: true,
          isCustomKeyError: true,
          message: res.message || 'The provided custom API key is invalid or unauthorized.',
          exhaustedProviders: ['Custom Key'],
        });
        return null;
      }

      if (res.rateLimitExceeded) {
        setRateLimitInfo({
          isExceeded: true,
          isCustomKeyError: false,
          message: res.message || 'Daily free-tier request limit reached across default AI models.',
          exhaustedProviders: res.exhaustedProviders || ['Google Gemini'],
          retryAfter: res.retryAfter,
        });
        return null;
      }

      if (res.warning) setWarning(res.warning);
      if (res.modelUsed) setModelUsed(res.modelUsed);

      if (res.fallbackTriggered && res.fallbackReason) {
        setFallbackNotice(res.fallbackReason);
      }

      return res.drafts || [];
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'AI draft failed';
      // Detect rate limit in thrown error (if any reverse proxy or middleware returned 429)
      if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
        setRateLimitInfo({
          isExceeded: true,
          message: 'The AI request quota for this model has been reached. Please switch AI model or add a free key.',
          exhaustedProviders: ['Google Gemini'],
        });
        return null;
      }
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedModel, customApiKey, customProvider]);

  const regenerateSingleDraft = useCallback(async (
    task: TaskDraft,
    index: number,
    instruction?: string,
    context?: string,
    keyOverride?: string,
    providerOverride?: string
  ): Promise<TaskDraft | null> => {
    setRegeneratingIndex(index);
    setError(null);
    setWarning(null);
    setRateLimitInfo(null);

    const storedKey = typeof window !== 'undefined' ? localStorage.getItem('tasksmanager_custom_ai_key') : null;
    const storedProvider = typeof window !== 'undefined' ? localStorage.getItem('tasksmanager_custom_ai_provider') : null;

    const effectiveKey = (keyOverride ?? (customApiKey || undefined) ?? (storedKey || undefined) ?? '').trim();
    const effectiveProvider = (providerOverride ?? (customProvider || undefined) ?? (storedProvider || undefined) ?? 'gemini').trim();

    const userKeys = getStoredUserKeys();
    if (effectiveKey) {
      userKeys[effectiveProvider as 'gemini' | 'groq' | 'grok'] = effectiveKey;
    }

    try {
      const res = await apiFetch<AiRegenResponse>('/api/ai-draft/regenerate', {
        method: 'POST',
        body: { 
          task, 
          instruction, 
          context,
          preferredModel: selectedModel !== 'auto' ? selectedModel : undefined,
          customApiKey: effectiveKey || undefined,
          customProvider: effectiveKey ? effectiveProvider : undefined,
          userApiKeys: Object.values(userKeys).some(Boolean) ? userKeys : undefined,
        },
      });

      if (res.apiKeyError) {
        setRateLimitInfo({
          isExceeded: true,
          isCustomKeyError: true,
          message: res.message || 'The provided custom API key is invalid or unauthorized.',
          exhaustedProviders: ['Custom Key'],
        });
        return null;
      }

      if (res.rateLimitExceeded) {
        setRateLimitInfo({
          isExceeded: true,
          isCustomKeyError: false,
          message: res.message || 'Daily AI free-tier limit reached.',
          exhaustedProviders: res.exhaustedProviders || ['Google Gemini'],
          retryAfter: res.retryAfter,
        });
        return null;
      }

      if (res.warning) setWarning(res.warning);
      if (res.modelUsed) setModelUsed(res.modelUsed);
      if (res.fallbackTriggered && res.fallbackReason) {
        setFallbackNotice(res.fallbackReason);
      }

      return res.task || null;
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Single task regeneration failed';
      if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
        setRateLimitInfo({
          isExceeded: true,
          message: 'The AI request quota for this model has been reached. Please switch AI model or add a free key.',
          exhaustedProviders: ['Google Gemini'],
        });
        return null;
      }
      setError(msg);
      return null;
    } finally {
      setRegeneratingIndex(null);
    }
  }, [selectedModel, customApiKey, customProvider]);

  return { 
    loading, 
    regeneratingIndex, 
    error, 
    warning, 
    rateLimitInfo,
    fallbackNotice,
    modelUsed,
    selectedModel,
    customApiKey,
    customProvider,
    updateSelectedModel,
    updateCustomApiKey,
    clearRateLimit,
    clearFallbackNotice,
    generateDrafts, 
    regenerateSingleDraft, 
    setError 
  };
}
