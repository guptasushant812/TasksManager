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

  const handleYearSelect = (yearStr: string) => {
    if (filters.year === yearStr) return;
    onFiltersChange({ year: yearStr, month: '', weekIndex: undefined, dateFrom: '', dateTo: '', day: '', page: 1 });
  };

  const handleMonthSelect = (monthStr: string) => {
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

  // Shared button styles
  const getBtnStyle = (isSelected: boolean, isPill = false) => ({
    background: isSelected ? 'var(--text-primary)' : 'var(--bg-surface)',
    border: '4px solid var(--border)',
    color: isSelected ? 'var(--bg-base)' : 'var(--text-primary)',
    borderRadius: isPill ? 'var(--radius-full)' : 'var(--radius-md)',
    boxShadow: isSelected ? 'none' : '2px 2px 0px 0px var(--border)',
    transform: isSelected ? 'translate(2px, 2px)' : 'none',
    transition: 'all 0.1s',
    cursor: 'pointer',
    fontWeight: 900,
    textTransform: 'uppercase' as const,
  });

  const getWeekBtnStyle = (isSelected: boolean) => ({
    background: isSelected ? 'var(--accent)' : 'var(--bg-surface)',
    border: '4px solid var(--border)',
    color: isSelected ? '#fff' : 'var(--text-primary)',
    borderRadius: 'var(--radius-md)',
    boxShadow: isSelected ? 'none' : '4px 4px 0px 0px var(--border)',
    transform: isSelected ? 'translate(4px, 4px)' : 'none',
    transition: 'all 0.1s',
    cursor: 'pointer',
  });

  return (
    <div className="card flex flex-col">
      
      {/* ── Years ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 p-4 border-b-4" style={{ borderColor: 'var(--border)' }}>
        {[...availableYears].sort((a, b) => b - a).map((y) => {
          const isSelected = filters.year === String(y);
          return (
            <button
              key={y}
              onClick={() => handleYearSelect(String(y))}
              className="px-4 py-2 text-sm sm:text-base"
              style={getBtnStyle(isSelected)}
              onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)'; } }}
              onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px 0px var(--border)'; } }}
              onMouseDown={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = 'none'; } }}
              onMouseUp={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)'; } }}
            >
              {y}
            </button>
          );
        })}
      </div>

      {/* ── Months ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 p-4">
        <button
          onClick={() => handleMonthSelect('')}
          className="px-4 py-2 text-sm whitespace-nowrap"
          style={getBtnStyle(!filters.month, true)}
          onMouseEnter={(e) => { if (filters.month) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)'; } }}
          onMouseLeave={(e) => { if (filters.month) { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px 0px var(--border)'; } }}
          onMouseDown={(e) => { if (filters.month) { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = 'none'; } }}
          onMouseUp={(e) => { if (filters.month) { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)'; } }}
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
              className="px-4 py-2 text-sm whitespace-nowrap"
              style={getBtnStyle(isSelected, true)}
              onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)'; } }}
              onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px 0px var(--border)'; } }}
              onMouseDown={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = 'none'; } }}
              onMouseUp={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)'; } }}
            >
              {month}
            </button>
          );
        })}
      </div>

      {/* ── Weeks ────────────────────────────────────────────────────── */}
      {filters.month && (
        <div className="animate-slide-down border-t-4" style={{ borderColor: 'var(--border)' }}>
          <div className="px-5 pt-3 pb-1">
            <span className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Select a Week (Optional)
            </span>
          </div>

          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-4 p-4">
            {weeks.map((week) => {
              const isSelected = filters.weekIndex === week.index;
              const dateRange = `${formatDate(week.start)} – ${formatDate(week.end)}`;
              return (
                <button
                  key={week.index}
                  onClick={() => handleWeekSelect(week.index, week.start, week.end)}
                  className="flex flex-col items-start gap-1 p-3 md:p-4 min-w-[140px] flex-1 md:flex-none"
                  style={getWeekBtnStyle(isSelected)}
                  onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px 0px var(--border)'; } }}
                  onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)'; } }}
                  onMouseDown={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translate(4px, 4px)'; e.currentTarget.style.boxShadow = 'none'; } }}
                  onMouseUp={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px 0px var(--border)'; } }}
                >
                  <span className="text-base font-black uppercase">Week {week.index}</span>
                  <span className="text-xs font-bold opacity-80">{dateRange}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Days ────────────────────────────────────────────────────── */}
      {selectedWeek && (
        <div className="animate-slide-down border-t-4 p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-hover)' }}>
          <div className="grid grid-cols-4 sm:grid-cols-7 md:flex md:flex-wrap gap-2 md:gap-3">
            {selectedWeek.days.map((day) => {
              const iso = toIsoDate(day);
              const isSelected = filters.day === iso;
              return (
                <button
                  key={iso}
                  onClick={() => handleDaySelect(iso)}
                  className="flex flex-col items-center justify-center gap-1 p-2 md:px-4 md:py-3 min-w-[48px] md:min-w-[64px] flex-1 md:flex-none"
                  style={getBtnStyle(isSelected)}
                  onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)'; } }}
                  onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px 0px var(--border)'; } }}
                  onMouseDown={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = 'none'; } }}
                  onMouseUp={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '4px 4px 0px 0px var(--border)'; } }}
                >
                  <span className="text-[10px] font-black uppercase opacity-70">{getShortDayName(day)}</span>
                  <span className="text-lg font-black">{day.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
