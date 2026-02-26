import { useState, useEffect, useRef, type ReactElement } from 'react';
import type { RapidLogEntry, DayDebrief as DayDebriefType } from '../context/AppContext';

/* ── Types ────────────────────────────────────────────────────────── */

interface DayDebriefProps {
  todayEntries: RapidLogEntry[];
  date: string;           // YYYY-MM-DD — stable date from parent, not re-computed
  onSave: (debrief: DayDebriefType) => void;
  onSkip: () => void;
}

/* ── Constants ────────────────────────────────────────────────────── */

const REALISM_OPTIONS = [
  { value: 1, label: 'Way too little', color: 'bg-sage text-white' },
  { value: 2, label: 'A bit light', color: 'bg-sage/50 text-ink' },
  { value: 3, label: 'Just right', color: 'bg-primary text-white' },
  { value: 4, label: 'Ambitious', color: 'bg-bronze text-white' },
  { value: 5, label: 'Way too much', color: 'bg-tension text-white' },
];

const ACCOMPLISHMENT_OPTIONS = [
  { value: 1, label: 'Almost nothing' },
  { value: 2, label: 'A little' },
  { value: 3, label: 'About half' },
  { value: 4, label: 'Most of it' },
  { value: 5, label: 'Everything' },
];

const MOOD_OPTIONS = [
  { key: 'struggling', icon: 'sentiment_very_dissatisfied', label: 'Struggling' },
  { key: 'tough', icon: 'sentiment_dissatisfied', label: 'Tough' },
  { key: 'okay', icon: 'sentiment_neutral', label: 'Okay' },
  { key: 'good', icon: 'sentiment_satisfied', label: 'Good' },
  { key: 'great', icon: 'sentiment_very_satisfied', label: 'Great' },
];

/* ── Message generation ───────────────────────────────────────────── */

function getContextualMessage(
  planRealism: number,
  accomplishment: number,
  mood: string,
  completedCount: number,
): string {
  // No-plan path — planRealism === 0
  if (planRealism === 0) {
    if (mood === 'great' || mood === 'good') {
      return 'No plan, and it still went well. Sometimes winging it works.';
    }
    if (mood === 'okay') {
      return 'No plan today. That happens. Tomorrow you could try writing down just 3 things.';
    }
    if (mood === 'tough') {
      return "Unplanned days can feel chaotic. Even a rough list helps. But you're here reflecting — that counts.";
    }
    if (mood === 'struggling') {
      return "Rough day without a plan. That's a hard combo. Tomorrow, write down one small thing before the day starts.";
    }
    return 'No plan is fine sometimes. Noticing it is the first step.';
  }

  // High accomplishment (4-5) messages
  if (accomplishment >= 4 && planRealism >= 3) {
    return `You finished ${completedCount} task${completedCount !== 1 ? 's' : ''}. That's real momentum.`;
  }
  if (accomplishment >= 4 && planRealism <= 2) {
    return 'You exceeded what you planned. That quiet confidence adds up.';
  }
  if (accomplishment === 5) {
    return 'Everything done. Take that in for a second.';
  }

  // High plan realism + high accomplishment
  if (planRealism === 3 && accomplishment >= 4) {
    return 'When the plan fits, things flow. Nice work.';
  }

  // Low accomplishment + plan too ambitious
  if (accomplishment <= 2 && planRealism >= 4) {
    return "Planning less tomorrow isn't giving up. It's being smart.";
  }
  if (accomplishment <= 2 && planRealism === 5) {
    return 'The plan was heavy. Adjusting expectations is a skill, not a failure.';
  }

  // Low accomplishment + low mood
  if (accomplishment <= 2 && (mood === 'struggling' || mood === 'tough')) {
    return 'Hard days happen. You showed up by reflecting. That matters.';
  }
  if (accomplishment === 1 && mood === 'struggling') {
    return "Some days are just about getting through. You're still here.";
  }

  // Low mood regardless of accomplishment
  if (mood === 'struggling') {
    return 'Rough one. Be gentle with yourself tonight.';
  }
  if (mood === 'tough' && accomplishment >= 3) {
    return 'You pushed through a tough day and still got things done. That takes grit.';
  }

  // Medium everything
  if (accomplishment === 3 && planRealism === 3 && mood === 'okay') {
    return 'A solid day. Not every day needs to be exceptional.';
  }
  if (accomplishment === 3 && planRealism === 3) {
    return 'Right down the middle. Steady days build steady lives.';
  }

  // Good mood messages
  if (mood === 'great' && accomplishment >= 3) {
    return "Feeling good and getting things done. That's the sweet spot.";
  }
  if (mood === 'great') {
    return "A good feeling is its own kind of win. Hold onto that.";
  }
  if (mood === 'good') {
    return 'Good day. Let tomorrow build on this one.';
  }

  // Default fallback
  return "You did what you could. That's always enough.";
}

/* ── Component ────────────────────────────────────────────────────── */

const DayDebrief = ({ todayEntries, date, onSave, onSkip }: DayDebriefProps) => {
  /* ── State ─────────────────────────────────────────────────────── */
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [planRealism, setPlanRealism] = useState(0);
  const [accomplishment, setAccomplishment] = useState(0);
  const [mood, setMood] = useState('');
  const [reflection, setReflection] = useState('');
  const [saved, setSaved] = useState(false);

  /* fade transition */
  const [visible, setVisible] = useState(true);
  const pendingStep = useRef<(0 | 1 | 2 | 3) | null>(null);

  /* ── Derived ───────────────────────────────────────────────────── */

  const todayTasks = todayEntries.filter(
    (e) => e.type === 'task' && e.date === date
  );
  const completedCount = todayTasks.filter((t) => t.status === 'done').length;
  const totalCount = todayTasks.length;

  /* ── Step transitions ──────────────────────────────────────────── */

  const goToStep = (next: 0 | 1 | 2 | 3) => {
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

  /* ── Handlers ──────────────────────────────────────────────────── */

  const handleRealismSelect = (value: number) => {
    setPlanRealism(value);
    setTimeout(() => goToStep(1), 300);
  };

  const handleNoPlan = () => {
    setPlanRealism(0); // 0 = no plan
    setTimeout(() => goToStep(2), 300); // skip accomplishment, go straight to mood
  };

  const handleAccomplishmentSelect = (value: number) => {
    setAccomplishment(value);
    setTimeout(() => goToStep(2), 300);
  };

  const handleMoodSelect = (key: string) => {
    setMood(key);
    setTimeout(() => goToStep(3), 300);
  };

  const handleSave = () => {
    onSave({
      date,
      planRealism,
      accomplishment,
      mood,
      reflection: reflection.trim() || undefined,
    });
    setSaved(true);
  };

  /* ── Saved confirmation ────────────────────────────────────────── */

  if (saved) {
    return (
      <div className="bg-surface-light border border-wood-light/30 rounded-2xl p-6 sm:p-8 shadow-soft text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-sage">
          check_circle
        </span>
        <p className="font-display italic text-xl text-ink">Saved &#10003;</p>
      </div>
    );
  }

  /* ── Render: Step 0 — Plan realism ─────────────────────────────── */

  const renderStep0 = () => (
    <div className="space-y-5">
      <p className="font-display italic text-xl text-ink text-center leading-snug">
        How realistic was your plan today?
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {REALISM_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleRealismSelect(option.value)}
            className={`px-4 py-2.5 rounded-full font-body text-sm transition-all duration-200 ${
              planRealism === option.value
                ? `${option.color} shadow-md scale-105`
                : 'bg-wood-light/30 text-ink hover:bg-wood-light/60 border border-wood-light/50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex justify-center pt-2">
        <button
          onClick={handleNoPlan}
          className="font-body text-sm text-pencil/60 hover:text-ink transition-colors underline underline-offset-4 decoration-pencil/20 hover:decoration-pencil/40"
        >
          I didn&rsquo;t have a plan today
        </button>
      </div>
    </div>
  );

  /* ── Render: Step 1 — Accomplishment ───────────────────────────── */

  const renderStep1 = () => (
    <div className="space-y-5">
      <p className="font-display italic text-xl text-ink text-center leading-snug">
        How much did you get done?
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {ACCOMPLISHMENT_OPTIONS.map((option) => {
          const isSelected = accomplishment === option.value;
          return (
            <button
              key={option.value}
              onClick={() => handleAccomplishmentSelect(option.value)}
              className={`px-4 py-2.5 rounded-full font-body text-sm transition-all duration-200 ${
                isSelected
                  ? 'bg-primary text-white shadow-md scale-105'
                  : 'bg-wood-light/30 text-ink hover:bg-wood-light/60 border border-wood-light/50'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ── Render: Step 2 — Mood ─────────────────────────────────────── */

  const renderStep2 = () => (
    <div className="space-y-5">
      <p className="font-display italic text-xl text-ink text-center leading-snug">
        How do you feel about today?
      </p>
      <div className="flex justify-center gap-3 sm:gap-5">
        {MOOD_OPTIONS.map((option) => {
          const isSelected = mood === option.key;
          return (
            <button
              key={option.key}
              onClick={() => handleMoodSelect(option.key)}
              className="flex flex-col items-center gap-1.5 group/mood"
            >
              <div
                className={`size-14 sm:size-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary/15 border-2 border-primary scale-110'
                    : 'bg-wood-light/30 border-2 border-transparent hover:bg-wood-light/50 hover:scale-105'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-2xl sm:text-3xl transition-colors ${
                    isSelected ? 'text-primary' : 'text-ink/60 group-hover/mood:text-ink'
                  }`}
                >
                  {option.icon}
                </span>
              </div>
              <span
                className={`font-mono text-[10px] uppercase tracking-wider transition-colors ${
                  isSelected ? 'text-primary font-medium' : 'text-pencil'
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ── Render: Step 3 — Summary + message ────────────────────────── */

  const contextMessage = getContextualMessage(
    planRealism,
    accomplishment,
    mood,
    completedCount,
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Contextual message */}
      <div className="text-center space-y-3 py-2">
        <p className="font-display italic text-2xl text-ink leading-relaxed px-4">
          {contextMessage}
        </p>
      </div>

      {/* Optional reflection */}
      <div className="space-y-2">
        <label className="block font-handwriting text-sm text-accent">
          Anything else about today?
        </label>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Optional..."
          rows={3}
          className="w-full rounded-xl border-2 border-wood-light bg-white/60 px-4 py-3 font-body text-ink text-base placeholder:text-pencil/40 placeholder:italic focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onSkip}
          className="font-body text-sm text-pencil hover:text-ink transition-colors underline underline-offset-2 decoration-pencil/30"
        >
          Skip
        </button>
        <button
          onClick={handleSave}
          className="px-8 py-3 rounded-xl bg-primary text-white font-body text-base tracking-wide hover:bg-primary-dark transition-all shadow-soft"
        >
          Save reflection
        </button>
      </div>
    </div>
  );

  /* ── Step router ───────────────────────────────────────────────── */

  const steps: Record<number, () => ReactElement> = {
    0: renderStep0,
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
  };

  /* ── Main render ───────────────────────────────────────────────── */

  return (
    <div className="bg-surface-light border border-wood-light/30 rounded-2xl p-6 sm:p-8 shadow-soft">
      {/* Header: stats bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-wood-light/30">
        {planRealism === 0 ? (
          <p className="font-body text-ink text-base">
            No plan today &mdash; that&rsquo;s okay. Let&rsquo;s check in on how you&rsquo;re feeling.
          </p>
        ) : (
          <p className="font-body text-ink text-base">
            You planned{' '}
            <span className="font-semibold">{totalCount}</span> task
            {totalCount !== 1 ? 's' : ''} today. You completed{' '}
            <span className="font-semibold text-primary">{completedCount}</span>.
          </p>
        )}
        {planRealism !== 0 && (
          <span className="font-mono text-sm text-pencil tabular-nums ml-3 flex-shrink-0">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {/* Step content with fade transition */}
      <div
        className="transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {steps[step]()}
      </div>
    </div>
  );
};

export default DayDebrief;
