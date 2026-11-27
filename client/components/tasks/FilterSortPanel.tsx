'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TaskFilters, Priority, WorkStatus } from '@/types/task';
import { X, ArrowUp, ArrowDown } from 'lucide-react';
import { getGivenBySuggestions } from '@/lib/normalizeGivenBy';
import { useGivenByOptions } from '@/hooks/useGivenByOptions';

interface FilterSortPanelProps {
  filters: TaskFilters;
  onFiltersChange: (f: Partial<TaskFilters>) => void;
  onClose: () => void;
}

const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];
const STATUSES: WorkStatus[] = ['InProgress', 'Pending', 'Completed'];
const SORT_FIELDS = [
  { value: 'taskId', label: 'Task ID' },
  { value: 'date', label: 'Task Date' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'title', label: 'Title' },
  { value: 'priority', label: 'Priority' },
  { value: 'workStatus', label: 'Status' },
  { value: 'createdAt', label: 'Created At' },
];

export default function FilterSortPanel({ filters, onFiltersChange, onClose }: FilterSortPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [local, setLocal] = useState({ ...filters });
  const givenByOptions = useGivenByOptions();

  const filterSuggestions = getGivenBySuggestions(local.givenBy, givenByOptions);

  useEffect(() => {
    setMounted(true);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  function apply() {
    onFiltersChange({ ...local, page: 1 });
    onClose();
  }

  function reset() {
    const cleared: Partial<TaskFilters> = {
      status: '',
      priority: '',
      givenBy: '',
      dateFrom: '',
      dateTo: '',
      sort: 'taskId',
      order: 'desc',
      page: 1,
    };
    setLocal((p) => ({ ...p, ...cleared }));
    onFiltersChange(cleared);
    onClose();
  }

  if (!mounted || typeof document === 'undefined') return null;

  const activeCount = [
    local.status,
    local.priority,
    local.givenBy?.trim(),
    local.dateFrom,
    local.dateTo,
    (local.sort && local.sort !== 'taskId') || (local.order && local.order !== 'desc'),
  ].filter(Boolean).length;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-sort-title"
      className="filter-sort-overlay animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="filter-sort-drawer animate-slide-left">
        <div className="filter-sort-header">
          <h3 id="filter-sort-title" className="filter-sort-title">
            Filter & Sort
            {activeCount > 0 && (
              <span className="task-toolbar-badge" title={`${activeCount} active filter${activeCount > 1 ? 's' : ''}`}>
                {activeCount}
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="btn"
            style={{
              padding: '8px',
              minWidth: 36,
              minHeight: 36,
              cursor: 'pointer',
              border: 'var(--border-width-layout) solid var(--border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--box-shadow-brutalist-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close filters"
          >
            <X style={{ width: 16, height: 16, strokeWidth: 3 }} />
          </button>
        </div>

        <div className="filter-sort-body">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="label" style={{ margin: 0 }}>Priority</label>
            </div>
            <div className="filter-sort-btn-grid">
              {PRIORITIES.map((p) => {
                const isActive = local.priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLocal((l) => ({ ...l, priority: l.priority === p ? '' : p }))}
                    className={`filter-sort-chip ${isActive ? 'active' : ''}`}
                    aria-pressed={isActive}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="label" style={{ margin: 0 }}>Work Status</label>
            </div>
            <div className="filter-sort-btn-grid">
              {STATUSES.map((s) => {
                const isActive = local.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setLocal((l) => ({ ...l, status: l.status === s ? '' : s }))}
                    className={`filter-sort-chip ${isActive ? 'active' : ''}`}
                    aria-pressed={isActive}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="label" htmlFor="filter-given-by" style={{ margin: 0 }}>Given By</label>
              {local.givenBy && local.givenBy.trim() && (
                <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active</span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="filter-given-by"
                className="input hide-datalist-arrow"
                type="text"
                list="filter-given-by-options"
                autoComplete="off"
                spellCheck={false}
                placeholder="Filter by assigned person"
                value={local.givenBy || ''}
                onChange={(e) => setLocal((l) => ({ ...l, givenBy: e.target.value }))}
                style={{
                  height: '44px',
                  ...(local.givenBy && local.givenBy.trim() ? {
                    borderColor: 'var(--accent)',
                    boxShadow: 'var(--box-shadow-neon-sm)',
                  } : {}),
                  paddingRight: local.givenBy ? 34 : undefined,
                }}
              />
              {local.givenBy && (
                <button
                  type="button"
                  onClick={() => setLocal((l) => ({ ...l, givenBy: '' }))}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Clear assigned person filter"
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              )}
            </div>
            <datalist id="filter-given-by-options">
              {filterSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="filter-sort-date-grid">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="label" htmlFor="filter-date-from" style={{ margin: 0 }}>Date From</label>
                {local.dateFrom && (
                  <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active</span>
                )}
              </div>
              <input
                id="filter-date-from"
                className="input"
                type="date"
                value={local.dateFrom || ''}
                onChange={(e) => setLocal((l) => ({ ...l, dateFrom: e.target.value }))}
                style={{
                  height: '44px',
                  ...(local.dateFrom ? {
                    borderColor: 'var(--accent)',
                    boxShadow: 'var(--box-shadow-neon-sm)',
                  } : {}),
                }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="label" htmlFor="filter-date-to" style={{ margin: 0 }}>Date To</label>
                {local.dateTo && (
                  <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active</span>
                )}
              </div>
              <input
                id="filter-date-to"
                className="input"
                type="date"
                value={local.dateTo || ''}
                onChange={(e) => setLocal((l) => ({ ...l, dateTo: e.target.value }))}
                style={{
                  height: '44px',
                  ...(local.dateTo ? {
                    borderColor: 'var(--accent)',
                    boxShadow: 'var(--box-shadow-neon-sm)',
                  } : {}),
                }}
              />
            </div>
          </div>

          <div className="filter-sort-controls-grid">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="label" htmlFor="filter-sort-field" style={{ margin: 0 }}>Sort By</label>
                {local.sort && local.sort !== 'taskId' && (
                  <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active</span>
                )}
              </div>
              <select
                id="filter-sort-field"
                className="input"
                value={local.sort || 'taskId'}
                onChange={(e) => setLocal((l) => ({ ...l, sort: e.target.value }))}
                style={{
                  height: '44px',
                  borderColor: local.sort && local.sort !== 'taskId' ? 'var(--accent)' : 'var(--border)',
                  boxShadow: local.sort && local.sort !== 'taskId' ? 'var(--box-shadow-neon-sm)' : undefined,
                  color: local.sort && local.sort !== 'taskId' ? 'var(--accent)' : 'var(--text-primary)',
                  fontWeight: local.sort && local.sort !== 'taskId' ? 700 : 400,
                }}
              >
                {SORT_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <label className="label" style={{ margin: 0 }}>Order</label>
              </div>
              <button
                type="button"
                className={`btn ${local.order === 'asc' ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: local.order === 'asc' ? 'none' : 'var(--box-shadow-brutalist-sm)',
                  transform: local.order === 'asc' ? 'translate(2px, 2px)' : 'none',
                  transition: 'all 0.1s',
                }}
                onClick={() => setLocal((l) => ({ ...l, order: l.order === 'asc' ? 'desc' : 'asc' }))}
                title={`Order is ${local.order === 'asc' ? 'Ascending' : 'Descending'}. Click to toggle.`}
                aria-label={`Toggle order. Currently ${local.order === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                {local.order === 'asc' ? <ArrowUp style={{ width: 14, height: 14, strokeWidth: 3 }} /> : <ArrowDown style={{ width: 14, height: 14, strokeWidth: 3 }} />}
                {local.order === 'asc' ? 'Asc' : 'Desc'}
              </button>
            </div>
          </div>
        </div>

        <div className="filter-sort-footer">
          <button
            type="button"
            className="btn btn-ghost"
            style={{ flex: 1, height: '44px', justifyContent: 'center' }}
            onClick={reset}
          >
            Reset
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 2, height: '44px', justifyContent: 'center' }}
            onClick={apply}
          >
            {activeCount > 0 ? `Apply Filters (${activeCount})` : 'Apply Filters'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
