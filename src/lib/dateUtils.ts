/**
 * Local-timezone date utilities.
 *
 * IMPORTANT: Never use `new Date().toISOString().split('T')[0]` for "today" strings.
 * toISOString() returns UTC, which can shift the date forward/backward depending
 * on the user's timezone. These helpers always use local time.
 */

/** Format a Date as YYYY-MM-DD in the user's local timezone. */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today's date as YYYY-MM-DD in local timezone. */
export function todayStr(): string {
  return formatLocalDate(new Date());
}

/** Tomorrow's date as YYYY-MM-DD in local timezone. */
export function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatLocalDate(d);
}

/** Date N days from now as YYYY-MM-DD in local timezone. */
export function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return formatLocalDate(d);
}

/** Date N days ago as YYYY-MM-DD in local timezone. */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatLocalDate(d);
}

/** The day after a given YYYY-MM-DD date string, in local timezone. */
export function dayAfter(dateString: string): string {
  const d = new Date(dateString + 'T12:00:00'); // noon to avoid DST edge
  d.setDate(d.getDate() + 1);
  return formatLocalDate(d);
}

/** The day before a given YYYY-MM-DD date string, in local timezone. */
export function dayBefore(dateString: string): string {
  const d = new Date(dateString + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return formatLocalDate(d);
}

/** Date string for a given day offset from today. */
export function dateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return formatLocalDate(d);
}
