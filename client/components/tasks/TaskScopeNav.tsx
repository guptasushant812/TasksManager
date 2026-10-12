'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { TaskFilters } from '@/types/task';
import {
  SHORT_MONTHS,
  getWeeksInMonth,
  toIsoDate,
  formatDate,
  getDayName,
  getShortDayName,
} from '@/lib/dates';
import { Calendar, ChevronDown, Check, ArrowRight } from 'lucide-react';

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
  disabled?: boolean;
}

function ScopeDropdown({
  value,
  placeholder,
  options,
  onChange,
  ariaLabel,
  className = '',
  disabled = false,
}: ScopeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

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
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`scope-dropdown-trigger brutalist-hover ${isOpen ? 'active' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        style={disabled ? {
          opacity: 0.55,
          cursor: 'not-allowed',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)',
        } : undefined}
        title={disabled ? "Month & Year filters are locked in this preset mode" : undefined}
      >
        <span className="scope-dropdown-selected-text">{displayText}</span>
        <ChevronDown
          className="scope-dropdown-chevron"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: disabled ? 0.35 : 1,
          }}
        />
      </button>

      {isOpen && !disabled && (
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
            <span>{placeholder === 'Month' ? 'All Months' : 'All Years'}</span>
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

interface TaskScopeNavProps {
  filters: TaskFilters;
  onFiltersChange: (partial: Partial<TaskFilters>) => void;
  availableYears: number[];
}

export default function TaskScopeNav({
  filters,
  onFiltersChange,
  availableYears,
}: TaskScopeNavProps) {
  const today = new Date();
  const currentYearStr = today.getFullYear().toString();
  const currentMonthStr = (today.getMonth() + 1).toString();
  const todayIso = toIsoDate(today);
  const todayDayName = getDayName(today);
  const todayFormattedDate = formatDate(today);

  const isToday =
    filters.day === todayIso &&
    !filters.weekIndex &&
    !filters.weekStart &&
    !filters.dateFrom &&
    !filters.dateTo;

  const isCurrentMonth =
    !isToday &&
    filters.year === currentYearStr &&
    filters.month === currentMonthStr &&
    !filters.day &&
    !filters.weekIndex &&
    !filters.weekStart &&
    !filters.dateFrom &&
    !filters.dateTo;

  const isAllTime =
    !filters.year &&
    !filters.month &&
    !filters.day &&
    !filters.dateFrom &&
    !filters.dateTo;

  const weeks = useMemo(() => {
    if (!filters.year || !filters.month) return [];
    return getWeeksInMonth(parseInt(filters.year, 10), parseInt(filters.month, 10));
  }, [filters.year, filters.month]);

  const selectedWeek = weeks.find((w) => w.index === filters.weekIndex);

  const currentMonthWeeks = useMemo(() => {
    return getWeeksInMonth(today.getFullYear(), today.getMonth() + 1);
  }, []);

  const todayWeek = useMemo(() => {
    return currentMonthWeeks.find((w) => w.days.some((d) => toIsoDate(d) === todayIso));
  }, [currentMonthWeeks, todayIso]);

  const handleSelectToday = () => {
    onFiltersChange({
      year: currentYearStr,
      month: currentMonthStr,
      weekIndex: undefined,
      weekStart: undefined,
      day: todayIso,
      dateFrom: '',
      dateTo: '',
      page: 1,
    });
  };

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

  const handleWeekSelect = (index: number, start: Date, end: Date) => {
    const isSelected = filters.weekIndex === index;
    onFiltersChange({
      weekIndex: isSelected ? undefined : index,
      dateFrom: isSelected ? '' : start.toISOString(),
      dateTo: isSelected ? '' : end.toISOString(),
      day: '',
      page: 1,
    });
  };

  const handleDaySelect = (iso: string) => {
    const isSelected = filters.day === iso;
    onFiltersChange({
      day: isSelected ? '' : iso,
      dateFrom: isSelected ? (selectedWeek?.start.toISOString() || '') : '',
      dateTo: isSelected ? (selectedWeek?.end.toISOString() || '') : '',
      page: 1,
    });
  };

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

  const isDropdownDisabled = isToday || isCurrentMonth;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                onClick={handleSelectToday}
                className={`scope-toggle-btn brutalist-hover ${isToday ? 'active' : ''}`}
              >
                Today
              </button>

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
                disabled={isDropdownDisabled}
              />

              <ScopeDropdown
                value={filters.year || ''}
                placeholder="Year"
                options={yearOptions}
                onChange={handleYearChange}
                ariaLabel="Filter by year"
                className="scope-dropdown-year"
                disabled={isDropdownDisabled}
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
          </div>
        </div>
      </div>

      {isToday && (
        <div
          className="animate-slide-down card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--box-shadow-brutalist-sm)',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Calendar
              style={{
                width: 15,
                height: 15,
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                Today
              </span>
              <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>•</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {todayDayName}, {todayFormattedDate}
              </span>
              {todayWeek && (
                <>
                  <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>•</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12 }}>
                    Week {todayWeek.index}
                  </span>
                </>
              )}
              <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                Showing today&apos;s tasks only
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handleSelectThisMonth}
              className="brutalist-hover"
              style={{
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
              title="Switch to This Month to view weekly filters"
            >
              <span>View This Month</span>
              <ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          </div>
        </div>
      )}

      {!isToday && filters.month && (
        <div className="card animate-slide-down" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: 'var(--bg-hover)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: 12,
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Active Range:</span>
              <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--bg-surface)', border: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {SHORT_MONTHS[parseInt(filters.month, 10) - 1]} {filters.year}
              </span>
              {selectedWeek && (
                <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--bg-surface)', border: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Week {selectedWeek.index} ({formatDate(selectedWeek.start)} – {formatDate(selectedWeek.end)})
                </span>
              )}
              {filters.day && (
                <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--accent-subtle)', border: '1px solid var(--accent)', fontWeight: 700, color: 'var(--accent)' }}>
                  Day: {filters.day}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onFiltersChange({ month: '', weekIndex: undefined, day: '', dateFrom: '', dateTo: '', page: 1 })}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '2px 6px',
                transition: 'color 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--high)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Clear Time Filters ✕
            </button>
          </div>

          <div style={{ padding: '12px 20px 0' }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select a Week (Optional)
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, padding: '16px 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {weeks.map((week) => {
              const isSelected = filters.weekIndex === week.index;
              const dateRange = `${formatDate(week.start)} – ${formatDate(week.end)}`;

              return (
                <button
                  key={week.index}
                  className={`brutalist-hover ${isSelected ? 'active' : ''}`}
                  onClick={() => handleWeekSelect(week.index, week.start, week.end)}
                  aria-pressed={isSelected}
                  style={{
                    background: isSelected ? 'var(--accent)' : 'var(--bg-surface)',
                    border: 'var(--border-width-layout) solid var(--border)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    minWidth: 160,
                    cursor: 'pointer',
                    color: isSelected ? '#fff' : 'var(--text-primary)',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>Week {week.index}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>{dateRange}</span>
                </button>
              );
            })}
          </div>

          {selectedWeek && (
            <div className="animate-slide-down" style={{ borderTop: 'var(--border-width-layout) solid var(--border)', padding: '16px 20px', background: 'var(--bg-hover)' }}>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {selectedWeek.days.map((day) => {
                  const iso = toIsoDate(day);
                  const isSelected = filters.day === iso;
                  const dayNum = day.getDate();
                  const dayName = getShortDayName(day);

                  return (
                    <button
                      key={iso}
                      className={`brutalist-hover ${isSelected ? 'active' : ''}`}
                      onClick={() => handleDaySelect(iso)}
                      aria-pressed={isSelected}
                      style={{
                        background: isSelected ? 'var(--text-primary)' : 'var(--bg-surface)',
                        border: 'var(--border-width-layout) solid var(--border)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                        color: isSelected ? 'var(--bg-base)' : 'var(--text-primary)',
                        minWidth: 56,
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 900, opacity: 0.7, textTransform: 'uppercase' }}>{dayName}</span>
                      <span style={{ fontSize: 18, fontWeight: 900 }}>{dayNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!isToday && !filters.month && filters.year && (
        <div className="card animate-slide-down" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'var(--bg-hover)',
          border: '1px solid var(--border-subtle)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Active Range:</span>
            <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--bg-surface)', border: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-primary)' }}>
              All Months ({filters.year})
            </span>
          </div>
          <button
            type="button"
            onClick={() => onFiltersChange({ year: '', month: '', weekIndex: undefined, day: '', dateFrom: '', dateTo: '', page: 1 })}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '2px 6px',
              transition: 'color 0.1s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--high)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            Clear Time Filters ✕
          </button>
        </div>
      )}
    </div>
  );
}
