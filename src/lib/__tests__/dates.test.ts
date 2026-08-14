import { describe, expect, it } from 'vitest';
import {
  compareDateOnly,
  formatDateOnly,
  formatDateRange,
  isDateOnly,
  parseDateOnly,
} from '@/lib/dates';

describe('dates', () => {
  it('parses date-only strings in local time (no previous-day drift)', () => {
    const d = parseDateOnly('2026-08-14');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(14);
  });

  it('formats a date-only string to a readable date', () => {
    expect(formatDateOnly('2024-07-04')).toBe('Jul 4, 2024');
  });

  it('formats same-month ranges compactly', () => {
    expect(formatDateRange('2024-07-12', '2024-07-15')).toBe('Jul 12–15, 2024');
  });

  it('formats cross-month ranges', () => {
    expect(formatDateRange('2024-07-30', '2024-08-02')).toBe('Jul 30 – Aug 2, 2024');
  });

  it('formats cross-year ranges', () => {
    expect(formatDateRange('2024-12-30', '2025-01-02')).toBe('Dec 30, 2024 – Jan 2, 2025');
  });

  it('collapses missing or equal end dates', () => {
    expect(formatDateRange('2024-07-12')).toBe('Jul 12, 2024');
    expect(formatDateRange('2024-07-12', '2024-07-12')).toBe('Jul 12, 2024');
  });

  it('validates and compares date-only strings', () => {
    expect(isDateOnly('2024-07-12')).toBe(true);
    expect(isDateOnly('July 12')).toBe(false);
    expect(compareDateOnly('2024-01-02', '2024-01-10')).toBeLessThan(0);
  });
});
