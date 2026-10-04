'use client';
import { useState } from 'react';
import { TaskFilters, Priority, WorkStatus } from '@/types/task';
import { X, ArrowUp, ArrowDown } from 'lucide-react';

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
  const [local, setLocal] = useState({ ...filters });

  function apply() {
    onFiltersChange({ ...local, page: 1 });
    onClose();
  }

  function reset() {
    const cleared: Partial<TaskFilters> = {
      status: '', priority: '', givenBy: '', dateFrom: '', dateTo: '', sort: 'taskId', order: 'desc', page: 1,
    };
    setLocal((p) => ({ ...p, ...cleared }));
    onFiltersChange(cleared);
    onClose();
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.4)',
    }} className="animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--bg-base)',
        borderLeft: 'var(--border-width-layout) solid var(--border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0px 0px 0px var(--border)',
      }} className="animate-slide-left">
        
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: 'var(--border-width-layout) solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)' }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: 18, color: 'var(--text-primary)', textTransform: 'uppercase' }}>Filter & Sort</h3>
          <button onClick={onClose} style={{ padding: '8px', cursor: 'pointer', border: 'var(--border-width-layout) solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', boxShadow: 'var(--box-shadow-brutalist-sm)' }} className="btn">
            <X style={{ width: 16, height: 16, strokeWidth: 3 }} />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Priority */}
          <div>
            <label className="label">Priority</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {PRIORITIES.map((p) => {
                const isActive = local.priority === p;
                return (
                  <button
                    key={p}
                    onClick={() => setLocal((l) => ({ ...l, priority: l.priority === p ? '' : p }))}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: 14,
                      textTransform: 'uppercase',
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 900,
                      color: isActive ? '#fff' : 'var(--text-primary)',
                      background: isActive ? 'var(--text-primary)' : 'var(--bg-surface)',
                      border: 'var(--border-width-layout) solid var(--border)',
                      transition: 'all 0.1s',
                      cursor: 'pointer',
                      boxShadow: isActive ? 'none' : 'var(--box-shadow-brutalist-sm)',
                      transform: isActive ? 'translate(2px, 2px)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                        e.currentTarget.style.transform = 'translate(-2px, -2px)';
                        e.currentTarget.style.boxShadow = 'var(--box-shadow-brutalist)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-surface)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'var(--box-shadow-brutalist-sm)';
                      }
                    }}
                    onMouseDown={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.transform = 'translate(2px, 2px)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                    onMouseUp={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.transform = 'translate(-2px, -2px)';
                        e.currentTarget.style.boxShadow = 'var(--box-shadow-brutalist)';
                      }
                    }}
                  >{p}</button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="label">Work Status</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUSES.map((s) => {
                const isActive = local.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setLocal((l) => ({ ...l, status: l.status === s ? '' : s }))}
                    style={{
                      flex: '1 1 calc(33.333% - 6px)',
                      textAlign: 'center',
                      fontSize: 14,
                      textTransform: 'uppercase',
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 900,
                      color: isActive ? '#fff' : 'var(--text-primary)',
                      background: isActive ? 'var(--text-primary)' : 'var(--bg-surface)',
                      border: 'var(--border-width-layout) solid var(--border)',
                      transition: 'all 0.1s',
                      cursor: 'pointer',
                      boxShadow: isActive ? 'none' : 'var(--box-shadow-brutalist-sm)',
                      transform: isActive ? 'translate(2px, 2px)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                        e.currentTarget.style.transform = 'translate(-2px, -2px)';
                        e.currentTarget.style.boxShadow = 'var(--box-shadow-brutalist)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-surface)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'var(--box-shadow-brutalist-sm)';
                      }
                    }}
                    onMouseDown={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.transform = 'translate(2px, 2px)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                    onMouseUp={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.transform = 'translate(-2px, -2px)';
                        e.currentTarget.style.boxShadow = 'var(--box-shadow-brutalist)';
                      }
                    }}
                  >{s}</button>
                );
              })}
            </div>
          </div>

          {/* Given By */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="label" style={{ margin: 0 }}>Given By</label>
              {local.givenBy && local.givenBy.trim() && (
                <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>Active</span>
              )}
            </div>
            <input
              className="input"
              type="text"
              placeholder="Filter by assigned person"
              value={local.givenBy || ''}
              onChange={(e) => setLocal((l) => ({ ...l, givenBy: e.target.value }))}
              style={local.givenBy && local.givenBy.trim() ? {
                borderColor: 'var(--accent)',
                boxShadow: 'var(--box-shadow-neon-sm)',
              } : undefined}
            />
          </div>

          {/* Date range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="label" style={{ margin: 0 }}>Date From</label>
                {local.dateFrom && (
                  <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>Active</span>
                )}
              </div>
              <input
                className="input"
                type="date"
                value={local.dateFrom || ''}
                onChange={(e) => setLocal((l) => ({ ...l, dateFrom: e.target.value }))}
                style={local.dateFrom ? {
                  borderColor: 'var(--accent)',
                  boxShadow: 'var(--box-shadow-neon-sm)',
                } : undefined}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="label" style={{ margin: 0 }}>Date To</label>
                {local.dateTo && (
                  <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>Active</span>
                )}
              </div>
              <input
                className="input"
                type="date"
                value={local.dateTo || ''}
                onChange={(e) => setLocal((l) => ({ ...l, dateTo: e.target.value }))}
                style={local.dateTo ? {
                  borderColor: 'var(--accent)',
                  boxShadow: 'var(--box-shadow-neon-sm)',
                } : undefined}
              />
            </div>
          </div>

          {/* Sort */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="label" style={{ margin: 0 }}>Sort By</label>
                {local.sort && local.sort !== 'taskId' && (
                  <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>Active</span>
                )}
              </div>
              <select
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="label" style={{ margin: 0 }}>Order</label>
                {local.order === 'asc' && (
                  <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>Active</span>
                )}
              </div>
              <button
                className={`btn ${local.order === 'asc' ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: local.order === 'asc' ? 'none' : 'var(--box-shadow-brutalist-sm)',
                  transform: local.order === 'asc' ? 'translate(2px, 2px)' : 'none',
                  transition: 'all 0.1s',
                }}
                onClick={() => setLocal((l) => ({ ...l, order: l.order === 'asc' ? 'desc' : 'asc' }))}
                title={`Order is ${local.order === 'asc' ? 'Ascending' : 'Descending'}. Click to toggle.`}
              >
                {local.order === 'asc' ? <ArrowUp style={{ width: 14, height: 14, strokeWidth: 3 }} /> : <ArrowDown style={{ width: 14, height: 14, strokeWidth: 3 }} />}
                {local.order === 'asc' ? 'Asc' : 'Desc'}
              </button>
            </div>
          </div>
        </div>

        {/* Actions (Sticky at bottom) */}
        <div style={{ display: 'flex', gap: 16, padding: '24px', borderTop: 'var(--border-width-layout) solid var(--border)', background: 'var(--bg-elevated)' }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={reset}>Reset</button>
          <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={apply}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
}
