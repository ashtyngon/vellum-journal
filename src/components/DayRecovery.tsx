import { useState, useEffect, useRef, type ReactElement } from 'react';
import type { RapidLogEntry } from '../context/AppContext';

/* ── Types ────────────────────────────────────────────────────────── */

interface DayRecoveryProps {
  entries: RapidLogEntry[];
  onDismiss: () => void;
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getRemainingHours(): number {
  return Math.max(0, 22 - new Date().getHours());
}

function getTimeOfDayLabel(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'half-day';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/* ── Component ────────────────────────────────────────────────────── */

const DayRecovery = ({ entries, onDismiss }: DayRecoveryProps) => {
  /* ── State ─────────────────────────────────────────────────────── */
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(900); // 15 minutes
  const [newTaskTitle, setNewTaskTitle] = useState('');

  /* fade transition */
  const [visible, setVisible] = useState(true);
  const pendingStep = useRef<(0 | 1 | 2) | null>(null);

  /* ── Derived ───────────────────────────────────────────────────── */

  const today = todayStr();
  const undoneTasks = entries.filter(
    (e) => e.type === 'task' && e.status === 'todo' && e.date === today
  );
  const selectedTask = entries.find((e) => e.id === selectedTaskId);
  const remainingHours = getRemainingHours();
  const timeLabel = getTimeOfDayLabel();

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;

  /* ── Priority styles ───────────────────────────────────────────── */

  const priorityDot: Record<string, string> = {
    low: 'bg-sage',
    medium: 'bg-bronze',
    high: 'bg-tension',
  };

  /* ── Step transitions ──────────────────────────────────────────── */

  const goToStep = (next: 0 | 1 | 2) => {
    setVisible(false);
    pendingStep.current = next;
  };

  useEffect(() => {
    if (!visible && pendingStep.current !== null) {
      const timeout = setTimeout(() => {
        setStep(pendingStep.current!);
        pendingStep.current = null;
        setVisible(true);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  /* ── Timer ─────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  const startTimer = () => {
    setTimerSeconds(900);
    setTimerActive(true);
  };

  /* ── Render: Step 0 — Warm banner ──────────────────────────────── */

  const renderStep0 = () => (
    <div className="space-y-4">
      <p className="font-body text-lg text-ink leading-relaxed">
        It's{' '}
        <span className="font-semibold">{formatTime(new Date())}</span>.
        You still have{' '}
        <span className="font-display italic font-semibold text-primary text-xl">
          {remainingHours} hours
        </span>{' '}
        before evening. That's a full {timeLabel}.
      </p>

      <button
        onClick={() => goToStep(1)}
        className="px-6 py-2.5 rounded-xl bg-primary text-white font-body text-base tracking-wide hover:bg-primary-dark transition-all shadow-soft"
      >
        Pick one thing &rarr;
      </button>
    </div>
  );

  /* ── Render: Step 1 — Pick ONE task ────────────────────────────── */

  const handleSelectTask = (id: string) => {
    setSelectedTaskId(id);
    setTimeout(() => goToStep(2), 300);
  };

  const handleAddQuickTask = () => {
    if (!newTaskTitle.trim()) return;
    // Create a temporary ID for the new task selection
    const tempId = `recovery-${Date.now()}`;
    setSelectedTaskId(tempId);
    // We store the title directly since this task doesn't exist in entries
    setNewTaskTitle(newTaskTitle.trim());
    setTimeout(() => goToStep(2), 300);
  };

  const renderStep1 = () => (
    <div className="space-y-5">
      <p className="font-body text-lg text-ink leading-relaxed">
        Pick just <span className="font-semibold">one</span> thing to do
        before the next hour. Just one.
      </p>

      {undoneTasks.length > 0 ? (
        <div className="space-y-2">
          {undoneTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => handleSelectTask(task.id)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                selectedTaskId === task.id
                  ? 'border-primary bg-primary/10'
                  : 'border-wood-light/40 hover:border-primary/40 hover:bg-primary/5'
              }`}
            >
              <span
                className={`flex-shrink-0 inline-block size-2 rounded-full ${
                  priorityDot[task.priority || 'medium']
                } opacity-70`}
              />
              <span className="font-body text-ink text-base">{task.title}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-body text-pencil text-sm italic">
            Nothing on your list? Add one small thing.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddQuickTask();
              }}
              placeholder="One small thing..."
              className="flex-1 px-4 py-2.5 rounded-xl border-2 border-wood-light bg-white/60 font-body text-ink placeholder:text-pencil/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
              autoFocus
            />
            <button
              onClick={handleAddQuickTask}
              disabled={!newTaskTitle.trim()}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-body text-sm hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Go
            </button>
          </div>
        </div>
      )}
    </div>
  );

  /* ── Render: Step 2 — Focus mode ───────────────────────────────── */

  const focusTitle = selectedTask
    ? selectedTask.title
    : newTaskTitle || 'Your chosen task';

  const renderStep2 = () => (
    <div className="space-y-6 text-center">
      <p className="font-body text-pencil text-sm uppercase tracking-widest">
        Your only job right now is
      </p>

      <p className="font-display italic text-2xl text-primary leading-snug px-4">
        {focusTitle}
      </p>

      <p className="font-body text-pencil text-base italic">
        Everything else can wait.
      </p>

      {/* Timer section */}
      {timerActive || timerSeconds < 900 ? (
        <div className="space-y-4">
          <p className="font-mono text-4xl text-ink tabular-nums">
            {String(minutes).padStart(2, '0')}:
            {String(seconds).padStart(2, '0')}
          </p>
          {timerSeconds === 0 && (
            <p className="font-body text-sage text-sm">
              Sprint complete. Nice work.
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={startTimer}
          className="px-6 py-2.5 rounded-xl border-2 border-primary/30 text-primary font-body text-base hover:bg-primary/5 transition-all"
        >
          Start 15-min sprint
        </button>
      )}

      <div>
        <button
          onClick={onDismiss}
          className="px-6 py-2.5 rounded-xl bg-primary text-white font-body text-base tracking-wide hover:bg-primary-dark transition-all shadow-soft"
        >
          I'm done &#10003;
        </button>
      </div>
    </div>
  );

  /* ── Step router ───────────────────────────────────────────────── */

  const steps: Record<number, () => ReactElement> = {
    0: renderStep0,
    1: renderStep1,
    2: renderStep2,
  };

  /* ── Main render ───────────────────────────────────────────────── */

  return (
    <div className="relative bg-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8">
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-full text-pencil hover:text-ink hover:bg-wood-light/40 transition-colors"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-xl">close</span>
      </button>

      {/* Content with fade transition */}
      <div
        className="transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {steps[step]()}
      </div>
    </div>
  );
};

export default DayRecovery;
