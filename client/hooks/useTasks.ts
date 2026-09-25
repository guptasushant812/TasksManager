'use client';
import { useState, useCallback } from 'react';
import { Task, TaskFilters, TasksResponse } from '@/types/task';
import { apiFetch, buildQueryString } from '@/lib/api';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (filters: TaskFilters = {}, silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const qs = buildQueryString(filters as Record<string, string | number | undefined | null>);
      const res = await apiFetch<TasksResponse>(`/api/tasks${qs}`);
      setTasks(res.data);
      setPagination(res.pagination);
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (data: Partial<Task>): Promise<Task> => {
    const task = await apiFetch<Task>('/api/tasks', { method: 'POST', body: data });
    return task;
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<Task>): Promise<Task> => {
    const task = await apiFetch<Task>(`/api/tasks/${id}`, { method: 'PUT', body: data });
    return task;
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
  }, []);

  const deleteManyTasks = useCallback(async (ids: string[]): Promise<void> => {
    await apiFetch('/api/tasks/bulk', { method: 'DELETE', body: { ids } });
  }, []);

  return { tasks, pagination, loading, error, fetchTasks, createTask, updateTask, deleteTask, deleteManyTasks };
}
