# FlowView Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign FlowView from multi-day horizontal scroll to today-first single-day layout with persistent companion panel, week strip navigation, achievement system, and enhanced dopamine-driven task interactions.

**Architecture:** Extract FlowView's 12 inline sub-components into separate files. Replace horizontal scroll with a single-day view + compact week strip. Add companion sidebar with reactive messages and expressions. Layer achievement system and variable celebration intensity on top.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS, Firebase Firestore, canvas-confetti (existing), CSS transforms for companion expressions.

---

## Phase 1: Foundation — Data Model + Utilities

### Task 1: Add Achievement types to AppContext

**Files:**
- Create: `src/lib/achievements.ts`
- Modify: `src/context/AppContext.tsx`

**Step 1: Create the achievement definitions module**

Create `src/lib/achievements.ts`:

```typescript
/* ── Achievement System ──────────────────────────────────────────── */

export interface Achievement {
  id: string;
  unlockedAt: string; // ISO date
  seen: boolean;      // user dismissed the notification
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  category: 'consistency' | 'momentum' | 'sections' | 'journaling' | 'time' | 'resilience' | 'collections';
}

export interface AchievementContext {
  totalActiveDays: number;
  todayTasksCompleted: number;
  todaySessionTasksInARow: number;
  allSectionsComplete: boolean;
  sectionJustCompleted: boolean;
  cleanSweepDaysThisMonth: number;
  cleanSweepDaysTotal: number;
  totalTasksCompleted: number;
  journalExercisesCompleted: number;
  journalMethodsUsed: Set<string>;
  hasDebrief: boolean;
  currentHour: number;
  isWeekend: boolean;
  daysSinceLastActive: number;
  parkingLotUsageCount: number;
  deferredTaskCount: number;
  maxRescheduleCount: number;
  collectionsCreated: number;
  maxCollectionSize: number;
  sectionCompletedInUnder30Min: boolean;
  allDailyTasksCompletedInUnder2Hours: boolean;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // Consistency (cumulative days, NOT consecutive)
  { id: 'showed_up', name: 'Showed Up', description: 'Your first active day', icon: '🌱', category: 'consistency' },
  { id: 'regular', name: 'Regular', description: '10 active days', icon: '🌿', category: 'consistency' },
  { id: 'rooted', name: 'Rooted', description: '30 active days', icon: '🌳', category: 'consistency' },
  { id: 'part_of_furniture', name: 'Part of the Furniture', description: '100 active days', icon: '🏡', category: 'consistency' },

  // Momentum
  { id: 'first_blood', name: 'First Blood', description: 'First task completed ever', icon: '⚡', category: 'momentum' },
  { id: 'on_a_roll', name: 'On a Roll', description: '5 tasks in one session', icon: '🔥', category: 'momentum' },
  { id: 'avalanche', name: 'Avalanche', description: 'Complete a section in under 30 min', icon: '🏔️', category: 'momentum' },
  { id: 'speedrun', name: 'Speedrun', description: 'All daily tasks done in under 2 hours', icon: '⏱️', category: 'momentum' },

  // Sections
  { id: 'full_morning', name: 'Full Morning', description: 'All morning tasks done', icon: '☀️', category: 'sections' },
  { id: 'clean_sweep', name: 'Clean Sweep', description: 'All sections done in a day', icon: '✨', category: 'sections' },
  { id: 'hat_trick', name: 'Hat Trick', description: '3 clean sweep days total', icon: '🎩', category: 'sections' },
  { id: 'grand_slam', name: 'Grand Slam', description: '5 clean sweep days in a month', icon: '🏆', category: 'sections' },

  // Journaling
  { id: 'dear_diary', name: 'Dear Diary', description: 'First journal exercise completed', icon: '📖', category: 'journaling' },
  { id: 'method_actor', name: 'Method Actor', description: 'Tried 3 different journal methods', icon: '🎭', category: 'journaling' },
  { id: 'self_archaeologist', name: 'Self-Archaeologist', description: '10 exercises completed', icon: '🔍', category: 'journaling' },
  { id: 'cartographer', name: 'Cartographer', description: 'Completed a debrief', icon: '🗺️', category: 'journaling' },

  // Time Patterns
  { id: 'early_bird', name: 'Early Bird', description: 'Completed tasks before 8am', icon: '🐦', category: 'time' },
  { id: 'night_owl', name: 'Night Owl', description: 'Journaled after 10pm', icon: '🦉', category: 'time' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Active on a weekend', icon: '⚔️', category: 'time' },

  // Resilience (anti-shame)
  { id: 'phoenix', name: 'Phoenix', description: 'Came back after 7+ day absence. That takes more courage than a streak ever could.', icon: '🔥', category: 'resilience' },
  { id: 'parking_pro', name: 'Parking Pro', description: 'Used parking lot 10 times. Guilt-free deferral is a SKILL.', icon: '🅿️', category: 'resilience' },
  { id: 'not_today', name: 'Not Today', description: 'Deferred 3 tasks without guilt', icon: '🛡️', category: 'resilience' },
  { id: 'plot_twist', name: 'Plot Twist', description: 'Completed a task rescheduled 3+ times', icon: '📜', category: 'resilience' },

  // Collections
  { id: 'curator', name: 'Curator', description: 'Created first collection', icon: '🎨', category: 'collections' },
  { id: 'archivist', name: 'Archivist', description: '10 items in a collection', icon: '📚', category: 'collections' },
];

/** Calculate level from achievements + active days */
export function calculateLevel(achievementCount: number, activeDays: number): number {
  return Math.floor(Math.sqrt(achievementCount * 10 + activeDays));
}

/** Check which new achievements should be unlocked given current context */
export function checkAchievements(
  ctx: AchievementContext,
  alreadyUnlocked: Set<string>,
): string[] {
  const newlyUnlocked: string[] = [];
  const check = (id: string, condition: boolean) => {
    if (!alreadyUnlocked.has(id) && condition) newlyUnlocked.push(id);
  };

  // Consistency
  check('showed_up', ctx.totalActiveDays >= 1);
  check('regular', ctx.totalActiveDays >= 10);
  check('rooted', ctx.totalActiveDays >= 30);
  check('part_of_furniture', ctx.totalActiveDays >= 100);

  // Momentum
  check('first_blood', ctx.totalTasksCompleted >= 1);
  check('on_a_roll', ctx.todaySessionTasksInARow >= 5);
  check('avalanche', ctx.sectionCompletedInUnder30Min);
  check('speedrun', ctx.allDailyTasksCompletedInUnder2Hours);

  // Sections
  check('full_morning', ctx.sectionJustCompleted); // caller passes true when morning section done
  check('clean_sweep', ctx.allSectionsComplete);
  check('hat_trick', ctx.cleanSweepDaysTotal >= 3);
  check('grand_slam', ctx.cleanSweepDaysThisMonth >= 5);

  // Journaling
  check('dear_diary', ctx.journalExercisesCompleted >= 1);
  check('method_actor', ctx.journalMethodsUsed.size >= 3);
  check('self_archaeologist', ctx.journalExercisesCompleted >= 10);
  check('cartographer', ctx.hasDebrief);

  // Time
  check('early_bird', ctx.currentHour < 8 && ctx.todayTasksCompleted > 0);
  check('night_owl', ctx.currentHour >= 22 && ctx.journalExercisesCompleted > 0);
  check('weekend_warrior', ctx.isWeekend && ctx.todayTasksCompleted > 0);

  // Resilience
  check('phoenix', ctx.daysSinceLastActive >= 7 && ctx.todayTasksCompleted >= 1);
  check('parking_pro', ctx.parkingLotUsageCount >= 10);
  check('not_today', ctx.deferredTaskCount >= 3);
  check('plot_twist', ctx.maxRescheduleCount >= 3 && ctx.todayTasksCompleted >= 1);

  // Collections
  check('curator', ctx.collectionsCreated >= 1);
  check('archivist', ctx.maxCollectionSize >= 10);

  return newlyUnlocked;
}
```

**Step 2: Add achievement state + tracking fields to AppContext**

In `src/context/AppContext.tsx`, add to the AppContextType interface:

```typescript
// After existing debriefs fields, add:
// Achievement tracking
achievements: Achievement[];
level: number;
totalActiveDays: number;
lastActiveDate: string;
unlockAchievement: (id: string) => void;
markAchievementSeen: (id: string) => void;
recordActiveDay: () => void;
```

Add `Achievement` import from `../lib/achievements`. Add state for achievements, level, totalActiveDays, lastActiveDate alongside existing state. Include them in Firestore read/write. The `recordActiveDay` function should check if `lastActiveDate !== todayStr()`, increment `totalActiveDays`, and update `lastActiveDate`.

**Step 3: Run build to verify types compile**

Run: `npm run build`
Expected: PASS (no type errors)

**Step 4: Commit**

```bash
git add src/lib/achievements.ts src/context/AppContext.tsx
git commit -m "feat: add achievement system types and AppContext tracking"
```

---

### Task 2: Add reactive messages to companion data

**Files:**
- Modify: `src/lib/colorOfTheDay.ts`

**Step 1: Add ReactiveMessages interface and extend DailyCompanion**

After the existing `DailyCompanion` interface in `colorOfTheDay.ts`, add:

```typescript
export interface ReactiveMessages {
  morning_greeting: string[];
  first_task: string[];
  momentum: string[];
  section_done: string[];
  all_done: string[];
  stuck: string[];
  return_after_absence: string[];
  habit_done: string[];
  overdue_cleared: string[];
}
```

Extend the `DailyCompanion` interface to include `reactiveMessages?: ReactiveMessages`.

**Step 2: Add reactive messages to the first 10 companions as proof-of-concept**

For each of the first 10 companions (Fox, Octavia, Bandit, Atlas, Sage, Drift, Clover, Rosie, Steady, Sol), add a `reactiveMessages` field with 3-5 messages per state category, each message staying in-character for that companion's personality.

For remaining companions (indices 10-99), add a `reactiveMessages` field using a `defaultReactiveMessages()` helper that generates generic-but-warm messages.

**Step 3: Add helper to get a random reactive message**

```typescript
export function getReactiveMessage(
  companion: DailyCompanion,
  state: keyof ReactiveMessages,
): string {
  const pool = companion.reactiveMessages?.[state];
  if (!pool || pool.length === 0) return '';
  return pool[Math.floor(Math.random() * pool.length)];
}
```

**Step 4: Run build**

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/colorOfTheDay.ts
git commit -m "feat: add reactive message system to companions"
```

---

## Phase 2: New Components

### Task 3: Create WeekStrip component

**Files:**
- Create: `src/components/WeekStrip.tsx`

**Step 1: Build the WeekStrip component**

```typescript
import { useMemo } from 'react';
import { formatLocalDate } from '../lib/dateUtils';

interface WeekStripProps {
  /** Currently viewed date as YYYY-MM-DD */
  currentDate: string;
  /** Callback when user clicks a day */
  onSelectDate: (date: string) => void;
  /** Map of date → completion status for the visible week */
  completionStatus: Record<string, 'none' | 'partial' | 'complete'>;
}

export default function WeekStrip({ currentDate, onSelectDate, completionStatus }: WeekStripProps) {
  // Calculate the week containing currentDate (Mon-Sun)
  const weekDays = useMemo(() => {
    const current = new Date(currentDate + 'T12:00:00');
    const dayOfWeek = current.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(current);
    monday.setDate(current.getDate() + mondayOffset);

    const days: { date: string; label: string; isToday: boolean; isPast: boolean; isWeekend: boolean }[] = [];
    const today = formatLocalDate(new Date());

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatLocalDate(d);
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: dateStr === today,
        isPast: dateStr < today,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return days;
  }, [currentDate]);

  const goToPrevWeek = () => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    onSelectDate(formatLocalDate(d));
  };

  const goToNextWeek = () => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    onSelectDate(formatLocalDate(d));
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-paper/80 border-b border-wood-light/20">
      {/* Prev week arrow */}
      <button onClick={goToPrevWeek} className="w-7 h-7 flex items-center justify-center text-pencil hover:text-primary transition-colors rounded-full hover:bg-surface-light">
        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
      </button>

      {/* Day buttons */}
      <div className="flex-1 flex items-center justify-center gap-1">
        {weekDays.map(day => {
          const isSelected = day.date === currentDate;
          const status = completionStatus[day.date] ?? 'none';
          const dotIcon = status === 'complete' ? '●' : status === 'partial' ? '◐' : '○';

          return (
            <button
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-all min-w-[44px] ${
                isSelected
                  ? 'bg-primary text-white shadow-soft'
                  : day.isToday
                    ? 'bg-primary/10 text-primary'
                    : day.isPast
                      ? 'text-pencil/50 hover:bg-surface-light hover:text-ink'
                      : day.isWeekend
                        ? 'text-accent/70 hover:bg-accent/10'
                        : 'text-ink/70 hover:bg-surface-light hover:text-ink'
              }`}
            >
              <span className="text-[11px] font-mono uppercase tracking-wider">{day.label}</span>
              <span className={`text-[8px] leading-none ${isSelected ? 'text-white/70' : 'text-pencil/40'}`}>
                {dotIcon}
              </span>
            </button>
          );
        })}
      </div>

      {/* Next week arrow */}
      <button onClick={goToNextWeek} className="w-7 h-7 flex items-center justify-center text-pencil hover:text-primary transition-colors rounded-full hover:bg-surface-light">
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      </button>
    </div>
  );
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/WeekStrip.tsx
git commit -m "feat: add WeekStrip day navigation component"
```

---

### Task 4: Create CompanionPanel component

**Files:**
- Create: `src/components/CompanionPanel.tsx`

**Step 1: Build the CompanionPanel**

This is the persistent sidebar buddy. It shows:
- Companion image with CSS expression states
- Name + level
- Personality description
- Reactive message (changes based on user state)
- Section progress indicators (○ ◐ ✓)
- Achievement badge area

```typescript
import { useState, useEffect, useMemo } from 'react';
import type { DailyCompanion, ReactiveMessages } from '../lib/colorOfTheDay';
import { getReactiveMessage } from '../lib/colorOfTheDay';
import type { DailyColor } from '../lib/colorOfTheDay';
import { calculateLevel } from '../lib/achievements';

export type CompanionExpression = 'neutral' | 'happy' | 'excited' | 'sleepy';

export interface SectionProgress {
  name: string;
  status: 'not_started' | 'in_progress' | 'complete';
}

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

const EXPRESSION_STYLES: Record<CompanionExpression, string> = {
  neutral: 'transform-none opacity-100',
  happy: 'scale-105 transition-transform duration-300',
  excited: 'scale-110 brightness-110',
  sleepy: '-rotate-[5deg] opacity-70',
};

export default function CompanionPanel({
  companion,
  dailyColor,
  expression,
  reactiveState,
  sectionProgress,
  achievementCount,
  totalActiveDays,
  latestAchievement,
}: CompanionPanelProps) {
  const [message, setMessage] = useState('');
  const level = useMemo(() => calculateLevel(achievementCount, totalActiveDays), [achievementCount, totalActiveDays]);

  // Update message when reactive state changes
  useEffect(() => {
    const msg = getReactiveMessage(companion, reactiveState);
    if (msg) setMessage(msg);
  }, [companion, reactiveState]);

  const gradientBg = `linear-gradient(135deg, hsl(${dailyColor.hue}, ${dailyColor.sat}%, ${dailyColor.light + 30}%, 0.15), hsl(${dailyColor.hue}, ${dailyColor.sat}%, ${dailyColor.light + 40}%, 0.05))`;

  const sectionIcon = (status: SectionProgress['status']) => {
    if (status === 'complete') return '✓';
    if (status === 'in_progress') return '◐';
    return '○';
  };

  const sectionColor = (status: SectionProgress['status']) => {
    if (status === 'complete') return 'text-sage';
    if (status === 'in_progress') return 'text-primary';
    return 'text-pencil/30';
  };

  return (
    <aside
      className="w-[240px] min-w-[240px] h-full flex flex-col border-r border-wood-light/30 overflow-y-auto no-scrollbar"
      style={{ background: gradientBg }}
    >
      {/* Companion image */}
      <div className="flex flex-col items-center pt-6 pb-4 px-4">
        <div className={`w-24 h-24 rounded-full bg-surface-light/50 flex items-center justify-center shadow-soft mb-3 transition-all duration-300 ${EXPRESSION_STYLES[expression]}`}>
          <img
            src={`/animals/${companion.animal}.png`}
            alt={companion.name}
            className="w-20 h-20 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        {/* Name + Level */}
        <h3 className="font-display italic text-lg text-ink">{companion.name}</h3>
        <span className="text-[12px] font-mono text-pencil/60">Lv.{level}</span>
        <p className="text-[13px] font-body text-ink/60 text-center mt-1 italic">{companion.personality}</p>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-wood-light/20" />

      {/* Reactive message */}
      <div className="px-4 py-4">
        <p className="text-sm font-body italic text-ink/70 leading-relaxed">
          "{message}"
        </p>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-wood-light/20" />

      {/* Section progress */}
      <div className="px-4 py-3">
        <p className="text-[11px] font-mono text-pencil uppercase tracking-widest mb-2">Sections</p>
        <div className="space-y-1.5">
          {sectionProgress.map(sp => (
            <div key={sp.name} className="flex items-center gap-2">
              <span className={`text-sm font-mono ${sectionColor(sp.status)}`}>{sectionIcon(sp.status)}</span>
              <span className={`text-sm font-body ${sp.status === 'complete' ? 'text-ink/40 line-through' : 'text-ink/80'}`}>
                {sp.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-wood-light/20" />

      {/* Achievement area */}
      <div className="px-4 py-3 mt-auto">
        {latestAchievement ? (
          <div className="flex items-center gap-2 bg-surface-light/50 rounded-lg px-3 py-2">
            <span className="text-lg">{latestAchievement.icon}</span>
            <div>
              <p className="text-[12px] font-mono text-pencil uppercase tracking-wider">Latest</p>
              <p className="text-sm font-body text-ink">{latestAchievement.name}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <span className="text-[12px] font-mono text-pencil/40">Achievements appear here</span>
          </div>
        )}
      </div>
    </aside>
  );
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/CompanionPanel.tsx
git commit -m "feat: add CompanionPanel persistent sidebar component"
```

---

### Task 5: Create CleanLeafCelebration overlay

**Files:**
- Create: `src/components/CleanLeafCelebration.tsx`

**Step 1: Build the celebration overlay**

This is the full-screen "you did it" moment when all sections are complete — the Superhuman inbox-zero equivalent.

```typescript
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type { DailyColor } from '../lib/colorOfTheDay';
import type { DailyCompanion } from '../lib/colorOfTheDay';
import { getReactiveMessage } from '../lib/colorOfTheDay';

interface CleanLeafProps {
  dailyColor: DailyColor;
  companion: DailyCompanion;
  cleanDayCount: number; // "Your Nth clean day this month"
  unlockedAchievement?: { name: string; icon: string; description: string } | null;
  onDismiss: () => void;
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

  useEffect(() => {
    // Entrance animation
    requestAnimationFrame(() => setVisible(true));

    // Fire confetti burst
    const duration = 3000;
    const end = Date.now() + duration;
    const hsl = dailyColor.css;

    const colors = [
      `hsl(${dailyColor.hue}, ${dailyColor.sat}%, ${dailyColor.light}%)`,
      `hsl(${(dailyColor.hue + 30) % 360}, ${dailyColor.sat}%, ${dailyColor.light}%)`,
      '#ffd700', '#ffffff',
    ];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60 + Math.random() * 60,
        spread: 55,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [dailyColor]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onDismiss}
      style={{
        background: `linear-gradient(135deg, hsl(${dailyColor.hue}, ${dailyColor.sat}%, 90%), hsl(${(dailyColor.hue + 30) % 360}, ${dailyColor.sat - 10}%, 85%))`,
      }}
    >
      {/* Companion large */}
      <div className="w-32 h-32 rounded-full bg-white/30 flex items-center justify-center shadow-lifted mb-6 animate-bounce">
        <img
          src={`/animals/${companion.animal}.png`}
          alt={companion.name}
          className="w-28 h-28 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      {/* Message */}
      <p className="font-display italic text-2xl text-ink text-center max-w-sm mb-2 px-4">
        "{message}"
      </p>
      <p className="font-body text-ink/60 text-center mb-8">
        — {companion.name}
      </p>

      {/* Clean day counter */}
      <div className="bg-white/40 backdrop-blur-sm rounded-full px-6 py-2 mb-4">
        <p className="font-mono text-sm text-ink/80">
          Your <span className="font-bold text-primary">{cleanDayCount}{ordinal(cleanDayCount)}</span> clean day this month
        </p>
      </div>

      {/* Achievement if unlocked */}
      {unlockedAchievement && (
        <div className="bg-white/60 backdrop-blur-sm rounded-xl px-6 py-4 flex items-center gap-3 shadow-soft mb-4 animate-pulse">
          <span className="text-3xl">{unlockedAchievement.icon}</span>
          <div>
            <p className="font-mono text-[11px] text-primary uppercase tracking-wider">Achievement Unlocked</p>
            <p className="font-display italic text-lg text-ink">{unlockedAchievement.name}</p>
            <p className="font-body text-sm text-ink/60">{unlockedAchievement.description}</p>
          </div>
        </div>
      )}

      {/* Dismiss hint */}
      <p className="font-handwriting text-sm text-ink/30 mt-4">tap anywhere to continue</p>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/CleanLeafCelebration.tsx
git commit -m "feat: add CleanLeafCelebration full-screen overlay"
```

---

## Phase 3: FlowView Restructure

### Task 6: Extract sub-components from FlowView into separate files

**Files:**
- Create: `src/components/flow/TaskCard.tsx`
- Create: `src/components/flow/EventCard.tsx`
- Create: `src/components/flow/SectionHeader.tsx`
- Create: `src/components/flow/SectionBody.tsx`
- Create: `src/components/flow/AddTaskInline.tsx`
- Create: `src/components/flow/ParkingLotItem.tsx`
- Create: `src/components/flow/TaskDetailModal.tsx`
- Create: `src/components/flow/types.ts`

**Step 1: Create shared types file**

`src/components/flow/types.ts` — extract `DaySection`, `DragPayload`, and all shared interfaces/helpers (formatTime12, timeToMinutes, encodeDrag, decodeDrag, getSectionForTime, uid, renderTextWithLinks, URL_REGEX, SECTION_COLORS, INITIAL_SECTIONS, SECTIONS_KEY, loadSections, saveSections) from FlowView.tsx into this module. Export everything.

**Step 2: Extract each sub-component into its own file**

Move the following inline components from FlowView.tsx into separate files, updating imports:
- `TaskCard` → `src/components/flow/TaskCard.tsx`
- `EventCard` → `src/components/flow/EventCard.tsx`
- `SectionHeader` → `src/components/flow/SectionHeader.tsx`
- `SectionBody` → `src/components/flow/SectionBody.tsx`
- `AddTaskInline` → `src/components/flow/AddTaskInline.tsx`
- `ParkingLotItem` → `src/components/flow/ParkingLotItem.tsx`
- `TaskDetailModal` → `src/components/flow/TaskDetailModal.tsx`

Each file imports types from `./types` and `../../context/AppContext`.

**Step 3: Create barrel export**

`src/components/flow/index.ts`:
```typescript
export { default as TaskCard } from './TaskCard';
export { default as EventCard } from './EventCard';
export { default as SectionHeader } from './SectionHeader';
export { default as SectionBody } from './SectionBody';
export { default as AddTaskInline } from './AddTaskInline';
export { default as ParkingLotItem } from './ParkingLotItem';
export { default as TaskDetailModal } from './TaskDetailModal';
export * from './types';
```

**Step 4: Update FlowView.tsx to import from flow/**

Replace all inline component definitions in FlowView.tsx with imports from `../components/flow`. The DayColumn, ZoomedSection, ResizableTimelineCard, and SectionManager components remain in FlowView.tsx for now (they're tightly coupled to the layout). Remove all moved code — FlowView.tsx should shrink from ~2500 lines to ~1200 lines.

**Step 5: Run build**

Run: `npm run build`
Expected: PASS (same behavior, just refactored)

**Step 6: Commit**

```bash
git add src/components/flow/ src/pages/FlowView.tsx
git commit -m "refactor: extract FlowView sub-components into flow/ module"
```

---

### Task 7: Rewrite FlowView as today-first layout

**Files:**
- Modify: `src/pages/FlowView.tsx` (major rewrite)

This is the biggest task. Replace the multi-day horizontal scroll with:
- Top: WeekStrip (day navigation)
- Left: CompanionPanel (persistent sidebar)
- Center: Single day's sections (vertical stack)
- Bottom: Parking lot (collapsed drawer)

**Step 1: Replace the FlowView component**

The new FlowView structure:

```typescript
export default function FlowView() {
  const { entries, addEntry, updateEntry, batchUpdateEntries, deleteEntry, habits, toggleHabit, achievements, totalActiveDays, lastActiveDate, unlockAchievement, recordActiveDay } = useApp();

  // Date navigation state
  const [currentDate, setCurrentDate] = useState(todayStr());

  // Companion state
  const dailyColor = useMemo(() => getColorOfTheDay(currentDate), [currentDate]);
  const companion = useMemo(() => getDailyCompanion(dailyColor), [dailyColor]);
  const [companionExpression, setCompanionExpression] = useState<CompanionExpression>('neutral');
  const [reactiveState, setReactiveState] = useState<keyof ReactiveMessages>('morning_greeting');

  // Section state (existing)
  const [sections, setSections] = useState<DaySection[]>(loadSections);

  // Parking lot drawer
  const [parkingOpen, setParkingOpen] = useState(false);

  // Clean Leaf celebration
  const [showCleanLeaf, setShowCleanLeaf] = useState(false);

  // ... existing entry filtering logic adapted for single-day view using currentDate
  // ... companion expression triggers (on task complete → happy, on section complete → excited, etc.)
  // ... achievement checking on task/section completion

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-paper">
      {/* Companion Panel — desktop only */}
      <div className="hidden md:block">
        <CompanionPanel
          companion={companion}
          dailyColor={dailyColor}
          expression={companionExpression}
          reactiveState={reactiveState}
          sectionProgress={sectionProgress}
          achievementCount={achievements.length}
          totalActiveDays={totalActiveDays}
          latestAchievement={latestAchievement}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Week Strip */}
        <WeekStrip
          currentDate={currentDate}
          onSelectDate={setCurrentDate}
          completionStatus={weekCompletionStatus}
        />

        {/* Sections (single day, vertical scroll) */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-4 no-scrollbar">
          {visibleSections.map(section => (
            <div key={section.id} className={`rounded-lg border ${section.accentColor} ${section.color} overflow-hidden`}>
              <SectionHeader ... />
              {!collapsed[section.id] && <SectionBody ... />}
            </div>
          ))}

          {/* Parking lot as bottom drawer */}
          <div className="mt-4">
            <button
              onClick={() => setParkingOpen(!parkingOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-surface-light/50 rounded-t-lg border border-wood-light/20"
            >
              <span className="font-mono text-sm text-pencil">Parking Lot</span>
              <span className="font-mono text-[12px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {parkingLotEntries.length}
              </span>
            </button>
            {parkingOpen && (
              <div className="border border-t-0 border-wood-light/20 rounded-b-lg bg-surface-light/30 p-3 space-y-2">
                {parkingLotEntries.map(entry => (
                  <ParkingLotItem key={entry.id} ... />
                ))}
                {/* Add task input */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile companion: floating avatar */}
      <div className="md:hidden fixed bottom-4 left-4 z-50">
        <button onClick={() => setMobileCompanionOpen(true)} className="...">
          <img src={`/animals/${companion.animal}.png`} ... />
        </button>
      </div>

      {/* Clean Leaf Celebration */}
      {showCleanLeaf && (
        <CleanLeafCelebration
          dailyColor={dailyColor}
          companion={companion}
          cleanDayCount={cleanDaysThisMonth}
          onDismiss={() => setShowCleanLeaf(false)}
        />
      )}
    </div>
  );
}
```

**Step 2: Implement companion expression triggers**

Wire up expression changes:
- Task completed → `setCompanionExpression('happy')` for 300ms, then back to neutral
- Section completed → `setCompanionExpression('excited')` for 1s + change reactive message to `section_done`
- All sections complete → `setCompanionExpression('excited')` + show `CleanLeafCelebration`
- No activity 30+ min → `setCompanionExpression('sleepy')` + change reactive message to `stuck`
- Page load → set reactive message to `morning_greeting`

**Step 3: Implement habit auto-population**

On date change or mount, iterate through `habits` array. For each habit:
- Check if a task with `sourceHabit === habit.name` already exists for `currentDate`
- If not, create one: `addEntry({ id: uid(), type: 'task', title: habit.name, date: currentDate, status: 'todo', sourceHabit: habit.name, section: /* use first section or unassigned */ })`
- Existing habit-task completion continues to sync via the existing `sourceHabit` mechanism

**Step 4: Implement week completion status**

For each day in the visible week, check entries:
- `'complete'` if all sections have all tasks done
- `'partial'` if some tasks done
- `'none'` if no tasks completed

**Step 5: Wire up achievement checks**

After each task completion, build an `AchievementContext` from current state and call `checkAchievements()`. If new achievements are unlocked, call `unlockAchievement()` for each and trigger companion excited expression + show achievement toast.

**Step 6: Remove old multi-day code**

Remove: `DayColumn`, `ZoomedSection`, `ResizableTimelineCard`, `SectionManager` (from the file — SectionManager can be re-added later as a popover). Remove infinite scroll logic, chip bar, allDayOffsets, etc.

**Step 7: Run build**

Run: `npm run build`
Expected: PASS

**Step 8: Commit**

```bash
git add src/pages/FlowView.tsx
git commit -m "feat: rewrite FlowView as today-first layout with companion panel"
```

---

## Phase 4: Dopamine Layer

### Task 8: Enhance TaskCelebration with variable intensity

**Files:**
- Modify: `src/components/TaskCelebration.tsx`

**Step 1: Add ink-stamp micro-feedback**

Before the queued confetti celebration, add a synchronous CSS animation on the checkbox element:
- Ink-stamp fill effect (100ms scale bounce)
- Title strikethrough with ink-fade effect (already exists in CSS, ensure it fires)
- Micro page-shake: apply `transform: translateX(2px)` for 80ms to the task card

**Step 2: Add variable intensity**

Introduce a `celebrationIntensity` function that randomly decides:
- 40% chance: standard celebration (existing confetti effect)
- 30% chance: bigger celebration (double particles, 1.5x duration)
- 20% chance: minimal celebration (just the row glow, no confetti)
- 10% chance: MEGA celebration (triple burst + companion one-liner)

This implements Eyal's variable reward — the response is never predictable.

**Step 3: Add section completion celebration**

Export a `celebrateSection(sectionElement: HTMLElement)` function:
- Wax-seal "DONE" badge animation on the section header
- Companion goes excited (caller handles this via callback)
- 500ms burst of confetti focused on the section area

**Step 4: Run build**

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/TaskCelebration.tsx
git commit -m "feat: add variable celebration intensity and section completion effects"
```

---

### Task 9: Add achievement toast notifications

**Files:**
- Create: `src/components/AchievementToast.tsx`

**Step 1: Create the toast component**

A toast that slides in from top-right when an achievement is unlocked:
- Shows emoji icon + achievement name + description
- Auto-dismisses after 5 seconds
- Has a dismiss button
- Uses a queue system (multiple achievements → queued toasts)

```typescript
import { useState, useEffect } from 'react';

interface AchievementToastProps {
  achievement: { name: string; icon: string; description: string };
  onDismiss: () => void;
}

export default function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`fixed top-20 right-4 z-[150] transition-all duration-300 ${
      visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-paper rounded-xl shadow-lifted border border-wood-light/20 p-4 flex items-center gap-3 max-w-sm">
        <span className="text-3xl animate-bounce">{achievement.icon}</span>
        <div>
          <p className="font-mono text-[11px] text-primary uppercase tracking-wider">Achievement Unlocked</p>
          <p className="font-display italic text-base text-ink">{achievement.name}</p>
          <p className="font-body text-sm text-ink/60">{achievement.description}</p>
        </div>
        <button onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }} className="text-pencil/40 hover:text-ink transition-colors shrink-0">
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/AchievementToast.tsx
git commit -m "feat: add AchievementToast notification component"
```

---

## Phase 5: Polish + Mobile

### Task 10: Mobile companion + responsive layout

**Files:**
- Modify: `src/pages/FlowView.tsx`

**Step 1: Add mobile companion floating avatar**

On screens < md breakpoint:
- CompanionPanel is hidden
- A floating circular avatar appears at bottom-left (fixed positioning)
- Tap opens a slide-up sheet with the full CompanionPanel content
- Sheet dismisses on tap outside or swipe down

**Step 2: Adjust section layout for mobile**

- Sections already stack vertically (no changes needed)
- Parking lot drawer at bottom remains the same
- Week strip stays at top with smaller buttons (use `min-w-[36px]` instead of 44)

**Step 3: Run build**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/pages/FlowView.tsx
git commit -m "feat: add mobile companion avatar and responsive layout"
```

---

### Task 11: Simplified section headers

**Files:**
- Modify: `src/components/flow/SectionHeader.tsx`

**Step 1: Simplify to 3 visible elements**

Replace current 6-element header with:
1. Section name (editable on double-click) — same as before
2. Completion count "X of Y" — replaces separate task/event counts
3. Section accent color (background tint) — same as before

Move to hover/right-click context menu:
- Time range adjustment
- Zoom into hourly view
- Unpin all times
- Section color picker
- Day pinning

**Step 2: Add section states**

- **Empty:** Dashed border, "What's on the agenda?" placeholder
- **Active (has undone tasks):** Full accent color, solid border
- **Complete (all done):** Wax seal badge overlay, dimmed body, ✓ indicator
- **Current time:** Subtle pulsing border

**Step 3: Run build**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/flow/SectionHeader.tsx
git commit -m "feat: simplify section headers with progressive disclosure"
```

---

### Task 12: Final integration + verification

**Files:**
- Modify: `src/pages/FlowView.tsx` (final wiring)

**Step 1: Wire everything together**

Ensure all pieces connect:
- CompanionPanel receives live section progress
- Achievement checks fire on task/section completion
- CleanLeaf celebration fires when all sections complete
- Reactive messages update on state changes
- Habit tasks auto-populate on date change
- Week strip shows accurate completion dots

**Step 2: Full verification checklist**

Run: `npm run build`
Expected: PASS

Manual verification:
- [ ] Today-first layout renders: companion panel + sections + week strip
- [ ] Companion expressions change on task completion
- [ ] Companion messages are reactive to state (at least: greeting, first_task, section_done, all_done)
- [ ] Achievement pops on trigger with toast + companion excitement
- [ ] Clean Leaf celebration appears when all sections complete
- [ ] Habits auto-populate as tasks in sections
- [ ] Parking lot works as bottom drawer
- [ ] Week strip navigates between days
- [ ] Section headers simplified (name + count, hover for more)
- [ ] Task completion has "juice" (animation, variable intensity)
- [ ] `npm run build` passes
- [ ] Mobile responsive (companion collapses to floating avatar)

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: FlowView redesign — today-first layout with companion, achievements, and dopamine layer"
```

---

## Execution Order Summary

| # | Task | Est. | Creates/Modifies |
|---|------|------|------------------|
| 1 | Achievement types + AppContext | 15 min | `achievements.ts`, `AppContext.tsx` |
| 2 | Reactive messages on companions | 30 min | `colorOfTheDay.ts` |
| 3 | WeekStrip component | 10 min | `WeekStrip.tsx` |
| 4 | CompanionPanel component | 15 min | `CompanionPanel.tsx` |
| 5 | CleanLeafCelebration overlay | 10 min | `CleanLeafCelebration.tsx` |
| 6 | Extract FlowView sub-components | 20 min | `flow/*.tsx`, `FlowView.tsx` |
| 7 | Rewrite FlowView as today-first | 45 min | `FlowView.tsx` |
| 8 | Enhanced TaskCelebration | 15 min | `TaskCelebration.tsx` |
| 9 | AchievementToast notifications | 10 min | `AchievementToast.tsx` |
| 10 | Mobile companion + responsive | 15 min | `FlowView.tsx` |
| 11 | Simplified section headers | 10 min | `SectionHeader.tsx` |
| 12 | Final integration + verification | 15 min | `FlowView.tsx` |

**Total estimated: ~3.5 hours of implementation time.**

Tasks 1-5 are independent and can be parallelized.
Task 6 (extraction) must precede Task 7 (rewrite).
Tasks 8-11 depend on Task 7 being complete.
Task 12 is the final integration pass.
