'use client';
import { useState } from 'react';
import { TaskFilters } from '@/types/task';
import { SHORT_MONTHS } from '@/lib/dates';
import { Calendar, RotateCw } from 'lucide-react';

interface DashboardScopeBarProps {
  filters: TaskFilters;
  onFiltersChange: (partial: Partial<TaskFilters>) => void;
  availableYears: number[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function DashboardScopeBar({
  filters,
  onFiltersChange,
  availableYears,
  onRefresh,
  isRefreshing = false,
}: DashboardScopeBarProps) {
  const [internalRefreshing, setInternalRefreshing] = useState(false);

  const today = new Date();
  const currentYearStr = today.getFullYear().toString();
  const currentMonthStr = (today.getMonth() + 1).toString();

  const isCurrentMonth =
    filters.year === currentYearStr &&
    filters.month === currentMonthStr &&
    !filters.day &&
    !filters.weekStart &&
    !filters.dateFrom &&
    !filters.dateTo;

  const isAllTime = !filters.year && !filters.month && !filters.dateFrom && !filters.dateTo && !filters.day;

  const handleSelectThisMonth = () => {
    onFiltersChange({
      year: currentYearStr,
      month: currentMonthStr,
      weekIndex: undefined,
      weekStart: undefined,
      day: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
    });
  };

  const handleSelectAllTime = () => {
    onFiltersChange({
      year: '',
      month: '',
      weekIndex: undefined,
      weekStart: undefined,
      day: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
    });
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFiltersChange({
      month: val,
      year: filters.year || currentYearStr,
      weekIndex: undefined,
      weekStart: undefined,
      day: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
    });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFiltersChange({
      year: val,
      weekIndex: undefined,
      weekStart: undefined,
      day: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
    });
  };

  const handleReset = () => {
    onFiltersChange({
      year: currentYearStr,
      month: currentMonthStr,
      weekIndex: undefined,
      weekStart: undefined,
      day: '',
      dateFrom: '',
      dateTo: '',
      status: '',
      priority: '',
      search: '',
      page: 1,
    });
  };

  const handleSyncClick = async () => {
    setInternalRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => {
      setInternalRefreshing(false);
    }, 600);
  };

  const isSpinning = isRefreshing || internalRefreshing;

  return (
    <div className="dashboard-scope-container">
      <div className="dashboard-scope-bar">
        {/* ── Left Side: TIME SCOPE controls ── */}
        <div className="scope-bar-left">
          <div className="scope-bar-label" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Calendar style={{ width: 14, height: 14 }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              TIME SCOPE:
            </span>
          </div>

          {/* Toggle buttons: This Month / All Time */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 2,
              gap: 2,
            }}
          >
            <button
              type="button"
              onClick={handleSelectThisMonth}
              className="brutalist-hover"
              style={{
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 800,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: isCurrentMonth ? 'var(--text-primary)' : 'transparent',
                color: isCurrentMonth ? 'var(--bg-base)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              This Month
            </button>

            <button
              type="button"
              onClick={handleSelectAllTime}
              className="brutalist-hover"
              style={{
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 800,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: isAllTime ? 'var(--text-primary)' : 'transparent',
                color: isAllTime ? 'var(--bg-base)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              All Time
            </button>
          </div>

          {/* Month Selector Dropdown */}
          <select
            value={filters.month || ''}
            onChange={handleMonthChange}
            aria-label="Filter by month"
            className="brutalist-hover"
            style={{
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 800,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none',
              minWidth: 76,
            }}
          >
            <option value="">Month</option>
            {SHORT_MONTHS.map((name, idx) => (
              <option key={name} value={String(idx + 1)}>
                {name}
              </option>
            ))}
          </select>

          {/* Year Selector Dropdown */}
          <select
            value={filters.year || ''}
            onChange={handleYearChange}
            aria-label="Filter by year"
            className="brutalist-hover"
            style={{
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 800,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none',
              minWidth: 72,
            }}
          >
            <option value="">Year</option>
            {[...availableYears]
              .sort((a, b) => b - a)
              .map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
          </select>
        </div>

        {/* ── Right Side: Reset & Sync ── */}
        <div className="scope-bar-right">
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '4px 8px',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            Reset
          </button>

          <button
            type="button"
            onClick={handleSyncClick}
            disabled={isSpinning}
            className="brutalist-hover"
            style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: isSpinning ? 'wait' : 'pointer',
              padding: '5px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 800,
            }}
            title="Refresh task metrics"
          >
            <RotateCw
              className={isSpinning ? 'animate-spin' : ''}
              style={{
                width: 13,
                height: 13,
              }}
            />
            <span>Sync</span>
          </button>
        </div>
      </div>
    </div>
  );
}
