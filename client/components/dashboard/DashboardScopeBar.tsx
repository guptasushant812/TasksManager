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
          <div className="scope-bar-label">
            <Calendar className="scope-bar-icon" />
            <span className="scope-bar-label-text">
              TIME SCOPE:
            </span>
          </div>

          {/* Toggle buttons: This Month / All Time */}
          <div className="scope-toggle-group" role="group" aria-label="Time scope preset">
            <button
              type="button"
              onClick={handleSelectThisMonth}
              className={`scope-toggle-btn brutalist-hover ${isCurrentMonth ? 'active' : ''}`}
            >
              This Month
            </button>

            <button
              type="button"
              onClick={handleSelectAllTime}
              className={`scope-toggle-btn brutalist-hover ${isAllTime ? 'active' : ''}`}
            >
              All Time
            </button>
          </div>

          {/* Grouped Month & Year Selectors (prevents Year from dropping alone) */}
          <div className="scope-selects-group">
            {/* Month Selector Dropdown */}
            <select
              value={filters.month || ''}
              onChange={handleMonthChange}
              aria-label="Filter by month"
              className="scope-select scope-select-month brutalist-hover"
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
              className="scope-select scope-select-year brutalist-hover"
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
        </div>

        {/* ── Right Side: Reset & Sync ── */}
        <div className="scope-bar-right">
          <button
            type="button"
            onClick={handleReset}
            className="scope-btn-reset"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={handleSyncClick}
            disabled={isSpinning}
            className="scope-btn-sync brutalist-hover"
            title="Refresh task metrics"
          >
            <RotateCw
              className={`scope-sync-icon ${isSpinning ? 'animate-spin' : ''}`}
            />
            <span>Sync</span>
          </button>
        </div>
      </div>
    </div>
  );
}
