// Helpers for calendar-date strings ('YYYY-MM-DD').
//
// Never feed a date-only string to `new Date(str)`: it parses as UTC midnight
// and renders as the previous day in western timezones. Always go through
// these local-safe helpers.

import { format } from 'date-fns';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function isDateOnly(value: string): boolean {
  return DATE_ONLY.test(value);
}

/** Parse 'YYYY-MM-DD' as local time (noon, to dodge DST edge cases). */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

/** Today's date in the user's timezone as 'YYYY-MM-DD'. */
export function todayDateOnly(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** 'YYYY-MM-DD' → 'Jul 12, 2024'. */
export function formatDateOnly(value: string): string {
  if (!isDateOnly(value)) return value;
  return format(parseDateOnly(value), 'MMM d, yyyy');
}

/** 'YYYY-MM-DD' → 'July 2024'. */
export function formatMonthYear(value: string): string {
  if (!isDateOnly(value)) return value;
  return format(parseDateOnly(value), 'MMMM yyyy');
}

/** Compact range like 'Jul 12–15, 2024' or 'Jul 30 – Aug 2, 2024'. */
export function formatDateRange(start: string, end?: string): string {
  if (!end || end === start) return formatDateOnly(start);
  const s = parseDateOnly(start);
  const e = parseDateOnly(end);
  if (s.getFullYear() === e.getFullYear()) {
    if (s.getMonth() === e.getMonth()) {
      return `${format(s, 'MMM d')}–${format(e, 'd, yyyy')}`;
    }
    return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
  }
  return `${format(s, 'MMM d, yyyy')} – ${format(e, 'MMM d, yyyy')}`;
}

/** Sort key comparator for date-only strings (lexicographic is correct). */
export function compareDateOnly(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
