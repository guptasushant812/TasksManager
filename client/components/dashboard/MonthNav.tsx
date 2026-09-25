'use client';
import { useState } from 'react';
import { MONTHS } from '@/lib/dates';

interface MonthNavProps {
  selectedMonth: string;
  selectedYear: string;
  onMonthSelect: (month: string) => void;
}

export default function MonthNav({ selectedMonth, selectedYear, onMonthSelect }: MonthNavProps) {
  const [open, setOpen] = useState(true);
  const currentMonth = new Date().getMonth() + 1; // 1-based
  const currentYear = new Date().getFullYear();

  return (
    <div className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🗓</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Months
            </h3>
            {selectedMonth && (
              <span style={{ fontSize: 12, color: 'var(--accent)' }}>
                {MONTHS[parseInt(selectedMonth) - 1]} Filter Active
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
        {MONTHS.map((month, idx) => {
          const monthNum = String(idx + 1);
          const isSelected = selectedMonth === monthNum;
          const isCurrent = idx + 1 === currentMonth && Number(selectedYear) === currentYear;

          return (
            <button
              key={month}
              id={`month-btn-${monthNum}`}
              onClick={() => onMonthSelect(isSelected ? '' : monthNum)}
              style={{
                flex: '1 1 0',
                minWidth: 90,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 12px',
                borderRadius: 'var(--radius-lg)',
                border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: isSelected ? 'rgba(59, 130, 246, 0.1)' : isCurrent ? 'var(--bg-elevated)' : 'transparent',
                color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                fontWeight: isSelected ? 700 : 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.2)' : 'none',
              }}
            >
              {month}
              {isCurrent && !isSelected && (
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-primary)', marginLeft: 6 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
