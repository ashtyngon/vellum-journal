# Unified Daily Page & Anti-Shame Architecture

**Date:** 2026-02-18
**Status:** Approved by user during brainstorming session

---

## Problem Statement

The current DailyLeaf has a morning/evening toggle that creates an artificial wall between two modes. At 4pm, users don't know what their options are. The mode switch feels unnatural and hides content. Additionally, the app lacks temporal awareness features to combat ADHD time blindness, and the planning experience doesn't extend beyond "tomorrow."

User pain points:
- Morning/evening division feels arbitrary and hides options
- No afternoon experience at all
- Parking lot slider too big/persistent, especially on mobile
- Migration Station unused and broken
- No weekly/monthly/quarterly/yearly planning
- Coming back after days away creates a shame spiral of overdue tasks
- Task celebration effects too subtle (want Asana-style full-screen moments)

---

## Design Decisions

### 1. Kill Morning/Evening Toggle -> One Unified Daily Page

- Remove the morning/evening mode toggle entirely
- DailyLeaf becomes one continuous page showing everything: intention, rapid log, habits, journal exercises, debrief trigger, and a small "Plan" button
- Page subtly adapts based on time of day (greeting text, debrief surfacing after 6pm) but no wall, no mode switch, no hidden content
- Kill the Migration Station route (unused, arrow button handles move-to-tomorrow)
- Debriefs stay as the core reflective experience -- they're the backbone

### 2. Ambient Time Awareness (5 Nudge Types)

Contextual nudges woven inline throughout the page. No separate sections.

**2a. Temporal Position Marker (header area)**
- Not just "Wednesday, February 18" but: "Wednesday - Day 3 of 5 this week - 10 days until March"
- Makes position in time tangible

**2b. Yesterday Bridge (above rapid log)**
- Single line: "Yesterday you completed 4 tasks and said the plan felt 'about right'"
- Connects today to yesterday

**2c. Upcoming Gravity (near events/tasks)**
- Tasks/events with deadlines show small badges: "3 days away", "next Tue"
- Makes future events feel real and approaching

**2d. Weekly Pulse (inline, subtle)**
- "This week: 12 tasks done, 3 habits maintained, 1 journal entry"
- Connects daily actions to weekly patterns

**2e. Metacognitive Calibration (in debrief)**
- Shows average calibration over last 7 debriefs
- "You tend to overplan by ~20%. Your sweet spot seems to be 4-5 tasks."
- Trains time estimation over weeks

### 3. Multi-Scale Planning Overlay

Small "Plan" button always visible near header. Opens overlay with 5 tabs:

**3a. Plan Tomorrow**
- Tomorrow's intention input
- Add tasks with natural language parsing
- Shows scheduled items
- Absorbed from current evening mode panel

**3b. Plan This Week**
- Mon-Sun row of day cards (task count, events, habits)
- Move tasks between days
- Weekly intention field
- Upcoming deadlines

**3c. Plan This Month**
- Calendar mini view with key dates highlighted
- Monthly reflection prompt: "What's one thing you want to be true by the end of this month?"
- Pattern insights from data

**3d. Plan This Quarter**
- 1-3 quarterly goals (free-form text)
- Weekly check-ins reference these
- Connects daily actions to medium-term direction

**3e. Plan This Year**
- 1-2 yearly themes: "What matters this year? What kind of person are you becoming?"
- Reviewed monthly
- Combats losing the thread of your own story

**Cross-referencing:** Higher-level goals cascade into daily nudges. E.g., "Your Q1 goal is 'launch the app'. This week you've made progress on 2 of 4 milestones."

**Data model:** Quarter/year goals are simple text stored per period. Lightweight, not project management.

### 4. Anti-Shame Architecture

**Core principle: The planner must never become a museum of failure.**

**4a. No Red. No "Overdue." Ever.**
- Tasks don't turn red or grow warning badges
- Unmoved tasks stay neutral, same color
- Age shown subtly in pencil gray: "3d", "2w" -- factual, not judgmental
- Completing a late task gets the same celebration as an on-time task

**4b. Automatic Soft Fade**
- Tasks untouched 2+ weeks get slightly lower opacity
- Grouped into collapsible "Still on the list" section
- One-tap to bring back, one-tap to let go
- Language: "Let go of things that aren't yours anymore" (not "clear overdue")

**4c. Completion Tracking Regardless of Timeline**
- Weekly pulse counts ALL completions: "This week: 8 tasks done. 3 from this week, 2 from last week, 3 were older. You finish things."
- "You finish things." -- data speaking, not a platitude

**4d. Planning Calibration**
- App learns your actual completion patterns
- When adding a 6th task: "You usually land around 4. Still adding?"
- Not blocking, just noting

**4e. The Comeback Pattern**
- Returning after days away: first thing visible is today's blank page (fresh, clean)
- Stale tasks grouped in one expandable: "12 items from before. Want to look?"
- Check off what you did (whenever), delete what doesn't matter, move what still does
- Data nudge: "You were away 4 days. Last time that happened, you came back and cleared 9 things in 2 days."

**4f. "Resolved" Status**
- Third status beyond "done" and "deleted": "resolved"
- Means "this got handled, just not the way I wrote it down"
- No shame in handling things differently than planned

### 5. Tone & Messaging Rules

**What works:**
- Data + understatement: "Last time you took a break, you came back and knocked out 6 tasks. Just saying."
- Self-aware irony: "The app didn't go anywhere. Neither did your potential, unfortunately."
- Pure data, no commentary: "You planned 4 of the last 5 days. Want to keep the streak?"
- Wordless cues: warmer gradient, a small marker, no text needed
- Never the same message twice in a row

**What's OUT:**
- Anything that sounds like a therapist ("You're enough", "No catching up needed")
- Motivational poster energy
- "Welcome back!" / "We missed you!"
- Permission-giving language (implies you need permission)
- The word "should"

**The actual tone:** Like a sharp friend who tracks your data and occasionally makes an observation.

### 6. Task Celebration Effects (Enhancement)

Current effects are too fast and too small. User wants Asana-style full-screen moments.

**Changes needed:**
- Slow down animations (current ~1s -> 2-3s)
- Expand canvas to use more of the viewport
- Add full-screen overlay moments for milestone completions (3rd task, 5th task, all tasks done)
- Particle count and scale should be much larger
- Consider adding a distinctive character/mascot moment (like Asana's unicorn)
- Effects should fire in FlowView too (now wired up)

### 7. Mobile & Cleanup

**Mobile DailyLeaf:**
- Single column, clean
- Habits as horizontal scroll row
- Journal exercises collapse to icons
- "Plan" button as small FAB in bottom-right
- Plan overlay goes full-screen modal with swipeable tabs

**Parking Lot (FlowView mobile):**
- Collapsed by default
- Small "Parking Lot (3)" label at bottom
- Tap to expand, not a persistent slider

**Kill:**
- Migration Station route
- Morning/evening mode toggle
- Any remaining debug console.log statements

---

## Data Model Additions

```typescript
// New types for multi-scale planning
interface WeeklyIntention {
  weekStart: string;    // YYYY-MM-DD (Monday)
  intention: string;
  createdAt: string;
}

interface MonthlyReflection {
  month: string;        // YYYY-MM
  intention: string;
  reflection?: string;  // End-of-month reflection
  createdAt: string;
}

interface QuarterlyGoal {
  quarter: string;      // e.g., "2026-Q1"
  goals: string[];      // 1-3 goals
  createdAt: string;
}

interface YearlyTheme {
  year: number;
  themes: string[];     // 1-2 themes
  createdAt: string;
}

// New entry status
type EntryStatus = 'todo' | 'done' | 'migrated' | 'deferred' | 'resolved';

// Planning data stored in AppContext alongside existing data
interface PlanningData {
  weeklyIntentions: WeeklyIntention[];
  monthlyReflections: MonthlyReflection[];
  quarterlyGoals: QuarterlyGoal[];
  yearlyThemes: YearlyTheme[];
}
```

---

## Therapeutic Foundations

Based on research into ADHD time blindness, metacognition, and evidence-based interventions:

- **Externalizing time** (visual position markers, day counts) -- Henry Ford Health, ADDA
- **"Now vs. Not Now" problem** -- ADHD brains collapse all future into undifferentiated blob. Upcoming Gravity nudges make future tangible.
- **Metacognitive calibration** -- Training time estimation through plan vs. actual comparisons over weeks (PMC research on metacognitive training in ADHD)
- **Anti-shame design** -- ADHD shame spirals cause planner abandonment. The comeback pattern prevents the "museum of failure" effect.
- **Structured routines** -- Consistent debrief flow trains metacognition through repetition (CADDI trial, Sweden 2025)
- **Temporal bridging** -- Connecting daily actions to weekly/monthly/quarterly/yearly intentions bridges the time horizon gap
- **Performance vs. knowledge** -- ADHD is not about knowing what to do but doing it consistently. The system reduces friction, not ignorance.
