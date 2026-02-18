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
import { parseNaturalEntry } from '../lib/nlParser';
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

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function isEvening(): boolean {
  return new Date().getHours() >= 18;
}

function isAfterNoon(): boolean {
  return new Date().getHours() >= 12;
}


function formatEventDate(dateStr: string): string {
  const today = todayStr();
  const tomorrow = tomorrowStr();
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
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
  } = useApp();

  /* ── Date strings ────────────────────────────────────────────── */

  const today = todayStr();
  const tomorrow = tomorrowStr();

  const todayDisplay = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const yearStr = new Date().getFullYear();

  /* ── Mode: morning vs evening ────────────────────────────────── */

  const [mode, setMode] = useState<'morning' | 'evening'>(
    isEvening() ? 'evening' : 'morning',
  );

  /* ── Intention (persisted per-date in localStorage) ──────────── */

  const intentionKey = `vellum-intention-${today}`;
  const [intention, setIntention] = useState(() =>
    localStorage.getItem(intentionKey) ?? '',
  );

  useEffect(() => {
    localStorage.setItem(intentionKey, intention);
  }, [intention, intentionKey]);

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
    const sevenDaysOut = new Date();
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
    const cutoff = sevenDaysOut.toISOString().split('T')[0];
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

  const handleToggleTask = useCallback(
    (id: string) => {
      const entry = entries.find((e) => e.id === id);
      if (entry && entry.type === 'task') {
        updateEntry(id, {
          status: entry.status === 'done' ? 'todo' : 'done',
        });
      }
    },
    [entries, updateEntry],
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
        date: today,
        title: activeMethod.name,
        content,
        method: activeMethod.id,
        steps: answers,
      };
      addJournalEntry(entry);
      setActiveMethod(null);
    },
    [activeMethod, today, addJournalEntry],
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

  const todayDebriefExists = debriefs.some(d => d.date === today);
  const [debriefDismissed, setDebriefDismissed] = useState(false);
  const debriefHidden = debriefDismissed || todayDebriefExists;

  /* ── Bullet rendering helpers ────────────────────────────────── */

  const bulletForEntry = (entry: RapidLogEntry) => {
    if (entry.type === 'event') {
      return (
        <span className="inline-block size-2.5 rounded-full border-[1.5px] border-ink/70 flex-shrink-0 mt-[7px]" />
      );
    }
    if (entry.type === 'note') {
      return (
        <span className="inline-block w-3 h-[1.5px] bg-ink/50 flex-shrink-0 mt-[11px]" />
      );
    }
    // Task
    if (entry.status === 'done') {
      return (
        <span className="text-primary font-bold text-sm flex-shrink-0 mt-[3px] select-none">
          &times;
        </span>
      );
    }
    return (
      <span className="inline-block size-[6px] rounded-full bg-ink flex-shrink-0 mt-[9px]" />
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

      <div className="flex-1 flex justify-center items-start pt-8 sm:pt-12 pb-20 px-3 sm:px-6 bg-background-light overflow-y-auto">
        <article className="relative w-full max-w-3xl min-h-[700px] bg-paper shadow-paper hover:shadow-lift transition-shadow duration-500 rounded-sm p-6 sm:p-10 md:p-12 flex flex-col gap-6 group/paper">

          {/* ── Header: Date + Mode Toggle ───────────────────────────── */}
          <header className="space-y-5 border-b border-wood-light/30 pb-7">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2">
              <h1 className="font-display italic text-3xl sm:text-4xl text-ink leading-tight">
                {todayDisplay}
              </h1>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[11px] text-pencil tracking-widest uppercase mr-3">
                  {yearStr}
                </span>
                {/* Mode toggle pills */}
                <div className="flex rounded-full border border-wood-light/50 overflow-hidden">
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

            {/* Progress bar */}
            {totalTaskCount > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-[2px] bg-wood-light/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${totalTaskCount > 0 ? (completedCount / totalTaskCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="font-mono text-[10px] text-pencil whitespace-nowrap">
                  {completedCount}/{totalTaskCount}
                </span>
              </div>
            )}
          </header>

          {/* ══════════════════════════════════════════════════════════
             MORNING MODE
             ══════════════════════════════════════════════════════════ */}
          {mode === 'morning' && (
            <>
              {/* ── Morning Prompt ───────────────────────────────────── */}
              <section className="space-y-2">
                <p className="font-body text-base text-ink/80 leading-relaxed">
                  {morningPrompt.contextual}
                </p>
                <p className="font-handwriting text-sm text-pencil/70 italic">
                  {morningPrompt.inspirational}
                </p>
              </section>

              {/* ── Today's Intention ────────────────────────────────── */}
              <section className="space-y-1.5">
                <label className="block font-handwriting text-base text-accent">
                  Today&rsquo;s Intention
                </label>
                <div className="relative group/input">
                  <input
                    className="w-full bg-transparent border-none p-0 text-xl sm:text-2xl font-display text-ink placeholder:text-pencil/40 focus:ring-0 focus:outline-none italic transition-all"
                    placeholder="What is the one thing that matters today?"
                    type="text"
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                  />
                  <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary/30 group-focus-within/input:w-full transition-all duration-500" />
                </div>
              </section>

              {/* ── Day Recovery Banner ──────────────────────────────── */}
              {showDayRecovery && (
                <DayRecovery
                  entries={entries}
                  onDismiss={() => setShowDayRecovery(false)}
                />
              )}

              {/* Reset My Day button (when recovery not auto-showing) */}
              {!showDayRecovery && todayTasks.length > 0 && (
                <button
                  onClick={() => setShowDayRecovery(true)}
                  className="self-start font-mono text-[10px] text-pencil/60 hover:text-primary uppercase tracking-widest transition-colors"
                >
                  Reset My Day
                </button>
              )}

              {/* ── Capacity Warning ────────────────────────────────── */}
              {capacityWarning && (
                <div className="bg-bronze/10 border border-bronze/20 rounded-xl px-5 py-3 text-sm font-body text-ink/80">
                  You have{' '}
                  <span className="font-semibold">{capacityWarning.count} tasks</span>{' '}
                  (~{capacityWarning.hours}hrs of work). That&rsquo;s ambitious
                  &mdash; could you pick your top 3?
                </div>
              )}

              {/* ── Unified Rapid Log ───────────────────────────────── */}
              <section className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-header italic text-lg text-ink-light">
                    Rapid Log
                  </h2>
                  <button
                    onClick={() => setShowSignifierHelp((v) => !v)}
                    className="font-mono text-[10px] text-pencil/60 hover:text-primary transition-colors uppercase tracking-widest"
                    title="BuJo signifier key"
                  >
                    Key
                  </button>
                </div>

                {/* Signifier tooltip */}
                {showSignifierHelp && (
                  <div className="mb-4 px-4 py-3 bg-surface-light border border-wood-light/30 rounded-xl">
                    <div className="flex flex-wrap gap-x-5 gap-y-1">
                      {SIGNIFIER_TOOLTIPS.map((s) => (
                        <span
                          key={s.symbol}
                          className="font-mono text-xs text-pencil"
                        >
                          <span className="text-ink font-semibold mr-1">
                            {s.symbol}
                          </span>
                          {s.meaning}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {todayEntries.length === 0 && (
                  <p className="text-pencil/60 font-body text-sm italic py-4 text-center">
                    No entries yet. Add one below to get started.
                  </p>
                )}

                {/* Entry list */}
                {todayEntries.map((entry) => {
                  const isEditing = editingEntryId === entry.id;
                  const isDone = entry.type === 'task' && entry.status === 'done';
                  const isTask = entry.type === 'task';
                  const isNote = entry.type === 'note';
                  const isEvent = entry.type === 'event';
                  const priorityStyle = entry.priority
                    ? PRIORITY_STYLES[entry.priority]
                    : null;

                  return (
                    <div
                      key={entry.id}
                      className="group/entry flex items-start gap-3 py-2 hover:bg-surface-light/60 -mx-3 px-3 rounded transition-colors relative"
                    >
                      {/* Bullet / toggle */}
                      {isTask ? (
                        <button
                          onClick={() => handleToggleTask(entry.id)}
                          className="flex-shrink-0 focus:outline-none mt-0.5 hover:scale-125 transition-transform"
                          aria-label={isDone ? 'Mark as todo' : 'Mark as done'}
                        >
                          {bulletForEntry(entry)}
                        </button>
                      ) : (
                        <div className="flex-shrink-0">
                          {bulletForEntry(entry)}
                        </div>
                      )}

                      {/* Title area */}
                      <div className="flex-1 min-w-0 flex items-baseline gap-2">
                        {isEditing ? (
                          <input
                            ref={editInputRef}
                            className="w-full bg-transparent border-none p-0 text-lg font-body text-ink focus:ring-0 focus:outline-none border-b border-primary/30"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            onBlur={commitEdit}
                          />
                        ) : (
                          <button
                            className={`text-left text-lg leading-snug font-body transition-colors ${
                              isDone
                                ? 'line-through decoration-pencil decoration-1 text-ink/40'
                                : isNote
                                  ? 'text-ink/70 italic'
                                  : 'text-ink hover:text-ink-light'
                            }`}
                            onClick={() => startEditing(entry.id, entry.title)}
                            title="Click to edit"
                          >
                            {entry.title}
                          </button>
                        )}

                        {/* Priority dot (tasks only) */}
                        {!isEditing && isTask && priorityStyle && (
                          <span
                            className={`flex-shrink-0 inline-block size-1.5 rounded-full ${priorityStyle.dot} opacity-60`}
                            title={priorityStyle.label + ' priority'}
                          />
                        )}

                        {/* Time badge (events) */}
                        {!isEditing && isEvent && entry.time && (
                          <span className="flex-shrink-0 font-mono text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                            {entry.time}
                          </span>
                        )}

                        {/* Moved count dots */}
                        {!isEditing && isTask && (entry.movedCount ?? 0) > 0 && (
                          <span
                            className="flex gap-0.5 ml-1"
                            title={`Moved ${entry.movedCount} time(s)`}
                          >
                            {Array.from({
                              length: entry.movedCount ?? 0,
                            }).map((_, i) => (
                              <span
                                key={i}
                                className="inline-block size-1.5 rounded-full bg-tension/40"
                              />
                            ))}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {!isEditing && entry.tags && entry.tags.length > 0 && (
                        <span className="hidden sm:inline-block font-mono text-[10px] text-pencil/70 bg-wood-light/30 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">
                          {entry.tags[0]}
                        </span>
                      )}

                      {/* Hover actions */}
                      {!isEditing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover/entry:opacity-100 transition-opacity flex-shrink-0">
                          {/* Stuck? button (tasks only, not done) */}
                          {isTask && !isDone && (
                            <button
                              onClick={() => setStuckTask(entry)}
                              className="font-mono text-[9px] text-pencil hover:text-primary bg-wood-light/30 hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors focus:outline-none uppercase tracking-wider"
                              title="Stuck on this task?"
                            >
                              Stuck?
                            </button>
                          )}
                          <Link
                            to="/migration"
                            className="text-pencil hover:text-tension transition-colors"
                            title="Migrate"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              east
                            </span>
                          </Link>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="text-pencil hover:text-tension transition-colors focus:outline-none"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              delete
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ── Add New Entry Input ────────────────────────────── */}
                <div className="mt-4 space-y-2">
                  {/* Type selector pills */}
                  <div className="flex items-center gap-1">
                    {TYPE_PILLS.map((pill) => (
                      <button
                        key={pill.type}
                        onClick={() => setEntryType(pill.type)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] uppercase tracking-wider transition-all ${
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

                  {/* Input row */}
                  <div className="flex items-center gap-3 py-2 -mx-3 px-3 rounded transition-colors opacity-60 hover:opacity-100 focus-within:opacity-100">
                    <div className="mt-0.5 text-primary/60 flex-shrink-0">
                      <span className="material-symbols-outlined text-[18px]">
                        add
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        ref={newInputRef}
                        className="w-full bg-transparent border-none p-0 text-lg font-body text-ink placeholder:text-pencil/50 focus:ring-0 focus:outline-none"
                        placeholder={placeholder}
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={handleAddEntry}
                      />
                    </div>

                    {/* Event time input */}
                    {entryType === 'event' && (
                      <input
                        type="time"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        className="font-mono text-xs text-ink bg-surface-light border border-wood-light/50 rounded px-2 py-1 focus:outline-none focus:border-primary/30 flex-shrink-0"
                      />
                    )}

                    {/* Priority selector (tasks only) */}
                    {entryType === 'task' && (
                      <button
                        onClick={cyclePriority}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-wood-light/50 hover:border-primary/30 transition-colors focus:outline-none flex-shrink-0"
                        title={`Priority: ${PRIORITY_STYLES[newPriority].label}. Click to cycle.`}
                      >
                        <span
                          className={`inline-block size-2 rounded-full ${PRIORITY_STYLES[newPriority].dot}`}
                        />
                        <span className="font-mono text-[10px] text-pencil uppercase tracking-wider">
                          {PRIORITY_STYLES[newPriority].label}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* ── Upcoming Events Strip ────────────────────────────── */}
              {upcomingEvents.length > 0 && (
                <section className="border-t border-wood-light/30 pt-6">
                  <h2 className="font-header italic text-lg text-ink-light mb-3">
                    Upcoming Events
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-wood-light/40">
                    {upcomingEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex-shrink-0 bg-surface-light border border-wood-light/30 rounded-xl px-4 py-2.5 min-w-[160px] max-w-[220px]"
                      >
                        <p className="font-mono text-[10px] text-primary uppercase tracking-widest mb-0.5">
                          {formatEventDate(ev.date)}
                          {ev.time && ` \u00b7 ${ev.time}`}
                        </p>
                        <p className="font-body text-sm text-ink truncate">
                          {ev.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Habit Toggles ───────────────────────────────────── */}
              {habits.length > 0 && (
                <section className="border-t border-wood-light/30 pt-6">
                  <h2 className="font-header italic text-lg text-ink-light mb-4">
                    Daily Rituals
                  </h2>
                  <div className="flex flex-wrap gap-5 sm:gap-6">
                    {habits.map((habit) => {
                      const isCompleted = habit.completedDates.includes(today);

                      const colorMap: Record<string, string> = {
                        primary: 'bg-primary',
                        sage: 'bg-sage',
                        accent: 'bg-accent',
                        tension: 'bg-rose',
                      };
                      const bgColor = colorMap[habit.color] || 'bg-primary';

                      const borderMap: Record<string, string> = {
                        primary: 'border-primary',
                        sage: 'border-sage',
                        accent: 'border-accent',
                        tension: 'border-rose',
                      };
                      const borderColor = borderMap[habit.color] || 'border-primary';

                      return (
                        <button
                          key={habit.id}
                          onClick={() => toggleHabit(habit.id, today)}
                          className="group/habit flex flex-col items-center gap-2 cursor-pointer focus:outline-none"
                        >
                          <div
                            className={`relative size-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                              isCompleted
                                ? borderColor
                                : 'border-pencil/30 bg-transparent group-hover/habit:border-pencil/50'
                            }`}
                          >
                            <div
                              className={`size-9 rounded-full flex items-center justify-center text-white transition-transform duration-300 ${
                                isCompleted
                                  ? `${bgColor} scale-100`
                                  : 'scale-0'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                check
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <span
                              className={`text-xs font-mono font-medium transition-colors ${
                                isCompleted
                                  ? 'text-ink'
                                  : 'text-pencil group-hover/habit:text-ink'
                              }`}
                            >
                              {habit.name}
                            </span>
                            {habit.streak > 0 && (
                              <span className="text-[10px] font-mono text-pencil/60 mt-0.5">
                                {habit.streak}d streak
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── Plan in Flow link ───────────────────────────────── */}
              <div className="pt-2">
                <Link
                  to="/flow"
                  className="inline-flex items-center gap-2 font-body text-sm text-primary hover:text-primary/80 transition-colors group/flow"
                >
                  Plan in Flow
                  <span className="material-symbols-outlined text-[16px] group-hover/flow:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════
             EVENING MODE
             ══════════════════════════════════════════════════════════ */}
          {mode === 'evening' && (
            <>
              {/* ── Day Debrief ──────────────────────────────────────── */}
              {!debriefHidden && (
                <section>
                  <h2 className="font-header italic text-lg text-ink-light mb-4">
                    Day Debrief
                  </h2>
                  <DayDebriefComponent
                    todayEntries={todayEntries}
                    onSave={(debrief) => {
                      saveDebrief(debrief);
                      setDebriefDismissed(true);
                    }}
                    onSkip={() => setDebriefDismissed(true)}
                  />
                </section>
              )}

              {/* Show saved debrief summary if already completed */}
              {todayDebriefExists && (
                <section className="bg-sage/5 border border-sage/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-sage text-base">check_circle</span>
                    <p className="text-sm font-body font-medium text-ink">Day debrief saved</p>
                  </div>
                  <p className="text-xs font-body text-ink-light pl-6">
                    You&apos;ve already reflected on today. Your data is stored safely.
                  </p>
                </section>
              )}

              {/* ── Plan Tomorrow ─────────────────────────────────────── */}
              <section className="bg-gradient-to-br from-primary/[0.06] to-sage/[0.08] border-2 border-primary/20 rounded-2xl p-8 sm:p-10 shadow-lifted -mx-2 sm:-mx-4">
                <div className="flex items-center gap-4 mb-7">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">event_upcoming</span>
                  </div>
                  <div>
                    <h2 className="font-header italic text-2xl sm:text-3xl text-ink">Plan Tomorrow</h2>
                    <p className="text-sm font-body text-ink-light mt-0.5">Set yourself up for a gentle start</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Tomorrow's intention */}
                  <div>
                    <label className="block text-sm font-body font-medium text-ink mb-2">
                      What do you want tomorrow to feel like?
                    </label>
                    <input
                      type="text"
                      value={tomorrowIntention}
                      onChange={e => setTomorrowIntention(e.target.value)}
                      placeholder="Calm and focused · Productive but gentle · One step at a time"
                      className="w-full px-5 py-4 bg-paper border border-wood-light/30 rounded-xl text-ink font-handwriting text-lg focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder-ink-light/40 shadow-inner-shallow"
                    />
                  </div>

                  {/* Tomorrow's entries */}
                  {tomorrowEntries.length > 0 && (
                    <div>
                      <p className="text-sm font-body font-medium text-ink-light mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">checklist</span>
                        {tomorrowEntries.length} item{tomorrowEntries.length !== 1 ? 's' : ''} planned
                      </p>
                      <div className="space-y-1.5 bg-paper/60 rounded-xl border border-wood-light/20 p-4">
                        {tomorrowEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center gap-3 py-2 group/item"
                          >
                            {bulletForEntry(entry)}
                            <span
                              className={`font-body text-base flex-1 ${
                                entry.type === 'note'
                                  ? 'text-ink/60 italic'
                                  : 'text-ink/80'
                              }`}
                            >
                              {entry.title}
                            </span>
                            {entry.type === 'event' && entry.time && (
                              <span className="font-mono text-[11px] text-primary/70 bg-primary/10 px-2 py-0.5 rounded flex-shrink-0">
                                {entry.time}
                              </span>
                            )}
                            {entry.type === 'task' && entry.priority && (
                              <span
                                className={`flex-shrink-0 inline-block size-2 rounded-full ${PRIORITY_STYLES[entry.priority].dot} opacity-60`}
                                title={PRIORITY_STYLES[entry.priority].label + ' priority'}
                              />
                            )}
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="opacity-0 group-hover/item:opacity-100 text-ink-light/40 hover:text-tension transition-all shrink-0"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add entry for tomorrow */}
                  <div>
                    <label className="block text-sm font-body font-medium text-ink-light mb-2">
                      Add tasks or events
                    </label>
                    <input
                      ref={tomorrowInputRef}
                      type="text"
                      value={tomorrowAddInput}
                      onChange={e => setTomorrowAddInput(e.target.value)}
                      onKeyDown={handleAddTomorrowEntry}
                      placeholder='e.g. "3pm: standup" or "review PR"'
                      className="w-full px-5 py-4 bg-paper border border-wood-light/30 rounded-xl text-ink font-body text-base focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder-ink-light/40 shadow-inner-shallow"
                    />
                    <p className="text-xs font-body text-ink-light/40 mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">keyboard_return</span>
                      Enter to add · Day + time references auto-create events
                    </p>
                  </div>

                  {/* Capacity hint — only warn when total scheduled duration is heavy */}
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
                    const hours = Math.round(totalMin / 60);
                    // Only show if total scheduled time > 6 hours
                    if (totalMin <= 360) return null;
                    return (
                      <div className="flex items-start gap-2 p-4 rounded-xl bg-accent/10 border border-accent/20">
                        <span className="material-symbols-outlined text-accent text-lg mt-0.5">emoji_objects</span>
                        <p className="text-sm font-body text-ink-light leading-relaxed">
                          ~{hours}h of scheduled work tomorrow — consider trimming or spreading tasks across days.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Empty state encouragement */}
                  {tomorrowEntries.length === 0 && !tomorrowIntention && (
                    <div className="text-center py-4">
                      <p className="text-base font-handwriting text-ink-light/50">
                        Even one task is enough. Start small.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Journal Method Picker ────────────────────────────── */}
              <section className="border-t border-wood-light/30 pt-6">
                <h2 className="font-header italic text-lg text-ink-light mb-4">
                  Evening Journal
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {JOURNAL_METHODS.map((method) => {
                    const categoryColors: Record<string, string> = {
                      cbt: 'bg-sage/15 text-sage border-sage/30',
                      integration: 'bg-accent/15 text-accent border-accent/30',
                      daily: 'bg-primary/15 text-primary border-primary/30',
                    };
                    const categoryStyle =
                      categoryColors[method.category] ??
                      'bg-wood-light/30 text-pencil border-wood-light/50';

                    return (
                      <button
                        key={method.id}
                        onClick={() => setActiveMethod(method)}
                        className="text-left p-4 rounded-xl border border-wood-light/30 bg-white/40 hover:bg-surface-light hover:border-primary/20 transition-all group/method"
                      >
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-xl text-ink/60 group-hover/method:text-primary transition-colors mt-0.5">
                            {method.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-body text-sm font-semibold text-ink">
                                {method.name}
                              </span>
                              <span
                                className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${categoryStyle}`}
                              >
                                {method.category}
                              </span>
                            </div>
                            <p className="font-body text-xs text-pencil leading-relaxed line-clamp-2">
                              {method.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ── Today's Journal Entries ──────────────────────────── */}
              {journalEntries.filter((j) => j.date === today).length > 0 && (
                <section className="border-t border-wood-light/30 pt-6">
                  <h2 className="font-header italic text-lg text-ink-light mb-3">
                    Journal Entries
                  </h2>
                  <div className="space-y-3">
                    {journalEntries
                      .filter((j) => j.date === today)
                      .map((entry) => (
                        <Link
                          key={entry.id}
                          to={`/journal/${entry.id}`}
                          className="block p-4 rounded-xl border border-wood-light/30 bg-white/40 hover:bg-surface-light hover:border-primary/20 transition-all"
                        >
                          {entry.title && (
                            <p className="font-body text-sm font-semibold text-ink/70 mb-0.5">
                              {entry.title}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed font-body text-ink/70 italic line-clamp-2">
                            {entry.content}
                          </p>
                          {entry.method && (
                            <span className="inline-block mt-2 font-mono text-[9px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-widest">
                              {entry.method}
                            </span>
                          )}
                        </Link>
                      ))}
                  </div>
                </section>
              )}

              {/* ── Wins Summary ─────────────────────────────────────── */}
              {todaysCompletedTasks.length > 0 && (
                <section className="border-t border-wood-light/30 pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-header italic text-lg text-ink-light">
                      Today&rsquo;s Wins
                    </h2>
                    <button
                      onClick={fireConfetti}
                      className="font-mono text-[10px] text-primary hover:text-primary/80 uppercase tracking-widest transition-colors flex items-center gap-1"
                      title="Celebrate!"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        celebration
                      </span>
                      Celebrate
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {todaysCompletedTasks.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center gap-2 font-body text-sm text-ink/70"
                      >
                        <span className="text-primary font-bold text-xs">
                          &times;
                        </span>
                        <span className="line-through decoration-pencil/30 decoration-1">
                          {task.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

            </>
          )}

          {/* Page corner fold decoration */}
          <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-background-light/10 to-transparent pointer-events-none rounded-br-sm" />
        </article>

        {/* ── Sidebar Quick Links (hidden on small screens) ──────── */}
        <aside className="hidden xl:flex flex-col gap-4 fixed right-10 top-32 w-16 items-center">
          <div className="group/link relative">
            <Link
              to="/flow"
              className="size-12 rounded-full bg-paper shadow-md hover:shadow-lg border border-wood-light/50 flex items-center justify-center text-ink hover:text-primary transition-all hover:-translate-y-1"
            >
              <span className="material-symbols-outlined">
                calendar_view_day
              </span>
            </Link>
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink bg-paper px-2 py-1 rounded shadow opacity-0 group-hover/link:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Flow View
            </span>
          </div>
          <div className="group/link relative">
            <Link
              to="/migration"
              className="size-12 rounded-full bg-paper shadow-md hover:shadow-lg border border-wood-light/50 flex items-center justify-center text-ink hover:text-tension transition-all hover:-translate-y-1"
            >
              <span className="material-symbols-outlined">inbox</span>
            </Link>
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink bg-paper px-2 py-1 rounded shadow opacity-0 group-hover/link:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Migration Station
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}
