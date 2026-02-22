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
 *  The daily color should be impossible to miss. */
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

  // Ambient tints — subtle color wash across the whole page
  root.style.setProperty('--color-tint-soft', `hsla(${h}, ${s}%, ${l}%, ${isDark ? 0.06 : 0.04})`);
  root.style.setProperty('--color-tint-medium', `hsla(${h}, ${s}%, ${l}%, ${isDark ? 0.12 : 0.08})`);
  root.style.setProperty('--color-tint-strong', `hsla(${h}, ${s}%, ${l}%, ${isDark ? 0.2 : 0.15})`);
  root.style.setProperty('--color-glow', `hsla(${h}, ${s}%, ${l}%, 0.25)`);

  // Gradient string for header strips
  root.style.setProperty('--color-gradient',
    `linear-gradient(135deg, hsl(${h}, ${s}%, ${l}%), hsl(${(h + 30) % 360}, ${Math.max(s - 10, 30)}%, ${l}%))`
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
  { colorName: 'Warm Amber', animal: '🦊', name: 'Foxie',
    message: 'You showed up. That\'s literally the hardest part and you already did it.' },
  // 1 – Dusty Rose
  { colorName: 'Dusty Rose', animal: '🐙', name: 'Inky',
    message: 'Multitasking is a myth. Do one tentacle at a time.' },
  // 2 – Burnt Sienna
  { colorName: 'Burnt Sienna', animal: '🦝', name: 'Bandit',
    message: 'Stole a productive hour from chaos? That counts as winning.' },
  // 3 – Ocean Teal
  { colorName: 'Ocean Teal', animal: '🐋', name: 'Splash',
    message: 'Deep breaths. Even whales come up for air between dives.' },
  // 4 – Forest Sage
  { colorName: 'Forest Sage', animal: '🦉', name: 'Hoot',
    message: 'Wisdom is knowing when to close the browser tabs.' },
  // 5 – Dusty Lavender
  { colorName: 'Dusty Lavender', animal: '🦋', name: 'Flutter',
    message: 'Your brain bounces between ideas because it sees connections others miss.' },
  // 6 – Golden Honey
  { colorName: 'Golden Honey', animal: '🐝', name: 'Buzz',
    message: 'Busy doesn\'t mean productive. Are you pollinating or just flying in circles?' },
  // 7 – Soft Crimson
  { colorName: 'Soft Crimson', animal: '🦩', name: 'Pinky',
    message: 'Standing on one leg looks weird but works. Your methods don\'t have to make sense to others.' },
  // 8 – Dark Teal
  { colorName: 'Dark Teal', animal: '🐢', name: 'Shell',
    message: 'Going slow isn\'t falling behind. The turtle literally won the race.' },
  // 9 – Warm Ochre
  { colorName: 'Warm Ochre', animal: '🦁', name: 'Mane',
    message: 'You don\'t need motivation. You need a 5-minute start. Roar at it.' },
  // 10 – Slate Blue
  { colorName: 'Slate Blue', animal: '🐧', name: 'Waddle',
    message: 'Penguins look ridiculous walking but they\'re incredible swimmers. Play to your element.' },
  // 11 – Terracotta
  { colorName: 'Terracotta', animal: '🦎', name: 'Mosaic',
    message: 'Dropped your tail yesterday? Cool, it grows back. Start fresh.' },
  // 12 – Mauve
  { colorName: 'Mauve', animal: '🐈', name: 'Naps',
    message: 'Rest between tasks isn\'t laziness. It\'s being strategically cat-like.' },
  // 13 – Olive
  { colorName: 'Olive', animal: '🐸', name: 'Leap',
    message: 'Eat the frog first. Or at least look at the frog. Acknowledging the frog counts.' },
  // 14 – Soft Purple
  { colorName: 'Soft Purple', animal: '🦄', name: 'Spark',
    message: 'Your brain isn\'t broken, it just runs on a different operating system.' },
  // 15 – Dark Gold
  { colorName: 'Dark Gold', animal: '🐕', name: 'Goldie',
    message: 'Be loyal to your own plans today. Past-you made them for a reason.' },
  // 16 – Storm Blue
  { colorName: 'Storm Blue', animal: '🐬', name: 'Echo',
    message: 'When things get turbulent, ride the wave instead of fighting the current.' },
  // 17 – Deep Sage
  { colorName: 'Deep Sage', animal: '🦔', name: 'Bristle',
    message: 'Small and spiky is a valid life strategy. Protect your time.' },
  // 18 – Rust
  { colorName: 'Rust', animal: '🦀', name: 'Snip',
    message: 'Cut one thing from today\'s list. Seriously. You overpacked it again.' },
  // 19 – Periwinkle
  { colorName: 'Periwinkle', animal: '🐰', name: 'Hop',
    message: 'Jumping between tasks isn\'t always bad — sometimes that\'s just how the work gets done.' },
  // 20 – Copper
  { colorName: 'Copper', animal: '🦅', name: 'Talon',
    message: 'Zoom out. Half the tasks stressing you out won\'t matter in a week.' },
  // 21 – Moss
  { colorName: 'Moss', animal: '🐊', name: 'Chomp',
    message: 'Patient. Still. Then decisive. That\'s how crocs get things done.' },
  // 22 – Plum
  { colorName: 'Plum', animal: '🦜', name: 'Prism',
    message: 'Talking to yourself while working isn\'t weird, it\'s verbal processing. Keep going.' },
  // 23 – Tangerine
  { colorName: 'Tangerine', animal: '🐻', name: 'Honey',
    message: 'You can hibernate when the season\'s over. Right now, one more task.' },
  // 24 – Iris
  { colorName: 'Iris', animal: '🦚', name: 'Plume',
    message: 'Your work doesn\'t have to be perfect to be impressive. Show what you\'ve got.' },
  // 25 – Pine
  { colorName: 'Pine', animal: '🐺', name: 'Howl',
    message: 'Lone wolf or pack player — both work. Just don\'t stand still.' },
  // 26 – Rosewood
  { colorName: 'Rosewood', animal: '🦢', name: 'Glide',
    message: 'Looking graceful is optional. Getting across the lake is the point.' },
  // 27 – Bronze Gold
  { colorName: 'Bronze Gold', animal: '🐝', name: 'Nectar',
    message: 'Find the sweet spot today: challenging enough to focus, not enough to freeze.' },
  // 28 – Dusk Blue
  { colorName: 'Dusk Blue', animal: '🐋', name: 'Deep',
    message: 'You don\'t need to see the whole ocean floor. Just the next few feet.' },
  // 29 – Fern
  { colorName: 'Fern', animal: '🦥', name: 'Hang',
    message: 'Moving slowly through your list is still moving through your list.' },
];

/** Get the companion for today's color */
export function getDailyCompanion(color: DailyColor): DailyCompanion {
  return COMPANIONS[color.index] ?? COMPANIONS[0];
}
