/**
 * Color of the Day — deterministic daily accent color for dopamine/novelty.
 * Hashes the date string to pick from a curated palette of ~30 warm-friendly hues.
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
];

/** Get the companion for today's color */
export function getDailyCompanion(color: DailyColor): DailyCompanion {
  return COMPANIONS[color.index] ?? COMPANIONS[0];
}
