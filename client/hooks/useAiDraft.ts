'use client';
import { useState, useCallback } from 'react';
import { TaskDraft } from '@/types/task';
import { apiFetch } from '@/lib/api';

interface AiDraftResponse {
  drafts: TaskDraft[];
  warning?: string;
}

export function useAiDraft() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const generateDrafts = useCallback(async (rawText: string): Promise<TaskDraft[] | null> => {
    setLoading(true);
    setError(null);
    setWarning(null);
    try {
      const res = await apiFetch<AiDraftResponse>('/api/ai-draft', {
        method: 'POST',
        body: { rawText },
      });
      if (res.warning) setWarning(res.warning);
      return res.drafts;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI draft failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, warning, generateDrafts };
}
