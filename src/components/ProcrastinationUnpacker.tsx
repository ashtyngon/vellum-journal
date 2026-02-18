import { useState, useEffect, useRef, type ReactElement } from 'react';
import type { RapidLogEntry } from '../context/AppContext';

/* ── Types ────────────────────────────────────────────────────────── */

interface ProcrastinationUnpackerProps {
  task: RapidLogEntry;
  onClose: () => void;
}

/* ── Constants ────────────────────────────────────────────────────── */

/*
 * Psychological model: IFS-informed "resisting part" negotiation.
 *
 * The flow:
 *   1. Surface the resistance (don't fight it — name it)
 *   2. Give the resisting part a voice (what is it saying?)
 *   3. Understand what it's protecting you from
 *   4. Ask what it needs to feel safe
 *   5. Negotiate a micro-deal (not "do the task" — just "try for 2 min")
 *   6. Lower the bar until resistance dissolves
 *   7. Timer or conscious deferral
 */

const TIMER_DURATION = 5 * 60;

/* ── Component ────────────────────────────────────────────────────── */

const ProcrastinationUnpacker = ({
  task,
  onClose,
}: ProcrastinationUnpackerProps) => {
  /* ── State ─────────────────────────────────────────────────────── */
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(7).fill(''));
  const [commitType, setCommitType] = useState<'start' | 'defer' | ''>('');
  const [microCommit, setMicroCommit] = useState('');
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(TIMER_DURATION);
  const [timerDone, setTimerDone] = useState(false);
  const [finished, setFinished] = useState(false);

  /* fade transition */
  const [visible, setVisible] = useState(true);
  const pendingStep = useRef<number | null>(null);

  /* ── Answer management ──────────────────────────────────────────── */

  const setAnswer = (idx: number, val: string) =>
    setAnswers(prev => { const n = [...prev]; n[idx] = val; return n; });
  const currentAnswer = answers[step] ?? '';

  /* ── Step transitions ───────────────────────────────────────────── */

  const goToStep = (next: number) => {
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

  /* ── Timer ──────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) { setTimerActive(false); setTimerDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const startTimer = () => {
    setTimerSeconds(TIMER_DURATION);
    setTimerDone(false);
    setTimerActive(true);
    goToStep(7);
  };

  const keepGoing = () => {
    setTimerSeconds(TIMER_DURATION);
    setTimerDone(false);
    setTimerActive(true);
  };

  /* ── Derived values ─────────────────────────────────────────────── */

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const progress = timerSeconds / TIMER_DURATION;
  const RING_SIZE = 200;
  const STROKE = 6;
  const RADIUS = (RING_SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  /* ── Shared UI ──────────────────────────────────────────────────── */

  const closeButton = (
    <button
      onClick={onClose}
      className="absolute top-6 right-6 z-10 p-2 rounded-full text-pencil hover:text-ink hover:bg-wood-light/40 transition-colors"
      aria-label="Close"
    >
      <span className="material-symbols-outlined text-2xl">close</span>
    </button>
  );

  const textareaClasses = "w-full rounded-xl border-2 border-wood-light bg-white/60 px-5 py-4 font-body text-ink text-lg placeholder:text-pencil/50 placeholder:italic focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-colors";

  const nextBtn = (disabled: boolean, onClick: () => void) => (
    <button
      disabled={disabled}
      onClick={onClick}
      className="px-8 py-3 rounded-xl bg-primary text-white font-body text-lg tracking-wide hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-soft"
    >
      Next &rarr;
    </button>
  );

  /* ── Step definitions ───────────────────────────────────────────── */

  /*
   * Step 0 — Name the resistance
   * "There's a part of you that doesn't want to do this.
   *  Don't argue with it. Just notice what it feels like."
   */
  const renderStep0 = () => (
    <div className="flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full px-6">
      <p className="font-display italic text-3xl text-ink text-center leading-snug">
        {task.title}
      </p>
      <div className="text-center space-y-2">
        <p className="font-body text-xl text-ink leading-relaxed">
          There&rsquo;s a part of you that doesn&rsquo;t want to do this.
        </p>
        <p className="font-body text-base text-pencil leading-relaxed">
          Don&rsquo;t argue with it. Don&rsquo;t push through it. Just notice: what does the resistance feel like right now?
        </p>
      </div>
      <textarea
        autoFocus
        value={currentAnswer}
        onChange={e => setAnswer(0, e.target.value)}
        placeholder="Heavy. Tight. Like I want to run away. Like a stubborn kid crossing their arms..."
        rows={4}
        className={textareaClasses}
      />
      {nextBtn(!currentAnswer.trim(), () => goToStep(1))}
    </div>
  );

  /*
   * Step 1 — Give the resistance a voice
   * "If this resisting part could speak, what would it say?"
   */
  const renderStep1 = () => (
    <div className="flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full px-6">
      <div className="text-center space-y-2">
        <p className="font-body text-xl text-ink leading-relaxed">
          If this resisting part of you could talk, what would it say?
        </p>
        <p className="font-body text-base text-pencil leading-relaxed">
          Let it be honest. It might sound childish, angry, scared, or tired. That&rsquo;s OK &mdash; it&rsquo;s trying to tell you something.
        </p>
      </div>
      <textarea
        autoFocus
        value={currentAnswer}
        onChange={e => setAnswer(1, e.target.value)}
        placeholder={'"I don\'t want to." "This is pointless." "I\'m going to mess it up." "Why do I have to?" "I\'m so tired of this..."'}
        rows={4}
        className={textareaClasses}
      />
      {nextBtn(!currentAnswer.trim(), () => goToStep(2))}
    </div>
  );

  /*
   * Step 2 — Understand the protection
   * "What is this part trying to protect you from?"
   */
  const renderStep2 = () => (
    <div className="flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full px-6">
      <div className="text-center space-y-2">
        <p className="font-body text-xl text-ink leading-relaxed">
          Resistance is always protecting something.
        </p>
        <p className="font-body text-base text-pencil leading-relaxed">
          What is this part trying to keep you safe from? Failure? Judgment? Exhaustion? Feeling inadequate? Being controlled?
        </p>
      </div>
      <textarea
        autoFocus
        value={currentAnswer}
        onChange={e => setAnswer(2, e.target.value)}
        placeholder="I think it's protecting me from..."
        rows={4}
        className={textareaClasses}
      />
      {nextBtn(!currentAnswer.trim(), () => goToStep(3))}
    </div>
  );

  /*
   * Step 3 — Acknowledge and validate
   * "Thank the part. It's not the enemy."
   */
  const renderStep3 = () => (
    <div className="flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full px-6">
      <div className="text-center space-y-3">
        <p className="font-display italic text-2xl text-ink leading-relaxed">
          That makes sense.
        </p>
        <p className="font-body text-base text-pencil leading-relaxed max-w-md mx-auto">
          This part of you learned to resist for a reason. It&rsquo;s not laziness &mdash; it&rsquo;s a protection strategy that once worked. You don&rsquo;t have to fight it.
        </p>
        <p className="font-body text-xl text-ink leading-relaxed mt-4">
          What would you say to this part if you were being kind to it?
        </p>
      </div>
      <textarea
        autoFocus
        value={currentAnswer}
        onChange={e => setAnswer(3, e.target.value)}
        placeholder={'"I hear you. It makes sense that you don\'t want to. You don\'t have to be perfect..."'}
        rows={4}
        className={textareaClasses}
      />
      {nextBtn(!currentAnswer.trim(), () => goToStep(4))}
    </div>
  );

  /*
   * Step 4 — Negotiate: what does the resisting part need?
   */
  const renderStep4 = () => (
    <div className="flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full px-6">
      <div className="text-center space-y-2">
        <p className="font-body text-xl text-ink leading-relaxed">
          What would this part need to feel OK about starting &mdash; even just a little?
        </p>
        <p className="font-body text-base text-pencil leading-relaxed">
          Lower the bar. Way lower. Permission to do it badly? A time limit? A reward after? Doing the easiest part first?
        </p>
      </div>
      <textarea
        autoFocus
        value={currentAnswer}
        onChange={e => setAnswer(4, e.target.value)}
        placeholder="It would need... permission to stop after 5 minutes. Or to do the messy version first. Or just to open the file and nothing else."
        rows={4}
        className={textareaClasses}
      />
      {nextBtn(!currentAnswer.trim(), () => goToStep(5))}
    </div>
  );

  /*
   * Step 5 — The deal: restate the micro-agreement
   */
  const renderStep5 = () => (
    <div className="flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full px-6">
      <div className="text-center space-y-3">
        <p className="font-display italic text-2xl text-ink leading-relaxed">
          So here&rsquo;s the deal.
        </p>
        <p className="font-body text-lg text-pencil leading-relaxed max-w-md mx-auto">
          You don&rsquo;t have to do the whole thing. You don&rsquo;t have to do it well. You just have to do the tiniest version for 5 minutes. If it still feels wrong after 5 minutes, you stop with zero guilt.
        </p>
        <p className="font-body text-xl text-ink leading-relaxed mt-4">
          What&rsquo;s the smallest possible version of starting?
        </p>
      </div>
      <textarea
        autoFocus
        value={currentAnswer}
        onChange={e => setAnswer(5, e.target.value)}
        placeholder='Just open it. Just write one sentence. Just read the first paragraph. Just look at it for 30 seconds.'
        rows={3}
        className={textareaClasses}
      />
      {nextBtn(!currentAnswer.trim(), () => goToStep(6))}
    </div>
  );

  /*
   * Step 6 — Commit or defer
   */
  const renderStep6 = () => {
    if (commitType === 'start') {
      return (
        <div className="flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full px-6 text-center">
          <p className="font-body text-xl text-ink">
            One last thing. Write down exactly what you&rsquo;ll do &mdash; so specific you can&rsquo;t misunderstand it.
          </p>
          <textarea
            autoFocus
            value={microCommit}
            onChange={e => setMicroCommit(e.target.value)}
            placeholder='"Open Google Docs, scroll to where I left off, and type one sentence."'
            rows={3}
            className={textareaClasses}
          />
          <button
            disabled={!microCommit.trim()}
            onClick={startTimer}
            className="px-10 py-4 rounded-xl bg-primary text-white font-body text-lg tracking-wide hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-soft"
          >
            5 minutes. That&rsquo;s it.
          </button>
        </div>
      );
    }

    if (commitType === 'defer') {
      return (
        <div className="flex flex-col items-center justify-center gap-8 max-w-md mx-auto w-full px-6 text-center">
          <span className="material-symbols-outlined text-5xl text-sage">spa</span>
          <p className="font-display italic text-2xl text-ink leading-relaxed">
            That&rsquo;s not avoidance. That&rsquo;s awareness.
          </p>
          <p className="font-body text-base text-pencil leading-relaxed max-w-sm mx-auto">
            You listened to the resistance instead of fighting it. You chose to come back to this when conditions are different. That took honesty, not weakness.
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
        <p className="font-display italic text-2xl text-ink leading-relaxed">
          You heard the resistance. You didn&rsquo;t fight it. Now it&rsquo;s your call.
        </p>
        <p className="font-body text-lg text-pencil">
          Try the 5-minute deal, or consciously set this down?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button
            onClick={() => setCommitType('start')}
            className="px-10 py-4 rounded-xl bg-primary text-white font-body text-lg tracking-wide hover:bg-primary-dark transition-all shadow-soft"
          >
            Try for 5 minutes
          </button>
          <button
            onClick={() => setCommitType('defer')}
            className="px-10 py-4 rounded-xl border-2 border-wood-light text-pencil font-body text-lg hover:text-ink hover:bg-surface-light transition-all"
          >
            Not right now
          </button>
        </div>
      </div>
    );
  };

  /*
   * Step 7 — Focus timer
   */
  const renderStep7 = () => {
    if (finished) {
      return (
        <div className="flex flex-col items-center justify-center gap-8 max-w-md mx-auto w-full px-6 text-center">
          <span className="material-symbols-outlined text-5xl text-primary">check_circle</span>
          <p className="font-display italic text-2xl text-ink leading-relaxed">
            You did it. The resistance was loud, and you started anyway.
          </p>
          <p className="font-body text-base text-pencil max-w-sm mx-auto">
            Notice: the thing that felt impossible 10 minutes ago is now in motion. Remember this next time.
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
        {timerDone ? (
          <div className="space-y-2">
            <p className="font-body text-xl text-ink">
              5 minutes done. The deal is fulfilled.
            </p>
            <p className="font-body text-base text-pencil">
              Want to keep going? You might be in flow now.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-body text-lg text-pencil">Just 5 minutes</p>
            {microCommit && (
              <p className="font-body text-sm text-ink/60 italic max-w-xs mx-auto">
                &ldquo;{microCommit}&rdquo;
              </p>
            )}
          </div>
        )}

        <div className="relative flex items-center justify-center">
          <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
            <circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
              fill="none" stroke="currentColor" strokeWidth={STROKE}
              className="text-wood-light"
            />
            <circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
              fill="none" stroke="currentColor" strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="text-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <span className="absolute font-mono text-5xl text-ink tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button
            onClick={keepGoing}
            className="px-8 py-3 rounded-xl bg-primary text-white font-body text-lg tracking-wide hover:bg-primary-dark transition-all shadow-soft"
          >
            Keep going +
          </button>
          <button
            onClick={() => { setTimerActive(false); setFinished(true); }}
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
    5: renderStep5,
    6: renderStep6,
    7: renderStep7,
  };

  /* ── Progress ───────────────────────────────────────────────────── */

  const totalSteps = 7;
  const displayStep = Math.min(step, 6);

  /* ── Main render ────────────────────────────────────────────────── */

  return (
    <div className="fixed inset-0 z-50 bg-paper flex flex-col">
      {closeButton}

      {/* Progress bar */}
      {step <= 6 && (
        <div className="px-8 pt-6">
          <div className="h-0.5 w-full max-w-lg mx-auto bg-wood-light/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/50 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((displayStep + 1) / (totalSteps + 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Step content */}
      <div
        className="flex-1 flex items-center justify-center transition-opacity duration-200 overflow-y-auto py-8"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {steps[step]()}
      </div>

      {/* Back button (steps 1-5, not on commit screen) */}
      {step >= 1 && step <= 5 && (
        <div className="px-8 pb-6">
          <button
            onClick={() => goToStep(step - 1)}
            className="flex items-center gap-1 text-pencil hover:text-ink transition-colors font-body text-sm"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default ProcrastinationUnpacker;
