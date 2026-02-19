import { useState, useRef, useEffect, useMemo, useCallback, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
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

function formatEventDate(dateStr: string, todayDate: string, tomorrowDate: string): string {
  if (dateStr === todayDate) return 'Today';
  if (dateStr === tomorrowDate) return 'Tomorrow';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/** Suggest journal exercises based on time of day */
function getSuggestedMethodIds(): string[] {
  const hour = new Date().getHours();
  if (hour < 12) {
    // Morning: brain dump + anxiety prep
    return ['morning-pages', 'anxiety-reality-check'];
  }
  if (hour < 17) {
    // Afternoon: mid-day reflection
    return ['pattern-breaker', 'positive-data-log', 'five-whys'];
  }
  // Evening: wind-down + gratitude
  return ['three-good-things', 'integration', 'body-scan'];
}

function getTimeLabel(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
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
    batchUpdateEntries,
    deleteEntry,
    toggleHabit,
    addJournalEntry,
    saveDebrief,
    deleteDebrief,
  } = useApp();

  /* ── Date (auto-refresh on tab focus) ────────────────────────── */

  const [dateKey, setDateKey] = useState(todayStr);
  const [isEveningTime, setIsEveningTime] = useState(() => new Date().getHours() >= 18);

  // Refresh dateKey + evening state on tab focus AND every 60s
  useEffect(() => {
    const refresh = () => {
      setDateKey((prev) => {
        const now = todayStr();
        return prev !== now ? now : prev;
      });
      setIsEveningTime(new Date().getHours() >= 18);
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
  const [planOverlayOpen, setPlanOverlayOpen] = useState(false);
  const [debriefOverlayOpen, setDebriefOverlayOpen] = useState(false);
  const [showDebriefEarly, setShowDebriefEarly] = useState(false);
  const [focusMode, setFocusMode] = useState(false);


  // Sync focus mode to document so Layout can hide the nav bar
  useEffect(() => {
    document.documentElement.classList.toggle('focus-mode', focusMode);
    return () => { document.documentElement.classList.remove('focus-mode'); };
  }, [focusMode]);

  const [planAddInput, setPlanAddInput] = useState('');
  const planInputRef = useRef<HTMLInputElement>(null);
  const [planTarget, setPlanTarget] = useState<'today' | 'tomorrow' | 'week'>('tomorrow');

  // Compute the target date for the plan overlay
  const planTargetDate = planTarget === 'today' ? today : planTarget === 'tomorrow' ? tomorrow : today;

  /* ── Plan target intention (stored per date) ──────────────────── */

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

  // Week range: from today through end of next 6 days
  const weekEnd = useMemo(() => {
    const d = new Date(dateKey + 'T12:00:00');
    d.setDate(d.getDate() + 6);
    return formatLocalDate(d);
  }, [dateKey]);

  // Entries for the plan overlay based on target
  const planEntries = useMemo(() => {
    if (planTarget === 'today') return todayEntries;
    if (planTarget === 'tomorrow') return tomorrowEntries;
    // week: all entries in the next 7 days
    return entries.filter((e) => e.date >= today && e.date <= weekEnd);
  }, [planTarget, todayEntries, tomorrowEntries, entries, today, weekEnd]);

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

  // Overdue tasks: incomplete tasks from past days
  const overdueTasks = useMemo(
    () => entries.filter((e) => e.type === 'task' && e.status === 'todo' && e.date < today),
    [entries, today],
  );

  // Journal-based wins for today (from exercises like 3 Good Things)
  const todaysJournalWins = useMemo(() => {
    const todayJournals = journalEntries.filter(j => j.date === today && j.wins && j.wins.length > 0);
    return todayJournals.flatMap(j => j.wins ?? []);
  }, [journalEntries, today]);

  const [overdueExpanded, setOverdueExpanded] = useState(false);

  const rescheduleAll = useCallback(() => {
    if (overdueTasks.length === 0) return;
    batchUpdateEntries(overdueTasks.map(t => ({
      id: t.id,
      updates: { date: today, movedCount: (t.movedCount ?? 0) + 1 },
    })));
  }, [overdueTasks, today, batchUpdateEntries]);

  const parkAll = useCallback(() => {
    if (overdueTasks.length === 0) return;
    batchUpdateEntries(overdueTasks.map(t => ({
      id: t.id,
      updates: { date: today, section: undefined, timeBlock: undefined, movedCount: (t.movedCount ?? 0) + 1 },
    })));
  }, [overdueTasks, today, batchUpdateEntries]);

  const rescheduleOne = useCallback((id: string) => {
    const task = overdueTasks.find(t => t.id === id);
    if (task) {
      updateEntry(id, { date: today, movedCount: (task.movedCount ?? 0) + 1 });
    }
  }, [overdueTasks, today, updateEntry]);

  const dismissOverdue = useCallback((id: string) => {
    updateEntry(id, { status: 'done' });
  }, [updateEntry]);

  const todaysJournalEntries = useMemo(
    () => journalEntries.filter((j) => j.date === today),
    [journalEntries, today],
  );

  /* Auto-show day recovery: after noon with no tasks done */
  const isAfterNoon = new Date().getHours() >= 12;
  const shouldAutoShowRecovery =
    isAfterNoon && todayTasks.length > 0 && completedCount === 0;

  useEffect(() => {
    if (shouldAutoShowRecovery) {
      setShowDayRecovery(true);
    }
  }, [shouldAutoShowRecovery]);

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
        if (parsed.endTime) base.timeBlock = parsed.endTime;
      }

      addEntry(base);
      setNewTitle('');
      setNewEventTime('');
      setNewPriority('medium');
      setPlaceholder(getPlaceholder(entryType));
    },
    [newTitle, entryType, newPriority, newEventTime, today, addEntry],
  );

  /* ── Handler: Add entry via Plan overlay ──────────────────────── */

  const handleAddPlanEntry = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter' || !planAddInput.trim()) return;

      const parsed = parseNaturalEntry(planAddInput.trim());
      const resolvedType = parsed.type || 'task';

      const base: RapidLogEntry = {
        id: Date.now().toString(),
        type: resolvedType,
        title: parsed.title,
        date: parsed.date || planTargetDate,
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
      setPlanAddInput('');
    },
    [planAddInput, planTargetDate, addEntry],
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

      // Extract wins from specific journal methods
      let wins: string[] | undefined;
      if (activeMethod.id === 'three-good-things') {
        // Steps 0, 2, 4 are the three good things themselves
        wins = [0, 2, 4]
          .map(i => answers[i]?.answer)
          .filter((a): a is string => !!a && a.trim().length > 0);
      } else if (activeMethod.id === 'wins-inventory' || activeMethod.id === 'gratitude') {
        // Any exercise about wins/gratitude — all non-empty answers are wins
        wins = answers
          .map(s => s.answer)
          .filter((a): a is string => !!a && a.trim().length > 0);
      }

      const entry: JournalEntry = {
        id: Date.now().toString(),
        date: dateKey,
        title: activeMethod.name,
        content,
        method: activeMethod.id,
        steps: answers,
        ...(wins && wins.length > 0 ? { wins } : {}),
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

  // Debrief is available when: (auto after 6pm OR manually triggered) AND not dismissed/completed
  const debriefAvailable = !debriefHidden && (isEveningTime || showDebriefEarly);

  // Reset debrief UI state when the date rolls over
  useEffect(() => {
    setDebriefDismissed(false);
    setRedoDebrief(false);
    setShowDebriefEarly(false);
    setDebriefOverlayOpen(false);
  }, [dateKey]);

  // Auto-open debrief overlay when it becomes available (6pm or manual trigger)
  useEffect(() => {
    if (debriefAvailable && !debriefOverlayOpen) {
      setDebriefOverlayOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debriefAvailable]);

  /* ── Bullet rendering helpers ────────────────────────────────── */

  const bulletForEntry = (entry: RapidLogEntry) => {
    if (entry.type === 'event') {
      return (
        <span className="inline-flex items-center justify-center size-[14px] rounded-full border-[2.5px] border-ink/50 flex-shrink-0" />
      );
    }
    if (entry.type === 'note') {
      return (
        <span className="inline-block w-[16px] h-[2.5px] bg-ink/35 rounded-full flex-shrink-0" />
      );
    }
    // Task states
    if (entry.status === 'done') {
      return (
        <span className="text-sage text-lg flex-shrink-0 select-none leading-none">&#10003;</span>
      );
    }
    if (entry.status === 'cancelled') {
      return (
        <span className="text-tension/60 text-base font-bold flex-shrink-0 select-none leading-none">&#10007;</span>
      );
    }
    if (entry.status === 'migrated') {
      return (
        <span className="text-primary/50 text-base font-bold flex-shrink-0 select-none leading-none">&rarr;</span>
      );
    }
    return (
      <span className="inline-block size-[12px] rounded-full bg-ink flex-shrink-0" />
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     RENDER — Unified Daily Page (no morning/evening toggle)
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

      {/* ── Plan Overlay (Today / Tomorrow / Week) ────────────────── */}
      {planOverlayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setPlanOverlayOpen(false)}>
          <div className="bg-paper rounded-2xl shadow-lifted w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg">event_note</span>
                </div>
                <h2 className="font-header italic text-2xl text-ink">Plan</h2>
              </div>
              <button onClick={() => setPlanOverlayOpen(false)} className="text-pencil hover:text-ink transition-colors p-1">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Tab selector: Today / Tomorrow / Week */}
            <div className="flex gap-1 mb-5 bg-surface-light rounded-lg p-1">
              {([
                { key: 'today' as const, label: 'Today', icon: 'today' },
                { key: 'tomorrow' as const, label: 'Tomorrow', icon: 'event_upcoming' },
                { key: 'week' as const, label: 'This Week', icon: 'date_range' },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setPlanTarget(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-body transition-all ${
                    planTarget === tab.key
                      ? 'bg-paper shadow-sm text-ink font-medium'
                      : 'text-pencil hover:text-ink'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-5">
              {/* Intention — only for today/tomorrow (not week) */}
              {planTarget !== 'week' && (
                <div>
                  <label className="block font-mono text-[10px] text-accent uppercase tracking-[0.15em] mb-1.5">
                    {planTarget === 'today' ? "Today\u2019s intention" : "Tomorrow\u2019s intention"}
                  </label>
                  <input
                    type="text"
                    value={planTarget === 'today' ? intention : tomorrowIntention}
                    onChange={e => planTarget === 'today' ? setIntention(e.target.value) : setTomorrowIntention(e.target.value)}
                    placeholder={planTarget === 'today' ? 'Redefine the day...' : 'Intention for tomorrow'}
                    className="w-full bg-transparent border-none p-0 text-xl font-display text-ink placeholder:text-pencil/30 focus:ring-0 focus:outline-none italic"
                  />
                  <div className="mt-1 h-[1.5px] bg-wood-light/20" />
                </div>
              )}

              {/* Entries list */}
              {planEntries.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">checklist</span>
                    {planEntries.length} item{planEntries.length !== 1 ? 's' : ''} {planTarget === 'today' ? 'today' : 'planned'}
                  </p>
                  <div className="space-y-0.5">
                    {planEntries.map((entry) => (
                      <div key={entry.id} className="group/item flex items-start gap-3 py-2 hover:bg-surface-light/60 -mx-3 px-3 rounded transition-colors">
                        {bulletForEntry(entry)}
                        <span className={`font-body text-base flex-1 leading-snug ${entry.type === 'note' ? 'text-ink/60 italic' : 'text-ink'}`}>
                          {entry.title}
                        </span>
                        {/* Show date label in week view */}
                        {planTarget === 'week' && entry.date !== today && (
                          <span className="font-mono text-[10px] text-pencil/50 flex-shrink-0">
                            {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                        )}
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

              {/* Add entry input */}
              <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-light/50 border border-wood-light/15 focus-within:border-primary/30 transition-all">
                <span className="material-symbols-outlined text-lg text-primary/40">add</span>
                <input
                  ref={planInputRef}
                  type="text"
                  value={planAddInput}
                  onChange={e => setPlanAddInput(e.target.value)}
                  onKeyDown={handleAddPlanEntry}
                  placeholder={planTarget === 'today' ? 'Add to today...' : planTarget === 'tomorrow' ? 'e.g. "3pm: standup" or "review PR"' : 'Add to this week...'}
                  className="flex-1 min-w-0 bg-transparent border-none p-0 text-base font-body text-ink placeholder:text-pencil/40 focus:ring-0 focus:outline-none"
                />
              </div>

              {/* Work hours nudge */}
              {(() => {
                const tasks = planEntries.filter(e => e.type === 'task');
                const totalMin = tasks.reduce((sum, t) => {
                  if (!t.duration) return sum;
                  let m = 0;
                  const hMatch = t.duration.match(/(\d+)h/);
                  const mMatch = t.duration.match(/(\d+)m/);
                  if (hMatch) m += parseInt(hMatch[1], 10) * 60;
                  if (mMatch) m += parseInt(mMatch[1], 10);
                  return sum + m;
                }, 0);
                const threshold = planTarget === 'week' ? 2400 : 360;
                if (totalMin <= threshold) return null;
                return (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <span className="material-symbols-outlined text-accent text-base mt-0.5">emoji_objects</span>
                    <p className="text-sm font-body text-ink-light">
                      ~{Math.round(totalMin / 60)}h of scheduled work{planTarget === 'week' ? ' this week' : planTarget === 'tomorrow' ? ' tomorrow' : ' today'}.
                    </p>
                  </div>
                );
              })()}

              {planEntries.length === 0 && (
                <p className="text-center py-4 text-base font-handwriting text-ink-light/40">
                  Nothing here yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Debrief Overlay — focused, full-screen, distraction-free ── */}
      {debriefOverlayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setDebriefOverlayOpen(false); setDebriefDismissed(true); }}>
          <div className="bg-paper rounded-2xl shadow-lifted w-full max-w-xl mx-4 p-8 sm:p-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sage/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sage text-lg">nights_stay</span>
                </div>
                <div>
                  <h2 className="font-header italic text-2xl text-ink">Day Debrief</h2>
                  <p className="text-sm font-body text-pencil">How did today go?</p>
                </div>
              </div>
              <button onClick={() => { setDebriefOverlayOpen(false); setDebriefDismissed(true); }} className="text-pencil hover:text-ink transition-colors p-1">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <DayDebriefComponent
              todayEntries={todayEntries}
              date={dateKey}
              onSave={(debrief) => { saveDebrief(debrief); setDebriefOverlayOpen(false); setDebriefDismissed(true); setRedoDebrief(false); }}
              onSkip={() => { setDebriefOverlayOpen(false); setDebriefDismissed(true); }}
            />
          </div>
        </div>
      )}

      {/* ── Page ────────────────────────────────────────────────────── */}

      <div className="flex-1 overflow-y-auto bg-background-light">
        {/* ── Header strip (full width) ──────────────────────────── */}
        <header className={`px-6 sm:px-10 pt-6 pb-4 border-b border-wood-light/15 transition-all duration-500 ${focusMode ? 'pb-3 pt-5' : ''}`}>
          <div className={`mx-auto ${focusMode ? 'max-w-2xl relative' : 'max-w-[1400px] flex items-end justify-between gap-4'}`}>
            {focusMode ? (
              <>
                {/* Focus mode: centered day + intention, tiny exit button */}
                <div className="text-center">
                  <h1 className="font-display italic text-ink leading-tight text-2xl">
                    {todayDisplay}
                  </h1>
                  <div className="mt-2 max-w-md mx-auto">
                    <input
                      className="w-full bg-transparent border-none p-0 text-center text-lg font-display text-ink/70 placeholder:text-pencil/25 focus:ring-0 focus:outline-none italic"
                      placeholder="intention..."
                      type="text"
                      value={intention}
                      onChange={(e) => setIntention(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setFocusMode(false)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-pencil/30 hover:text-pencil/60 transition-colors"
                  title="Exit focus mode"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                </button>
              </>
            ) : (
              <>
                {/* Normal mode: left-aligned header */}
                <div>
                  <span className="font-mono text-[11px] text-pencil tracking-[0.2em] uppercase block mb-1">
                    {yearStr}
                  </span>
                  <h1 className="font-display italic text-ink leading-tight text-3xl sm:text-4xl">
                    {todayDisplay}
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-block w-8 h-[2px] rounded-full bg-accent/60" />
                    <span className="font-body text-sm text-pencil/60">
                      Good {getGreeting()}
                    </span>
                  </div>
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
                  {/* Focus mode toggle */}
                  <button
                    onClick={() => setFocusMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-wood-light/30 text-sm font-body text-pencil hover:text-primary hover:border-primary/30 transition-all"
                    title="Focus mode — rapid log only"
                  >
                    <span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
                    <span className="hidden sm:inline">Focus</span>
                  </button>
                  {/* Plan button */}
                  <button
                    onClick={() => setPlanOverlayOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-wood-light/30 text-sm font-body text-pencil hover:text-primary hover:border-primary/30 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">event_note</span>
                    <span className="hidden sm:inline">Plan</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════
           UNIFIED DAILY PAGE — 3-column layout
           ══════════════════════════════════════════════════════════ */}
        <div className={`mx-auto px-6 sm:px-10 py-6 grid items-start transition-all duration-500 ease-out ${
          focusMode
            ? 'grid-cols-1 max-w-2xl'
            : 'max-w-[1400px] grid-cols-1 lg:grid-cols-[260px_1fr_260px] xl:grid-cols-[300px_1fr_300px] gap-6'
        }`}>

          {/* ── LEFT SIDEBAR ────────────────────────────────────── */}
          <aside className={`hidden lg:flex flex-col gap-5 sticky top-6 transition-all duration-500 ${
            focusMode ? 'lg:hidden' : ''
          }`}>
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

            {/* Debrief saved indicator */}
            {todayDebriefExists && !redoDebrief && (
              <div className="bg-sage/5 border border-sage/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sage text-base">check_circle</span>
                    <p className="text-sm font-body font-medium text-ink">Debrief saved</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setRedoDebrief(true); setDebriefOverlayOpen(true); }}
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

            {/* Debrief trigger button — opens focused overlay */}
            {!todayDebriefExists && (
              <button
                onClick={() => { setShowDebriefEarly(true); setDebriefOverlayOpen(true); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-paper border border-wood-light/15 shadow-soft text-sm font-body text-ink hover:text-primary hover:border-primary/20 transition-all group/link"
              >
                <span className="material-symbols-outlined text-[18px] text-pencil group-hover/link:text-primary transition-colors">rate_review</span>
                {isEveningTime ? 'Day Debrief' : 'Start Debrief'}
              </button>
            )}

            {/* Today's Journal Entries */}
            {todaysJournalEntries.length > 0 && (
              <div className="bg-paper rounded-xl p-5 shadow-soft border border-wood-light/15">
                <h3 className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em] mb-3">
                  Journal Entries
                </h3>
                <div className="space-y-2">
                  {todaysJournalEntries.map((entry) => (
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
            {/* Everything above the rapid log — hidden in focus mode */}
            {!focusMode && (
              <>
                {/* Intention */}
                <div className="mb-5">
                  <label className="block font-mono text-[10px] text-accent uppercase tracking-[0.15em] mb-1.5">
                    Today&rsquo;s Intention
                  </label>
                  <div className="relative group/input">
                    <input
                      className="w-full bg-transparent border-none p-0 text-xl sm:text-2xl font-display text-ink placeholder:text-pencil/30 focus:ring-0 focus:outline-none italic"
                      placeholder="What matters today?"
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
                    <DayRecovery entries={entries} onUpdateEntry={updateEntry} onDismiss={() => setShowDayRecovery(false)} />
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
              </>
            )}

            {/* ── Overdue Tasks — hidden in focus mode ── */}
            {!focusMode && overdueTasks.length > 0 && (
              <div className="mb-4 bg-tension/5 border border-tension/20 rounded-xl overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  onClick={() => setOverdueExpanded(v => !v)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-tension text-lg">schedule</span>
                    <span className="font-body text-sm text-ink">
                      <span className="font-semibold">{overdueTasks.length}</span> task{overdueTasks.length !== 1 ? 's' : ''} left behind
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); rescheduleAll(); }}
                      className="text-xs font-mono text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 px-2.5 py-1 rounded-full transition-colors uppercase tracking-wider"
                    >
                      → Today
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); parkAll(); }}
                      className="text-xs font-mono text-pencil hover:text-ink bg-surface-light hover:bg-wood-light/20 px-2.5 py-1 rounded-full transition-colors uppercase tracking-wider"
                    >
                      → Parking lot
                    </button>
                    <span className={`material-symbols-outlined text-pencil text-lg transition-transform ${overdueExpanded ? '' : '-rotate-90'}`}>
                      expand_more
                    </span>
                  </div>
                </div>
                {overdueExpanded && (
                  <div className="px-4 pb-3 space-y-1">
                    {overdueTasks.map(task => (
                      <div key={task.id} className="group/ot flex items-center gap-3 py-1.5 px-2 -mx-2 rounded hover:bg-tension/5 transition-colors">
                        <span className="inline-block size-2 rounded-full bg-ink flex-shrink-0" />
                        <span className="flex-1 font-body text-sm text-ink truncate">{task.title}</span>
                        <span className="font-mono text-[10px] text-pencil/50 flex-shrink-0">
                          {new Date(task.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover/ot:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => rescheduleOne(task.id)}
                            className="text-primary hover:text-primary/80 transition-colors"
                            title="Move to today"
                          >
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </button>
                          <button
                            onClick={() => dismissOverdue(task.id)}
                            className="text-pencil hover:text-sage transition-colors"
                            title="Mark done"
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          </button>
                          <button
                            onClick={() => deleteEntry(task.id)}
                            className="text-pencil hover:text-tension transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              <div className="space-y-0">
                {todayEntries.map((entry) => {
                  const isEditing = editingEntryId === entry.id;
                  const isDone = entry.type === 'task' && entry.status === 'done';
                  const isCancelled = entry.type === 'task' && entry.status === 'cancelled';
                  const isInactive = isDone || isCancelled;
                  const isTask = entry.type === 'task';
                  const isNote = entry.type === 'note';
                  const isEvent = entry.type === 'event';
                  const priorityStyle = entry.priority ? PRIORITY_STYLES[entry.priority] : null;

                  return (
                    <div key={entry.id}>
                      <div
                        className={`group/entry flex items-center gap-3 py-1 hover:bg-surface-light/60 -mx-3 px-3 rounded transition-colors ${isInactive ? 'opacity-60' : ''}`}
                      >
                        {isTask ? (
                          <button
                            onClick={(e) => handleToggleTask(entry.id, e.currentTarget as HTMLElement)}
                            className="flex-shrink-0 focus:outline-none p-1.5 -m-1.5 rounded hover:bg-primary/10 transition-all flex items-center justify-center w-6 h-6"
                            title={isDone ? 'Mark as todo' : 'Mark as done'}
                          >
                            {bulletForEntry(entry)}
                          </button>
                        ) : (
                          <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">{bulletForEntry(entry)}</div>
                        )}

                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          {isEditing ? (
                            <input
                              ref={editInputRef}
                              className="w-full bg-transparent border-none p-0 text-lg font-body text-ink focus:ring-0 focus:outline-none"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleEditKeyDown}
                              onBlur={commitEdit}
                            />
                          ) : (
                            <button
                              className={`text-left text-lg leading-tight font-body transition-colors ${
                                isCancelled ? 'line-through decoration-tension/40 text-ink/40'
                                  : isDone ? 'text-ink/50'
                                  : isNote ? 'text-ink/60 italic'
                                  : 'text-ink hover:text-ink-light'
                              }`}
                              onDoubleClick={() => startEditing(entry.id, entry.title)}
                              onClick={(e) => { if (isTask && !isCancelled) handleToggleTask(entry.id, e.currentTarget as HTMLElement); }}
                            >
                              {entry.title}
                            </button>
                          )}
                          {!isEditing && isTask && priorityStyle && !isInactive && (
                            <span className={`flex-shrink-0 inline-block size-2 rounded-full ${priorityStyle.dot} opacity-60`} />
                          )}
                          {!isEditing && isEvent && entry.time && (
                            <span className="flex-shrink-0 font-mono text-[11px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">{entry.time}</span>
                          )}
                          {!isEditing && isTask && entry.timeBlock && !isInactive && (
                            <button
                              onClick={(e) => { e.stopPropagation(); updateEntry(entry.id, { timeBlock: undefined }); }}
                              className="flex-shrink-0 font-mono text-[11px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded hover:bg-primary/20 hover:line-through transition-all group/unpin"
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
                          <span className="hidden sm:inline-block font-mono text-[11px] text-pencil/60 bg-wood-light/20 px-1.5 py-0.5 rounded flex-shrink-0">
                            {entry.tags[0]}
                          </span>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-1 opacity-0 group-hover/entry:opacity-100 transition-opacity flex-shrink-0">
                            {isTask && !isInactive && (
                              <button onClick={() => setStuckTask(entry)} className="font-mono text-[10px] text-pencil hover:text-primary bg-wood-light/20 hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors uppercase tracking-wider">
                                Stuck?
                              </button>
                            )}
                            {isTask && !isInactive && (
                              <button
                                onClick={() => updateEntry(entry.id, { status: 'cancelled' })}
                                className="text-pencil hover:text-tension transition-colors"
                                title="Not doing"
                              >
                                <span className="material-symbols-outlined text-[16px]">block</span>
                              </button>
                            )}
                            {isTask && !isInactive && (
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
                      {/* Inline cancel note */}
                      {isCancelled && (
                        <div className="ml-9 -mt-0.5 mb-1">
                          <input
                            className="w-full bg-transparent border-none p-0 text-sm font-mono text-pencil/60 placeholder:text-pencil/30 focus:ring-0 focus:outline-none italic"
                            placeholder="why? (optional)"
                            value={entry.notes ?? ''}
                            onChange={(e) => updateEntry(entry.id, { notes: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add new entry */}
              <div className="mt-3 space-y-2">
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
                    className="flex-1 min-w-0 bg-transparent border-none p-0 text-lg font-body text-ink placeholder:text-pencil/40 focus:ring-0 focus:outline-none"
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

            {/* Mobile-only: Events + Habits + Debrief + Journal inline — hidden in focus mode */}
            {!focusMode && <div className="lg:hidden mt-5 space-y-4">
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

              {/* Mobile debrief */}
              {todayDebriefExists && !redoDebrief && (
                <div className="bg-sage/5 border border-sage/20 rounded-lg p-3 flex items-center justify-between">
                  <p className="text-sm font-body text-ink flex items-center gap-2">
                    <span className="material-symbols-outlined text-sage text-base">check_circle</span>
                    Debrief saved
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setRedoDebrief(true); setDebriefOverlayOpen(true); }}
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
              {!todayDebriefExists && (
                <button
                  onClick={() => { setShowDebriefEarly(true); setDebriefOverlayOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-paper border border-wood-light/15 text-sm font-body text-ink hover:text-primary hover:border-primary/20 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px] text-pencil">rate_review</span>
                  {isEveningTime ? 'Day Debrief' : 'Start Debrief'}
                </button>
              )}

              {/* Mobile journal exercises */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-header italic text-lg text-ink/70">Journal Exercises</h3>
                  <span className="font-mono text-[9px] text-primary/50 uppercase tracking-wider">
                    {getTimeLabel()} picks
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(() => {
                    const suggested = getSuggestedMethodIds();
                    const sorted = [...JOURNAL_METHODS].sort((a, b) => {
                      const aS = suggested.includes(a.id) ? 0 : 1;
                      const bS = suggested.includes(b.id) ? 0 : 1;
                      return aS - bS;
                    });
                    return sorted.map((method) => {
                      const isSuggested = suggested.includes(method.id);
                      return (
                        <button
                          key={method.id}
                          onClick={() => setActiveMethod(method)}
                          className={`text-left p-3 rounded-lg border transition-all ${
                            isSuggested
                              ? 'border-primary/20 bg-primary/5'
                              : 'border-wood-light/15 hover:bg-surface-light'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-lg mb-1 ${isSuggested ? 'text-primary/60' : 'text-ink/40'}`}>{method.icon}</span>
                          <p className="font-body text-sm font-medium text-ink">{method.name}</p>
                          {isSuggested && (
                            <span className="font-mono text-[8px] text-primary/60 uppercase tracking-wider">try now</span>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Mobile journal entries */}
              {todaysJournalEntries.length > 0 && (
                <div>
                  <h3 className="font-header italic text-lg text-ink/70 mb-2">Journal Entries</h3>
                  {todaysJournalEntries.map((entry) => (
                    <Link key={entry.id} to={`/journal/${entry.id}`} className="block p-3 rounded-lg border border-wood-light/15 hover:border-primary/20 transition-all mb-2">
                      {entry.title && <p className="font-body text-sm font-medium text-ink/70">{entry.title}</p>}
                      <p className="text-xs font-body text-ink/50 italic line-clamp-2">{entry.content}</p>
                    </Link>
                  ))}
                </div>
              )}

              <Link to="/flow" className="inline-flex items-center gap-1.5 font-body text-sm text-primary hover:text-primary/80 transition-colors">
                Plan in Flow <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>}
          </main>

          {/* ── RIGHT SIDEBAR ───────────────────────────────────── */}
          <aside className={`hidden lg:flex flex-col gap-5 sticky top-6 transition-all duration-500 ${
            focusMode ? 'lg:hidden' : ''
          }`}>
            {/* Habits */}
            {habits.length > 0 && (
              <div className="bg-paper rounded-xl p-4 shadow-soft border border-wood-light/15">
                <h3 className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em] mb-2.5">
                  Habits
                </h3>
                <div className="flex flex-wrap gap-2">
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
                        className={`group/habit flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all ${
                          isCompleted
                            ? `${borderColor} ${bgColor}/10`
                            : 'border-pencil/20 hover:border-pencil/40'
                        }`}
                      >
                        <div className={`size-4 rounded-full flex items-center justify-center transition-all ${
                          isCompleted ? `${bgColor} text-white` : 'border border-pencil/30'
                        }`}>
                          {isCompleted && <span className="material-symbols-outlined text-[10px]">check</span>}
                        </div>
                        <span className={`text-[11px] font-mono leading-none ${isCompleted ? 'text-ink' : 'text-pencil'}`}>
                          {habit.name}
                        </span>
                        {habit.streak > 0 && (
                          <span className="text-[9px] font-mono text-pencil/40">{habit.streak}d</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wins — tasks + journal wins */}
            {(todaysCompletedTasks.length > 0 || todaysJournalWins.length > 0) && (
              <div className="bg-paper rounded-xl p-5 shadow-soft border border-wood-light/15">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em]">
                      Wins
                    </h3>
                    <span className="font-mono text-[10px] text-primary/60 tabular-nums">
                      {todaysCompletedTasks.length + todaysJournalWins.length}
                    </span>
                  </div>
                  <button onClick={fireConfetti} className="text-accent hover:text-primary transition-colors" title="Celebrate!">
                    <span className="material-symbols-outlined text-[16px]">celebration</span>
                  </button>
                </div>
                <ul className="space-y-1">
                  {todaysCompletedTasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-2 text-sm font-body text-ink/50">
                      <span className="text-sage text-sm leading-none">&#10003;</span>
                      <span className="truncate">{task.title}</span>
                    </li>
                  ))}
                  {todaysJournalWins.map((win, i) => (
                    <li key={`jwin-${i}`} className="flex items-center gap-2 text-sm font-body text-primary/60">
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      <span className="truncate italic">{win}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Journal Exercises */}
            <div className="bg-paper rounded-xl p-5 shadow-soft border border-wood-light/15">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em]">
                  Journal Exercises
                </h3>
                <span className="font-mono text-[9px] text-primary/50 uppercase tracking-wider">
                  {getTimeLabel()} picks
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {(() => {
                  const suggested = getSuggestedMethodIds();
                  const sorted = [...JOURNAL_METHODS].sort((a, b) => {
                    const aS = suggested.includes(a.id) ? 0 : 1;
                    const bS = suggested.includes(b.id) ? 0 : 1;
                    return aS - bS;
                  });
                  return sorted.map((method) => {
                    const isSuggested = suggested.includes(method.id);
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
                        className={`text-left p-3 rounded-lg border transition-all group/method ${
                          isSuggested
                            ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                            : 'border-wood-light/15 hover:bg-surface-light hover:border-primary/20'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`material-symbols-outlined text-lg mt-0.5 transition-colors ${
                            isSuggested ? 'text-primary/60 group-hover/method:text-primary' : 'text-ink/40 group-hover/method:text-primary'
                          }`}>{method.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-body text-sm font-medium text-ink">{method.name}</span>
                              {isSuggested && (
                                <span className="font-mono text-[8px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                                  try now
                                </span>
                              )}
                              <span className={`font-mono text-[8px] uppercase tracking-widest px-1 py-0.5 rounded-full border ${categoryStyle}`}>{method.category}</span>
                            </div>
                            <p className="font-body text-xs text-pencil leading-relaxed line-clamp-2">{method.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
