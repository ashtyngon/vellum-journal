# Vellum Journal UX Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform a static prototype into a therapeutic digital bullet journal with guided rituals, ADHD-friendly tools, and evidence-based journaling methods.

**Architecture:** React 19 + TypeScript + Vite 7 + Tailwind 3 + Firebase Auth/Firestore. Single AppContext holds all state with Firestore persistence. Pages are route-based components. New data model replaces Task with unified RapidLogEntry supporting BuJo entry types (task/event/note). New shared components for journaling walkthrough, procrastination unpacker, and day recovery.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS 3, Firebase 12 (Auth + Firestore), canvas-confetti, react-router-dom 6

**Design doc:** `docs/plans/2026-02-17-ux-redesign.md`

---

## Phase 1: Data Model & Context (Foundation)

Everything depends on this. Replace Task with RapidLogEntry, add Collections, DayDebrief, update JournalEntry.

### Task 1: Update Data Types & AppContext

**Files:**
- Modify: `src/context/AppContext.tsx` (full rewrite)

**What to build:**

Replace the `Task` interface with `RapidLogEntry`:

```typescript
export interface RapidLogEntry {
  id: string;
  type: 'task' | 'event' | 'note';
  title: string;
  date: string;
  status?: 'todo' | 'done' | 'migrated' | 'deferred';
  priority?: 'low' | 'medium' | 'high';
  movedCount?: number;
  timeBlock?: string;
  duration?: string;
  time?: string;
  tags?: string[];
  notes?: string;
}

export interface Collection {
  id: string;
  title: string;
  items: CollectionItem[];
  createdAt: string;
}

export interface CollectionItem {
  id: string;
  text: string;
  done: boolean;
  order: number;
}

export interface DayDebrief {
  date: string;
  planRealism: number;
  accomplishment: number;
  mood: string;
  reflection?: string;
}

export interface JournalStep {
  prompt: string;
  answer: string;
}

// Update existing JournalEntry
export interface JournalEntry {
  id: string;
  date: string;
  title?: string;
  content: string;
  mood?: string;
  tags?: string[];
  image?: string;
  wins?: string[];
  method?: string;
  steps?: JournalStep[];
}

// Habit stays the same
export interface Habit {
  id: string;
  name: string;
  streak: number;
  completedDates: string[];
  color: string;
}
```

**AppContextType interface** — replace tasks with entries, add new collections/debriefs:

```typescript
interface AppContextType {
  entries: RapidLogEntry[];
  habits: Habit[];
  journalEntries: JournalEntry[];
  collections: Collection[];
  debriefs: DayDebrief[];
  loading: boolean;
  // Entries CRUD
  addEntry: (entry: RapidLogEntry) => void;
  updateEntry: (id: string, updates: Partial<RapidLogEntry>) => void;
  deleteEntry: (id: string) => void;
  // Habits CRUD (unchanged)
  toggleHabit: (id: string, date: string) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  // Journal CRUD (unchanged)
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  // Collections CRUD
  addCollection: (collection: Collection) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addCollectionItem: (collectionId: string, item: CollectionItem) => void;
  updateCollectionItem: (collectionId: string, itemId: string, updates: Partial<CollectionItem>) => void;
  deleteCollectionItem: (collectionId: string, itemId: string) => void;
  reorderCollectionItems: (collectionId: string, items: CollectionItem[]) => void;
  // Debriefs
  saveDebrief: (debrief: DayDebrief) => void;
}
```

**Implementation notes:**
- Migrate seed data: existing tasks become `RapidLogEntry` with `type: 'task'`, `status: 'todo'`, `movedCount: 0`
- Add sample events and notes to seed data
- Add empty arrays for `collections` and `debriefs`
- Firestore save/load: add `collections` and `debriefs` fields to the user document
- All CRUD uses the same `useCallback` + debounced save pattern as current code
- Keep the `useAuth()` dependency and loading state logic

**Step 1:** Rewrite `AppContext.tsx` with new interfaces, context type, and all CRUD functions
**Step 2:** Run `npx tsc --noEmit` — expect errors in every page that uses `useApp()` (they reference `tasks` which no longer exists). That's expected; we fix pages in later tasks.
**Step 3:** Commit: `feat: replace Task with RapidLogEntry, add Collections and DayDebrief to data model`

---

## Phase 2: Shared Components (Reusable building blocks)

These components are used across multiple pages. Build them before the pages.

### Task 2: Journal Walkthrough Component

**Files:**
- Create: `src/components/JournalWalkthrough.tsx`

**What to build:**

A Stoic-style one-question-at-a-time journal walkthrough. Used by all 7 journaling methods.

Props:
```typescript
interface JournalWalkthroughProps {
  method: string;                    // e.g. 'five-whys'
  steps: { prompt: string; placeholder?: string; inputType?: 'textarea' | 'slider' | 'select' | 'body-picker'; options?: string[] }[];
  onComplete: (answers: JournalStep[]) => void;
  onCancel: () => void;
}
```

Behavior:
- Full-screen overlay with warm paper background
- Shows ONE step at a time, centered vertically
- Step counter: "3 of 7" in top-right, subtle
- Current prompt in `font-display italic text-2xl`
- Input area below (textarea default, or slider/select for special steps)
- "Next" button (disabled until input has content). Enter key also advances.
- Smooth fade transition between steps (opacity + translateY)
- Previous answers are HIDDEN (not visible)
- After last step → **Reveal screen**: all prompts + answers stacked beautifully
  - Each Q&A pair in a card
  - Scroll if many
  - "What did you discover?" final input at bottom (optional)
- "Save" button → calls `onComplete` with all `JournalStep[]`
- "Back" button on each step to go to previous step
- "Cancel" X button → calls `onCancel`
- For Pattern Breaker: reveal screen shows dramatic vs. facts side-by-side

**Step 1:** Create the component
**Step 2:** Verify it compiles: `npx tsc --noEmit` (may still have page errors, just check this file)
**Step 3:** Commit: `feat: add JournalWalkthrough Stoic-style one-at-a-time component`

### Task 3: Procrastination Unpacker Component

**Files:**
- Create: `src/components/ProcrastinationUnpacker.tsx`

**What to build:**

Full-screen focused overlay for working through task avoidance.

Props:
```typescript
interface ProcrastinationUnpackerProps {
  task: RapidLogEntry;
  onClose: () => void;
  onUpdateTask: (updates: Partial<RapidLogEntry>) => void;
}
```

Behavior:
- Full-screen overlay, everything else hidden
- Shows ONLY the task title at top in `font-display text-3xl`
- Step-by-step walkthrough (same one-at-a-time UX as JournalWalkthrough):
  1. "What happens when you think about starting this?" (textarea)
  2. "What's in the way?" — 6 pill buttons: Too big / Unclear next step / Afraid of doing it wrong / Don't want to / Boring / Something else
  3. Branching response based on pick (each is a textarea with a specific prompt):
     - Too big → "What's the tiniest first step? Something you could do in 2 minutes."
     - Unclear → "What question would you need answered before starting? Can you find out in 5 minutes?"
     - Afraid → "What's the worst version of 'done' that's still better than not started?"
     - Don't want to → "Is this actually yours to do? Could you delegate it, drop it, or defer it?"
     - Boring → "Can you pair it with something enjoyable? Music, a snack, a 15-min sprint?"
     - Something else → free text + "What would make this feel 10% easier?"
  4. "Ready to try for just 5 minutes?" — Yes / Not yet
     - Yes → shows countdown timer (5:00, ticking down), with "Keep going" and "Done for now" buttons
     - Not yet → "That's OK. You showed up by thinking about it. That counts." + close
  5. After timer: "Keep going?" or "That's enough for now — you started, and that counts ✓"
- Close X button always available

**Step 1:** Create the component
**Step 2:** Verify compile
**Step 3:** Commit: `feat: add ProcrastinationUnpacker guided task-avoidance tool`

### Task 4: Day Recovery Banner Component

**Files:**
- Create: `src/components/DayRecovery.tsx`

**What to build:**

Banner/overlay that reframes the remaining day as abundant.

Props:
```typescript
interface DayRecoveryProps {
  entries: RapidLogEntry[];  // today's tasks
  onSelectTask: (taskId: string) => void;
  onDismiss: () => void;
}
```

Behavior:
- Appears as a warm banner at the top of DailyLeaf (not a full overlay)
- Calculates remaining hours: `(22 - currentHour)` hours until 10pm
- Step 1 (shown by default): "It's [2:14 PM]. You still have [X hours] before evening. That's a full [afternoon/half-day]."
- Step 2: "Pick just ONE thing to do before [next hour]. Just one." — shows today's undone tasks as simple buttons
- Step 3 (after picking): "Your only job right now is: [task name]. Everything else can wait." — shows just that task, big and centered, with an optional 15-min timer button
- Timer: simple countdown, "Done!" button to mark task complete, or "Stop" to end timer
- Dismiss X button on banner
- No guilt language anywhere. Tone: warm, factual, encouraging.
- Auto-triggers: shown if `currentHour >= 12 && no tasks have status='done' today`
- Can also be triggered manually via "Reset My Day" button on DailyLeaf

**Step 1:** Create the component
**Step 2:** Verify compile
**Step 3:** Commit: `feat: add DayRecovery banner for all-or-nothing day resets`

### Task 5: Day Debrief Component

**Files:**
- Create: `src/components/DayDebrief.tsx`

**What to build:**

Evening reflection on workload — how realistic was the plan, how did it go.

Props:
```typescript
interface DayDebriefProps {
  todayEntries: RapidLogEntry[];
  onSave: (debrief: DayDebrief) => void;
  onSkip: () => void;
}
```

Behavior:
- Card-style section in evening mode (not overlay)
- Shows today's stats at top: "You planned [N] tasks. You completed [X]."
- Three inputs (one at a time, gentle transitions):
  1. "How realistic was your plan today?" — 5-point slider with labels (Way too little ↔ Way too much)
  2. "How much did you get done?" — 5-point slider (Almost nothing ↔ Everything)
  3. "How do you feel about today?" — mood picker (5 emoji-style options)
- After all 3: generates a contextual gentle message based on answers:
  - If completed > 60%: "You finished more than half — that's real progress."
  - If plan was too ambitious: "Planning less tomorrow isn't failure. It's wisdom."
  - If low accomplishment + low mood: "Hard days happen. You still showed up by reflecting. That matters."
  - etc. (pool of ~20 messages mapped to combinations)
- Optional text field: "Anything else to note about today?"
- "Save" button → calls onSave
- "Skip" link → calls onSkip

**Step 1:** Create the component
**Step 2:** Verify compile
**Step 3:** Commit: `feat: add DayDebrief evening workload reflection component`

### Task 6: Contextual Prompt Generator

**Files:**
- Create: `src/lib/prompts.ts`

**What to build:**

A function that generates the morning prompt — both contextual (from data) and inspirational (rotating).

```typescript
export function generateMorningPrompt(data: {
  entries: RapidLogEntry[];
  habits: Habit[];
  journalEntries: JournalEntry[];
  debriefs: DayDebrief[];
}): { contextual: string; inspirational: string }
```

**Contextual examples** (picks the most relevant based on data):
- "You have [N] tasks from yesterday still open — want to review them?"
- "You've had a [N]-day streak on [habit] — keep it going!"
- "Yesterday you said the plan was too ambitious. Be gentle with today."
- "You finished everything yesterday — nice. Same energy?"
- "It's been [N] days since your last journal entry. How about a quick reflection tonight?"
- "You have [event] coming up on [day]. Plan around it."

**Inspirational pool** (50+ rotating, never same twice in 7 days — track last shown via date hash):
- "What would make today feel successful — even a little?"
- "You don't have to do everything. You just have to start."
- "What's one thing you'd be proud of finishing?"
- "A good day isn't a perfect day. It's a present day."
- "What can you let go of today?"
- etc.

Uses deterministic rotation: `promptPool[dayOfYear % promptPool.length]` to avoid showing same prompt, with offset for variety.

**Step 1:** Create the file with prompt pools and generation logic
**Step 2:** Verify compile
**Step 3:** Commit: `feat: add contextual + inspirational morning prompt generator`

### Task 7: BuJo Guidance Hints

**Files:**
- Create: `src/lib/bujoHints.ts`

**What to build:**

Rotating placeholder hints and signifier tooltip data for the rapid log.

```typescript
// Placeholder hints by entry type
export const RAPID_LOG_PLACEHOLDERS: Record<'task' | 'event' | 'note', string[]> = {
  task: [
    "Call dentist to reschedule",
    "Research flights to Portland",
    "Draft intro for blog post",
    "Buy birthday gift for Mom",
    "Reply to Sarah's email",
    "Fix the leaky faucet",
    "Read chapter 3 of book",
    "Submit expense report",
    // ... 20+ total
  ],
  event: [
    "Coffee with Alex at 10am",
    "Team standup at 9",
    "Dentist appointment Thursday",
    "Mom's birthday next Friday",
    "Concert tickets Saturday 7pm",
    // ... 15+ total
  ],
  note: [
    "Idea: try morning walks before coffee",
    "The meeting went better than expected",
    "Liked that podcast episode on focus",
    "New recipe to try: miso salmon",
    "Feeling more energetic this week",
    // ... 15+ total
  ]
};

// Returns a rotating hint that changes each time input is focused
export function getPlaceholder(type: 'task' | 'event' | 'note'): string;

// Signifier tooltip data
export const SIGNIFIER_TOOLTIPS = [
  { symbol: '•', meaning: 'Task — something to do', shown: false },
  { symbol: '×', meaning: 'Done — completed', shown: false },
  { symbol: '>', meaning: 'Migrated — moved forward', shown: false },
  { symbol: '○', meaning: 'Event — something that happened or is planned', shown: false },
  { symbol: '—', meaning: 'Note — a thought, idea, or observation', shown: false },
];
```

**Step 1:** Create the file
**Step 2:** Verify compile
**Step 3:** Commit: `feat: add BuJo guidance hints and placeholder system`

### Task 8: Journal Method Definitions

**Files:**
- Create: `src/lib/journalMethods.ts`

**What to build:**

Static definitions for all 7 journaling methods — steps, prompts, metadata.

```typescript
export interface MethodStep {
  prompt: string;
  placeholder?: string;
  inputType?: 'textarea' | 'slider' | 'select' | 'body-picker';
  options?: string[];  // for select type
  min?: number;        // for slider
  max?: number;
}

export interface JournalMethod {
  id: string;
  name: string;
  description: string;
  icon: string;        // Material Symbols icon name
  category: 'cbt' | 'integration' | 'daily';
  steps: MethodStep[];
}

export const JOURNAL_METHODS: JournalMethod[] = [
  {
    id: 'thought-record',
    name: 'Thought Record',
    description: 'Process a stressful moment step by step',
    icon: 'psychology',
    category: 'cbt',
    steps: [
      { prompt: 'What happened? Describe the situation briefly.', placeholder: 'I was in a meeting and...' },
      { prompt: 'What thought popped into your head?', placeholder: 'The automatic thought was...' },
      { prompt: 'What emotion did you feel? How intense was it?', inputType: 'slider', min: 0, max: 100 },
      { prompt: 'What evidence supports this thought?', placeholder: 'Evidence for...' },
      { prompt: 'What evidence goes against it?', placeholder: 'Evidence against...' },
      { prompt: 'What\'s a more balanced way to see this?', placeholder: 'A balanced thought might be...' },
      { prompt: 'How intense is the emotion now?', inputType: 'slider', min: 0, max: 100 },
    ]
  },
  {
    id: 'five-whys',
    name: '5 Whys',
    description: 'Dig to the root of what\'s bothering you',
    icon: 'search',
    category: 'cbt',
    steps: [
      { prompt: 'What\'s on your mind? What\'s bothering you?', placeholder: 'I keep thinking about...' },
      { prompt: 'Why does that bother you?', placeholder: 'Because...' },
      { prompt: 'And why does that matter to you?', placeholder: 'It matters because...' },
      { prompt: 'Go deeper — why?', placeholder: 'Underneath that...' },
      { prompt: 'One more time — why?', placeholder: 'At the core...' },
      { prompt: 'What\'s the root belief you\'ve uncovered?', placeholder: 'I believe that...' },
      { prompt: 'Now that you see it — what did you discover?', placeholder: 'I realize...' },
    ]
  },
  {
    id: 'positive-data-log',
    name: 'Positive Data Log',
    description: 'Collect evidence that the world is kind',
    icon: 'favorite',
    category: 'cbt',
    steps: [
      { prompt: 'What\'s a belief you\'re trying to change?', placeholder: 'e.g., Nobody really cares about me' },
      { prompt: 'What\'s a kinder version of that belief?', placeholder: 'e.g., People show care in small ways' },
      { prompt: 'What happened today that supports the kinder belief?', placeholder: 'Today I noticed...' },
      { prompt: 'How much do you believe the kinder version right now?', inputType: 'slider', min: 0, max: 100 },
    ]
  },
  {
    id: 'pattern-breaker',
    name: 'Pattern Breaker',
    description: 'Rewrite the story you\'re telling yourself',
    icon: 'auto_fix_high',
    category: 'cbt',
    steps: [
      { prompt: 'What\'s the story you\'re telling yourself right now?', placeholder: 'The story in my head is...' },
      { prompt: 'If this story were a movie, what genre would it be?', inputType: 'select', options: ['Horror', 'Drama', 'Tragedy', 'Comedy', 'Thriller', 'Documentary'] },
      { prompt: 'What\'s the plot twist version — where this story goes somewhere unexpected?', placeholder: 'But then...' },
      { prompt: 'What evidence would a defense attorney use to argue against this story?', placeholder: 'The defense would say...' },
      { prompt: 'Now write the boring, realistic version. No drama, just facts.', placeholder: 'What actually happened was...' },
    ]
    // Note: Reveal screen for this method shows "Your Story" vs "Just the Facts" side-by-side
  },
  {
    id: 'integration',
    name: 'Integration Reflection',
    description: 'Process insights from a therapy session',
    icon: 'spa',
    category: 'integration',
    steps: [
      { prompt: 'What images or feelings came up during your session?', placeholder: 'I remember...' },
      { prompt: 'What felt significant — even if you can\'t explain why?', placeholder: 'Something that stood out...' },
      { prompt: 'What old belief feels less true now?', placeholder: 'I used to think...' },
      { prompt: 'What new understanding is emerging?', placeholder: 'I\'m starting to see...' },
      { prompt: 'One thing to carry forward from this.', placeholder: 'I want to remember...' },
    ]
  },
  {
    id: 'body-scan',
    name: 'Body Scan Journal',
    description: 'Connect physical sensations to emotions',
    icon: 'self_improvement',
    category: 'integration',
    steps: [
      { prompt: 'Where in your body do you feel something right now?', inputType: 'select', options: ['Head', 'Jaw/Face', 'Throat', 'Chest', 'Stomach', 'Shoulders', 'Back', 'Hands', 'Legs', 'Whole body'] },
      { prompt: 'What does the sensation feel like?', placeholder: 'It feels like... (tight, warm, heavy, buzzing...)' },
      { prompt: 'If this sensation had a message, what would it say?', placeholder: 'It would say...' },
      { prompt: 'What emotion lives here?', placeholder: 'The emotion is...' },
      { prompt: 'What does this part of you need?', placeholder: 'It needs...' },
    ]
  },
  {
    id: 'three-good-things',
    name: 'Three Good Things',
    description: 'Find the good and understand why it happened',
    icon: 'stars',
    category: 'daily',
    steps: [
      { prompt: 'Name something good that happened today.', placeholder: 'Something good was...' },
      { prompt: 'Why did it happen?', placeholder: 'It happened because...' },
      { prompt: 'Name a second good thing.', placeholder: 'Another good thing...' },
      { prompt: 'Why did that happen?', placeholder: 'That happened because...' },
      { prompt: 'And a third.', placeholder: 'One more good thing...' },
      { prompt: 'Why?', placeholder: 'Because...' },
      { prompt: 'What do these three things say about you or the world?', placeholder: 'They tell me...' },
    ]
  },
];
```

**Step 1:** Create the file
**Step 2:** Verify compile
**Step 3:** Commit: `feat: add all 7 journal method definitions`

---

## Phase 3: Page Rewrites

Each page rewritten to use new data model and components. Can be done in parallel since they share only AppContext.

### Task 9: Rewrite DailyLeaf

**Files:**
- Modify: `src/pages/DailyLeaf.tsx` (full rewrite)

**What to build:**

The heart of the app. Morning/evening modes with all new features.

**Key sections:**
1. **Mode toggle** — auto-detects time (before/after 6pm), manual toggle button "Switch to Morning/Evening"
2. **Morning mode:**
   - Contextual + inspirational prompt from `generateMorningPrompt()`
   - Today's Intention input (saved to localStorage per date, simple key-value)
   - Day Recovery banner (from Task 4) — auto-shows if conditions met
   - Capacity warning — if today's tasks > 5, show gentle nudge with task count and estimated hours
   - Unified Rapid Log:
     - Single input with bullet type selector (3 pills: • Task | ○ Event | — Note)
     - Rotating placeholder from `getPlaceholder(type)`
     - Enter to add, selected type determines how entry is created
     - Renders all today's entries in a single list, sorted by creation order
     - Tasks: bullet dot, title (click to edit inline), priority badge, toggle done, "Stuck?" button (hover), delete (hover)
     - Events: circle bullet, title, time badge if set, non-checkable
     - Notes: dash bullet, title, italic styling, non-checkable
     - BuJo signifier tooltips on first few uses
   - Upcoming events strip: horizontal scroll of events in next 7 days
   - Habit toggles: same as before but uses entries context
   - "Plan in Flow →" link to `/flow`
3. **Evening mode:**
   - DayDebrief component (from Task 5) — workload reflection
   - Journal method picker: grid of 7 method cards (icon, name, one-line description)
     - Category labels: CBT, Integration, Daily Practice
     - Click card → opens JournalWalkthrough (from Task 2) as overlay
     - On complete → saves as JournalEntry with method + steps
   - Wins summary: auto-list of today's completed tasks, with confetti button
   - Tomorrow preview: entries with date = tomorrow, quick add
4. **Journal entries clickable** — any journal entry shows as a card, click → opens edit modal (reuse JournalWalkthrough in "edit mode" showing pre-filled answers, or simple textarea edit for non-method entries)

**Uses:** `useApp()` for entries/habits/journalEntries/debriefs, `generateMorningPrompt()`, `getPlaceholder()`, `JOURNAL_METHODS`, `JournalWalkthrough`, `ProcrastinationUnpacker`, `DayRecovery`, `DayDebrief`

**Step 1:** Rewrite the full page
**Step 2:** Run `npx tsc --noEmit` — fix any type errors
**Step 3:** Commit: `feat: rewrite DailyLeaf with morning/evening modes, rapid log, and guided tools`

### Task 10: Rewrite FlowView

**Files:**
- Modify: `src/pages/FlowView.tsx` (full rewrite)

**What to build:**

Visual day planner with broad sections + zoom for precision.

**Key changes from current:**
- Replace hour-by-hour timeline with **day sections** as default view
- Default sections: "Morning Focus" (6am-12pm), "Afternoon" (12pm-5pm), "Evening" (5pm-10pm)
- Each section: colored band, title (editable), time range, task cards inside
- Events pinned in their section (non-draggable, different visual)
- Notes shown if they have a time association
- **Drag and drop** (HTML5): drag tasks between sections, from parking lot to sections
- **Zoom into section**: click/tap a section header → expands to show hour-by-hour slots within that section's time range
  - In zoomed view: drag tasks to specific 15-min slots
  - "Back to sections" button to collapse
- Parking lot sidebar: entries with no timeBlock and type='task', status='todo'
- Multi-day columns: yesterday (faded 50%), today (primary), tomorrow, day+2
- Mobile: sidebar toggle, horizontal scroll between days

**Uses:** `useApp()` for entries (filtered to type='task' and type='event')

**Step 1:** Rewrite the full page
**Step 2:** Run `npx tsc --noEmit` — fix any type errors
**Step 3:** Commit: `feat: rewrite FlowView with day sections, zoom, and drag-and-drop`

### Task 11: Rewrite HabitTrace

**Files:**
- Modify: `src/pages/HabitTrace.tsx` (simplify)

**What to build:**

Strip down to habits ONLY. Remove tasks tab, remove mood tab.

**Changes:**
- Remove the tab system entirely (Tasks/Habits/Mood tabs gone)
- Just the habit grid + management
- Habit grid: 7 (mobile) or 14 (desktop) day columns
- SVG trace paths connecting consecutive completed dates
- Add habit form (name + color picker)
- Inline rename (click name)
- Delete on hover
- Streak display — streaks "pause" on missed days (don't show "broken" language)
- Title: "Habit Trace" with subtitle "Small steps, steady paths"

**Uses:** `useApp()` for habits only

**Step 1:** Simplify the page (remove ~200 lines of tab code)
**Step 2:** Run `npx tsc --noEmit`
**Step 3:** Commit: `feat: simplify HabitTrace to habits-only, remove tasks/mood tabs`

### Task 12: Rewrite ArchiveLibrary with Collections

**Files:**
- Modify: `src/pages/ArchiveLibrary.tsx` (significant additions)

**What to build:**

Add two tabs: **Journals** | **Collections**

**Journals tab** (mostly existing, with updates):
- Same bookshelf visual
- Journal entries now clickable → opens edit modal (title, content, mood, tags editable)
- Events from entries with type='event' shown in monthly view as pins
- Search works across journal entries AND entries (events/notes)

**Collections tab** (new):
- Grid of collection cards, each styled like a small notebook
- "New Collection" button → inline title input
- Click collection → opens it showing ordered list of items
- Inside collection:
  - Add item input at bottom
  - Each item: text, checkbox (done), delete X, drag handle for reorder
  - HTML5 drag-and-drop reordering
  - Edit item text inline (click to edit)
- Back button to return to grid
- Example placeholder: "Try: Books to Read, Monthly Goals, Gift Ideas"

**Uses:** `useApp()` for journalEntries, entries, collections

**Step 1:** Rewrite with tab system and collections
**Step 2:** Run `npx tsc --noEmit`
**Step 3:** Commit: `feat: add Collections tab to Archive, make journal entries editable`

### Task 13: Rewrite CelebrationScrapbook

**Files:**
- Modify: `src/pages/CelebrationScrapbook.tsx` (simplify)

**What to build:**

Wins only. Remove habits from scrapbook.

**Changes:**
- Remove habit streak cards (habits live in HabitTrace only now)
- Items shown: completed tasks (entries with type='task', status='done'), journal entries with wins, manually added wins
- Filter: All | Tasks | Reflections (no Habits filter)
- Confetti still works (canvas-confetti)
- "Add a Small Win" card with inline form
- Delete on hover for tasks and reflections
- Polaroid card style preserved

**Uses:** `useApp()` for entries (type='task', status='done'), journalEntries (with wins)

**Step 1:** Simplify the page
**Step 2:** Run `npx tsc --noEmit`
**Step 3:** Commit: `feat: simplify Scrapbook to wins-only, remove habit cards`

### Task 14: Rewrite MigrationStation as Slide-Over

**Files:**
- Modify: `src/pages/MigrationStation.tsx` (significant rewrite)
- Modify: `src/App.tsx` (change migration from route to slide-over)
- Modify: `src/components/Layout.tsx` (migration trigger)

**What to build:**

Change from fullscreen route to a slide-over panel.

**MigrationStation changes:**
- No longer `fixed inset-0` fullscreen
- Slide-over panel from right: `fixed right-0 top-0 h-full w-[480px] max-w-[90vw]`
- Backdrop overlay (click to close)
- X button in top-right corner to close
- Same content: left-behind tasks on top, drop zones below
- Drag-and-drop still works
- Quick-action buttons (Today/Tomorrow) still work
- Shredder at bottom

**App.tsx changes:**
- Remove `/migration` route
- MigrationStation rendered as conditional overlay inside Layout, not as a route
- Triggered by: nav button click, or DailyLeaf morning prompt ("3 tasks from yesterday")

**Layout.tsx changes:**
- Migration nav link becomes a button (not a NavLink) that toggles the slide-over state
- Add `migrationOpen` state + `toggleMigration` function
- Pass as context or prop to children

**Step 1:** Refactor MigrationStation to slide-over component
**Step 2:** Update App.tsx to remove route
**Step 3:** Update Layout.tsx with toggle state
**Step 4:** Run `npx tsc --noEmit`
**Step 5:** Commit: `feat: convert MigrationStation to closeable slide-over panel`

---

## Phase 4: Integration & Polish

### Task 15: Update Remaining References

**Files:**
- Modify: `src/App.tsx` — ensure all routes use new context
- Modify: `src/components/Layout.tsx` — ensure nav is correct

**What to do:**
- Verify all `useApp()` calls use `entries` instead of `tasks`
- Verify all pages import correct types
- Remove any dead imports (Task type, old context methods)

**Step 1:** Search codebase for any remaining `tasks` references or `Task` type imports
**Step 2:** Fix all references
**Step 3:** Commit: `fix: update all remaining Task references to RapidLogEntry`

### Task 16: First-Time Onboarding

**Files:**
- Create: `src/components/Onboarding.tsx`

**What to build:**

3-screen walkthrough shown on first login. Stored in localStorage.

Screens:
1. "This is your digital bullet journal. Each day: plan in the morning, log as you go, reflect in the evening." + warm illustration
2. "Log quickly with bullets: • Tasks ○ Events — Notes. Keep entries short and specific." + examples
3. "The app will guide you. Just show up." + "Let's begin" button

**Step 1:** Create the component
**Step 2:** Add to App.tsx (show before main app if `!localStorage.getItem('onboarded')`)
**Step 3:** Commit: `feat: add first-time onboarding walkthrough`

### Task 17: Build & Verify

**Files:** None (verification only)

**Step 1:** Run `npx tsc --noEmit` — zero errors expected
**Step 2:** Run `npm run build` — clean build expected
**Step 3:** Run `npm run dev` and manually test:
  - Login works
  - DailyLeaf morning mode shows prompt, rapid log, habits
  - Can add tasks, events, notes with bullet type selector
  - Capacity warning appears at 6+ tasks
  - "Stuck?" button opens Procrastination Unpacker
  - Switch to evening mode: debrief + journal methods work
  - FlowView: day sections visible, can drag tasks
  - HabitTrace: only habits, no tabs
  - Archive: journals tab + collections tab
  - Scrapbook: no habit cards
  - Migration: slide-over, closeable
**Step 4:** Fix any runtime issues
**Step 5:** Commit: `fix: resolve any build or runtime issues`

---

## Execution Order & Dependencies

```
Phase 1: [Task 1] AppContext ──────────────────┐
                                                │
Phase 2: [Tasks 2-8] Shared components ◄───────┘
         (can be parallel with each other)
         │
Phase 3: [Tasks 9-14] Page rewrites ◄─────────┘
         (can be parallel with each other)
         │
Phase 4: [Tasks 15-17] Integration ◄──────────┘
         (must be sequential)
```

**Critical path:** Task 1 → Task 9 (DailyLeaf depends on everything)
**Parallel opportunities:**
- Tasks 2-8 (all shared components, no interdependencies)
- Tasks 10-14 (all page rewrites, only share AppContext)
