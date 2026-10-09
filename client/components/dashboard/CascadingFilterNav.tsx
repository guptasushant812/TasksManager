'use client';
import { useMemo } from 'react';
import { TaskFilters } from '@/types/task';
import { SHORT_MONTHS, getWeeksInMonth, toIsoDate, formatDate, getShortDayName } from '@/lib/dates';

interface CascadingFilterNavProps {
  filters: TaskFilters;
  onFiltersChange: (partial: Partial<TaskFilters>) => void;
  availableYears: number[];
}

export default function CascadingFilterNav({ filters, onFiltersChange, availableYears }: CascadingFilterNavProps) {
  const weeks = useMemo(() => {
    if (!filters.year || !filters.month) return [];
    return getWeeksInMonth(parseInt(filters.year), parseInt(filters.month));
  }, [filters.year, filters.month]);

  const selectedWeek = weeks.find((w) => w.index === filters.weekIndex);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ year: e.target.value, month: '', weekIndex: undefined, dateFrom: '', dateTo: '', day: '', page: 1 });
  };

  const handleMonthSelect = (monthStr: string) => {
    // Keep current selection if clicked again
    if (filters.month === monthStr) return;
    onFiltersChange({ month: monthStr, weekIndex: undefined, dateFrom: '', dateTo: '', day: '', page: 1 });
  };

  const handleWeekSelect = (index: number, start: Date, end: Date) => {
    const isSelected = filters.weekIndex === index;
    onFiltersChange({ weekIndex: isSelected ? undefined : index, dateFrom: isSelected ? '' : start.toISOString(), dateTo: isSelected ? '' : end.toISOString(), day: '', page: 1 });
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

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: 'var(--border-width-layout) solid var(--border)',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <label htmlFor="filter-year-select" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Year
          </label>
          <select
            id="filter-year-select"
            value={filters.year || ''}
            onChange={handleYearChange}
            aria-label="Select year"
            style={{
              background: 'var(--bg-surface)',
              border: 'var(--border-width-layout) solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 14,
              padding: '6px 12px',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 900,
              boxShadow: 'var(--box-shadow-brutalist-sm)',
            }}
          >
            {[...availableYears].sort((a, b) => b - a).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 4px', display: 'none' }} className="sm:block" />

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', flex: 1, alignItems: 'center' }}>
          <button
            className={`brutalist-hover ${!filters.month ? 'active' : ''}`}
            onClick={() => handleMonthSelect('')}
            aria-pressed={!filters.month}
            style={{
              background: !filters.month ? 'var(--text-primary)' : 'var(--bg-surface)',
              border: 'var(--border-width-layout) solid var(--border)',
              fontSize: 13,
              fontWeight: 900,
              textTransform: 'uppercase',
              color: !filters.month ? 'var(--bg-base)' : 'var(--text-primary)',
              cursor: 'pointer',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            All
          </button>
          {SHORT_MONTHS.map((month, idx) => {
            const monthNum = String(idx + 1);
            const isSelected = filters.month === monthNum;

            return (
              <button
                key={month}
                className={`brutalist-hover ${isSelected ? 'active' : ''}`}
                onClick={() => handleMonthSelect(monthNum)}
                aria-pressed={isSelected}
                style={{
                  background: isSelected ? 'var(--text-primary)' : 'var(--bg-surface)',
                  border: 'var(--border-width-layout) solid var(--border)',
                  fontSize: 13,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: isSelected ? 'var(--bg-base)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {month}
              </button>
            );
          })}
        </div>
      </div>

      {filters.month && (
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
      )}

      {filters.month && (
        <div className="animate-slide-down" style={{ borderTop: 'var(--border-width-layout) solid var(--border)' }}>
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
        </div>
      )}

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
  );
}
