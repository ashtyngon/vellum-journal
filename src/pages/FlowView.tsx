import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { todayStr, formatLocalDate, dateStr } from '../lib/dateUtils';
import WeekStrip from '../components/WeekStrip';
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
import { celebrateTask, celebrateSection } from '../components/TaskCelebration';
import type { RapidLogEntry } from '../context/AppContext';

/* ══════════════════════════════════════════════════════════════════════════
   FlowView — Single-day task management with week strip navigation.
   ══════════════════════════════════════════════════════════════════════════ */

export default function FlowView() {
  const {
    entries,
    addEntry,
    updateEntry,
    batchUpdateEntries,
    deleteEntry,
    habits,
    toggleHabit,
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

  /* (companion panel removed — lives on DailyLeaf only) */

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

  /* ── handleUpdateEntry wrapper (completion celebrations) ─────────────── */

  const handleUpdateEntry = useCallback((id: string, updates: Partial<RapidLogEntry>) => {
    updateEntry(id, updates);

    if (updates.status === 'done') {
      // Celebrate with confetti on the task element
      const el = document.querySelector(`[data-entry-id="${id}"]`) as HTMLElement | null;
      if (el) celebrateTask(el);

      // Check section completion on next tick (after state updates)
      setTimeout(() => {
        const currentTasks = entries.filter(e =>
          e.date === currentDate && e.type === 'task' && (e.section || e.timeBlock),
        );
        const updatedTasks = currentTasks.map(t =>
          t.id === id ? { ...t, ...updates } : t,
        );

        // Celebrate section completion
        for (const s of visibleSections) {
          const sectionTasks = updatedTasks.filter(t => {
            const timeStr = t.timeBlock || t.time;
            const sectionByTime = timeStr ? getSectionForTime(timeStr, visibleSections) : null;
            return sectionByTime === s.id || t.section === s.id;
          });

          if (sectionTasks.length > 0 && sectionTasks.every(t => t.status === 'done')) {
            const sectionEl = document.querySelector(`[data-section-id="${s.id}"]`) as HTMLElement | null;
            if (sectionEl) celebrateSection(sectionEl);
            break;
          }
        }
      }, 50);
    }
  }, [updateEntry, entries, currentDate, visibleSections]);

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div
      className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-paper"
      onDragEnd={handleDragEnd}
    >
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
                data-section-id={section.id}
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
  );
}
