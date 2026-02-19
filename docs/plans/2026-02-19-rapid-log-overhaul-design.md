# Rapid Log Overhaul Design

## Problem Statement

The rapid log has several interconnected issues for ADHD users:
1. Completed tasks show as crossed-out ghosts (feels like punishment, not achievement)
2. No "not doing / cancelled" state — only complete or delete
3. Tiny 8px bullet symbols are invisible at normal viewing distance
4. 16px text requires browser zoom to read comfortably
5. No dark mode or display preferences
6. No novelty/dopamine — same look every day

## Design Decisions

### 1. Task States & Symbols

Four distinct states with bold geometric symbols:

| State | Symbol | Size | Color | Text | Trigger |
|-------|--------|------|-------|------|---------|
| Todo | ● filled circle | 12px | ink | Full opacity 18px | Default |
| Done | ✓ checkmark | 16px | sage | 60% opacity, no strikethrough | Click bullet |
| Cancelled | ✗ bold X | 14px | tension muted | Strikethrough + 50% opacity | "Not doing" action |
| Migrated | → arrow | 14px | primary/50 | 50% opacity | Auto on reschedule |

Events: ◯ (14px empty circle, 2px border)
Notes: — (16px wide dash, 2px thick)

Cancel with context: inline input appears below cancelled task for a one-line reason.
Saved as entry.notes field.

### 2. Typography & Density

- Base text: 18px Crimson Pro (up from 16px)
- Line height: leading-tight (1.25)
- Entry spacing: py-1 (down from py-2)
- Symbols: vertically centered with items-center (no manual mt-[Xpx])
- Entry rows use items-center flex alignment

### 3. Color of the Day

- ~30 curated accent hues as HSL values
- Deterministic daily selection: hash(YYYY-MM-DD) % palette.length
- Replaces --color-primary CSS custom property
- Small "today's color" indicator with revert button
- Compatible with both light and dark mode (saturation/lightness adjusts)

### 4. Dark Mode

- Toggle: sun/moon icon in header area
- Implementation: `dark` class on `<html>` (already configured in tailwind)
- Persisted to localStorage key `vellum-theme`
- Color mappings:
  - paper: #fffefb → dark: #1a1816
  - ink: #1b140d → dark: #ede8e3
  - background-light: #f8f7f6 → dark: #141210
  - surface-light: #fffefc → dark: #1e1b18
  - wood-light: #e8e0d5 → dark: #2a2520
  - pencil: #A8A29E → dark: #6b6560

### 5. Fit-to-Page Toggle

- Button near rapid log header: "Fit" icon
- Calculates: available viewport height / content scroll height
- Applies CSS transform: scale(X) with transform-origin: top center
- Recalculates on resize via ResizeObserver
- Persisted per mode (focus vs normal) in localStorage

## Files to Modify

- `src/pages/DailyLeaf.tsx` — bulletForEntry, rapid log rendering, header toggles
- `src/components/Layout.tsx` — dark mode toggle, theme provider
- `src/lib/colorOfTheDay.ts` — NEW: palette + daily selection logic
- `tailwind.config.js` — dark mode color definitions
- `src/index.css` — CSS custom properties for theme colors
- `src/pages/FlowView.tsx` — TaskCard symbol consistency
- `src/context/AppContext.tsx` — cancelled status handling (already typed)

## Non-Goals

- No continuous font size slider (efficiency trap)
- No user-configurable color picker (efficiency trap)
- No animation-heavy transitions
- Not changing the 3-column layout structure
