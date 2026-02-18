import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

/* ── Types ────────────────────────────────────────────────────────── */

interface VisualTimerProps {
  /** Task title to display */
  taskTitle: string;
  /** Called when timer completes or user closes it */
  onClose: () => void;
}

const DURATION_OPTIONS = [5, 15, 30, 45, 60] as const;

/* ── Timer Arc Renderer (SVG) ─────────────────────────────────────── */

function TimerArc({
  remaining,
  total,
  size,
  color,
}: {
  remaining: number;
  total: number;
  size: number;
  color: string;
}) {
  const center = size / 2;
  const radius = size / 2 - 8;
  const fraction = Math.max(0, remaining / total);
  const angle = fraction * 360;

  // SVG arc path: sweeps clockwise from 12 o'clock
  const startAngle = -90; // 12 o'clock in degrees
  const endAngle = startAngle + angle;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = center + radius * Math.cos(startRad);
  const y1 = center + radius * Math.sin(startRad);
  const x2 = center + radius * Math.cos(endRad);
  const y2 = center + radius * Math.sin(endRad);

  const largeArc = angle > 180 ? 1 : 0;

  // Full wedge path from center
  const wedgePath =
    fraction >= 1
      ? // Full circle (two arcs to handle 360°)
        `M ${center} ${center}
         L ${x1} ${y1}
         A ${radius} ${radius} 0 1 1 ${center} ${center + radius}
         A ${radius} ${radius} 0 1 1 ${x1} ${y1}
         Z`
      : fraction <= 0
        ? ''
        : `M ${center} ${center}
           L ${x1} ${y1}
           A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
           Z`;

  return (
    <svg width={size} height={size} className="drop-shadow-lg">
      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="#f5f0eb"
        stroke="#e8e0d5"
        strokeWidth="2"
      />
      {/* Remaining time wedge */}
      {fraction > 0 && (
        <path d={wedgePath} fill={color} opacity="0.85" />
      )}
      {/* Center dot */}
      <circle cx={center} cy={center} r="4" fill="#1b140d" />
      {/* Tick marks */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => {
        const tickAngle = ((i * 30 - 90) * Math.PI) / 180;
        const inner = radius - (i % 3 === 0 ? 12 : 6);
        const outer = radius - 2;
        return (
          <line
            key={i}
            x1={center + inner * Math.cos(tickAngle)}
            y1={center + inner * Math.sin(tickAngle)}
            x2={center + outer * Math.cos(tickAngle)}
            y2={center + outer * Math.sin(tickAngle)}
            stroke="#1b140d"
            strokeWidth={i % 3 === 0 ? '2' : '1'}
            opacity={i % 3 === 0 ? '0.6' : '0.3'}
          />
        );
      })}
    </svg>
  );
}

/* ── Format seconds into MM:SS ────────────────────────────────────── */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ── Color based on remaining fraction ────────────────────────────── */

function getTimerColor(fraction: number): string {
  if (fraction > 0.5) return '#ec7f13'; // primary amber
  if (fraction > 0.2) return '#D4A843'; // warm gold
  return '#C47C7C'; // rose/tension — time running low
}

/* ── Main Timer Content ───────────────────────────────────────────── */

function TimerContent({
  taskTitle,
  onClose,
}: VisualTimerProps) {
  const [duration, setDuration] = useState<number | null>(null); // in minutes, null = choosing
  const [remaining, setRemaining] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const totalSeconds = (duration ?? 0) * 60;

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTimer = useCallback((mins: number) => {
    setDuration(mins);
    setRemaining(mins * 60);
    setIsRunning(true);
    setIsComplete(false);
  }, []);

  // Tick
  useEffect(() => {
    if (!isRunning || remaining <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsComplete(true);
          // Play a gentle chime
          try {
            const ctx = new AudioContext();
            audioRef.current = ctx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 523.25; // C5
            gain.gain.value = 0.3;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
            osc.stop(ctx.currentTime + 1.5);
          } catch { /* audio not available */ }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, remaining]);

  const fraction = totalSeconds > 0 ? remaining / totalSeconds : 1;
  const timerColor = getTimerColor(fraction);

  // Duration picker
  if (duration === null) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: '16px', padding: '20px',
        fontFamily: "'Crimson Pro', serif",
        background: '#f8f7f6',
      }}>
        <p style={{
          fontFamily: "'Newsreader', serif",
          fontStyle: 'italic', fontSize: '18px', color: '#1b140d',
          textAlign: 'center', lineHeight: '1.4',
        }}>
          {taskTitle}
        </p>
        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '10px', textTransform: 'uppercase',
          letterSpacing: '0.1em', color: '#A8A29E',
        }}>
          Choose duration
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {DURATION_OPTIONS.map(mins => (
            <button
              key={mins}
              onClick={() => startTimer(mins)}
              style={{
                width: '56px', height: '56px', borderRadius: '50%',
                border: '2px solid #e8e0d5', background: '#fffefc',
                fontFamily: "'Space Mono', monospace",
                fontSize: '14px', fontWeight: 600, color: '#1b140d',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#ec7f13';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = '#ec7f13';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#fffefc';
                e.currentTarget.style.color = '#1b140d';
                e.currentTarget.style.borderColor = '#e8e0d5';
              }}
            >
              {mins}
            </button>
          ))}
        </div>
        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '9px', color: '#A8A29E',
        }}>
          minutes
        </p>
      </div>
    );
  }

  // Timer running or complete
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: '12px', padding: '16px',
      fontFamily: "'Crimson Pro', serif",
      background: isComplete ? '#f0fdf4' : '#f8f7f6',
      transition: 'background 0.5s',
    }}>
      {/* Task title */}
      <p style={{
        fontFamily: "'Newsreader', serif",
        fontStyle: 'italic', fontSize: '14px', color: '#1b140d',
        textAlign: 'center', maxWidth: '200px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {taskTitle}
      </p>

      {/* Timer arc */}
      <TimerArc
        remaining={remaining}
        total={totalSeconds}
        size={180}
        color={timerColor}
      />

      {/* Digital display */}
      <p style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '28px', fontWeight: 700,
        color: isComplete ? '#8fa88f' : '#1b140d',
        letterSpacing: '0.05em',
      }}>
        {isComplete ? 'Done' : formatTime(remaining)}
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {!isComplete && (
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              padding: '6px 16px', borderRadius: '20px',
              border: '1px solid #e8e0d5', background: '#fffefc',
              fontFamily: "'Space Mono', monospace",
              fontSize: '11px', color: '#1b140d', cursor: 'pointer',
            }}
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
        )}
        {isComplete && (
          <button
            onClick={() => setDuration(null)}
            style={{
              padding: '6px 16px', borderRadius: '20px',
              border: '1px solid #8fa88f', background: '#8fa88f',
              fontFamily: "'Space Mono', monospace",
              fontSize: '11px', color: '#fff', cursor: 'pointer',
            }}
          >
            Again
          </button>
        )}
        <button
          onClick={() => { setDuration(null); setIsRunning(false); setRemaining(0); }}
          style={{
            padding: '6px 16px', borderRadius: '20px',
            border: '1px solid #e8e0d5', background: 'transparent',
            fontFamily: "'Space Mono', monospace",
            fontSize: '11px', color: '#A8A29E', cursor: 'pointer',
          }}
        >
          Reset
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '6px 12px', borderRadius: '20px',
            border: '1px solid #e8e0d5', background: 'transparent',
            fontFamily: "'Space Mono', monospace",
            fontSize: '11px', color: '#A8A29E', cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ── Popup Window Wrapper ─────────────────────────────────────────── */

export default function VisualTimer({ taskTitle, onClose }: VisualTimerProps) {
  const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(null);
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    // Open a small popup window
    const popup = window.open(
      '',
      `timer_${Date.now()}`,
      'width=280,height=380,top=100,left=100,resizable=no,scrollbars=no,toolbar=no,menubar=no,location=no,status=no',
    );

    if (!popup) {
      // Popup blocked — fall back to inline rendering
      return;
    }

    popupRef.current = popup;

    // Copy fonts and base styles into popup
    popup.document.title = `Timer — ${taskTitle}`;

    const style = popup.document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&family=Newsreader:ital,wght@1,400&family=Space+Mono:wght@400;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { overflow: hidden; background: #f8f7f6; }
      button:hover { opacity: 0.9; }
    `;
    popup.document.head.appendChild(style);

    // Create container for React portal
    const container = popup.document.createElement('div');
    container.id = 'timer-root';
    container.style.width = '100%';
    container.style.height = '100vh';
    popup.document.body.appendChild(container);
    setPopupContainer(container);

    // Handle popup close
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        onClose();
      }
    }, 500);

    return () => {
      clearInterval(checkClosed);
      if (!popup.closed) popup.close();
    };
  }, [taskTitle, onClose]);

  // If popup was blocked, render inline as a fixed overlay
  if (!popupContainer) {
    return (
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '280px', height: '380px',
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          zIndex: 9999, background: '#f8f7f6',
          border: '1px solid #e8e0d5',
        }}
      >
        <TimerContent taskTitle={taskTitle} onClose={onClose} />
      </div>
    );
  }

  // Render into popup window via portal
  return createPortal(
    <TimerContent taskTitle={taskTitle} onClose={() => {
      popupRef.current?.close();
      onClose();
    }} />,
    popupContainer,
  );
}
