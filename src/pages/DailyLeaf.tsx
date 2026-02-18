import { useState, useRef, useEffect, useMemo, useCallback, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { generateMorningPrompt } from '../lib/prompts';
import { getPlaceholder, SIGNIFIER_TOOLTIPS } from '../lib/bujoHints';
import { JOURNAL_METHODS } from '../lib/journalMethods';
import JournalWalkthrough from '../components/JournalWalkthrough';
import ProcrastinationUnpacker from '../components/ProcrastinationUnpacker';
import DayRecovery from '../components/DayRecovery';
import DayDebriefComponent from '../components/DayDebrief';
import { useTaskCelebration } from '../components/TaskCelebration';
import { parseNaturalEntry } from '../lib/nlParser';
import { todayStr, dayAfter, formatLocalDate } from '../lib/dateUtils';
import type { RapidLogEntry, JournalStep, JournalEntry } from '../context/AppContext';
import type { JournalMethod } from '../lib/journalMethods';

/* ── Constants ────────────────────────────────────────────────────── */

type EntryType = 'task' | 'event' | 'note';
type Priority = 'low' | 'medium' | 'high';

const PRIORITY_STYLES: Record<Priority, { dot: string; label: string }> = {
  low: { dot: 'bg-sage', label: 'Low' },
  medium: { dot: 'bg-bronze', label: 'Med' },
  high: { dot: 'bg-tension', label: 'High' },
};

const PRIORITY_ORDER: Priority[] = ['low', 'medium', 'high'];

const TYPE_PILLS: { type: EntryType; symbol: string; label: string }[] = [
  { type: 'task', symbol: '\u2022', label: 'Task' },
  { type: 'event', symbol: '\u25cb', label: 'Event' },
  { type: 'note', symbol: '\u2014', label: 'Note' },
];

const ESTIMATED_TASK_HOURS = 0.75; // ~45 min per task average

/* ── Helpers ──────────────────────────────────────────────────────── */

/* todayStr imported from lib/dateUtils (local timezone safe) */

function isEvening(): boolean {
  return new Date().getHours() >= 18;
}

function isAfterNoon(): boolean {
  return new Date().getHours() >= 12;
}


function formatEventDate(dateStr: string, todayDate: string, tomorrowDate: string): string {
  if (dateStr === todayDate) return 'Today';
  if (dateStr === tomorrowDate) return 'Tomorrow';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/* ── Main Component ───────────────────────────────────────────────── */

export default function DailyLeaf() {
  const {
    entries,
    habits,
    journalEntries,
    debriefs,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleHabit,
    addJournalEntry,
    saveDebrief,
    deleteDebrief,
  } = useApp();

  /* ── Date & mode (auto-refresh on tab focus) ────────────────── */

  const [dateKey, setDateKey] = useState(todayStr);
  const [mode, setMode] = useState<'morning' | 'evening'>(
    isEvening() ? 'evening' : 'morning',
  );

  // Refresh dateKey + mode on tab focus AND every 60s (catches midnight rollover)
  useEffect(() => {
    const refresh = () => {
      setDateKey((prev) => {
        const now = todayStr();
        return prev !== now ? now : prev;
      });
      setMode((prev) => {
        const should = isEvening() ? 'evening' : 'morning';
        return prev !== should ? should : prev;
      });
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(refresh, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);

  // Derive today/tomorrow from dateKey — single source of truth.
  // Never call todayStr()/tomorrowStr() separately; that creates divergence.
  const today = dateKey;
  const tomorrow = dayAfter(dateKey);

  const todayDisplay = new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const yearStr = new Date(dateKey + 'T12:00:00').getFullYear();

  /* ── Intention (persisted per-date in localStorage) ──────────── */

  const intentionKey = `vellum-intention-${today}`;
  const [intention, setIntention] = useState(() =>
    localStorage.getItem(intentionKey) ?? '',
  );

  useEffect(() => {
    localStorage.setItem(intentionKey, intention);
  }, [intention, intentionKey]);

  // Re-read intention from localStorage when date rolls over
  useEffect(() => {
    setIntention(localStorage.getItem(intentionKey) ?? '');
  }, [intentionKey]);

  /* ── Rapid log input state ───────────────────────────────────── */

  const [entryType, setEntryType] = useState<EntryType>('task');
  const [newTitle, setNewTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [placeholder, setPlaceholder] = useState(() => getPlaceholder('task'));
  const newInputRef = useRef<HTMLInputElement>(null);

  /* ── Inline editing state ────────────────────────────────────── */

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  /* ── Overlays ────────────────────────────────────────────────── */

  const [stuckTask, setStuckTask] = useState<RapidLogEntry | null>(null);
  const [showDayRecovery, setShowDayRecovery] = useState(false);
  const [activeMethod, setActiveMethod] = useState<JournalMethod | null>(null);
  const [showSignifierHelp, setShowSignifierHelp] = useState(false);
  const [tomorrowAddInput, setTomorrowAddInput] = useState('');
  const tomorrowInputRef = useRef<HTMLInputElement>(null);

  /* ── Tomorrow intention (separate from today) ──────────────────── */

  const tomorrowIntentionKey = `vellum-intention-${tomorrow}`;
  const [tomorrowIntention, setTomorrowIntention] = useState(() =>
    localStorage.getItem(tomorrowIntentionKey) ?? '',
  );

  useEffect(() => {
    if (tomorrowIntention) localStorage.setItem(tomorrowIntentionKey, tomorrowIntention);
  }, [tomorrowIntention, tomorrowIntentionKey]);

  // Re-read tomorrow intention from localStorage when date rolls over
  useEffect(() => {
    setTomorrowIntention(localStorage.getItem(tomorrowIntentionKey) ?? '');
  }, [tomorrowIntentionKey]);

  /* ── Focus edit input on editing ─────────────────────────────── */

  useEffect(() => {
    if (editingEntryId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingEntryId]);

  /* ── Rotate placeholder when entry type changes ──────────────── */

  useEffect(() => {
    setPlaceholder(getPlaceholder(entryType));
  }, [entryType]);

  /* ── Derived data ────────────────────────────────────────────── */

  const todayEntries = useMemo(
    () => entries.filter((e) => e.date === today),
    [entries, today],
  );

  const todayTasks = useMemo(
    () => todayEntries.filter((e) => e.type === 'task'),
    [todayEntries],
  );

  const completedCount = todayTasks.filter((t) => t.status === 'done').length;
  const totalTaskCount = todayTasks.length;

  const tomorrowEntries = useMemo(
    () => entries.filter((e) => e.date === tomorrow),
    [entries, tomorrow],
  );

  const upcomingEvents = useMemo(() => {
    const cutoff = formatLocalDate((() => { const d = new Date(dateKey + 'T12:00:00'); d.setDate(d.getDate() + 7); return d; })());
    return entries
      .filter((e) => e.type === 'event' && e.date >= today && e.date <= cutoff)
      .sort((a, b) => {
        const dateCmp = a.date.localeCompare(b.date);
        if (dateCmp !== 0) return dateCmp;
        return (a.time ?? '').localeCompare(b.time ?? '');
      });
  }, [entries, today]);

  const todaysCompletedTasks = todayTasks.filter((t) => t.status === 'done');

  /* Auto-show day recovery: after noon with no tasks done */
  const shouldAutoShowRecovery =
    isAfterNoon() && todayTasks.length > 0 && completedCount === 0;

  useEffect(() => {
    if (shouldAutoShowRecovery && mode === 'morning') {
      setShowDayRecovery(true);
    }
  }, [shouldAutoShowRecovery, mode]);

  /* ── Morning prompt ──────────────────────────────────────────── */

  const morningPrompt = useMemo(
    () =>
      generateMorningPrompt({
        entries,
        habits,
        journalEntries,
        debriefs,
      }),
    [entries, habits, journalEntries, debriefs],
  );

  /* ── Capacity warning ────────────────────────────────────────── */

  const capacityWarning = useMemo(() => {
    const openTasks = todayTasks.filter((t) => t.status === 'todo').length;
    if (openTasks <= 5) return null;
    const estimatedHours = (openTasks * ESTIMATED_TASK_HOURS).toFixed(1);
    return {
      count: openTasks,
      hours: estimatedHours,
    };
  }, [todayTasks]);

  /* ── Handlers: Add entry ─────────────────────────────────────── */

  const handleAddEntry = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter' || !newTitle.trim()) return;

      // Parse natural language: "Thursday 7-10pm: dinner" → event on Thursday
      const parsed = parseNaturalEntry(newTitle.trim());
      const resolvedType = parsed.type || entryType;
      const resolvedDate = parsed.date || today;

      const base: RapidLogEntry = {
        id: Date.now().toString(),
        type: resolvedType,
        title: parsed.title,
        date: resolvedDate,
      };

      if (resolvedType === 'task') {
        base.status = 'todo';
        base.priority = newPriority;
        base.movedCount = 0;
      }

      if (resolvedType === 'event') {
        if (parsed.time) base.time = parsed.time;
        else if (newEventTime) base.time = newEventTime;
        if (parsed.duration) base.duration = parsed.duration;
        if (parsed.endTime) base.timeBlock = parsed.endTime; // store end time in timeBlock for events
      }

      addEntry(base);
      setNewTitle('');
      setNewEventTime('');
      setNewPriority('medium');
      setPlaceholder(getPlaceholder(entryType));
    },
    [newTitle, entryType, newPriority, newEventTime, today, addEntry],
  );

  /* ── Handler: Add entry for tomorrow (Plan Tomorrow panel) ──── */

  const handleAddTomorrowEntry = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter' || !tomorrowAddInput.trim()) return;

      const parsed = parseNaturalEntry(tomorrowAddInput.trim());
      const resolvedType = parsed.type || 'task';

      const base: RapidLogEntry = {
        id: Date.now().toString(),
        type: resolvedType,
        title: parsed.title,
        date: parsed.date || tomorrow, // default to tomorrow
      };

      if (resolvedType === 'task') {
        base.status = 'todo';
        base.priority = 'medium';
        base.movedCount = 0;
      }

      if (resolvedType === 'event' && parsed.time) {
        base.time = parsed.time;
        if (parsed.duration) base.duration = parsed.duration;
      }

      addEntry(base);
      setTomorrowAddInput('');
    },
    [tomorrowAddInput, tomorrow, addEntry],
  );

  /* ── Handlers: Toggle task done ──────────────────────────────── */

  const celebrate = useTaskCelebration();

  const handleToggleTask = useCallback(
    (id: string, checkboxEl?: HTMLElement) => {
      const entry = entries.find((e) => e.id === id);
      if (entry && entry.type === 'task') {
        const wasUndone = entry.status !== 'done';
        updateEntry(id, {
          status: entry.status === 'done' ? 'todo' : 'done',
        });
        // Fire celebration when marking as DONE (not when unchecking)
        if (wasUndone && checkboxEl) {
          const newCount = todayTasks.filter(t => t.status === 'done').length + 1;
          celebrate(checkboxEl, newCount);
        }
      }
    },
    [entries, updateEntry, todayTasks, celebrate],
  );

  /* ── Handlers: Inline editing ────────────────────────────────── */

  const startEditing = useCallback((id: string, currentTitle: string) => {
    setEditingEntryId(id);
    setEditingValue(currentTitle);
  }, []);

  const commitEdit = useCallback(() => {
    if (editingEntryId && editingValue.trim()) {
      updateEntry(editingEntryId, { title: editingValue.trim() });
    }
    setEditingEntryId(null);
    setEditingValue('');
  }, [editingEntryId, editingValue, updateEntry]);

  const cancelEdit = useCallback(() => {
    setEditingEntryId(null);
    setEditingValue('');
  }, []);

  const handleEditKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') commitEdit();
      else if (e.key === 'Escape') cancelEdit();
    },
    [commitEdit, cancelEdit],
  );

  /* ── Handlers: Priority cycle ────────────────────────────────── */

  const cyclePriority = useCallback(() => {
    setNewPriority((prev) => {
      const idx = PRIORITY_ORDER.indexOf(prev);
      return PRIORITY_ORDER[(idx + 1) % PRIORITY_ORDER.length];
    });
  }, []);

  /* ── Handlers: Journal walkthrough complete ──────────────────── */

  const handleWalkthroughComplete = useCallback(
    (answers: JournalStep[], discovery?: string) => {
      if (!activeMethod) return;

      const content = discovery
        ? discovery
        : answers.map((s) => s.answer).join('\n\n');

      const entry: JournalEntry = {
        id: Date.now().toString(),
        date: dateKey,
        title: activeMethod.name,
        content,
        method: activeMethod.id,
        steps: answers,
      };
      addJournalEntry(entry);
      setActiveMethod(null);
    },
    [activeMethod, dateKey, addJournalEntry],
  );

  /* ── Handlers: Confetti ──────────────────────────────────────── */

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#ec7f13', '#8fa88f', '#C9A96E', '#C47C7C'],
    });
  }, []);

  /* ── Handlers: Debrief save ──────────────────────────────────── */

  const todayDebriefExists = debriefs.some(d => d.date === dateKey);
  const [debriefDismissed, setDebriefDismissed] = useState(false);
  const [redoDebrief, setRedoDebrief] = useState(false);
  const debriefHidden = (debriefDismissed || todayDebriefExists) && !redoDebrief;

  // Reset debrief UI state when the date rolls over
  useEffect(() => {
    setDebriefDismissed(false);
    setRedoDebrief(false);
  }, [dateKey]);

  /* ── Bullet rendering helpers ────────────────────────────────── */

  const bulletForEntry = (entry: RapidLogEntry) => {
    if (entry.type === 'event') {
      return (
        <span className="inline-block size-3 rounded-full border-2 border-ink/60 flex-shrink-0 mt-[7px]" />
      );
    }
    if (entry.type === 'note') {
      return (
        <span className="inline-block w-4 h-[2px] bg-ink/40 flex-shrink-0 mt-[14px]" />
      );
    }
    // Task
    if (entry.status === 'done') {
      return (
        <span className="text-primary font-bold text-lg flex-shrink-0 mt-[2px] select-none">
          &times;
        </span>
      );
    }
    return (
      <span className="inline-block size-2 rounded-full bg-ink flex-shrink-0 mt-[12px]" />
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */

  return (
    <>
      {/* ── Full-screen overlays ────────────────────────────────────── */}

      {stuckTask && (
        <ProcrastinationUnpacker
          task={stuckTask}
          onClose={() => setStuckTask(null)}
        />
      )}

      {activeMethod && (
        <JournalWalkthrough
          methodId={activeMethod.id}
          methodName={activeMethod.name}
          steps={activeMethod.steps}
          onComplete={handleWalkthroughComplete}
          onCancel={() => setActiveMethod(null)}
        />
      )}

      {/* ── Page ────────────────────────────────────────────────────── */}

      <div className="flex-1 overflow-y-auto bg-background-light">
        {/* ── Header strip (full width) ──────────────────────────── */}
        <header className="px-6 sm:px-10 pt-6 pb-4 border-b border-wood-light/15">
          <div className="max-w-[1400px] mx-auto flex items-end justify-between gap-4">
            <div>
              <span className="font-mono text-[11px] text-pencil tracking-[0.2em] uppercase block mb-1">
                {yearStr}
              </span>
              <h1 className="font-display italic text-3xl sm:text-4xl text-ink leading-tight">
                {todayDisplay}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Progress */}
              {totalTaskCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-[3px] bg-wood-light/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${(completedCount / totalTaskCount) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-pencil tabular-nums">
                    {completedCount}/{totalTaskCount}
                  </span>
                </div>
              )}
              {/* Mode toggle */}
              <div className="flex rounded-full border border-wood-light/40 overflow-hidden">
                <button
                  onClick={() => setMode('morning')}
                  className={`px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    mode === 'morning'
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-pencil hover:bg-surface-light'
                  }`}
                >
                  Morning
                </button>
                <button
                  onClick={() => setMode('evening')}
                  className={`px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    mode === 'evening'
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-pencil hover:bg-surface-light'
                  }`}
                >
                  Evening
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════
           MORNING MODE — 3-column layout
           ══════════════════════════════════════════════════════════ */}
        {mode === 'morning' && (
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] xl:grid-cols-[300px_1fr_300px] gap-6 items-start">

            {/* ── LEFT SIDEBAR ────────────────────────────────────── */}
            <aside className="hidden lg:flex flex-col gap-5 sticky top-6">
              {/* Morning Prompt */}
              <div className="bg-paper rounded-xl p-5 shadow-soft border border-wood-light/15">
                <p className="font-body text-sm text-ink/70 leading-relaxed mb-2">
                  {morningPrompt.contextual}
                </p>
                <p className="font-handwriting text-sm text-pencil/50 italic">
                  {morningPrompt.inspirational}
                </p>
              </div>

              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <div className="bg-paper rounded-xl p-5 shadow-soft border border-wood-light/15">
                  <h3 className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em] mb-3">
                    Upcoming Events
                  </h3>
                  <div className="space-y-2">
                    {upcomingEvents.slice(0, 5).map((ev) => (
                      <div key={ev.id} className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] text-primary/70 whitespace-nowrap">
                          {formatEventDate(ev.date, today, tomorrow)}
                          {ev.time && ` ${ev.time}`}
                        </span>
                        <span className="font-body text-sm text-ink/80 truncate">{ev.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick links */}
              <div className="flex flex-col gap-2">
                <Link
                  to="/flow"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-paper border border-wood-light/15 shadow-soft text-sm font-body text-ink hover:text-primary hover:border-primary/20 transition-all group/link"
                >
                  <span className="material-symbols-outlined text-[18px] text-pencil group-hover/link:text-primary transition-colors">calendar_view_day</span>
                  Flow View
                </Link>
              </div>
            </aside>

            {/* ── CENTER: Main journal ────────────────────────────── */}
            <main className="min-w-0">
              {/* Mobile-only: Morning prompt */}
              <div className="lg:hidden mb-4">
                <p className="font-body text-base text-ink/70 leading-relaxed">
                  {morningPrompt.contextual}
                </p>
                <p className="font-handwriting text-sm text-pencil/50 italic mt-1">
                  {morningPrompt.inspirational}
                </p>
              </div>

              {/* Intention */}
              <div className="mb-5">
                <label className="block font-mono text-[10px] text-accent uppercase tracking-[0.15em] mb-1.5">
                  Today&rsquo;s Intention
                </label>
                <div className="relative group/input">
                  <input
                    className="w-full bg-transparent border-none p-0 text-xl sm:text-2xl font-display text-ink placeholder:text-pencil/30 focus:ring-0 focus:outline-none italic"
                    placeholder="What is the one thing that matters today?"
                    type="text"
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                  />
                  <div className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-primary/40 group-focus-within/input:w-full transition-all duration-500" />
                </div>
              </div>

              {/* Day Recovery */}
              {showDayRecovery && (
                <div className="mb-4">
                  <DayRecovery entries={entries} onDismiss={() => setShowDayRecovery(false)} />
                </div>
              )}
              {!showDayRecovery && todayTasks.length > 0 && (
                <button
                  onClick={() => setShowDayRecovery(true)}
                  className="mb-3 font-mono text-[10px] text-pencil/50 hover:text-primary uppercase tracking-widest transition-colors"
                >
                  Reset My Day
                </button>
              )}

              {/* Capacity Warning */}
              {capacityWarning && (
                <div className="mb-4 bg-bronze/10 border border-bronze/20 rounded-lg px-4 py-3 text-sm font-body text-ink/80">
                  You have <span className="font-semibold">{capacityWarning.count} tasks</span>{' '}
                  (~{capacityWarning.hours}hrs). Could you pick your top 3?
                </div>
              )}

              {/* ── Wins Banner (in-your-face) ────────────────── */}
              {todaysCompletedTasks.length > 0 && (
                <div className="mb-4 bg-gradient-to-r from-primary/5 via-primary/8 to-primary/5 border border-primary/15 rounded-xl px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-2xl font-bold text-primary tabular-nums">{todaysCompletedTasks.length}</span>
                      <span className="font-body text-sm text-ink/70">
                        {todaysCompletedTasks.length === 1 ? 'win today' : 'wins today'}
                      </span>
                    </div>
                    <button onClick={fireConfetti} className="text-pencil hover:text-primary transition-colors" title="Celebrate!">
                      <span className="material-symbols-outlined text-[20px]">celebration</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {todaysCompletedTasks.slice(0, 5).map((task) => (
                      <span key={task.id} className="text-sm font-body text-ink/50 line-through decoration-primary/30">
                        {task.title}
                      </span>
                    ))}
                    {todaysCompletedTasks.length > 5 && (
                      <span className="text-xs font-mono text-pencil/50">+{todaysCompletedTasks.length - 5} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Rapid Log ─────────────────────────────────────── */}
              <div className="bg-paper rounded-xl p-5 sm:p-6 shadow-soft border border-wood-light/15">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-header italic text-xl text-ink/70">
                    Rapid Log
                  </h2>
                  <button
                    onClick={() => setShowSignifierHelp((v) => !v)}
                    className="font-mono text-[10px] text-pencil/50 hover:text-primary transition-colors uppercase tracking-widest"
                  >
                    Key
                  </button>
                </div>

                {showSignifierHelp && (
                  <div className="mb-4 px-4 py-3 bg-surface-light border border-wood-light/20 rounded-lg">
                    <div className="flex flex-wrap gap-x-5 gap-y-1">
                      {SIGNIFIER_TOOLTIPS.map((s) => (
                        <span key={s.symbol} className="font-mono text-xs text-pencil">
                          <span className="text-ink font-semibold mr-1">{s.symbol}</span>
                          {s.meaning}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {todayEntries.length === 0 && (
                  <p className="text-pencil/50 font-body text-sm italic py-6 text-center">
                    No entries yet. Add one below.
                  </p>
                )}

                {/* Entry list */}
                <div className="space-y-0.5">
                  {todayEntries.map((entry) => {
                    const isEditing = editingEntryId === entry.id;
                    const isDone = entry.type === 'task' && entry.status === 'done';
                    const isTask = entry.type === 'task';
                    const isNote = entry.type === 'note';
                    const isEvent = entry.type === 'event';
                    const priorityStyle = entry.priority ? PRIORITY_STYLES[entry.priority] : null;

                    return (
                      <div
                        key={entry.id}
                        className="group/entry flex items-start gap-3 py-2 hover:bg-surface-light/60 -mx-3 px-3 rounded transition-colors"
                      >
                        {isTask ? (
                          <button
                            onClick={(e) => handleToggleTask(entry.id, e.currentTarget as HTMLElement)}
                            className="flex-shrink-0 focus:outline-none p-1.5 -m-1.5 rounded hover:bg-primary/10 transition-all"
                            title={isDone ? 'Mark as todo' : 'Mark as done'}
                          >
                            {bulletForEntry(entry)}
                          </button>
                        ) : (
                          <div className="flex-shrink-0">{bulletForEntry(entry)}</div>
                        )}

                        <div className="flex-1 min-w-0 flex items-baseline gap-2">
                          {isEditing ? (
                            <input
                              ref={editInputRef}
                              className="w-full bg-transparent border-none p-0 text-base font-body text-ink focus:ring-0 focus:outline-none"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleEditKeyDown}
                              onBlur={commitEdit}
                            />
                          ) : (
                            <button
                              className={`text-left text-base leading-snug font-body transition-colors ${
                                isDone ? 'line-through decoration-pencil/40 text-ink/35'
                                  : isNote ? 'text-ink/60 italic'
                                  : 'text-ink hover:text-ink-light'
                              }`}
                              onDoubleClick={() => startEditing(entry.id, entry.title)}
                              onClick={() => { if (isTask) handleToggleTask(entry.id); }}
                            >
                              {entry.title}
                            </button>
                          )}
                          {!isEditing && isTask && priorityStyle && (
                            <span className={`flex-shrink-0 inline-block size-1.5 rounded-full ${priorityStyle.dot} opacity-50`} />
                          )}
                          {!isEditing && isEvent && entry.time && (
                            <span className="flex-shrink-0 font-mono text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">{entry.time}</span>
                          )}
                          {!isEditing && isTask && entry.timeBlock && (
                            <button
                              onClick={(e) => { e.stopPropagation(); updateEntry(entry.id, { timeBlock: undefined }); }}
                              className="flex-shrink-0 font-mono text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded hover:bg-primary/20 hover:line-through transition-all group/unpin"
                              title="Click to unpin from time"
                            >
                              {entry.timeBlock}
                              <span className="material-symbols-outlined text-[10px] ml-0.5 opacity-0 group-hover/unpin:opacity-100 transition-opacity">close</span>
                            </button>
                          )}
                          {!isEditing && isTask && (entry.movedCount ?? 0) > 0 && (
                            <span className="flex gap-0.5 ml-1" title={`Moved ${entry.movedCount}x`}>
                              {Array.from({ length: entry.movedCount ?? 0 }).map((_, i) => (
                                <span key={i} className="inline-block size-1.5 rounded-full bg-tension/40" />
                              ))}
                            </span>
                          )}
                        </div>

                        {!isEditing && entry.tags && entry.tags.length > 0 && (
                          <span className="hidden sm:inline-block font-mono text-[10px] text-pencil/60 bg-wood-light/20 px-1.5 py-0.5 rounded flex-shrink-0">
                            {entry.tags[0]}
                          </span>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-1 opacity-0 group-hover/entry:opacity-100 transition-opacity flex-shrink-0">
                            {isTask && !isDone && (
                              <button onClick={() => setStuckTask(entry)} className="font-mono text-[9px] text-pencil hover:text-primary bg-wood-light/20 hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors uppercase tracking-wider">
                                Stuck?
                              </button>
                            )}
                            {isTask && !isDone && (
                              <button
                                onClick={() => updateEntry(entry.id, { date: tomorrow, movedCount: (entry.movedCount ?? 0) + 1 })}
                                className="text-pencil hover:text-primary transition-colors"
                                title="Move to tomorrow"
                              >
                                <span className="material-symbols-outlined text-[16px]">east</span>
                              </button>
                            )}
                            <button onClick={() => deleteEntry(entry.id)} className="text-pencil hover:text-tension transition-colors">
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add new entry */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-1">
                    {TYPE_PILLS.map((pill) => (
                      <button
                        key={pill.type}
                        onClick={() => setEntryType(pill.type)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full font-mono text-[11px] uppercase tracking-wider transition-all ${
                          entryType === pill.type
                            ? 'bg-primary/15 text-primary font-medium border border-primary/30'
                            : 'text-pencil hover:bg-surface-light border border-transparent'
                        }`}
                      >
                        <span className="text-sm">{pill.symbol}</span>
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-light/50 border border-wood-light/15 focus-within:border-primary/30 transition-all">
                    <span className="material-symbols-outlined text-lg text-primary/40">add</span>
                    <input
                      ref={newInputRef}
                      className="flex-1 min-w-0 bg-transparent border-none p-0 text-base font-body text-ink placeholder:text-pencil/40 focus:ring-0 focus:outline-none"
                      placeholder={placeholder}
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={handleAddEntry}
                    />
                    {entryType === 'event' && (
                      <input
                        type="time"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        className="font-mono text-xs text-ink bg-paper border border-wood-light/30 rounded px-2 py-1 focus:outline-none focus:border-primary/30 flex-shrink-0"
                      />
                    )}
                    {entryType === 'task' && (
                      <button
                        onClick={cyclePriority}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-wood-light/30 hover:border-primary/30 transition-colors flex-shrink-0"
                      >
                        <span className={`inline-block size-2 rounded-full ${PRIORITY_STYLES[newPriority].dot}`} />
                        <span className="font-mono text-[10px] text-pencil uppercase">{PRIORITY_STYLES[newPriority].label}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile-only: Events + Habits inline */}
              <div className="lg:hidden mt-5 space-y-4">
                {upcomingEvents.length > 0 && (
                  <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-wood-light/40">
                    {upcomingEvents.map((ev) => (
                      <div key={ev.id} className="flex-shrink-0 bg-paper border border-wood-light/20 rounded-lg px-4 py-2.5 min-w-[160px]">
                        <p className="font-mono text-[10px] text-primary uppercase tracking-widest mb-0.5">
                          {formatEventDate(ev.date, today, tomorrow)}{ev.time && ` \u00b7 ${ev.time}`}
                        </p>
                        <p className="font-body text-sm text-ink truncate">{ev.title}</p>
                      </div>
                    ))}
                  </div>
                )}
                {habits.length > 0 && (
                  <div className="flex flex-wrap gap-4">
                    {habits.map((habit) => {
                      const isCompleted = habit.completedDates.includes(today);
                      const colorMap: Record<string, string> = { primary: 'bg-primary', sage: 'bg-sage', accent: 'bg-accent', tension: 'bg-rose' };
                      const bgColor = colorMap[habit.color] || 'bg-primary';
                      const borderMap: Record<string, string> = { primary: 'border-primary', sage: 'border-sage', accent: 'border-accent', tension: 'border-rose' };
                      const borderColor = borderMap[habit.color] || 'border-primary';
                      return (
                        <button key={habit.id} onClick={() => toggleHabit(habit.id, today)} className="flex flex-col items-center gap-1.5">
                          <div className={`size-9 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? borderColor : 'border-pencil/30'}`}>
                            <div className={`size-9 rounded-full flex items-center justify-center text-white transition-transform ${isCompleted ? `${bgColor} scale-100` : 'scale-0'}`}>
                              <span className="material-symbols-outlined text-[14px]">check</span>
                            </div>
                          </div>
                          <span className={`text-xs font-mono ${isCompleted ? 'text-ink' : 'text-pencil'}`}>{habit.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {/* Mobile journal exercises */}
                <div>
                  <h3 className="font-header italic text-lg text-ink/70 mb-3">Journal Exercises</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {JOURNAL_METHODS.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setActiveMethod(method)}
                        className="text-left p-3 rounded-lg border border-wood-light/15 hover:bg-surface-light transition-all"
                      >
                        <span className="material-symbols-outlined text-lg text-ink/40 mb-1">{method.icon}</span>
                        <p className="font-body text-sm font-medium text-ink">{method.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <Link to="/flow" className="inline-flex items-center gap-1.5 font-body text-sm text-primary hover:text-primary/80 transition-colors">
                  Plan in Flow <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </main>

            {/* ── RIGHT SIDEBAR ───────────────────────────────────── */}
            <aside className="hidden lg:flex flex-col gap-5 sticky top-6">
              {/* Habits */}
              {habits.length > 0 && (
                <div className="bg-paper rounded-xl p-5 shadow-soft border border-wood-light/15">
                  <h3 className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em] mb-3">
                    Daily Rituals
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {habits.map((habit) => {
                      const isCompleted = habit.completedDates.includes(today);
                      const colorMap: Record<string, string> = { primary: 'bg-primary', sage: 'bg-sage', accent: 'bg-accent', tension: 'bg-rose' };
                      const bgColor = colorMap[habit.color] || 'bg-primary';
                      const borderMap: Record<string, string> = { primary: 'border-primary', sage: 'border-sage', accent: 'border-accent', tension: 'border-rose' };
                      const borderColor = borderMap[habit.color] || 'border-primary';
                      return (
                        <button
                          key={habit.id}
                          onClick={() => toggleHabit(habit.id, today)}
                          className="group/habit flex flex-col items-center gap-1.5"
                        >
                          <div className={`size-10 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? borderColor : 'border-pencil/30 group-hover/habit:border-pencil/50'}`}>
                            <div className={`size-10 rounded-full flex items-center justify-center text-white transition-transform ${isCompleted ? `${bgColor} scale-100` : 'scale-0'}`}>
                              <span className="material-symbols-outlined text-[16px]">check</span>
                            </div>
                          </div>
                          <span className={`text-[11px] font-mono text-center leading-tight ${isCompleted ? 'text-ink' : 'text-pencil'}`}>
                            {habit.name}
                          </span>
                          {habit.streak > 0 && (
                            <span className="text-[9px] font-mono text-pencil/50 -mt-1">{habit.streak}d</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Wins (completed tasks) */}
              {todaysCompletedTasks.length > 0 && (
                <div className="bg-paper rounded-xl p-5 shadow-soft border border-wood-light/15">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em]">
                      Wins
                    </h3>
                    <button onClick={fireConfetti} className="text-pencil hover:text-primary transition-colors" title="Celebrate!">
                      <span className="material-symbols-outlined text-[16px]">celebration</span>
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {todaysCompletedTasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2 text-sm font-body text-ink/50">
                        <span className="text-primary font-bold text-xs">&times;</span>
                        <span className="line-through decoration-pencil/30 truncate">{task.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Journal Exercises */}
              <div className="bg-paper rounded-xl p-5 shadow-soft border border-wood-light/15">
                <h3 className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em] mb-3">
                  Journal Exercises
                </h3>
                <div className="flex flex-col gap-2">
                  {JOURNAL_METHODS.map((method) => {
                    const categoryColors: Record<string, string> = {
                      cbt: 'bg-sage/15 text-sage border-sage/30',
                      integration: 'bg-accent/15 text-accent border-accent/30',
                      daily: 'bg-primary/15 text-primary border-primary/30',
                    };
                    const categoryStyle = categoryColors[method.category] ?? 'bg-wood-light/30 text-pencil border-wood-light/50';
                    return (
                      <button
                        key={method.id}
                        onClick={() => setActiveMethod(method)}
                        className="text-left p-3 rounded-lg border border-wood-light/15 hover:bg-surface-light hover:border-primary/20 transition-all group/method"
                      >
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-lg text-ink/40 group-hover/method:text-primary transition-colors mt-0.5">{method.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-body text-sm font-medium text-ink">{method.name}</span>
                              <span className={`font-mono text-[8px] uppercase tracking-widest px-1 py-0.5 rounded-full border ${categoryStyle}`}>{method.category}</span>
                            </div>
                            <p className="font-body text-xs text-pencil leading-relaxed line-clamp-2">{method.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
           EVENING MODE — 3-column layout (matches morning)
           ══════════════════════════════════════════════════════════ */}
        {mode === 'evening' && (
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] xl:grid-cols-[300px_1fr_300px] gap-6 items-start">

            {/* ── LEFT SIDEBAR ────────────────────────────────────── */}
            <aside className="hidden lg:flex flex-col gap-5 sticky top-6">
              {/* Day Debrief */}
              {!debriefHidden && (
                <div className="bg-paper rounded-xl p-5 shadow-soft border border-wood-light/15">
                  <h3 className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em] mb-3">
                    Day Debrief
                  </h3>
                  <DayDebriefComponent
                    todayEntries={todayEntries}
                    date={dateKey}
                    onSave={(debrief) => { saveDebrief(debrief); setDebriefDismissed(true); setRedoDebrief(false); }}
                    onSkip={() => setDebriefDismissed(true)}
                  />
                </div>
              )}

              {todayDebriefExists && !redoDebrief && (
                <div className="bg-sage/5 border border-sage/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sage text-base">check_circle</span>
                      <p className="text-sm font-body font-medium text-ink">Debrief saved</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setRedoDebrief(true)}
                        className="text-xs font-body text-pencil hover:text-ink underline underline-offset-2 decoration-pencil/30 transition-colors"
                      >
                        Redo
                      </button>
                      <button
                        onClick={() => deleteDebrief(dateKey)}
                        className="text-xs font-body text-tension/60 hover:text-tension underline underline-offset-2 decoration-tension/20 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Wins */}
              {todaysCompletedTasks.length > 0 && (
                <div className="bg-paper rounded-xl p-5 shadow-soft border border-wood-light/15">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em]">
                      Today&rsquo;s Wins
                    </h3>
                    <button onClick={fireConfetti} className="text-pencil hover:text-primary transition-colors" title="Celebrate!">
                      <span className="material-symbols-outlined text-[16px]">celebration</span>
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {todaysCompletedTasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2 text-sm font-body text-ink/50">
                        <span className="text-primary font-bold text-xs">&times;</span>
                        <span className="line-through decoration-pencil/30 truncate">{task.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Today's Journal Entries */}
              {journalEntries.filter((j) => j.date === today).length > 0 && (
                <div className="bg-paper rounded-xl p-5 shadow-soft border border-wood-light/15">
                  <h3 className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em] mb-3">
                    Journal Entries
                  </h3>
                  <div className="space-y-2">
                    {journalEntries.filter((j) => j.date === today).map((entry) => (
                      <Link key={entry.id} to={`/journal/${entry.id}`} className="block p-3 rounded-lg border border-wood-light/15 hover:border-primary/20 hover:bg-surface-light/50 transition-all">
                        {entry.title && <p className="font-body text-sm font-semibold text-ink/70 mb-0.5 truncate">{entry.title}</p>}
                        <p className="text-xs leading-relaxed font-body text-ink/50 italic line-clamp-2">{entry.content}</p>
                        {entry.method && (
                          <span className="inline-block mt-1 font-mono text-[9px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-widest">{entry.method}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* ── CENTER: Plan Tomorrow ──────────────────────────── */}
            <main className="min-w-0">
              {/* Mobile-only: debrief */}
              <div className="lg:hidden mb-4">
                {!debriefHidden && (
                  <div className="mb-4">
                    <h3 className="font-header italic text-lg text-ink/70 mb-3">Day Debrief</h3>
                    <DayDebriefComponent
                      todayEntries={todayEntries}
                      date={dateKey}
                      onSave={(debrief) => { saveDebrief(debrief); setDebriefDismissed(true); setRedoDebrief(false); }}
                      onSkip={() => setDebriefDismissed(true)}
                    />
                  </div>
                )}
                {todayDebriefExists && !redoDebrief && (
                  <div className="bg-sage/5 border border-sage/20 rounded-lg p-3 mb-3 flex items-center justify-between">
                    <p className="text-sm font-body text-ink flex items-center gap-2">
                      <span className="material-symbols-outlined text-sage text-base">check_circle</span>
                      Debrief saved
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setRedoDebrief(true)}
                        className="text-xs font-body text-pencil hover:text-ink underline underline-offset-2 decoration-pencil/30 transition-colors"
                      >
                        Redo
                      </button>
                      <button
                        onClick={() => deleteDebrief(dateKey)}
                        className="text-xs font-body text-tension/60 hover:text-tension underline underline-offset-2 decoration-tension/20 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Wins Banner — evening */}
              {todaysCompletedTasks.length > 0 && (
                <div className="mb-5 bg-gradient-to-r from-primary/5 via-primary/8 to-primary/5 border border-primary/15 rounded-xl px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-2xl font-bold text-primary tabular-nums">{todaysCompletedTasks.length}</span>
                      <span className="font-body text-sm text-ink/70">
                        {todaysCompletedTasks.length === 1 ? 'win today' : 'wins today'}
                      </span>
                    </div>
                    <button onClick={fireConfetti} className="text-pencil hover:text-primary transition-colors" title="Celebrate!">
                      <span className="material-symbols-outlined text-[20px]">celebration</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {todaysCompletedTasks.slice(0, 5).map((task) => (
                      <span key={task.id} className="text-sm font-body text-ink/50 line-through decoration-primary/30">
                        {task.title}
                      </span>
                    ))}
                    {todaysCompletedTasks.length > 5 && (
                      <span className="text-xs font-mono text-pencil/50">+{todaysCompletedTasks.length - 5} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Plan Tomorrow */}
              <div className="bg-paper rounded-xl p-5 sm:p-6 shadow-soft border border-wood-light/15">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">event_upcoming</span>
                  </div>
                  <div>
                    <h2 className="font-header italic text-2xl sm:text-3xl text-ink">Plan Tomorrow</h2>
                    <p className="text-sm font-body text-ink-light">Set yourself up for a gentle start</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block font-mono text-[10px] text-accent uppercase tracking-[0.15em] mb-1.5">
                      How should tomorrow feel?
                    </label>
                    <input
                      type="text"
                      value={tomorrowIntention}
                      onChange={e => setTomorrowIntention(e.target.value)}
                      placeholder="Calm and focused · Productive but gentle · One step at a time"
                      className="w-full bg-transparent border-none p-0 text-xl font-display text-ink placeholder:text-pencil/30 focus:ring-0 focus:outline-none italic"
                    />
                    <div className="mt-1 h-[1.5px] bg-wood-light/20" />
                  </div>

                  {tomorrowEntries.length > 0 && (
                    <div>
                      <p className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">checklist</span>
                        {tomorrowEntries.length} item{tomorrowEntries.length !== 1 ? 's' : ''} planned
                      </p>
                      <div className="space-y-0.5">
                        {tomorrowEntries.map((entry) => (
                          <div key={entry.id} className="group/item flex items-start gap-3 py-2 hover:bg-surface-light/60 -mx-3 px-3 rounded transition-colors">
                            {bulletForEntry(entry)}
                            <span className={`font-body text-base flex-1 leading-snug ${entry.type === 'note' ? 'text-ink/60 italic' : 'text-ink'}`}>
                              {entry.title}
                            </span>
                            {entry.type === 'event' && entry.time && (
                              <span className="font-mono text-[10px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">{entry.time}</span>
                            )}
                            {entry.type === 'task' && entry.priority && (
                              <span className={`flex-shrink-0 inline-block size-1.5 rounded-full ${PRIORITY_STYLES[entry.priority].dot} opacity-50`} />
                            )}
                            <button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover/item:opacity-100 text-ink-light/40 hover:text-tension transition-all shrink-0">
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-light/50 border border-wood-light/15 focus-within:border-primary/30 transition-all">
                    <span className="material-symbols-outlined text-lg text-primary/40">add</span>
                    <input
                      ref={tomorrowInputRef}
                      type="text"
                      value={tomorrowAddInput}
                      onChange={e => setTomorrowAddInput(e.target.value)}
                      onKeyDown={handleAddTomorrowEntry}
                      placeholder='e.g. "3pm: standup" or "review PR"'
                      className="flex-1 min-w-0 bg-transparent border-none p-0 text-base font-body text-ink placeholder:text-pencil/40 focus:ring-0 focus:outline-none"
                    />
                  </div>

                  {(() => {
                    const tasks = tomorrowEntries.filter(e => e.type === 'task');
                    const totalMin = tasks.reduce((sum, t) => {
                      if (!t.duration) return sum;
                      let m = 0;
                      const hMatch = t.duration.match(/(\d+)h/);
                      const mMatch = t.duration.match(/(\d+)m/);
                      if (hMatch) m += parseInt(hMatch[1], 10) * 60;
                      if (mMatch) m += parseInt(mMatch[1], 10);
                      return sum + m;
                    }, 0);
                    if (totalMin <= 360) return null;
                    return (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                        <span className="material-symbols-outlined text-accent text-base mt-0.5">emoji_objects</span>
                        <p className="text-sm font-body text-ink-light">
                          ~{Math.round(totalMin / 60)}h of scheduled work tomorrow.
                        </p>
                      </div>
                    );
                  })()}

                  {tomorrowEntries.length === 0 && !tomorrowIntention && (
                    <p className="text-center py-4 text-base font-handwriting text-ink-light/40">
                      Even one task is enough. Start small.
                    </p>
                  )}
                </div>
              </div>

              {/* ── Rapid Log (evening) ─────────────────────────────── */}
              <div className="bg-paper rounded-xl p-5 sm:p-6 shadow-soft border border-wood-light/15 mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-header italic text-xl text-ink/70">
                    Rapid Log
                  </h2>
                  <button
                    onClick={() => setShowSignifierHelp((v) => !v)}
                    className="font-mono text-[10px] text-pencil/50 hover:text-primary transition-colors uppercase tracking-widest"
                  >
                    Key
                  </button>
                </div>

                {showSignifierHelp && (
                  <div className="mb-4 px-4 py-3 bg-surface-light border border-wood-light/20 rounded-lg">
                    <div className="flex flex-wrap gap-x-5 gap-y-1">
                      {SIGNIFIER_TOOLTIPS.map((s) => (
                        <span key={s.symbol} className="font-mono text-xs text-pencil">
                          <span className="text-ink font-semibold mr-1">{s.symbol}</span>
                          {s.meaning}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {todayEntries.length === 0 && (
                  <p className="text-pencil/50 font-body text-sm italic py-6 text-center">
                    No entries yet. Add one below.
                  </p>
                )}

                {/* Entry list */}
                <div className="space-y-0.5">
                  {todayEntries.map((entry) => {
                    const isEditing = editingEntryId === entry.id;
                    const isDone = entry.type === 'task' && entry.status === 'done';
                    const isTask = entry.type === 'task';
                    const isNote = entry.type === 'note';
                    const isEvent = entry.type === 'event';
                    const priorityStyle = entry.priority ? PRIORITY_STYLES[entry.priority] : null;

                    return (
                      <div
                        key={entry.id}
                        className="group/entry flex items-start gap-3 py-2 hover:bg-surface-light/60 -mx-3 px-3 rounded transition-colors"
                      >
                        {isTask ? (
                          <button
                            onClick={(e) => handleToggleTask(entry.id, e.currentTarget as HTMLElement)}
                            className="flex-shrink-0 focus:outline-none p-1.5 -m-1.5 rounded hover:bg-primary/10 transition-all"
                            title={isDone ? 'Mark as todo' : 'Mark as done'}
                          >
                            {bulletForEntry(entry)}
                          </button>
                        ) : (
                          <div className="flex-shrink-0">{bulletForEntry(entry)}</div>
                        )}

                        <div className="flex-1 min-w-0 flex items-baseline gap-2">
                          {isEditing ? (
                            <input
                              ref={editInputRef}
                              className="w-full bg-transparent border-none p-0 text-base font-body text-ink focus:ring-0 focus:outline-none"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleEditKeyDown}
                              onBlur={commitEdit}
                            />
                          ) : (
                            <button
                              className={`text-left text-base leading-snug font-body transition-colors ${
                                isDone ? 'line-through decoration-pencil/40 text-ink/35'
                                  : isNote ? 'text-ink/60 italic'
                                  : 'text-ink hover:text-ink-light'
                              }`}
                              onDoubleClick={() => startEditing(entry.id, entry.title)}
                              onClick={() => { if (isTask) handleToggleTask(entry.id); }}
                            >
                              {entry.title}
                            </button>
                          )}
                          {!isEditing && isTask && priorityStyle && (
                            <span className={`flex-shrink-0 inline-block size-1.5 rounded-full ${priorityStyle.dot} opacity-50`} />
                          )}
                          {!isEditing && isEvent && entry.time && (
                            <span className="flex-shrink-0 font-mono text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">{entry.time}</span>
                          )}
                          {!isEditing && isTask && entry.timeBlock && (
                            <button
                              onClick={(e) => { e.stopPropagation(); updateEntry(entry.id, { timeBlock: undefined }); }}
                              className="flex-shrink-0 font-mono text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded hover:bg-primary/20 hover:line-through transition-all group/unpin"
                              title="Click to unpin from time"
                            >
                              {entry.timeBlock}
                              <span className="material-symbols-outlined text-[10px] ml-0.5 opacity-0 group-hover/unpin:opacity-100 transition-opacity">close</span>
                            </button>
                          )}
                          {!isEditing && isTask && (entry.movedCount ?? 0) > 0 && (
                            <span className="flex gap-0.5 ml-1" title={`Moved ${entry.movedCount}x`}>
                              {Array.from({ length: entry.movedCount ?? 0 }).map((_, i) => (
                                <span key={i} className="inline-block size-1.5 rounded-full bg-tension/40" />
                              ))}
                            </span>
                          )}
                        </div>

                        {!isEditing && entry.tags && entry.tags.length > 0 && (
                          <span className="hidden sm:inline-block font-mono text-[10px] text-pencil/60 bg-wood-light/20 px-1.5 py-0.5 rounded flex-shrink-0">
                            {entry.tags[0]}
                          </span>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-1 opacity-0 group-hover/entry:opacity-100 transition-opacity flex-shrink-0">
                            {isTask && !isDone && (
                              <button onClick={() => setStuckTask(entry)} className="font-mono text-[9px] text-pencil hover:text-primary bg-wood-light/20 hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors uppercase tracking-wider">
                                Stuck?
                              </button>
                            )}
                            {isTask && !isDone && (
                              <button
                                onClick={() => updateEntry(entry.id, { date: tomorrow, movedCount: (entry.movedCount ?? 0) + 1 })}
                                className="text-pencil hover:text-primary transition-colors"
                                title="Move to tomorrow"
                              >
                                <span className="material-symbols-outlined text-[16px]">east</span>
                              </button>
                            )}
                            <button onClick={() => deleteEntry(entry.id)} className="text-pencil hover:text-tension transition-colors">
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add new entry */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-1">
                    {TYPE_PILLS.map((pill) => (
                      <button
                        key={pill.type}
                        onClick={() => setEntryType(pill.type)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full font-mono text-[11px] uppercase tracking-wider transition-all ${
                          entryType === pill.type
                            ? 'bg-primary/15 text-primary font-medium border border-primary/30'
                            : 'text-pencil hover:bg-surface-light border border-transparent'
                        }`}
                      >
                        <span className="text-sm">{pill.symbol}</span>
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-light/50 border border-wood-light/15 focus-within:border-primary/30 transition-all">
                    <span className="material-symbols-outlined text-lg text-primary/40">add</span>
                    <input
                      ref={newInputRef}
                      className="flex-1 min-w-0 bg-transparent border-none p-0 text-base font-body text-ink placeholder:text-pencil/40 focus:ring-0 focus:outline-none"
                      placeholder={placeholder}
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={handleAddEntry}
                    />
                    {entryType === 'event' && (
                      <input
                        type="time"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        className="font-mono text-xs text-ink bg-paper border border-wood-light/30 rounded px-2 py-1 focus:outline-none focus:border-primary/30 flex-shrink-0"
                      />
                    )}
                    {entryType === 'task' && (
                      <button
                        onClick={cyclePriority}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-wood-light/30 hover:border-primary/30 transition-colors flex-shrink-0"
                      >
                        <span className={`inline-block size-2 rounded-full ${PRIORITY_STYLES[newPriority].dot}`} />
                        <span className="font-mono text-[10px] text-pencil uppercase">{PRIORITY_STYLES[newPriority].label}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </main>

            {/* ── RIGHT SIDEBAR ───────────────────────────────────── */}
            <aside className="hidden lg:flex flex-col gap-5 sticky top-6">
              {/* Journal Exercises */}
              <div className="bg-paper rounded-xl p-5 shadow-soft border border-wood-light/15">
                <h3 className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em] mb-3">
                  Journal Exercises
                </h3>
                <div className="flex flex-col gap-2">
                  {JOURNAL_METHODS.map((method) => {
                    const categoryColors: Record<string, string> = {
                      cbt: 'bg-sage/15 text-sage border-sage/30',
                      integration: 'bg-accent/15 text-accent border-accent/30',
                      daily: 'bg-primary/15 text-primary border-primary/30',
                    };
                    const categoryStyle = categoryColors[method.category] ?? 'bg-wood-light/30 text-pencil border-wood-light/50';
                    return (
                      <button
                        key={method.id}
                        onClick={() => setActiveMethod(method)}
                        className="text-left p-3 rounded-lg border border-wood-light/15 hover:bg-surface-light hover:border-primary/20 transition-all group/method"
                      >
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-lg text-ink/40 group-hover/method:text-primary transition-colors mt-0.5">{method.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-body text-sm font-medium text-ink">{method.name}</span>
                              <span className={`font-mono text-[8px] uppercase tracking-widest px-1 py-0.5 rounded-full border ${categoryStyle}`}>{method.category}</span>
                            </div>
                            <p className="font-body text-xs text-pencil leading-relaxed line-clamp-2">{method.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Mobile-only: evening content stacked */}
            <div className="lg:hidden col-span-1 space-y-4">
              {/* Mobile wins */}
              {todaysCompletedTasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-header italic text-lg text-ink/70">Today&rsquo;s Wins</h3>
                    <button onClick={fireConfetti} className="text-pencil hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[16px]">celebration</span>
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {todaysCompletedTasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2 text-sm font-body text-ink/50">
                        <span className="text-primary font-bold text-xs">&times;</span>
                        <span className="line-through decoration-pencil/30">{task.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mobile journal methods */}
              <div>
                <h3 className="font-header italic text-lg text-ink/70 mb-3">Journal Exercises</h3>
                <div className="grid grid-cols-2 gap-2">
                  {JOURNAL_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setActiveMethod(method)}
                      className="text-left p-3 rounded-lg border border-wood-light/15 hover:bg-surface-light transition-all"
                    >
                      <span className="material-symbols-outlined text-lg text-ink/40 mb-1">{method.icon}</span>
                      <p className="font-body text-sm font-medium text-ink">{method.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile journal entries */}
              {journalEntries.filter((j) => j.date === today).length > 0 && (
                <div>
                  <h3 className="font-header italic text-lg text-ink/70 mb-2">Journal Entries</h3>
                  {journalEntries.filter((j) => j.date === today).map((entry) => (
                    <Link key={entry.id} to={`/journal/${entry.id}`} className="block p-3 rounded-lg border border-wood-light/15 hover:border-primary/20 transition-all mb-2">
                      {entry.title && <p className="font-body text-sm font-medium text-ink/70">{entry.title}</p>}
                      <p className="text-xs font-body text-ink/50 italic line-clamp-2">{entry.content}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
