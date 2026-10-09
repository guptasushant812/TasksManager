'use client';
import { useState, useRef, useEffect } from 'react';
import { TaskFilters } from '@/types/task';
import { SHORT_MONTHS } from '@/lib/dates';
import { Calendar, RotateCw, ChevronDown, Check } from 'lucide-react';

interface ScopeDropdownOption {
  value: string;
  label: string;
}

interface ScopeDropdownProps {
  value: string;
  placeholder: string;
  options: ScopeDropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}

function ScopeDropdown({
  value,
  placeholder,
  options,
  onChange,
  ariaLabel,
  className = '',
}: ScopeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`scope-dropdown-wrapper ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`scope-dropdown-trigger brutalist-hover ${isOpen ? 'active' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <span className="scope-dropdown-selected-text">{displayText}</span>
        <ChevronDown
          className="scope-dropdown-chevron"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {isOpen && (
        <div className="scope-dropdown-menu" role="listbox" aria-label={ariaLabel}>
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className={`scope-dropdown-item ${!value ? 'active' : ''}`}
          >
            <span>{placeholder}</span>
            {!value && <Check style={{ width: 12, height: 12 }} />}
          </button>
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`scope-dropdown-item ${isSelected ? 'active' : ''}`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check style={{ width: 12, height: 12 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

  const handleMonthChange = (val: string) => {
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

  const handleYearChange = (val: string) => {
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

  const monthOptions: ScopeDropdownOption[] = SHORT_MONTHS.map((name, idx) => ({
    value: String(idx + 1),
    label: name,
  }));

  const yearOptions: ScopeDropdownOption[] = [...availableYears]
    .sort((a, b) => b - a)
    .map((y) => ({
      value: String(y),
      label: String(y),
    }));

  return (
    <div className="dashboard-scope-container">
      <div className="dashboard-scope-bar">
        <div className="scope-bar-left">
          <div className="scope-bar-label">
            <Calendar className="scope-bar-icon" />
            <span className="scope-bar-label-text">
              TIME SCOPE:
            </span>
          </div>

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

          <div className="scope-selects-group">
            <ScopeDropdown
              value={filters.month || ''}
              placeholder="Month"
              options={monthOptions}
              onChange={handleMonthChange}
              ariaLabel="Filter by month"
              className="scope-dropdown-month"
            />

            <ScopeDropdown
              value={filters.year || ''}
              placeholder="Year"
              options={yearOptions}
              onChange={handleYearChange}
              ariaLabel="Filter by year"
              className="scope-dropdown-year"
            />
          </div>
        </div>

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
