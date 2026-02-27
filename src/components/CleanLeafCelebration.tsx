import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type { DailyColor } from '../lib/colorOfTheDay';
import type { DailyCompanion } from '../lib/colorOfTheDay';
import { getReactiveMessage } from '../lib/colorOfTheDay';

interface CleanLeafProps {
  dailyColor: DailyColor;
  companion: DailyCompanion;
  cleanDayCount: number;
  unlockedAchievement?: { name: string; icon: string; description: string } | null;
  onDismiss: () => void;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default function CleanLeafCelebration({
  dailyColor,
  companion,
  cleanDayCount,
  unlockedAchievement,
  onDismiss,
}: CleanLeafProps) {
  const [visible, setVisible] = useState(false);
  const [message] = useState(() => getReactiveMessage(companion, 'all_done'));

  // Fade-in: flip visibility on next frame after mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Confetti burst using dailyColor palette
  useEffect(() => {
    const { hue, sat } = dailyColor;
    const colors = [
      `hsl(${hue}, ${sat}%, 60%)`,
      `hsl(${(hue + 30) % 360}, ${Math.max(sat - 10, 0)}%, 60%)`,
      '#ffd700',
      '#ffffff',
    ];

    let frame: number;
    const startTime = performance.now();
    const duration = 3000;

    function burst() {
      const elapsed = performance.now() - startTime;
      if (elapsed > duration) return;

      confetti({
        particleCount: 3,
        angle: 60 + Math.random() * 60,
        spread: 55 + Math.random() * 30,
        origin: { x: Math.random(), y: Math.random() * 0.6 },
        colors,
        disableForReducedMotion: true,
      });

      frame = requestAnimationFrame(burst);
    }

    frame = requestAnimationFrame(burst);
    return () => cancelAnimationFrame(frame);
  }, [dailyColor]);

  const { hue, sat } = dailyColor;
  const bgGradient = `linear-gradient(135deg, hsl(${hue}, ${sat}%, 90%), hsl(${(hue + 30) % 360}, ${Math.max(sat - 10, 0)}%, 85%))`;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center cursor-pointer transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: bgGradient }}
      onClick={onDismiss}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onDismiss();
      }}
    >
      {/* Companion */}
      <div className="mb-6 flex items-center justify-center">
        <div className="w-32 h-32 rounded-2xl overflow-hidden animate-bounce bg-white/20 backdrop-blur-sm p-2">
          <img
            src={`/animals/${companion.animal}.png`}
            alt={companion.name}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Message */}
      <div className="max-w-md px-6 text-center mb-8">
        {message && (
          <>
            <p className="font-display italic text-2xl text-ink leading-relaxed">
              &ldquo;{message}&rdquo;
            </p>
            <p className="mt-2 text-ink/60 font-body text-sm">
              &mdash; {companion.name}
            </p>
          </>
        )}
      </div>

      {/* Clean day counter */}
      <div className="bg-white/40 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
        <p className="font-body text-ink text-sm">
          Your{' '}
          <span className="font-bold text-primary">
            {cleanDayCount}{ordinal(cleanDayCount)}
          </span>{' '}
          clean day this month
        </p>
      </div>

      {/* Achievement */}
      {unlockedAchievement && (
        <div className="bg-white/40 backdrop-blur-sm rounded-xl px-8 py-5 text-center max-w-xs animate-pulse">
          <p className="text-3xl mb-2">{unlockedAchievement.icon}</p>
          <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-1">
            Achievement Unlocked
          </p>
          <p className="font-display text-lg text-ink font-semibold">
            {unlockedAchievement.name}
          </p>
          <p className="font-body text-sm text-ink/70 mt-1">
            {unlockedAchievement.description}
          </p>
        </div>
      )}

      {/* Dismiss hint */}
      <p className="absolute bottom-8 font-handwriting text-ink/30 text-sm">
        tap anywhere to continue
      </p>
    </div>
  );
}
