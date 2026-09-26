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
        padding: '16px 20px',
        borderBottom: '4px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <select
            value={filters.year || ''}
            onChange={handleYearChange}
            aria-label="Select year"
            style={{
              background: 'var(--bg-surface)',
              border: '4px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 16,
              padding: '6px 12px',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 900,
              boxShadow: '4px 4px 0px 0px var(--border)',
            }}
          >
            {[...availableYears].sort((a, b) => b - a).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <button
          onClick={() => handleMonthSelect('')}
          aria-pressed={!filters.month}
          style={{
            background: !filters.month ? 'var(--text-primary)' : 'var(--bg-surface)',
            border: '4px solid var(--border)',
            fontSize: 14,
            fontWeight: 900,
            textTransform: 'uppercase',
            color: !filters.month ? 'var(--bg-base)' : 'var(--text-primary)',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            transition: 'all 0.1s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: !filters.month ? 'none' : '2px 2px 0px 0px var(--border)',
            transform: !filters.month ? 'translate(2px, 2px)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (filters.month) {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.transform = 'translate(-2px, -2px)';
              e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)';
            }
          }}
          onMouseLeave={(e) => {
            if (filters.month) {
              e.currentTarget.style.background = 'var(--bg-surface)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '2px 2px 0px 0px var(--border)';
            }
          }}
          onMouseDown={(e) => {
            if (filters.month) {
              e.currentTarget.style.transform = 'translate(2px, 2px)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
          onMouseUp={(e) => {
            if (filters.month) {
              e.currentTarget.style.transform = 'translate(-2px, -2px)';
              e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)';
            }
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
              onClick={() => handleMonthSelect(monthNum)}
              aria-pressed={isSelected}
              style={{
                background: isSelected ? 'var(--text-primary)' : 'var(--bg-surface)',
                border: '4px solid var(--border)',
                fontSize: 14,
                fontWeight: 900,
                textTransform: 'uppercase',
                color: isSelected ? 'var(--bg-base)' : 'var(--text-primary)',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                transition: 'all 0.1s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: isSelected ? 'none' : '2px 2px 0px 0px var(--border)',
                transform: isSelected ? 'translate(2px, 2px)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'var(--bg-surface)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '2px 2px 0px 0px var(--border)';
                }
              }}
              onMouseDown={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translate(2px, 2px)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              onMouseUp={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)';
                }
              }}
            >
              {month}
            </button>
          );
        })}
      </div>

      {/* ── Weeks (Progressive disclosure) ─────────────────────────── */}
      {filters.month && (
        <div className="animate-slide-down" style={{ borderTop: '4px solid var(--border)' }}>
          <div style={{ padding: '12px 20px 0' }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select a Week (Optional)
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '16px 20px 24px' }}>
            {weeks.map((week) => {
              const isSelected = filters.weekIndex === week.index;
              const dateRange = `${formatDate(week.start)} – ${formatDate(week.end)}`;

              return (
                <button
                  key={week.index}
                  onClick={() => handleWeekSelect(week.index, week.start, week.end)}
                  aria-pressed={isSelected}
                  style={{
                    background: isSelected ? 'var(--accent)' : 'var(--bg-surface)',
                    border: '4px solid var(--border)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    minWidth: 160,
                    cursor: 'pointer',
                    color: isSelected ? '#fff' : 'var(--text-primary)',
                    transition: 'all 0.1s',
                    flexShrink: 0,
                    boxShadow: isSelected ? 'none' : '4px 4px 0px 0px var(--border)',
                    transform: isSelected ? 'translate(4px, 4px)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translate(-2px, -2px)';
                      e.currentTarget.style.boxShadow = '6px 6px 0px 0px var(--border)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)';
                    }
                  }}
                  onMouseDown={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translate(4px, 4px)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                  onMouseUp={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translate(-2px, -2px)';
                      e.currentTarget.style.boxShadow = '6px 6px 0px 0px var(--border)';
                    }
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

      {/* ── Days (deepest drill-down) ──────────────────────────────── */}
      {selectedWeek && (
        <div className="animate-slide-down" style={{ borderTop: '4px solid var(--border)', padding: '16px 20px', background: 'var(--bg-hover)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
                    background: isSelected ? 'var(--text-primary)' : 'var(--bg-surface)',
                    border: '4px solid var(--border)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    color: isSelected ? 'var(--bg-base)' : 'var(--text-primary)',
                    transition: 'all 0.1s',
                    minWidth: 56,
                    flexShrink: 0,
                    boxShadow: isSelected ? 'none' : '2px 2px 0px 0px var(--border)',
                    transform: isSelected ? 'translate(2px, 2px)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                      e.currentTarget.style.transform = 'translate(-2px, -2px)';
                      e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--bg-surface)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '2px 2px 0px 0px var(--border)';
                    }
                  }}
                  onMouseDown={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translate(2px, 2px)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                  onMouseUp={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translate(-2px, -2px)';
                      e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)';
                    }
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
