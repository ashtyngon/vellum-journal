import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from 'react';
import type { JournalStep } from '../context/AppContext';

/* ── Types ────────────────────────────────────────────────────────── */

interface MethodStepDef {
  prompt: string;
  placeholder?: string;
  inputType?: 'textarea' | 'slider' | 'select' | 'body-picker';
  options?: string[];
  min?: number;
  max?: number;
}

interface JournalWalkthroughProps {
  methodId: string;
  methodName: string;
  steps: MethodStepDef[];
  onComplete: (answers: JournalStep[], discovery?: string) => void;
  onCancel: () => void;
}

/* ── Body areas for the body-picker variant ───────────────────────── */

const BODY_AREAS = [
  'Head', 'Forehead', 'Jaw', 'Throat',
  'Neck', 'Shoulders', 'Upper Back', 'Lower Back',
  'Chest', 'Stomach', 'Hips', 'Arms',
  'Hands', 'Legs', 'Knees', 'Feet',
];

/* ── Component ────────────────────────────────────────────────────── */

export default function JournalWalkthrough({
  methodId,
  methodName,
  steps,
  onComplete,
  onCancel,
}: JournalWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => steps.map(() => ''));
  const [discovery, setDiscovery] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const [visible, setVisible] = useState(true);
  const [showReveal, setShowReveal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  const totalSteps = steps.length;
  const step = steps[currentStep];
  const currentAnswer = answers[currentStep] ?? '';

  /* ── Auto-focus textarea on step change ─────────────────────────── */

  useEffect(() => {
    if (!showReveal && !transitioning && step?.inputType !== 'slider') {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentStep, showReveal, transitioning, step?.inputType]);

  /* ── Scroll reveal to top when entering reveal screen ───────────── */

  useEffect(() => {
    if (showReveal && revealRef.current) {
      revealRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showReveal]);

  /* ── Update a single answer ─────────────────────────────────────── */

  const setAnswer = useCallback((index: number, value: string) => {
    setAnswers(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  /* ── Step transitions ───────────────────────────────────────────── */

  const transitionTo = useCallback((nextFn: () => void) => {
    setVisible(false);
    setTransitioning(true);
    setTimeout(() => {
      nextFn();
      // Allow a frame for React to render the new step before fading in
      requestAnimationFrame(() => {
        setVisible(true);
        setTransitioning(false);
      });
    }, 150);
  }, []);

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      transitionTo(() => setCurrentStep(s => s + 1));
    } else {
      // Last step — transition to reveal
      transitionTo(() => setShowReveal(true));
    }
  }, [currentStep, totalSteps, transitionTo]);

  const goBack = useCallback(() => {
    if (showReveal) {
      transitionTo(() => {
        setShowReveal(false);
        setCurrentStep(totalSteps - 1);
      });
    } else if (currentStep > 0) {
      transitionTo(() => setCurrentStep(s => s - 1));
    }
  }, [currentStep, showReveal, totalSteps, transitionTo]);

  /* ── Keyboard handling for textarea ─────────────────────────────── */

  const handleTextareaKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentAnswer.trim()) {
        goNext();
      }
    }
  }, [currentAnswer, goNext]);

  /* ── Check if current input has content ─────────────────────────── */

  const hasContent = (() => {
    if (!step) return false;
    if (step.inputType === 'slider') return true; // sliders always have a value
    return currentAnswer.trim().length > 0;
  })();

  /* ── Save handler ───────────────────────────────────────────────── */

  const handleSave = useCallback(() => {
    const journalSteps: JournalStep[] = steps.map((s, i) => ({
      prompt: s.prompt,
      answer: answers[i] || '',
    }));
    onComplete(journalSteps, discovery.trim() || undefined);
  }, [steps, answers, discovery, onComplete]);

  /* ── Render helpers ─────────────────────────────────────────────── */

  const renderInput = () => {
    if (!step) return null;

    switch (step.inputType) {
      case 'slider': {
        const min = step.min ?? 0;
        const max = step.max ?? 100;
        const value = currentAnswer ? Number(currentAnswer) : Math.round((min + max) / 2);
        return (
          <div className="w-full max-w-md mx-auto mt-8 space-y-4">
            <div className="flex items-center justify-center">
              <span className="text-4xl font-display font-semibold text-primary tabular-nums">
                {value}
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              value={value}
              onChange={e => setAnswer(currentStep, e.target.value)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer
                         bg-wood-light accent-primary
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-primary
                         [&::-webkit-slider-thumb]:shadow-md
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:transition-transform
                         [&::-webkit-slider-thumb]:hover:scale-110"
            />
            <div className="flex justify-between text-xs font-mono text-pencil">
              <span>{min}</span>
              <span>{max}</span>
            </div>
          </div>
        );
      }

      case 'select':
      case 'body-picker': {
        const options = step.inputType === 'body-picker' ? BODY_AREAS : (step.options ?? []);
        return (
          <div className="w-full max-w-lg mx-auto mt-8">
            <div className="flex flex-wrap justify-center gap-2">
              {options.map(option => {
                const isSelected = currentAnswer === option;
                return (
                  <button
                    key={option}
                    onClick={() => setAnswer(currentStep, isSelected ? '' : option)}
                    className={`px-4 py-2 rounded-full text-sm font-body transition-all duration-150
                      ${isSelected
                        ? 'bg-primary text-white shadow-md scale-105'
                        : 'bg-surface-light text-ink hover:bg-wood-light/60 border border-wood-light/50'
                      }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      default: {
        // textarea (default)
        return (
          <div className="w-full max-w-xl mx-auto mt-8">
            <textarea
              ref={textareaRef}
              value={currentAnswer}
              onChange={e => setAnswer(currentStep, e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={step.placeholder || 'Write your thoughts...'}
              rows={4}
              className="w-full min-h-[120px] resize-none bg-transparent
                         font-body text-lg text-ink leading-relaxed
                         placeholder:text-pencil/50 placeholder:italic
                         border-0 border-b-2 border-wood-light
                         focus:border-primary focus:outline-none
                         transition-colors duration-300 p-3"
            />
            <p className="text-xs font-mono text-pencil/50 mt-2 text-right">
              Shift + Enter for new line &middot; Enter to continue
            </p>
          </div>
        );
      }
    }
  };

  /* ── Reveal: method-specific layouts ────────────────────────────── */

  const renderRevealCards = () => {
    const journalSteps = steps.map((s, i) => ({
      prompt: s.prompt,
      answer: answers[i] || '',
      inputType: s.inputType,
    }));

    // Pattern Breaker: side-by-side comparison for steps 1 and 5
    if (methodId === 'pattern-breaker' && journalSteps.length >= 5) {
      const storyStep = journalSteps[0];
      const factsStep = journalSteps[4];
      const otherSteps = journalSteps.filter((_, i) => i !== 0 && i !== 4);

      return (
        <>
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-5 rounded-xl bg-tension/5 border border-tension/20">
              <p className="font-handwriting text-sm text-tension mb-2">{storyStep.prompt}</p>
              <p className="font-body text-ink leading-relaxed">{storyStep.answer}</p>
            </div>
            <div className="p-5 rounded-xl bg-sage/10 border border-sage/30">
              <p className="font-handwriting text-sm text-sage mb-2">{factsStep.prompt}</p>
              <p className="font-body text-ink leading-relaxed">{factsStep.answer}</p>
            </div>
          </div>
          {/* Remaining steps */}
          {otherSteps.map((s, i) => (
            <div key={i} className="py-4 border-b border-wood-light/30 last:border-0">
              <p className="font-handwriting text-pencil text-sm mb-1">{s.prompt}</p>
              <p className="font-body text-ink leading-relaxed">{s.answer}</p>
            </div>
          ))}
        </>
      );
    }

    // Thought Record: before/after emotion ratings
    if (methodId === 'thought-record') {
      return journalSteps.map((s, i) => {
        const isRating = s.inputType === 'slider';
        const value = isRating ? Number(s.answer) : null;

        return (
          <div key={i} className="py-4 border-b border-wood-light/30 last:border-0">
            <p className="font-handwriting text-pencil text-sm mb-1">{s.prompt}</p>
            {isRating && value !== null ? (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-2 rounded-full bg-wood-light overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${value}%`,
                      backgroundColor: value > 60 ? '#8fa88f' : value > 30 ? '#ec7f13' : '#C47C7C',
                    }}
                  />
                </div>
                <span className="font-mono text-sm text-ink font-semibold min-w-[2rem] text-right">
                  {value}
                </span>
              </div>
            ) : (
              <p className="font-body text-ink leading-relaxed">{s.answer}</p>
            )}
          </div>
        );
      });
    }

    // Positive Data Log: circular gauge for belief rating
    if (methodId === 'positive-data-log') {
      return journalSteps.map((s, i) => {
        const isRating = s.inputType === 'slider';
        const value = isRating ? Number(s.answer) : null;

        return (
          <div key={i} className="py-4 border-b border-wood-light/30 last:border-0">
            <p className="font-handwriting text-pencil text-sm mb-1">{s.prompt}</p>
            {isRating && value !== null ? (
              <div className="flex items-center justify-center my-4">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="#e8e0d5"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="#ec7f13"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(value / 100) * 264} 264`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-xl font-semibold text-ink">{value}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="font-body text-ink leading-relaxed">{s.answer}</p>
            )}
          </div>
        );
      });
    }

    // Default: simple stacked cards
    return journalSteps.map((s, i) => (
      <div key={i} className="py-4 border-b border-wood-light/30 last:border-0">
        <p className="font-handwriting text-pencil text-sm mb-1">{s.prompt}</p>
        <p className="font-body text-ink leading-relaxed whitespace-pre-wrap">{s.answer}</p>
      </div>
    ));
  };

  /* ── Main Render ────────────────────────────────────────────────── */

  // Transition classes
  const stepTransition = `transition-all duration-150 ease-out ${
    visible && !transitioning
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 translate-y-5'
  }`;

  /* ── Reveal Screen ──────────────────────────────────────────────── */

  if (showReveal) {
    return (
      <div className="fixed inset-0 z-50 bg-paper overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-wood-light/30">
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-pencil hover:text-ink transition-colors font-body text-sm"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back
          </button>
          <h2 className="font-header italic text-ink text-lg">{methodName}</h2>
          <button
            onClick={onCancel}
            className="text-pencil hover:text-ink transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable content */}
        <div
          ref={revealRef}
          className={`flex-1 overflow-y-auto px-6 py-8 ${stepTransition}`}
        >
          <div className="max-w-2xl mx-auto">
            {/* Section title */}
            <p className="font-mono text-xs text-pencil uppercase tracking-widest mb-6">
              Your Reflections
            </p>

            {/* Answer cards */}
            {renderRevealCards()}

            {/* Discovery textarea */}
            <div className="mt-10 pt-8 border-t border-wood-light/40">
              <label className="block font-display italic text-xl text-ink mb-4">
                What did you discover?
              </label>
              <textarea
                value={discovery}
                onChange={e => setDiscovery(e.target.value)}
                placeholder="An insight, a pattern, something that surprised you... (optional)"
                rows={3}
                className="w-full resize-none bg-transparent
                           font-body text-base text-ink leading-relaxed
                           placeholder:text-pencil/40 placeholder:italic
                           border-0 border-b-2 border-wood-light
                           focus:border-primary focus:outline-none
                           transition-colors duration-300 p-3"
              />
            </div>

            {/* Save button */}
            <div className="mt-8 pb-12 flex justify-center">
              <button
                onClick={handleSave}
                className="bg-primary text-white rounded-full px-10 py-3.5
                           font-body text-base font-medium
                           shadow-md hover:shadow-hover
                           hover:scale-[1.02] active:scale-[0.98]
                           transition-all duration-200"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step Screen ────────────────────────────────────────────────── */

  return (
    <div className="fixed inset-0 z-50 bg-paper flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Cancel */}
        <button
          onClick={onCancel}
          className="text-pencil hover:text-ink transition-colors"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Method name (centered) */}
        <h2 className="font-header italic text-pencil text-sm tracking-wide">
          {methodName}
        </h2>

        {/* Step counter */}
        <span className="font-mono text-xs text-pencil tabular-nums">
          {currentStep + 1} of {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-6">
        <div className="h-0.5 w-full bg-wood-light/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary/60 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Main content — vertically centered */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-y-auto">
        <div className={`w-full max-w-2xl ${stepTransition}`}>
          {/* Prompt */}
          <h3 className="font-display italic text-2xl sm:text-3xl text-ink text-center leading-snug px-4">
            {step?.prompt}
          </h3>

          {/* Input */}
          {renderInput()}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="px-6 py-5 flex items-center justify-between">
        {/* Back button */}
        <div className="w-24">
          {currentStep > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-pencil hover:text-ink
                         transition-colors font-body text-sm"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back
            </button>
          )}
        </div>

        {/* Next button */}
        <button
          onClick={goNext}
          disabled={!hasContent}
          className={`bg-primary text-white rounded-full px-8 py-3
                     font-body text-base font-medium
                     shadow-md transition-all duration-200
                     ${hasContent
                       ? 'hover:shadow-hover hover:scale-[1.02] active:scale-[0.98]'
                       : 'opacity-40 cursor-not-allowed'
                     }`}
        >
          {currentStep < totalSteps - 1 ? (
            <span className="flex items-center gap-1.5">
              Next
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              Review
              <span className="material-symbols-outlined text-lg">visibility</span>
            </span>
          )}
        </button>

        {/* Spacer for alignment */}
        <div className="w-24" />
      </div>
    </div>
  );
}
