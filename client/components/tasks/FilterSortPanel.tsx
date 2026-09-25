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
    onFiltersChange(local);
    onClose();
  }

  function reset() {
    const cleared: Partial<TaskFilters> = {
      status: '', priority: '', givenBy: '', dateFrom: '', dateTo: '', sort: 'date', order: 'desc',
    };
    setLocal((p) => ({ ...p, ...cleared }));
    onFiltersChange(cleared);
    onClose();
  }

  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 4px)',
      left: 0,
      zIndex: 50,
      width: 360,
    }} className="card animate-slide-down">
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Filter & Sort</h3>
          <button onClick={onClose} style={{ padding: '4px', cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--text-muted)' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                      fontSize: 12,
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--bg-elevated)' : 'transparent',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--border)' : 'var(--border-subtle)',
                      transition: 'all 0.1s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
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
                      fontSize: 12,
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--bg-elevated)' : 'transparent',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--border)' : 'var(--border-subtle)',
                      transition: 'all 0.1s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >{s}</button>
                );
              })}
            </div>
          </div>

          {/* Given By */}
          <div>
            <label className="label">Given By</label>
            <input
              className="input"
              type="text"
              placeholder="Filter by assigned person"
              value={local.givenBy || ''}
              onChange={(e) => setLocal((l) => ({ ...l, givenBy: e.target.value }))}
            />
          </div>

          {/* Date range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="label">Date From</label>
              <input
                className="input"
                type="date"
                value={local.dateFrom || ''}
                onChange={(e) => setLocal((l) => ({ ...l, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Date To</label>
              <input
                className="input"
                type="date"
                value={local.dateTo || ''}
                onChange={(e) => setLocal((l) => ({ ...l, dateTo: e.target.value }))}
              />
            </div>
          </div>

          {/* Sort */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
            <div>
              <label className="label">Sort By</label>
              <select
                className="input"
                value={local.sort || 'date'}
                onChange={(e) => setLocal((l) => ({ ...l, sort: e.target.value }))}
              >
                {SORT_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Order</label>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', height: '35px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => setLocal((l) => ({ ...l, order: l.order === 'asc' ? 'desc' : 'asc' }))}
              >
                {local.order === 'asc' ? <ArrowUp style={{ width: 14, height: 14 }} /> : <ArrowDown style={{ width: 14, height: 14 }} />}
                {local.order === 'asc' ? 'Asc' : 'Desc'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={reset}>Reset</button>
            <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={apply}>Apply Filters</button>
          </div>
        </div>
      </div>
    </div>
  );
}
