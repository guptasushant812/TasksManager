'use client';
import { useState, useCallback, useEffect } from 'react';
import { TaskDraft } from '@/types/task';
import { apiFetch } from '@/lib/api';

export interface RateLimitState {
  isExceeded: boolean;
  message: string;
  exhaustedProviders: string[];
  retryAfter?: string;
}

interface AiDraftResponse {
  drafts?: TaskDraft[];
  warning?: string;
  rateLimitExceeded?: boolean;
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

  // Hydrate custom key and preference from localStorage
  useEffect(() => {
    try {
      const savedModel = localStorage.getItem('tasksmanager_preferred_ai_model');
      if (savedModel) setSelectedModel(savedModel);

      const savedKey = localStorage.getItem('tasksmanager_custom_ai_key');
      if (savedKey) setCustomApiKey(savedKey);

      const savedProvider = localStorage.getItem('tasksmanager_custom_ai_provider');
      if (savedProvider) setCustomProvider(savedProvider);
    } catch {
      // ignore storage access errors
    }
  }, []);

  const updateSelectedModel = useCallback((model: string) => {
    setSelectedModel(model);
    try {
      localStorage.setItem('tasksmanager_preferred_ai_model', model);
    } catch {}
  }, []);

  const updateCustomApiKey = useCallback((key: string, provider: string = 'gemini') => {
    setCustomApiKey(key);
    setCustomProvider(provider);
    try {
      localStorage.setItem('tasksmanager_custom_ai_key', key);
      localStorage.setItem('tasksmanager_custom_ai_provider', provider);
    } catch {}
  }, []);

  const clearRateLimit = useCallback(() => {
    setRateLimitInfo(null);
  }, []);

  const clearFallbackNotice = useCallback(() => {
    setFallbackNotice(null);
  }, []);

  const generateDrafts = useCallback(async (rawText: string): Promise<TaskDraft[] | null> => {
    setLoading(true);
    setError(null);
    setWarning(null);
    setRateLimitInfo(null);
    setFallbackNotice(null);

    try {
      const res = await apiFetch<AiDraftResponse>('/api/ai-draft', {
        method: 'POST',
        body: { 
          rawText,
          preferredModel: selectedModel !== 'auto' ? selectedModel : undefined,
          customApiKey: customApiKey.trim() || undefined,
          customProvider: customApiKey.trim() ? customProvider : undefined,
        },
      });

      // Handle structured rate limit response
      if (res.rateLimitExceeded) {
        setRateLimitInfo({
          isExceeded: true,
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
    context?: string
  ): Promise<TaskDraft | null> => {
    setRegeneratingIndex(index);
    setError(null);
    setWarning(null);
    setRateLimitInfo(null);

    try {
      const res = await apiFetch<AiRegenResponse>('/api/ai-draft/regenerate', {
        method: 'POST',
        body: { 
          task, 
          instruction, 
          context,
          preferredModel: selectedModel !== 'auto' ? selectedModel : undefined,
          customApiKey: customApiKey.trim() || undefined,
          customProvider: customApiKey.trim() ? customProvider : undefined,
        },
      });

      if (res.rateLimitExceeded) {
        setRateLimitInfo({
          isExceeded: true,
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
