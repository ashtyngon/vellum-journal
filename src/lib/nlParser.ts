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
 * Parse a 12h time string like "7pm", "7:30pm", "10am", "3" into HH:MM 24h.
 */
function parseTime(raw: string): string | null {
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

  // ── 3. Clean up title ─────────────────────────────────────────────
  // Remove leading colon, dash, or "—" separator
  text = text.replace(/^[\s:–—-]+/, '').trim();

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
