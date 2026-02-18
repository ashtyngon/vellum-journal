# Full-Screen Celebration Effects Design (v2 — canvas-confetti)

## Problem

v1 hand-coded canvas effects were too subtle, too muted, and lacked visual definition. User feedback: "not colorful, not defined, not pretty." Celebrations need to **POP** — vivid colors, defined shapes, full-screen impact.

## Solution: canvas-confetti

Use the `canvas-confetti` library (already installed, ~6KB gzipped) for all 8 celebration effects. This library produces professional, colorful, high-impact confetti with stars, emoji, custom shapes, fireworks — the exact visual punch that was missing.

## Design Principles

1. **VIVID, not muted** — Full rainbow spectrum, not the vellum palette. Celebrations should contrast against the journal's warm paper background.
2. **Novelty drives conditioning** — 8 distinct effects, never the same one twice in a row.
3. **4-6 second duration** — Forces ADHD users to pause and register the accomplishment.
4. **Queue, don't skip** — Rapid task completions queue up. Each plays fully.

## Architecture

### Rendering: canvas-confetti

The library handles all the heavy lifting: particle physics, 3D rotation, shapes, performance. Each effect choreographs multiple `confetti()` calls with staggered timing via `sleep()`.

### Queue System (unchanged from v1)

```
celebrateTask(el) called
  → rowGlowPulse(el)           // instant micro-feedback
  → queue.push(effect)         // add to celebration queue
  → if (!isPlaying) playNext() // start if idle

playNext()
  → pick random effect (avoid repeat)
  → await effect(origin)       // 4-6s of confetti
  → playNext() if queue not empty
```

## Effect Pool (8 effects)

### 1. Confetti Cannon (4s)
Massive 3-wave burst from the completed task position. 300+ particles total across rainbow, party, and gold star waves. Origin-anchored — fires from where you clicked.

### 2. Fireworks (5s)
Random firework bursts at different positions across the viewport. 360° spread, staggered 350ms apart, with random star/circle/square shapes. 12+ bursts over the duration.

### 3. Star Burst (4s)
3-wave gold and amber star explosion. Center burst → dual side cannons → grand finale. Large scalar (2x) stars floating with low gravity.

### 4. Side Cannons (4s)
Dual cannons from both screen edges, 5 volleys, confetti meeting in the middle. Random color palette each time (rainbow, warm, cool, or party).

### 5. Emoji Rain (4s)
Emoji confetti via `shapeFromText` — ✨🌱🔥⭐✅🎉💪🌟. 6 bursts of 15 emoji each, drifting down from random top positions.

### 6. Realistic Cascade (4s)
Multi-layered depth effect: 4 overlapping bursts at different velocities, decay rates, and sizes. Small fast layer → medium → slow floaty → star accent. Creates visual depth like real confetti.

### 7. Golden Shower (5s)
All-gold stars and circles drifting down from the top. 8 waves, low velocity, long ticks (500), gentle drift. Luxurious and warm.

### 8. Pride Burst (4s)
Rapid-fire rainbow cannons from bottom corners. 6 waves of alternating left/right bursts, each pair a different rainbow color. Stars fire from the opposite side simultaneously.

## Color Palettes

| Palette | Colors | Used By |
|---------|--------|---------|
| RAINBOW | #ff0055 #ff6600 #ffcc00 #00ff88 #00ccff #6633ff #ff33cc | Cannon, Fireworks |
| WARM | #ff4500 #ff8c00 #ffd700 #ff69b4 #ff1493 #ffaa00 | Star Burst, Cascade |
| COOL | #00e5ff #7c4dff #536dfe #18ffff #e040fb #00e676 | Side Cannons (random) |
| GOLD | #ffd700 #ffb300 #ff8f00 #fff176 #ffe082 #ffffff | Star Burst, Golden Shower |
| PARTY | #f44336 #e91e63 #9c27b0 #2196f3 #00bcd4 #4caf50 #ffeb3b #ff9800 | Cannon, Cascade |

## Behavior Rules

1. **Every task completion** triggers a full-screen celebration
2. **Row glow pulse** fires instantly as micro-feedback (unchanged)
3. **Celebrations queue** — sequential, no skipping
4. **No repeat** — never the same effect twice in a row
5. **pointer-events: none** — confetti doesn't block interaction
6. **Zero new dependencies** — canvas-confetti was already installed

## File Structure

```
src/components/TaskCelebration.tsx  — all effects, queue logic, public API (~590 lines)
```

Down from 1386 lines (v1 hand-coded canvas) to ~590 lines. Simpler, more vivid, more impactful.
