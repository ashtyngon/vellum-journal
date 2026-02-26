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
import Walkthrough from '../components/Walkthrough';
import { parseNaturalEntry, parseTime } from '../lib/nlParser';
import { todayStr, dayAfter, dayBefore, formatLocalDate } from '../lib/dateUtils';
import { getColorOfTheDay, getDailyCompanion } from '../lib/colorOfTheDay';
import type { RapidLogEntry, JournalStep, JournalEntry } from '../context/AppContext';
import type { JournalMethod } from '../lib/journalMethods';

/* ── Constants ────────────────────────────────────────────────────── */

type EntryType = 'task' | 'event' | 'note';

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
  const d = new Date(dateStr + 'T12:00:00');
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  return `${weekday} ${month} ${day}`;
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
    isNewUser,
    completeWalkthrough,
  } = useApp();

  /* ── Date (auto-refresh on tab focus) ────────────────────────── */

  const [dateKey, setDateKey] = useState(todayStr);
  const [isEveningTime, setIsEveningTime] = useState(() => new Date().getHours() >= 18);
  const [manualNav, setManualNav] = useState(false); // user navigated away from today

  // Refresh dateKey + evening state on tab focus AND every 60s
  // BUT only if user hasn't manually navigated to a different day
  useEffect(() => {
    const refresh = () => {
      if (!manualNav) {
        setDateKey((prev) => {
          const now = todayStr();
          return prev !== now ? now : prev;
        });
      }
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
  }, [manualNav]);

  // Derive today/tomorrow from dateKey — single source of truth.
  const today = dateKey;
  const tomorrow = dayAfter(dateKey);
  const realToday = todayStr(); // always the actual current day
  const isViewingPast = dateKey < realToday;
  const isViewingFuture = dateKey > realToday;
  const isViewingToday = dateKey === realToday;

  // Day navigation handlers
  const goToPrevDay = () => { setDateKey(dayBefore(dateKey)); setManualNav(true); };
  // Allow navigating up to 60 days into the future
  const maxFutureDate = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 60);
    return formatLocalDate(d);
  }, []);
  const goToNextDay = () => {
    if (dateKey < maxFutureDate) {
      const next = dayAfter(dateKey);
      setDateKey(next);
      setManualNav(next !== realToday);
    }
  };
  const goToToday = () => { setDateKey(realToday); setManualNav(false); };

  const todayDisplay = new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  // Daily companion — always visible in the header
  const dailyColor = useMemo(() => getColorOfTheDay(dateKey), [dateKey]);
  const companion = useMemo(() => getDailyCompanion(dailyColor), [dailyColor]);

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

  // Companion animation state — multiple reaction types
  const CLICK_REACTIONS = ['companionTap', 'companionSpin', 'companionFlip', 'companionWiggle', 'companionFloat', 'companionGrow'] as const;
  const CLICK_PARTICLES: string[] = ['\u2728', '\u2b50', '\u2764\ufe0f', '\ud83d\udd25', '\ud83c\udf1f', '\ud83d\udcab', '\ud83e\udee7', '\ud83c\udf89'];
  const [companionAnim, setCompanionAnim] = useState<string>('idle');
  const [bubbleFlash, setBubbleFlash] = useState(false);
  const [companionQuoteIdx, setCompanionQuoteIdx] = useState(0);
  const [companionOverride, setCompanionOverride] = useState<string | null>(null);
  const companionClickCount = useRef(0);
  const companionClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track which quote indices have been shown — never repeat until all seen
  const companionSeenIndices = useRef<Set<number>>(new Set([0]));
  // Reset seen indices when companion changes (day navigation)
  const prevCompanionName = useRef(companion.name);
  if (companion.name !== prevCompanionName.current) {
    prevCompanionName.current = companion.name;
    companionSeenIndices.current = new Set([0]);
    setCompanionQuoteIdx(0);
    setCompanionOverride(null);
  }
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; }[]>([]);
  const companionAnimTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const particleCounter = useRef(0);

  // Task completion celebration phrases
  const [celebrationPhrase, setCelebrationPhrase] = useState<string | null>(null);
  const celebrationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const CELEBRATION_PHRASES = [
    'That was thoughtful of you.',
    'Quietly impressive.',
    'You meant that one.',
    'Noticed. And noted.',
    'That took real intention.',
    'Meaningful, not just done.',
    'Something shifted just now.',
    'You chose that. It shows.',
    'Honest work. The best kind.',
    'Less noise in your head now.',
    'That\u2019s the kind that matters.',
    'You didn\u2019t flinch.',
    'Precise. Intentional. Yours.',
    'Worth remembering this one.',
    'The hard part was starting.',
    'You trusted yourself there.',
    'Genuinely well done.',
    'Lighter. You can feel it.',
    'That\u2019s momentum you built.',
    'Small thing. Real weight.',
  ];

  const triggerCompanionAnim = useCallback((type: 'bounce' | 'celebrate') => {
    if (companionAnimTimeout.current) clearTimeout(companionAnimTimeout.current);
    if (type === 'celebrate') {
      setCompanionAnim('companionCelebrate');
      companionAnimTimeout.current = setTimeout(() => setCompanionAnim('idle'), 1200);
    } else {
      // Random click reaction
      const reaction = CLICK_REACTIONS[Math.floor(Math.random() * CLICK_REACTIONS.length)];
      setCompanionAnim(reaction);
      companionAnimTimeout.current = setTimeout(() => setCompanionAnim('idle'), 700);
      // Flash the bubble border
      setBubbleFlash(true);
      setTimeout(() => setBubbleFlash(false), 600);
      // Spawn 2-4 particles
      const count = 2 + Math.floor(Math.random() * 3);
      const newParticles = Array.from({ length: count }, () => ({
        id: ++particleCounter.current,
        emoji: CLICK_PARTICLES[Math.floor(Math.random() * CLICK_PARTICLES.length)],
        x: -15 + Math.random() * 30,
      }));
      setParticles(prev => [...prev, ...newParticles]);
      const ids = new Set(newParticles.map(p => p.id));
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !ids.has(p.id)));
      }, 900);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showCelebrationPhrase = useCallback(() => {
    if (celebrationTimeout.current) clearTimeout(celebrationTimeout.current);
    const phrase = CELEBRATION_PHRASES[Math.floor(Math.random() * CELEBRATION_PHRASES.length)];
    setCelebrationPhrase(phrase);
    celebrationTimeout.current = setTimeout(() => setCelebrationPhrase(null), 2800);
  }, []);

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
    () => entries
      .filter((e) => e.date === today)
      .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)),
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
    const cutoff = formatLocalDate((() => { const d = new Date(dateKey + 'T12:00:00'); d.setDate(d.getDate() + 60); return d; })());
    return entries
      .filter((e) => e.type === 'event' && e.date > today && e.date <= cutoff)
      .sort((a, b) => {
        const dateCmp = a.date.localeCompare(b.date);
        if (dateCmp !== 0) return dateCmp;
        return (a.time ?? '').localeCompare(b.time ?? '');
      });
  }, [entries, today]);

  const todaysCompletedTasks = todayTasks.filter((t) => t.status === 'done');

  // Overdue tasks: incomplete tasks from days before REAL today (not the viewed date)
  // Only shown when viewing today — not when browsing past days
  const overdueTasks = useMemo(
    () => isViewingToday
      ? entries.filter((e) => e.type === 'task' && e.status === 'todo' && e.date < realToday)
      : [],
    [entries, realToday, isViewingToday],
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
        base.movedCount = 0;
      }

      if (resolvedType === 'event') {
        if (parsed.time) base.time = parsed.time;
        else if (newEventTime) {
          const parsedTime = parseTime(newEventTime.trim());
          if (parsedTime) base.time = parsedTime;
        }
        if (parsed.duration) base.duration = parsed.duration;
        if (parsed.endTime) base.timeBlock = parsed.endTime;
      }

      addEntry(base);
      setNewTitle('');
      setNewEventTime('');
      setPlaceholder(getPlaceholder(entryType));
    },
    [newTitle, entryType, newEventTime, today, addEntry],
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
          triggerCompanionAnim('celebrate');
          showCelebrationPhrase();
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

  /* ── Handlers: Reorder entries ──────────────────────────────── */

  const moveEntry = useCallback((entryId: string, direction: 'up' | 'down') => {
    const idx = todayEntries.findIndex(e => e.id === entryId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= todayEntries.length) return;

    // Assign order values to all today's entries, then swap the two
    const newOrder = todayEntries.map((e, i) => ({
      id: e.id,
      updates: { order: i === idx ? swapIdx : i === swapIdx ? idx : i },
    }));
    batchUpdateEntries(newOrder);
  }, [todayEntries, batchUpdateEntries]);

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

  // Persistent snooze: check localStorage for "don't show today" or "remind later"
  const debriefSnoozed = (() => {
    try {
      const raw = localStorage.getItem('debrief-snooze');
      if (!raw) return false;
      const { until } = JSON.parse(raw);
      return Date.now() < until;
    } catch { return false; }
  })();
  const debriefHidden = (debriefDismissed || debriefSnoozed || todayDebriefExists) && !redoDebrief;

  const snoozeDebrief = (hours: number) => {
    localStorage.setItem('debrief-snooze', JSON.stringify({ until: Date.now() + hours * 3600_000 }));
    setDebriefDismissed(true);
    setDebriefOverlayOpen(false);
  };
  const dismissDebriefToday = () => {
    // Dismiss until 5am tomorrow (covers the rest of the day)
    const tomorrow5am = new Date();
    tomorrow5am.setDate(tomorrow5am.getDate() + 1);
    tomorrow5am.setHours(5, 0, 0, 0);
    localStorage.setItem('debrief-snooze', JSON.stringify({ until: tomorrow5am.getTime() }));
    setDebriefDismissed(true);
    setDebriefOverlayOpen(false);
  };

  // Debrief is available when: past day (always) OR evening OR manually triggered — AND not dismissed/completed
  // ALSO requires at least 1 entry for the day — a new user with 0 tasks shouldn't be asked "how was your plan"
  const hasDayActivity = todayEntries.length > 0;
  const debriefAvailable = !debriefHidden && hasDayActivity && (isViewingPast || isEveningTime || showDebriefEarly);

  // Reset debrief UI state when the date rolls over
  useEffect(() => {
    setDebriefDismissed(false);
    setRedoDebrief(false);
    setShowDebriefEarly(false);
    setDebriefOverlayOpen(false);
  }, [dateKey]);

  // Auto-open debrief overlay when it becomes available (6pm or manual trigger)
  // Don't auto-open when browsing past days — let user click the button
  useEffect(() => {
    if (debriefAvailable && !debriefOverlayOpen && isViewingToday) {
      setDebriefOverlayOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debriefAvailable, isViewingToday]);

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
      {/* ── Walkthrough for new users ─────────────────────────────── */}
      {isNewUser && (
        <Walkthrough onComplete={completeWalkthrough} />
      )}

      {/* ── Task completion celebration phrase ────────────────────── */}
      {celebrationPhrase && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] pointer-events-none"
          style={{ animation: 'celebrationPhrase 2.8s ease-out forwards' }}
        >
          <p
            className="font-display italic text-3xl sm:text-4xl text-center px-8 py-4 whitespace-nowrap"
            style={{
              color: 'var(--color-primary)',
              textShadow: '0 0 24px var(--color-glow), 0 2px 8px rgba(0,0,0,0.1)',
              filter: 'drop-shadow(0 0 12px var(--color-glow))',
            }}
          >
            {celebrationPhrase}
          </p>
        </div>
      )}

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
                    placeholder={planTarget === 'today' ? 'Today\'s priority...' : 'Tomorrow\'s priority...'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setDebriefOverlayOpen(false); }}>
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

            {/* Snooze / dismiss options */}
            <div className="mt-6 pt-4 border-t border-wood-light/15 flex items-center justify-center gap-4 text-sm font-body">
              <button
                onClick={() => snoozeDebrief(2)}
                className="text-pencil/60 hover:text-ink transition-colors"
              >
                Remind me in 2 hours
              </button>
              <span className="text-pencil/20">|</span>
              <button
                onClick={dismissDebriefToday}
                className="text-pencil/60 hover:text-ink transition-colors"
              >
                Skip tonight
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── Page ────────────────────────────────────────────────────── */}

      <div className="flex-1 overflow-y-auto bg-paper">

        {/* ── Focused Feed: single-column layout ──────────────────── */}
        <div className={`mx-auto px-4 sm:px-6 py-6 transition-all duration-500 ease-out ${
          focusMode ? 'max-w-2xl' : 'max-w-3xl'
        }`}>

          {/* ── Header: date + companion + progress ring ────────── */}
          {!focusMode ? (
            <header className="mb-6">
              {/* Main header row */}
              <div className="flex items-start justify-between gap-4">
                {/* Left: date nav + greeting */}
                <div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={goToPrevDay}
                      className="flex-shrink-0 p-1 -ml-1 rounded-lg text-pencil/40 hover:text-ink hover:bg-surface-light transition-all"
                    >
                      <span className="material-symbols-outlined text-xl sm:text-2xl">chevron_left</span>
                    </button>
                    <h1 className="font-display italic text-ink leading-tight text-lg sm:text-xl md:text-2xl whitespace-nowrap">
                      {todayDisplay}
                    </h1>
                    <button
                      onClick={goToNextDay}
                      disabled={dateKey >= maxFutureDate}
                      className={`flex-shrink-0 p-1 rounded-lg transition-all ${
                        dateKey >= maxFutureDate ? 'text-pencil/15 cursor-default' : 'text-pencil/40 hover:text-ink hover:bg-surface-light'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl sm:text-2xl">chevron_right</span>
                    </button>
                    {!isViewingToday && (
                      <button
                        onClick={goToToday}
                        className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary transition-all"
                      >
                        Today
                      </button>
                    )}
                  </div>
                  <span className="font-body text-xs sm:text-sm text-pencil/50 mt-0.5 block ml-1">
                    {isViewingPast ? 'Looking back' : isViewingFuture ? 'Looking ahead' : `Good ${getGreeting()}`}
                  </span>
                </div>

                {/* Right: progress ring + companion + actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {totalTaskCount > 0 && (
                    <div className="relative flex items-center justify-center">
                      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
                        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" className="text-wood-light/20" strokeWidth="2.5" />
                        <circle
                          cx="24" cy="24" r="20" fill="none"
                          stroke="var(--color-primary)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${2 * Math.PI * 20 * (1 - completedCount / totalTaskCount)}`}
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                      <span className="absolute font-mono text-[10px] text-ink tabular-nums">
                        {completedCount}/{totalTaskCount}
                      </span>
                    </div>
                  )}

                  {/* Companion — animal with speech bubble (only today) */}
                  {isViewingToday ? (
                    <div
                      className="flex flex-col items-center cursor-pointer relative"
                      onClick={() => {
                        triggerCompanionAnim('bounce');
                        // Track rapid clicks
                        companionClickCount.current += 1;
                        if (companionClickTimer.current) clearTimeout(companionClickTimer.current);
                        companionClickTimer.current = setTimeout(() => { companionClickCount.current = 0; }, 3000);
                        const clicks = companionClickCount.current;

                        // After 6+ rapid clicks → "that's enough, I love you" override
                        if (clicks >= 6) {
                          const enoughLines = [
                            'Okay okay, I love you too. Now go do something.',
                            'You\'re adorable but I\'m running out of things to say.',
                            'I\'m blushing. Stop it. Go be productive.',
                            `— ${companion.name} has left the chat.`,
                            'That tickles. Please. I have a reputation.',
                          ];
                          setCompanionOverride(enoughLines[Math.floor(Math.random() * enoughLines.length)]);
                          companionClickCount.current = 0;
                          setTimeout(() => setCompanionOverride(null), 4000);
                          return;
                        }

                        // Only change quote every 3rd click (roughly)
                        if (clicks % 3 === 0 && companion.messages.length > 1) {
                          setCompanionOverride(null);
                          setCompanionQuoteIdx(prev => {
                            const seen = companionSeenIndices.current;
                            // Build pool of unseen indices (excluding current)
                            const allIndices = Array.from({ length: companion.messages.length }, (_, i) => i);
                            let unseen = allIndices.filter(i => !seen.has(i) && i !== prev);
                            // If everything's been seen, reset the deck (but still skip current)
                            if (unseen.length === 0) {
                              seen.clear();
                              seen.add(prev); // don't immediately repeat the one showing
                              unseen = allIndices.filter(i => i !== prev);
                            }
                            const next = unseen[Math.floor(Math.random() * unseen.length)];
                            seen.add(next);
                            return next;
                          });
                        }
                      }}
                    >
                      {/* Floating particles */}
                      {particles.map(p => (
                        <span
                          key={p.id}
                          className="absolute top-0 pointer-events-none text-sm"
                          style={{
                            left: `calc(50% + ${p.x}px)`,
                            animation: 'companionParticle 0.8s ease-out forwards',
                          }}
                        >
                          {p.emoji}
                        </span>
                      ))}
                      <span
                        className="text-2xl sm:text-3xl mb-1"
                        style={{
                          animation: companionAnim !== 'idle' ? `${companionAnim} 0.7s ease-out` : 'none',
                        }}
                      >
                        {companion.animal}
                      </span>
                      <div className="relative">
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-surface-light border-l border-t border-wood-light/25" />
                        <div
                          className="relative rounded-lg bg-surface-light border border-wood-light/25 px-3 py-2 max-w-[160px] sm:max-w-[240px]"
                          style={{
                            animation: bubbleFlash ? 'bubbleFlash 0.6s ease-out' : 'none',
                          }}
                        >
                          <p className="font-body italic text-sm sm:text-base text-pencil/70 text-center leading-snug">{companionOverride ?? companion.messages[companionQuoteIdx % companion.messages.length]}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setFocusMode(true)}
                      className="p-1.5 rounded-lg text-pencil hover:text-primary hover:bg-primary/5 transition-all"
                      title="Focus mode"
                    >
                      <span className="material-symbols-outlined text-lg">center_focus_strong</span>
                    </button>
                    <button
                      onClick={() => setPlanOverlayOpen(true)}
                      className="p-1.5 rounded-lg text-pencil hover:text-primary hover:bg-primary/5 transition-all"
                      title="Plan"
                    >
                      <span className="material-symbols-outlined text-lg">event_note</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 3: intention input */}
              <div className="mt-3">
                <div className="relative group/input">
                  <input
                    className="w-full bg-transparent border-none p-0 text-lg sm:text-xl font-display text-ink placeholder:text-pencil/25 focus:ring-0 focus:outline-none italic"
                    placeholder="What's on your plate?"
                    type="text"
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                  />
                  <div className="absolute bottom-0 left-0 w-0 h-[2px] group-focus-within/input:w-full transition-all duration-500" style={{ background: 'var(--color-gradient)' }} />
                </div>
              </div>

              {/* Last night's plan bridge — show if yesterday's debrief exists */}
              {(() => {
                const yesterdayStr = dayBefore(dateKey);
                const yesterdayDebrief = debriefs.find(d => d.date === yesterdayStr);
                const tomorrowTasksFromYesterday = entries.filter(e => e.type === 'task' && e.date === today && e.status === 'todo');
                if (!yesterdayDebrief || !isViewingToday || tomorrowTasksFromYesterday.length === 0) return null;
                return (
                  <div className="mt-4 p-4 rounded-xl bg-surface-light/60 border border-wood-light/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-base text-primary/60">nights_stay</span>
                      <span className="font-mono text-[10px] text-pencil uppercase tracking-[0.15em]">From last night&rsquo;s debrief</span>
                    </div>
                    {yesterdayDebrief.reflection && (
                      <p className="font-body text-sm text-ink/60 italic mb-2">&ldquo;{yesterdayDebrief.reflection}&rdquo;</p>
                    )}
                    <p className="font-body text-sm text-ink/70">
                      You planned <span className="font-semibold">{tomorrowTasksFromYesterday.length}</span> task{tomorrowTasksFromYesterday.length !== 1 ? 's' : ''} for today.
                      {yesterdayDebrief.planRealism >= 4 && ' Yesterday felt ambitious \u2014 maybe start with your top 3.'}
                      {yesterdayDebrief.planRealism <= 2 && ' Yesterday was light \u2014 you might have room for more.'}
                    </p>
                  </div>
                );
              })()}
            </header>
          ) : (
            /* Focus mode header */
            <header className="mb-6 relative">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <button onClick={goToPrevDay} className="text-pencil/30 hover:text-pencil/60 transition-colors p-0.5">
                    <span className="material-symbols-outlined text-xl">chevron_left</span>
                  </button>
                  <h1 className="font-display italic text-ink leading-tight text-2xl">{todayDisplay}</h1>
                  <button
                    onClick={goToNextDay}
                    disabled={dateKey >= maxFutureDate}
                    className={`p-0.5 transition-colors ${dateKey >= maxFutureDate ? 'text-pencil/10 cursor-default' : 'text-pencil/30 hover:text-pencil/60'}`}
                  >
                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                  </button>
                </div>
                {!isViewingToday && (
                  <button onClick={goToToday} className="mt-1 text-xs font-mono text-primary/60 hover:text-primary transition-colors uppercase tracking-wider">
                    Back to today
                  </button>
                )}
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
                <span className="material-symbols-outlined text-[16px]">close_fullscreen</span>
              </button>
            </header>
          )}

          {/* Day Recovery */}
          {!focusMode && showDayRecovery && (
            <div className="mb-5">
              <DayRecovery entries={entries} onUpdateEntry={updateEntry} onDismiss={() => setShowDayRecovery(false)} />
            </div>
          )}
          {!focusMode && !showDayRecovery && todayTasks.length > 0 && (
            <button
              onClick={() => setShowDayRecovery(true)}
              className="mb-3 font-mono text-[10px] text-pencil/50 hover:text-primary uppercase tracking-widest transition-colors"
            >
              Reset My Day
            </button>
          )}

          {/* Capacity Warning */}
          {!focusMode && capacityWarning && (
            <div className="mb-5 bg-bronze/8 border border-bronze/15 rounded-xl px-5 py-4 text-base font-body text-ink/80">
              <span className="font-semibold">{capacityWarning.count} tasks</span>{' '}
              (~{capacityWarning.hours}hrs) today. Focus tip: start with just 1.
            </div>
          )}

          {/* ── Overdue Tasks ─────────────────────────────────── */}
          {!focusMode && overdueTasks.length > 0 && (
            <div className="mb-5 bg-surface-light/60 border border-wood-light/20 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
                onClick={() => setOverdueExpanded(v => !v)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-pencil text-xl">history</span>
                  <span className="font-body text-lg text-ink">
                    <span className="font-semibold">{overdueTasks.length}</span> overdue
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); rescheduleAll(); }}
                    className="text-xs font-mono text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-full transition-colors uppercase tracking-wider"
                  >
                    &rarr; Today
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); parkAll(); }}
                    className="text-xs font-mono text-pencil hover:text-ink bg-wood-light/20 hover:bg-wood-light/30 px-3 py-1.5 rounded-full transition-colors uppercase tracking-wider"
                  >
                    &rarr; Later
                  </button>
                  <span className={`material-symbols-outlined text-pencil text-lg transition-transform ${overdueExpanded ? '' : '-rotate-90'}`}>
                    expand_more
                  </span>
                </div>
              </div>
              {overdueExpanded && (
                <div className="px-5 pb-4 space-y-1">
                  {overdueTasks.map(task => (
                    <div key={task.id} className="group/ot flex items-center gap-3 py-2 px-3 -mx-1 rounded-lg hover:bg-surface-light transition-colors">
                      <span className="inline-block size-2.5 rounded-full bg-pencil/30 flex-shrink-0" />
                      <span className="flex-1 font-body text-base text-ink truncate">{task.title}</span>
                      <span className="font-mono text-[11px] text-pencil/50 flex-shrink-0">
                        {new Date(task.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover/ot:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => rescheduleOne(task.id)} className="text-primary hover:text-primary/80 transition-colors" title="Move to today">
                          <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </button>
                        <button onClick={() => dismissOverdue(task.id)} className="text-pencil hover:text-sage transition-colors" title="Mark done">
                          <span className="material-symbols-outlined text-lg">check</span>
                        </button>
                        <button onClick={() => deleteEntry(task.id)} className="text-pencil hover:text-pencil/80 transition-colors" title="Delete">
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Add new entry \u2014 prominent at top ────────────── */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-2">
              {TYPE_PILLS.map((pill) => (
                <button
                  key={pill.type}
                  onClick={() => setEntryType(pill.type)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all ${
                    entryType === pill.type
                      ? 'bg-primary/12 text-primary font-medium border border-primary/25'
                      : 'text-pencil hover:bg-surface-light border border-transparent'
                  }`}
                >
                  <span className="text-base">{pill.symbol}</span>
                  {pill.label}
                </button>
              ))}
              <button
                onClick={() => setShowSignifierHelp((v) => !v)}
                className="ml-auto font-mono text-[10px] text-pencil/40 hover:text-primary transition-colors uppercase tracking-widest"
              >
                Key
              </button>
            </div>

            {showSignifierHelp && (
              <div className="mb-3 px-4 py-3 bg-surface-light border border-wood-light/15 rounded-lg">
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

            <div className="flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl bg-surface-light border border-wood-light/20 shadow-sm transition-all focus-within:border-primary/30 focus-within:shadow-md">
              <span className="material-symbols-outlined text-lg sm:text-xl text-primary/60">add</span>
              <input
                ref={newInputRef}
                className="flex-1 min-w-0 bg-transparent border-none p-0 text-base sm:text-lg font-body text-ink placeholder:text-pencil/35 focus:ring-0 focus:outline-none"
                placeholder={placeholder}
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={handleAddEntry}
              />
              {entryType === 'event' && (
                <input
                  type="text"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  placeholder="7pm"
                  className="font-mono text-sm text-ink bg-paper border border-wood-light/20 rounded-lg px-2.5 py-1.5 w-20 focus:outline-none focus:border-primary/30 flex-shrink-0 text-center"
                  onKeyDown={handleAddEntry}
                />
              )}
            </div>
          </div>

          {/* ── Task list \u2014 big cards ──────────────────────── */}
          {todayEntries.length === 0 && (
            <p className="text-pencil/40 font-body text-base italic py-10 text-center">
              No entries yet. Start typing above.
            </p>
          )}

          <div className="space-y-1.5">
            {todayEntries.map((entry, entryIdx) => {
              const isEditing = editingEntryId === entry.id;
              const isDone = entry.type === 'task' && entry.status === 'done';
              const isCancelled = entry.type === 'task' && entry.status === 'cancelled';
              const isInactive = isDone || isCancelled;
              const isTask = entry.type === 'task';
              const isNote = entry.type === 'note';
              const isEvent = entry.type === 'event';

              return (
                <div key={entry.id} className={`group/entry rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all ${
                  isInactive ? 'opacity-50 bg-transparent' : 'bg-surface-light/40 hover:bg-surface-light/80'
                } ${isNote ? 'border-l-3 border-pencil/15' : ''}`}>
                  <div className="flex items-center gap-2.5 sm:gap-3.5">
                    {/* Checkbox / bullet */}
                    {isTask ? (
                      <button
                        onClick={(e) => isCancelled
                          ? updateEntry(entry.id, { status: 'todo' })
                          : handleToggleTask(entry.id, e.currentTarget as HTMLElement)
                        }
                        className={`flex-shrink-0 focus:outline-none rounded-md sm:rounded-lg transition-all flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 border-[1.5px] sm:border-2 ${
                          isDone
                            ? 'bg-primary border-primary text-white'
                            : isCancelled
                              ? 'border-pencil/20 text-tension/60 hover:border-primary/40 hover:text-primary/60'
                              : 'border-pencil/25 hover:border-primary/50 hover:bg-primary/5'
                        }`}
                        title={isDone ? 'Mark as todo' : isCancelled ? 'Restore task' : 'Mark as done'}
                      >
                        {isDone && <span className="material-symbols-outlined text-sm sm:text-lg">check</span>}
                        {isCancelled && <span className="material-symbols-outlined text-sm sm:text-lg">close</span>}
                      </button>
                    ) : (
                      <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
                        {isEvent ? (
                          <span className="inline-flex items-center justify-center size-4 sm:size-5 rounded-full border-[1.5px] sm:border-2 border-primary/50" />
                        ) : (
                          <span className="inline-block w-4 sm:w-5 h-[2px] sm:h-[2.5px] bg-ink/25 rounded-full" />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          ref={editInputRef}
                          className="w-full bg-transparent border-none p-0 text-base sm:text-lg font-body text-ink focus:ring-0 focus:outline-none"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          onBlur={commitEdit}
                        />
                      ) : (
                        <button
                          className={`text-left text-base sm:text-lg leading-snug font-body transition-colors w-full ${
                            isCancelled ? 'line-through decoration-tension/40 text-ink/35'
                              : isDone ? 'line-through decoration-pencil/20 text-ink/45'
                              : isNote ? 'text-ink/65 italic'
                              : 'text-ink'
                          }`}
                          onDoubleClick={() => startEditing(entry.id, entry.title)}
                          onClick={(e) => { if (isTask && !isCancelled) handleToggleTask(entry.id, e.currentTarget as HTMLElement); }}
                        >
                          {entry.title}
                        </button>
                      )}
                      {/* Meta row */}
                      <div className="flex items-center gap-2 mt-0.5">
                        {isNote && !isEditing && (
                          <span className="font-mono text-[10px] text-pencil/40 uppercase tracking-widest">note</span>
                        )}
                        {!isEditing && isEvent && entry.time && (
                          <span className="font-mono text-xs text-primary/70 bg-primary/8 px-2 py-0.5 rounded-md">{entry.time}</span>
                        )}
                        {!isEditing && isTask && entry.timeBlock && !isInactive && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateEntry(entry.id, { timeBlock: undefined }); }}
                            className="font-mono text-xs text-primary/70 bg-primary/8 px-2 py-0.5 rounded-md hover:bg-primary/15 hover:line-through transition-all"
                            title="Click to unpin from time"
                          >
                            {entry.timeBlock}
                          </button>
                        )}
                        {!isEditing && isTask && (entry.movedCount ?? 0) > 0 && (
                          <span className="text-[10px] font-mono text-tension/60" title={`Rescheduled ${entry.movedCount} time(s)`}>
                            ↻{entry.movedCount}
                          </span>
                        )}
                        {!isEditing && entry.tags && entry.tags.length > 0 && (
                          <span className="font-mono text-[10px] text-pencil/50 bg-wood-light/15 px-1.5 py-0.5 rounded">
                            {entry.tags[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions \u2014 visible on hover */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover/entry:opacity-100 transition-opacity flex-shrink-0">
                        {/* Reorder arrows */}
                        <div className="flex flex-col -my-1 mr-1">
                          <button
                            onClick={() => moveEntry(entry.id, 'up')}
                            disabled={entryIdx === 0}
                            className="text-pencil/40 hover:text-primary disabled:opacity-20 disabled:cursor-default transition-colors p-0.5 leading-none"
                          >
                            <span className="material-symbols-outlined text-[16px]">keyboard_arrow_up</span>
                          </button>
                          <button
                            onClick={() => moveEntry(entry.id, 'down')}
                            disabled={entryIdx === todayEntries.length - 1}
                            className="text-pencil/40 hover:text-primary disabled:opacity-20 disabled:cursor-default transition-colors p-0.5 leading-none"
                          >
                            <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                          </button>
                        </div>
                        {isTask && !isInactive && (
                          <button onClick={() => setStuckTask(entry)} className="font-mono text-[10px] text-pencil hover:text-primary bg-surface-light hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors uppercase tracking-wider">
                            Unblock
                          </button>
                        )}
                        {isTask && !isInactive && (
                          <button onClick={() => updateEntry(entry.id, { status: 'cancelled' })} className="text-pencil hover:text-tension transition-colors p-1">
                            <span className="material-symbols-outlined text-lg">block</span>
                          </button>
                        )}
                        {isTask && !isInactive && (
                          <button onClick={() => updateEntry(entry.id, { date: tomorrow, movedCount: (entry.movedCount ?? 0) + 1 })} className="text-pencil hover:text-primary transition-colors p-1">
                            <span className="material-symbols-outlined text-lg">east</span>
                          </button>
                        )}
                        <button onClick={() => deleteEntry(entry.id)} className="text-pencil hover:text-tension transition-colors p-1">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Cancel note */}
                  {isCancelled && (
                    <div className="ml-9 mt-1">
                      <input
                        className="w-full bg-transparent border-none p-0 text-sm font-mono text-pencil/50 placeholder:text-pencil/25 focus:ring-0 focus:outline-none italic"
                        placeholder="note (optional)"
                        value={entry.notes ?? ''}
                        onChange={(e) => updateEntry(entry.id, { notes: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Expandable sections below tasks ───────────────── */}
          {!focusMode && (
            <div className="mt-8 space-y-3">

              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <details open className="group/section rounded-xl bg-surface-light/40 border border-wood-light/15 overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary/60 text-xl">event</span>
                      <span className="font-body text-base font-medium text-ink">Upcoming</span>
                      <span className="font-mono text-xs text-pencil/50 tabular-nums">{upcomingEvents.length}</span>
                    </div>
                    <span className="material-symbols-outlined text-pencil text-lg transition-transform group-open/section:rotate-180">expand_more</span>
                  </summary>
                  <div className="px-5 pb-4 space-y-2">
                    {upcomingEvents.slice(0, 12).map((ev) => (
                      <div key={ev.id} className="group/ev flex items-center gap-3">
                        <span className="font-mono text-xs text-primary/60 whitespace-nowrap min-w-[80px]">
                          {formatEventDate(ev.date, today, tomorrow)}
                          {ev.time && ` ${ev.time}`}
                        </span>
                        {editingEntryId === ev.id ? (
                          <input
                            ref={editInputRef}
                            className="flex-1 font-body text-base text-ink bg-transparent border-b border-primary/30 outline-none py-0.5"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && editingValue.trim()) {
                                updateEntry(ev.id, { title: editingValue.trim() });
                                setEditingEntryId(null);
                              }
                              if (e.key === 'Escape') setEditingEntryId(null);
                            }}
                            onBlur={() => {
                              if (editingValue.trim()) updateEntry(ev.id, { title: editingValue.trim() });
                              setEditingEntryId(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span
                            className="flex-1 font-body text-base text-ink/80 cursor-text"
                            onClick={() => { setEditingEntryId(ev.id); setEditingValue(ev.title); }}
                          >
                            {ev.title}
                          </span>
                        )}
                        {/* Action buttons — visible on hover */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/ev:opacity-100 transition-opacity">
                          <button
                            onClick={() => { updateEntry(ev.id, { date: realToday, type: 'task', status: 'todo', section: undefined, timeBlock: undefined, duration: undefined }); }}
                            className="p-1 rounded text-pencil/40 hover:text-primary hover:bg-primary/5 transition-colors"
                            title="Move to today"
                          >
                            <span className="material-symbols-outlined text-sm">move_item</span>
                          </button>
                          <button
                            onClick={() => deleteEntry(ev.id)}
                            className="p-1 rounded text-pencil/40 hover:text-red-400 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Habits */}
              {habits.length > 0 && (
                <details open className="group/section rounded-xl bg-surface-light/40 border border-wood-light/15 overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary/60 text-xl">show_chart</span>
                      <span className="font-body text-base font-medium text-ink">Habits</span>
                    </div>
                    <span className="material-symbols-outlined text-pencil text-lg transition-transform group-open/section:rotate-180">expand_more</span>
                  </summary>
                  <div className="px-5 pb-4 flex flex-wrap gap-2.5">
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
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                            isCompleted
                              ? `${borderColor} ${bgColor}/8`
                              : 'border-pencil/15 hover:border-pencil/30'
                          }`}
                        >
                          <div className={`size-5 rounded-md flex items-center justify-center transition-all ${
                            isCompleted ? `${bgColor} text-white` : 'border border-pencil/25'
                          }`}>
                            {isCompleted && <span className="material-symbols-outlined text-sm">check</span>}
                          </div>
                          <span className={`text-sm font-body ${isCompleted ? 'text-ink' : 'text-pencil'}`}>
                            {habit.name}
                          </span>
                          {habit.streak > 0 && (
                            <span className="text-[10px] font-mono text-pencil/40">{habit.streak}d</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </details>
              )}

              {/* Wins */}
              {(todaysCompletedTasks.length > 0 || todaysJournalWins.length > 0) && (
                <details className="group/section rounded-xl bg-surface-light/40 border border-wood-light/15 overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary/60 text-xl">emoji_events</span>
                      <span className="font-body text-base font-medium text-ink">Wins</span>
                      <span className="font-mono text-xs text-pencil/50 tabular-nums">{todaysCompletedTasks.length + todaysJournalWins.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.preventDefault(); fireConfetti(); }} className="text-primary/50 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">celebration</span>
                      </button>
                      <span className="material-symbols-outlined text-pencil text-lg transition-transform group-open/section:rotate-180">expand_more</span>
                    </div>
                  </summary>
                  <div className="px-5 pb-4">
                    <ul className="space-y-1.5">
                      {todaysCompletedTasks.map((task) => (
                        <li key={task.id} className="flex items-center gap-2.5 text-base font-body text-ink/50">
                          <span className="text-sage text-base leading-none">&#10003;</span>
                          <span className="truncate">{task.title}</span>
                        </li>
                      ))}
                      {todaysJournalWins.map((win, i) => (
                        <li key={`jwin-${i}`} className="flex items-center gap-2.5 text-base font-body text-primary/50">
                          <span className="material-symbols-outlined text-base">star</span>
                          <span className="truncate italic">{win}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              )}

              {/* Debrief */}
              {todayDebriefExists && !redoDebrief ? (
                <div className="rounded-xl bg-sage/5 border border-sage/15 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-sage text-xl">check_circle</span>
                    <span className="font-body text-base text-ink">Debrief saved</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setRedoDebrief(true); setDebriefOverlayOpen(true); }}
                      className="text-sm font-body text-pencil hover:text-ink underline underline-offset-2 decoration-pencil/30 transition-colors"
                    >
                      Redo
                    </button>
                    <button
                      onClick={() => deleteDebrief(dateKey)}
                      className="text-sm font-body text-tension/50 hover:text-tension underline underline-offset-2 decoration-tension/20 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setShowDebriefEarly(true); setDebriefOverlayOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-surface-light/40 border border-wood-light/15 text-base font-body text-ink hover:text-primary hover:border-primary/20 transition-all"
                >
                  <span className="material-symbols-outlined text-xl text-primary/50">rate_review</span>
                  {isEveningTime ? 'Day Debrief' : 'Start Debrief'}
                </button>
              )}

              {/* Journal Exercises */}
              <details className="group/section rounded-xl bg-surface-light/40 border border-wood-light/15 overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary/60 text-xl">self_improvement</span>
                    <span className="font-body text-base font-medium text-ink">Journal Exercises</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-primary/40 uppercase tracking-wider">
                      {getTimeLabel()} picks
                    </span>
                    <span className="material-symbols-outlined text-pencil text-lg transition-transform group-open/section:rotate-180">expand_more</span>
                  </div>
                </summary>
                <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                          className={`text-left p-3.5 rounded-lg border transition-all ${
                            isSuggested
                              ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                              : 'border-wood-light/10 hover:bg-surface-light hover:border-primary/15'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`material-symbols-outlined text-xl mt-0.5 ${isSuggested ? 'text-primary/60' : 'text-ink/30'}`}>{method.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-body text-sm font-medium text-ink">{method.name}</span>
                                {isSuggested && (
                                  <span className="font-mono text-[8px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full uppercase tracking-widest">now</span>
                                )}
                              </div>
                              <p className="font-body text-xs text-pencil leading-relaxed line-clamp-2">{method.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>
              </details>

              {/* Journal Entries */}
              {todaysJournalEntries.length > 0 && (
                <details className="group/section rounded-xl bg-surface-light/40 border border-wood-light/15 overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary/60 text-xl">menu_book</span>
                      <span className="font-body text-base font-medium text-ink">Journal Entries</span>
                      <span className="font-mono text-xs text-pencil/50 tabular-nums">{todaysJournalEntries.length}</span>
                    </div>
                    <span className="material-symbols-outlined text-pencil text-lg transition-transform group-open/section:rotate-180">expand_more</span>
                  </summary>
                  <div className="px-5 pb-4 space-y-2">
                    {todaysJournalEntries.map((entry) => (
                      <Link key={entry.id} to={`/journal/${entry.id}`} className="block p-3.5 rounded-lg border border-wood-light/10 hover:border-primary/15 hover:bg-surface-light/60 transition-all">
                        {entry.title && <p className="font-body text-base font-medium text-ink/70 mb-0.5 truncate">{entry.title}</p>}
                        <p className="text-sm font-body text-ink/45 italic line-clamp-2">{entry.content}</p>
                        {entry.method && (
                          <span className="inline-block mt-1.5 font-mono text-[9px] text-primary/60 bg-primary/8 px-1.5 py-0.5 rounded uppercase tracking-widest">{entry.method}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </details>
              )}

              {/* Quick link to Flow */}
              <Link
                to="/flow"
                className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-surface-light/40 border border-wood-light/15 text-base font-body text-ink hover:text-primary hover:border-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-xl text-primary/50">calendar_view_day</span>
                Flow View
                <span className="material-symbols-outlined text-base text-pencil/30 ml-auto">arrow_forward</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
