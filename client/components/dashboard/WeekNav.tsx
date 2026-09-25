'use client';
import { useState } from 'react';
import { getWeekStart, getWeekDays, formatDate, getDayName, toIsoDate, getShortDayName } from '@/lib/dates';

interface WeekNavProps {
  selectedDay: string;
  selectedMonth?: string;
  selectedYear: string;
  onDaySelect: (isoDate: string) => void;
}

export default function WeekNav({ selectedDay, selectedMonth, selectedYear, onDaySelect }: WeekNavProps) {
  const todayIso = toIsoDate(new Date());
  
  // Determine the days to show. If a month is selected, show all days in that month.
  // Otherwise, default to the current week (though it will be hidden by page.tsx logic anyway)
  const days: Date[] = [];
  let title = "Current Week";
  let subtitle = "";

  if (selectedMonth && selectedYear) {
    const yearNum = parseInt(selectedYear);
    const monthNum = parseInt(selectedMonth);
    const date = new Date(yearNum, monthNum - 1, 1);
    while (date.getMonth() === monthNum - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    title = `Days in ${date.toLocaleString('default', { month: 'long' })} ${yearNum}`;
  } else {
    const weekStart = getWeekStart(new Date());
    days.push(...getWeekDays(weekStart));
    title = "Current Week";
    subtitle = `${formatDate(days[0])} – ${formatDate(days[days.length - 1])}`;
  }

  return (
    <div className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>📅</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {title}
            </h3>
            {subtitle && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
        {days.map((day) => {
          const iso = toIsoDate(day);
          const isToday = iso === todayIso;
          const isSelected = iso === selectedDay;

          return (
            <button
              key={iso}
              id={`day-btn-${iso}`}
              onClick={() => onDaySelect(isSelected ? '' : iso)}
              style={{
                flex: '1 1 0',
                minWidth: 54,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 8px',
                borderRadius: 'var(--radius-lg)',
                border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: isSelected ? 'rgba(59, 130, 246, 0.1)' : isToday ? 'var(--bg-elevated)' : 'transparent',
                color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.2)' : 'none',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}>
                {getShortDayName(day).toUpperCase()}
              </span>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{day.getDate()}</span>
              {isToday && !isSelected && (
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-primary)', display: 'block', marginTop: 2 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
