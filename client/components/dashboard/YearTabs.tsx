'use client';

interface YearTabsProps {
  selectedYear: string;
  onYearChange: (year: string) => void;
  availableYears: number[];
}

export default function YearTabs({ selectedYear, onYearChange, availableYears }: YearTabsProps) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '6px 8px',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      overflowX: 'auto',
    }}>
      {availableYears.map((year) => {
        const active = String(year) === selectedYear;
        return (
          <button
            key={year}
            id={`year-tab-${year}`}
            onClick={() => onYearChange(String(year))}
            style={{
              padding: '7px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s',
              boxShadow: active ? '0 0 14px var(--accent-glow)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {year}
          </button>
        );
      })}
    </div>
  );
}
