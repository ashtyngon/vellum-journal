import { useState, useEffect, useRef, type ReactElement } from 'react';
import type { RapidLogEntry } from '../context/AppContext';

/* ── Types ────────────────────────────────────────────────────────── */

interface ProcrastinationUnpackerProps {
  task: RapidLogEntry;
  onClose: () => void;
}

type BlockerKey =
  | 'too_big'
  | 'unclear'
  | 'afraid'
  | 'dont_want'
  | 'boring'
  | 'other';

interface BlockerOption {
  key: BlockerKey;
  label: string;
  icon: string;
}

/* ── Constants ────────────────────────────────────────────────────── */

const BLOCKERS: BlockerOption[] = [
  { key: 'too_big', label: 'Too big', icon: 'unfold_more' },
  { key: 'unclear', label: 'Unclear next step', icon: 'help_outline' },
  { key: 'afraid', label: 'Afraid of doing it wrong', icon: 'warning_amber' },
  { key: 'dont_want', label: "Don't want to", icon: 'thumb_down' },
  { key: 'boring', label: 'Boring', icon: 'hotel_class' },
  { key: 'other', label: 'Something else', icon: 'more_horiz' },
];

const BLOCKER_PROMPTS: Record<BlockerKey, string> = {
  too_big:
    "What's the tiniest first step? Something you could do in 2 minutes.",
  unclear:
    'What question would you need answered before starting? Can you find out in 5 minutes?',
  afraid:
    "What's the worst version of 'done' that's still better than not started?",
  dont_want:
    'Is this actually yours to do? Could you delegate it, drop it, or defer it?',
  boring:
    'Can you pair it with something enjoyable? Music, a snack, a 15-minute sprint?',
  other: 'What would make this feel 10% easier?',
};

const TIMER_DURATION = 5 * 60; // 5 minutes in seconds

/* ── Component ────────────────────────────────────────────────────── */

const ProcrastinationUnpacker = ({
  task,
  onClose,
}: ProcrastinationUnpackerProps) => {
  /* ── State ─────────────────────────────────────────────────────── */
  const [step, setStep] = useState(0);
  const [feeling, setFeeling] = useState('');
  const [blocker, setBlocker] = useState<BlockerKey | ''>('');
  const [response, setResponse] = useState('');
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(TIMER_DURATION);
  const [timerDone, setTimerDone] = useState(false);

  /* fade transition */
  const [visible, setVisible] = useState(true);
  const pendingStep = useRef<number | null>(null);

  /* ── Helpers ────────────────────────────────────────────────────── */

  const goToStep = (next: number) => {
    setVisible(false);
    pendingStep.current = next;
  };

  /* Handle fade-out end → switch step, fade back in */
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

  /* ── Timer ──────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          setTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  const startTimer = () => {
    setTimerSeconds(TIMER_DURATION);
    setTimerDone(false);
    setTimerActive(true);
    goToStep(4);
  };

  const keepGoing = () => {
    setTimerSeconds(TIMER_DURATION);
    setTimerDone(false);
    setTimerActive(true);
  };

  /* ── Derived values ─────────────────────────────────────────────── */

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const progress = timerSeconds / TIMER_DURATION; // 1 → 0

  /* SVG ring dimensions */
  const RING_SIZE = 220;
  const STROKE = 8;
  const RADIUS = (RING_SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  /* ── Sub-states for step 3 "not right now" and step 4 "done" ──── */
  const [declined, setDeclined] = useState(false);
  const [finished, setFinished] = useState(false);

  /* ── Close-button (always visible) ──────────────────────────────── */

  const closeButton = (
    <button
      onClick={onClose}
      className="absolute top-6 right-6 z-10 p-2 rounded-full text-pencil hover:text-ink hover:bg-wood-light/40 transition-colors"
      aria-label="Close"
    >
      <span className="material-symbols-outlined text-2xl">close</span>
    </button>
  );

  /* ── Render helpers ─────────────────────────────────────────────── */

  const renderStep0 = () => (
    <div className="flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full px-6">
      {/* Task title */}
      <p className="font-display italic text-3xl text-ink text-center leading-snug">
        {task.title}
      </p>

      {/* Prompt */}
      <p className="font-body text-xl text-ink text-center">
        What happens when you think about starting this?
      </p>

      {/* Textarea */}
      <textarea
        autoFocus
        value={feeling}
        onChange={(e) => setFeeling(e.target.value)}
        placeholder="I feel..."
        rows={4}
        className="w-full rounded-xl border-2 border-wood-light bg-white/60 px-5 py-4 font-body text-ink text-lg placeholder:text-pencil/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-colors"
      />

      {/* Next */}
      <button
        disabled={!feeling.trim()}
        onClick={() => goToStep(1)}
        className="px-8 py-3 rounded-xl bg-primary text-white font-body text-lg tracking-wide hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-soft"
      >
        Next &rarr;
      </button>
    </div>
  );

  const renderStep1 = () => (
    <div className="flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full px-6">
      <p className="font-body text-xl text-ink text-center">
        What&rsquo;s in the way?
      </p>

      {/* 2x3 grid of blockers */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {BLOCKERS.map((b) => (
          <button
            key={b.key}
            onClick={() => {
              setBlocker(b.key);
              setTimeout(() => goToStep(2), 300);
            }}
            className={`flex items-center gap-3 border-2 rounded-xl px-6 py-4 font-body text-ink transition-all cursor-pointer ${
              blocker === b.key
                ? 'border-primary bg-primary/10'
                : 'border-wood-light hover:border-primary hover:bg-primary/5'
            }`}
          >
            <span className="material-symbols-outlined text-xl opacity-70">
              {b.icon}
            </span>
            <span className="text-left">{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full px-6">
      {/* Targeted prompt */}
      <p className="font-body text-xl text-ink text-center leading-relaxed">
        {blocker ? BLOCKER_PROMPTS[blocker as BlockerKey] : ''}
      </p>

      <textarea
        autoFocus
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="My thoughts..."
        rows={4}
        className="w-full rounded-xl border-2 border-wood-light bg-white/60 px-5 py-4 font-body text-ink text-lg placeholder:text-pencil/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-colors"
      />

      <button
        disabled={!response.trim()}
        onClick={() => goToStep(3)}
        className="px-8 py-3 rounded-xl bg-primary text-white font-body text-lg tracking-wide hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-soft"
      >
        Next &rarr;
      </button>
    </div>
  );

  const renderStep3 = () => {
    if (declined) {
      return (
        <div className="flex flex-col items-center justify-center gap-8 max-w-md mx-auto w-full px-6 text-center">
          <span className="material-symbols-outlined text-5xl text-sage">
            spa
          </span>
          <p className="font-display italic text-2xl text-ink leading-relaxed">
            That&rsquo;s OK. You showed up by thinking about it. That counts.
          </p>
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl border-2 border-wood-light text-ink font-body text-lg hover:bg-surface-light transition-all"
          >
            Close
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-8 max-w-md mx-auto w-full px-6 text-center">
        <p className="font-body text-xl text-ink">
          Ready to try for just 5 minutes?
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button
            onClick={startTimer}
            className="px-10 py-4 rounded-xl bg-primary text-white font-body text-lg tracking-wide hover:bg-primary-dark transition-all shadow-soft"
          >
            Let&rsquo;s go
          </button>
          <button
            onClick={() => setDeclined(true)}
            className="px-10 py-4 rounded-xl border-2 border-wood-light text-pencil font-body text-lg hover:text-ink hover:bg-surface-light transition-all"
          >
            Not right now
          </button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    if (finished) {
      return (
        <div className="flex flex-col items-center justify-center gap-8 max-w-md mx-auto w-full px-6 text-center">
          <span className="material-symbols-outlined text-5xl text-primary">
            check_circle
          </span>
          <p className="font-display italic text-2xl text-ink leading-relaxed">
            You started. That&rsquo;s the hardest part. &#10003;
          </p>
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl border-2 border-wood-light text-ink font-body text-lg hover:bg-surface-light transition-all"
          >
            Close
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-10 max-w-md mx-auto w-full px-6 text-center">
        {/* Timer title */}
        {timerDone ? (
          <p className="font-body text-xl text-ink">
            5 minutes done! Keep going?
          </p>
        ) : (
          <p className="font-body text-lg text-pencil">Focus timer</p>
        )}

        {/* Circular timer */}
        <div className="relative flex items-center justify-center">
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            className="-rotate-90"
          >
            {/* Background ring */}
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE}
              className="text-wood-light"
            />
            {/* Progress ring */}
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="text-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          {/* Time display */}
          <span className="absolute font-mono text-5xl text-ink tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button
            onClick={keepGoing}
            className="px-8 py-3 rounded-xl bg-primary text-white font-body text-lg tracking-wide hover:bg-primary-dark transition-all shadow-soft"
          >
            Keep going +
          </button>
          <button
            onClick={() => {
              setTimerActive(false);
              setFinished(true);
            }}
            className="px-8 py-3 rounded-xl border-2 border-wood-light text-ink font-body text-lg hover:bg-surface-light transition-all"
          >
            Done for now &#10003;
          </button>
        </div>
      </div>
    );
  };

  /* ── Step router ────────────────────────────────────────────────── */

  const steps: Record<number, () => ReactElement> = {
    0: renderStep0,
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
  };

  /* ── Main render ────────────────────────────────────────────────── */

  return (
    <div className="fixed inset-0 z-50 bg-paper flex items-center justify-center">
      {closeButton}

      <div
        className="w-full h-full flex items-center justify-center transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {steps[step]()}
      </div>
    </div>
  );
};

export default ProcrastinationUnpacker;
