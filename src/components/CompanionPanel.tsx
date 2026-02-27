import { useState, useEffect, useMemo } from 'react';
import type { DailyCompanion, ReactiveMessages } from '../lib/colorOfTheDay';
import { getReactiveMessage } from '../lib/colorOfTheDay';
import type { DailyColor } from '../lib/colorOfTheDay';
import { calculateLevel } from '../lib/achievements';

/* ══════════════════════════════════════════════════════════════════════
   CompanionPanel — persistent sidebar showing the daily companion
   character with reactive expressions, messages, section progress,
   and achievements. Duolingo-inspired presence.
   ══════════════════════════════════════════════════════════════════════ */

// ── Exported types ───────────────────────────────────────────────────

export type CompanionExpression = 'neutral' | 'happy' | 'excited' | 'sleepy';

export interface SectionProgress {
  name: string;
  status: 'not_started' | 'in_progress' | 'complete';
}

// ── Props ────────────────────────────────────────────────────────────

interface CompanionPanelProps {
  companion: DailyCompanion;
  dailyColor: DailyColor;
  expression: CompanionExpression;
  reactiveState: keyof ReactiveMessages;
  sectionProgress: SectionProgress[];
  achievementCount: number;
  totalActiveDays: number;
  latestAchievement?: { name: string; icon: string } | null;
}

// ── Expression CSS classes ───────────────────────────────────────────

const EXPRESSION_CLASSES: Record<CompanionExpression, string> = {
  neutral: '',
  happy: 'scale-105 transition-transform duration-300',
  excited: 'scale-110 brightness-110 transition-all duration-300',
  sleepy: '-rotate-[5deg] opacity-70 transition-all duration-500',
};

// ── Section status indicators ────────────────────────────────────────

const STATUS_CONFIG: Record<
  SectionProgress['status'],
  { icon: string; textClass: string; through: boolean }
> = {
  complete: { icon: '\u2713', textClass: 'text-sage', through: true },
  in_progress: { icon: '\u25D0', textClass: 'text-primary', through: false },
  not_started: { icon: '\u25CB', textClass: 'text-pencil/30', through: false },
};

// ── Component ────────────────────────────────────────────────────────

function CompanionPanel({
  companion,
  dailyColor,
  expression,
  reactiveState,
  sectionProgress,
  achievementCount,
  totalActiveDays,
  latestAchievement,
}: CompanionPanelProps) {
  // -- Reactive message (refreshes when state key changes) -------------
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage(getReactiveMessage(companion, reactiveState));
  }, [companion, reactiveState]);

  // -- Level -----------------------------------------------------------
  const level = useMemo(
    () => calculateLevel(achievementCount, totalActiveDays),
    [achievementCount, totalActiveDays],
  );

  // -- Glow ring for excited expression --------------------------------
  const glowStyle =
    expression === 'excited'
      ? {
          boxShadow: `0 0 20px 4px hsla(${dailyColor.hue}, ${dailyColor.sat}%, ${dailyColor.light}%, 0.4)`,
        }
      : {};

  // -- Image error fallback --------------------------------------------
  const [imgError, setImgError] = useState(false);

  // -- Background gradient using dailyColor ----------------------------
  const bgGradient = `linear-gradient(180deg, hsla(${dailyColor.hue}, ${dailyColor.sat}%, ${dailyColor.light}%, 0.15) 0%, hsla(${dailyColor.hue}, ${dailyColor.sat}%, ${dailyColor.light}%, 0.05) 100%)`;

  return (
    <aside
      className="w-[240px] min-w-[240px] h-full border-r border-pencil/10 overflow-y-auto flex flex-col items-center px-4 py-6 gap-3 scrollbar-none"
      style={{ background: bgGradient }}
    >
      {/* ── Companion image ─────────────────────────────────── */}
      <div
        className={`w-24 h-24 rounded-full overflow-hidden bg-surface-light flex items-center justify-center ${EXPRESSION_CLASSES[expression]}`}
        style={glowStyle}
      >
        {!imgError ? (
          <img
            src={`/animals/${companion.animal}.png`}
            alt={companion.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="material-symbols-outlined text-4xl text-pencil/40">
            pets
          </span>
        )}
      </div>

      {/* ── Name + Level ────────────────────────────────────── */}
      <div className="flex items-baseline gap-2">
        <span className="font-display italic text-lg text-ink">
          {companion.name}
        </span>
        <span className="font-mono text-[12px] text-pencil/50">
          Lv.{level}
        </span>
      </div>

      {/* ── Personality ─────────────────────────────────────── */}
      <p className="font-body italic text-ink/60 text-sm text-center leading-snug">
        {companion.personality}
      </p>

      {/* ── Divider ─────────────────────────────────────────── */}
      <div className="w-full border-t border-pencil/10" />

      {/* ── Reactive message ────────────────────────────────── */}
      {message && (
        <p className="font-body italic text-ink/70 text-sm text-center leading-relaxed px-1">
          &ldquo;{message}&rdquo;
        </p>
      )}

      {/* ── Divider ─────────────────────────────────────────── */}
      <div className="w-full border-t border-pencil/10" />

      {/* ── Section progress ────────────────────────────────── */}
      <div className="w-full flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-pencil/40">
          Sections
        </span>

        {sectionProgress.map((sec) => {
          const cfg = STATUS_CONFIG[sec.status];
          return (
            <div key={sec.name} className={`flex items-center gap-2 ${cfg.textClass}`}>
              <span className="text-sm w-4 text-center">{cfg.icon}</span>
              <span
                className={`font-body text-sm ${cfg.through ? 'line-through' : ''}`}
              >
                {sec.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Divider ─────────────────────────────────────────── */}
      <div className="w-full border-t border-pencil/10" />

      {/* ── Achievement area (pushed to bottom) ─────────────── */}
      <div className="mt-auto w-full">
        {latestAchievement ? (
          <div className="flex items-center gap-2 rounded-lg bg-surface-light/60 border border-pencil/10 px-3 py-2">
            <span className="text-xl">{latestAchievement.icon}</span>
            <span className="font-body text-sm text-ink/80">
              {latestAchievement.name}
            </span>
          </div>
        ) : (
          <p className="font-body text-xs text-pencil/30 text-center italic">
            Achievements appear here
          </p>
        )}
      </div>
    </aside>
  );
}

export default CompanionPanel;
