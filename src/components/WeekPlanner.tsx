import { useState, useMemo, useRef, useCallback, type KeyboardEvent } from 'react';
import type { RapidLogEntry } from '../context/AppContext';
import { todayStr, formatLocalDate } from '../lib/dateUtils';
import { parseNaturalEntry } from '../lib/nlParser';

/* ── Types ─────────────────────────────────────────────────────────── */

interface WeekPlannerProps {
  entries: RapidLogEntry[];
  onAddEntry: (entry: RapidLogEntry) => void;
  onUpdateEntry: (id: string, updates: Partial<RapidLogEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onClose: () => void;
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function getWeekDays(): { iso: string; label: string; shortLabel: string; isToday: boolean; isWeekend: boolean }[] {
  const today = todayStr();
  const days: { iso: string; label: string; shortLabel: string; isToday: boolean; isWeekend: boolean }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = formatLocalDate(d);
    const dayOfWeek = d.getDay();
    days.push({
      iso,
      label: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      shortLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      isToday: iso === today,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  return days;
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function WeekPlanner({
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onClose,
}: WeekPlannerProps) {
  const weekDays = useMemo(getWeekDays, []);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [addingToDay, setAddingToDay] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Entries grouped by day
  const entriesByDay = useMemo(() => {
    const map: Record<string, RapidLogEntry[]> = {};
    for (const day of weekDays) {
      map[day.iso] = entries
        .filter((e) => e.date === day.iso)
        .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    }
    return map;
  }, [entries, weekDays]);

  const handleAddTask = useCallback(
    (dayIso: string) => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter' || !newTaskTitle.trim()) return;

      const parsed = parseNaturalEntry(newTaskTitle.trim());
      const entry: RapidLogEntry = {
        id: Date.now().toString(),
        type: parsed.type || 'task',
        title: parsed.title,
        date: parsed.date || dayIso,
        status: 'todo',
        movedCount: 0,
      };

      if (parsed.time) entry.time = parsed.time;

      onAddEntry(entry);
      setNewTaskTitle('');
    },
    [newTaskTitle, onAddEntry],
  );

  const moveTask = (taskId: string, targetDate: string) => {
    const task = entries.find((e) => e.id === taskId);
    if (task) {
      onUpdateEntry(taskId, {
        date: targetDate,
        movedCount: (task.movedCount ?? 0) + 1,
      });
    }
  };

  const toggleExpand = (dayIso: string) => {
    setExpandedDay((prev) => (prev === dayIso ? null : dayIso));
    setAddingToDay(null);
  };

  const startAdding = (dayIso: string) => {
    setAddingToDay(dayIso);
    setExpandedDay(dayIso);
    setNewTaskTitle('');
    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-paper rounded-t-2xl sm:rounded-2xl shadow-lifted w-full sm:max-w-lg sm:mx-4 max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-wood-light/15 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">date_range</span>
            </div>
            <h2 className="font-display italic text-2xl text-ink">This Week</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-pencil hover:text-ink hover:bg-wood-light/40 transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Day list */}
        <div className="flex-1 overflow-y-auto">
          {weekDays.map((day) => {
            const dayEntries = entriesByDay[day.iso] || [];
            const tasks = dayEntries.filter((e) => e.type === 'task');
            const events = dayEntries.filter((e) => e.type === 'event');
            const todoCount = tasks.filter((t) => t.status === 'todo').length;
            const doneCount = tasks.filter((t) => t.status === 'done').length;
            const isExpanded = expandedDay === day.iso;
            const isAdding = addingToDay === day.iso;

            return (
              <div
                key={day.iso}
                className={`border-b border-wood-light/10 last:border-b-0 ${
                  day.isToday ? 'bg-primary/3' : day.isWeekend ? 'bg-surface-light/30' : ''
                }`}
              >
                {/* Day header */}
                <div
                  className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-surface-light/50 transition-colors"
                  onClick={() => toggleExpand(day.iso)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-body text-base ${
                        day.isToday ? 'text-primary font-semibold' : 'text-ink'
                      }`}
                    >
                      {day.label}
                    </span>
                    {day.isToday && (
                      <span className="font-mono text-[13px] text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        today
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {todoCount > 0 && (
                      <span className="font-mono text-sm text-ink/60 tabular-nums">{todoCount}</span>
                    )}
                    {doneCount > 0 && (
                      <span className="font-mono text-sm text-sage/60 tabular-nums">✓{doneCount}</span>
                    )}
                    {events.length > 0 && (
                      <span className="font-mono text-sm text-primary/50 tabular-nums">○{events.length}</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startAdding(day.iso);
                      }}
                      className="p-1.5 rounded-lg text-pencil/40 hover:text-primary hover:bg-primary/5 transition-colors"
                      aria-label={`Add task to ${day.label}`}
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                    </button>
                    <span
                      className={`material-symbols-outlined text-pencil text-lg transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Expanded: show entries */}
                {isExpanded && (
                  <div className="px-5 pb-4 space-y-1">
                    {dayEntries.length === 0 && !isAdding && (
                      <p className="font-body text-sm text-pencil/40 italic py-2 px-1">No entries</p>
                    )}

                    {dayEntries.map((entry) => {
                      const isDone = entry.type === 'task' && entry.status === 'done';
                      const isEvent = entry.type === 'event';

                      return (
                        <div
                          key={entry.id}
                          className="group/item flex items-center gap-3 py-2 px-3 -mx-1 rounded-lg hover:bg-surface-light/60 transition-colors"
                        >
                          {/* Status indicator */}
                          {entry.type === 'task' ? (
                            <button
                              onClick={() =>
                                onUpdateEntry(entry.id, {
                                  status: isDone ? 'todo' : 'done',
                                })
                              }
                              className={`flex-shrink-0 size-6 rounded-md flex items-center justify-center border-2 transition-all ${
                                isDone
                                  ? 'bg-primary border-primary text-white'
                                  : 'border-pencil/25 hover:border-primary/50'
                              }`}
                            >
                              {isDone && (
                                <span className="material-symbols-outlined text-sm">check</span>
                              )}
                            </button>
                          ) : (
                            <span className="flex-shrink-0 size-5 rounded-full border-2 border-primary/40" />
                          )}

                          {/* Title */}
                          <span
                            className={`flex-1 font-body text-base min-w-0 truncate ${
                              isDone ? 'line-through text-ink/40' : 'text-ink'
                            }`}
                          >
                            {entry.title}
                          </span>

                          {/* Event time */}
                          {isEvent && entry.time && (
                            <span className="font-mono text-[13px] text-primary/60 flex-shrink-0">
                              {entry.time}
                            </span>
                          )}

                          {/* Actions — show on hover, always on mobile */}
                          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                            {/* Move to next/prev day */}
                            {day.iso !== weekDays[0].iso && (
                              <button
                                onClick={() => {
                                  const idx = weekDays.findIndex((d) => d.iso === day.iso);
                                  if (idx > 0) moveTask(entry.id, weekDays[idx - 1].iso);
                                }}
                                className="p-1 text-pencil/40 hover:text-primary transition-colors"
                                title="Move to previous day"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  arrow_back
                                </span>
                              </button>
                            )}
                            {day.iso !== weekDays[weekDays.length - 1].iso && (
                              <button
                                onClick={() => {
                                  const idx = weekDays.findIndex((d) => d.iso === day.iso);
                                  if (idx < weekDays.length - 1)
                                    moveTask(entry.id, weekDays[idx + 1].iso);
                                }}
                                className="p-1 text-pencil/40 hover:text-primary transition-colors"
                                title="Move to next day"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  arrow_forward
                                </span>
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteEntry(entry.id)}
                              className="p-1 text-pencil/30 hover:text-tension transition-colors"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add input */}
                    {isAdding && (
                      <div className="flex items-center gap-2 mt-2 py-2 px-3 rounded-lg bg-surface-light/50 border border-wood-light/15 focus-within:border-primary/30 transition-all">
                        <span className="material-symbols-outlined text-lg text-primary/40">add</span>
                        <input
                          ref={inputRef}
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={handleAddTask(day.iso)}
                          onBlur={() => {
                            if (!newTaskTitle.trim()) setAddingToDay(null);
                          }}
                          placeholder="Add task..."
                          className="flex-1 min-w-0 bg-transparent border-none p-0 text-base font-body text-ink placeholder:text-pencil/40 focus:ring-0 focus:outline-none"
                          autoFocus
                        />
                      </div>
                    )}

                    {!isAdding && (
                      <button
                        onClick={() => startAdding(day.iso)}
                        className="flex items-center gap-2 w-full py-2 px-3 rounded-lg text-pencil/40 hover:text-primary hover:bg-primary/5 transition-colors text-sm font-body"
                      >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add task
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
