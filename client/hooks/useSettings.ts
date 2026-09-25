'use client';
import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export interface Settings {
  isPublicShareEnabled: boolean;
  publicShareToken: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Settings>('/api/settings');
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleShare = async (enabled: boolean) => {
    try {
      const data = await apiFetch<Settings>('/api/settings', {
        method: 'PATCH',
        body: { isPublicShareEnabled: enabled },
      });
      setSettings(data);
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const regenerateToken = async () => {
    try {
      const data = await apiFetch<Settings>('/api/settings/regenerate-token', {
        method: 'POST',
      });
      setSettings(data);
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    toggleShare,
    regenerateToken,
  };
}
