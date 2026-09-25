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
    // If clicking the currently selected month, do nothing, just keep it selected
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
      
      {/* ── Months ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <select
            value={filters.year || ''}
            onChange={handleYearChange}
            aria-label="Select year"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 12,
              padding: '4px 8px',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {[...availableYears].sort((a, b) => b - a).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button
          onClick={() => handleMonthSelect('')}
          aria-pressed={!filters.month}
          style={{
            background: !filters.month ? 'var(--text-primary)' : 'transparent',
            border: 'none',
            fontSize: 13,
            fontWeight: !filters.month ? 600 : 400,
            color: !filters.month ? 'var(--bg-base)' : 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { if (filters.month) e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { if (filters.month) e.currentTarget.style.background = 'transparent'; }}
        >
          All
        </button>
        {SHORT_MONTHS.map((month, idx) => {
          const monthNum = String(idx + 1);
          const isSelected = filters.month === monthNum;

          return (
            <button
              key={month}
              onClick={() => handleMonthSelect(monthNum)}
              aria-pressed={isSelected}
              style={{
                background: isSelected ? 'var(--text-primary)' : 'transparent',
                border: 'none',
                fontSize: 13,
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? 'var(--bg-base)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
            >
              {month}
            </button>
          );
        })}
      </div>

      {/* ── Weeks (Progressive disclosure) ─────────────────────────── */}
      {filters.month && (
        <div className="animate-slide-down" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ padding: '8px 16px 0' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Select a Week (Optional)
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {weeks.map((week) => {
              const isSelected = filters.weekIndex === week.index;
              const dateRange = `${formatDate(week.start)} – ${formatDate(week.end)}`;

              return (
                <button
                  key={week.index}
                  onClick={() => handleWeekSelect(week.index, week.start, week.end)}
                  aria-pressed={isSelected}
                  style={{
                    background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-base)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 2,
                    minWidth: 130,
                    cursor: 'pointer',
                    color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.background = 'var(--bg-elevated)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--bg-base)';
                    }
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Week {week.index}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dateRange}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Days (deepest drill-down) ──────────────────────────────── */}
      {selectedWeek && (
        <div className="animate-slide-down" style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 16px', background: 'var(--bg-elevated)' }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {selectedWeek.days.map((day) => {
              const iso = toIsoDate(day);
              const isSelected = filters.day === iso;
              const dayNum = day.getDate();
              const dayName = getShortDayName(day);

              return (
                <button
                  key={iso}
                  onClick={() => handleDaySelect(iso)}
                  aria-pressed={isSelected}
                  style={{
                    background: isSelected ? 'var(--text-primary)' : 'var(--bg-base)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--text-primary)' : 'var(--border)',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0,
                    cursor: 'pointer',
                    color: isSelected ? 'var(--bg-base)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                    minWidth: 42,
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-base)'; }}
                >
                  <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase' }}>{dayName}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{dayNum}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
