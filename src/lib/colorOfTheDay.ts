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
    message: 'I hid your phone. Kidding. But imagine how much you\'d get done.' },
  // 1 – Dusty Rose
  { colorName: 'Dusty Rose', animal: '🐙', name: 'Octavia',
    message: 'I have eight arms and even I can only do one thing at a time.' },
  // 2 – Burnt Sienna
  { colorName: 'Burnt Sienna', animal: '🦝', name: 'Bandit',
    message: 'Stole your excuses. You can have them back at 5pm.' },
  // 3 – Ocean Teal
  { colorName: 'Ocean Teal', animal: '🐋', name: 'Atlas',
    message: 'I weigh 80 tons and I still showed up today.' },
  // 4 – Forest Sage
  { colorName: 'Forest Sage', animal: '🦉', name: 'Sage',
    message: 'Fun fact: the first step is always the ugliest. That\'s normal.' },
  // 5 – Dusty Lavender
  { colorName: 'Dusty Lavender', animal: '🦋', name: 'Drift',
    message: 'I was a caterpillar last week. Things change fast. Start something.' },
  // 6 – Golden Honey
  { colorName: 'Golden Honey', animal: '🐝', name: 'Clover',
    message: 'I visited 2,000 flowers today and none of them were perfect. Still made honey.' },
  // 7 – Soft Crimson
  { colorName: 'Soft Crimson', animal: '🦩', name: 'Rosie',
    message: 'I stand on one leg all day. You can sit and do one task. We believe in each other.' },
  // 8 – Dark Teal
  { colorName: 'Dark Teal', animal: '🐢', name: 'Steady',
    message: 'I\'ve been walking since the Jurassic period. I\'ll get there. So will you.' },
  // 9 – Warm Ochre
  { colorName: 'Warm Ochre', animal: '🦁', name: 'Sol',
    message: 'Lions sleep 20 hours a day. The other 4 are terrifying. Be terrifyingly focused.' },
  // 10 – Slate Blue
  { colorName: 'Slate Blue', animal: '🐧', name: 'Tux',
    message: 'I wore a tuxedo to this. The least you can do is open your task list.' },
  // 11 – Terracotta
  { colorName: 'Terracotta', animal: '🦎', name: 'Ember',
    message: 'If my tail falls off, I grow a new one. Your failed plan is not that serious.' },
  // 12 – Mauve
  { colorName: 'Mauve', animal: '🐈', name: 'Velvet',
    message: 'I knocked your perfectionism off the counter. You\'re welcome.' },
  // 13 – Olive
  { colorName: 'Olive', animal: '🐸', name: 'Ribbit',
    message: 'Today\'s vibe: chaotic good. Let\'s see what happens.' },
  // 14 – Soft Purple
  { colorName: 'Soft Purple', animal: '🦄', name: 'Rare',
    message: 'I\'m literally mythical and even I think your to-do list is too long. Pick three.' },
  // 15 – Dark Gold
  { colorName: 'Dark Gold', animal: '🐕', name: 'Loyal',
    message: 'You came back! That\'s 90% of the battle. The other 10% is typing something.' },
  // 16 – Storm Blue
  { colorName: 'Storm Blue', animal: '🐬', name: 'Echo',
    message: 'Echolocation update: your next task is directly ahead. Swim toward it.' },
  // 17 – Deep Sage
  { colorName: 'Deep Sage', animal: '🦔', name: 'Thistle',
    message: 'I curled into a ball once. Then I uncurled and ate a bug. Momentum is weird.' },
  // 18 – Rust
  { colorName: 'Rust', animal: '🦀', name: 'Snap',
    message: 'I walk sideways and I still make progress. Direction is overrated. Just move.' },
  // 19 – Periwinkle
  { colorName: 'Periwinkle', animal: '🐰', name: 'Scout',
    message: 'My attention span is shorter than yours and I built a whole warren. Start small.' },
  // 20 – Copper
  { colorName: 'Copper', animal: '🦅', name: 'Vista',
    message: 'From up here, your problems look very small. They probably are. Go handle them.' },
  // 21 – Moss
  { colorName: 'Moss', animal: '🐊', name: 'Still',
    message: 'I haven\'t moved in three hours and that\'s called a strategy. What\'s your excuse?' },
  // 22 – Plum
  { colorName: 'Plum', animal: '🦜', name: 'Chatter',
    message: 'HELLO. I learned to talk just to tell you to stop scrolling and start doing.' },
  // 23 – Tangerine
  { colorName: 'Tangerine', animal: '🐻', name: 'Maple',
    message: 'I just woke up from a 5-month nap. What did I miss? Oh, you haven\'t started either?' },
  // 24 – Iris
  { colorName: 'Iris', animal: '🦚', name: 'Plume',
    message: 'I grew all these feathers just to stand here. Sometimes showing up IS the whole thing.' },
  // 25 – Pine
  { colorName: 'Pine', animal: '🐺', name: 'North',
    message: 'The pack doesn\'t wait for motivation. They just run. Run with me.' },
  // 26 – Rosewood
  { colorName: 'Rosewood', animal: '🦢', name: 'Grace',
    message: 'I look elegant but I\'m paddling like crazy underwater. Relatable? Start paddling.' },
  // 27 – Bronze Gold
  { colorName: 'Bronze Gold', animal: '🐝', name: 'Nectar',
    message: 'Your brain is a superpower that forgot its own instructions. Write them down.' },
  // 28 – Dusk Blue
  { colorName: 'Dusk Blue', animal: '🐋', name: 'Deep',
    message: 'I dive 2,000 meters on one breath. You can do 20 minutes on one task. Probably.' },
  // 29 – Fern
  { colorName: 'Fern', animal: '🦥', name: 'Lull',
    message: 'I move at 0.15 mph. Still faster than thinking about starting without starting.' },
  // 30 – Driftwood
  { colorName: 'Driftwood', animal: '🦦', name: 'Otter',
    message: 'I hold hands while I sleep so I don\'t drift apart. Hold onto your task list today.' },
  // 31 – Seafoam
  { colorName: 'Seafoam', animal: '🐠', name: 'Finley',
    message: 'My memory is 3 seconds and I\'m still vibing. Write stuff down and join me.' },
  // 32 – Burnt Honey
  { colorName: 'Burnt Honey', animal: '🐨', name: 'Haze',
    message: 'I sleep 22 hours a day but when I\'m awake, I COMMIT. Channel that energy.' },
  // 33 – Thistle Bloom
  { colorName: 'Thistle Bloom', animal: '🦡', name: 'Burrow',
    message: 'Honey badger don\'t care about your anxiety. Honey badger does the thing anyway.' },
  // 34 – Juniper
  { colorName: 'Juniper', animal: '🐿️', name: 'Stash',
    message: 'I forget where I put 74% of my acorns. That\'s why I write everything down. Hint hint.' },
  // 35 – Sunset Clay
  { colorName: 'Sunset Clay', animal: '🦘', name: 'Leap',
    message: 'Fun fact: I can\'t walk backwards. Only forward. Today that\'s the whole philosophy.' },
  // 36 – Twilight
  { colorName: 'Twilight', animal: '🦇', name: 'Dusk',
    message: 'I navigate by screaming into the void and listening. That\'s basically journaling.' },
  // 37 – Eucalyptus
  { colorName: 'Eucalyptus', animal: '🐼', name: 'Bao',
    message: 'My entire job is eating and being cute. Yours is slightly harder. But just slightly.' },
  // 38 – Cranberry
  { colorName: 'Cranberry', animal: '🦞', name: 'Pinch',
    message: 'I literally shed my entire body to grow. Change is uncomfortable but that\'s the gig.' },
  // 39 – Lichen
  { colorName: 'Lichen', animal: '🐌', name: 'Trace',
    message: 'I carry my house on my back. You can carry one task to completion. Let\'s go.' },
  // 40 – Arctic Slate
  { colorName: 'Arctic Slate', animal: '🐳', name: 'Swell',
    message: 'My heart beats 8 times a minute. Take a breath. Then do the thing. Then breathe again.' },
  // 41 – Cayenne
  { colorName: 'Cayenne', animal: '🐉', name: 'Blaze',
    message: 'I breathe fire and I\'m telling you: that task is not as scary as a dragon. Go.' },
  // 42 – Wisteria
  { colorName: 'Wisteria', animal: '🦧', name: 'Oakley',
    message: 'I share 97% of your DNA and 100% of your tendency to procrastinate. Let\'s fight it together.' },
  // 43 – Turmeric
  { colorName: 'Turmeric', animal: '🐓', name: 'Crow',
    message: 'I screamed at 5am for no reason. At least your task list has reasons. Open it.' },
  // 44 – Dried Rose
  { colorName: 'Dried Rose', animal: '🐑', name: 'Woolly',
    message: 'People count me to fall asleep. Ironic, because today I\'m here to wake you up.' },
  // 45 – Clover Field
  { colorName: 'Clover Field', animal: '🐄', name: 'Meadow',
    message: 'I have four stomachs and still only eat one thing. Focus isn\'t my problem. Is it yours?' },
  // 46 – Harbor Blue
  { colorName: 'Harbor Blue', animal: '🦑', name: 'Ink',
    message: 'I have three hearts. One of them is rooting for you. The other two are also rooting for you.' },
  // 47 – Paprika
  { colorName: 'Paprika', animal: '🦃', name: 'Strut',
    message: 'I can\'t fly but I still strut. Do the task badly and with confidence.' },
  // 48 – Dusk Violet
  { colorName: 'Dusk Violet', animal: '🦩', name: 'Flambe',
    message: 'I\'m pink because of shrimp. You are what you repeatedly do. Do something good.' },
  // 49 – Spruce
  { colorName: 'Spruce', animal: '🐗', name: 'Thorn',
    message: 'I don\'t overthink it. I see the task. I charge at the task. Be more boar.' },
  // 50 – Caramel
  { colorName: 'Caramel', animal: '🐹', name: 'Pip',
    message: 'I can fit an insane amount in my cheeks. You can fit one task in this hour. Stuff it in.' },
  // 51 – Steel Blue
  { colorName: 'Steel Blue', animal: '🦈', name: 'Keel',
    message: 'If I stop swimming, I die. A bit dramatic, but the metaphor works. Keep moving.' },
  // 52 – Pomegranate
  { colorName: 'Pomegranate', animal: '🦌', name: 'Hart',
    message: 'My antlers fall off every year and I just grow new ones. Setbacks are cosmetic.' },
  // 53 – Sage Moss
  { colorName: 'Sage Moss', animal: '🦫', name: 'Lodge',
    message: 'I built a dam that changed a river. Started with one stick. What\'s your one stick today?' },
  // 54 – Hyacinth
  { colorName: 'Hyacinth', animal: '🐕', name: 'Paws',
    message: 'I would literally die for you. The least you can do is check off one task.' },
  // 55 – Cinnamon
  { colorName: 'Cinnamon', animal: '🐘', name: 'Rumble',
    message: 'I never forget. You always forget. That\'s why you have this app. Use it.' },
  // 56 – Tide Pool
  { colorName: 'Tide Pool', animal: '🐟', name: 'Current',
    message: 'I\'ve been swimming in circles and honestly it\'s fine. Progress isn\'t always linear.' },
  // 57 – Heather
  { colorName: 'Heather', animal: '🦙', name: 'Alma',
    message: 'I spit when I\'m annoyed. You procrastinate. We all have coping mechanisms.' },
  // 58 – Saffron
  { colorName: 'Saffron', animal: '🐏', name: 'Ram',
    message: 'My approach to obstacles: headbutt them repeatedly. Surprisingly effective. Try it.' },
  // 59 – Ivy
  { colorName: 'Ivy', animal: '🐍', name: 'Coil',
    message: 'I shed my skin when it doesn\'t fit anymore. Shed the old plan. Start fresh.' },
  // 60 – Cornflower
  { colorName: 'Cornflower', animal: '🐦', name: 'Wren',
    message: 'I weigh less than a coin and I crossed an ocean. Your email is not that hard.' },
  // 61 – Adobe
  { colorName: 'Adobe', animal: '🦏', name: 'Slate',
    message: 'I\'m basically a tank with legs. Point me at your hardest task. I\'ll wait.' },
  // 62 – Lilac Haze
  { colorName: 'Lilac Haze', animal: '🐇', name: 'Wisp',
    message: 'Quick, do the thing before your brain finds a reason not to. GO. NOW. Hi. Do it.' },
  // 63 – Basil
  { colorName: 'Basil', animal: '🐊', name: 'Marsh',
    message: 'Crocodiles haven\'t changed in 200 million years. Sometimes the old plan works fine.' },
  // 64 – Butterscotch
  { colorName: 'Butterscotch', animal: '🐕‍🦺', name: 'Buddy',
    message: 'I\'m a service dog and today I\'m in service of you not spiraling. Pick one task.' },
  // 65 – Mulberry
  { colorName: 'Mulberry', animal: '🦉', name: 'Hoot',
    message: 'I can rotate my head 270°. Still can\'t look away from your unfinished tasks.' },
  // 66 – Deep Lagoon
  { colorName: 'Deep Lagoon', animal: '🐙', name: 'Squid',
    message: 'I squirt ink when stressed. You open new tabs. Same energy. Close the tabs.' },
  // 67 – Olive Gold
  { colorName: 'Olive Gold', animal: '🐿️', name: 'Sprout',
    message: 'I accidentally plant thousands of trees by forgetting where I hid things. Chaos creates.' },
  // 68 – Midnight Iris
  { colorName: 'Midnight Iris', animal: '🦉', name: 'Nox',
    message: 'It\'s dark and I can see everything clearly. Sometimes you need less light, not more info.' },
  // 69 – Marmalade
  { colorName: 'Marmalade', animal: '🐈‍⬛', name: 'Jinx',
    message: 'I knocked something off a table today. On purpose. Sometimes destruction is progress.' },
  // 70 – Verdigris
  { colorName: 'Verdigris', animal: '🐸', name: 'Moss',
    message: 'Ribbit. That\'s it. That\'s the advice. Sometimes there is no deeper meaning. Just start.' },
  // 71 – Foxglove
  { colorName: 'Foxglove', animal: '🦊', name: 'Fable',
    message: 'Plot twist: the task was easy the whole time. You were just scared of the title.' },
  // 72 – Moss Agate
  { colorName: 'Moss Agate', animal: '🐢', name: 'Basalt',
    message: 'I live to 150. There\'s time. But also, maybe start today? Just a thought.' },
  // 73 – Petrol Blue
  { colorName: 'Petrol Blue', animal: '🐋', name: 'Drift',
    message: 'I communicate through songs that travel 10,000 miles. You can\'t send a one-line email?' },
  // 74 – Garnet
  { colorName: 'Garnet', animal: '🦅', name: 'Ridge',
    message: 'I see a mouse from 2 miles away. I can also see you avoiding that task. Don\'t.' },
  // 75 – Raw Umber
  { colorName: 'Raw Umber', animal: '🐂', name: 'Forge',
    message: 'The china shop is a metaphor for your calendar. I\'m going in. Come with me.' },
  // 76 – Storm Violet
  { colorName: 'Storm Violet', animal: '🐆', name: 'Flash',
    message: 'I\'m the fastest land animal- wait no that\'s cheetahs. Anyway. Speed isn\'t the point. Starting is.' },
  // 77 – Fiddlehead
  { colorName: 'Fiddlehead', animal: '🦎', name: 'Fern',
    message: 'I change color based on my mood. Today\'s mood: productively unhinged.' },
  // 78 – Toffee
  { colorName: 'Toffee', animal: '🐻‍❄️', name: 'Frost',
    message: 'My fur is actually transparent, not white. Things aren\'t always what they seem. Neither is that scary task.' },
  // 79 – Rain Cloud
  { colorName: 'Rain Cloud', animal: '🐬', name: 'Ripple',
    message: 'I do flips for no reason. Joy doesn\'t need a reason. Neither does getting started.' },
  // 80 – Bramble
  { colorName: 'Bramble', animal: '🦔', name: 'Quill',
    message: 'I\'m small, spiky, and I get stuff done at night. We\'re not so different.' },
  // 81 – Dark Moss
  { colorName: 'Dark Moss', animal: '🐊', name: 'Bayou',
    message: 'I\'ve been lurking here for 45 minutes waiting for you to start. I\'m patient. But come on.' },
  // 82 – Fjord Blue
  { colorName: 'Fjord Blue', animal: '🐧', name: 'Fjord',
    message: 'I walked 70 miles in a blizzard to sit on an egg. Your commute to the desk is shorter.' },
  // 83 – Vermillion
  { colorName: 'Vermillion', animal: '🦜', name: 'Blitz',
    message: 'SQUAWK. Sorry. I mean: you\'re doing great. Also SQUAWK. Do the thing.' },
  // 84 – Forest Floor
  { colorName: 'Forest Floor', animal: '🦡', name: 'Spore',
    message: 'I dug 73 holes last night. Not all of them useful. But I was MOVING. You should too.' },
  // 85 – Soft Amethyst
  { colorName: 'Soft Amethyst', animal: '🦋', name: 'Veil',
    message: 'I can taste with my feet. You can start with your fingers. On the keyboard. Now.' },
  // 86 – Amber Glow
  { colorName: 'Amber Glow', animal: '🐝', name: 'Buzz',
    message: 'My whole colony shares one brain and we\'re still more organized than your inbox.' },
  // 87 – Celadon
  { colorName: 'Celadon', animal: '🐸', name: 'Reed',
    message: 'I eat bugs and judge no one. Except people who stare at their to-do list without doing it.' },
  // 88 – Wild Berry
  { colorName: 'Wild Berry', animal: '🐻', name: 'Bramble',
    message: 'Ate 40 lbs of salmon today. Fueled up. Your version of this is coffee. Now what?' },
  // 89 – Artichoke
  { colorName: 'Artichoke', animal: '🦎', name: 'Inch',
    message: 'I do pushups to communicate. What a flex. Literally. Now flex on that task list.' },
  // 90 – Denim
  { colorName: 'Denim', animal: '🐺', name: 'Pack',
    message: 'Howled at the moon. It didn\'t answer. Still felt good. Sometimes you just gotta start and see.' },
  // 91 – Brick Dust
  { colorName: 'Brick Dust', animal: '🦀', name: 'Scuttle',
    message: 'My skeleton is on the outside. Talk about having no protection from deadlines. Relate?' },
  // 92 – Lavender Ash
  { colorName: 'Lavender Ash', animal: '🕊️', name: 'Calm',
    message: 'I always find my way home. Your "home" today is that one task you keep postponing.' },
  // 93 – Jade Mist
  { colorName: 'Jade Mist', animal: '🐲', name: 'Glimmer',
    message: 'I guard treasure. Today the treasure is your time. Don\'t let anything steal it.' },
  // 94 – Pecan
  { colorName: 'Pecan', animal: '🐿️', name: 'Cache',
    message: 'I buried 10,000 acorns and forgot 7,400 of them. Write. Things. Down.' },
  // 95 – Raspberry
  { colorName: 'Raspberry', animal: '🦢', name: 'Aria',
    message: 'I\'m graceful on water and a disaster on land. Play to your strengths today.' },
  // 96 – Dark Jade
  { colorName: 'Dark Jade', animal: '🐍', name: 'Jade',
    message: 'I only eat once a month. Talk about restraint. You could try not checking your phone for 20 min.' },
  // 97 – Toasted Wheat
  { colorName: 'Toasted Wheat', animal: '🐻', name: 'Grit',
    message: 'I scratch my back on trees because I can\'t reach. Ask for help if you\'re stuck. Seriously.' },
  // 98 – Heron Blue
  { colorName: 'Heron Blue', animal: '🦤', name: 'Persist',
    message: 'I\'m literally extinct and I still showed up for you today. No excuses.' },
  // 99 – Dragon Pepper (bonus — catch-all)
  { colorName: 'Dragon Pepper', animal: '🐉', name: 'Spark',
    message: 'I\'m a DRAGON. In a JOURNAL APP. If that\'s not motivating, nothing is. Do the thing.' },
];

/** Get the companion for today's color */
export function getDailyCompanion(color: DailyColor): DailyCompanion {
  return COMPANIONS[color.index] ?? COMPANIONS[0];
}
