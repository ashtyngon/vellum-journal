# Full-Screen Celebration Effects Design

## Problem

Current task completion celebrations are too small (confined to task row), too fast (~1 second), and don't create a felt emotional response. User wants viewport-filling celebrations that create a genuine reward moment — something you can *feel*, not just see.

## Design Principles

1. **Novelty drives conditioning** — Variable reinforcement schedule. 8 distinct effects, never the same one twice in a row. Each effect should feel like a *different thing happening*, not a color variant.
2. **Make me feel something** — No abstract particle geometry. Effects should have narrative: something grows, something stamps, something washes over you. The journal responding to you, or nature metaphors of growth.
3. **Force the landing moment** — 4-6 second duration forces ADHD users to pause and *register* the accomplishment instead of rushing to the next task. This is therapeutic, not decorative.
4. **Queue, don't skip** — Rapid task completion queues celebrations. Each one plays fully. 5 tasks = 5 full celebrations back to back.

## Architecture

### Rendering: Hand-coded Canvas + DOM

Zero external dependencies. All 8 effects are implemented as canvas animations with proper physics, easing curves, and motion techniques. Each effect is crafted like a mini art piece — not generic particle bursts.

- Full-screen canvas overlay: `position: fixed; inset: 0; pointer-events: none; z-index: 9999`
- DPR-aware rendering (existing `createCanvas()` pattern)
- Some effects layer CSS transforms on DOM elements (page ripple, wax seal screen-shake)

### Queue System

```
celebrateTask(el) called
  → rowGlowPulse(el)           // instant micro-feedback (existing, stays)
  → queue.push(randomEffect)   // add to celebration queue
  → if (!isPlaying) playNext() // start if idle

playNext()
  → pick next effect from queue
  → create full-screen canvas
  → run animation (4-6s)
  → on complete: remove canvas, playNext() if queue not empty
```

### File Structure

```
src/components/TaskCelebration.tsx  — all effects, queue logic, overlay management
```

Single file. No external assets. No dependencies beyond what's already in the project.

## Effect Pool (8 effects)

### Journal Comes Alive (4 effects)

#### 1. Ink Bloom (5s)
Ink blots bloom outward from the center of the screen, spreading like watercolor on wet paper. Multiple overlapping circles expand with soft edges, using radial gradients with varying opacity. Colors shift through amber → sage → bronze → gold as new blots emerge. The bloom fills ~70% of the viewport at peak. Each blot has slight random wobble in its expansion path. Fades gently to nothing.

Canvas technique: 15-20 overlapping radial gradients, each expanding at different rates with `globalCompositeOperation: 'multiply'` for watercolor blending. Perlin-like noise on the radius for organic edges.

#### 2. Wax Seal (4s)
A golden wax seal drops from above and stamps down center-screen with visual weight. Phase 1 (0.5s): seal shape descends with acceleration. Phase 2 (0.1s): impact — screen flashes white briefly, CSS transform applies 3px translateY shake to the page container. Phase 3 (1.5s): seal sits center-screen glowing warmly, embossed checkmark rendered with shadow/highlight. Wax drips radiate outward from the seal like sun rays. Phase 4 (1.5s): slow fade.

Canvas technique: circular shape with inner shadow for embossing, radial gradient for glow, bezier curves for wax drip rays. Screen shake via `document.body.style.transform`.

#### 3. Handwritten (4s)
Handwriting text scrawls across the center of the viewport in a loose script style. Randomly selected phrases:
- "done."
- "nice."
- "got it."
- "yes."
- "that's one."
- "look at you."

Phase 1 (2s): text appears stroke by stroke, simulating pen movement. Each letter is drawn as a series of bezier curve segments revealed progressively. Ink splatter dots appear at stroke endpoints. Phase 2 (0.5s): hold at full visibility. Phase 3 (1.5s): fade out.

Canvas technique: pre-defined bezier path data for each phrase, progressive stroke reveal via `setLineDash`/`lineDashOffset` animation. Font: 80px Georgia italic with custom stroke rendering. Ink splatters as small random circles near stroke endpoints.

Tone: dry, warm, not cheesy. Matches the project's anti-platitude stance.

#### 4. Page Ripple (4s)
The entire viewport ripples outward from the checkbox position like a stone dropped in still water. 3-4 concentric wave rings expand outward with decreasing amplitude. The rings are rendered as expanding circles with varying stroke width and opacity.

Canvas technique: multiple expanding circle strokes with sinusoidal opacity modulation. Each ring has slight thickness variation. A central bright spot fades as rings expand. Optional: CSS `filter: url(#ripple)` SVG filter on the page content for actual distortion effect.

### Nature Metaphors (4 effects)

#### 5. Branch & Bloom (6s)
A tree branch grows from the left edge of the viewport, extending across. Phase 1 (3s): main branch grows rightward as a bezier curve, rendered segment by segment. Small side branches fork off at random intervals. The growth has organic easing — fast start, slow at decision points, fast again. Phase 2 (1.5s): leaves unfurl along the branch — small ellipses that scale up from 0 with a slight rotation. Phase 3 (1s): flowers bloom at branch tips — 5-petal shapes in amber and rose that scale up with a satisfying pop. Phase 4 (0.5s): hold, then fade.

Canvas technique: recursive bezier curves for branching structure. Leaf and flower shapes drawn with `beginPath`/`arc`/`bezierCurveTo`. Growth animation by progressively increasing the `t` parameter of the bezier evaluation.

#### 6. Sunrise Wash (5s)
A warm golden light rises from the bottom of the viewport, washing over everything. Phase 1 (2s): a horizontal gradient band rises from bottom to center. The gradient shifts from deep amber (#8B4513) at the leading edge through gold (#D4A843) to warm white (#FFF8ED) behind. Phase 2 (1s): at center-screen, a lens flare blooms — overlapping circles with additive blending. Phase 3 (1s): the wash lingers at peak warmth. Phase 4 (1s): fades to nothing from top to bottom.

Canvas technique: full-width linear gradient that animates its y-position upward. Lens flare via multiple overlapping radial gradients with `globalCompositeOperation: 'lighter'`. Background has low opacity so page content shows through.

#### 7. Seed Scatter (5s)
Small seeds burst upward from the checkbox position, arcing across the screen with realistic gravity physics. Phase 1 (1.5s): 6-8 seed shapes (small teardrop/oval) launch upward with random velocities and angles. Gravity pulls them down in parabolic arcs. Phase 2 (2s): as each seed lands at the bottom of the viewport, a small green sprout pushes up at that x-position — stem first, then two small leaves. Each sprout is slightly different (height, lean angle, leaf size). Phase 3 (1.5s): sprouts hold, sway gently, then fade.

Canvas technique: projectile motion physics (vx, vy, gravity). Seed shapes as filled ellipses with slight rotation along velocity vector. Sprouts drawn with bezier curve stems and ellipse leaves, animated by progressive height reveal.

#### 8. Golden Rain (6s)
Soft golden droplets fall gently across the entire viewport like warm rain. Phase 1 (1s): sparse drops begin falling — 2-3 at a time. Phase 2 (2.5s): rain builds to steady fall, 8-10 drops visible at once. Each drop is a small elongated ellipse with a subtle trail. Phase 3 (1.5s): rain tapers off, fewer drops. Phase 4 (1s): last drops land, ripple glows fade.

Where each drop hits the bottom, a small circular ripple-glow expands outward (ring + radial gradient). The ripples overlap and fade independently.

Canvas technique: particle system with terminal velocity, slight wind drift. Drop shapes as vertically stretched ellipses. Landing ripples as expanding stroke circles with fading radial gradient centers.

## Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Primary accent | Amber | #ec7f13 |
| Secondary | Gold | #D4A843 |
| Tertiary | Sage | #8fa88f |
| Warm neutral | Bronze | #C9A96E |
| Accent | Rose | #C47C7C |
| Light | Cream | #FAF6F0 |
| Background | Warm white | #FFF8ED |

## Behavior Rules

1. **Every task completion** triggers a full-screen celebration (no milestone gating)
2. **Row glow pulse** fires instantly as micro-feedback (existing behavior, unchanged)
3. **Celebrations queue** — if one is playing, the next waits. No skipping, no interrupting.
4. **No repeat** — never the same effect twice in a row (existing lastEffectIndex logic)
5. **pointer-events: none** — user can still interact with the page during celebrations
6. **Graceful degradation** — if canvas fails, the row glow pulse is always there

## Dependencies

None new. Pure canvas + existing DOM APIs.

## Migration

- Replace existing 5 canvas effects (supernova, victoryRibbon, levelUp, auroraWave, gravityDefier) with 8 new full-screen effects
- Keep `rowGlowPulse()` as instant micro-feedback
- Keep `celebrateTask()` and `useTaskCelebration()` public API unchanged
- Keep `findRow()` for the row glow
- Add queue system (isPlaying flag, effect queue array)
- Existing `createCanvas()` reused for the full-screen overlay
