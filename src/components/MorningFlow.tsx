import { useState, useMemo } from 'react';
import type { RapidLogEntry } from '../context/AppContext';
import { todayStr } from '../lib/dateUtils';

/* ── Types ─────────────────────────────────────────────────────────── */

interface MorningFlowProps {
  entries: RapidLogEntry[];
  onBatchUpdate: (updates: { id: string; updates: Partial<RapidLogEntry> }[]) => void;
  onDeleteEntry: (id: string) => void;
  onComplete: () => void;
}

type Decision = 'today' | 'backlog' | 'delete' | 'undecided';

/* ── Component ─────────────────────────────────────────────────────── */

export default function MorningFlow({
  entries,
  onBatchUpdate,
  onDeleteEntry,
  onComplete,
}: MorningFlowProps) {
  const today = todayStr();

  // ALL open tasks: any task with status 'todo' and a real date (not parked)
  // Plus parked tasks (date === '') so user can pull them back
  const openTasks = useMemo(() => {
    return entries
      .filter((e) => e.type === 'task' && e.status === 'todo')
      .sort((a, b) => {
        // Today's tasks first, then by date descending (most recent first), parked last
        if (a.date === today && b.date !== today) return -1;
        if (b.date === today && a.date !== today) return 1;
        if (a.date === '' && b.date !== '') return 1;
        if (b.date === '' && a.date !== '') return -1;
        return b.date.localeCompare(a.date);
      });
  }, [entries, today]);

  const [decisions, setDecisions] = useState<Record<string, Decision>>(() => {
    // Default: tasks already on today → 'today', everything else → 'undecided'
    const initial: Record<string, Decision> = {};
    for (const task of openTasks) {
      initial[task.id] = task.date === today ? 'today' : 'undecided';
    }
    return initial;
  });

  const getDecision = (id: string): Decision => decisions[id] ?? 'undecided';

  const setDecision = (id: string, d: Decision) => {
    setDecisions((prev) => ({ ...prev, [id]: d }));
  };

  const handleApply = () => {
    const updates: { id: string; updates: Partial<RapidLogEntry> }[] = [];
    const toDelete: string[] = [];

    for (const task of openTasks) {
      const d = getDecision(task.id);
      if (d === 'delete') {
        toDelete.push(task.id);
      } else if (d === 'today' && task.date !== today) {
        // Move to today
        updates.push({
          id: task.id,
          updates: { date: today, movedCount: (task.movedCount ?? 0) + 1 },
        });
      } else if (d === 'backlog' && task.date !== '') {
        // Park it — remove date
        updates.push({
          id: task.id,
          updates: { date: '', section: undefined, timeBlock: undefined },
        });
      }
      // 'undecided' tasks that are already on today stay on today
      // 'undecided' tasks from other days stay where they are
    }

    // Apply batch updates
    if (updates.length > 0) onBatchUpdate(updates);
    // Delete
    for (const id of toDelete) onDeleteEntry(id);
    // Done
    onComplete();
  };

  // Quick actions
  const allToday = () => {
    const next: Record<string, Decision> = {};
    for (const task of openTasks) next[task.id] = 'today';
    setDecisions(next);
  };

  const todayCount = openTasks.filter((t) => getDecision(t.id) === 'today').length;
  const backlogCount = openTasks.filter((t) => getDecision(t.id) === 'backlog').length;
  const deleteCount = openTasks.filter((t) => getDecision(t.id) === 'delete').length;
  const undecidedCount = openTasks.filter((t) => getDecision(t.id) === 'undecided').length;

  // Group tasks: already today, from earlier, parked/backlog
  const todaysTasks = openTasks.filter((t) => t.date === today);
  const earlierTasks = openTasks.filter((t) => t.date !== '' && t.date !== today);
  const parkedTasks = openTasks.filter((t) => t.date === '');

  if (openTasks.length === 0) {
    return (
      <div className="bg-surface-light/60 border border-wood-light/20 rounded-2xl p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-sage/60 mb-2 block">check_circle</span>
        <p className="font-body text-lg text-ink/70 mb-1">Clean slate.</p>
        <p className="font-body text-base text-pencil">No open tasks. Enjoy your day.</p>
        <button
          onClick={onComplete}
          className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-white font-body text-base hover:bg-primary/90 transition-colors shadow-soft"
        >
          Let's go
        </button>
      </div>
    );
  }

  const renderTaskRow = (task: RapidLogEntry) => {
    const d = getDecision(task.id);
    const isParked = task.date === '';
    const dateLabel = isParked
      ? 'backlog'
      : task.date === today
        ? null
        : new Date(task.date + 'T12:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

    return (
      <div
        key={task.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          d === 'delete' ? 'opacity-30 bg-tension/5' : d === 'backlog' ? 'opacity-50 bg-surface-light/30' : 'bg-surface-light/40'
        }`}
      >
        {/* Task info */}
        <div className="flex-1 min-w-0">
          <span
            className={`font-body text-base text-ink leading-snug block ${
              d === 'delete' ? 'line-through text-ink/40' : ''
            }`}
          >
            {task.title}
          </span>
          {dateLabel && (
            <span className="font-mono text-[13px] text-pencil/50 uppercase tracking-wider">
              {dateLabel}
            </span>
          )}
        </div>

        {/* Decision pills */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setDecision(task.id, d === 'today' ? 'undecided' : 'today')}
            className={`px-3 py-2 rounded-lg text-sm font-mono uppercase tracking-wider transition-all min-w-[52px] ${
              d === 'today'
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-pencil/50 hover:text-primary hover:bg-primary/5'
            }`}
          >
            today
          </button>
          <button
            onClick={() => setDecision(task.id, d === 'backlog' ? 'undecided' : 'backlog')}
            className={`px-3 py-2 rounded-lg text-sm font-mono uppercase tracking-wider transition-all min-w-[52px] ${
              d === 'backlog'
                ? 'bg-sage/15 text-sage font-medium'
                : 'text-pencil/50 hover:text-sage hover:bg-sage/5'
            }`}
            title="Move to backlog"
          >
            later
          </button>
          <button
            onClick={() => setDecision(task.id, d === 'delete' ? 'undecided' : 'delete')}
            className={`p-2 rounded-lg transition-all ${
              d === 'delete'
                ? 'bg-tension/15 text-tension'
                : 'text-pencil/30 hover:text-tension hover:bg-tension/5'
            }`}
            title="Delete"
            aria-label="Delete task"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-paper border border-wood-light/20 rounded-2xl shadow-soft overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-wood-light/15">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display italic text-2xl text-ink">Start your day</h2>
            <p className="font-body text-base text-pencil mt-0.5">
              {openTasks.length} open task{openTasks.length !== 1 ? 's' : ''} — pick what makes it to today
            </p>
          </div>
          <button
            onClick={onComplete}
            className="p-2 rounded-full text-pencil hover:text-ink hover:bg-wood-light/40 transition-colors"
            aria-label="Skip"
            title="Skip for now"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={allToday}
            className="px-3 py-1.5 rounded-lg text-sm font-mono text-primary bg-primary/8 hover:bg-primary/15 uppercase tracking-wider transition-colors"
          >
            All → today
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
        {/* Today's tasks */}
        {todaysTasks.length > 0 && (
          <div>
            <p className="font-mono text-[13px] text-pencil/60 uppercase tracking-[0.15em] mb-2 px-1">
              Already on today
            </p>
            <div className="space-y-1.5">
              {todaysTasks.map(renderTaskRow)}
            </div>
          </div>
        )}

        {/* Earlier tasks */}
        {earlierTasks.length > 0 && (
          <div>
            <p className="font-mono text-[13px] text-pencil/60 uppercase tracking-[0.15em] mb-2 px-1">
              From earlier
            </p>
            <div className="space-y-1.5">
              {earlierTasks.map(renderTaskRow)}
            </div>
          </div>
        )}

        {/* Parked tasks */}
        {parkedTasks.length > 0 && (
          <div>
            <p className="font-mono text-[13px] text-pencil/60 uppercase tracking-[0.15em] mb-2 px-1">
              Backlog
            </p>
            <div className="space-y-1.5">
              {parkedTasks.map(renderTaskRow)}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-wood-light/15 bg-surface-light/30">
        <div className="font-mono text-sm text-pencil space-x-3">
          <span><span className="text-primary font-medium">{todayCount}</span> today</span>
          {backlogCount > 0 && <span><span className="text-sage font-medium">{backlogCount}</span> later</span>}
          {deleteCount > 0 && <span className="text-tension"><span className="font-medium">{deleteCount}</span> delete</span>}
          {undecidedCount > 0 && <span className="text-pencil/40">{undecidedCount} undecided</span>}
        </div>
        <button
          onClick={handleApply}
          className="px-6 py-2.5 rounded-xl bg-primary text-white font-body text-base hover:bg-primary/90 transition-colors shadow-soft"
        >
          Start my day
        </button>
      </div>
    </div>
  );
}
