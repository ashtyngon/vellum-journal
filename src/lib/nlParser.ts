/**
 * Natural-language entry parser
 * Detects day references, time ranges, and extracts clean titles.
 *
 * Examples:
 *   "Thursday 7-10pm: Timeleft dinner"  → { day: 'thursday', time: '19:00', endTime: '22:00', title: 'Timeleft dinner' }
 *   "tomorrow 3pm meeting with Alex"    → { day: 'tomorrow', time: '15:00', title: 'meeting with Alex' }
 *   "Friday: dentist appointment"       → { day: 'friday', title: 'dentist appointment' }
 *   "buy groceries"                     → { title: 'buy groceries' } (no day/time detected)
 */

import { formatLocalDate } from './dateUtils';

export interface ParsedEntry {
  title: string;
  day?: string;        // 'today' | 'tomorrow' | 'monday' .. 'sunday' | ISO date
  date?: string;       // resolved ISO date string YYYY-MM-DD
  time?: string;       // HH:MM (24h)
  endTime?: string;    // HH:MM (24h) for ranges
  duration?: string;   // e.g. '3h', '1h30m'
  type?: 'event' | 'task' | 'note';
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_ABBREVS: Record<string, string> = {
  sun: 'sunday', mon: 'monday', tue: 'tuesday', tues: 'tuesday',
  wed: 'wednesday', thu: 'thursday', thur: 'thursday', thurs: 'thursday',
  fri: 'friday', sat: 'saturday',
};
const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5,
  jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Resolve a day name to an ISO date string (next occurrence).
 * "today" → today, "tomorrow" → tomorrow, "thursday" → next Thursday
 */
function resolveDayToDate(dayRef: string): string {
  const now = new Date();
  const todayDate = formatLocalDate(now);

  if (dayRef === 'today') return todayDate;

  if (dayRef === 'tomorrow') {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return formatLocalDate(d);
  }

  // Day of week → find next occurrence (including today if it matches)
  const targetDow = DAYS.indexOf(dayRef);
  if (targetDow === -1) return todayDate;

  const currentDow = now.getDay();
  let daysAhead = targetDow - currentDow;
  if (daysAhead <= 0) daysAhead += 7; // always forward, never today for named days
  const d = new Date(now);
  d.setDate(d.getDate() + daysAhead);
  return formatLocalDate(d);
}

/**
 * Resolve "Month Day" to an ISO date string.
 * "February 10" → next occurrence of Feb 10 (this year or next).
 * "March 10th" → next March 10.
 */
function resolveMonthDayToDate(month: number, day: number): string | null {
  const now = new Date();
  const year = now.getFullYear();
  // Try this year first
  const candidate = new Date(year, month, day, 12, 0, 0);
  // If month/day overflowed (e.g., Feb 31 → March), it's invalid
  if (candidate.getMonth() !== month || candidate.getDate() !== day) return null;
  // If in the past, try next year
  if (candidate < now) {
    candidate.setFullYear(year + 1);
  }
  return formatLocalDate(candidate);
}

/**
 * Parse a 12h time string like "7pm", "7:30pm", "10am", "3" into HH:MM 24h.
 */
export function parseTime(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;

  let hours = parseInt(m[1], 10);
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  const meridian = m[3]?.toLowerCase();

  if (meridian === 'pm' && hours < 12) hours += 12;
  if (meridian === 'am' && hours === 12) hours = 0;

  // If no am/pm and hour <= 7, assume PM (heuristic: "7" in a planner = 7pm not 7am)
  if (!meridian && hours >= 1 && hours <= 7) hours += 12;

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Compute duration string from two 24h time strings.
 */
function computeDuration(start: string, end: string): string | undefined {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const diff = endMin > startMin ? endMin - startMin : (24 * 60 - startMin) + endMin;

  if (diff <= 0) return undefined;

  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h > 0 && m > 0) return `${h}h${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Main parser: takes raw input text, returns structured ParsedEntry.
 */
export function parseNaturalEntry(raw: string): ParsedEntry {
  let text = raw.trim();
  let day: string | undefined;
  let date: string | undefined;
  let time: string | undefined;
  let endTime: string | undefined;
  let duration: string | undefined;
  let type: ParsedEntry['type'];

  // ── 1. Detect day reference at start ──────────────────────────────
  // Patterns: "Thursday", "tomorrow", "today", "Mon", etc.
  const dayPattern = /^(today|tomorrow|(?:next\s+)?(?:sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?))\b\s*/i;
  const dayMatch = text.match(dayPattern);

  if (dayMatch) {
    let dayStr = dayMatch[1].toLowerCase().replace(/^next\s+/, '');
    // Normalize abbreviations
    if (DAY_ABBREVS[dayStr]) dayStr = DAY_ABBREVS[dayStr];
    // Full day names are already correct
    if (DAYS.includes(dayStr) || dayStr === 'today' || dayStr === 'tomorrow') {
      day = dayStr;
      date = resolveDayToDate(dayStr);
      text = text.slice(dayMatch[0].length);
    }
  }

  // ── 1b. Detect "Month Day" date at start (e.g., "February 10th", "Mar 3", "March 10th") ──
  // Only if no day-of-week was already detected
  if (!date) {
    const monthNames = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
    const monthDayPattern = new RegExp(`^(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b\\s*`, 'i');
    const monthDayMatch = text.match(monthDayPattern);
    if (monthDayMatch) {
      const monthNum = MONTHS[monthDayMatch[1].toLowerCase()];
      const dayNum = parseInt(monthDayMatch[2], 10);
      if (monthNum !== undefined && dayNum >= 1 && dayNum <= 31) {
        const resolved = resolveMonthDayToDate(monthNum, dayNum);
        if (resolved) {
          date = resolved;
          day = monthDayMatch[0].trim();
          type = 'event';
          text = text.slice(monthDayMatch[0].length);
        }
      }
    }
  }

  // ── 1c. Detect "on Month Day" or "Month Day" ANYWHERE in text ──────
  // Catches: "Dinner with Zac on March 10th", "meeting Feb 3rd with team"
  if (!date) {
    const monthNames = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
    const inlineMonthDayPattern = new RegExp(`(?:^|\\s)(?:on\\s+)?(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s|,|$)`, 'i');
    const inlineMatch = text.match(inlineMonthDayPattern);
    if (inlineMatch) {
      const monthNum = MONTHS[inlineMatch[1].toLowerCase()];
      const dayNum = parseInt(inlineMatch[2], 10);
      if (monthNum !== undefined && dayNum >= 1 && dayNum <= 31) {
        const resolved = resolveMonthDayToDate(monthNum, dayNum);
        if (resolved) {
          date = resolved;
          day = inlineMatch[0].trim();
          type = 'event';
          // Strip the matched date phrase (and "on" if present) from the text
          text = text.replace(inlineMonthDayPattern, ' ').trim();
        }
      }
    }
  }

  // ── 1d. Detect day-of-week ANYWHERE in text (e.g., "dinner on Thursday") ──
  if (!date) {
    const inlineDayPattern = /(?:^|\s)(?:on\s+)?(today|tomorrow|(?:next\s+)?(?:sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?))(?:\s|,|$)/i;
    const inlineDayMatch = text.match(inlineDayPattern);
    if (inlineDayMatch) {
      let dayStr = inlineDayMatch[1].toLowerCase().replace(/^next\s+/, '');
      if (DAY_ABBREVS[dayStr]) dayStr = DAY_ABBREVS[dayStr];
      if (DAYS.includes(dayStr) || dayStr === 'today' || dayStr === 'tomorrow') {
        day = dayStr;
        date = resolveDayToDate(dayStr);
        type = 'event';
        text = text.replace(inlineDayPattern, ' ').trim();
      }
    }
  }

  // ── 2. Detect time / time range ───────────────────────────────────
  // Patterns: "7-10pm", "7pm-10pm", "3:30pm", "7pm", "at 3pm"
  // Time range: "7-10pm", "7pm-10pm", "7:30-9:30pm"
  const rangePattern = /^(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*/i;
  const rangeMatch = text.match(rangePattern);

  if (rangeMatch) {
    let startStr = rangeMatch[1].trim();
    const endStr = rangeMatch[2].trim();

    // If start has no am/pm but end does, inherit the meridian
    const endMeridian = endStr.match(/(am|pm)$/i);
    if (endMeridian && !startStr.match(/(am|pm)$/i)) {
      startStr = startStr + endMeridian[1];
    }

    const parsedStart = parseTime(startStr);
    const parsedEnd = parseTime(endStr);

    if (parsedStart) {
      time = parsedStart;
      if (parsedEnd) {
        endTime = parsedEnd;
        duration = computeDuration(parsedStart, parsedEnd);
      }
      text = text.slice(rangeMatch[0].length);
    }
  } else {
    // Single time: "7pm", "at 3:30pm", "3pm"
    const singleTimePattern = /^(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*/i;
    const singleMatch = text.match(singleTimePattern);

    if (singleMatch) {
      const parsed = parseTime(singleMatch[1].trim());
      if (parsed) {
        time = parsed;
        text = text.slice(singleMatch[0].length);
      }
    }
  }

  // ── 2b. Detect time ANYWHERE in remaining text (e.g., "dinner at 7pm") ──
  if (!time) {
    // Time range inline: "dinner 7-10pm"
    const inlineRangePattern = /(?:^|\s)(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))(?:\s|,|$)/i;
    const inlineRange = text.match(inlineRangePattern);
    if (inlineRange) {
      let startStr = inlineRange[1].trim();
      const endStr = inlineRange[2].trim();
      const endMer = endStr.match(/(am|pm)$/i);
      if (endMer && !startStr.match(/(am|pm)$/i)) startStr = startStr + endMer[1];
      const parsedStart = parseTime(startStr);
      const parsedEnd = parseTime(endStr);
      if (parsedStart) {
        time = parsedStart;
        if (parsedEnd) { endTime = parsedEnd; duration = computeDuration(parsedStart, parsedEnd); }
        text = text.replace(inlineRangePattern, ' ').trim();
      }
    }
  }
  if (!time) {
    // Single time inline: "dinner at 7pm", "meeting 3pm"
    const inlineTimePattern = /(?:^|\s)(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))(?:\s|,|$)/i;
    const inlineTime = text.match(inlineTimePattern);
    if (inlineTime) {
      const parsed = parseTime(inlineTime[1].trim());
      if (parsed) {
        time = parsed;
        text = text.replace(inlineTimePattern, ' ').trim();
      }
    }
  }

  // ── 3. Clean up title ─────────────────────────────────────────────
  // Remove leading colon, comma, dash, or "—" separator
  text = text.replace(/^[\s,:–—-]+/, '').trim();

  // If a day or time was detected, default to event type
  if (day || time) {
    type = 'event';
  }

  return {
    title: text || raw.trim(),
    day,
    date,
    time,
    endTime,
    duration,
    type,
  };
}
