/**
 * Color of the Day — deterministic daily accent color for dopamine/novelty.
 * Hashes the date string to pick from a curated palette of 100 warm-friendly hues.
 * Same color all day, different tomorrow. No user control (by design).
 */

// Curated palette: [hue, saturation, lightness] tuples
// Each one tested to look good as an accent on both light and dark backgrounds.
const PALETTE: [number, number, number][] = [
  [24, 85, 50],   // warm amber (default-ish)
  [340, 65, 55],  // dusty rose
  [16, 75, 52],   // burnt sienna
  [190, 55, 42],  // ocean teal
  [145, 40, 40],  // forest sage
  [265, 45, 55],  // dusty lavender
  [32, 80, 48],   // golden honey
  [355, 60, 50],  // soft crimson
  [175, 50, 38],  // dark teal
  [45, 75, 45],   // warm ochre
  [210, 50, 48],  // slate blue
  [10, 70, 52],   // terracotta
  [320, 45, 50],  // mauve
  [85, 35, 42],   // olive green
  [280, 40, 48],  // soft purple
  [55, 65, 42],   // dark gold
  [200, 45, 45],  // storm blue
  [160, 40, 38],  // deep sage
  [5, 65, 48],    // rust
  [230, 40, 50],  // periwinkle
  [35, 70, 46],   // copper
  [120, 30, 40],  // moss
  [300, 35, 48],  // plum
  [15, 80, 50],   // tangerine
  [250, 35, 52],  // iris
  [170, 45, 40],  // pine
  [345, 55, 52],  // rosewood
  [60, 50, 40],   // bronze gold
  [220, 42, 48],  // dusk blue
  [100, 35, 38],  // fern
  [28, 72, 44],   // driftwood
  [182, 48, 40],  // seafoam
  [50, 60, 38],   // burnt honey
  [310, 38, 45],  // thistle bloom
  [138, 42, 38],  // juniper
  [20, 68, 46],   // sunset clay
  [240, 38, 50],  // twilight
  [155, 45, 42],  // eucalyptus
  [350, 50, 48],  // cranberry
  [70, 45, 40],   // lichen
  [195, 52, 44],  // arctic slate
  [8, 62, 42],    // cayenne
  [270, 42, 50],  // wisteria
  [42, 68, 42],   // turmeric
  [330, 50, 46],  // dried rose
  [110, 38, 42],  // clover field
  [205, 48, 42],  // harbor blue
  [18, 72, 48],   // paprika
  [285, 35, 46],  // dusk violet
  [165, 42, 36],  // spruce
  [38, 65, 40],   // caramel
  [215, 44, 46],  // steel blue
  [352, 58, 46],  // pomegranate
  [95, 32, 40],   // sage moss
  [255, 40, 48],  // hyacinth
  [30, 78, 42],   // cinnamon
  [178, 44, 42],  // tide pool
  [315, 40, 50],  // heather
  [48, 55, 44],   // saffron
  [125, 35, 38],  // ivy
  [225, 45, 50],  // cornflower
  [12, 65, 44],   // adobe
  [290, 38, 52],  // lilac haze
  [142, 38, 40],  // basil
  [40, 62, 46],   // butterscotch
  [335, 48, 48],  // mulberry
  [185, 46, 38],  // deep lagoon
  [58, 48, 38],   // olive gold
  [245, 42, 46],  // midnight iris
  [22, 75, 50],   // marmalade
  [168, 40, 40],  // verdigris
  [305, 36, 46],  // foxglove
  [75, 38, 38],   // moss agate
  [198, 50, 40],  // petrol blue
  [345, 52, 44],  // garnet
  [52, 58, 40],   // raw umber
  [260, 38, 48],  // storm violet
  [135, 36, 42],  // fiddlehead
  [28, 70, 48],   // toffee
  [188, 42, 44],  // rain cloud
  [325, 42, 48],  // bramble
  [65, 42, 36],   // dark moss
  [202, 46, 46],  // fjord blue
  [358, 55, 50],  // vermillion
  [108, 32, 40],  // forest floor
  [275, 40, 52],  // soft amethyst
  [44, 72, 44],   // amber glow
  [148, 40, 38],  // celadon
  [332, 45, 50],  // wild berry
  [80, 36, 42],   // artichoke
  [218, 46, 44],  // denim
  [14, 68, 46],   // brick dust
  [295, 34, 48],  // lavender ash
  [152, 44, 40],  // jade mist
  [36, 66, 42],   // pecan
  [338, 52, 52],  // raspberry
  [172, 48, 38],  // dark jade
  [55, 52, 42],   // toasted wheat
  [228, 40, 48],  // heron blue
  [2, 72, 46],    // dragon pepper
];

/** Simple deterministic hash from a date string like "2026-02-19" */
function hashDate(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = ((h << 5) - h + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export interface DailyColor {
  hue: number;
  sat: number;
  light: number;
  /** CSS hsl string for light mode */
  css: string;
  /** CSS hsl string for dark mode (boosted lightness) */
  cssDark: string;
  /** Palette index (for deterministic reproduction) */
  index: number;
}

/** Get the color of the day for a given date string (YYYY-MM-DD) */
export function getColorOfTheDay(dateStr: string): DailyColor {
  const idx = hashDate(dateStr) % PALETTE.length;
  const [h, s, l] = PALETTE[idx];
  return {
    hue: h,
    sat: s,
    light: l,
    css: `hsl(${h}, ${s}%, ${l}%)`,
    cssDark: `hsl(${h}, ${Math.min(s + 10, 80)}%, ${Math.min(l + 15, 70)}%)`,
    index: idx,
  };
}

/** Default amber accent (for when user reverts) */
export const DEFAULT_PRIMARY = {
  hue: 24,
  sat: 85,
  light: 50,
  css: 'hsl(24, 85%, 50%)',
  cssDark: 'hsl(24, 80%, 65%)',
  index: 0,
};

/** Accent-only: daily color for interactive elements, not surface wash.
 *  The daily color appears on buttons, progress bars, focus rings, and small highlights.
 *  ADHD brains need novelty — this is the novelty engine, applied with restraint. */
export function applyAccentColor(color: DailyColor, isDark: boolean): void {
  const root = document.documentElement;
  const hsl = isDark ? color.cssDark : color.css;
  const h = color.hue;
  const s = color.sat;
  const l = isDark ? Math.min(color.light + 15, 70) : color.light;

  // Core color tokens
  root.style.setProperty('--color-accent', hsl);
  root.style.setProperty('--color-accent-h', String(h));
  root.style.setProperty('--color-accent-s', `${s}%`);
  root.style.setProperty('--color-accent-l', `${l}%`);
  root.style.setProperty('--color-primary', hsl);

  // Light-mode tints use a boosted lightness so the wash is visible but not muddy
  const tintL = isDark ? l : Math.min(l + 20, 85);

  // Ambient tints — subtle accent for hover, active, and selected states only.
  root.style.setProperty('--color-tint-soft', `hsla(${h}, ${s}%, ${tintL}%, ${isDark ? 0.06 : 0.04})`);
  root.style.setProperty('--color-tint-medium', `hsla(${h}, ${s}%, ${tintL}%, ${isDark ? 0.12 : 0.08})`);
  root.style.setProperty('--color-tint-strong', `hsla(${h}, ${s}%, ${tintL}%, ${isDark ? 0.20 : 0.15})`);
  root.style.setProperty('--color-glow', `hsla(${h}, ${s}%, ${l}%, 0.50)`);

  // Header tint — barely tinted, not a bold wash
  root.style.setProperty('--color-tint-header', `hsla(${h}, ${s}%, ${tintL}%, ${isDark ? 0.08 : 0.05})`);

  // Sidebar panel tint — almost invisible, just enough to hint at the daily color
  root.style.setProperty('--color-tint-panel', `hsla(${h}, ${s}%, ${tintL}%, ${isDark ? 0.05 : 0.03})`);

  // Border tint — subtle accent borders
  root.style.setProperty('--color-border-accent', `hsla(${h}, ${s}%, ${l}%, ${isDark ? 0.25 : 0.20})`);

  // Focus ring
  root.style.setProperty('--color-focus-ring', `hsla(${h}, ${s}%, ${l}%, 0.55)`);

  // Gradient string for header strips, buttons, progress bars
  root.style.setProperty('--color-gradient',
    `linear-gradient(135deg, hsl(${h}, ${s}%, ${l}%), hsl(${(h + 30) % 360}, ${Math.max(s - 10, 30)}%, ${l}%))`
  );

  // Wider gradient for full-width strips
  root.style.setProperty('--color-gradient-wide',
    `linear-gradient(90deg, hsl(${h}, ${s}%, ${l}%), hsl(${(h + 20) % 360}, ${s}%, ${Math.min(l + 8, 65)}%), hsl(${(h + 40) % 360}, ${Math.max(s - 15, 25)}%, ${l}%))`
  );
}

/** Get a readable name for the color (for display) */
export function getColorName(color: DailyColor): string {
  return COMPANIONS[color.index]?.colorName ?? 'Today’s Color';
}

/* ── Daily Companions — each color paired with a character + message ─── */

export interface DailyCompanion {
  colorName: string;
  animal: string;     // emoji character
  name: string;       // the companion's name
  message: string;    // unique daily affirmation (ADHD-friendly, not generic wellness)
}

const COMPANIONS: DailyCompanion[] = [
  // 0 – Warm Amber
  { colorName: 'Warm Amber', animal: '🦊', name: 'Fox',
    message: 'The task isn’t hard. Starting it is. Once you’re in, you already know what to do.' },
  // 1 – Dusty Rose
  { colorName: 'Dusty Rose', animal: '🐙', name: 'Octavia',
    message: 'You’re planning how to plan. Skip that step. Open the thing and begin.' },
  // 2 – Burnt Sienna
  { colorName: 'Burnt Sienna', animal: '🦝', name: 'Bandit',
    message: 'Your estimate is wrong. Double it. Now you have a real timeline.' },
  // 3 – Ocean Teal
  { colorName: 'Ocean Teal', animal: '🐋', name: 'Atlas',
    message: 'You keep redesigning the system instead of using it. Pick one. Run it for a week.' },
  // 4 – Forest Sage
  { colorName: 'Forest Sage', animal: '🦉', name: 'Sage',
    message: 'That thing you’re avoiding has a first step that takes two minutes. Do that part.' },
  // 5 – Dusty Lavender
  { colorName: 'Dusty Lavender', animal: '🦋', name: 'Drift',
    message: 'You don’t need a better system. You need to use this one for more than three days.' },
  // 6 – Golden Honey
  { colorName: 'Golden Honey', animal: '🐝', name: 'Clover',
    message: 'The hard part isn’t the work. It’s the transition into it. Two-minute timer. Go.' },
  // 7 – Soft Crimson
  { colorName: 'Soft Crimson', animal: '🦩', name: 'Rosie',
    message: 'You’re waiting to feel like doing it. That feeling isn’t coming. Start anyway.' },
  // 8 – Dark Teal
  { colorName: 'Dark Teal', animal: '🐢', name: 'Steady',
    message: 'The boring middle of the project is where everyone quits. Stay in it ten more minutes.' },
  // 9 – Warm Ochre
  { colorName: 'Warm Ochre', animal: '🦁', name: 'Sol',
    message: 'Pick three things. Not twelve. Three. Do those, then decide if you want more.' },
  // 10 – Slate Blue
  { colorName: 'Slate Blue', animal: '🐧', name: 'Tux',
    message: 'You’re comparing your pace to someone with a completely different brain. Stop that.' },
  // 11 – Terracotta
  { colorName: 'Terracotta', animal: '🦎', name: 'Ember',
    message: 'Decision fatigue is real. Reduce the choices. Save your thinking for what actually matters.' },
  // 12 – Mauve
  { colorName: 'Mauve', animal: '🐈', name: 'Velvet',
    message: 'Done beats perfect. Ship it at 80% and iterate. Nobody notices the last 20% but you.' },
  // 13 – Olive
  { colorName: 'Olive', animal: '🐸', name: 'Ribbit',
    message: 'You’ve been thinking about it for days. Five minutes of doing will tell you more.' },
  // 14 – Soft Purple
  { colorName: 'Soft Purple', animal: '🦄', name: 'Rare',
    message: 'That task is actually seven small tasks in a trench coat. Write them out separately.' },
  // 15 – Dark Gold
  { colorName: 'Dark Gold', animal: '🐕', name: 'Loyal',
    message: 'Past-you left notes. Read them before you start over from scratch again.' },
  // 16 – Storm Blue
  { colorName: 'Storm Blue', animal: '🐬', name: 'Echo',
    message: 'Name the next action out loud. Not the project — the literal next physical step.' },
  // 17 – Deep Sage
  { colorName: 'Deep Sage', animal: '🦔', name: 'Thistle',
    message: 'You said yes to too many things. Pick the two that actually matter today.' },
  // 18 – Rust
  { colorName: 'Rust', animal: '🦀', name: 'Snap',
    message: 'Your list has thirty items. That’s not a plan, it’s a wish. Cut it to five.' },
  // 19 – Periwinkle
  { colorName: 'Periwinkle', animal: '🐰', name: 'Scout',
    message: 'You’re about to research for two hours instead of starting. Cap it at ten minutes.' },
  // 20 – Copper
  { colorName: 'Copper', animal: '🦅', name: 'Vista',
    message: 'That thing you’re dreading is probably a fifteen-minute task wearing two days of anxiety.' },
  // 21 – Moss
  { colorName: 'Moss', animal: '🐊', name: 'Still',
    message: 'Context switching is expensive. Finish the current thought before opening the next thing.' },
  // 22 – Plum
  { colorName: 'Plum', animal: '🦜', name: 'Chatter',
    message: 'You’re reorganizing instead of doing. The system works fine. Use it.' },
  // 23 – Tangerine
  { colorName: 'Tangerine', animal: '🐻', name: 'Maple',
    message: 'Future-you inherits whatever you decide right now. Leave them something useful.' },
  // 24 – Iris
  { colorName: 'Iris', animal: '🦚', name: 'Plume',
    message: 'Perfectionism is procrastination in a nicer outfit. Send the draft.' },
  // 25 – Pine
  { colorName: 'Pine', animal: '🐺', name: 'North',
    message: 'You know exactly what you should be doing right now. Go do that.' },
  // 26 – Rosewood
  { colorName: 'Rosewood', animal: '🦢', name: 'Grace',
    message: 'The transition between tasks is where you lose the hour. Decide what’s next before you finish this.' },
  // 27 – Bronze Gold
  { colorName: 'Bronze Gold', animal: '🐝', name: 'Nectar',
    message: 'Hyperfocus is an asset when aimed. Point it at something that matters before it picks for you.' },
  // 28 – Dusk Blue
  { colorName: 'Dusk Blue', animal: '🐋', name: 'Deep',
    message: 'You don’t need the full picture. You need the next step. Just that.' },
  // 29 – Fern
  { colorName: 'Fern', animal: '🦥', name: 'Lull',
    message: 'The deadline is closer than your brain thinks it is. Check the actual date.' },
  // 30 – Driftwood
  { colorName: 'Driftwood', animal: '🦦', name: 'Otter',
    message: 'Stop optimizing the workflow and do the work. The system is fine. You’re stalling.' },
  // 31 – Seafoam
  { colorName: 'Seafoam', animal: '🐠', name: 'Finley',
    message: 'That email you’re drafting in your head — just write it badly and fix it after.' },
  // 32 – Burnt Honey
  { colorName: 'Burnt Honey', animal: '🐨', name: 'Haze',
    message: 'If everything feels urgent, nothing is. Rank them. Do the top one. Ignore the rest until it’s done.' },
  // 33 – Thistle Bloom
  { colorName: 'Thistle Bloom', animal: '🦡', name: 'Burrow',
    message: 'The resistance you feel before starting almost always disappears ninety seconds in.' },
  // 34 – Juniper
  { colorName: 'Juniper', animal: '🐿️', name: 'Stash',
    message: 'Write the thought down now. You will not remember it later and you know that.' },
  // 35 – Sunset Clay
  { colorName: 'Sunset Clay', animal: '🦘', name: 'Leap',
    message: 'You’re not stuck. You’re overthinking the approach. Pick any approach and correct later.' },
  // 36 – Twilight
  { colorName: 'Twilight', animal: '🦇', name: 'Dusk',
    message: 'Time is passing whether or not you start. Might as well be ten minutes in by now.' },
  // 37 – Eucalyptus
  { colorName: 'Eucalyptus', animal: '🐼', name: 'Bao',
    message: 'You don’t need to finish today. You need to make it easier to continue tomorrow.' },
  // 38 – Cranberry
  { colorName: 'Cranberry', animal: '🦞', name: 'Pinch',
    message: 'The guilt about not starting takes longer than the actual starting. Break the loop.' },
  // 39 – Lichen
  { colorName: 'Lichen', animal: '🐌', name: 'Trace',
    message: 'One decision. Make it now. The rest can wait.' },
  // 40 – Arctic Slate
  { colorName: 'Arctic Slate', animal: '🐳', name: 'Swell',
    message: 'Set the timer. Not to pressure yourself — to prove how little time it actually takes.' },
  // 41 – Cayenne
  { colorName: 'Cayenne', animal: '🐉', name: 'Blaze',
    message: 'You have the energy right now. Use it on the hard thing, not the easy one.' },
  // 42 – Wisteria
  { colorName: 'Wisteria', animal: '🦧', name: 'Oakley',
    message: 'That idea you just had — capture it here, then go back to what you were doing.' },
  // 43 – Turmeric
  { colorName: 'Turmeric', animal: '🐓', name: 'Crow',
    message: 'The first version is supposed to be bad. That’s what revision is for. Write the bad one.' },
  // 44 – Dried Rose
  { colorName: 'Dried Rose', animal: '🐑', name: 'Woolly',
    message: 'You’re doing the easy tasks to feel productive. The important one is still sitting there.' },
  // 45 – Clover Field
  { colorName: 'Clover Field', animal: '🐄', name: 'Meadow',
    message: 'The system you abandoned last week worked fine. Go back to it instead of building a new one.' },
  // 46 – Harbor Blue
  { colorName: 'Harbor Blue', animal: '🦑', name: 'Ink',
    message: 'Close the other tabs. Not later. Now. You need the working memory back.' },
  // 47 – Paprika
  { colorName: 'Paprika', animal: '🦃', name: 'Strut',
    message: 'You’re overcomplicating this. What’s the simplest version that still works? Do that.' },
  // 48 – Dusk Violet
  { colorName: 'Dusk Violet', animal: '🦩', name: 'Flambe',
    message: 'That reply you’re agonizing over — they’ll read it in four seconds. Just send it.' },
  // 49 – Spruce
  { colorName: 'Spruce', animal: '🐗', name: 'Thorn',
    message: 'Boredom means your brain wants a harder problem, not an easier distraction. Find the challenge in it.' },
  // 50 – Caramel
  { colorName: 'Caramel', animal: '🐹', name: 'Pip',
    message: 'The impulse to buy it is louder than the reason to. Give it twenty minutes and listen again.' },
  // 51 – Steel Blue
  { colorName: 'Steel Blue', animal: '🦈', name: 'Keel',
    message: 'You are not competing with anyone’s timeline. Run your own race at your own pace.' },
  // 52 – Pomegranate
  { colorName: 'Pomegranate', animal: '🦌', name: 'Hart',
    message: 'The dread is not the task. Start the task and the dread loses its leverage.' },
  // 53 – Sage Moss
  { colorName: 'Sage Moss', animal: '🦫', name: 'Lodge',
    message: 'Working near another person changes the physics of getting started. Find someone to sit with.' },
  // 54 – Hyacinth
  { colorName: 'Hyacinth', animal: '🐕', name: 'Paws',
    message: 'You know the next step. You’ve known it all morning. Close this and take it.' },
  // 55 – Cinnamon
  { colorName: 'Cinnamon', animal: '🐘', name: 'Rumble',
    message: 'That conversation you’re replaying? The other person forgot it within the hour.' },
  // 56 – Tide Pool
  { colorName: 'Tide Pool', animal: '🐟', name: 'Current',
    message: 'Energy is a wave, not a constant. Use the peaks. Don’t fight the troughs.' },
  // 57 – Heather
  { colorName: 'Heather', animal: '🦙', name: 'Alma',
    message: 'Difficulty is not proportional to importance. Some small things cost more effort. That’s just math.' },
  // 58 – Saffron
  { colorName: 'Saffron', animal: '🐏', name: 'Ram',
    message: 'Motivation follows action. It almost never precedes it. Start, and it catches up.' },
  // 59 – Ivy
  { colorName: 'Ivy', animal: '🐍', name: 'Coil',
    message: 'If it’s in your head, it’s competing for attention. Put it on the page and free up the slot.' },
  // 60 – Cornflower
  { colorName: 'Cornflower', animal: '🐦', name: 'Wren',
    message: 'The task isn’t hard. Starting it is. Once you’re in, you already know what to do.' },
  // 61 – Adobe
  { colorName: 'Adobe', animal: '🦏', name: 'Slate',
    message: 'A break with a timer is a strategy. A break without one is a disappearance. Set the timer.' },
  // 62 – Lilac Haze
  { colorName: 'Lilac Haze', animal: '🐇', name: 'Wisp',
    message: 'Write the idea down. Not because you’ll build it today, but because you’ll forget it by tonight.' },
  // 63 – Basil
  { colorName: 'Basil', animal: '🐊', name: 'Marsh',
    message: 'You keep redesigning the system instead of using it. Pick one. Run it for a week.' },
  // 64 – Butterscotch
  { colorName: 'Butterscotch', animal: '🐕‍🦺', name: 'Buddy',
    message: 'Pick the one thing that would make tomorrow easier. Do that one. Ignore the rest for now.' },
  // 65 – Mulberry
  { colorName: 'Mulberry', animal: '🦉', name: 'Hoot',
    message: 'Revenge bedtime procrastination trades tomorrow’s clarity for tonight’s borrowed time. Is it worth it?' },
  // 66 – Deep Lagoon
  { colorName: 'Deep Lagoon', animal: '🐙', name: 'Squid',
    message: 'Complexity is your comfort zone. Today, try making one thing deliberately simple.' },
  // 67 – Olive Gold
  { colorName: 'Olive Gold', animal: '🐿️', name: 'Sprout',
    message: 'That thing you’re avoiding has a first step that takes two minutes. Do that part.' },
  // 68 – Midnight Iris
  { colorName: 'Midnight Iris', animal: '🦉', name: 'Nox',
    message: 'Overthinking is perfectionism in disguise. Good enough, shipped today, beats perfect next month.' },
  // 69 – Marmalade
  { colorName: 'Marmalade', animal: '🐈‍⬛', name: 'Jinx',
    message: 'The decision you’re agonizing over matters less than you think. Pick one. Adjust later.' },
  // 70 – Verdigris
  { colorName: 'Verdigris', animal: '🐸', name: 'Moss',
    message: 'Every context switch costs fifteen minutes you don’t see. Finish this before opening that.' },
  // 71 – Foxglove
  { colorName: 'Foxglove', animal: '🦊', name: 'Fable',
    message: 'Waiting for the deadline to create urgency is a strategy. It’s just an expensive one.' },
  // 72 – Moss Agate
  { colorName: 'Moss Agate', animal: '🐢', name: 'Basalt',
    message: 'Your estimate is wrong. Double it. Now you have a real timeline.' },
  // 73 – Petrol Blue
  { colorName: 'Petrol Blue', animal: '🐋', name: 'Drift',
    message: 'The shortcut you’re considering will take longer than the straightforward path. Trust the boring route.' },
  // 74 – Garnet
  { colorName: 'Garnet', animal: '🦅', name: 'Ridge',
    message: 'Feeling behind is a feeling, not a fact. Check the actual evidence.' },
  // 75 – Raw Umber
  { colorName: 'Raw Umber', animal: '🐂', name: 'Forge',
    message: 'Five minutes of doing teaches more than three days of planning. Open the thing.' },
  // 76 – Storm Violet
  { colorName: 'Storm Violet', animal: '🐆', name: 'Flash',
    message: 'Strong reactions pass faster than you expect. Wait ninety seconds before you respond.' },
  // 77 – Fiddlehead
  { colorName: 'Fiddlehead', animal: '🦎', name: 'Fern',
    message: 'Say the priority out loud. Not in your head — out loud. It becomes real when you hear it.' },
  // 78 – Toffee
  { colorName: 'Toffee', animal: '🐻‍❄️', name: 'Frost',
    message: 'Reorganizing is procrastination that feels productive. The thing you’re avoiding is still there.' },
  // 79 – Rain Cloud
  { colorName: 'Rain Cloud', animal: '🐬', name: 'Ripple',
    message: 'Flat days happen. Lower the bar. Do the minimum viable version and call it done.' },
  // 80 – Bramble
  { colorName: 'Bramble', animal: '🦔', name: 'Quill',
    message: 'The best reply to a late reply is the reply. Send it without the apology paragraph.' },
  // 81 – Dark Moss
  { colorName: 'Dark Moss', animal: '🐊', name: 'Bayou',
    message: 'Reducing decisions in one area frees capacity for decisions that actually matter.' },
  // 82 – Fjord Blue
  { colorName: 'Fjord Blue', animal: '🐧', name: 'Fjord',
    message: 'Efficiency isn’t cheating. The hard way doesn’t earn extra points. Take the shorter path.' },
  // 83 – Vermillion
  { colorName: 'Vermillion', animal: '🦜', name: 'Blitz',
    message: 'This mood is weather, not climate. Make decisions based on the forecast, not the current rain.' },
  // 84 – Forest Floor
  { colorName: 'Forest Floor', animal: '🦡', name: 'Spore',
    message: 'Open the file. Just open it. You don’t have to do anything yet. Just look at it.' },
  // 85 – Soft Amethyst
  { colorName: 'Soft Amethyst', animal: '🦋', name: 'Veil',
    message: 'You’re building for someone who needs exactly what you’re making. Keep going.' },
  // 86 – Amber Glow
  { colorName: 'Amber Glow', animal: '🐝', name: 'Buzz',
    message: 'You said yes too fast again. Pick the two that actually matter. Email the rest your regrets.' },
  // 87 – Celadon
  { colorName: 'Celadon', animal: '🐸', name: 'Reed',
    message: 'Boredom is information. It means you need a harder problem, not an easier one.' },
  // 88 – Wild Berry
  { colorName: 'Wild Berry', animal: '🐻', name: 'Bramble',
    message: 'That message can wait. Your focus cannot. Reply at a time you choose, not when they choose.' },
  // 89 – Artichoke
  { colorName: 'Artichoke', animal: '🦎', name: 'Inch',
    message: 'Ten percent of the work done beats a hundred percent of the work planned. Ship the draft.' },
  // 90 – Denim
  { colorName: 'Denim', animal: '🐺', name: 'Pack',
    message: 'Delegation is not weakness. It’s knowing that your time has a higher use somewhere else.' },
  // 91 – Brick Dust
  { colorName: 'Brick Dust', animal: '🦀', name: 'Scuttle',
    message: 'Count the actual days left. Out loud. Now plan backward from the real number.' },
  // 92 – Lavender Ash
  { colorName: 'Lavender Ash', animal: '🕊️', name: 'Calm',
    message: 'Anxiety is your mind rehearsing a future that hasn’t happened. Come back to what’s in front of you.' },
  // 93 – Jade Mist
  { colorName: 'Jade Mist', animal: '🐲', name: 'Glimmer',
    message: 'Transitions cost more than you budget for. Leave five minutes between things. Every time.' },
  // 94 – Pecan
  { colorName: 'Pecan', animal: '🐿️', name: 'Cache',
    message: 'Close the seventeen tabs. Not later. Now. Keep the one you’re actually working in.' },
  // 95 – Raspberry
  { colorName: 'Raspberry', animal: '🦢', name: 'Aria',
    message: 'If you can’t remember it, you didn’t write it down. Write everything down. Trust the page, not your head.' },
  // 96 – Dark Jade
  { colorName: 'Dark Jade', animal: '🐍', name: 'Jade',
    message: 'Research is a trapdoor. Set a timer. When it rings, you start with what you have.' },
  // 97 – Toasted Wheat
  { colorName: 'Toasted Wheat', animal: '🐻', name: 'Grit',
    message: 'The middle of the project is the hardest part. Not the start, not the end. You’re in the middle. Push.' },
  // 98 – Heron Blue
  { colorName: 'Heron Blue', animal: '🦤', name: 'Persist',
    message: 'Do one thing right now that tomorrow-you will be grateful for. You know which one it is.' },
  // 99 – Dragon Pepper (bonus — catch-all)
  { colorName: 'Dragon Pepper', animal: '🐉', name: 'Spark',
    message: 'The best system is the one you’ll use tomorrow. Not the perfect one you’ll abandon.' },
];

/** Get the companion for today's color */
export function getDailyCompanion(color: DailyColor): DailyCompanion {
  return COMPANIONS[color.index] ?? COMPANIONS[0];
}
