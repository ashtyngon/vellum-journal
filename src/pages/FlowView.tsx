import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { todayStr, formatLocalDate, dateStr } from '../lib/dateUtils';
import { getColorOfTheDay, getDailyCompanion } from '../lib/colorOfTheDay';
import type { ReactiveMessages } from '../lib/colorOfTheDay';
import { checkAchievements, getAchievementDef } from '../lib/achievements';
import type { AchievementContext } from '../lib/achievements';
import CompanionPanel from '../components/CompanionPanel';
import type { CompanionExpression, SectionProgress } from '../components/CompanionPanel';
import WeekStrip from '../components/WeekStrip';
import CleanLeafCelebration from '../components/CleanLeafCelebration';
import {
  SectionHeader,
  SectionBody,
  ParkingLotItem,
  type DaySection,
  type DragPayload,
  uid,
  getSectionForTime,
  loadSections,
  saveSections,
  encodeDrag,
  decodeDrag,
} from '../components/flow';
import { parseNaturalEntry } from '../lib/nlParser';
import { celebrateTask } from '../components/TaskCelebration';
import type { RapidLogEntry } from '../context/AppContext';

/* ══════════════════════════════════════════════════════════════════════════
   FlowView — Single-day view with companion sidebar and week strip nav.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Mobile companion floating avatar ────────────────────────────────────── */

function MobileCompanionAvatar({
  companion,
  expression,
  onClick,
}: {
  companion: { animal: string; name: string };
  expression: CompanionExpression;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const scaleClass =
    expression === 'happy' ? 'scale-110' :
    expression === 'excited' ? 'scale-115' : '';

  return (
    <button
      onClick={onClick}
      className={`md:hidden fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-surface-light shadow-lifted border border-wood-light/40 overflow-hidden transition-transform duration-300 ${scaleClass}`}
      aria-label={`Open ${companion.name} panel`}
    >
      {!imgError ? (
        <img
          src={`/animals/${companion.animal}.png`}
          alt={companion.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="material-symbols-outlined text-2xl text-pencil/40">pets</span>
      )}
    </button>
  );
}

/* ── Main FlowView ───────────────────────────────────────────────────────── */

export default function FlowView() {
  const {
    entries,
    addEntry,
    updateEntry,
    batchUpdateEntries,
    deleteEntry,
    habits,
    toggleHabit,
    achievements,
    totalActiveDays,
    lastActiveDate,
    unlockAchievement,
    markAchievementSeen,
    recordActiveDay,
    journalEntries,
    collections,
    debriefs,
  } = useApp();

  /* ── Date navigation state ───────────────────────────────────────────── */

  const [currentDate, setCurrentDate] = useState(todayStr);

  // Refresh today on tab focus / midnight rollover
  useEffect(() => {
    const refresh = () => {
      const now = todayStr();
      setCurrentDate(prev => {
        // Only auto-snap if user was viewing today
        if (prev === todayStr()) return now;
        return prev;
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

  /* ── Daily color & companion ─────────────────────────────────────────── */

  const dailyColor = useMemo(() => getColorOfTheDay(currentDate), [currentDate]);
  const companion = useMemo(() => getDailyCompanion(dailyColor), [dailyColor]);

  /* ── Companion expression system ─────────────────────────────────────── */

  const [companionExpression, setCompanionExpression] = useState<CompanionExpression>('neutral');
  const [reactiveState, setReactiveState] = useState<keyof ReactiveMessages>('morning_greeting');
  const sessionTasksRef = useRef(0); // tasks completed in this session
  const expressionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set initial reactive state based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setReactiveState('morning_greeting');
    else if (hour < 17) setReactiveState('momentum');
    else setReactiveState('morning_greeting');
  }, []);

  // Check for return after absence
  useEffect(() => {
    if (lastActiveDate) {
      const last = new Date(lastActiveDate + 'T12:00:00');
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 3) {
        setReactiveState('return_after_absence');
      }
    }
  }, [lastActiveDate]);

  const flashExpression = useCallback((expr: CompanionExpression, durationMs: number) => {
    if (expressionTimerRef.current) clearTimeout(expressionTimerRef.current);
    setCompanionExpression(expr);
    expressionTimerRef.current = setTimeout(() => {
      setCompanionExpression('neutral');
      expressionTimerRef.current = null;
    }, durationMs);
  }, []);

  /* ── Sections ────────────────────────────────────────────────────────── */

  const [sections, setSections] = useState<DaySection[]>(loadSections);

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

  // Section collapse state (persisted)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('flowview-section-collapsed');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {};
  });

  const toggleCollapse = useCallback((sectionId: string) => {
    setCollapsed(prev => {
      const currentlyCollapsed = prev[sectionId] ?? false;
      const next = { ...prev, [sectionId]: !currentlyCollapsed };
      try { localStorage.setItem('flowview-section-collapsed', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Visible sections for current date (weekday filtering)
  const visibleSections = useMemo(() => {
    const d = new Date(currentDate + 'T12:00:00');
    const dayOfWeek = d.getDay(); // 0=Sun..6=Sat
    return sections.filter(s =>
      !s.pinnedDays || s.pinnedDays.length === 0 || s.pinnedDays.includes(dayOfWeek),
    );
  }, [sections, currentDate]);

  /* ── Single-day entry filtering ──────────────────────────────────────── */

  const dayEntries = useMemo(
    () => entries.filter(e => e.date === currentDate && e.type !== 'note'),
    [entries, currentDate],
  );

  const tasksBySection = useMemo(() => {
    const map: Record<string, RapidLogEntry[]> = {};
    for (const s of visibleSections) map[s.id] = [];

    const tasks = dayEntries.filter(e => e.type === 'task');
    for (const t of tasks) {
      const timeStr = t.timeBlock || t.time;
      const sectionByTime = timeStr ? getSectionForTime(timeStr, visibleSections) : null;
      if (sectionByTime && map[sectionByTime]) {
        map[sectionByTime].push(t);
      } else if (t.section && map[t.section]) {
        map[t.section].push(t);
      } else if (t.section) {
        const firstSection = visibleSections[0];
        if (firstSection) map[firstSection.id].push(t);
      }
      // else: no section, no time -> parking lot
    }

    // Sort: timed tasks first (by time), then by order field
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const aTime = a.timeBlock || a.time;
        const bTime = b.timeBlock || b.time;
        if (aTime && bTime) return aTime.localeCompare(bTime);
        if (aTime) return -1;
        if (bTime) return 1;
        const orderA = a.order ?? Infinity;
        const orderB = b.order ?? Infinity;
        return orderA - orderB;
      });
    }

    return map;
  }, [dayEntries, visibleSections]);

  const eventsBySection = useMemo(() => {
    const map: Record<string, RapidLogEntry[]> = {};
    for (const s of visibleSections) map[s.id] = [];

    const events = dayEntries.filter(e => e.type === 'event');
    for (const ev of events) {
      const sectionId = ev.time ? getSectionForTime(ev.time, visibleSections) : null;
      if (sectionId && map[sectionId]) {
        map[sectionId].push(ev);
      } else {
        const firstSection = visibleSections[0];
        if (firstSection) map[firstSection.id].push(ev);
      }
    }
    return map;
  }, [dayEntries, visibleSections]);

  /* ── Parking lot ─────────────────────────────────────────────────────── */

  const parkingLotEntries = useMemo(() => {
    const today = todayStr();
    return entries.filter(e =>
      e.type === 'task' &&
      !e.timeBlock &&
      !e.section &&
      e.status === 'todo' &&
      (!e.date || e.date <= today),
    );
  }, [entries, currentDate]);

  const [parkingOpen, setParkingOpen] = useState(false);
  const [parkingInput, setParkingInput] = useState('');
  const parkingInputRef = useRef<HTMLInputElement>(null);
  const [parkingDragOver, setParkingDragOver] = useState(false);

  /* ── Section progress for CompanionPanel ─────────────────────────────── */

  const sectionProgress: SectionProgress[] = useMemo(() =>
    visibleSections.map(s => {
      const tasks = tasksBySection[s.id] ?? [];
      const done = tasks.filter(t => t.status === 'done').length;
      const total = tasks.length;
      return {
        name: sectionNames[s.id] ?? s.name,
        status: total === 0
          ? 'not_started' as const
          : done === total
            ? 'complete' as const
            : done > 0
              ? 'in_progress' as const
              : 'not_started' as const,
      };
    }),
  [visibleSections, tasksBySection, sectionNames]);

  const allSectionsComplete = useMemo(() => {
    const sectionsWithTasks = sectionProgress.filter(s => s.status !== 'not_started');
    return sectionsWithTasks.length > 0 && sectionsWithTasks.every(s => s.status === 'complete');
  }, [sectionProgress]);

  /* ── Week completion status for WeekStrip ────────────────────────────── */

  const weekCompletionStatus = useMemo(() => {
    const status: Record<string, 'none' | 'partial' | 'complete'> = {};

    // Calculate the Monday-Sunday range for the current week
    const current = new Date(currentDate + 'T12:00:00');
    const dayOfWeek = current.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    for (let i = 0; i < 7; i++) {
      const d = new Date(current);
      d.setDate(current.getDate() + mondayOffset + i);
      const ds = formatLocalDate(d);

      const dayTasks = entries.filter(e =>
        e.date === ds && e.type === 'task' && (e.section || e.timeBlock),
      );

      if (dayTasks.length === 0) {
        status[ds] = 'none';
      } else {
        const done = dayTasks.filter(t => t.status === 'done').length;
        if (done === dayTasks.length) status[ds] = 'complete';
        else if (done > 0) status[ds] = 'partial';
        else status[ds] = 'none';
      }
    }
    return status;
  }, [entries, currentDate]);

  /* ── Clean Leaf celebration ──────────────────────────────────────────── */

  const [showCleanLeaf, setShowCleanLeaf] = useState(false);
  const cleanLeafShownRef = useRef(false);

  // Count clean sweep days this month
  const cleanSweepDaysThisMonth = useMemo(() => {
    const monthPrefix = currentDate.slice(0, 7); // "YYYY-MM"
    let count = 0;

    // Check each day of the month up to today
    const today = todayStr();
    for (let day = 1; day <= 31; day++) {
      const ds = `${monthPrefix}-${String(day).padStart(2, '0')}`;
      if (ds > today) break;

      const dayTasks = entries.filter(e =>
        e.date === ds && e.type === 'task' && (e.section || e.timeBlock),
      );
      if (dayTasks.length > 0 && dayTasks.every(t => t.status === 'done')) {
        count++;
      }
    }
    return count;
  }, [entries, currentDate]);

  /* ── Achievement tracking ────────────────────────────────────────────── */

  const [achievementQueue, setAchievementQueue] = useState<string[]>([]);

  const latestAchievement = useMemo(() => {
    if (achievements.length === 0) return null;
    const sorted = [...achievements].sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt));
    const def = getAchievementDef(sorted[0].id);
    return def ? { name: def.name, icon: def.icon } : null;
  }, [achievements]);

  const runAchievementCheck = useCallback((ctx: Partial<AchievementContext>) => {
    const totalTasksCompleted = entries.filter(e => e.type === 'task' && e.status === 'done').length;
    const now = new Date();

    const fullCtx: AchievementContext = {
      totalActiveDays,
      todayTasksCompleted: dayEntries.filter(e => e.type === 'task' && e.status === 'done').length,
      todaySessionTasksInARow: sessionTasksRef.current,
      allSectionsComplete,
      sectionJustCompleted: false,
      cleanSweepDaysThisMonth,
      cleanSweepDaysTotal: 0, // simplified — could track across all months
      totalTasksCompleted,
      journalExercisesCompleted: journalEntries.length,
      journalMethodsUsed: new Set(journalEntries.map(j => j.method).filter(Boolean) as string[]),
      hasDebrief: debriefs.length > 0,
      currentHour: now.getHours(),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      daysSinceLastActive: lastActiveDate
        ? Math.floor((now.getTime() - new Date(lastActiveDate + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24))
        : 999,
      parkingLotUsageCount: 0,
      deferredTaskCount: entries.filter(e => e.status === 'deferred').length,
      maxRescheduleCount: Math.max(0, ...entries.map(e => e.movedCount ?? 0)),
      collectionsCreated: collections.length,
      maxCollectionSize: Math.max(0, ...collections.map(c => c.items.length)),
      sectionCompletedInUnder30Min: false,
      allDailyTasksCompletedInUnder2Hours: false,
      ...ctx,
    };

    const unlockedSet = new Set(achievements.map(a => a.id));
    const newlyUnlocked = checkAchievements(fullCtx, unlockedSet);

    for (const id of newlyUnlocked) {
      unlockAchievement(id);
    }

    if (newlyUnlocked.length > 0) {
      setAchievementQueue(prev => [...prev, ...newlyUnlocked]);
    }
  }, [
    totalActiveDays, dayEntries, allSectionsComplete, cleanSweepDaysThisMonth,
    entries, journalEntries, debriefs, lastActiveDate, collections, achievements,
    unlockAchievement,
  ]);

  // Process achievement queue (show toast, then mark seen)
  useEffect(() => {
    if (achievementQueue.length === 0) return;
    const timer = setTimeout(() => {
      const id = achievementQueue[0];
      markAchievementSeen(id);
      setAchievementQueue(prev => prev.slice(1));
    }, 3000);
    return () => clearTimeout(timer);
  }, [achievementQueue, markAchievementSeen]);

  /* ── Bulk selection ──────────────────────────────────────────────────── */

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

  /* ── Drag handlers ───────────────────────────────────────────────────── */

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStartEntry = useCallback((e: React.DragEvent, entryId: string) => {
    setDraggingId(entryId);
    const ids = selectedIds.size > 0 && selectedIds.has(entryId)
      ? Array.from(selectedIds)
      : [entryId];
    const entry = entries.find(en => en.id === entryId);
    const payload: DragPayload = {
      entryId,
      entryIds: ids,
      sourceSection: null,
      sourceDate: entry?.date ?? currentDate,
    };
    e.dataTransfer.setData('application/json', encodeDrag(payload));
    e.dataTransfer.effectAllowed = 'move';

    if (ids.length > 1) {
      const ghost = document.createElement('div');
      ghost.textContent = `${ids.length} tasks`;
      ghost.className = 'fixed -top-[200px] bg-primary text-white text-sm font-mono px-3 py-1.5 rounded-full shadow-lg';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 40, 15);
      setTimeout(() => ghost.remove(), 0);
    }
  }, [selectedIds, entries, currentDate]);

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
    clearSelection();
  }, [clearSelection]);

  /* ── Parking lot actions ─────────────────────────────────────────────── */

  const addParkingLotTask = useCallback(() => {
    const trimmed = parkingInput.trim();
    if (!trimmed) return;

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
        movedCount: 0,
        timeBlock: parsed.time,
      });
    }

    setParkingInput('');
    parkingInputRef.current?.focus();
  }, [parkingInput, addEntry]);

  const scheduleToToday = useCallback((entryId: string) => {
    const now = new Date();
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const autoSection = getSectionForTime(nowTime, sections);
    updateEntry(entryId, {
      date: dateStr(0),
      timeBlock: undefined,
      section: autoSection ?? sections[0]?.id,
    });
  }, [updateEntry, sections]);

  const handleParkingDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setParkingDragOver(true);
  }, []);

  const handleParkingDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setParkingDragOver(false);
    const payload = decodeDrag(e.dataTransfer.getData('application/json'));
    if (payload) {
      batchUpdateEntries(payload.entryIds.map(id => ({
        id,
        updates: { timeBlock: undefined, section: undefined, time: undefined },
      })));
      clearSelection();
    }
  }, [batchUpdateEntries, clearSelection]);

  /* ── Habit auto-population ───────────────────────────────────────────── */

  useEffect(() => {
    if (!habits || habits.length === 0) return;

    for (const habit of habits) {
      // Check if a task with sourceHabit matching this habit already exists for currentDate
      const exists = entries.some(
        e => e.date === currentDate && e.sourceHabit === habit.name,
      );
      if (!exists) {
        addEntry({
          id: uid(),
          type: 'task',
          title: habit.name,
          status: 'todo',
          date: currentDate,
          sourceHabit: habit.name,
          section: sections[0]?.id, // default to first section
          movedCount: 0,
        });
      }
    }
    // Only run when date or habits change — entries intentionally excluded to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, habits]);

  /* ── handleUpdateEntry wrapper (completion triggers) ─────────────────── */

  const handleUpdateEntry = useCallback((id: string, updates: Partial<RapidLogEntry>) => {
    // Call the real updateEntry first
    updateEntry(id, updates);

    // Check for task completion triggers
    if (updates.status === 'done') {
      sessionTasksRef.current += 1;

      // Flash happy expression
      flashExpression('happy', 300);

      // Celebrate with confetti on the task element
      const el = document.querySelector(`[data-entry-id="${id}"]`) as HTMLElement | null;
      if (el) celebrateTask(el);

      // Set reactive state based on session progress
      if (sessionTasksRef.current === 1) {
        setReactiveState('first_task');
      } else if (sessionTasksRef.current >= 3) {
        setReactiveState('momentum');
      }

      // Check section completion on next tick (after state updates)
      setTimeout(() => {
        // Re-check sections — we need fresh data
        const currentTasks = entries.filter(e =>
          e.date === currentDate && e.type === 'task' && (e.section || e.timeBlock),
        );

        // Include the update we just made
        const updatedTasks = currentTasks.map(t =>
          t.id === id ? { ...t, ...updates } : t,
        );

        const allDone = updatedTasks.length > 0 &&
          updatedTasks.every(t => t.status === 'done');

        if (allDone && !cleanLeafShownRef.current) {
          cleanLeafShownRef.current = true;
          flashExpression('excited', 2000);
          setReactiveState('all_done');
          setShowCleanLeaf(true);
          recordActiveDay();
          runAchievementCheck({ allSectionsComplete: true });
        } else {
          // Check if any section just completed
          for (const s of visibleSections) {
            const sectionTasks = updatedTasks.filter(t => {
              const timeStr = t.timeBlock || t.time;
              const sectionByTime = timeStr ? getSectionForTime(timeStr, visibleSections) : null;
              return sectionByTime === s.id || t.section === s.id;
            });

            if (sectionTasks.length > 0 && sectionTasks.every(t => t.status === 'done')) {
              flashExpression('excited', 1000);
              setReactiveState('section_done');
              runAchievementCheck({ sectionJustCompleted: true });
              break;
            }
          }
        }
      }, 50);

      // Record active day and run basic achievement check
      recordActiveDay();
      runAchievementCheck({});
    }
  }, [
    updateEntry, entries, currentDate, visibleSections, flashExpression,
    recordActiveDay, runAchievementCheck,
  ]);

  /* ── Reset clean leaf shown flag when date changes ───────────────────── */

  useEffect(() => {
    cleanLeafShownRef.current = false;
  }, [currentDate]);

  /* ── Mobile companion panel ──────────────────────────────────────────── */

  const [mobileCompanionOpen, setMobileCompanionOpen] = useState(false);

  /* ── Achievement toast display ───────────────────────────────────────── */

  const currentAchievementToast = useMemo(() => {
    if (achievementQueue.length === 0) return null;
    return getAchievementDef(achievementQueue[0]);
  }, [achievementQueue]);

  /* ── Unlocked achievement for CleanLeaf ──────────────────────────────── */

  const cleanLeafAchievement = useMemo(() => {
    if (!showCleanLeaf || achievementQueue.length === 0) return null;
    const def = getAchievementDef(achievementQueue[0]);
    return def ? { name: def.name, icon: def.icon, description: def.description } : null;
  }, [showCleanLeaf, achievementQueue]);

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div
      className="flex h-[calc(100vh-64px)] overflow-hidden bg-paper"
      onDragEnd={handleDragEnd}
    >
      {/* ── Companion Panel — desktop only ──────────────────────────────── */}
      <div className="hidden md:block">
        <CompanionPanel
          companion={companion}
          dailyColor={dailyColor}
          expression={companionExpression}
          reactiveState={reactiveState}
          sectionProgress={sectionProgress}
          achievementCount={achievements.length}
          totalActiveDays={totalActiveDays}
          latestAchievement={latestAchievement}
        />
      </div>

      {/* ── Main content area ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Week Strip */}
        <WeekStrip
          currentDate={currentDate}
          onSelectDate={setCurrentDate}
          completionStatus={weekCompletionStatus}
        />

        {/* Sections (single day, vertical scroll) */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-4 no-scrollbar">
          {visibleSections.map(section => {
            const sectionTasks = tasksBySection[section.id] ?? [];
            const sectionEvents = eventsBySection[section.id] ?? [];
            const isCollapsed = collapsed[section.id] ?? false;
            const name = sectionNames[section.id] ?? section.name;

            return (
              <div
                key={section.id}
                className={`rounded-lg border ${section.accentColor} ${section.color} overflow-hidden`}
              >
                <SectionHeader
                  section={section}
                  customName={name}
                  onRename={n => handleRenameSectionGlobal(section.id, n)}
                  isCollapsed={isCollapsed}
                  onToggleCollapse={() => toggleCollapse(section.id)}
                  onZoom={() => {}} // disabled for v1
                  onUnpinTimes={() => {
                    const timed = sectionTasks.filter(t => !!t.timeBlock);
                    if (timed.length > 0) {
                      batchUpdateEntries(timed.map(t => ({
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
                    date={currentDate}
                    tasks={sectionTasks}
                    events={sectionEvents}
                    onUpdate={handleUpdateEntry}
                    onDelete={deleteEntry}
                    onAdd={addEntry}
                    onBatchUpdate={batchUpdateEntries}
                    draggingId={draggingId}
                    onDragStartEntry={handleDragStartEntry}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    bulkMode={bulkMode}
                  />
                )}
              </div>
            );
          })}

          {/* ── Parking Lot Drawer ──────────────────────────────────────── */}
          <div className="mt-2">
            <button
              onClick={() => setParkingOpen(!parkingOpen)}
              onDragOver={handleParkingDragOver}
              onDragLeave={() => setParkingDragOver(false)}
              onDrop={handleParkingDrop}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                parkingOpen ? 'rounded-b-none border-b-0' : ''
              } ${
                parkingDragOver
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-surface-light/50 border-wood-light/20 hover:bg-surface-light'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-pencil">inventory_2</span>
                <span className="font-mono text-sm text-pencil">Parking Lot</span>
              </div>
              <div className="flex items-center gap-2">
                {parkingLotEntries.length > 0 && (
                  <span className="font-mono text-[12px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                    {parkingLotEntries.length}
                  </span>
                )}
                <span
                  className={`material-symbols-outlined text-[16px] text-pencil transition-transform ${
                    parkingOpen ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </div>
            </button>

            {parkingOpen && (
              <div
                className={`border border-t-0 border-wood-light/20 rounded-b-lg bg-surface-light/30 p-3 space-y-2 ${
                  parkingDragOver ? 'ring-2 ring-primary/20 ring-inset' : ''
                }`}
                onDragOver={handleParkingDragOver}
                onDragLeave={() => setParkingDragOver(false)}
                onDrop={handleParkingDrop}
              >
                {parkingLotEntries.length === 0 && (
                  <p className="text-sm font-handwriting text-pencil/40 italic text-center py-3">
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

                {/* Habits (draggable into sections) */}
                {habits.length > 0 && (
                  <div className="pt-2 border-t border-wood-light/15">
                    <p className="text-[12px] font-mono text-pencil uppercase tracking-widest mb-2">Habits</p>
                    <div className="space-y-1.5">
                      {habits.map(habit => {
                        const isCompleted = habit.completedDates.includes(currentDate);
                        return (
                          <div
                            key={habit.id}
                            draggable
                            onDragStart={e => {
                              const tempId = `habit-${habit.id}-${currentDate}`;
                              const payload: DragPayload = {
                                entryId: tempId,
                                entryIds: [tempId],
                                sourceSection: null,
                                sourceDate: currentDate,
                              };
                              e.dataTransfer.setData('application/json', encodeDrag(payload));
                              e.dataTransfer.effectAllowed = 'copy';
                              e.dataTransfer.setData('text/plain', `habit:${habit.id}:${habit.name}`);
                            }}
                            className={`flex items-center gap-2 p-2 rounded cursor-grab active:cursor-grabbing transition-all hover:bg-sage/10 ${
                              isCompleted ? 'opacity-40' : ''
                            }`}
                          >
                            <button
                              onClick={() => toggleHabit(habit.id, currentDate)}
                              className="shrink-0"
                            >
                              <span
                                className={`material-symbols-outlined text-[16px] ${
                                  isCompleted ? 'text-sage' : 'text-pencil/40 hover:text-primary'
                                }`}
                              >
                                {isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                            </button>
                            <span
                              className={`text-sm font-body ${
                                isCompleted ? 'text-pencil line-through' : 'text-ink'
                              }`}
                            >
                              {habit.name}
                            </span>
                            {habit.streak > 0 && (
                              <span className="text-[13px] font-mono text-pencil/50 ml-auto">
                                {habit.streak}d
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add task input */}
                <div className="flex items-center gap-2 pt-2 border-t border-wood-light/15">
                  <input
                    ref={parkingInputRef}
                    value={parkingInput}
                    onChange={e => setParkingInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addParkingLotTask();
                    }}
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
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile companion floating avatar ────────────────────────────── */}
      <MobileCompanionAvatar
        companion={companion}
        expression={companionExpression}
        onClick={() => setMobileCompanionOpen(true)}
      />

      {/* ── Mobile companion sheet ──────────────────────────────────────── */}
      {mobileCompanionOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/30"
            onClick={() => setMobileCompanionOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-paper rounded-t-2xl shadow-lifted overflow-y-auto">
            <CompanionPanel
              companion={companion}
              dailyColor={dailyColor}
              expression={companionExpression}
              reactiveState={reactiveState}
              sectionProgress={sectionProgress}
              achievementCount={achievements.length}
              totalActiveDays={totalActiveDays}
              latestAchievement={latestAchievement}
            />
          </div>
        </div>
      )}

      {/* ── Clean Leaf Celebration ──────────────────────────────────────── */}
      {showCleanLeaf && (
        <CleanLeafCelebration
          dailyColor={dailyColor}
          companion={companion}
          cleanDayCount={cleanSweepDaysThisMonth}
          unlockedAchievement={cleanLeafAchievement}
          onDismiss={() => setShowCleanLeaf(false)}
        />
      )}

      {/* ── Achievement toast ──────────────────────────────────────────── */}
      {currentAchievementToast && !showCleanLeaf && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className="flex items-center gap-3 bg-surface-light shadow-lifted rounded-xl border border-wood-light/30 px-5 py-3">
            <span className="text-2xl">{currentAchievementToast.icon}</span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-pencil/50">
                Achievement Unlocked
              </p>
              <p className="font-display text-sm text-ink font-semibold">
                {currentAchievementToast.name}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
