import type { ReactElement } from 'react';

/* ── Section definitions ──────────────────────────────────────────────────── */

export interface DaySection {
  id: string;
  name: string;
  startHour: number; // 6, 12, 17
  endHour: number;   // 12, 17, 22
  color: string;     // tailwind bg color
  accentColor: string;
  pinnedDays?: number[];  // 0=Sun..6=Sat — empty/undefined = every day
}

export const INITIAL_SECTIONS: DaySection[] = [
  { id: 'morning', name: 'Morning Focus', startHour: 6, endHour: 12, color: 'bg-sage/15', accentColor: 'border-sage/50' },
  { id: 'afternoon', name: 'Afternoon', startHour: 12, endHour: 17, color: 'bg-primary/10', accentColor: 'border-primary/40' },
  { id: 'evening', name: 'Evening', startHour: 17, endHour: 22, color: 'bg-bronze/15', accentColor: 'border-bronze/40' },
];

export const SECTION_COLORS: { color: string; accent: string; label: string }[] = [
  { color: 'bg-sage/15', accent: 'border-sage/50', label: 'Sage' },
  { color: 'bg-primary/10', accent: 'border-primary/40', label: 'Blue' },
  { color: 'bg-bronze/15', accent: 'border-bronze/40', label: 'Bronze' },
  { color: 'bg-accent/15', accent: 'border-accent/40', label: 'Gold' },
  { color: 'bg-tension/5', accent: 'border-tension/30', label: 'Rose' },
  { color: 'bg-ink/5', accent: 'border-ink/20', label: 'Charcoal' },
];

export const SECTIONS_KEY = 'flowview-sections';

/* ── Helper functions ─────────────────────────────────────────────────────── */

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatTime12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
}

export function formatHour12(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12} ${suffix}`;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function loadSections(): DaySection[] {
  try {
    const raw = localStorage.getItem(SECTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DaySection[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return INITIAL_SECTIONS;
}

export function saveSections(sections: DaySection[]) {
  localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
}

export function getSectionForTime(time: string, sections: DaySection[]): string | null {
  const minutes = timeToMinutes(time);
  for (const s of sections) {
    if (minutes >= s.startHour * 60 && minutes < s.endHour * 60) return s.id;
  }
  return null;
}

/* ── URL detection helper ─────────────────────────────────────────────────── */

export const URL_REGEX = /https?:\/\/[^\s<>)"]+/g;

export function renderTextWithLinks(text: string): (string | ReactElement)[] {
  const parts: (string | ReactElement)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(URL_REGEX.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const url = match[0];
    const shortUrl = url.replace(/^https?:\/\//, '');
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary/80 transition-colors break-all"
      >
        {shortUrl.length > 40 ? shortUrl.slice(0, 40) + '…' : shortUrl}
      </a>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

/* ── Drag types ───────────────────────────────────────────────────────────── */

export interface DragPayload {
  entryIds: string[];       // supports single + bulk drag
  entryId: string;          // kept for backward compat
  sourceSection: string | null; // null = parking lot
  sourceDate: string;
}

export function encodeDrag(payload: DragPayload): string {
  return JSON.stringify(payload);
}

export function decodeDrag(data: string): DragPayload | null {
  try {
    const parsed = JSON.parse(data);
    // Backward compat: if entryIds is missing, derive from entryId
    if (!parsed.entryIds && parsed.entryId) parsed.entryIds = [parsed.entryId];
    // Guarantee entryIds is always a valid non-empty array
    if (!Array.isArray(parsed.entryIds) || parsed.entryIds.length === 0) return null;
    return parsed;
  } catch { return null; }
}

/* ── Duration helpers ─────────────────────────────────────────────────────── */

export function parseDurationToMinutes(dur: string | undefined): number {
  if (!dur) return 15; // default: 15 min
  let total = 0;
  const hMatch = dur.match(/(\d+)h/);
  const mMatch = dur.match(/(\d+)m/);
  if (hMatch) total += parseInt(hMatch[1], 10) * 60;
  if (mMatch) total += parseInt(mMatch[1], 10);
  return total || 15;
}

export function minutesToDurationStr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}
