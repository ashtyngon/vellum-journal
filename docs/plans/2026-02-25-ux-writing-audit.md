# UX Writing Audit — Vellum Journal
## Based on NNG UX Writing Study Guide (20+ articles)

---

## PART 1: Master Heuristics Checklist (ADHD-Adapted)

### A. Brevity & Scanning (from "How Little Do Users Read", "Satisficing", "F-Pattern", "Layer-Cake")
1. **Keep UI text under 8 words** — users read ~20% of page text
2. **Front-load first 2 words** — scanning eyes only see opening words of list items
3. **Use layer-cake pattern** — bold headings with minimal body text between
4. **Verb-first for actions** — "Add task", not "You can add a task here"
5. **No filler words** — cut "very", "really", "just", "actually", "simply"
6. **Numbers as numerals** — "3 tasks" not "three tasks"

### B. Microcontent & Labels (from "Microcontent", "UI Copy", "Headlines as Pickup Lines")
7. **Button labels describe the outcome** — "Save reflection" not "Submit"
8. **Describe future state, not current** — "Pause" when playing, "Play" when paused
9. **No generic confirmations** — replace "OK" with specific action: "Discard", "Keep"
10. **Standalone clarity** — every label must make sense without surrounding context
11. **Remove articles** — "Add task" not "Add a task"
12. **Ellipsis for multi-step** — "Export..." signals more input needed

### C. Tone (from "Tone of Voice Impact", "ChatGPT Tone", "Cringeworthy Words")
13. **Trust > friendliness** — credibility drives 52% of desirability; friendliness only 8%
14. **Casual-serious beats formal** — conversational but not clownish
15. **Humor is high-risk** — playful tone in serious contexts undermines credibility
16. **Cut "utilize", "enables you to", "in today's world"** — use plain language
17. **No "end user"** — speak directly to the person
18. **Avoid ChatGPT-isms** — no "delightful journey", "magic", forced enthusiasm

### D. Error Messages (from "Error Message Guidelines", "Scoring Rubric")
19. **Place near the error source** — not in a distant toast
20. **Human-readable, no jargon** — hide error codes
21. **State what happened + what to do** — not just "error occurred"
22. **Positive tone, no blame** — avoid "invalid", "incorrect", "you failed"
23. **Preserve user input** — never clear their work on error
24. **Severity-proportional display** — subtle for minor, modal for critical

### E. Action Copy & Links (from "Interface Copy", "Get Started Stops", "Link Promise", "Learn More", "4 S's")
25. **No "Get Started"** — too vague; say what actually happens
26. **No "Learn More"** — use descriptive destination text
27. **Links are promises** — text must match what appears after clicking
28. **4 S's: Specific, Sincere, Substantial, Succinct** — in that priority order
29. **No scare tactics or artificial urgency** — honest copy builds trust
30. **Copy-action match** — description must match available choices

### F. Formatting & Structure (from "Chunking", "Inverted Pyramid", "Formatting Long-Form", "Accordions")
31. **Chunk into 3-6 items** — matches working memory capacity
32. **Inverted pyramid** — most important info first, details after
33. **Bold < 30% of text** — selective emphasis, not everything bold
34. **Accordions only for selective content** — not when users need most items
35. **Summaries at section top** — users decide relevance from first sentence

### G. Contextual Menus (from "Contextual Menus Guidelines")
36. **Secondary actions only** — don't hide primary functions
37. **Group related actions** — logically connected options together
38. **Consistent icons** — same icon (kebab/meatball) everywhere
39. **Clarifying labels** — "Post Actions" not generic "Options"
40. **Visible without hover** — especially critical for touch/mobile
41. **Keyboard accessible** — tab, enter, arrow keys work

### H. ADHD-Specific Adaptations
42. **Dopamine-friendly microcopy** — celebrate micro-wins explicitly
43. **Reduce decision fatigue** — fewer choices, smart defaults
44. **Progress visibility** — always show completion state
45. **Gentle accountability** — no shame language, normalize imperfection
46. **Reward immediacy** — instant visual feedback on every action
47. **Break tasks into atoms** — smallest possible action units
48. **Time-anchoring** — show when, not just what

---

## PART 2: App Text Audit — Findings

### CRITICAL (Fix now — high user impact)

#### C1: Overdue section header "N from before" is vague
- **Where**: DailyLeaf.tsx line 1244-1245
- **Current**: `{overdueTasks.length} from before`
- **Problem**: "from before" doesn't front-load information (H1: first-2-words rule). Users scanning see a number then a vague temporal reference. No action implied.
- **Fix**: `{overdueTasks.length} overdue` — front-loads the key concept
- **Heuristics violated**: #2 (front-load), #10 (standalone clarity), #6 (brevity)

#### C2: "→ Today" and "→ Park" buttons lack verb clarity
- **Where**: DailyLeaf.tsx lines 1253, 1259
- **Current**: `→ Today`, `→ Park`
- **Problem**: Arrow + destination isn't action-oriented. "Park" is jargon for new users. (#7: describe outcome, #10: standalone clarity)
- **Fix**: `Move here` / `To parking lot` or keep `→ Today` but change `→ Park` to `→ Later`
- **Heuristics violated**: #7, #10, #16

#### C3: "Stuck?" button has unclear consequence
- **Where**: DailyLeaf.tsx line 1485
- **Current**: `Stuck?`
- **Problem**: Asks a question but doesn't say what happens when you click it. Links are promises (#27). Users don't know it opens a procrastination unpacker.
- **Fix**: `Unblock` or `Break it down` — action-oriented, describes outcome
- **Heuristics violated**: #7, #25, #27

#### C4: Companion rapid-click messages lack ADHD sensitivity
- **Where**: DailyLeaf.tsx lines 1044-1048
- **Current**: "You're adorable but your tasks won't do themselves."
- **Problem**: While ironic/fun (which the user likes), the message "your tasks won't do themselves" could feel shaming for ADHD users who are already struggling with task initiation. The humor should punch at the situation, not at the user's productivity.
- **Fix**: "You're adorable but I'm running out of things to say." — still funny, no productivity shame
- **Heuristics violated**: #22 (no blame), #45 (gentle accountability)

#### C5: "What matters today?" placeholder is a high-pressure question
- **Where**: DailyLeaf.tsx line 1137
- **Current**: `What matters today?`
- **Problem**: For ADHD users, "what matters" implies hierarchy and importance — which triggers analysis paralysis. The question is existential when it should be tactical.
- **Fix**: `What's on your plate?` or `What's first?` — lowers the stakes
- **Heuristics violated**: #43 (reduce decision fatigue), #45 (gentle accountability)

#### C6: Type pill labels ("Task", "Event", "Note") lack entry-context help
- **Where**: DailyLeaf.tsx line 1307 + bujoHints.ts SIGNIFIER_TOOLTIPS
- **Current**: Just `Task`, `Event`, `Note` with symbols
- **Problem**: First-time users don't know when to use which. The "Key" button is too hidden (10px text, pencil/40 opacity). (#40: visible without hover)
- **Fix**: Add micro-descriptions on first use or in tooltip: "Task — something to do", "Event — something scheduled", "Note — a thought"
- **Heuristics violated**: #10, #40

### HIGH PRIORITY (Fix soon — affects flow)

#### H1: Plan input placeholder varies inconsistently
- **Where**: DailyLeaf.tsx line 824, 872
- **Current**: `Redefine the day...` / `Intention for tomorrow` / `Add to today...` / `Add to this week...`
- **Problem**: "Redefine the day" is dramatic and unclear. "Intention for tomorrow" is fine. The tone shifts between existential and practical.
- **Fix**: Unify to practical tone: `Today's priority...` / `Tomorrow's priority...` / `Add to today...` / `Add to this week...`
- **Heuristics violated**: #6 (consistency), #14 (casual-serious), #18 (no ChatGPT-isms)

#### H2: Debrief questions could be warmer
- **Where**: DayDebrief.tsx
- **Current**: "How realistic was your plan today?" → "How much did you get done?" → "How do you feel about today?"
- **Problem**: The sequence goes from judgment ("realistic") to measurement ("how much") to feeling. For ADHD, starting with judgment can trigger defensiveness. The "I didn't have a plan today" feels like a confession.
- **Fix**: Reframe "I didn't have a plan today" → "Skip planning check" (neutral, action-oriented). Consider reordering: feeling → accomplishment → plan realism (warm up, then reflect).
- **Heuristics violated**: #22 (no blame), #45 (gentle accountability)

#### H3: "why? (optional)" cancel-note placeholder
- **Where**: DailyLeaf.tsx line 1509
- **Current**: `why? (optional)`
- **Problem**: Asking "why" about a cancellation feels interrogatory. For ADHD users who cancel tasks frequently, this accumulates into a shame spiral.
- **Fix**: `what happened? (optional)` or just `note (optional)` — observational, not interrogatory
- **Heuristics violated**: #22, #45

#### H4: Capacity warning text is accusatory
- **Where**: DailyLeaf.tsx line 1230-1231
- **Current**: `You have {count} tasks (~{hours}hrs). Could you pick your top 3?`
- **Problem**: "Could you pick your top 3?" is a polite command that implies the user is overloading themselves. For ADHD, the problem isn't that they can't prioritize — it's that everything feels equally urgent.
- **Fix**: `{count} tasks today (~{hours}hrs). Focus tip: start with just 1.` — validates, then suggests smaller step
- **Heuristics violated**: #45, #47 (break into atoms), #43

#### H5: Journal method descriptions are too long
- **Where**: journalMethods.ts — all 9 methods
- **Current**: e.g. "Examine an automatic thought by weighing evidence for and against it, then form a more balanced perspective." (17 words)
- **Problem**: Users scanning the journal exercise list won't read descriptions this long. Front-load the benefit. (#1: under 8 words, #2: front-load, #32: inverted pyramid)
- **Fix**: Lead with outcome: "Challenge a thought. Find what's really true." / "Dump your brain. Four prompts, no rules."
- **Heuristics violated**: #1, #2, #32

#### H6: FlowView "Schedule to Today" missing on future-date tasks
- **Where**: FlowView.tsx — scheduleToToday function
- **Current**: Only works for parking lot tasks, uses "Schedule" language
- **Problem**: "Schedule" implies calendar/time-picking. The actual behavior is "move to today's section." Mismatch between copy and action (#30).
- **Fix**: "Move to today" — matches DailyLeaf's language for the same action
- **Heuristics violated**: #6 (consistency), #30 (copy-action match)

#### H7: FlowView section names are generic
- **Where**: FlowView.tsx INITIAL_SECTIONS
- **Current**: "Morning Focus", "Afternoon", "Evening"
- **Problem**: "Morning Focus" implies you must focus. "Afternoon" and "Evening" have no personality and no guidance. The inconsistency (Focus for morning, nothing for others) creates confusion.
- **Fix**: Either all plain ("Morning", "Afternoon", "Evening") or all themed ("Morning Launch", "Afternoon Push", "Evening Wind-Down")
- **Heuristics violated**: #6 (consistency), #10 (standalone clarity)

### MEDIUM PRIORITY (Polish — improves experience)

#### M1: Signifier tooltips are BuJo jargon
- **Where**: bujoHints.ts lines 104-111
- **Current**: "Migrated — moved forward", "Done — completed"
- **Problem**: "Migrated" is Bullet Journal jargon that non-BuJo users won't understand. (#16: plain language)
- **Fix**: "Migrated" → "Moved — rescheduled to another day"

#### M2: "Past day" / "Upcoming" greeting lacks warmth
- **Where**: DailyLeaf.tsx line 1003
- **Current**: `Past day` / `Upcoming` / `Good morning`
- **Problem**: "Past day" is clinical. "Upcoming" is even more so. The greeting for today ("Good morning") is warm; the past/future equivalents are cold.
- **Fix**: "Looking back" / "Looking ahead" / "Good morning" — maintains warmth across states

#### M3: Empty states need encouragement
- **Where**: Various
- **Current**: FlowView parking lot: "All tasks scheduled." / Archive: "Your archive is empty."
- **Problem**: Empty states are missed opportunity for ADHD motivation. (#42: dopamine-friendly microcopy)
- **Fix**: "All tasks scheduled. Nice work." / "Your archive is empty — but it won't be for long."

#### M4: Debrief snooze/dismiss options lack clarity
- **Where**: DailyLeaf.tsx lines 940, 947
- **Current**: "Remind me later" / "Not tonight"
- **Problem**: "Not tonight" is adequate. "Remind me later" doesn't say when. (#27: link promise, #28: specific)
- **Fix**: "Remind in 2 hours" / "Skip tonight" — specific about what happens

#### M5: "Key" button for signifier help is too hidden
- **Where**: DailyLeaf.tsx line 1314
- **Current**: `Key` in 10px, pencil/40 opacity
- **Problem**: Critical onboarding information hidden behind barely-visible text (#40: visible without hover, #36: don't hide primary functions for first-time users)
- **Fix**: Show inline on first 3 sessions, then collapse to icon

#### M6: Archive search placeholder too long
- **Where**: ArchiveLibrary.tsx line 204
- **Current**: `Search journals, events, tags...`
- **Problem**: 5 words in placeholder is fine but could front-load better (#2)
- **Fix**: `Search entries...` — shorter, covers all types

#### M7: Moved-count indicator needs tooltip improvement
- **Where**: DailyLeaf.tsx line 1449 + FlowView.tsx
- **Current**: Dots + `Moved {N}x` tooltip on DailyLeaf, `↻N` on FlowView
- **Problem**: Inconsistent display between pages (#6, #30)
- **Fix**: Unify to `↻N` on both pages with tooltip "Rescheduled {N} times"

---

## PART 3: ADHD Reward/Motivation Text Audit

### What's Working Well
- **Companion messages** — Ironic, cynical, supportive tone is excellent (matches user preference)
- **Confetti celebrations** — 13 different effects on task completion = strong variable reward schedule
- **Progress ring** — Always-visible completion ratio feeds dopamine
- **Three Good Things exercise** — Evidence-based positive psychology with the right prompts
- **Rotating placeholders** — Smart variety prevents habituation

### What Needs ADHD-Specific Improvement

#### R1: No micro-celebration for adding tasks
- **Current**: Celebrations only fire on task COMPLETION
- **Opportunity**: Adding a task IS an accomplishment for ADHD. A subtle pulse/glow on the new entry reinforces the "capture" behavior.
- **Conditioning principle**: Reward the capture loop, not just the completion loop

#### R2: Streak language is missing from daily view
- **Current**: prompts.ts has streak text but it's buried in contextual prompts
- **Opportunity**: Visible streak counter near habits: "3-day streak ○○○" builds loss-aversion motivation
- **Conditioning principle**: Loss aversion (not wanting to break streak) > reward seeking

#### R3: Debrief completion lacks reward
- **Current**: "Saved ✓" — minimal feedback for a reflective act
- **Opportunity**: After debrief save, show a warm message: "Day logged. That takes 2 minutes most people never spend." + small animation
- **Conditioning principle**: Immediate reward anchoring for reflective behavior

#### R4: No "just do 1" nudge
- **Current**: Capacity warning suggests "pick your top 3"
- **Opportunity**: For ADHD, "pick 1" is more actionable than "pick 3". Show a "Just 1?" button that highlights only the topmost task.
- **Conditioning principle**: Smallest possible commitment → task initiation

---

## PART 4: Priority Implementation Order

1. **C1-C3**: Fix vague/unclear labels (overdue, park, stuck) — 15 min
2. **C4-C5**: Fix ADHD-sensitive copy (companion, placeholder) — 10 min
3. **H3-H4**: Fix interrogatory/accusatory copy (why?, capacity) — 10 min
4. **H5**: Shorten journal method descriptions — 15 min
5. **M2-M3**: Warm up empty states and navigation greetings — 10 min
6. **M4**: Clarify debrief snooze text — 5 min
7. **M7**: Unify moved-count display — 5 min
8. **H1**: Unify plan input placeholders — 5 min

**Total estimated: ~75 min of text changes**
