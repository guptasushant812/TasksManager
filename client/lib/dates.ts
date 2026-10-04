/**
 * Returns the Monday of the ISO week containing the given date.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the Mon–Sat dates of a week given its Monday start.
 */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/**
 * Formats a Date as "DD-MM-YYYY".
 */
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match && (date.length === 10 || date.endsWith('T00:00:00.000Z') || date.endsWith('T00:00:00Z'))) {
      const [, yyyy, mm, dd] = match;
      return `${dd}-${mm}-${yyyy}`;
    }
  }
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Formats a Date as "YYYY-MM-DD" (for API/input[type=date]).
 */
export function toIsoDate(date: Date | string): string {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns the day name for a Date.
 */
export function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Returns short day name (Mon, Tue…).
 */
export function getShortDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Returns an array of years from startYear to currentYear + 1.
 */
export function getYearRange(startYear: number): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = startYear; y <= currentYear; y++) {
    years.push(y);
  }
  return years;
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export interface WeekData {
  index: number;
  start: Date;
  end: Date;
  days: Date[];
}

/**
 * Returns an array of WeekData for a given month and year.
 * Weeks are defined as Monday-Sunday, clamped to the month boundaries.
 */
export function getWeeksInMonth(year: number, month: number): WeekData[] {
  const weeks: WeekData[] = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  let current = new Date(firstDay);
  let weekIndex = 1;

  while (current <= lastDay) {
    const weekStart = new Date(current);
    const weekDays: Date[] = [];
    
    // Add days until Sunday (0) or end of month
    while (current <= lastDay) {
      weekDays.push(new Date(current));
      if (current.getDay() === 0) { // Sunday
        current.setDate(current.getDate() + 1);
        break;
      }
      current.setDate(current.getDate() + 1);
    }

    weeks.push({
      index: weekIndex++,
      start: weekDays[0],
      end: weekDays[weekDays.length - 1],
      days: weekDays,
    });
  }

  return weeks;
}
