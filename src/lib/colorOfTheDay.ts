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

/** Apply color everywhere — primary, accent, ambient glow, tinted surfaces.
 *  The daily color should be IMPOSSIBLE TO MISS. Every surface should whisper the color.
 *  ADHD brains need novelty — this is the novelty engine. */
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

  // Ambient tints — BOLD color wash, not subtle. Every panel, every surface.
  root.style.setProperty('--color-tint-soft', `hsla(${h}, ${s}%, ${tintL}%, ${isDark ? 0.12 : 0.10})`);
  root.style.setProperty('--color-tint-medium', `hsla(${h}, ${s}%, ${tintL}%, ${isDark ? 0.20 : 0.18})`);
  root.style.setProperty('--color-tint-strong', `hsla(${h}, ${s}%, ${tintL}%, ${isDark ? 0.30 : 0.28})`);
  root.style.setProperty('--color-glow', `hsla(${h}, ${s}%, ${l}%, 0.35)`);

  // Header-level bold wash — for the DailyLeaf header strip
  root.style.setProperty('--color-tint-header', `hsla(${h}, ${s}%, ${tintL}%, ${isDark ? 0.18 : 0.15})`);

  // Sidebar panel tint
  root.style.setProperty('--color-tint-panel', `hsla(${h}, ${s}%, ${tintL}%, ${isDark ? 0.08 : 0.06})`);

  // Border tint — colored borders for sections and cards
  root.style.setProperty('--color-border-accent', `hsla(${h}, ${s}%, ${l}%, ${isDark ? 0.30 : 0.25})`);

  // Focus ring
  root.style.setProperty('--color-focus-ring', `hsla(${h}, ${s}%, ${l}%, 0.4)`);

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
  return COMPANIONS[color.index]?.colorName ?? 'Today\'s Color';
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
    message: 'You opened this instead of scrolling. That already says something about you today.' },
  // 1 – Dusty Rose
  { colorName: 'Dusty Rose', animal: '🐙', name: 'Octavia',
    message: 'You don\u2019t have to hold everything at once. Put some things down and see what stays.' },
  // 2 – Burnt Sienna
  { colorName: 'Burnt Sienna', animal: '🦝', name: 'Bandit',
    message: 'The messy middle is where all the real work happens. You\u2019re right on schedule.' },
  // 3 – Ocean Teal
  { colorName: 'Ocean Teal', animal: '🐋', name: 'Atlas',
    message: 'There\u2019s a version of today where you do less but feel more. That\u2019s the one worth finding.' },
  // 4 – Forest Sage
  { colorName: 'Forest Sage', animal: '🦉', name: 'Sage',
    message: 'Knowing what to ignore is the most underrated skill you have. Use it generously today.' },
  // 5 – Dusty Lavender
  { colorName: 'Dusty Lavender', animal: '🦋', name: 'Drift',
    message: 'Your mind moves fast because it\u2019s making connections. That\u2019s not distraction — it\u2019s how you think.' },
  // 6 – Golden Honey
  { colorName: 'Golden Honey', animal: '🐝', name: 'Clover',
    message: 'Not everything that feels urgent is important. Sit with that for a second before you start.' },
  // 7 – Soft Crimson
  { colorName: 'Soft Crimson', animal: '🦩', name: 'Rosie',
    message: 'You don\u2019t need to explain your process to anyone. If it works, it works.' },
  // 8 – Dark Teal
  { colorName: 'Dark Teal', animal: '🐢', name: 'Steady',
    message: 'Slow isn\u2019t the opposite of productive. Sometimes it\u2019s the prerequisite.' },
  // 9 – Warm Ochre
  { colorName: 'Warm Ochre', animal: '🦁', name: 'Sol',
    message: 'You don\u2019t need to feel ready. You just need five minutes and something to start with.' },
  // 10 – Slate Blue
  { colorName: 'Slate Blue', animal: '🐧', name: 'Tux',
    message: 'The gap between who you are and who you\u2019re becoming is smaller than it feels right now.' },
  // 11 – Terracotta
  { colorName: 'Terracotta', animal: '🦎', name: 'Ember',
    message: 'Yesterday ended. You\u2019re here now and that\u2019s the only part that matters.' },
  // 12 – Mauve
  { colorName: 'Mauve', animal: '🐈', name: 'Velvet',
    message: 'Rest isn\u2019t a reward you earn. It\u2019s a tool you use. Use it without guilt.' },
  // 13 – Olive
  { colorName: 'Olive', animal: '🐸', name: 'Ribbit',
    message: 'Pick the one thing you\u2019ve been avoiding. Just look at it. That\u2019s enough for now.' },
  // 14 – Soft Purple
  { colorName: 'Soft Purple', animal: '🦄', name: 'Rare',
    message: 'Your brain works differently, and differently is how every interesting thing was ever made.' },
  // 15 – Dark Gold
  { colorName: 'Dark Gold', animal: '🐕', name: 'Loyal',
    message: 'Past-you made plans for today. Honor that — even just one small thing from the list.' },
  // 16 – Storm Blue
  { colorName: 'Storm Blue', animal: '🐬', name: 'Echo',
    message: 'When the noise gets loud, go toward the thing that\u2019s quiet and clear. That\u2019s usually the right one.' },
  // 17 – Deep Sage
  { colorName: 'Deep Sage', animal: '🦔', name: 'Thistle',
    message: 'It\u2019s okay to protect your time like it\u2019s something valuable. Because it is.' },
  // 18 – Rust
  { colorName: 'Rust', animal: '🦀', name: 'Snap',
    message: 'Your list is probably too long. Remove one thing right now and watch how much lighter it feels.' },
  // 19 – Periwinkle
  { colorName: 'Periwinkle', animal: '🐰', name: 'Scout',
    message: 'Switching between things isn\u2019t failing to focus. Sometimes that\u2019s just your rhythm today.' },
  // 20 – Copper
  { colorName: 'Copper', animal: '🦅', name: 'Vista',
    message: 'Most of what\u2019s stressing you won\u2019t matter in a week. Do the things that will.' },
  // 21 – Moss
  { colorName: 'Moss', animal: '🐊', name: 'Still',
    message: 'You don\u2019t have to move fast. You just have to move with intention when you do.' },
  // 22 – Plum
  { colorName: 'Plum', animal: '🦜', name: 'Chatter',
    message: 'Thinking out loud isn\u2019t a quirk — it\u2019s you processing in real time. Keep talking.' },
  // 23 – Tangerine
  { colorName: 'Tangerine', animal: '🐻', name: 'Maple',
    message: 'One more push today. Not because you have to, but because future-you will be glad you did.' },
  // 24 – Iris
  { colorName: 'Iris', animal: '🦚', name: 'Plume',
    message: 'Done is more interesting than perfect. Ship the thing, then make it better.' },
  // 25 – Pine
  { colorName: 'Pine', animal: '🐺', name: 'North',
    message: 'Whether you need people or solitude today — trust that instinct. You know what you need.' },
  // 26 – Rosewood
  { colorName: 'Rosewood', animal: '🦢', name: 'Grace',
    message: 'You don\u2019t need to look put-together to be making progress. Just keep going.' },
  // 27 – Bronze Gold
  { colorName: 'Bronze Gold', animal: '🐝', name: 'Nectar',
    message: 'Find the task that\u2019s hard enough to be interesting but not so hard you freeze. Start there.' },
  // 28 – Dusk Blue
  { colorName: 'Dusk Blue', animal: '🐋', name: 'Deep',
    message: 'You don\u2019t need to see the whole path. Just enough light for the next step.' },
  // 29 – Fern
  { colorName: 'Fern', animal: '🦥', name: 'Lull',
    message: 'Moving through your list slowly is still moving through your list. Pace is not failure.' },
  // 30 – Driftwood
  { colorName: 'Driftwood', animal: '🦦', name: 'Otter',
    message: 'You bought the planner, the app, the course. The system isn\u2019t broken \u2014 you just need to start smaller.' },
  // 31 – Seafoam
  { colorName: 'Seafoam', animal: '🐠', name: 'Finley',
    message: 'That thing you\u2019ve been putting off? It\u2019ll take less time than you\u2019ve spent dreading it.' },
  // 32 – Burnt Honey
  { colorName: 'Burnt Honey', animal: '🐨', name: 'Haze',
    message: 'You don\u2019t need a productivity hack. You need to eat something and drink some water first.' },
  // 33 – Thistle Bloom
  { colorName: 'Thistle Bloom', animal: '🦡', name: 'Burrow',
    message: 'The fact that you care this much about getting it right is exhausting, but it\u2019s also your superpower.' },
  // 34 – Juniper
  { colorName: 'Juniper', animal: '🐿️', name: 'Stash',
    message: 'Seventeen open tabs isn\u2019t chaos. It\u2019s your brain mid-thought. But maybe close five.' },
  // 35 – Sunset Clay
  { colorName: 'Sunset Clay', animal: '🦘', name: 'Leap',
    message: 'Stop rehearsing the conversation. Say the thing. It\u2019s never as bad as the version in your head.' },
  // 36 – Twilight
  { colorName: 'Twilight', animal: '🦇', name: 'Dusk',
    message: 'Your best ideas come at 2am because your brain doesn\u2019t follow a schedule. Write them down anyway.' },
  // 37 – Eucalyptus
  { colorName: 'Eucalyptus', animal: '🐼', name: 'Bao',
    message: 'You\u2019re allowed to cancel plans to protect your energy. That\u2019s not flaking \u2014 it\u2019s maintenance.' },
  // 38 – Cranberry
  { colorName: 'Cranberry', animal: '🦞', name: 'Pinch',
    message: 'The shame spiral about not doing the thing takes longer than just doing the thing. Break the loop.' },
  // 39 – Lichen
  { colorName: 'Lichen', animal: '🐌', name: 'Trace',
    message: 'You don\u2019t have to decide everything right now. Pick one. The rest can wait until tomorrow.' },
  // 40 – Arctic Slate
  { colorName: 'Arctic Slate', animal: '🐳', name: 'Swell',
    message: 'Time blindness isn\u2019t laziness. Set the alarm. Set three alarms. No shame in the backup plan.' },
  // 41 – Cayenne
  { colorName: 'Cayenne', animal: '🐉', name: 'Blaze',
    message: 'That hyperfocus energy is rocket fuel. Aim it somewhere useful before it picks for you.' },
  // 42 – Wisteria
  { colorName: 'Wisteria', animal: '🦧', name: 'Oakley',
    message: 'You remembered something important at the worst possible moment. Write it here so you can let it go.' },
  // 43 – Turmeric
  { colorName: 'Turmeric', animal: '🐓', name: 'Crow',
    message: 'Morning routines don\u2019t have to look like anyone else\u2019s. If yours starts at noon, it still counts.' },
  // 44 – Dried Rose
  { colorName: 'Dried Rose', animal: '🐑', name: 'Woolly',
    message: 'You don\u2019t need to mask today. The people who matter already like the unfiltered version.' },
  // 45 – Clover Field
  { colorName: 'Clover Field', animal: '🐄', name: 'Meadow',
    message: 'You\u2019ve restarted a hundred times. That\u2019s not failure \u2014 that\u2019s a hundred times you refused to quit.' },
  // 46 – Harbor Blue
  { colorName: 'Harbor Blue', animal: '🦑', name: 'Ink',
    message: 'The transition between tasks is where you lose an hour. Name the next thing before you finish this one.' },
  // 47 – Paprika
  { colorName: 'Paprika', animal: '🦃', name: 'Strut',
    message: 'You did the hard thing yesterday and nobody clapped. So here: that was impressive. Keep going.' },
  // 48 – Dusk Violet
  { colorName: 'Dusk Violet', animal: '🦩', name: 'Flambe',
    message: 'Rejection sensitivity is lying to you again. They\u2019re not mad. Check if you need to, then let it go.' },
  // 49 – Spruce
  { colorName: 'Spruce', animal: '🐗', name: 'Thorn',
    message: 'Your brain wants novelty? Fine \u2014 do the boring task in a new place. Different couch. Different room.' },
  // 50 – Caramel
  { colorName: 'Caramel', animal: '🐹', name: 'Pip',
    message: 'Before you add another thing to your cart, close the app and wait twenty minutes. Still want it? Okay then.' },
  // 51 – Steel Blue
  { colorName: 'Steel Blue', animal: '🦈', name: 'Keel',
    message: 'You\u2019re not behind. There\u2019s no universal timeline. Comparison is a trap built for neurotypical brains.' },
  // 52 – Pomegranate
  { colorName: 'Pomegranate', animal: '🦌', name: 'Hart',
    message: 'That wall of awful in front of the task? It\u2019s not the task. Separate the feelings from the doing.' },
  // 53 – Sage Moss
  { colorName: 'Sage Moss', animal: '🦫', name: 'Lodge',
    message: 'Body doubling works because brains are weird. Sit near someone. Call someone. Just don\u2019t do it alone.' },
  // 54 – Hyacinth
  { colorName: 'Hyacinth', animal: '🐾', name: 'Paws',
    message: 'If you\u2019re reading this instead of starting, that\u2019s fine. But after this sentence \u2014 go.' },
  // 55 – Cinnamon
  { colorName: 'Cinnamon', animal: '🐘', name: 'Rumble',
    message: 'You remember every awkward thing you\u2019ve ever said, but nobody else does. Let that free up some space.' },
  // 56 – Tide Pool
  { colorName: 'Tide Pool', animal: '🐟', name: 'Current',
    message: 'Your energy comes in waves. Ride the high ones hard and forgive the low ones completely.' },
  // 57 – Heather
  { colorName: 'Heather', animal: '🦙', name: 'Alma',
    message: 'You don\u2019t owe anyone an explanation for why simple things feel hard. They just do sometimes.' },
  // 58 – Saffron
  { colorName: 'Saffron', animal: '🐏', name: 'Ram',
    message: 'Waiting for motivation is like waiting for a bus that doesn\u2019t run this route. Just start walking.' },
  // 59 – Ivy
  { colorName: 'Ivy', animal: '🐍', name: 'Coil',
    message: 'Your working memory dropped something again. That\u2019s what this app is for. Write it down now.' },
  // 60 – Cornflower
  { colorName: 'Cornflower', animal: '🐦', name: 'Wren',
    message: 'Small tasks are still tasks. Brushed your teeth? Fed yourself? That\u2019s infrastructure. It matters.' },
  // 61 – Adobe
  { colorName: 'Adobe', animal: '🦏', name: 'Slate',
    message: 'You don\u2019t need to earn your breaks. Take one now, set a timer, and come back without guilt.' },
  // 62 – Lilac Haze
  { colorName: 'Lilac Haze', animal: '🐇', name: 'Wisp',
    message: 'That creative idea isn\u2019t silly. Your brain threw it up for a reason. Catch it before it disappears.' },
  // 63 – Basil
  { colorName: 'Basil', animal: '🐊', name: 'Marsh',
    message: 'The perfect system doesn\u2019t exist. The one you\u2019ll actually use tomorrow is the best one.' },
  // 64 – Butterscotch
  { colorName: 'Butterscotch', animal: '🐕\u200d🦺', name: 'Buddy',
    message: 'You\u2019re carrying invisible weight today. Acknowledge it. Then pick just one thing to move forward.' },
  // 65 – Mulberry
  { colorName: 'Mulberry', animal: '🦉', name: 'Hoot',
    message: 'Staying up late to get \u201Cme time\u201D because the day felt stolen? You\u2019re not alone. But sleep is on your side.' },
  // 66 – Deep Lagoon
  { colorName: 'Deep Lagoon', animal: '🐙', name: 'Squid',
    message: 'You can hold complexity. You do it every day. But today, try making one thing simple on purpose.' },
  // 67 – Olive Gold
  { colorName: 'Olive Gold', animal: '🐛', name: 'Sprout',
    message: 'The task isn\u2019t one task. It\u2019s twelve micro-tasks wearing a trench coat. Break it apart.' },
  // 68 – Midnight Iris
  { colorName: 'Midnight Iris', animal: '🦉', name: 'Nox',
    message: 'You overthink because you care about doing it well. That\u2019s not a flaw in the system \u2014 it\u2019s the system.' },
  // 69 – Marmalade
  { colorName: 'Marmalade', animal: '🐈\u200d⬛', name: 'Jinx',
    message: 'Impulse bought something again? Don\u2019t spiral. Return it or own it, then move on.' },
  // 70 – Verdigris
  { colorName: 'Verdigris', animal: '🐸', name: 'Moss',
    message: 'Context switching costs more than you think. Finish the thought. Then switch. Not the other way around.' },
  // 71 – Foxglove
  { colorName: 'Foxglove', animal: '🦊', name: 'Fable',
    message: 'You\u2019re not procrastinating \u2014 you\u2019re waiting for enough pressure to make it feel possible. That\u2019s ADHD.' },
  // 72 – Moss Agate
  { colorName: 'Moss Agate', animal: '🐢', name: 'Basalt',
    message: 'Your phone is not your enemy, but it\u2019s definitely not your friend right now. Put it face down.' },
  // 73 – Petrol Blue
  { colorName: 'Petrol Blue', animal: '🐋', name: 'Drift',
    message: 'Estimate how long it\u2019ll take. Now triple it. That\u2019s the real number and it\u2019s fine.' },
  // 74 – Garnet
  { colorName: 'Garnet', animal: '🦅', name: 'Ridge',
    message: 'That person\u2019s success doesn\u2019t subtract from yours. Different brain, different path, different timeline.' },
  // 75 – Raw Umber
  { colorName: 'Raw Umber', animal: '🐂', name: 'Forge',
    message: 'You\u2019ve been thinking about it for three days. Five minutes of doing will teach you more than three more days of thinking.' },
  // 76 – Storm Violet
  { colorName: 'Storm Violet', animal: '🐆', name: 'Flash',
    message: 'Your emotions hit harder and faster than most people\u2019s. That\u2019s intensity, not instability.' },
  // 77 – Fiddlehead
  { colorName: 'Fiddlehead', animal: '🦎', name: 'Fern',
    message: 'It\u2019s not that you can\u2019t focus. It\u2019s that you can\u2019t choose what to focus on. Name the priority out loud.' },
  // 78 – Toffee
  { colorName: 'Toffee', animal: '🐻\u200d❄️', name: 'Frost',
    message: 'You\u2019re going to want to reorganize everything instead of doing the thing. Don\u2019t. Do the thing.' },
  // 79 – Rain Cloud
  { colorName: 'Rain Cloud', animal: '🐬', name: 'Ripple',
    message: 'Low dopamine days aren\u2019t character failures. Your brain chemistry is just running on fumes. Be gentle.' },
  // 80 – Bramble
  { colorName: 'Bramble', animal: '🦔', name: 'Quill',
    message: 'You texted back late. It\u2019s okay. The people who get you already understand.' },
  // 81 – Dark Moss
  { colorName: 'Dark Moss', animal: '🐊', name: 'Bayou',
    message: 'Eating the same meal every day because choosing is too much? That\u2019s a valid strategy, not a failure.' },
  // 82 – Fjord Blue
  { colorName: 'Fjord Blue', animal: '🐧', name: 'Fjord',
    message: 'You don\u2019t have to do it the hard way to prove it counts. Take the shortcut. It still counts.' },
  // 83 – Vermillion
  { colorName: 'Vermillion', animal: '🦜', name: 'Blitz',
    message: 'Today\u2019s mood is not a life sentence. Whatever you\u2019re feeling intensely right now will shift. It always does.' },
  // 84 – Forest Floor
  { colorName: 'Forest Floor', animal: '🍄', name: 'Spore',
    message: 'You don\u2019t need to understand why it\u2019s hard to start. You just need to open the file. Just the file.' },
  // 85 – Soft Amethyst
  { colorName: 'Soft Amethyst', animal: '🦋', name: 'Veil',
    message: 'Being \u201Ctoo much\u201D for some people means you\u2019re exactly right for others. Stop shrinking.' },
  // 86 – Amber Glow
  { colorName: 'Amber Glow', animal: '🐝', name: 'Buzz',
    message: 'You said yes to too many things again. Pick the two that matter most and be honest about the rest.' },
  // 87 – Celadon
  { colorName: 'Celadon', animal: '🐸', name: 'Reed',
    message: 'Boredom feels physically painful to your brain. That\u2019s real. Find the smallest interesting angle in.' },
  // 88 – Wild Berry
  { colorName: 'Wild Berry', animal: '🐻', name: 'Bramble',
    message: 'You don\u2019t have to reply to every message right now. People can wait. Your focus can\u2019t.' },
  // 89 – Artichoke
  { colorName: 'Artichoke', animal: '🐛', name: 'Inch',
    message: 'The all-or-nothing mindset is an ADHD trap. Doing 10% of the task beats doing 0% every time.' },
  // 90 – Denim
  { colorName: 'Denim', animal: '🐺', name: 'Pack',
    message: 'Ask for help today. Not because you\u2019re weak, but because solo mode has a time limit and yours is up.' },
  // 91 – Brick Dust
  { colorName: 'Brick Dust', animal: '🦀', name: 'Scuttle',
    message: 'That deadline isn\u2019t as far away as your brain is telling you. Check the calendar. Then act.' },
  // 92 – Lavender Ash
  { colorName: 'Lavender Ash', animal: '🕊️', name: 'Calm',
    message: 'You\u2019ve been holding your breath. Literally. Exhale. Shoulders down. Now, what\u2019s one thing?' },
  // 93 – Jade Mist
  { colorName: 'Jade Mist', animal: '🐲', name: 'Glimmer',
    message: 'Transitions are the hardest part of your day and nobody talks about it. Give yourself five minutes between things.' },
  // 94 – Pecan
  { colorName: 'Pecan', animal: '🐿️', name: 'Cache',
    message: 'You\u2019re not lazy. You\u2019re running a demanding operating system on limited RAM. Close some background processes.' },
  // 95 – Raspberry
  { colorName: 'Raspberry', animal: '🦢', name: 'Aria',
    message: 'Forgetting doesn\u2019t mean you don\u2019t care. Your brain just has a different filing system. Work with it.' },
  // 96 – Dark Jade
  { colorName: 'Dark Jade', animal: '🐍', name: 'Jade',
    message: 'You\u2019re about to research for two hours instead of starting. Set a ten-minute cap. Then begin.' },
  // 97 – Toasted Wheat
  { colorName: 'Toasted Wheat', animal: '🐾', name: 'Grit',
    message: 'The boring middle of a project is where ADHD brains bail. You\u2019re in the boring middle. Keep going.' },
  // 98 – Heron Blue
  { colorName: 'Heron Blue', animal: '🦤', name: 'Persist',
    message: 'Tomorrow-you is going to inherit whatever today-you decides. Leave them something kind.' },
  // 99 – Dragon Pepper (bonus \u2014 catch-all)
  { colorName: 'Dragon Pepper', animal: '🐉', name: 'Spark',
    message: 'You contain more ideas in a single morning than most people have in a week. Channel one. Just one.' },
];

/** Get the companion for today's color */
export function getDailyCompanion(color: DailyColor): DailyCompanion {
  return COMPANIONS[color.index] ?? COMPANIONS[0];
}
