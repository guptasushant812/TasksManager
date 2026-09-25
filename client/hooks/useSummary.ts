'use client';
import { useState, useCallback } from 'react';
import { Summary, TaskFilters } from '@/types/task';
import { apiFetch, buildQueryString } from '@/lib/api';

export function useSummary() {
  const [summary, setSummary] = useState<Summary>({ inProgress: 0, pending: 0, completed: 0, total: 0, overdueFollowUps: 0, escalatedTasks: 0 });
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async (filters: TaskFilters = {}, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const qs = buildQueryString(filters as Record<string, string | number | undefined | null>);
      const data = await apiFetch<Summary>(`/api/summary${qs}`);
      setSummary(data);
    } catch {
      // silently fail — summary is non-critical
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  return { summary, loading, fetchSummary };
}
