# Unified Daily Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the morning/evening toggle DailyLeaf with one unified page, kill Migration Station, and make the debrief triggerable anytime.

**Architecture:** Merge the two conditional branches (`mode === 'morning'` / `mode === 'evening'`) into a single continuous layout. All content currently gated behind a mode becomes always-visible. The debrief section surfaces automatically after 6pm but is accessible via a button at any time. The "Plan Tomorrow" panel moves into a lightweight overlay triggered by a "Plan" button in the header. Migration Station nav + modal removed entirely from Layout.tsx.

**Tech Stack:** React, Tailwind CSS, existing AppContext (Firestore + WAL persistence)

---

## Phase 1: Kill the Toggle, Unify the Page

This phase delivers the core structural change — one page, no mode switch, everything visible.

### Task 1: Remove Migration Station from Layout

**Files:**
- Modify: `src/components/Layout.tsx`

**Step 1: Remove Migration Station import, state, and nav buttons**

Remove these pieces from Layout.tsx:
- Line 4: `import MigrationStation from '../pages/MigrationStation';`
- Line 11: `const [migrationOpen, setMigrationOpen] = useState(false);`
- Lines 45-55: Desktop nav Migration button
- Lines 117-130: Mobile nav Migration button
- Line 139: `<MigrationStation open={migrationOpen} onClose={() => setMigrationOpen(false)} />`

The `MigrationStation.tsx` file itself stays (not deleted) — just disconnected. User may want it later.

**Step 2: Verify build**

Run: `cd "/Users/ezraabdullabekov/Desktop/_Organized/Active Projects/journaling app/vellum-journal" && npm run build`
Expected: Clean build, no errors. There may be a TS unused import warning if MigrationStation.tsx imports something from Layout, but since it's a standalone modal, it won't.

**Step 3: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "feat: remove Migration Station from nav

Migration Station was unused and broken. The move-to-tomorrow
arrow button on tasks handles the same workflow."
```

---

### Task 2: Remove Migration Station link from DailyLeaf morning sidebar

**Files:**
- Modify: `src/pages/DailyLeaf.tsx`

**Step 1: Remove the Migration Station link from the left sidebar quick links**

Remove lines 594-600 (the `<Link to="/migration" ...>Migration Station</Link>` block) from the morning mode left sidebar.

**Step 2: Verify build**

Run: `cd "/Users/ezraabdullabekov/Desktop/_Organized/Active Projects/journaling app/vellum-journal" && npm run build`
Expected: Clean build.

**Step 3: Commit**

```bash
git add src/pages/DailyLeaf.tsx
git commit -m "feat: remove Migration Station link from DailyLeaf sidebar"
```

---

### Task 3: Remove the mode state and toggle — merge into unified layout

This is the big structural task. The DailyLeaf currently has two massive conditional branches: `{mode === 'morning' && (...)}` (lines 550-1028) and `{mode === 'evening' && (...)}` (lines 1033-1568). We merge them into one continuous page.

**Files:**
- Modify: `src/pages/DailyLeaf.tsx`

**Step 1: Remove mode state and related code**

Delete/modify these pieces:

1. Remove `isEvening()` helper function (lines 43-45)
2. Remove `mode` state (lines 82-84): `const [mode, setMode] = useState<'morning' | 'evening'>(...)`
3. In the `useEffect` refresh (lines 86-107), remove the `setMode` call and the `isEvening` reference. Keep the `setDateKey` refresh for midnight rollover.
4. Remove the `shouldAutoShowRecovery` dependency on `mode` (line 230): change `mode === 'morning'` check — day recovery should show anytime after noon with no tasks done, regardless of "mode".
5. Remove the mode toggle buttons from the header (lines 520-542) — the entire `<div className="flex rounded-full border...">` with Morning/Evening buttons.

**Step 2: Build the unified layout**

Replace the two conditional blocks with one continuous 3-column grid:

```
HEADER (existing, minus toggle)
┌─────────────────────────────────────────────────┐
│ LEFT SIDEBAR          CENTER          RIGHT     │
│ ┌───────────┐  ┌──────────────┐  ┌───────────┐ │
│ │ Morning   │  │ Intention    │  │ Habits    │ │
│ │ Prompt    │  │ Day Recovery │  │ Wins      │ │
│ │ Upcoming  │  │ Capacity     │  │ Journal   │ │
│ │ Events    │  │ Wins Banner  │  │ Exercises │ │
│ │ Debrief   │  │ Rapid Log    │  │           │ │
│ │ (6pm+)    │  │              │  │           │ │
│ │ Quick     │  │              │  │           │ │
│ │ Links     │  │              │  │           │ │
│ └───────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────┘
```

The unified layout keeps:
- **Left sidebar:** Morning prompt, upcoming events, Flow View link, debrief section (see Task 4 for debrief logic)
- **Center:** Intention, day recovery, capacity warning, wins banner, rapid log (one copy — the morning version, which is identical to the evening one)
- **Right sidebar:** Habits, wins counter, journal exercises

Content that was evening-only and moves to the unified page:
- **Debrief** → left sidebar, always accessible (but auto-surfaces after 6pm)
- **Plan Tomorrow** → moves to overlay (Phase 2, Task 6)
- **Today's Journal Entries** → left sidebar, below debrief (shown when entries exist)

Content that gets removed (duplicates):
- Evening mode's duplicate rapid log → removed (morning's rapid log is identical)
- Evening mode's duplicate wins banner → removed (morning's is identical)
- Evening mode's duplicate journal exercises sidebar → removed

**Step 3: Remove the duplicate evening mobile sections**

The evening mode has its own mobile sections (lines 1516-1566) that duplicate what morning mode shows. Remove these entirely — the unified mobile layout (which currently lives in the morning block, lines 874-928) handles everything.

Add to the mobile section:
- Debrief (below habits, when applicable)
- Journal entries list (when entries exist for today)

**Step 4: Verify build**

Run: `cd "/Users/ezraabdullabekov/Desktop/_Organized/Active Projects/journaling app/vellum-journal" && npm run build`
Expected: Clean build. No TypeScript errors.

**Step 5: Commit**

```bash
git add src/pages/DailyLeaf.tsx
git commit -m "feat: unify DailyLeaf into single continuous page

Remove morning/evening mode toggle. All content now visible on one
page: intention, rapid log, habits, exercises, debrief, wins.
No more hidden content behind mode switches."
```

---

### Task 4: Make debrief always accessible (not gated to evening)

**Files:**
- Modify: `src/pages/DailyLeaf.tsx`

**Step 1: Add time-based debrief visibility with manual trigger**

The debrief should:
- Auto-surface in the left sidebar after 6pm (same as before)
- Be accessible via a small "Debrief" button anytime before 6pm
- Hide once completed (same `debriefHidden` logic)

Add a new state: `const [showDebriefEarly, setShowDebriefEarly] = useState(false);`

Add a helper: `const isEveningTime = new Date().getHours() >= 18;` (replaces the old `isEvening()` — used only for debrief auto-surface, not for mode switching).

In the left sidebar debrief section, the render logic becomes:
```tsx
{/* Debrief — auto-shows after 6pm, or tap to trigger early */}
{!debriefHidden && (isEveningTime || showDebriefEarly) && (
  <DayDebriefComponent ... />
)}

{/* Button to trigger debrief before 6pm */}
{!isEveningTime && !showDebriefEarly && !todayDebriefExists && (
  <button onClick={() => setShowDebriefEarly(true)} className="...">
    <span className="material-symbols-outlined">rate_review</span>
    Start Debrief
  </button>
)}
```

**Step 2: Add `isEveningTime` auto-refresh**

Add `isEveningTime` to state so it updates:
```tsx
const [isEveningTime, setIsEveningTime] = useState(() => new Date().getHours() >= 18);
```
In the existing visibility refresh `useEffect` (the one with the 60s interval), add:
```tsx
setIsEveningTime(new Date().getHours() >= 18);
```

**Step 3: Verify build**

Run: `cd "/Users/ezraabdullabekov/Desktop/_Organized/Active Projects/journaling app/vellum-journal" && npm run build`
Expected: Clean build.

**Step 4: Commit**

```bash
git add src/pages/DailyLeaf.tsx
git commit -m "feat: make debrief accessible anytime, auto-surface after 6pm

Debrief is no longer locked behind evening mode. It auto-shows
after 6pm and has a manual trigger button for earlier reflection."
```

---

### Task 5: Add "Plan" button to header area

**Files:**
- Modify: `src/pages/DailyLeaf.tsx`

**Step 1: Add Plan button next to progress bar in header**

In the header `<div className="flex items-center gap-3">`, add a Plan button before or after the progress indicator:

```tsx
<button
  onClick={() => setPlanOverlayOpen(true)}
  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-wood-light/30 text-sm font-body text-pencil hover:text-primary hover:border-primary/30 transition-all"
>
  <span className="material-symbols-outlined text-[18px]">event_note</span>
  <span className="hidden sm:inline">Plan</span>
</button>
```

Add state: `const [planOverlayOpen, setPlanOverlayOpen] = useState(false);`

**Step 2: Create a minimal Plan Tomorrow overlay (absorbing evening mode's Plan Tomorrow panel)**

For Phase 1, the overlay contains just the Plan Tomorrow content that was previously in the evening center column. This is a simple modal/overlay:

```tsx
{planOverlayOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setPlanOverlayOpen(false)}>
    <div className="bg-paper rounded-2xl shadow-lifted w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-header italic text-2xl text-ink">Plan Tomorrow</h2>
        <button onClick={() => setPlanOverlayOpen(false)} className="text-pencil hover:text-ink transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      {/* Tomorrow intention + task list + add input — moved from evening center */}
      ...existing Plan Tomorrow content...
    </div>
  </div>
)}
```

Move the Plan Tomorrow JSX (currently lines 1187-1283 in evening mode center) into this overlay. The state (`tomorrowIntention`, `tomorrowEntries`, `handleAddTomorrowEntry`, etc.) already exists at the component level — no changes needed there.

**Step 3: Verify build**

Run: `cd "/Users/ezraabdullabekov/Desktop/_Organized/Active Projects/journaling app/vellum-journal" && npm run build`
Expected: Clean build.

**Step 4: Commit**

```bash
git add src/pages/DailyLeaf.tsx
git commit -m "feat: add Plan button and Plan Tomorrow overlay

Plan Tomorrow panel moved from evening mode into a lightweight
overlay accessible via a header button. Available at any time."
```

---

### Task 6: Add time-adaptive greeting text

**Files:**
- Modify: `src/pages/DailyLeaf.tsx`

**Step 1: Add a subtle time-of-day greeting in the header**

Below the date, add a small greeting that changes based on time:

```tsx
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};
```

Add it below the date display:
```tsx
<span className="font-body text-sm text-pencil/60">
  Good {getGreeting().toLowerCase()}
</span>
```

This is the "subtle time adaptation" the design calls for — no wall, just a warm contextual cue.

**Step 2: Verify build**

Run: `cd "/Users/ezraabdullabekov/Desktop/_Organized/Active Projects/journaling app/vellum-journal" && npm run build`
Expected: Clean build.

**Step 3: Commit**

```bash
git add src/pages/DailyLeaf.tsx
git commit -m "feat: add time-adaptive greeting to DailyLeaf header

Subtle 'Good morning/afternoon/evening' text replaces the mode
toggle, providing temporal context without hiding content."
```

---

### Task 7: Clean up unused imports and dead code

**Files:**
- Modify: `src/pages/DailyLeaf.tsx`

**Step 1: Remove any unused imports, variables, or functions**

After all the changes, clean up:
- Remove `isEvening` if not fully removed in Task 3
- Remove `isAfterNoon` if `shouldAutoShowRecovery` was simplified
- Remove any lingering `mode`-related references
- Check for unused state variables from the evening panel that may have been absorbed

**Step 2: Verify build**

Run: `cd "/Users/ezraabdullabekov/Desktop/_Organized/Active Projects/journaling app/vellum-journal" && npm run build`
Expected: Clean build, no TS6133 warnings.

**Step 3: Commit**

```bash
git add src/pages/DailyLeaf.tsx
git commit -m "chore: clean up unused code from mode toggle removal"
```

---

### Task 8: Verify everything works end-to-end

**Step 1: Build**

Run: `cd "/Users/ezraabdullabekov/Desktop/_Organized/Active Projects/journaling app/vellum-journal" && npm run build`
Expected: Clean build, zero errors.

**Step 2: Manual check list**

Verify in the browser:
- [ ] DailyLeaf shows one continuous page (no toggle)
- [ ] Intention input visible
- [ ] Rapid log visible with all entries
- [ ] Habits visible in right sidebar
- [ ] Journal exercises visible in right sidebar
- [ ] Wins banner appears when tasks are completed
- [ ] Debrief appears in left sidebar after 6pm (or via button)
- [ ] Plan button in header opens Plan Tomorrow overlay
- [ ] Plan Tomorrow overlay shows tomorrow's tasks and intention
- [ ] Migration Station is gone from the nav
- [ ] Mobile layout works (single column, no broken sections)
- [ ] Task celebrations still fire on checkbox click
- [ ] Greeting text changes based on time of day

**Step 3: Push**

```bash
git push origin HEAD && git checkout main && git merge unified-daily-page && git push origin main
```

---

## Phase 2: Ambient Time Awareness (Future)

These tasks build on the unified page but are independent features. Each can be implemented separately after Phase 1 ships.

### Task 9: Temporal Position Marker (header)

**Files:**
- Modify: `src/pages/DailyLeaf.tsx`
- Possibly add: `src/lib/temporalUtils.ts`

Header shows: "Wednesday - Day 3 of 5 this week - 10 days until March"

Requires a utility function that computes:
- Day name (already shown)
- Day position in work week (Mon=1 through Fri=5, or full week Mon-Sun)
- Days until end of month

---

### Task 10: Yesterday Bridge (above rapid log)

**Files:**
- Modify: `src/pages/DailyLeaf.tsx`

Single line above rapid log: "Yesterday you completed 4 tasks and said the plan felt 'about right'"

Requires:
- Filter `entries` for yesterday's date, count completed tasks
- Find yesterday's debrief, extract the calibration field
- Null-safe: show nothing if no yesterday data

---

### Task 11: Weekly Pulse (inline)

**Files:**
- Modify: `src/pages/DailyLeaf.tsx`

"This week: 12 tasks done, 3 habits maintained, 1 journal entry"

Requires:
- Compute Monday of current week
- Filter entries/habits/journalEntries within that date range
- Count completions

---

## Phase 3: Multi-Scale Planning Overlay (Future)

### Task 12: Expand Plan overlay with tabs

**Files:**
- Create: `src/components/PlanOverlay.tsx`
- Modify: `src/pages/DailyLeaf.tsx`
- Modify: `src/context/AppContext.tsx` (add planning data types)

Extract Plan Tomorrow into a tabbed overlay component with:
- Tab 1: Plan Tomorrow (existing)
- Tab 2: Plan This Week
- Tab 3: Plan This Month
- Tab 4: Plan This Quarter
- Tab 5: Plan This Year

Each tab is a separate implementation task with its own data model.

---

## Phase 4: Anti-Shame Architecture (Future)

### Task 13: Add "resolved" status

**Files:**
- Modify: `src/context/AppContext.tsx` (add `'resolved'` to status union)
- Modify: `src/pages/DailyLeaf.tsx` (add resolve button to task actions)
- Modify: `src/pages/FlowView.tsx` (support resolved status)

### Task 14: Soft fade for stale tasks

### Task 15: Comeback pattern

### Task 16: Planning calibration nudge

---

## Implementation Notes

### What NOT to change
- AppContext data model stays the same for Phase 1 (no new types needed)
- FlowView is untouched in Phase 1
- Celebration effects are untouched (separate enhancement track)
- Archive, Scrapbook, HabitTrace pages are untouched

### Risk areas
- The rapid log is duplicated in morning and evening modes — make sure we keep only ONE copy and it has all features (signifier help, inline editing, type pills, priority, event time)
- Mobile layout needs testing — it currently has morning-specific and evening-specific mobile blocks that need merging
- The `tomorrowIntention` and `tomorrowEntries` state/handlers must remain accessible even though Plan Tomorrow moves to an overlay

### Branch strategy
Work on current branch, merge to main after each task group, push.
