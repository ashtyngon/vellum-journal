# FlowView Redesign: Today-First + Companion System

## Design Principles (from research)

**Norman (Design of Everyday Things):** Managed complexity over minimalism. Don't remove features — organize them spatially. Close the Gulf of Evaluation with persistent progress visibility. Use signifiers that teach beginners and disappear for experts.

**Norman (Emotional Design):** Three levels working simultaneously — visceral (warm vellum aesthetic, animations), behavioral (speed, satisfaction of checking off), reflective (companion relationship, achievements as identity).

**Fogg (Tiny Habits):** Celebration at the moment of completion wires habits neurologically. Make the first action near-zero effort. Reduce decisions at point of action.

**Eyal (Hooked):** Variable reward > fixed reward. The companion's messages, achievement pops, and celebration intensity should NEVER be predictable. 50% hit rate of "that was amazing" produces maximum dopamine.

**ADHD-specific:** Interest-based nervous system needs novelty, immediate feedback, and zero shame. No streaks. No guilt mechanics. The companion never shames — the worst it gets is playful concern.

**Core competitive frame:** This app competes with Instagram/TikTok for ADHD attention. Completion dopamine > consumption dopamine, but the activation energy must be near-zero and the reward must be emotionally resonant.

---

## Layout: Today-First

### Kill the multi-day horizontal scroll
One day fills the screen. The week exists as a compact strip at top for navigation/glancing. This is where ADHD brains live — the present moment.

### Three zones

```
┌──────────────────────────────────────────────────┐
│  Mon  Tue  [WED]  Thu  Fri  Sat  Sun             │ ← Week strip
├────────────┬─────────────────────────────────────┤
│            │                                     │
│ COMPANION  │         SECTIONS                    │
│ PANEL      │                                     │
│            │  ┌─ Morning Focus ───────────────┐  │
│ (always    │  │  tasks...                     │  │
│  visible)  │  └───────────────────────────────┘  │
│            │                                     │
│            │  ┌─ Afternoon ───────────────────┐  │
│            │  │  tasks...                     │  │
│            │  └───────────────────────────────┘  │
│            │                                     │
│            │  ┌─ Evening ─────────────────────┐  │
│            │  │  tasks...                     │  │
│            │  └───────────────────────────────┘  │
│            │                                     │
│            │  ▔▔▔ Parking Lot (N) ← drawer    │  │
├────────────┴─────────────────────────────────────┤
```

### Week strip
- Compact row of day labels (Mon-Sun)
- Current day highlighted with accent color
- Each day shows a subtle completion indicator (filled dot = all done, half = in progress, empty = nothing done)
- Click to navigate. Arrow keys work too.
- Past days: slightly muted. Future days: available for planning.

### Parking lot
- Collapsed by default as a bottom drawer showing only count badge
- Click/tap to expand upward
- Tasks draggable from parking lot into sections
- Minimal list view: just title + schedule button

### Mobile
- Companion panel collapses into a floating companion avatar (bottom-left)
- Tap avatar to expand companion panel as a slide-up sheet
- Sections stack vertically (already do)

---

## Companion Panel

### Visual structure

```
┌──────────────────┐
│   ┌───────────┐  │
│   │ COMPANION │  │  Gradient background from daily color
│   │  (image)  │  │  PNG animal with CSS expression states
│   └───────────┘  │
│                   │
│   Name    Lv.N   │  Font: italic header
│   Personality     │  Font: body, ink/60
│                   │
│   ─────────────   │
│                   │
│   "Reactive       │  Font: body italic, ink/70
│    message here"  │  Changes based on user state
│                   │
│   ─────────────   │
│                   │
│   Sections        │
│   ✓ Morning       │  Visual section progress
│   ◐ Afternoon     │  (done/in-progress/not-started)
│   ○ Evening       │
│                   │
│   ─────────────   │
│                   │
│   🏆 Achievement  │  Most recent or next hint
│      badge area   │
│                   │
└──────────────────┘
```

### Width
- Desktop: ~240px fixed width
- Collapsible on medium screens (icon-only mode)

### Companion Expressions (4 states via CSS)
All achieved through CSS transforms on the existing animal PNG — no new assets.

| State | CSS | Trigger |
|---|---|---|
| Neutral | `transform: none; opacity: 1` | Default |
| Happy | `transform: scale(1.05); transition: bounce` | Task completed |
| Excited | `transform: scale(1.1); filter: brightness(1.1)` + glow ring | Milestone (section done, achievement) |
| Sleepy | `transform: rotate(-5deg); opacity: 0.7` | No activity 30+ min |

### Reactive Message System
Each companion has messages for each state. Messages are selected randomly from the pool for that state, ensuring variability (variable reward).

**States and triggers:**

| State | Trigger | Example (Fox) | Example (Bramble) |
|---|---|---|---|
| morning_greeting | Page load, AM | "I've been casing your schedule all morning." | "You look like you haven't eaten breakfast." |
| first_task | First task completed today | "Phase one complete. Smooth." | "WATER. Drink it. NOW." |
| momentum | 2nd-3rd task in a row | "The heist is in motion." | "You're doing great but sit DOWN." |
| section_done | All tasks in a section completed | "Section sealed. Evidence acquired." | "I packed you emotional snacks." |
| all_done | All sections completed | "Rendezvous same time tomorrow." | "I'm so proud I could CRY." |
| stuck | No task done in 2+ hours | "Need to adjust the plan?" | "Who hurt you today?" |
| return | App opened after 1+ day absence | "Ah, there you are." | "WELCOME BACK. Sit. Eat." |
| habit_done | Habit task completed | "Predictably excellent." | "That's my person." |
| overdue_cleared | Overdue task finally completed | "3 days. But you did it." | "FINALLY. I was WORRIED." |

Each companion needs ~3-5 messages per state for variability. With 100 companions, this is a content system — the messages ARE the product.

### Section Progress Indicators
Three small indicators showing Morning/Afternoon/Evening status:
- `○` = not started (no tasks done)
- `◐` = in progress (some tasks done)
- `✓` = complete (all tasks done)

This replaces the task-count progress bar. It's effort-agnostic — completing a section with 1 hard task is equivalent to completing one with 5 easy tasks.

---

## Achievement System

### Core principles
- Achievements are SURPRISES, not a visible checklist
- Pop as discoveries when triggered — companion goes excited + toast notification
- Variable emotional tone (some funny, some touching, some absurd)
- NEVER shame. The worst achievements are still celebrations.
- Level = f(achievements unlocked, total active days)

### Achievement categories

**Consistency (cumulative days, NOT consecutive):**
- "Showed Up" — 1 active day
- "Regular" — 10 active days
- "Rooted" — 30 active days
- "Part of the Furniture" — 100 active days

**Momentum:**
- "First Blood" — first task completed ever
- "On a Roll" — 5 tasks completed in one session
- "Avalanche" — complete entire section in under 30 min
- "Speedrun" — complete all daily tasks in under 2 hours

**Sections:**
- "Full Morning" — all morning tasks done
- "Clean Sweep" — all sections done in a day
- "Hat Trick" — 3 clean sweep days total
- "Grand Slam" — 5 clean sweep days in a month

**Journaling:**
- "Dear Diary" — first journal exercise completed
- "Method Actor" — tried 3 different journal methods
- "Self-Archaeologist" — 10 exercises completed
- "Cartographer" — completed a debrief

**Time Patterns:**
- "Early Bird" — completed tasks before 8am
- "Night Owl" — journaled after 10pm
- "Weekend Warrior" — active on a Saturday or Sunday

**Resilience (the anti-shame category):**
- "Phoenix" — came back after 7+ day absence ("That takes more courage than a streak ever could.")
- "Parking Pro" — used parking lot 10 times (guilt-free deferral is a SKILL)
- "Not Today" — deferred 3 tasks without guilt (companion celebrates this)
- "Plot Twist" — completed a task that was rescheduled 3+ times

**Collections:**
- "Curator" — created first collection
- "Archivist" — 10 items in a collection

### Achievement storage
Stored in Firestore under user profile. Each achievement has:
- `id: string` — unique key
- `unlockedAt: string` — ISO date
- `seen: boolean` — whether the user has dismissed the notification

### Level calculation
`level = floor(sqrt(achievementCount * 10 + activeDays))`
This produces: Lv.1 at start, Lv.3 after ~1 week of active use, Lv.7 after a month, Lv.15+ for long-term users. Growth slows naturally without a cap.

---

## Task Interaction: The "Juice" Layer

Every interaction has emotional feedback themed to the vellum/paper aesthetic.

### Task completion
1. Checkbox fills with ink-stamp animation (100ms)
2. Title gets strikethrough with ink-fade effect
3. Micro page-shake (2px, 80ms) — the "weight" of stamping
4. Companion bounces (happy expression, 300ms)
5. Sound: subtle stamp/click (optional, user-togglable)
6. VARIABLE: sometimes the stamp is bigger, sometimes there's a small flourish particle, sometimes the companion delivers a one-liner. NOT the same every time.

### Section completion
1. All the above for the final task
2. Section header gets a wax-seal "DONE" badge (animated press)
3. Companion goes EXCITED expression (bigger bounce, glow ring)
4. Companion delivers a section-complete message
5. Section body gracefully dims (opacity transition) so the active section gets more visual weight
6. Section progress indicator in companion panel updates: ○ → ✓

### ALL sections completed ("Clean Leaf" moment)
1. Full-screen overlay transition (page-turn animation)
2. Clean leaf illustration — the daily color gradient as background
3. Companion in celebrating state (center, large)
4. Companion's BEST line for this state
5. If achievement unlocked, it appears below
6. "Your Xth clean day this month" counter
7. Dismisses on click/tap — returns to the completed view

### Task addition
- Inline input always visible at bottom of each section
- Type and Enter — zero friction (Fogg's ability dimension)
- Ink-appearing animation (text fades in like being written)
- Natural language parsing (existing: "email sarah 2pm 30m" → task with time + duration)

### Drag and drop
- Card lifts with paper shadow on grab
- Smooth physics animation on move
- Drop zone highlights with section accent color
- Landing: card settles with slight bounce

### Overdue/rescheduled task completion
- All normal completion feedback PLUS:
- Special "redemption" pulse (amber glow)
- Companion notices: dedicated overdue_cleared message
- If rescheduled 3+ times → "Plot Twist" achievement check

---

## Section Header Design (Simplified)

Current section headers have: collapse chevron, editable name, time range, task/event counts, unpin-times button, zoom button. That's 6 elements competing for attention.

### New design: 3 elements visible, rest on demand

```
┌─ Morning Focus ──────────── 2 of 4 ─┐
```

Visible always:
1. Section name (editable on double-click)
2. Completion count (X of Y) — this IS the progress signal
3. Section accent color (background tint)

Available on hover/right-click:
- Time range adjustment
- Zoom into hourly view
- Unpin all times
- Section color picker
- Day pinning (which days this section appears)

This is Norman's progressive disclosure: beginners see a clean header; power users access everything through hover.

### Section states
- **Empty:** Dashed border, "What's on the agenda?" placeholder
- **Active (has undone tasks):** Full accent color, solid border
- **Complete (all done):** Wax seal badge, dimmed body, ✓ in companion panel
- **Current time:** Subtle pulsing border or "NOW" indicator

---

## Week Strip Design

```
┌─────────────────────────────────────────────────┐
│  ← Mon  Tue  [WED]  Thu  Fri  Sat  Sun →       │
│         ●    ◐      ○    ○                      │
└─────────────────────────────────────────────────┘
```

- Current day: highlighted with accent color, bold
- Completion dots below each day: ● done, ◐ partial, ○ empty
- Past days with no activity: muted text
- Weekend days: slightly different styling
- Arrows for prev/next week
- Click any day to navigate (loads that day's sections + entries)

---

## Habits as Tasks

Habits auto-populate as tasks within sections each day. They are:
- Visually distinct: sage left-border + small "habit" badge (existing pattern)
- Assigned to sections via habit config (habit.section field)
- If no section assigned: appear in parking lot
- Completion syncs to HabitTrace (existing sourceHabit mechanism)
- Habit completion triggers companion habit_done message

---

## Data Model Changes

### New fields on user profile (Firestore)
```typescript
interface UserProfile {
  // ... existing fields
  achievements: Achievement[];
  level: number;
  totalActiveDays: number;
  lastActiveDate: string; // YYYY-MM-DD
}

interface Achievement {
  id: string;          // e.g. "first_blood", "clean_sweep"
  unlockedAt: string;  // ISO date
  seen: boolean;       // dismissed notification
}
```

### New fields on DailyCompanion
```typescript
interface DailyCompanion {
  // ... existing fields
  reactiveMessages: {
    morning_greeting: string[];
    first_task: string[];
    momentum: string[];
    section_done: string[];
    all_done: string[];
    stuck: string[];
    return_after_absence: string[];
    habit_done: string[];
    overdue_cleared: string[];
  };
}
```

### Achievement definitions (separate module)
```typescript
interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;        // emoji or material icon
  check: (ctx: AchievementContext) => boolean;
}
```

---

## Files to create/modify

### New files
- `src/lib/achievements.ts` — Achievement definitions + checker
- `src/components/CompanionPanel.tsx` — Persistent companion sidebar
- `src/components/WeekStrip.tsx` — Compact week navigation
- `src/components/CleanLeafCelebration.tsx` — Full-screen completion overlay
- `src/components/SectionCard.tsx` — Extracted, simplified section component

### Modified files
- `src/pages/FlowView.tsx` — Major restructure: today-first layout, remove multi-day columns
- `src/lib/colorOfTheDay.ts` — Add reactiveMessages to companion data
- `src/context/AppContext.tsx` — Add achievement tracking, active day tracking
- `src/components/TaskCelebration.ts` — Enhanced variable celebration system

### Removed/deprecated
- Multi-day DayColumn component (replaced by today-first + week strip navigation)
- Habits sidebar (habits become tasks in sections)
- Section settings panel (replaced by hover/right-click progressive disclosure)

---

## Verification criteria
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
