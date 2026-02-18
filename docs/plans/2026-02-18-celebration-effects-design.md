# Full-Screen Celebration Effects Design

## Problem

Current task completion celebrations are too small (confined to task row), too fast (~1 second), and don't create a felt emotional response. User wants Asana-scale viewport-filling celebrations that create a genuine reward moment.

## Design Principles

1. **Novelty drives conditioning** — Variable reinforcement schedule. 8 distinct effects, never the same one twice in a row. Each effect should feel like a *different thing happening*, not a color variant.
2. **Make me feel something** — No abstract particle geometry. Effects should have narrative: something grows, something stamps, something washes over you. The journal responding to you, or nature metaphors of growth.
3. **Force the landing moment** — 4-6 second duration forces ADHD users to pause and *register* the accomplishment instead of rushing to the next task. This is therapeutic, not decorative.
4. **Queue, don't skip** — Rapid task completion queues celebrations. Each one plays fully. 5 tasks = 5 full celebrations back to back.

## Architecture

### Rendering: Lottie (lottie-web)

- Source: Free Lottie JSON files from LottieFiles.com
- Library: `lottie-web` (~50KB gzipped, renders After Effects animations at 60fps)
- Color customization: programmatic palette swap after load to match vellum palette
- Rendering target: full-screen fixed overlay `<div>` with `pointer-events: none; z-index: 9999`

### Queue System

```
celebrateTask(el) called
  → rowGlowPulse(el)          // instant micro-feedback (existing, stays)
  → queue.push(randomEffect)  // add to celebration queue
  → if (!isPlaying) playNext() // start if idle

playNext()
  → pick next effect from queue
  → create overlay div
  → load Lottie JSON
  → play animation (4-6s)
  → on complete: remove overlay, playNext() if queue not empty
```

### File Structure

```
src/components/TaskCelebration.tsx    — queue logic, overlay, Lottie loading
src/assets/celebrations/
  ink-bloom.json                      — Lottie JSON (~30KB each)
  wax-seal.json
  handwritten.json
  page-ripple.json
  branch-bloom.json
  sunrise-wash.json
  seed-scatter.json
  golden-rain.json
```

## Effect Pool (8 effects)

### Journal Comes Alive (4 effects)

#### 1. Ink Bloom (5s)
Ink blots bloom outward from the center of the screen, spreading like watercolor on wet paper. Colors shift through amber → sage → bronze → gold. The bloom fills ~70% of the viewport at peak, then gently fades to nothing. The paper texture underneath shows through the translucent ink.

#### 2. Wax Seal (4s)
A golden wax seal drops from above and stamps down center-screen with visual weight (the overlay briefly flashes white on impact, subtle screen-shake via CSS transform). The seal is embossed with a checkmark. Melted wax drips radiate outward like rays. The seal glows warmly for 1.5s, then fades.

#### 3. Handwritten (4s)
Handwriting text scrawls across the viewport in a loose cursive script. Randomly selected phrases:
- "done."
- "nice."
- "got it."
- "yes."
- "that's one."
- "look at you."

Written with visible pen strokes (not typed), ink splatter on the period. Text appears letter by letter at handwriting speed, holds for a beat, then fades.

Tone: dry, warm, not cheesy. Matches the project's anti-platitude stance.

#### 4. Page Ripple (4s)
The entire viewport ripples outward from the checkbox position like a stone dropped in still water. 3-4 concentric wave rings expand outward with decreasing amplitude. The paper texture behind distorts gently with each wave. Uses CSS filter/transform for the ripple distortion effect layered under the Lottie overlay.

### Nature Metaphors (4 effects)

#### 5. Branch & Bloom (6s)
A single tree branch grows from the left edge of the viewport, extending across. The growth is slow and organic — you can watch it push outward. Leaves unfurl along the branch as it extends. When the branch reaches ~75% across, small flowers bloom at the tips in amber and rose. The whole thing holds for a beat, then fades.

#### 6. Sunrise Wash (5s)
A warm golden light rises from the bottom of the viewport, washing over everything like a slow sunrise. The light gradient shifts from deep amber at the bottom through gold to warm white at the top. A subtle lens flare blooms at the horizon line (center of viewport). The wash lingers at peak warmth for 1.5s, then fades to nothing.

#### 7. Seed Scatter (5s)
Small seeds burst upward from the checkbox position, arcing across the screen with realistic gravity physics. Where each seed lands (at the bottom of the viewport), a small green sprout pushes up — each one slightly different. 6-8 seeds total, staggered timing so sprouts appear one by one. The sprouts hold briefly, then fade.

#### 8. Golden Rain (6s)
Soft golden droplets fall gently across the entire viewport like warm rain on a windowpane. Each droplet leaves a tiny ripple-glow where it lands. The rain starts sparse, builds to a gentle steady fall, then tapers off. Meditative, calming. The slowest and most ambient of all effects.

## Color Palette Mapping

All Lottie animations get their colors programmatically swapped to:

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
6. **Graceful degradation** — if Lottie fails to load, fall back to existing canvas effects

## Dependencies

- `lottie-web` — npm package (~50KB gzipped)
- 8 Lottie JSON files — sourced from LottieFiles.com free library, color-customized

## Migration

- Replace existing canvas effects (supernova, victoryRibbon, levelUp, auroraWave, gravityDefier) with Lottie-based effects
- Keep `rowGlowPulse()` as instant micro-feedback
- Keep `celebrateTask()` and `useTaskCelebration()` public API unchanged
- Keep `findRow()` for the row glow
- Remove `createCanvas()` and all canvas animation functions
