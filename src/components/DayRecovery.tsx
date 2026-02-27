import { useState } from 'react';
import type { RapidLogEntry } from '../context/AppContext';
import { todayStr } from '../lib/dateUtils';

/* ── Types ────────────────────────────────────────────────────────── */

interface DayRecoveryProps {
  entries: RapidLogEntry[];
  onUpdateEntry: (id: string, updates: Partial<RapidLogEntry>) => void;
  onDismiss: () => void;
}

/* ── Component ────────────────────────────────────────────────────── */

const DayRecovery = ({ entries, onUpdateEntry, onDismiss }: DayRecoveryProps) => {
  const today = todayStr();

  // All tasks that need attention: today's undone + overdue from past
  // Exclude parked tasks (date === '') — those are intentionally unscheduled
  const actionableTasks = entries.filter(
    (e) => e.type === 'task' && e.status === 'todo' && e.date !== '' && e.date <= today
  );

  // Track which tasks user wants to keep, park, or defer
  // By default everything is "keep" (stays as-is for today)
  const [decisions, setDecisions] = useState<Record<string, 'keep' | 'park' | 'defer'>>({});

  const getDecision = (id: string) => decisions[id] || 'keep';

  const setDecision = (id: string, decision: 'keep' | 'park' | 'defer') => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
  };

  const handleApply = () => {
    for (const task of actionableTasks) {
      const d = getDecision(task.id);
      if (d === 'park') {
        // Move to parking lot — unschedule entirely (no date, no section, no timeBlock)
        onUpdateEntry(task.id, { date: '', section: undefined, timeBlock: undefined });
      } else if (d === 'defer') {
        // Push to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        onUpdateEntry(task.id, { date: tomorrowStr, movedCount: (task.movedCount ?? 0) + 1 });
      } else if (d === 'keep' && task.date < today) {
        // Overdue task being kept → move to today
        onUpdateEntry(task.id, { date: today, movedCount: (task.movedCount ?? 0) + 1 });
      }
    }
    onDismiss();
  };

  const keepCount = actionableTasks.filter((t) => getDecision(t.id) === 'keep').length;

  if (actionableTasks.length === 0) {
    return (
      <div className="bg-surface-light/50 border border-wood-light/20 rounded-xl p-5">
        <p className="font-body text-sm text-pencil">No open tasks. You're clear.</p>
        <button
          onClick={onDismiss}
          className="mt-2 text-sm font-mono text-primary hover:underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Priority styling helper
  const priorityDot: Record<string, string> = {
    low: 'bg-sage',
    medium: 'bg-bronze',
    high: 'bg-tension',
  };

  return (
    <div className="bg-paper border border-wood-light/20 rounded-xl shadow-soft overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-wood-light/15">
        <div>
          <h3 className="font-mono text-sm text-pencil uppercase tracking-[0.15em]">
            Reset My Day
          </h3>
          <p className="font-body text-base text-ink/70 mt-0.5">
            {actionableTasks.length} task{actionableTasks.length !== 1 ? 's' : ''} — pick what
            you're doing today
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-full text-pencil hover:text-ink hover:bg-wood-light/40 transition-colors"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Task list */}
      <div className="divide-y divide-wood-light/10 max-h-[50vh] overflow-y-auto">
        {actionableTasks.map((task) => {
          const decision = getDecision(task.id);
          const isOverdue = task.date < today;
          return (
            <div
              key={task.id}
              className={`flex items-center gap-3 px-5 py-2.5 transition-colors ${
                decision === 'park' || decision === 'defer' ? 'opacity-40' : ''
              }`}
            >
              {/* Priority dot */}
              <span
                className={`flex-shrink-0 size-2 rounded-full ${priorityDot[task.priority || 'medium']} opacity-60`}
              />

              {/* Task title */}
              <div className="flex-1 min-w-0">
                <span
                  className={`font-body text-base text-ink ${decision !== 'keep' ? 'line-through' : ''}`}
                >
                  {task.title}
                </span>
                {isOverdue && (
                  <span className="ml-2 font-mono text-sm text-tension/60 uppercase tracking-wider">
                    overdue
                  </span>
                )}
              </div>

              {/* Quick action pills */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setDecision(task.id, 'keep')}
                  className={`px-3 py-1.5 rounded-md text-sm font-mono uppercase tracking-wider transition-all ${
                    decision === 'keep'
                      ? 'bg-primary/12 text-primary'
                      : 'text-pencil/50 hover:text-pencil hover:bg-surface-light'
                  }`}
                >
                  today
                </button>
                <button
                  onClick={() => setDecision(task.id, 'park')}
                  className={`px-3 py-1.5 rounded-md text-sm font-mono uppercase tracking-wider transition-all ${
                    decision === 'park'
                      ? 'bg-sage/12 text-sage'
                      : 'text-pencil/50 hover:text-pencil hover:bg-surface-light'
                  }`}
                  title="Move to parking lot (backlog)"
                >
                  park
                </button>
                <button
                  onClick={() => setDecision(task.id, 'defer')}
                  className={`px-3 py-1.5 rounded-md text-sm font-mono uppercase tracking-wider transition-all ${
                    decision === 'defer'
                      ? 'bg-bronze/12 text-bronze'
                      : 'text-pencil/50 hover:text-pencil hover:bg-surface-light'
                  }`}
                >
                  tomorrow
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-wood-light/15 bg-surface-light/30">
        <span className="font-mono text-sm text-pencil">
          Keeping {keepCount} of {actionableTasks.length}
        </span>
        <button
          onClick={handleApply}
          className="px-5 py-2.5 rounded-lg bg-primary text-white font-body text-base hover:bg-primary/90 transition-colors shadow-soft"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default DayRecovery;
