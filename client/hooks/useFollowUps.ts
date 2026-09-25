'use client';
import { useState, useCallback } from 'react';
import { FollowUp, FollowUpFormData } from '@/types/followUp';
import { apiFetch } from '@/lib/api';

export function useFollowUps(taskId: string) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowUps = useCallback(async (includeDeleted = false) => {
    setLoading(true);
    setError(null);
    try {
      const qs = includeDeleted ? '?includeDeleted=true' : '';
      const res = await apiFetch<{ data: FollowUp[] }>(
        `/api/tasks/${taskId}/follow-ups${qs}`
      );
      setFollowUps(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const createFollowUp = useCallback(async (data: FollowUpFormData): Promise<FollowUp> => {
    const followUp = await apiFetch<FollowUp>(
      `/api/tasks/${taskId}/follow-ups`,
      { method: 'POST', body: data }
    );
    return followUp;
  }, [taskId]);

  const updateFollowUp = useCallback(async (id: string, data: Partial<FollowUpFormData>): Promise<FollowUp> => {
    const followUp = await apiFetch<FollowUp>(
      `/api/tasks/${taskId}/follow-ups/${id}`,
      { method: 'PUT', body: data }
    );
    return followUp;
  }, [taskId]);

  const deleteFollowUp = useCallback(async (id: string, reason: string): Promise<void> => {
    await apiFetch(`/api/tasks/${taskId}/follow-ups/${id}`, {
      method: 'DELETE',
      body: { reason },
    });
  }, [taskId]);

  const uploadAttachments = useCallback(async (followUpId: string, files: File[]): Promise<any> => {
    if (files.length === 0) return [];
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    return apiFetch(
      `/api/tasks/${taskId}/follow-ups/${followUpId}/attachments`,
      { method: 'POST', body: formData }
    );
  }, [taskId]);

  const deleteAttachment = useCallback(async (followUpId: string, attachmentId: string): Promise<void> => {
    await apiFetch(`/api/tasks/${taskId}/follow-ups/${followUpId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }, [taskId]);

  return {
    followUps, loading, error,
    fetchFollowUps, createFollowUp, updateFollowUp, deleteFollowUp,
    uploadAttachments, deleteAttachment,
  };
}
