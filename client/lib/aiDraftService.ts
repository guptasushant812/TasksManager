import { TaskDraft } from '@/types/task';
import { apiFetch } from './api';

export interface AiDraftServerState {
  rawText: string;
  step: 'input' | 'preview';
  drafts: TaskDraft[];
  updatedAt?: string;
}

export interface AiDraftResponse {
  draft: AiDraftServerState | null;
  clearedAt?: string | null;
}

export async function fetchAiDraftState(): Promise<AiDraftResponse | null> {
  try {
    const res = await apiFetch<AiDraftResponse>('/api/ai-draft/state');
    return res;
  } catch (err) {
    console.warn('Could not fetch AI draft state from server:', err);
    return null;
  }
}

export async function saveAiDraftState(state: {
  rawText: string;
  step: 'input' | 'preview';
  drafts: TaskDraft[];
}): Promise<AiDraftServerState | null> {
  try {
    const res = await apiFetch<{ success: boolean; draft: AiDraftServerState | null }>('/api/ai-draft/state', {
      method: 'PUT',
      body: state,
    });
    return res.draft;
  } catch (err) {
    console.warn('Could not sync AI draft state to server:', err);
    return null;
  }
}

export async function deleteAiDraftState(): Promise<boolean> {
  try {
    await apiFetch('/api/ai-draft/state', {
      method: 'DELETE',
    });
    return true;
  } catch (err) {
    console.warn('Could not delete AI draft state from server:', err);
    return false;
  }
}

export async function fetchTaskInstruction(taskId: string): Promise<string> {
  if (!taskId) return '';
  try {
    const res = await apiFetch<{ instruction?: string }>(`/api/ai-draft/instruction/${encodeURIComponent(taskId)}`);
    return typeof res?.instruction === 'string' ? res.instruction : '';
  } catch {
    return '';
  }
}

export async function saveTaskInstruction(taskId: string, instruction: string): Promise<boolean> {
  if (!taskId) return false;
  try {
    await apiFetch(`/api/ai-draft/instruction/${encodeURIComponent(taskId)}`, {
      method: 'PUT',
      body: { instruction },
    });
    return true;
  } catch {
    return false;
  }
}
