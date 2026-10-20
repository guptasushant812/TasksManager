'use client';
import { useState, useEffect } from 'react';
import { STANDARD_GIVEN_BY_LIST, normalizeGivenBy } from '@/lib/normalizeGivenBy';
import { apiFetch } from '@/lib/api';

function cleanAndExtractEntities(list: string[]): string[] {
  const set = new Set<string>();
  for (const item of list) {
    if (!item || typeof item !== 'string') continue;
    const parts = item.split(/\s*(?:&|\band\b|,)\s*/i);
    for (const part of parts) {
      const normalized = normalizeGivenBy(part.trim());
      if (normalized && !normalized.includes('&') && !normalized.includes(',')) {
        set.add(normalized);
      }
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function useGivenByOptions(): string[] {
  const [options, setOptions] = useState<string[]>(() =>
    cleanAndExtractEntities([...STANDARD_GIVEN_BY_LIST])
  );

  useEffect(() => {
    let mounted = true;
    apiFetch<{ success: boolean; data: string[] }>('/api/tasks/given-by')
      .then((res) => {
        if (mounted && res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setOptions(cleanAndExtractEntities(res.data));
        }
      })
      .catch(() => {
        // Fall back to standard list if request fails
      });

    return () => {
      mounted = false;
    };
  }, []);

  return options;
}
