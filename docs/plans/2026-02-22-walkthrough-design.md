# New User Walkthrough Design

## Problem
New users land on a pre-populated app with fake tasks ("Review quarterly budget", "Call Mom") and fake habit streaks. No explanation of what anything is. Confusing and impersonal.

## Solution
Remove all seed data. Replace with a 5-step interactive walkthrough that teaches by doing.

## Steps

1. **Welcome** — Full-screen. Companion animal + "A daily journal built for brains that move fast." → [Let's go]
2. **First task** — Highlights rapid log input. User types a task (placeholder: "water a plant"). Must add something to proceed. → [Nice!]
3. **Entry types** — Explains Task/Event/Note with their signifiers. → [Got it]
4. **Other pages** — 3 mini cards: Flow View, Habits, Archive. → [Almost done]
5. **Done** — Companion again: "No rules, no streaks to maintain. Just show up when you can." → [Start journaling]

## Technical

- New component: `src/components/Walkthrough.tsx`
- AppContext: `isNewUser` flag, set true when Firestore doc doesn't exist
- Seed branch creates ZERO entries (empty arrays)
- localStorage: `vellum-walkthrough-done` prevents re-showing
- Color reveal plays AFTER walkthrough dismisses
- `completeWalkthrough()` in AppContext clears the flag
