import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getColorOfTheDay, getDailyCompanion } from '../lib/colorOfTheDay';
import { todayStr } from '../lib/dateUtils';

interface WalkthroughProps {
  onComplete: () => void;
}

const Walkthrough = ({ onComplete }: WalkthroughProps) => {
  const { addEntry } = useApp();
  const [step, setStep] = useState(0);
  const [taskText, setTaskText] = useState('');
  const [taskAdded, setTaskAdded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const dailyColor = getColorOfTheDay(todayStr());
  const companion = getDailyCompanion(dailyColor);

  // Auto-focus the input on step 1
  useEffect(() => {
    if (step === 1 && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [step]);

  const handleAddTask = () => {
    const title = taskText.trim() || 'Water a plant';
    addEntry({
      id: `walkthrough-${Date.now()}`,
      type: 'task',
      title,
      date: todayStr(),
      status: 'todo',
      priority: 'medium',
      movedCount: 0,
    });
    setTaskAdded(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !taskAdded) {
      handleAddTask();
    }
  };

  const next = () => {
    if (step < 4) setStep(step + 1);
    else {
      onComplete();
    }
  };

  const skip = () => {
    onComplete();
  };

  const steps = [
    // Step 0 — Welcome
    {
      content: (
        <div className="text-center max-w-md px-8">
          <div
            className="mb-6 inline-block"
            style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.25))' }}
          >
            <img src={`/animals/${companion.animal}.png`} alt={companion.name} className="w-72 h-72 object-contain" />
          </div>
          <h1 className="font-display italic text-3xl text-white mb-3" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
            Welcome to Soft Vellum
          </h1>
          <p className="font-body text-lg text-white/80 leading-relaxed mb-8">
            A daily journal built for brains that move fast.
          </p>
          <button
            onClick={next}
            className="px-8 py-3 rounded-xl font-body text-base font-medium text-white transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            Let&rsquo;s go &rarr;
          </button>
        </div>
      ),
    },
    // Step 1 — First task
    {
      content: (
        <div className="text-center max-w-md px-8">
          <div className="text-5xl mb-4 inline-block">✏️</div>
          <h2 className="font-display italic text-2xl text-white mb-2" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
            Start with something small
          </h2>
          <p className="font-body text-base text-white/70 leading-relaxed mb-6">
            Type your first task — anything at all.
          </p>
          <div className="relative mb-4">
            <input
              ref={inputRef}
              type="text"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={taskAdded}
              placeholder="water a plant"
              className="w-full px-5 py-3.5 rounded-xl text-base font-body bg-white/15 backdrop-blur-sm text-white placeholder:text-white/40 border border-white/20 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all disabled:opacity-60"
            />
            {taskAdded && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 text-lg">✓</span>
            )}
          </div>
          {!taskAdded ? (
            <button
              onClick={handleAddTask}
              className="px-8 py-3 rounded-xl font-body text-base font-medium text-white transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              Add it
            </button>
          ) : (
            <button
              onClick={next}
              className="px-8 py-3 rounded-xl font-body text-base font-medium transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.4)', color: 'white' }}
            >
              Nice! &rarr;
            </button>
          )}
        </div>
      ),
    },
    // Step 2 — Entry types
    {
      content: (
        <div className="text-center max-w-md px-8">
          <h2 className="font-display italic text-2xl text-white mb-6" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
            Three types of entries
          </h2>
          <div className="space-y-4 mb-8 text-left">
            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/15">
              <span className="text-white text-xl font-bold mt-0.5">&bull;</span>
              <div>
                <p className="font-body font-semibold text-white text-base">Task</p>
                <p className="font-body text-sm text-white/60">Something to do</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/15">
              <span className="text-white text-xl font-bold mt-0.5">&#9675;</span>
              <div>
                <p className="font-body font-semibold text-white text-base">Event</p>
                <p className="font-body text-sm text-white/60">Something that&rsquo;s happening</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/15">
              <span className="text-white text-xl font-bold mt-0.5">&mdash;</span>
              <div>
                <p className="font-body font-semibold text-white text-base">Note</p>
                <p className="font-body text-sm text-white/60">Something to remember</p>
              </div>
            </div>
          </div>
          <button
            onClick={next}
            className="px-8 py-3 rounded-xl font-body text-base font-medium text-white transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            Got it &rarr;
          </button>
        </div>
      ),
    },
    // Step 3 — Other pages
    {
      content: (
        <div className="text-center max-w-lg px-8">
          <h2 className="font-display italic text-2xl text-white mb-6" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
            There&rsquo;s more when you&rsquo;re ready
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15 text-center">
              <span className="material-symbols-outlined text-3xl text-white/80 mb-2 block">timeline</span>
              <p className="font-body font-semibold text-white text-sm">Flow View</p>
              <p className="font-body text-[11px] text-white/50 mt-1">Drag tasks into time blocks</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15 text-center">
              <span className="material-symbols-outlined text-3xl text-white/80 mb-2 block">show_chart</span>
              <p className="font-body font-semibold text-white text-sm">Habits</p>
              <p className="font-body text-[11px] text-white/50 mt-1">Track daily habits + streaks</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15 text-center">
              <span className="material-symbols-outlined text-3xl text-white/80 mb-2 block">inventory_2</span>
              <p className="font-body font-semibold text-white text-sm">Archive</p>
              <p className="font-body text-[11px] text-white/50 mt-1">Journal entries + collections</p>
            </div>
          </div>
          <button
            onClick={next}
            className="px-8 py-3 rounded-xl font-body text-base font-medium text-white transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            Almost done &rarr;
          </button>
        </div>
      ),
    },
    // Step 4 — Done
    {
      content: (
        <div className="text-center max-w-md px-8">
          <div
            className="mb-6 inline-block"
            style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.25))' }}
          >
            <img src={`/animals/${companion.animal}.png`} alt={companion.name} className="w-72 h-72 object-contain" />
          </div>
          <p className="font-body text-xl text-white/90 leading-relaxed mb-2" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.15)' }}>
            That&rsquo;s it. No rules, no pressure.
          </p>
          <p className="font-body text-base text-white/60 leading-relaxed mb-8">
            Just show up when you can. We&rsquo;ll be here.
          </p>
          <button
            onClick={next}
            className="px-8 py-3 rounded-xl font-body text-base font-medium text-white transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.4)' }}
          >
            Start journaling
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: `var(--color-gradient)` }}
    >
      {/* Background gradient overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {/* Step content */}
      <div className="relative z-10 w-full flex items-center justify-center animate-fade-in"
        key={step}
        style={{ animation: 'walkthroughFade 0.4s ease-out' }}
      >
        {steps[step].content}
      </div>

      {/* Progress dots + skip */}
      <div className="relative z-10 mt-8 flex items-center gap-4">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`size-2 rounded-full transition-all duration-300 ${
                i === step ? 'bg-white scale-125' : i < step ? 'bg-white/50' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
        <button
          onClick={skip}
          className="font-mono text-[10px] text-white/30 hover:text-white/60 uppercase tracking-wider transition-colors ml-4"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default Walkthrough;
