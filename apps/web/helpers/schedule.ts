import { addDays, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import type { Day } from 'date-fns';

// Sunday
export const DEFAULT_WEEK_STARTS_ON: Day = 0;

/**
 * Returns the date range that matches the visible month grid window.
 *
 * The `endExclusive` value is the start of the day *after* the last visible day,
 * matching the backend's expected "exclusive end" semantics.
 */
export function getVisibleMonthWindow(
  currentMonth: Date,
  options?: {
    weekStartsOn?: Day;
  }
) {
  const weekStartsOn = options?.weekStartsOn ?? DEFAULT_WEEK_STARTS_ON;
  const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn });
  const endExclusive = addDays(startOfDay(endOfWeek(endOfMonth(currentMonth), { weekStartsOn })), 1);
  return { start, endExclusive };
}

