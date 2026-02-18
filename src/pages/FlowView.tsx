import { useState, useRef, useEffect, useMemo, useCallback, type ReactElement } from 'react';
import { useApp } from '../context/AppContext';
import { parseNaturalEntry } from '../lib/nlParser';
import VisualTimer from '../components/VisualTimer';
import type { RapidLogEntry } from '../context/AppContext';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function dateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

function dayLabel(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat
  return {
    full: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
    shortWeekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    iso: d.toISOString().split('T')[0],
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    dayOfWeek,  // 0=Sun..6=Sat
  };
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
}

function formatHour12(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12} ${suffix}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/* ── Section definitions ──────────────────────────────────────────────────── */

interface DaySection {
  id: string;
  name: string;
  startHour: number; // 6, 12, 17
  endHour: number;   // 12, 17, 22
  color: string;     // tailwind bg color
  accentColor: string;
  pinnedDays?: number[];  // 0=Sun..6=Sat — empty/undefined = every day
}

const INITIAL_SECTIONS: DaySection[] = [
  { id: 'morning', name: 'Morning Focus', startHour: 6, endHour: 12, color: 'bg-sage/10', accentColor: 'border-sage/40' },
  { id: 'afternoon', name: 'Afternoon', startHour: 12, endHour: 17, color: 'bg-primary/5', accentColor: 'border-primary/30' },
  { id: 'evening', name: 'Evening', startHour: 17, endHour: 22, color: 'bg-bronze/10', accentColor: 'border-bronze/30' },
];

const SECTION_COLORS: { color: string; accent: string; label: string }[] = [
  { color: 'bg-sage/10', accent: 'border-sage/40', label: 'Sage' },
  { color: 'bg-primary/5', accent: 'border-primary/30', label: 'Blue' },
  { color: 'bg-bronze/10', accent: 'border-bronze/30', label: 'Bronze' },
  { color: 'bg-accent/10', accent: 'border-accent/30', label: 'Gold' },
  { color: 'bg-tension/5', accent: 'border-tension/30', label: 'Rose' },
  { color: 'bg-ink/5', accent: 'border-ink/20', label: 'Charcoal' },
];

const SECTIONS_KEY = 'flowview-sections';

function loadSections(): DaySection[] {
  try {
    const raw = localStorage.getItem(SECTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DaySection[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return INITIAL_SECTIONS;
}

function saveSections(sections: DaySection[]) {
  localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
}

function getSectionForTime(time: string, sections: DaySection[]): string | null {
  const minutes = timeToMinutes(time);
  for (const s of sections) {
    if (minutes >= s.startHour * 60 && minutes < s.endHour * 60) return s.id;
  }
  return null;
}

/* ── Priority styling ─────────────────────────────────────────────────────── */

const PRIORITY_BORDER: Record<string, string> = {
  high: 'border-l-primary',
  medium: 'border-l-bronze',
  low: 'border-l-wood-light',
};

const PRIORITY_BADGE: Record<string, string> = {
  high: 'text-primary bg-primary/10',
  medium: 'text-bronze bg-bronze/10',
  low: 'text-pencil bg-background-light',
};

/* ── URL detection helper ─────────────────────────────────────────────────── */

const URL_REGEX = /https?:\/\/[^\s<>)"]+/g;

function renderTextWithLinks(text: string): (string | ReactElement)[] {
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

interface DragPayload {
  entryIds: string[];       // supports single + bulk drag
  entryId: string;          // kept for backward compat
  sourceSection: string | null; // null = parking lot
  sourceDate: string;
}

function encodeDrag(payload: DragPayload): string {
  return JSON.stringify(payload);
}

function decodeDrag(data: string): DragPayload | null {
  try {
    const parsed = JSON.parse(data);
    // Backward compat: if entryIds is missing, derive from entryId
    if (!parsed.entryIds && parsed.entryId) parsed.entryIds = [parsed.entryId];
    return parsed;
  } catch { return null; }
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

/* -- Task Card (used inside sections) ------------------------------------ */

function TaskCard({
  entry,
  onUpdate,
  onDelete,
  onDragStart,
  isDragging,
  isSelected,
  onToggleSelect,
  bulkMode,
  onOpenDetail,
  onStartTimer,
}: {
  entry: RapidLogEntry;
  onUpdate: (id: string, updates: Partial<RapidLogEntry>) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, entryId: string) => void;
  isDragging: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  bulkMode?: boolean;
  onOpenDetail?: () => void;
  onStartTimer?: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTitle(entry.title); }, [entry.title]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commitEdit = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== entry.title) onUpdate(entry.id, { title: trimmed });
    else setTitle(entry.title);
    setEditing(false);
  };

  const toggleDone = () => {
    onUpdate(entry.id, { status: entry.status === 'done' ? 'todo' : 'done' });
  };

  const isDone = entry.status === 'done';
  const isHabitTask = !!entry.sourceHabit;
  const borderClass = isHabitTask
    ? 'border-l-sage'
    : (PRIORITY_BORDER[entry.priority ?? 'medium'] ?? 'border-l-wood-light');
  const hasDetails = !!(entry.description || (entry.links && entry.links.length > 0));

  return (
    <div
      draggable={!editing}
      onDragStart={e => { if (!editing) onDragStart(e, entry.id); }}
      className={`group ${isHabitTask ? 'bg-sage/5' : 'bg-surface-light'} p-3 rounded shadow-soft border-l-4 ${borderClass} transition-all ${
        !editing ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isDone ? 'opacity-50' : ''} ${isDragging ? 'opacity-40 scale-95' : 'hover:-translate-y-0.5 hover:shadow-lifted'} ${
        isSelected ? 'ring-2 ring-primary/50 bg-primary/5' : ''
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Bulk select checkbox */}
        {bulkMode && (
          <button
            onClick={e => { e.stopPropagation(); onToggleSelect?.(entry.id); }}
            className="shrink-0 mt-0.5"
          >
            <span className={`material-symbols-outlined text-[18px] transition-colors ${
              isSelected ? 'text-primary' : 'text-pencil/40 hover:text-primary/70'
            }`}>
              {isSelected ? 'check_box' : 'check_box_outline_blank'}
            </span>
          </button>
        )}

        {/* Checkbox */}
        {!bulkMode && (
          <button onClick={toggleDone} className="shrink-0 mt-0.5">
            <span className={`material-symbols-outlined text-[18px] transition-colors ${
              isDone ? 'text-sage' : 'text-primary hover:text-primary/70'
            }`}>
              {isDone ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </button>
        )}

        {/* Title */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') { setTitle(entry.title); setEditing(false); }
              }}
              className="w-full bg-transparent border-b border-primary/40 text-sm font-body text-ink outline-none"
            />
          ) : (
            <p
              className={`text-sm font-body text-ink leading-snug cursor-pointer hover:text-primary/80 transition-colors ${
                isDone ? 'line-through decoration-sage/50' : ''
              }`}
              onClick={() => onOpenDetail?.()}
              onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
            >
              {entry.title}
              {hasDetails && (
                <span className="inline-block ml-1 text-pencil/40 align-middle">
                  <span className="material-symbols-outlined text-[12px]">description</span>
                </span>
              )}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {isHabitTask && (
              <span className="text-[10px] font-mono text-sage bg-sage/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[10px]">routine</span>
                habit
              </span>
            )}
            {entry.timeBlock && (
              <span className="text-[10px] font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                {formatTime12(entry.timeBlock)}
              </span>
            )}
            {entry.duration && (
              <span className="text-[10px] font-mono text-pencil">{entry.duration}</span>
            )}
            {entry.priority && entry.priority !== 'medium' && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${PRIORITY_BADGE[entry.priority]}`}>
                {entry.priority.toUpperCase()}
              </span>
            )}
            {entry.tags?.map(tag => (
              <span key={tag} className="text-[10px] font-mono text-pencil bg-background-light px-1.5 rounded">{tag}</span>
            ))}
            {(entry.links ?? []).length > 0 && (
              <span className="text-[10px] font-mono text-primary/60" title={`${entry.links!.length} link(s)`}>
                <span className="material-symbols-outlined text-[12px] align-middle">link</span>
                {entry.links!.length}
              </span>
            )}
            {(entry.movedCount ?? 0) > 0 && (
              <span className="text-[10px] font-mono text-rose" title={`Moved ${entry.movedCount} time(s)`}>
                {'>'}{entry.movedCount}
              </span>
            )}
          </div>
        </div>

        {/* Actions on hover */}
        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {/* Timer */}
          {onStartTimer && !isDone && (
            <button
              onClick={e => { e.stopPropagation(); onStartTimer(entry.title); }}
              className="text-pencil/50 hover:text-primary transition-colors"
              title="Start visual timer"
            >
              <span className="material-symbols-outlined text-[15px]">timer</span>
            </button>
          )}
          {/* Delete */}
          <button
            onClick={() => onDelete(entry.id)}
            className="text-pencil/50 hover:text-rose transition-colors"
            title="Delete"
          >
            <span className="material-symbols-outlined text-[15px]">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* -- Event Card (pinned info, no checkbox, no drag) ---------------------- */

function EventCard({ entry }: { entry: RapidLogEntry }) {
  return (
    <div className="bg-background-light/80 border border-sage/20 p-3 rounded shadow-soft flex items-start gap-2.5">
      <span className="material-symbols-outlined text-[18px] text-sage mt-0.5 shrink-0">circle</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body text-ink leading-snug">{entry.title}</p>
        {entry.time && (
          <span className="inline-block mt-1 text-[10px] font-mono text-sage bg-sage/10 px-1.5 py-0.5 rounded">
            {formatTime12(entry.time)}
          </span>
        )}
      </div>
    </div>
  );
}

/* -- Section Header (editable name) -------------------------------------- */

function SectionHeader({
  section,
  customName,
  onRename,
  isCollapsed,
  onToggleCollapse,
  onZoom,
  onUnpinTimes,
  taskCount,
  eventCount,
  hasTimedTasks,
}: {
  section: DaySection;
  customName: string;
  onRename: (name: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onZoom: () => void;
  onUnpinTimes: () => void;
  taskCount: number;
  eventCount: number;
  hasTimedTasks: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(customName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setNameValue(customName); }, [customName]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commit = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== customName) onRename(trimmed);
    else setNameValue(customName);
    setEditing(false);
  };

  return (
    <div
      className={`flex items-center gap-2 py-2 px-3 rounded-t ${section.color} border-b ${section.accentColor} cursor-pointer select-none overflow-hidden`}
      onClick={e => {
        if (editing) return;
        if ((e.target as HTMLElement).closest('[data-no-collapse]')) return;
        onToggleCollapse();
      }}
    >
      {/* Collapse chevron */}
      <span className={`material-symbols-outlined text-[18px] text-pencil transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>
        expand_more
      </span>

      {/* Editable name */}
      {editing ? (
        <input
          ref={inputRef}
          value={nameValue}
          onChange={e => setNameValue(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setNameValue(customName); setEditing(false); }
          }}
          onClick={e => e.stopPropagation()}
          className="flex-1 bg-transparent border-b border-primary/40 font-display italic text-base text-ink outline-none"
        />
      ) : (
        <h4
          className="flex-1 min-w-0 font-display italic text-base text-ink hover:text-primary/80 transition-colors truncate"
          onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
          title="Double-click to rename"
        >
          {customName}
        </h4>
      )}

      {/* Time range */}
      <span className="font-mono text-[10px] text-pencil tracking-wider shrink-0">
        {formatHour12(section.startHour)} - {formatHour12(section.endHour)}
      </span>

      {/* Counts badge */}
      {(taskCount > 0 || eventCount > 0) && (
        <span className="font-mono text-[10px] text-pencil bg-surface-light px-1.5 py-0.5 rounded shrink-0">
          {taskCount > 0 && `${taskCount}t`}
          {taskCount > 0 && eventCount > 0 && ' '}
          {eventCount > 0 && `${eventCount}e`}
        </span>
      )}

      {/* Unpin times button — only when tasks have specific time slots */}
      {hasTimedTasks && (
        <button
          data-no-collapse
          onClick={e => { e.stopPropagation(); onUnpinTimes(); }}
          className="text-pencil/40 hover:text-primary transition-colors shrink-0"
          title="Unpin all tasks from time slots"
        >
          <span className="material-symbols-outlined text-[16px]">timer_off</span>
        </button>
      )}

      {/* Zoom button */}
      <button
        data-no-collapse
        onClick={e => { e.stopPropagation(); onZoom(); }}
        className="text-pencil hover:text-primary transition-colors shrink-0"
        title="Zoom into hourly view"
      >
        <span className="material-symbols-outlined text-[18px]">zoom_in</span>
      </button>
    </div>
  );
}

/* -- Parse duration string to minutes ------------------------------------ */

function parseDurationToMinutes(dur: string | undefined): number {
  if (!dur) return 15; // default: 15 min
  let total = 0;
  const hMatch = dur.match(/(\d+)h/);
  const mMatch = dur.match(/(\d+)m/);
  if (hMatch) total += parseInt(hMatch[1], 10) * 60;
  if (mMatch) total += parseInt(mMatch[1], 10);
  return total || 15;
}

function minutesToDurationStr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/* -- Resizable Timeline Card --------------------------------------------- */

function ResizableTimelineCard({
  entry,
  slotHeight,
  sectionEndMin,
  onUpdate,
  onDelete,
  onDragStart,
  isDragging,
}: {
  entry: RapidLogEntry;
  slotHeight: number;       // px per 15-min slot
  sectionEndMin: number;
  onUpdate: (id: string, updates: Partial<RapidLogEntry>) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, entryId: string) => void;
  isDragging: boolean;
}) {
  const [resizing, setResizing] = useState(false);
  const [previewDuration, setPreviewDuration] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTitle(entry.title); }, [entry.title]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const timeMin = timeToMinutes(entry.timeBlock ?? '00:00');
  const durationMin = previewDuration ?? parseDurationToMinutes(entry.duration);
  const spanSlots = Math.max(1, Math.round(durationMin / 15));

  const borderClass = PRIORITY_BORDER[entry.priority ?? 'medium'] ?? 'border-l-wood-light';
  const isDone = entry.status === 'done';

  const commitEdit = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== entry.title) onUpdate(entry.id, { title: trimmed });
    else setTitle(entry.title);
    setEditing(false);
  };

  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);

    const startY = e.clientY;
    const startDur = parseDurationToMinutes(entry.duration);

    const handleMove = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      const slotsDelta = Math.round(dy / slotHeight);
      const newDur = Math.max(15, startDur + slotsDelta * 15);
      // Clamp to section boundary
      const maxDur = sectionEndMin - timeMin;
      setPreviewDuration(Math.min(newDur, maxDur));
    };

    const handleUp = () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      setResizing(false);
      setPreviewDuration(prev => {
        if (prev !== null && prev !== parseDurationToMinutes(entry.duration)) {
          onUpdate(entry.id, { duration: minutesToDurationStr(prev) });
        }
        return null;
      });
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
  }, [entry.id, entry.duration, slotHeight, sectionEndMin, timeMin, onUpdate]);

  const toggleDone = () => {
    onUpdate(entry.id, { status: entry.status === 'done' ? 'todo' : 'done' });
  };

  const heightPx = spanSlots * slotHeight;

  return (
    <div
      ref={cardRef}
      draggable={!resizing && !editing}
      onDragStart={e => { if (!resizing && !editing) onDragStart(e, entry.id); }}
      style={editing ? { minHeight: `${heightPx}px` } : { height: `${heightPx}px` }}
      className={`group relative bg-surface-light rounded shadow-soft border-l-4 ${borderClass} transition-all
        ${!resizing && !editing ? 'cursor-grab active:cursor-grabbing' : ''}
        ${resizing ? 'cursor-ns-resize' : ''}
        ${isDone ? 'opacity-50' : ''}
        ${isDragging ? 'opacity-40 scale-95' : 'hover:shadow-lifted'}
        ${resizing ? 'ring-2 ring-primary/30 z-10' : ''}
        ${editing ? 'z-20 ring-2 ring-primary/20 shadow-lifted' : 'overflow-hidden'}
        flex flex-col`}
    >
      {/* Content */}
      <div className="flex items-start gap-2 p-2 flex-1 min-h-0">
        {/* Checkbox */}
        <button onClick={toggleDone} className="shrink-0 mt-0.5">
          <span className={`material-symbols-outlined text-[16px] transition-colors ${
            isDone ? 'text-sage' : 'text-primary hover:text-primary/70'
          }`}>
            {isDone ? 'check_circle' : 'radio_button_unchecked'}
          </span>
        </button>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') { setTitle(entry.title); setEditing(false); }
              }}
              className="w-full bg-transparent border-b border-primary/40 text-xs font-body text-ink outline-none py-0.5"
            />
          ) : (
            <p
              className={`text-xs font-body text-ink leading-tight cursor-text hover:text-primary/80 transition-colors ${isDone ? 'line-through decoration-sage/50' : ''}`}
              onClick={() => setEditing(true)}
            >
              {entry.title}
            </p>
          )}
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] font-mono text-primary/70">
              {formatTime12(entry.timeBlock!)}
            </span>
            <span className="text-[9px] font-mono text-pencil/50">
              {minutesToDurationStr(durationMin)}
            </span>
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(entry.id)}
          className="text-pencil hover:text-rose transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>

      {/* Drag handle at bottom */}
      {!editing && (
        <div
          onPointerDown={handleResizeStart}
          className="h-2.5 cursor-ns-resize flex items-center justify-center shrink-0 hover:bg-primary/10 transition-colors touch-none"
        >
          <div className="w-8 h-0.5 rounded-full bg-pencil/20 group-hover:bg-primary/40 transition-colors" />
        </div>
      )}
    </div>
  );
}

/* -- Zoomed Section View (hour-by-hour with absolute-positioned cards) --- */

const SLOT_HEIGHT = 44; // px per 15-min quarter slot

function ZoomedSection({
  section,
  customName,
  tasks,
  events,
  onBack,
  onUpdate,
  onDelete,
  onDrop,
  draggingId,
  onDragStartEntry,
}: {
  section: DaySection;
  customName: string;
  tasks: RapidLogEntry[];
  events: RapidLogEntry[];
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<RapidLogEntry>) => void;
  onDelete: (id: string) => void;
  onDrop: (entryId: string, targetSectionId: string, timeBlock?: string) => void;
  draggingId: string | null;
  onDragStartEntry: (e: React.DragEvent, entryId: string) => void;
}) {
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  const sectionStartMin = section.startHour * 60;
  const sectionEndMin = section.endHour * 60;
  const totalSlots = (sectionEndMin - sectionStartMin) / 15;

  const slots: { hour: number; quarter: number; label: string; timeStr: string }[] = useMemo(() => {
    const result: { hour: number; quarter: number; label: string; timeStr: string }[] = [];
    for (let h = section.startHour; h < section.endHour; h++) {
      for (let q = 0; q < 4; q++) {
        const m = q * 15;
        const totalMin = h * 60 + m;
        result.push({
          hour: h,
          quarter: q,
          label: q === 0 ? formatHour12(h) : `:${String(m).padStart(2, '0')}`,
          timeStr: minutesToTimeStr(totalMin),
        });
      }
    }
    return result;
  }, [section.startHour, section.endHour]);

  // Scheduled tasks with timeBlock (positioned absolutely)
  const scheduledTasks = useMemo(() => tasks.filter(t => t.timeBlock), [tasks]);

  // Events with time (positioned absolutely)
  const scheduledEvents = useMemo(() => events.filter(ev => ev.time), [events]);

  // Unscheduled tasks in this section (no timeBlock)
  const unscheduled = useMemo(() => tasks.filter(t => !t.timeBlock), [tasks]);

  // Events by slot (for non-overlapping display)
  const eventsBySlot = useMemo(() => {
    const map: Record<string, RapidLogEntry[]> = {};
    for (const ev of scheduledEvents) {
      if (ev.time) {
        const mins = timeToMinutes(ev.time);
        const rounded = Math.floor(mins / 15) * 15;
        const key = minutesToTimeStr(rounded);
        if (!map[key]) map[key] = [];
        map[key].push(ev);
      }
    }
    return map;
  }, [scheduledEvents]);

  const handleDragOver = (e: React.DragEvent, slotTime: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slotTime);
  };

  const handleDrop = (e: React.DragEvent, slotTime: string) => {
    e.preventDefault();
    setDragOverSlot(null);
    const payload = decodeDrag(e.dataTransfer.getData('application/json'));
    if (payload) {
      // Handle all entries in bulk drag, not just the primary
      for (const id of payload.entryIds) {
        onDrop(id, section.id, slotTime);
      }
    }
  };

  return (
    <div className={`rounded border ${section.accentColor} ${section.color} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center gap-3 py-2 px-3 border-b border-wood-light/30">
        <button
          onClick={onBack}
          className="text-pencil hover:text-primary transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span className="text-xs font-mono">Sections</span>
        </button>
        <h4 className="flex-1 font-display italic text-base text-ink">{customName}</h4>
        <span className="font-mono text-[10px] text-pencil tracking-wider">
          {formatHour12(section.startHour)} - {formatHour12(section.endHour)}
        </span>
      </div>

      {/* Hour-by-hour timeline — relative container with absolute cards */}
      <div className="p-3">
        <div className="relative" style={{ height: `${totalSlots * SLOT_HEIGHT}px` }}>
          {/* Background grid lines (slot rows) */}
          {slots.map(slot => {
            const isHourMark = slot.quarter === 0;
            const slotIdx = (timeToMinutes(slot.timeStr) - sectionStartMin) / 15;
            const isOver = dragOverSlot === slot.timeStr;

            return (
              <div
                key={slot.timeStr}
                onDragOver={e => handleDragOver(e, slot.timeStr)}
                onDragLeave={() => setDragOverSlot(null)}
                onDrop={e => handleDrop(e, slot.timeStr)}
                className={`absolute left-0 right-0 flex items-start transition-colors ${
                  isHourMark ? 'border-t border-wood-light/30' : 'border-t border-dashed border-wood-light/15'
                } ${isOver ? 'bg-primary/10' : ''}`}
                style={{ top: `${slotIdx * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
              >
                {/* Time label */}
                <span className={`font-mono text-[10px] w-14 text-right shrink-0 pt-1.5 pr-2 ${
                  isHourMark ? 'text-pencil font-semibold' : 'text-pencil/40'
                }`}>
                  {slot.label}
                </span>
              </div>
            );
          })}

          {/* Absolutely positioned task cards */}
          {scheduledTasks.map(t => {
            const mins = timeToMinutes(t.timeBlock!);
            const slotIdx = (mins - sectionStartMin) / 15;
            const topPx = slotIdx * SLOT_HEIGHT;

            return (
              <div
                key={t.id}
                className="absolute right-0"
                style={{ top: `${topPx}px`, left: '60px' }}
              >
                <ResizableTimelineCard
                  entry={t}
                  slotHeight={SLOT_HEIGHT}
                  sectionEndMin={sectionEndMin}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onDragStart={onDragStartEntry}
                  isDragging={draggingId === t.id}
                />
              </div>
            );
          })}

          {/* Absolutely positioned event cards */}
          {Object.entries(eventsBySlot).map(([slotTime, evs]) => {
            const mins = timeToMinutes(slotTime);
            const slotIdx = (mins - sectionStartMin) / 15;
            const topPx = slotIdx * SLOT_HEIGHT;

            return evs.map(ev => (
              <div
                key={ev.id}
                className="absolute right-0"
                style={{ top: `${topPx}px`, left: '60px', height: `${SLOT_HEIGHT}px` }}
              >
                <EventCard entry={ev} />
              </div>
            ));
          })}
        </div>
      </div>

      {/* Unscheduled tasks in this section */}
      {unscheduled.length > 0 && (
        <div className="px-3 pb-3 pt-1 border-t border-wood-light/30">
          <p className="text-[10px] font-mono text-pencil uppercase tracking-widest mb-2">Unscheduled</p>
          <div className="space-y-1.5">
            {unscheduled.map(t => (
              <TaskCard
                key={t.id}
                entry={t}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onDragStart={onDragStartEntry}
                isDragging={draggingId === t.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* -- Add Task Inline (at bottom of each section) ------------------------- */

function AddTaskInline({
  date,
  sectionId,
  onAdd,
}: {
  date: string;
  sectionId?: string;
  onAdd: (entry: RapidLogEntry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const submit = () => {
    const trimmed = title.trim();
    if (trimmed) {
      const parsed = parseNaturalEntry(trimmed);
      if (parsed.type === 'event') {
        onAdd({
          id: uid(),
          type: 'event',
          title: parsed.title,
          date: parsed.date || date,
          time: parsed.time,
          duration: parsed.duration,
        });
      } else {
        onAdd({
          id: uid(),
          type: 'task',
          title: parsed.title,
          status: 'todo',
          date: parsed.date || date,
          priority: 'medium',
          movedCount: 0,
          // Only pin to a time slot if the user explicitly typed a time.
          // Otherwise just assign to the section (no timeBlock).
          ...(parsed.time ? { timeBlock: parsed.time } : {}),
          ...(sectionId ? { section: sectionId } : {}),
        });
      }
      setTitle('');
    }
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 border border-dashed border-bronze/25 rounded text-bronze hover:text-primary hover:border-primary/30 hover:bg-surface-light/50 transition-all flex items-center justify-center gap-1 font-handwriting text-sm"
      >
        <span className="material-symbols-outlined text-[14px]">add</span>
        Add task
      </button>
    );
  }

  return (
    <div className="bg-surface-light rounded shadow-soft p-3 border border-primary/20">
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') { setTitle(''); setOpen(false); }
        }}
        placeholder="What needs doing?"
        className="w-full bg-transparent text-sm font-body text-ink outline-none placeholder:text-pencil/50"
      />
      <div className="flex items-center justify-end gap-2 mt-2">
        <button onClick={() => { setTitle(''); setOpen(false); }} className="text-xs text-pencil hover:text-ink transition-colors">
          Cancel
        </button>
        <button onClick={submit} className="text-xs text-white bg-primary hover:bg-primary-dark px-3 py-1 rounded transition-colors">
          Add
        </button>
      </div>
    </div>
  );
}

/* -- Parking Lot Item ---------------------------------------------------- */

function ParkingLotItem({
  entry,
  onSchedule,
  onUpdate,
  onDelete,
  onDragStart,
  isDragging,
}: {
  entry: RapidLogEntry;
  onSchedule: (id: string) => void;
  onUpdate: (id: string, updates: Partial<RapidLogEntry>) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, entryId: string) => void;
  isDragging: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTitle(entry.title); }, [entry.title]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commitEdit = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== entry.title) onUpdate(entry.id, { title: trimmed });
    else setTitle(entry.title);
    setEditing(false);
  };

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, entry.id)}
      className={`group bg-surface-light p-3 rounded shadow-soft border border-transparent hover:border-bronze/30 hover:shadow-lifted transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40 scale-95' : ''
      }`}
    >
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => onSchedule(entry.id)}
          className="text-bronze hover:text-primary transition-colors mt-0.5 shrink-0"
          title="Schedule to today"
        >
          <span className="material-symbols-outlined text-[16px]">schedule</span>
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') { setTitle(entry.title); setEditing(false); }
              }}
              className="w-full bg-transparent border-b border-primary/40 text-sm font-body text-ink outline-none"
            />
          ) : (
            <p
              className="text-sm font-body text-ink leading-snug cursor-text hover:text-primary/80 transition-colors"
              onClick={() => setEditing(true)}
            >
              {entry.title}
            </p>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            {entry.priority && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${PRIORITY_BADGE[entry.priority] ?? ''}`}>
                {entry.priority}
              </span>
            )}
            {entry.tags?.map(tag => (
              <span key={tag} className="text-[10px] font-mono text-pencil bg-background-light px-1.5 rounded">{tag}</span>
            ))}
          </div>
        </div>

        <button
          onClick={() => onDelete(entry.id)}
          className="text-pencil hover:text-rose transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          title="Delete"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>
    </div>
  );
}

/* -- Task Detail Modal (popup when clicking a task) ----------------------- */

function TaskDetailModal({
  entry,
  onUpdate,
  onDelete,
  onClose,
}: {
  entry: RapidLogEntry;
  onUpdate: (id: string, updates: Partial<RapidLogEntry>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(entry.title);
  const [desc, setDesc] = useState(entry.description ?? '');
  const [linkInput, setLinkInput] = useState('');
  const [priority, setPriority] = useState(entry.priority ?? 'medium');
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        commitAndClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, desc, priority]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') commitAndClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, desc, priority]);

  const commitAndClose = () => {
    const updates: Partial<RapidLogEntry> = {};
    const trimTitle = title.trim();
    if (trimTitle && trimTitle !== entry.title) updates.title = trimTitle;
    const trimDesc = desc.trim();
    if (trimDesc !== (entry.description ?? '')) updates.description = trimDesc || undefined;
    if (priority !== (entry.priority ?? 'medium')) updates.priority = priority;
    if (Object.keys(updates).length > 0) onUpdate(entry.id, updates);
    onClose();
  };

  const addLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    const url = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
    const existing = entry.links ?? [];
    if (!existing.includes(url)) {
      onUpdate(entry.id, { links: [...existing, url] });
    }
    setLinkInput('');
  };

  const removeLink = (url: string) => {
    onUpdate(entry.id, { links: (entry.links ?? []).filter(l => l !== url) });
  };

  const isDone = entry.status === 'done';
  const borderClass = PRIORITY_BORDER[entry.priority ?? 'medium'] ?? 'border-l-wood-light';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/30 backdrop-blur-[2px]">
      <div
        ref={modalRef}
        className={`bg-paper rounded-xl shadow-lifted border-l-4 ${borderClass} w-[90vw] max-w-md max-h-[80vh] overflow-y-auto no-scrollbar`}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 pb-3">
          <button
            onClick={() => {
              onUpdate(entry.id, { status: isDone ? 'todo' : 'done' });
            }}
            className="shrink-0 mt-1"
          >
            <span className={`material-symbols-outlined text-[22px] transition-colors ${
              isDone ? 'text-sage' : 'text-primary hover:text-primary/70'
            }`}>
              {isDone ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </button>

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={`flex-1 bg-transparent font-body text-base text-ink outline-none border-b border-transparent focus:border-primary/30 transition-colors ${
              isDone ? 'line-through decoration-sage/50 text-ink/60' : ''
            }`}
            placeholder="Task title"
          />

          <button onClick={commitAndClose} className="text-pencil hover:text-ink transition-colors shrink-0">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-4">
          {/* Description */}
          <div>
            <label className="text-[10px] font-mono text-pencil uppercase tracking-widest mb-1.5 block">Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              placeholder="Add details, notes, context…"
              className="w-full bg-surface-light/50 border border-wood-light/20 rounded-lg text-sm font-body text-ink p-3 outline-none focus:border-primary/30 resize-none transition-colors placeholder:text-pencil/30"
            />
            {/* Render clickable links in description preview */}
            {desc && (
              <div className="mt-1 text-xs font-body text-ink-light leading-relaxed">
                {renderTextWithLinks(desc)}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <label className="text-[10px] font-mono text-pencil uppercase tracking-widest mb-1.5 block">Links</label>
            {(entry.links ?? []).length > 0 && (
              <div className="space-y-1.5 mb-2">
                {entry.links!.map(url => {
                  const shortUrl = url.replace(/^https?:\/\//, '');
                  return (
                    <div key={url} className="flex items-center gap-2 group/link bg-surface-light/50 rounded-lg px-3 py-2">
                      <span className="material-symbols-outlined text-[14px] text-primary/50 shrink-0">link</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30 truncate flex-1"
                      >
                        {shortUrl.length > 50 ? shortUrl.slice(0, 50) + '…' : shortUrl}
                      </a>
                      <button
                        onClick={() => removeLink(url)}
                        className="text-pencil/30 hover:text-rose opacity-0 group-hover/link:opacity-100 transition-all shrink-0"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-pencil/40 shrink-0">add_link</span>
              <input
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addLink(); }}
                placeholder="Paste a URL…"
                className="flex-1 bg-transparent text-xs font-mono text-ink border-b border-dashed border-wood-light/30 outline-none py-1.5 placeholder:text-pencil/30 focus:border-primary/40 transition-colors"
              />
              <button
                onClick={addLink}
                disabled={!linkInput.trim()}
                className="text-primary hover:text-primary/80 disabled:opacity-30 transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-[10px] font-mono text-pencil uppercase tracking-widest mb-1.5 block">Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => { setPriority(p); onUpdate(entry.id, { priority: p }); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    priority === p
                      ? `${PRIORITY_BADGE[p]} ring-1 ring-current/20`
                      : 'text-pencil/50 bg-surface-light/50 hover:bg-surface-light'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-3 flex-wrap text-[10px] font-mono text-pencil/60 pt-2 border-t border-wood-light/15">
            {entry.timeBlock && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">schedule</span>
                {formatTime12(entry.timeBlock)}
              </span>
            )}
            {entry.duration && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">timer</span>
                {entry.duration}
              </span>
            )}
            {entry.tags?.map(tag => (
              <span key={tag} className="bg-background-light px-1.5 py-0.5 rounded">{tag}</span>
            ))}
            {(entry.movedCount ?? 0) > 0 && (
              <span className="text-rose">moved {entry.movedCount}×</span>
            )}
          </div>

          {/* Delete button */}
          <div className="flex justify-end pt-1">
            <button
              onClick={() => { onDelete(entry.id); onClose(); }}
              className="text-xs font-body text-pencil/40 hover:text-rose transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
              Delete task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -- Section Body (collapsed/expanded, with drop zone) ------------------- */

function SectionBody({
  section,
  date,
  tasks,
  events,
  onUpdate,
  onDelete,
  onAdd,
  onDrop,
  onBatchDrop,
  draggingId,
  onDragStartEntry,
  selectedIds,
  onToggleSelect,
  bulkMode,
  onStartTimer,
}: {
  section: DaySection;
  date: string;
  tasks: RapidLogEntry[];
  events: RapidLogEntry[];
  onUpdate: (id: string, updates: Partial<RapidLogEntry>) => void;
  onDelete: (id: string) => void;
  onAdd: (entry: RapidLogEntry) => void;
  onDrop: (entryId: string, targetSectionId: string) => void;
  onBatchDrop: (entryIds: string[], targetSectionId: string) => void;
  draggingId: string | null;
  onDragStartEntry: (e: React.DragEvent, entryId: string) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  bulkMode?: boolean;
  onStartTimer?: (title: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [detailEntry, setDetailEntry] = useState<RapidLogEntry | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    // Check if this is a habit drag (text/plain contains habit info)
    const habitData = e.dataTransfer.getData('text/plain');
    if (habitData && habitData.startsWith('habit:')) {
      const parts = habitData.split(':');
      const habitName = parts.slice(2).join(':');
      // Create a new task from the habit — mark it with sourceHabit for visual differentiation
      onAdd({
        id: uid(),
        type: 'task',
        title: habitName,
        date,
        status: 'todo',
        priority: 'medium',
        section: section.id,
        movedCount: 0,
        sourceHabit: habitName,
      });
      return;
    }

    const payload = decodeDrag(e.dataTransfer.getData('application/json'));
    if (payload) {
      if (payload.entryIds.length > 1) {
        // Atomic batch drop for multiple entries
        onBatchDrop(payload.entryIds, section.id);
      } else {
        onDrop(payload.entryIds[0], section.id);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`px-3 py-2 space-y-2 transition-colors ${
        dragOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset rounded-b' : ''
      }`}
    >
      {/* Events pinned first */}
      {events.map(ev => (
        <EventCard key={ev.id} entry={ev} />
      ))}

      {/* Task cards */}
      {tasks.map(t => (
        <TaskCard
          key={t.id}
          entry={t}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onDragStart={onDragStartEntry}
          isDragging={draggingId === t.id}
          isSelected={selectedIds?.has(t.id)}
          onToggleSelect={onToggleSelect}
          bulkMode={bulkMode}
          onOpenDetail={() => setDetailEntry(t)}
          onStartTimer={onStartTimer}
        />
      ))}

      {/* Empty state */}
      {tasks.length === 0 && events.length === 0 && (
        <p className="text-xs font-handwriting text-pencil/40 italic text-center py-3">
          Drop tasks here or add one below
        </p>
      )}

      {/* Add task inline */}
      <AddTaskInline date={date} sectionId={section.id} onAdd={onAdd} />

      {/* Task detail modal */}
      {detailEntry && (
        <TaskDetailModal
          entry={detailEntry}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onClose={() => setDetailEntry(null)}
        />
      )}
    </div>
  );
}

/* -- Day Column ---------------------------------------------------------- */

function DayColumn({
  offset,
  entries,
  sections,
  sectionNames,
  onUpdate,
  onBatchUpdate,
  onDelete,
  onAdd,
  onDrop,
  onDropZoomed,
  draggingId,
  onDragStartEntry,
  onRenameSection,
  isFocused,
  selectedIds,
  onToggleSelect,
  bulkMode,
  onStartTimer,
}: {
  offset: number;
  entries: RapidLogEntry[];
  sections: DaySection[];
  sectionNames: Record<string, string>;
  onUpdate: (id: string, updates: Partial<RapidLogEntry>) => void;
  onBatchUpdate: (updates: Array<{ id: string; updates: Partial<RapidLogEntry> }>) => void;
  onDelete: (id: string) => void;
  onAdd: (entry: RapidLogEntry) => void;
  onDrop: (entryId: string, targetSectionId: string, targetDate: string) => void;
  onDropZoomed: (entryId: string, targetSectionId: string, targetDate: string, timeBlock: string) => void;
  draggingId: string | null;
  onDragStartEntry: (e: React.DragEvent, entryId: string, sourceDate: string) => void;
  onRenameSection: (sectionId: string, newName: string) => void;
  isFocused: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  bulkMode?: boolean;
  onStartTimer?: (title: string) => void;
}) {
  const info = dayLabel(offset);
  const isToday = offset === 0;
  const isYesterday = offset === -1;

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [zoomedSection, setZoomedSection] = useState<string | null>(null);

  const dateLabel =
    offset === -1 ? 'YESTERDAY' :
    offset === 0 ? 'TODAY' :
    offset === 1 ? 'TOMORROW' :
    info.weekday.toUpperCase();

  // Filter sections by pinned weekdays — if pinnedDays is set, only show on those days
  const visibleSections = useMemo(() =>
    sections.filter(s => !s.pinnedDays || s.pinnedDays.length === 0 || s.pinnedDays.includes(info.dayOfWeek)),
  [sections, info.dayOfWeek]);

  // Split entries into tasks and events per section
  const tasksBySection = useMemo(() => {
    const map: Record<string, RapidLogEntry[]> = {};
    for (const s of visibleSections) map[s.id] = [];

    const tasks = entries.filter(e => e.type === 'task');
    for (const t of tasks) {
      // 1. If task has a timeBlock, assign by time range
      const sectionByTime = t.timeBlock ? getSectionForTime(t.timeBlock, visibleSections) : null;
      if (sectionByTime && map[sectionByTime]) {
        map[sectionByTime].push(t);
      } else if (t.section && map[t.section]) {
        // 2. If task has a section assignment (no timeBlock), use that
        map[t.section].push(t);
      } else {
        // 3. Fallback: first visible section
        const firstSection = visibleSections[0];
        if (firstSection) {
          map[firstSection.id].push(t);
        }
      }
    }

    // Sort: timed tasks first (by time), then unscheduled
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        if (a.timeBlock && b.timeBlock) return a.timeBlock.localeCompare(b.timeBlock);
        if (a.timeBlock) return -1;
        if (b.timeBlock) return 1;
        return 0;
      });
    }

    return map;
  }, [entries, visibleSections]);

  const eventsBySection = useMemo(() => {
    const map: Record<string, RapidLogEntry[]> = {};
    for (const s of visibleSections) map[s.id] = [];

    const events = entries.filter(e => e.type === 'event');
    for (const ev of events) {
      const sectionId = ev.time ? getSectionForTime(ev.time, visibleSections) : null;
      if (sectionId && map[sectionId]) {
        map[sectionId].push(ev);
      } else {
        // Events without time: put in first visible section
        const firstSection = visibleSections[0];
        if (firstSection) {
          map[firstSection.id].push(ev);
        }
      }
    }
    return map;
  }, [entries, visibleSections]);

  const toggleCollapse = (sectionId: string) => {
    setCollapsed(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleDrop = (entryId: string, targetSectionId: string) => {
    onDrop(entryId, targetSectionId, info.iso);
  };

  const handleBatchDrop = (entryIds: string[], targetSectionId: string) => {
    onBatchUpdate(entryIds.map(id => ({
      id,
      updates: { date: info.iso, section: targetSectionId, timeBlock: undefined },
    })));
  };

  const handleDropZoomed = (entryId: string, targetSectionId: string, timeBlock?: string) => {
    if (timeBlock) onDropZoomed(entryId, targetSectionId, info.iso, timeBlock);
  };

  const handleDragStart = (e: React.DragEvent, entryId: string) => {
    onDragStartEntry(e, entryId, info.iso);
  };

  const opacityClass = isYesterday ? 'opacity-50' : offset >= 2 ? 'opacity-80' : '';
  // In focused mode, let the column fill available space for horizontal section layout
  const widthClass = isFocused
    ? 'w-full max-w-full'
    : isToday
      ? 'min-w-[340px] w-[340px]'
      : 'min-w-[280px] w-[280px]';
  const weekendBg = info.isWeekend ? 'bg-accent/[0.03]' : '';

  return (
    <div
      className={`${widthClass} h-full flex flex-col px-3 ${isFocused ? 'mx-auto' : 'border-r'} border-dashed border-wood-light/40 ${opacityClass} ${weekendBg} snap-start shrink-0 transition-all duration-300`}
      {...(isToday ? { 'data-today': true } : {})}
      data-offset={offset}
    >
      {/* Column header */}
      <div className="mb-3 sticky top-0 z-10 backdrop-blur-[2px] py-2">
        <div className="flex items-baseline gap-2">
          <h3
            className={`font-display italic ${
              isToday ? 'text-2xl text-ink font-medium' :
              isYesterday ? 'text-xl text-pencil' :
              'text-xl text-ink/80'
            }`}
          >
            {info.full}
          </h3>
          {info.isWeekend && (
            <span className="text-[9px] font-mono text-accent/60 bg-accent/10 px-1.5 py-0.5 rounded">weekend</span>
          )}
        </div>
        <span
          className={`font-mono text-xs tracking-widest uppercase ${
            isToday ? 'text-primary font-bold' :
            info.isWeekend ? 'text-accent/70' :
            'text-bronze'
          }`}
        >
          {dateLabel}
        </span>
      </div>

      {/* Sections — horizontal in focused mode, vertical in multi-day */}
      <div className={`flex-1 overflow-auto no-scrollbar pb-6 ${
        isFocused
          ? 'flex gap-4 overflow-x-auto items-start'
          : 'space-y-3'
      }`}>
        {visibleSections.map(section => {
          const sectionTasks = tasksBySection[section.id] ?? [];
          const sectionEvents = eventsBySection[section.id] ?? [];
          const isCollapsed = collapsed[section.id] ?? false;
          const isZoomed = zoomedSection === section.id;
          const name = sectionNames[section.id] ?? section.name;

          // In focused mode, each section is a fixed-width column; in multi-day mode, stacked vertically
          const sectionWidthClass = isFocused ? 'min-w-[300px] w-[300px] shrink-0' : '';

          if (isZoomed) {
            return (
              <div key={section.id} className={sectionWidthClass}>
                <ZoomedSection
                  section={section}
                  customName={name}
                  tasks={sectionTasks}
                  events={sectionEvents}
                  onBack={() => setZoomedSection(null)}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onDrop={handleDropZoomed}
                  draggingId={draggingId}
                  onDragStartEntry={handleDragStart}
                />
              </div>
            );
          }

          return (
            <div key={section.id} className={`${sectionWidthClass} rounded border ${section.accentColor} overflow-hidden`}>
              <SectionHeader
                section={section}
                customName={name}
                onRename={name => onRenameSection(section.id, name)}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => toggleCollapse(section.id)}
                onZoom={() => setZoomedSection(section.id)}
                onUnpinTimes={() => {
                  const timed = sectionTasks.filter(t => !!t.timeBlock);
                  if (timed.length > 0) {
                    onBatchUpdate(timed.map(t => ({
                      id: t.id,
                      updates: { timeBlock: undefined, section: section.id },
                    })));
                  }
                }}
                taskCount={sectionTasks.length}
                eventCount={sectionEvents.length}
                hasTimedTasks={sectionTasks.some(t => !!t.timeBlock)}
              />

              {!isCollapsed && (
                <SectionBody
                  section={section}
                  date={info.iso}
                  tasks={sectionTasks}
                  events={sectionEvents}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onAdd={onAdd}
                  onDrop={handleDrop}
                  onBatchDrop={handleBatchDrop}
                  draggingId={draggingId}
                  onDragStartEntry={handleDragStart}
                  selectedIds={selectedIds}
                  onToggleSelect={onToggleSelect}
                  bulkMode={bulkMode}
                  onStartTimer={onStartTimer}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main FlowView ────────────────────────────────────────────────────────── */

export default function FlowView() {
  const { entries, addEntry, updateEntry, batchUpdateEntries, deleteEntry, habits, toggleHabit } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [parkingInput, setParkingInput] = useState('');
  const parkingInputRef = useRef<HTMLInputElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [sections, setSections] = useState<DaySection[]>(loadSections);
  const [focusedDay, setFocusedDay] = useState<number | null>(null); // null = show all

  // ── Dynamic day range (infinite scroll) ─────────────────────────
  const [rangeStart, setRangeStart] = useState(-1);    // earliest offset
  const [rangeEnd, setRangeEnd] = useState(13);         // latest offset (2 weeks ahead)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLInputElement>(null);

  // ── Visual timer ──────────────────────────────────────────────────
  const [timerTask, setTimerTask] = useState<string | null>(null);

  // Build the offsets array from rangeStart to rangeEnd
  const allDayOffsets = useMemo(() => {
    const offsets: number[] = [];
    for (let i = rangeStart; i <= rangeEnd; i++) offsets.push(i);
    return offsets;
  }, [rangeStart, rangeEnd]);

  // Extend range when user scrolls near edges
  const prevScrollWidthRef = useRef(0);
  const handleScrollExtend = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || focusedDay !== null) return;
    // Near right edge → extend future
    if (el.scrollLeft + el.clientWidth > el.scrollWidth - 400) {
      setRangeEnd(prev => prev + 7);
    }
    // Near left edge → extend past (compensate scroll position)
    if (el.scrollLeft < 400) {
      prevScrollWidthRef.current = el.scrollWidth;
      setRangeStart(prev => prev - 7);
    }
  }, [focusedDay]);

  // After prepending days to the left, adjust scroll position so the viewport doesn't jump
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || focusedDay !== null || prevScrollWidthRef.current === 0) return;
    const added = el.scrollWidth - prevScrollWidthRef.current;
    if (added > 0) {
      el.scrollLeft += added;
    }
    prevScrollWidthRef.current = 0;
  }, [rangeStart, focusedDay]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || focusedDay !== null) return;
    el.addEventListener('scroll', handleScrollExtend, { passive: true });
    return () => el.removeEventListener('scroll', handleScrollExtend);
  }, [handleScrollExtend, focusedDay]);

  // Jump to a specific date via date picker
  const jumpToDate = useCallback((dateString: string) => {
    const target = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    // Extend range if needed
    if (diff < rangeStart) setRangeStart(diff - 1);
    if (diff > rangeEnd) setRangeEnd(diff + 7);
    setFocusedDay(diff);
    setShowDatePicker(false);
  }, [rangeStart, rangeEnd]);

  // Which days to actually render — focused or all
  const visibleOffsets = focusedDay !== null ? [focusedDay] : allDayOffsets;

  // Day labels for the chip bar — show a rolling window for quick access
  const chipOffsets = [-1, 0, 1, 2, 3, 4, 5, 6];
  const dayChips = useMemo(() =>
    chipOffsets.map(offset => {
      const info = dayLabel(offset);
      const chipLabel =
        offset === -1 ? 'Yest' :
        offset === 0 ? 'Today' :
        offset === 1 ? 'Tmrw' :
        info.shortWeekday;
      return { offset, label: chipLabel, isWeekend: info.isWeekend };
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  // ── Bulk selection state ────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setBulkMode(false);
  }, []);

  // Derived: name overrides (for backward compat, names are now part of section objects)
  const sectionNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of sections) map[s.id] = s.name;
    return map;
  }, [sections]);

  const handleRenameSectionGlobal = useCallback((sectionId: string, newName: string) => {
    setSections(prev => {
      const updated = prev.map(s => s.id === sectionId ? { ...s, name: newName } : s);
      saveSections(updated);
      return updated;
    });
  }, []);

  const handleUpdateSections = useCallback((newSections: DaySection[]) => {
    setSections(newSections);
    saveSections(newSections);
  }, []);

  // Parking lot: truly unscheduled tasks — today's or undated tasks without a section
  // (don't show future-dated tasks here; they belong in their day column)
  const parkingLotEntries = useMemo(() => {
    const today = dateStr(0);
    return entries.filter(e =>
      e.type === 'task' &&
      !e.timeBlock &&
      !e.section &&
      e.status === 'todo' &&
      (!e.date || e.date <= today)
    );
  }, [entries]);

  // Entries per day column
  const entriesByDay = useMemo(() => {
    const map: Record<number, RapidLogEntry[]> = {};
    for (const offset of allDayOffsets) {
      const d = dateStr(offset);
      map[offset] = entries.filter(e => e.date === d && e.type !== 'note');
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, allDayOffsets]);

  // Scroll to today column on mount and when exiting focused mode
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (focusedDay !== null) {
      hasScrolledRef.current = false;
      return;
    }
    const el = scrollContainerRef.current;
    if (!el) return;
    // Temporarily disable snap so programmatic scroll lands exactly on today
    el.style.scrollSnapType = 'none';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const todayCol = el.querySelector('[data-today]') as HTMLElement | null;
        if (todayCol) {
          el.scrollLeft = todayCol.offsetLeft - 16;
        }
        hasScrolledRef.current = true;
        // Re-enable snap after scroll position is set
        setTimeout(() => { el.style.scrollSnapType = ''; }, 50);
      });
    });
  }, [focusedDay]);

  // Navigation: scroll to adjacent day
  const scrollToDay = useCallback((direction: 'prev' | 'next') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const colWidth = 340; // approx column width
    const delta = direction === 'next' ? colWidth : -colWidth;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  /* ── Drag handlers ─────────────────────────────────────────────────── */

  const handleDragStartEntry = useCallback((e: React.DragEvent, entryId: string, sourceDate: string) => {
    setDraggingId(entryId);
    // Include all selected ids for bulk drag, or just the single entry
    const ids = selectedIds.size > 0 && selectedIds.has(entryId)
      ? Array.from(selectedIds)
      : [entryId];
    const payload: DragPayload = {
      entryId,
      entryIds: ids,
      sourceSection: null,
      sourceDate,
    };
    e.dataTransfer.setData('application/json', encodeDrag(payload));
    e.dataTransfer.effectAllowed = 'move';

    // Show bulk drag count in ghost
    if (ids.length > 1) {
      const ghost = document.createElement('div');
      ghost.textContent = `${ids.length} tasks`;
      ghost.className = 'fixed -top-[200px] bg-primary text-white text-xs font-mono px-3 py-1.5 rounded-full shadow-lg';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 40, 15);
      setTimeout(() => ghost.remove(), 0);
    }
  }, [selectedIds]);

  const handleDragStartParking = useCallback((e: React.DragEvent, entryId: string) => {
    setDraggingId(entryId);
    const entry = entries.find(en => en.id === entryId);
    const ids = selectedIds.size > 0 && selectedIds.has(entryId)
      ? Array.from(selectedIds)
      : [entryId];
    const payload: DragPayload = {
      entryId,
      entryIds: ids,
      sourceSection: null,
      sourceDate: entry?.date ?? '',
    };
    e.dataTransfer.setData('application/json', encodeDrag(payload));
    e.dataTransfer.effectAllowed = 'move';
  }, [entries, selectedIds]);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  // Drop onto a section (broad view) — assign to section without exact time
  const handleDropToSection = useCallback((entryId: string, targetSectionId: string, targetDate: string) => {
    // entryId is the primary, but SectionBody's handleDrop now handles bulk via payload.entryIds
    updateEntry(entryId, { date: targetDate, section: targetSectionId, timeBlock: undefined });
  }, [updateEntry]);

  // Drop onto a zoomed slot — set precise timeBlock + section
  const handleDropToZoomedSlot = useCallback((entryId: string, targetSectionId: string, targetDate: string, timeBlock: string) => {
    updateEntry(entryId, { date: targetDate, timeBlock, section: targetSectionId });
  }, [updateEntry]);

  /* ── Parking lot actions ───────────────────────────────────────────── */

  const addParkingLotTask = () => {
    const trimmed = parkingInput.trim();
    if (!trimmed) return;

    // Parse natural language: "Thursday 7-10pm: dinner" → event on Thursday
    const parsed = parseNaturalEntry(trimmed);

    if (parsed.type === 'event') {
      addEntry({
        id: uid(),
        type: 'event',
        title: parsed.title,
        date: parsed.date || dateStr(0),
        time: parsed.time,
        duration: parsed.duration,
      });
    } else {
      addEntry({
        id: uid(),
        type: 'task',
        title: parsed.title,
        status: 'todo',
        date: parsed.date || dateStr(0),
        priority: 'medium',
        movedCount: 0,
        timeBlock: parsed.time, // if time detected, schedule it
      });
    }

    setParkingInput('');
    parkingInputRef.current?.focus();
  };

  const scheduleToToday = (entryId: string) => {
    updateEntry(entryId, { date: dateStr(0), timeBlock: undefined });
  };

  /* ── Parking lot drop zone ─────────────────────────────────────────── */

  const [parkingDragOver, setParkingDragOver] = useState(false);

  const handleParkingDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setParkingDragOver(true);
  };

  const handleParkingDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setParkingDragOver(false);
    const payload = decodeDrag(e.dataTransfer.getData('application/json'));
    if (payload) {
      // Unschedule: remove timeBlock and section assignment (atomic batch)
      batchUpdateEntries(payload.entryIds.map(id => ({
        id,
        updates: { timeBlock: undefined, section: undefined },
      })));
      clearSelection();
    }
  };

  return (
    <div
      className="flex h-[calc(100vh-64px)] overflow-hidden bg-paper"
      onDragEnd={handleDragEnd}
    >
      {/* ─── Mobile sidebar toggle ─────────────────────────────────────── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-[72px] left-2 z-50 md:hidden bg-surface-light shadow-soft rounded-full w-9 h-9 flex items-center justify-center border border-wood-light/40"
      >
        <span className="material-symbols-outlined text-[18px] text-ink">
          {sidebarOpen ? 'chevron_left' : 'inbox'}
        </span>
      </button>

      {/* ─── Sidebar: Parking Lot ──────────────────────────────────────── */}
      <aside
        onDragOver={handleParkingDragOver}
        onDragLeave={() => setParkingDragOver(false)}
        onDrop={handleParkingDrop}
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-out fixed md:relative z-40 w-[85vw] md:w-[20%] md:min-w-[260px] md:max-w-[300px] h-full flex flex-col border-r border-wood-light/50 bg-surface-light/90 backdrop-blur-md shadow-soft md:translate-x-0 ${
          parkingDragOver ? 'ring-2 ring-primary/30 ring-inset' : ''
        }`}
      >
        <div className="p-5 pb-2">
          <h2 className="font-display italic text-lg text-ink mb-0.5">Parking Lot</h2>
          <p className="font-handwriting text-xs text-bronze">Unscheduled tasks</p>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar">
          {parkingLotEntries.length === 0 && (
            <p className="text-xs font-handwriting text-pencil/40 italic text-center py-6">
              All tasks scheduled.
            </p>
          )}

          {parkingLotEntries.map(entry => (
            <ParkingLotItem
              key={entry.id}
              entry={entry}
              onSchedule={scheduleToToday}
              onUpdate={updateEntry}
              onDelete={deleteEntry}
              onDragStart={handleDragStartParking}
              isDragging={draggingId === entry.id}
            />
          ))}
        </div>

        {/* Daily Rituals (habits) — draggable into sections */}
        {habits.length > 0 && (
          <div className="px-4 py-2 border-t border-wood-light/20">
            <p className="text-[10px] font-mono text-pencil uppercase tracking-widest mb-2">Daily Rituals</p>
            <div className="space-y-1.5">
              {habits.map(habit => {
                const todayStr = dateStr(0);
                const isCompleted = habit.completedDates.includes(todayStr);
                return (
                  <div
                    key={habit.id}
                    draggable
                    onDragStart={e => {
                      // Create a task from this habit when dropped
                      const tempId = `habit-${habit.id}-${todayStr}`;
                      const payload: DragPayload = {
                        entryId: tempId,
                        entryIds: [tempId],
                        sourceSection: null,
                        sourceDate: todayStr,
                      };
                      e.dataTransfer.setData('application/json', encodeDrag(payload));
                      e.dataTransfer.effectAllowed = 'copy';
                      // Store habit info for drop handler
                      e.dataTransfer.setData('text/plain', `habit:${habit.id}:${habit.name}`);
                    }}
                    className={`flex items-center gap-2 p-2 rounded cursor-grab active:cursor-grabbing transition-all hover:bg-sage/10 ${
                      isCompleted ? 'opacity-40' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleHabit(habit.id, todayStr)}
                      className="shrink-0"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${
                        isCompleted ? 'text-sage' : 'text-pencil/40 hover:text-primary'
                      }`}>
                        {isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </button>
                    <span className={`text-xs font-body ${isCompleted ? 'text-pencil line-through' : 'text-ink'}`}>
                      {habit.name}
                    </span>
                    {habit.streak > 0 && (
                      <span className="text-[9px] font-mono text-pencil/50 ml-auto">{habit.streak}d</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add task input */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2">
            <input
              ref={parkingInputRef}
              value={parkingInput}
              onChange={e => setParkingInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addParkingLotTask(); }}
              placeholder="Add a task..."
              className="flex-1 bg-transparent border-b border-dashed border-bronze/40 text-sm font-body text-ink placeholder:text-pencil/40 outline-none py-2 focus:border-primary/60 transition-colors"
            />
            <button
              onClick={addParkingLotTask}
              disabled={!parkingInput.trim()}
              className="text-bronze hover:text-primary disabled:opacity-30 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-wood-light/30">
          <div className="flex items-center gap-2 text-xs font-mono text-pencil">
            <span className="material-symbols-outlined text-[14px]">inventory_2</span>
            <span>{parkingLotEntries.length} unscheduled</span>
          </div>
        </div>
      </aside>

      {/* ─── Mobile click-away overlay ─────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/20 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Timeline Container ────────────────────────────────────────── */}
      <div className="flex-1 h-full relative overflow-hidden flex flex-col">
        {/* Day toggle bar */}
        <div className="flex items-center gap-2 px-4 md:px-6 pt-3 pb-2 border-b border-wood-light/20 bg-paper/80 backdrop-blur-sm z-20 shrink-0">
          {/* Day chips */}
          <div className="flex items-center gap-1.5 flex-1 flex-wrap">
            <button
              onClick={() => { setFocusedDay(null); clearSelection(); }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-all ${
                focusedDay === null
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-pencil hover:text-ink hover:bg-surface-light'
              }`}
            >
              All
            </button>
            {dayChips.map(chip => (
              <button
                key={chip.offset}
                onClick={() => setFocusedDay(focusedDay === chip.offset ? null : chip.offset)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-all ${
                  focusedDay === chip.offset
                    ? 'bg-primary text-white shadow-soft'
                    : chip.isWeekend
                      ? 'text-accent/70 hover:text-accent hover:bg-accent/10'
                      : 'text-pencil hover:text-ink hover:bg-surface-light'
                }`}
              >
                {chip.label}
              </button>
            ))}

            {/* Date picker jump button */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="px-2 py-1 rounded-full text-[11px] font-mono text-pencil hover:text-primary hover:bg-surface-light transition-all flex items-center gap-1"
                title="Jump to any date"
              >
                <span className="material-symbols-outlined text-[14px]">calendar_month</span>
              </button>
              {showDatePicker && (
                <div className="absolute top-full mt-1 left-0 z-50 bg-paper rounded-lg shadow-lifted border border-wood-light/30 p-3">
                  <input
                    ref={datePickerRef}
                    type="date"
                    onChange={e => { if (e.target.value) jumpToDate(e.target.value); }}
                    className="text-sm font-mono text-ink bg-surface-light border border-wood-light/30 rounded-lg px-3 py-2 outline-none focus:border-primary/40"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Bulk select toggle */}
            <button
              onClick={() => { setBulkMode(!bulkMode); if (bulkMode) clearSelection(); }}
              className={`px-2 py-1 rounded-full text-[11px] font-mono transition-all flex items-center gap-1 ${
                bulkMode
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                  : 'text-pencil hover:text-primary hover:bg-surface-light'
              }`}
              title="Toggle bulk select mode"
            >
              <span className="material-symbols-outlined text-[14px]">checklist</span>
              {bulkMode && selectedIds.size > 0 && (
                <span className="text-[10px]">{selectedIds.size}</span>
              )}
            </button>

            {/* Clear selection */}
            {bulkMode && selectedIds.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-2 py-1 rounded-full text-[10px] font-mono text-pencil hover:text-rose hover:bg-rose/10 transition-all"
              >
                Clear
              </button>
            )}
          </div>

          {/* Navigation arrows + hint (only in multi-day view) */}
          {focusedDay === null && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-pencil/40 hidden sm:inline">scroll to navigate →</span>
              <button
                onClick={() => scrollToDay('prev')}
                className="w-7 h-7 rounded-full flex items-center justify-center text-pencil hover:text-primary hover:bg-surface-light transition-colors"
                title="Previous day"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                onClick={() => scrollToDay('next')}
                className="w-7 h-7 rounded-full flex items-center justify-center text-pencil hover:text-primary hover:bg-surface-light transition-colors"
                title="Next day"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          )}

          {/* Focused day nav arrows — unlimited navigation */}
          {focusedDay !== null && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const prev = focusedDay - 1;
                  if (prev < rangeStart) setRangeStart(prev - 1);
                  setFocusedDay(prev);
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-pencil hover:text-primary hover:bg-surface-light transition-colors"
                title="Previous day"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                onClick={() => {
                  const next = focusedDay + 1;
                  if (next > rangeEnd) setRangeEnd(next + 7);
                  setFocusedDay(next);
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-pencil hover:text-primary hover:bg-surface-light transition-colors"
                title="Next day"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              {/* Back to today shortcut */}
              {focusedDay !== 0 && (
                <button
                  onClick={() => setFocusedDay(0)}
                  className="px-2 py-1 rounded-full text-[10px] font-mono text-primary/70 hover:text-primary hover:bg-primary/5 transition-all ml-1"
                >
                  Today
                </button>
              )}
            </div>
          )}
        </div>

        {/* Background vertical grid lines */}
        <div className="flex-1 relative overflow-hidden">
          {focusedDay === null && (
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: 'linear-gradient(to right, #3D3A36 1px, transparent 1px)',
                backgroundSize: '340px 100%',
              }}
            />
          )}

          {/* Horizontal scrollable day columns */}
          <div
            ref={scrollContainerRef}
            className={`w-full h-full overflow-x-auto flex items-start px-4 md:px-6 pt-4 pb-12 gap-0 no-scrollbar ${
              focusedDay === null ? 'snap-x snap-mandatory' : 'justify-center'
            }`}
          >
            {visibleOffsets.map(offset => (
              <DayColumn
                key={offset}
                offset={offset}
                entries={entriesByDay[offset] ?? []}
                sections={sections}
                sectionNames={sectionNames}
                onUpdate={updateEntry}
                onBatchUpdate={batchUpdateEntries}
                onDelete={deleteEntry}
                onAdd={addEntry}
                onDrop={handleDropToSection}
                onDropZoomed={handleDropToZoomedSlot}
                draggingId={draggingId}
                onDragStartEntry={handleDragStartEntry}
                onRenameSection={handleRenameSectionGlobal}
                isFocused={focusedDay !== null}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                bulkMode={bulkMode}
                onStartTimer={title => setTimerTask(title)}
              />
            ))}

            {/* Trailing spacer (multi-day only) */}
            {focusedDay === null && <div className="min-w-[100px] h-full shrink-0" />}
          </div>

          {/* Section manager panel — floating */}
          <SectionManager
            sections={sections}
            onUpdateSections={handleUpdateSections}
          />
        </div>
      </div>

      {/* Visual Timer popup */}
      {timerTask && (
        <VisualTimer
          taskTitle={timerTask}
          onClose={() => setTimerTask(null)}
        />
      )}
    </div>
  );
}

/* ── Section Manager (add/edit/remove/reorder) ───────────────────────────── */

function SectionManager({
  sections,
  onUpdateSections,
}: {
  sections: DaySection[];
  onUpdateSections: (sections: DaySection[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Draggable panel position
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = panelPos ?? { x: rect.left, y: rect.top };
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setPanelPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  function handleAdd() {
    // Find a time gap, or create an overlapping section with a reasonable default
    const lastSection = sections[sections.length - 1];
    let startHour: number;
    let endHour: number;

    if (!lastSection) {
      startHour = 6;
      endHour = 9;
    } else if (lastSection.endHour < 24) {
      // There's room after the last section
      startHour = lastSection.endHour;
      endHour = Math.min(startHour + 3, 24);
    } else {
      // Day is fully covered — create a midday section (overlapping is OK, user can adjust)
      startHour = 9;
      endHour = 12;
    }

    const colorIndex = sections.length % SECTION_COLORS.length;
    const newSection: DaySection = {
      id: `section-${Date.now().toString(36)}`,
      name: 'New Section',
      startHour,
      endHour,
      color: SECTION_COLORS[colorIndex].color,
      accentColor: SECTION_COLORS[colorIndex].accent,
    };
    onUpdateSections([...sections, newSection]);
    setEditingId(newSection.id);
  }

  function handleRemove(id: string) {
    if (sections.length <= 1) return; // must keep at least one
    onUpdateSections(sections.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function handleUpdate(id: string, updates: Partial<DaySection>) {
    onUpdateSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const arr = [...sections];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    onUpdateSections(arr);
  }

  function handleMoveDown(index: number) {
    if (index >= sections.length - 1) return;
    const arr = [...sections];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    onUpdateSections(arr);
  }

  function handleReset() {
    onUpdateSections(INITIAL_SECTIONS);
    setEditingId(null);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute top-4 right-4 bg-surface-light/90 backdrop-blur-sm shadow-soft rounded-full px-3 py-1.5 flex items-center gap-1.5 text-pencil hover:text-primary border border-wood-light/40 transition-colors z-30"
        title="Manage sections"
      >
        <span className="material-symbols-outlined text-[16px]">dashboard_customize</span>
        <span className="text-xs font-mono">Sections</span>
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      className="bg-surface-light shadow-lifted rounded-lg border border-wood-light/40 p-4 z-30 w-80 max-h-[80vh] overflow-y-auto no-scrollbar"
      style={panelPos
        ? { position: 'fixed', left: panelPos.x, top: panelPos.y }
        : { position: 'absolute', top: 16, right: 16 }
      }
    >
      <div
        className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handleDragStart}
      >
        <h4 className="font-display italic text-sm text-ink flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-pencil/40">drag_indicator</span>
          Manage Sections
        </h4>
        <button onClick={() => { setOpen(false); setEditingId(null); setPanelPos(null); }} className="text-pencil hover:text-ink transition-colors">
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      {/* Section list */}
      <div className="space-y-2 mb-4">
        {sections.map((s, index) => (
          <SectionManagerRow
            key={s.id}
            section={s}
            index={index}
            total={sections.length}
            isEditing={editingId === s.id}
            onStartEdit={() => setEditingId(s.id === editingId ? null : s.id)}
            onUpdate={updates => handleUpdate(s.id, updates)}
            onRemove={() => handleRemove(s.id)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            canRemove={sections.length > 1}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-wood-light/30">
        <button
          onClick={handleAdd}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-wood-light/50 text-ink-light hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-body"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          Add Section
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-2 rounded-lg text-xs font-body text-ink-light hover:text-ink hover:bg-surface-light transition-colors"
          title="Reset to defaults"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function SectionManagerRow({
  section,
  index,
  total,
  isEditing,
  onStartEdit,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canRemove,
}: {
  section: DaySection;
  index: number;
  total: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onUpdate: (updates: Partial<DaySection>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canRemove: boolean;
}) {
  const [name, setName] = useState(section.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setName(section.name); }, [section.name]);

  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== section.name) onUpdate({ name: trimmed });
    else setName(section.name);
  };

  return (
    <div className={`rounded-lg border transition-all ${isEditing ? 'border-primary/30 bg-paper' : 'border-wood-light/20 bg-paper/50'}`}>
      {/* Compact row */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Reorder arrows */}
        <div className="flex flex-col shrink-0">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="text-pencil/40 hover:text-ink disabled:opacity-20 transition-colors leading-none"
          >
            <span className="material-symbols-outlined text-[12px]">keyboard_arrow_up</span>
          </button>
          <button
            onClick={onMoveDown}
            disabled={index >= total - 1}
            className="text-pencil/40 hover:text-ink disabled:opacity-20 transition-colors leading-none"
          >
            <span className="material-symbols-outlined text-[12px]">keyboard_arrow_down</span>
          </button>
        </div>

        {/* Color swatch */}
        <div className={`w-3 h-3 rounded-sm ${section.color} border ${section.accentColor} shrink-0`} />

        {/* Name (inline editable) */}
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={e => { if (e.key === 'Enter') { commitName(); (e.target as HTMLInputElement).blur(); } }}
          className="flex-1 text-sm font-body text-ink bg-transparent border-b border-transparent focus:border-primary/40 outline-none py-0.5 transition-colors min-w-0"
        />

        {/* Time range */}
        <span className="text-[9px] font-mono text-pencil/60 shrink-0">
          {formatHour12(section.startHour)}–{formatHour12(section.endHour)}
        </span>

        {/* Pinned days hint */}
        {section.pinnedDays && section.pinnedDays.length > 0 && section.pinnedDays.length < 7 && (
          <span className="text-[8px] font-mono text-primary/50 shrink-0">
            {section.pinnedDays.length === 5 && [1,2,3,4,5].every(d => section.pinnedDays!.includes(d))
              ? 'Wkdays'
              : section.pinnedDays.length === 2 && [0,6].every(d => section.pinnedDays!.includes(d))
                ? 'Wkends'
                : section.pinnedDays.map(d => ['S','M','T','W','T','F','S'][d]).join('')
            }
          </span>
        )}

        {/* Expand/collapse edit */}
        <button
          onClick={onStartEdit}
          className={`text-pencil/50 hover:text-primary transition-colors shrink-0 ${isEditing ? 'text-primary' : ''}`}
        >
          <span className="material-symbols-outlined text-[14px]">{isEditing ? 'expand_less' : 'tune'}</span>
        </button>
      </div>

      {/* Expanded editor */}
      {isEditing && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-wood-light/15">
          {/* Time range */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono text-pencil/60 w-10 shrink-0">From</label>
            <select
              value={section.startHour}
              onChange={e => onUpdate({ startHour: Number(e.target.value) })}
              className="flex-1 text-xs font-mono text-ink bg-surface-light/50 border border-wood-light/30 rounded px-2 py-1 outline-none focus:border-primary/40"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{formatHour12(h)}</option>
              ))}
            </select>
            <label className="text-[10px] font-mono text-pencil/60 w-6 shrink-0 text-center">to</label>
            <select
              value={section.endHour}
              onChange={e => onUpdate({ endHour: Number(e.target.value) })}
              className="flex-1 text-xs font-mono text-ink bg-surface-light/50 border border-wood-light/30 rounded px-2 py-1 outline-none focus:border-primary/40"
            >
              {Array.from({ length: 24 }, (_, h) => h + 1).map(h => (
                <option key={h} value={h}>{formatHour12(h % 24)}</option>
              ))}
            </select>
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono text-pencil/60 w-10 shrink-0">Color</label>
            <div className="flex gap-1.5 flex-wrap">
              {SECTION_COLORS.map(c => (
                <button
                  key={c.label}
                  onClick={() => onUpdate({ color: c.color, accentColor: c.accent })}
                  className={`w-6 h-6 rounded-md ${c.color} border ${c.accent} transition-all ${
                    section.color === c.color ? 'ring-2 ring-primary/50 ring-offset-1' : 'hover:ring-1 hover:ring-primary/30'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Pinned days */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-pencil/60">Days</label>
            <div className="flex items-center gap-1 flex-wrap">
              {(['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const).map((label, dayIdx) => {
                const pinned = section.pinnedDays ?? [];
                const isActive = pinned.length === 0 || pinned.includes(dayIdx);
                const isAllDays = !section.pinnedDays || section.pinnedDays.length === 0;
                return (
                  <button
                    key={dayIdx}
                    onClick={() => {
                      if (isAllDays) {
                        onUpdate({ pinnedDays: [dayIdx] });
                      } else if (isActive && pinned.length === 1) {
                        onUpdate({ pinnedDays: undefined });
                      } else if (isActive) {
                        onUpdate({ pinnedDays: pinned.filter(d => d !== dayIdx) });
                      } else {
                        onUpdate({ pinnedDays: [...pinned, dayIdx].sort() });
                      }
                    }}
                    className={`w-7 h-7 rounded text-[10px] font-mono transition-all ${
                      isActive
                        ? isAllDays
                          ? 'bg-surface-light text-pencil/60 border border-wood-light/30'
                          : 'bg-primary/15 text-primary border border-primary/30 font-medium'
                        : 'bg-transparent text-pencil/30 border border-dashed border-wood-light/20 hover:border-primary/30'
                    }`}
                    title={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIdx]}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {/* Quick presets */}
            <div className="flex gap-1.5">
              {([
                { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
                { label: 'Weekends', days: [0, 6] },
                { label: 'Every day', days: undefined as number[] | undefined },
              ] as const).map(preset => {
                const current = section.pinnedDays;
                const isActive = preset.days === undefined
                  ? !current || current.length === 0
                  : current?.length === preset.days.length && preset.days.every(d => current.includes(d));
                return (
                  <button
                    key={preset.label}
                    onClick={() => onUpdate({ pinnedDays: preset.days ? [...preset.days] : undefined })}
                    className={`text-[9px] font-mono px-2 py-1 rounded transition-all ${
                      isActive
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'text-pencil/50 hover:text-primary bg-surface-light/50 hover:bg-primary/5 border border-transparent'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delete */}
          <div className="flex justify-end">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-body text-ink-light">Remove section?</span>
                <button
                  onClick={() => { onRemove(); setConfirmDelete(false); }}
                  className="text-[10px] font-body font-medium text-tension hover:text-tension/80 px-2 py-1 rounded bg-tension/10 hover:bg-tension/15 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[10px] font-body text-ink-light hover:text-ink px-2 py-1 transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => canRemove ? setConfirmDelete(true) : undefined}
                disabled={!canRemove}
                className="text-[10px] font-body text-ink-light/50 hover:text-tension disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Remove section
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
