import {
    addWeeks,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isDate,
    parseISO,
} from 'date-fns'; 

import dayjs from 'dayjs';
import type {Day} from 'date-fns'; 

export type Week = {
    anchor: Date; // Single Date which the week is based on.
    start: Date; // Start of the week where the anchor Date is set.
    end: Date; // End of the week where the anchor Date is set.
    days: Date[]; // Days in the week start to end where the anchor Date is set.
}; 

// Set to Sunday as 0
const WEEK_START: Day= 0;

/**
 * @returns the current date
 */
export function getToday(): Date {
    return new Date(); 
};

/**
 * Uses the anchor date to get the start and the end date for the week.
 * @param anchor is the Date specified for which you are getting the week for.
 * @param weekStartsOn makes sure the week always starts on a certain date where 0 = Sunday
 * @returns a Week with the anchor, start, end, and days inbetween. 
 */
export function makeWeek(anchor: Date, weekStartsOn = WEEK_START): Week {
    const start = startOfWeek(anchor, {weekStartsOn});
    const end = endOfWeek(anchor, {weekStartsOn});
    const days = eachDayOfInterval({start, end});
    return {anchor, start, end, days}; 
}

/**
 * Moves the current week anchor by a given offset and returns the new week window.
 *
 * @param anchor current anchor date
 * @param offset number of weeks to move (positive or negative)
 * @param weekStartsOn first day of week (defaults to WEEK_START)
 * @returns the recalculated week structure for the new anchor
 */
export function moveWeek(anchor: Date, offset: number, weekStartsOn: Day = WEEK_START): Week {
    const nextAnchor = addWeeks(anchor, offset);
    return makeWeek(nextAnchor); 
}

/**
 * Formats the week in three different ways depending which week it is.
 * @param w is the Week object that contains the current week. 
 * @returns a formated string based on the week. 
 */
export function weekLabel(w: Week): String {
    const sameYear = format(w.start, "yyyy") === format(w.end, "yyyy");
    const sameMonth = format(w.start, "MM") === format(w.end, "yyyy"); 
    if (sameYear && sameMonth) return `${format(w.start, "MMM d")} , ${format(w.end, "d")} , ${format(w.end, "yyyy")}`;
    if (sameYear) return `${format(w.start, "MMM d")} , ${format(w.end, "MMM d")} , ${format(w.end, "yyyy")}`;
    return `${format(w.start, "MMM d, yyyy")} , ${format(w.end, "MMM d, yyyy")}`;
}

/**
 * Handles a week picker change: converts the selected Dayjs to a Date
 * and updates the week anchor. No-op if nothing is selected.
 *
 * @param value Dayjs value from the picker (or null when cleared)
 * @param setAnchor state setter for the current anchor date
 */
export  function onPickWeek(value: dayjs.Dayjs | null, setAnchor: React.Dispatch<React.SetStateAction<Date>>) {
    if (!value) return; 
    const picked = value.toDate();
    setAnchor(picked); 
}

const ensureDate = (value: Date | string) =>
  (isDate(value) ? value : parseISO(value as string));

export const formatLongDate = (value: Date | string) =>
  format(ensureDate(value), "EEEE, MMMM d, yyyy");

export const formatTimeRange = (
  start: Date | string,
  end: Date | string
) => {
  const startDate = ensureDate(start);
  const endDate = ensureDate(end);
  return `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
};