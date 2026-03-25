import { useState, useEffect, useRef, useCallback } from 'react';

/* ══════════════════════════════════════════════════════════════════════
   CelestialHearth — Post-ketamine integration session (12–15 min)

   Evidence base:
   - Cognitive Bias Modification (CBM-I): repeatedly pairing self-referential
     words with positive attributes shifts implicit self-concept
     (Clerkin & Teachman 2010, Beard et al. 2012)
   - Breathing: 4-4-6 pattern activates parasympathetic nervous system
   - Expressive writing: Pennebaker's paradigm for belief release
   - Behavioral activation: concrete micro-commitments prevent insight fade

   Design contract:
   - Full-screen dark overlay with warm gold/amber accents
   - All transitions are slow crossfades (600-1000ms)
   - Nothing persists. No localStorage. No network calls.
   - No clinical language in the UI.
   ══════════════════════════════════════════════════════════════════════ */

interface CelestialHearthProps {
  onClose: () => void;
}

// ── Data ─────────────────────────────────────────────────────────────

const SELF_WORDS = ['I', 'me', 'mine', 'myself', 'I am', "I'm"];

const POSITIVE_WORDS = [
  'worthy', 'safe', 'enough', 'loved', 'capable', 'strong',
  'whole', 'good', 'resilient', 'brave', 'real', 'here',
  'free', 'becoming', 'alive',
];

const ACTIVATION_OPTIONS = [
  'go for a walk',
  'listen to music',
  'cook something good',
  'call someone I like',
  'sit in the sun',
  'take a long shower',
];

// ── Helpers ──────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Phase durations for progress bar (seconds)
const PHASE_DURATIONS = {
  breathing: 60,
  sorting: 480,
  journaling: 240,
  closing: 60,
};
const TOTAL_DURATION = Object.values(PHASE_DURATIONS).reduce((a, b) => a + b, 0);

type Phase = 'breathing' | 'sorting' | 'journaling-release' | 'journaling-reframe' | 'closing-activate' | 'closing-final';

// ── Component ────────────────────────────────────────────────────────

export default function CelestialHearth({ onClose }: CelestialHearthProps) {
  const [phase, setPhase] = useState<Phase>('breathing');
  const [fade, setFade] = useState(true); // true = visible
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Progress bar — update every second
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setProgress(Math.min(elapsed / TOTAL_DURATION, 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Phase transition helper
  const transitionTo = useCallback((next: Phase) => {
    setFade(false);
    setTimeout(() => {
      setPhase(next);
      setFade(true);
    }, 700);
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ backgroundColor: '#0f131f' }}>
      {/* ── Progress bar ───────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 w-full h-[2px] z-50">
        <div
          className="h-full transition-all duration-1000 ease-out"
          style={{
            width: `${progress * 100}%`,
            background: 'linear-gradient(to right, transparent, #e9c349)',
            boxShadow: '0 0 15px rgba(233,195,73,0.3)',
          }}
        />
      </div>

      {/* ── Brand ──────────────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 w-full z-40 px-8 py-6 flex items-center justify-between">
        <span
          className="text-lg tracking-wide italic"
          style={{ fontFamily: 'Georgia, "Noto Serif", serif', color: 'rgba(233,195,73,0.8)' }}
        >
          The Celestial Hearth
        </span>
        <button
          onClick={onClose}
          className="text-xs uppercase tracking-[0.2em] transition-colors duration-500"
          style={{ color: 'rgba(144,144,151,0.5)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(233,195,73,0.8)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(144,144,151,0.5)')}
        >
          exit
        </button>
      </header>

      {/* ── Main content ───────────────────────────────────────────── */}
      <main
        className="flex-1 flex items-center justify-center px-6 transition-opacity"
        style={{
          opacity: fade ? 1 : 0,
          transitionDuration: '700ms',
        }}
      >
        {phase === 'breathing' && (
          <BreathingPhase onComplete={() => transitionTo('sorting')} />
        )}
        {phase === 'sorting' && (
          <SortingPhase onComplete={() => transitionTo('journaling-release')} />
        )}
        {phase === 'journaling-release' && (
          <JournalingPhase
            prompt="A belief I carried about myself that I'm ready to let go of..."
            onContinue={() => transitionTo('journaling-reframe')}
          />
        )}
        {phase === 'journaling-reframe' && (
          <JournalingPhase
            prompt="What I know instead..."
            onContinue={() => transitionTo('closing-activate')}
          />
        )}
        {phase === 'closing-activate' && (
          <ClosingActivate onSelect={() => transitionTo('closing-final')} />
        )}
        {phase === 'closing-final' && (
          <ClosingFinal />
        )}
      </main>

      {/* ── Ambient glow ───────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(233,195,73,0.03) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Film grain overlay ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03] mix-blend-overlay">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="celestial-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#celestial-noise)" />
        </svg>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Phase 1: BREATHING — 4 cycles of 4s inhale + 4s hold + 6s exhale
   ═══════════════════════════════════════════════════════════════════════ */

function BreathingPhase({ onComplete }: { onComplete: () => void }) {
  const [showIntro, setShowIntro] = useState(true);
  const [breathState, setBreathState] = useState<'in' | 'hold' | 'out'>('in');
  const [cycle, setCycle] = useState(0);
  const [scale, setScale] = useState(1);
  const totalCycles = 4;

  useEffect(() => {
    // Show intro for 2s, then start breathing
    const introTimer = setTimeout(() => setShowIntro(false), 2000);
    return () => clearTimeout(introTimer);
  }, []);

  useEffect(() => {
    if (showIntro) return;
    if (cycle >= totalCycles) {
      // Finished all cycles — wait 1s then advance
      const done = setTimeout(onComplete, 1000);
      return () => clearTimeout(done);
    }

    // Inhale: 4s
    setBreathState('in');
    setScale(1.4);
    const holdTimer = setTimeout(() => {
      // Hold: 4s
      setBreathState('hold');
      const exhaleTimer = setTimeout(() => {
        // Exhale: 6s
        setBreathState('out');
        setScale(1.0);
        const nextTimer = setTimeout(() => {
          setCycle(c => c + 1);
        }, 6000);
        return () => clearTimeout(nextTimer);
      }, 4000);
      return () => clearTimeout(exhaleTimer);
    }, 4000);

    return () => clearTimeout(holdTimer);
  }, [showIntro, cycle, onComplete]);

  const breathText = breathState === 'in' ? 'breathe in' : breathState === 'hold' ? 'hold' : 'breathe out';
  const transitionDuration = breathState === 'in' ? '4s' : breathState === 'out' ? '6s' : '0s';

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-[520px]">
      {showIntro ? (
        <h1
          className="text-3xl md:text-4xl italic tracking-tight"
          style={{
            fontFamily: 'Georgia, "Noto Serif", serif',
            color: 'rgba(221,194,163,0.9)',
            animation: 'celestialFadeIn 1s ease-out',
          }}
        >
          Let's start with a few breaths
        </h1>
      ) : (
        <div className="relative flex flex-col items-center gap-16">
          {/* Outer glow */}
          <div
            className="absolute w-[240px] h-[240px] rounded-full blur-3xl"
            style={{ backgroundColor: 'rgba(233,195,73,0.05)' }}
          />
          {/* Breathing circle */}
          <div
            className="w-[200px] h-[200px] rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(233,195,73,0.15)',
              transform: `scale(${scale})`,
              transition: `transform ${transitionDuration} ease-in-out`,
            }}
          />
          {/* Breath cue */}
          <p
            className="text-sm uppercase tracking-[0.3em]"
            style={{ color: 'rgba(223,226,243,0.4)', fontFamily: 'Manrope, sans-serif' }}
          >
            {breathText}
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Phase 2: SORTING — Implicit association word-pairing (~80-90 pairs)
   ═══════════════════════════════════════════════════════════════════════ */

function SortingPhase({ onComplete }: { onComplete: () => void }) {
  const [pairIndex, setPairIndex] = useState(0);
  const [showPositive, setShowPositive] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const [blank, setBlank] = useState(false);
  const [selfWord, setSelfWord] = useState('');
  const [positiveWord, setPositiveWord] = useState('');
  const [nudge, setNudge] = useState(false);

  const positivePoolRef = useRef<string[]>(shuffle(POSITIVE_WORDS));
  const poolIndexRef = useRef(0);
  const phaseStartRef = useRef(Date.now());
  const maxPairs = 90;
  const maxTime = 8 * 60 * 1000; // 8 minutes
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getNextPositive = useCallback(() => {
    if (poolIndexRef.current >= positivePoolRef.current.length) {
      positivePoolRef.current = shuffle(POSITIVE_WORDS);
      poolIndexRef.current = 0;
    }
    const word = positivePoolRef.current[poolIndexRef.current];
    poolIndexRef.current++;
    return word;
  }, []);

  const getNextSelf = useCallback(() => {
    return SELF_WORDS[Math.floor(Math.random() * SELF_WORDS.length)];
  }, []);

  // Self-word display time decreases as pairs progress
  const selfWordDuration = useCallback((pair: number) => {
    const min = 350, max = 600;
    const t = Math.min(pair / 50, 1);
    return max - t * (max - min);
  }, []);

  // Start a new pair
  const startPair = useCallback((pair: number) => {
    const elapsed = Date.now() - phaseStartRef.current;
    if (pair >= maxPairs || elapsed >= maxTime) {
      // Phase complete
      setTimeout(onComplete, 1500);
      return;
    }

    setBlank(false);
    setGlowing(false);
    setShowPositive(false);
    setNudge(false);

    const sw = getNextSelf();
    const pw = getNextPositive();
    setSelfWord(sw);
    setPositiveWord(pw);

    // Show self-word, then crossfade to positive
    const duration = selfWordDuration(pair);
    setTimeout(() => {
      setShowPositive(true);
      // Start nudge timer
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = setTimeout(() => setNudge(true), 5000);
    }, duration);
  }, [getNextSelf, getNextPositive, selfWordDuration, onComplete]);

  // Start first pair
  useEffect(() => {
    startPair(0);
    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle tap/confirmation
  const handleConfirm = useCallback(() => {
    if (!showPositive || glowing || blank) return;

    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    setNudge(false);
    setGlowing(true);

    setTimeout(() => {
      setBlank(true);
      setTimeout(() => {
        const next = pairIndex + 1;
        setPairIndex(next);
        startPair(next);
      }, 300);
    }, 600);
  }, [showPositive, glowing, blank, pairIndex, startPair]);

  // Keyboard: spacebar / right arrow
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleConfirm]);

  if (blank) {
    return <div className="w-full max-w-[520px]" />;
  }

  return (
    <div
      className="flex flex-col items-center justify-center text-center w-full max-w-[520px] cursor-pointer select-none"
      onClick={handleConfirm}
      role="button"
      tabIndex={0}
    >
      <div className="relative flex flex-col items-center gap-12">
        {/* Glow effect on confirm */}
        {glowing && (
          <div
            className="absolute w-48 h-48 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(233,195,73,0.15) 0%, transparent 70%)',
              animation: 'celestialGlowPulse 0.6s ease-out forwards',
            }}
          />
        )}

        {/* Word display */}
        <h1
          className="text-4xl italic transition-all"
          style={{
            fontFamily: 'Georgia, "Noto Serif", serif',
            color: showPositive ? '#e9c349' : 'rgba(223,226,243,0.95)',
            transitionDuration: '600ms',
            transform: glowing ? 'scale(1.08)' : 'scale(1)',
            opacity: glowing ? 0 : 1,
          }}
        >
          {showPositive ? positiveWord : selfWord}
        </h1>

        {/* Tap prompt */}
        {showPositive && !glowing && (
          <p
            className="text-xs uppercase tracking-[0.2em] transition-opacity duration-500"
            style={{
              color: 'rgba(223,226,243,0.4)',
              fontFamily: 'Manrope, sans-serif',
              opacity: nudge ? 0.7 : 0.4,
              animation: nudge ? 'celestialNudge 1.5s ease-in-out infinite' : 'none',
            }}
          >
            tap to take this
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Phase 3: JOURNALING — Release prompt then Reframe prompt
   ═══════════════════════════════════════════════════════════════════════ */

function JournalingPhase({ prompt, onContinue }: { prompt: string; onContinue: () => void }) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      onContinue();
    }
  };

  return (
    <div className="w-full max-w-[520px] flex flex-col items-center space-y-12">
      <h1
        className="text-3xl md:text-4xl italic leading-snug text-center"
        style={{
          fontFamily: 'Georgia, "Noto Serif", serif',
          color: 'rgba(223,226,243,0.95)',
          animation: 'celestialFadeIn 1s ease-out',
        }}
      >
        {prompt}
      </h1>

      <div className="w-full">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="write freely — no one sees this but you"
          spellCheck={false}
          className="w-full bg-transparent border-0 border-b resize-none text-xl leading-relaxed py-4 placeholder:italic focus:outline-none focus:ring-0 min-h-[160px]"
          style={{
            fontFamily: 'Georgia, "Noto Serif", serif',
            color: 'rgba(250,222,189,0.85)',
            borderColor: 'rgba(70,70,76,0.3)',
            caretColor: '#e9c349',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(233,195,73,0.3)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(70,70,76,0.3)')}
        />
      </div>

      <button
        onClick={onContinue}
        className="flex items-center gap-3 text-sm uppercase tracking-widest py-4 px-8 group transition-colors duration-700"
        style={{ color: '#e9c349', fontFamily: 'Manrope, sans-serif' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#ffdfa0')}
        onMouseLeave={e => (e.currentTarget.style.color = '#e9c349')}
      >
        continue
        <span
          className="material-symbols-outlined transition-transform duration-500 group-hover:translate-x-2"
          style={{ fontSize: '18px' }}
        >
          arrow_forward
        </span>
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Phase 4a: CLOSING — Behavioral activation selection
   ═══════════════════════════════════════════════════════════════════════ */

function ClosingActivate({ onSelect }: { onSelect: () => void }) {
  const [customText, setCustomText] = useState('');

  const handlePick = () => {
    // Brief glow then advance
    setTimeout(onSelect, 400);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePick();
  };

  return (
    <div
      className="w-full max-w-[520px] flex flex-col items-center space-y-10"
      style={{ animation: 'celestialFadeIn 1s ease-out' }}
    >
      <h1
        className="text-3xl md:text-4xl italic leading-snug text-center"
        style={{
          fontFamily: 'Georgia, "Noto Serif", serif',
          color: 'rgba(223,226,243,0.95)',
        }}
      >
        One small thing I'll do for myself today.
      </h1>

      <div className="grid grid-cols-2 gap-3 w-full">
        {ACTIVATION_OPTIONS.map(option => (
          <button
            key={option}
            onClick={handlePick}
            className="py-3.5 px-5 rounded-2xl text-base transition-all duration-500 text-left"
            style={{
              fontFamily: 'Georgia, "Noto Serif", serif',
              color: 'rgba(223,226,243,0.8)',
              backgroundColor: 'rgba(49,52,66,0.5)',
              border: '1px solid rgba(70,70,76,0.3)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(233,195,73,0.15)';
              e.currentTarget.style.borderColor = 'rgba(233,195,73,0.3)';
              e.currentTarget.style.color = '#e9c349';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(49,52,66,0.5)';
              e.currentTarget.style.borderColor = 'rgba(70,70,76,0.3)';
              e.currentTarget.style.color = 'rgba(223,226,243,0.8)';
            }}
          >
            {option}
          </button>
        ))}
      </div>

      <form onSubmit={handleCustomSubmit} className="w-full">
        <input
          type="text"
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          placeholder="or something else..."
          className="w-full bg-transparent border-0 border-b text-base py-3 placeholder:italic focus:outline-none focus:ring-0"
          style={{
            fontFamily: 'Manrope, sans-serif',
            color: 'rgba(250,222,189,0.85)',
            borderColor: 'rgba(70,70,76,0.3)',
            caretColor: '#e9c349',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(233,195,73,0.3)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(70,70,76,0.3)')}
        />
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Phase 4b: CLOSING — Final screen
   ═══════════════════════════════════════════════════════════════════════ */

function ClosingFinal() {
  const [showSubtext, setShowSubtext] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSubtext(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="w-full max-w-[520px] flex flex-col items-center text-center space-y-12"
      style={{ animation: 'celestialFadeIn 1s ease-out' }}
    >
      {/* Soft glow behind text */}
      <div className="relative inline-block">
        <div
          className="absolute inset-0 blur-2xl scale-150"
          style={{ backgroundColor: 'rgba(233,195,73,0.1)' }}
        />
        <h1
          className="relative text-5xl md:text-6xl leading-tight"
          style={{
            fontFamily: 'Georgia, "Noto Serif", serif',
            color: '#e9c349',
            textShadow: '0 0 60px rgba(233,195,73,0.15)',
          }}
        >
          You did this.<br />
          <span className="italic" style={{ opacity: 0.9 }}>That's enough.</span>
        </h1>
      </div>

      <p
        className="text-xs uppercase tracking-[0.25em] max-w-[300px] leading-relaxed transition-opacity duration-1000"
        style={{
          fontFamily: 'Manrope, sans-serif',
          color: 'rgba(199,198,205,0.4)',
          opacity: showSubtext ? 1 : 0,
        }}
      >
        you can close this tab whenever you're ready.
      </p>
    </div>
  );
}
