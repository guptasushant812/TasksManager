'use client';
import { TaskFilters, Priority, WorkStatus } from '@/types/task';
import { X, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

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
  
  function update(field: keyof TaskFilters, value: any) {
    onFiltersChange({ [field]: value });
  }

  function reset() {
    onFiltersChange({
      status: '', priority: '', givenBy: '', dateFrom: '', dateTo: '', sort: 'date', order: 'desc',
    });
  }

  const hasActiveFilters = !!(filters.status || filters.priority || filters.givenBy || filters.dateFrom || filters.dateTo);

  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 8px)',
      left: 0,
      zIndex: 50,
      width: 320,
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      boxShadow: '0 12px 24px -8px rgba(0,0,0,0.4), 0 4px 8px -4px rgba(0,0,0,0.2)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden'
    }} className="animate-slide-down">
      
      {/* Header */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-base)'
      }}>
        <h3 style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Filter & Sort</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasActiveFilters && (
            <button 
              onClick={reset}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <RotateCcw style={{ width: 12, height: 12 }} />
              Clear
            </button>
          )}
          <button onClick={onClose} style={{ padding: '4px', cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--text-muted)' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Priority Segments */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</label>
          <div style={{ display: 'flex', background: 'var(--bg-base)', padding: 3, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            {PRIORITIES.map((p) => {
              const isActive = filters.priority === p;
              return (
                <button
                  key={p}
                  onClick={() => update('priority', isActive ? '' : p)}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 12,
                    padding: '6px 0',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    background: isActive ? 'var(--bg-elevated)' : 'transparent',
                    border: 'none',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                  }}
                >{p}</button>
              );
            })}
          </div>
        </div>

        {/* Status Segments */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
          <div style={{ display: 'flex', background: 'var(--bg-base)', padding: 3, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            {STATUSES.map((s) => {
              const isActive = filters.status === s;
              let label = s === 'InProgress' ? 'In Progress' : s;
              return (
                <button
                  key={s}
                  onClick={() => update('status', isActive ? '' : s)}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 12,
                    padding: '6px 0',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    background: isActive ? 'var(--bg-elevated)' : 'transparent',
                    border: 'none',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                  }}
                >{label}</button>
              );
            })}
          </div>
        </div>

        {/* Given By */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned By</label>
          <input
            className="input"
            type="text"
            placeholder="Name..."
            value={filters.givenBy || ''}
            onChange={(e) => update('givenBy', e.target.value)}
            style={{ fontSize: 12, padding: '8px 12px' }}
          />
        </div>

        {/* Date range */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Range</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              className="input"
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => update('dateFrom', e.target.value)}
              style={{ fontSize: 12 }}
            />
            <input
              className="input"
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => update('dateTo', e.target.value)}
              style={{ fontSize: 12 }}
            />
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

        {/* Sort */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort By</label>
            <select
              className="input"
              value={filters.sort || 'date'}
              onChange={(e) => update('sort', e.target.value)}
              style={{ fontSize: 12 }}
            >
              {SORT_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order</label>
            <button
              className="btn btn-ghost"
              style={{ width: '100%', height: '33px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
              onClick={() => update('order', filters.order === 'asc' ? 'desc' : 'asc')}
            >
              {filters.order === 'asc' ? <ArrowUp style={{ width: 14, height: 14 }} /> : <ArrowDown style={{ width: 14, height: 14 }} />}
              {filters.order === 'asc' ? 'Asc' : 'Desc'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
