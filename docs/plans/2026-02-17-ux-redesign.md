# Vellum Journal UX Redesign

## Philosophy
Digital bullet journal that teaches gentle planning, celebrates small wins, and works with the ADHD brain's need for novelty, immediate feedback, and low-barrier starts. Morning setup + evening wind-down ritual. Therapeutic journaling with evidence-based methods.

## Data Model Changes

### New Types
```typescript
// BuJo rapid log supports three entry types via a single input
// The bullet type is selected before typing (defaults to task)
interface RapidLogEntry {
  id: string;
  type: 'task' | 'event' | 'note';  // BuJo: bullet (•), circle (○), dash (—)
  title: string;
  date: string;       // YYYY-MM-DD
  // Task-specific
  status?: 'todo' | 'done' | 'migrated' | 'deferred';
  priority?: 'low' | 'medium' | 'high';
  movedCount?: number;
  timeBlock?: string;
  duration?: string;
  // Event-specific
  time?: string;      // HH:MM
  // Shared
  tags?: string[];
  notes?: string;
}

// Note: This replaces the old Task + separate Event types.
// Events and notes are now first-class rapid log entries alongside tasks.
// The old Task interface is replaced by RapidLogEntry with type='task'.

interface Collection {
  id: string;
  title: string;
  items: CollectionItem[];
  createdAt: string;
}

interface CollectionItem {
  id: string;
  text: string;
  done: boolean;
  order: number;
}

interface DayDebrief {
  date: string;
  planRealism: number;    // 1-5
  accomplishment: number; // 1-5
  mood: string;
  reflection?: string;
}

interface JournalStep {
  prompt: string;
  answer: string;
}
```

### Updated Types
```typescript
// JournalEntry gains method + steps
interface JournalEntry {
  id: string;
  date: string;
  title?: string;
  content: string;
  mood?: string;
  tags?: string[];
  wins?: string[];
  method?: string;        // 'five-whys' | 'thought-record' | 'positive-data-log' | 'pattern-breaker' | 'integration' | 'body-scan' | 'three-good-things'
  steps?: JournalStep[];
}

// Procrastination unpacker state is ephemeral (not persisted)
```

### AppContext changes
- `tasks: Task[]` replaced by `entries: RapidLogEntry[]` + CRUD (`addEntry`, `updateEntry`, `deleteEntry`)
  - Helper filters: `todayTasks()`, `todayEvents()`, `todayNotes()`, `entriesByDate(date)`
  - Migration: existing Task data mapped to RapidLogEntry with `type: 'task'`
- `collections: Collection[]` + CRUD (`addCollection`, `updateCollection`, `deleteCollection`, `addCollectionItem`, `updateCollectionItem`, `deleteCollectionItem`, `reorderCollectionItems`)
- `debriefs: DayDebrief[]` + `saveDebrief`
- `habits`, `journalEntries` stay as-is
- All persisted to Firestore under user doc

## Page Architecture

### 1. DailyLeaf (/)
The daily home. Two modes:

**Morning Mode** (before 6pm default, or manual toggle):
- Contextual + inspirational prompt (rotates from 50+ pool, adapts to user data)
- Today's Intention input
- Capacity warning when tasks > 5 ("You have 7 tasks (~4.5hrs). You have ~6 free hours. That's tight.")
- **Unified Rapid Log** — single input that supports all 3 BuJo entry types:
  - Bullet type selector next to input: • Task (default) | ○ Event | — Note
  - Tasks: add, edit, delete, toggle done, priority, "Stuck?" button on hover
  - Events: add with optional time, show in upcoming strip, non-checkable
  - Notes: observations, ideas, facts — just text, no status
  - All three rendered in a single chronological log with their BuJo bullet symbols
  - BuJo phrasing hints as placeholders: "Call dentist...", "Met Sarah for coffee...", "Idea: try morning walks..."
- Upcoming events strip (next 7 days from all entries with type='event')
- Habit toggles with streaks
- Link to FlowView for time-blocking

**Evening Mode** (after 6pm or manual toggle):
- Day Debrief: plan realism slider, accomplishment slider, mood, generated gentle message
- Journal method picker (7 cards)
- Each method: Stoic-style one-question-at-a-time, then reveal all answers
- Wins summary with confetti
- Tomorrow preview

**Day Recovery Mode**:
- Auto-triggers after noon if no tasks checked, or manual "Reset My Day"
- Shows remaining hours as abundant
- Pick ONE task, everything else fades
- Optional 15-min sprint timer

**Journal entries are clickable/editable** - tap to open, edit, save.

### 2. FlowView (/flow)
Visual day planner with sections + zoom.

**Day Sections** (default: Morning Focus, Afternoon, Evening - customizable names):
- Broad blocks, drag tasks between them
- Each section shows time range
- Tap/click section to zoom -> hourly/15-min timeline within that section
- Drag tasks to precise times when zoomed

**Parking Lot sidebar**:
- Unscheduled tasks
- Drag from lot to sections
- Mobile: toggle sidebar

**Events**: pinned, non-draggable items in their time slots

**Multi-day columns**: yesterday (faded), today (primary), tomorrow, +2 days

### 3. HabitTrace (/habit-trace)
Habits ONLY. No tasks tab, no mood tab.
- Habit grid (7 or 14 days)
- SVG trace paths connecting streaks
- Add/edit/delete habits
- Streak display (pauses, never "breaks")

### 4. Archive (/archive)
Two tabs: **Journals** | **Collections**

**Journals tab** (existing bookshelf):
- Monthly books, click to expand
- Journal entries clickable -> opens edit modal
- Search
- Events shown in monthly view
- Add new entry

**Collections tab** (new):
- Grid of collection cards (notebook aesthetic)
- Create any collection with a title
- Inside: ordered list, add items, reorder (drag), check off, delete
- Free-form: "Books to Read", "Monthly Goals", "Gift Ideas", etc.

### 5. Scrapbook (/scrapbook)
Wins only. No habits.
- Completed tasks auto-appear
- Manually added wins
- Journal entries with wins attached
- Confetti
- Filter by type

### 6. Migration (/migration)
Slide-over panel, not fullscreen.
- X button to close
- Click outside to close
- Drag tasks to Today/Tomorrow/Next Week/Shredder
- Quick-action buttons as alternative to drag
- Morning mode can prompt if overdue tasks exist

## Journaling Methods (Stoic-style walkthrough)

All methods: one question at a time, centered, textarea. "Next" to advance. Previous hidden. Reveal all at end.

### 1. Thought Record
Steps: Situation -> Automatic Thought -> Emotion (rate 0-100) -> Evidence For -> Evidence Against -> Balanced Thought -> Re-rate emotion

### 2. 5 Whys
Steps: "What's bothering me?" -> "Why does that bother me?" -> "Why does that matter?" -> "Why?" -> "Why?" -> "What's the root belief?" -> "What did you discover?"

### 3. Positive Data Log
Steps: "What belief are you working on changing?" -> "What's a kinder version?" -> "What happened today that supports the kinder belief?" -> Rate belief (0-100%) -> Over time: show trend chart

### 4. Pattern Breaker
Steps: "What story are you telling yourself?" -> "If this were a movie, what genre?" -> "What's the plot twist version?" -> "What evidence would a defense attorney use?" -> "Write the boring, realistic version" -> Reveal: dramatic vs facts side-by-side

### 5. Integration Reflection
Steps: "What images/feelings came up?" -> "What felt significant?" -> "What old belief feels less true?" -> "What new understanding is emerging?" -> "One thing to carry forward"

### 6. Body Scan Journal
Steps: "Where in your body do you feel something?" (body area picker) -> "What does the sensation feel like?" -> "If it had a message, what would it say?" -> "What emotion lives here?" -> "What does this part need?"

### 7. Three Good Things
Steps: "Something good that happened" -> "Why did it happen?" -> (repeat x2 more) -> "What does this say about you or the world?"

## Procrastination Unpacker (on tasks)

Trigger: hover task -> "Stuck?" button
Opens focused single-task screen.

Flow:
1. "What happens when you think about starting this?"
2. Pick blocker: Too big / Unclear next step / Afraid of doing it wrong / Don't want to / Boring / Something else
3. Targeted intervention based on pick:
   - Too big -> "Tiniest first step? 2 minutes?"
   - Unclear -> "What question needs answering? Can you find out in 5 min?"
   - Afraid -> "Worst 'done' that's still better than not started?"
   - Don't want to -> "Actually yours? Delegate, drop, or defer?"
   - Boring -> "Pair with something enjoyable? Music, snack, 15-min sprint?"
   - Something else -> free text + "What would make this 10% easier?"
4. "Ready for just 5 minutes?" -> optional 5-min timer
5. After timer: "Keep going?" or "That's enough — you started, that counts"

## Day Recovery Mode

Trigger: auto after noon + no tasks done, or manual "Reset My Day" button.

Screen:
1. "It's [2:14 PM]. You still have [X hours]. That's a full [afternoon]."
2. "Pick just ONE thing before [next hour]."
3. Task list - pick one, rest fade
4. "Your only job: [task]. Everything else waits."
5. Optional 15-min timer

No guilt language ever.

## BuJo Guidance System

The app teaches bullet journal notation and phrasing as you use it. Not a separate tutorial — woven into the UI.

### Rapid Log Hints
When the task input is empty/focused, show a rotating placeholder example in BuJo style:
- "e.g., Call dentist to reschedule"
- "e.g., Research flights to Portland"
- "e.g., Draft intro for blog post"
- "e.g., Buy birthday gift for Mom"

Short, specific, action-verb-first. Teaches by example.

### Signifier Tooltips
BuJo uses signifiers (bullet types). On first use, show gentle tooltips:
- Task bullet (dot) = something to do
- X = completed
- > = migrated forward
- < = scheduled to a specific date
- Priority (*) = important
These appear as subtle floating hints the first few times, then fade away.

### Journal Phrasing Guide
During evening journaling, if the user's entry is very short or vague, show a soft suggestion:
- "Tip: Try being specific — instead of 'bad day', what happened? e.g., 'Missed the 9am meeting, felt embarrassed, recovered by lunch'"
- "Tip: Name the emotion — 'frustrated because...' is more useful than 'annoyed'"

Not blocking — just a gentle ghost-text suggestion below the input that fades after a few uses.

### First-Time Onboarding
On first login, a 3-screen walkthrough (skippable):
1. "This is your digital bullet journal. Each day: plan in the morning, log as you go, reflect in the evening."
2. "Tasks are rapid-logged — keep them short, specific, one action each."
3. "The app will guide you. Just show up."

## ADHD Design Principles
- Capacity warnings: gentle, specific, with hours math
- One-at-a-time mode: any list can collapse to current task only
- Rotating prompts: 50+ pool, never same twice in a week, data-adaptive
- Streaks pause, never break
- Evening debrief always starts with what you DID finish
- Novelty in framing (Pattern Breaker, genre metaphors)
- Low barriers (5-min rule, "just one task")
