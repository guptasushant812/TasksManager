'use client';
import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { EscalationSettings } from '@/types/escalation';

export function useEscalation() {
  const [settings, setSettings] = useState<EscalationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<EscalationSettings>('/api/escalations');
      setSettings(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load escalation settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (data: Partial<EscalationSettings>) => {
    try {
      const res = await apiFetch<EscalationSettings>('/api/escalations', {
        method: 'PUT',
        body: data,
      });
      setSettings(res);
      return res;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update escalation settings');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, updateSettings, fetchSettings };
}
