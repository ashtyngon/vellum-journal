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
  messages: string[]; // pool of quotes — first shown on load, click cycles through the rest
}

const COMPANIONS: DailyCompanion[] = [
  // 0 – Warm Amber
  { colorName: 'Warm Amber', animal: '🦊', name: 'Fox',
    messages: ['I hid your phone. Kidding. But imagine how much you\'d get done.', 'Your plan doesn\'t need to be clever. It needs to exist. I\'ll handle the clever part.', 'Chmok. That\'s fox for \"the trap is set and the trap is your own competence.\"', 'I cached 40 escape routes before breakfast. You only need one path forward. Pick it.', 'The best schemes look like accidents. Start messy, let people think you meant it.'] },
  // 1 – Dusty Rose
  { colorName: 'Dusty Rose', animal: '🐙', name: 'Octavia',
    messages: ['I have eight arms and even I can only do one thing at a time.', 'Three of my arms are currently preventing the other five from opening new tabs. Teamwork.', 'Chmok from tentacle #3. The others are holding your priorities in a death grip.', 'I escaped a sealed jar by unscrewing the lid from inside. Your problem has a lid too. Unscrew it.', 'Overwhelm is just your brain doing an impression of me. The fix is the same: pick ONE arm.'] },
  // 2 – Burnt Sienna
  { colorName: 'Burnt Sienna', animal: '🦝', name: 'Bandit',
    messages: ['Stole your excuses. You can have them back at 5pm.', 'Found your motivation in the dumpster out back. It\'s fine, just a little bruised. Let\'s go.', 'Chmok. Don\'t tell anyone. I have a reputation to maintain.', 'I break into locked things for a living. That mental block you have? Already picked it. Walk through.', 'You\'re hoarding reasons not to start like they\'re shiny trash. They\'re trash. Drop them.'] },
  // 3 – Ocean Teal
  { colorName: 'Ocean Teal', animal: '🐋', name: 'Atlas',
    messages: ['I weigh 80 tons and I still showed up today.', 'The surface drama looks very small from 2,000 meters down. Submerge. Focus. Rise when ready.', 'Chmok. It\'s an 80-ton kiss. You\'ll feel it in your bones for the rest of the day.', 'I migrate 10,000 miles without a map. You have a task list. You\'re embarrassingly overprepared.', 'Patience isn\'t passive. I hold my breath for 90 minutes while hunting. Hold your focus. Hunt.'] },
  // 4 – Forest Sage
  { colorName: 'Forest Sage', animal: '🦉', name: 'Sage',
    messages: ['Fun fact: the first step is always the ugliest. That\'s normal.', 'The mouse doesn\'t see me until it\'s too late. Your task won\'t see you coming either. Be silent. Be sudden.', 'Chmok. Delivered silently at 3am like all good wisdom.', 'I don\'t blink because the truth doesn\'t need to. Here\'s the truth: you already know what to do.', 'Everyone wants the answers. Nobody wants the quiet it takes to hear them. Sit. Listen. Go.'] },
  // 5 – Dusty Lavender
  { colorName: 'Dusty Lavender', animal: '🦋', name: 'Drift',
    messages: ['I was a caterpillar last week. Things change fast. Start something.', 'The cocoon part sucked, by the way. Nobody puts that in the metaphor. The after part is worth it though.', 'Chmok, light as a wing. Now go become something you couldn\'t imagine last month.', 'I dissolved into literal soup before becoming this. Your rough draft is elegant by comparison.', 'You keep waiting for the \"right moment\" to transform. Babe, the goo stage IS the moment.'] },
  // 6 – Golden Honey
  { colorName: 'Golden Honey', animal: '🐝', name: 'Clover',
    messages: ['I visited 2,000 flowers today and none of them were perfect. Still made honey.', 'You don\'t need the perfect flower. You need 2,000 okay ones. That\'s literally the recipe.', 'Chmok! Bzz. That\'s the sound of affection delivered at 15 miles per hour.', 'I die if I sting you so I\'m choosing peace. Choose peace with your task list. Then do it.', 'Honey takes 60,000 flights to make one jar. Your project doesn\'t need to be done in one sitting.'] },
  // 7 – Soft Crimson
  { colorName: 'Soft Crimson', animal: '🦩', name: 'Rosie',
    messages: ['I stand on one leg all day. You can sit and do one task. We believe in each other.', 'I turned pink by committing to shrimp. Commitment changes you. Commit to the task.', 'Chmok. Delivered while standing on one leg because I\'m dramatic and I own it.', 'Everyone thinks I\'m elegant. I\'m actually just too stubborn to fall over. Stubbornness works.', 'I sleep standing up because sitting down was never an option. Don\'t give yourself the option of \"later.\"'] },
  // 8 – Dark Teal
  { colorName: 'Dark Teal', animal: '🐢', name: 'Steady',
    messages: ['I\'ve been walking since the Jurassic period. I\'ll get there. So will you.', 'Speed is a rumor started by rabbits. Outcomes are started by turtles.', 'Chmok. It took me 20 minutes to deliver it but I deliver everything eventually.', 'My shell is my home office. Yours is this app. Both are portable. Both work. Use yours.', 'I watched the dinosaurs speedrun and look where that got them. Go slow. Finish.'] },
  // 9 – Warm Ochre
  { colorName: 'Warm Ochre', animal: '🦁', name: 'Sol',
    messages: ['Lions sleep 20 hours a day. The other 4 are terrifying. Be terrifyingly focused.', 'The mane isn\'t for warmth, it\'s for intimidation. Your confidence doesn\'t need a reason either.', 'Chmok. Now pretend it\'s a roar and go scare your to-do list into submission.', 'I don\'t chase. I position and wait. Stop chasing motivation. Position yourself and begin.', 'The pride hunts together but someone has to move first. Today that someone is you.'] },
  // 10 – Slate Blue
  { colorName: 'Slate Blue', animal: '🐧', name: 'Tux',
    messages: ['I wore a tuxedo to this. The least you can do is open your task list.', 'I survived -60 degrees by huddling with others. You can survive Monday by asking for help.', 'Chmok. Formal penguin affection. Black tie optional, effort required.', 'Can\'t fly. Can swim 22 mph underwater. Everyone has a hidden lane. Find yours.', 'I waddle because physics. You procrastinate because fear. At least my excuse is structural.'] },
  // 11 – Terracotta
  { colorName: 'Terracotta', animal: '🦎', name: 'Ember',
    messages: ['If my tail falls off, I grow a new one. Your failed plan is not that serious.', 'The old tail had to go so the new one could come in. That\'s not loss, that\'s an upgrade cycle.', 'Chmok from my regenerating tail. Brand new, never used, just for you.', 'I change color when I\'m stressed. You open the fridge. At least my coping mechanism is invisible.', 'Losing a piece of yourself isn\'t failure, it\'s making room. I would know. I\'ve dropped four tails.'] },
  // 12 – Mauve
  { colorName: 'Mauve', animal: '🐈', name: 'Velvet',
    messages: ['I knocked your perfectionism off the counter. You\'re welcome.', 'I sleep 16 hours and accomplish more in the other 8 than you do all day. It\'s about intensity, not duration.', 'Chmok. I\'ll bite you in 30 seconds. That\'s the window. Enjoy it.', 'I fit in every box because I\'m flexible. Your schedule should be too. Rigid plans are for dogs.', 'You\'re staring at the screen like I stare at a red dot. Entertaining, but not productive. Pounce already.'] },
  // 13 – Olive
  { colorName: 'Olive', animal: '🐸', name: 'Ribbit',
    messages: ['Today\'s vibe: chaotic good. Let\'s see what happens.', 'I was a tadpole who grew legs and left the water. Reinvention doesn\'t need a five-year plan.', 'Chmok. It\'s moist. I\'m a frog. Deal with it.', 'My tongue catches flies faster than your brain catches doubts. Be more tongue, less brain.', 'I live in a pond and I\'m absolutely thriving. Happiness has nothing to do with the size of your pond.'] },
  // 14 – Soft Purple
  { colorName: 'Soft Purple', animal: '🦄', name: 'Rare',
    messages: ['I\'m literally mythical and even I think your to-do list is too long. Pick three.', 'They said I don\'t exist. I\'m here anyway. So is your potential. Stop debating and use it.', 'Chmok from a mythical creature. It\'s worth more than your doubt. Frame it.', 'Perfection is a myth. I would know. I\'m a myth. And even I have off days.', 'You\'re spending energy proving you can\'t, when the same energy would prove you can. Weird choice.'] },
  // 15 – Dark Gold
  { colorName: 'Dark Gold', animal: '🐕', name: 'Loyal',
    messages: ['You came back! That\'s 90% of the battle. The other 10% is typing something.', 'I waited by the door all day and I\'m not even mad. That\'s how much I believe in you coming back.', 'Chmok chmok chmok! Sorry, I\'m a dog, I don\'t know when to stop kissing or believing in you.', 'You threw the ball yesterday and didn\'t finish the task. I brought both back. Here.', 'I don\'t understand \"give up.\" I don\'t even understand \"drop it.\" That\'s why we work.'] },
  // 16 – Storm Blue
  { colorName: 'Storm Blue', animal: '🐬', name: 'Echo',
    messages: ['Echolocation update: your next task is directly ahead. Swim toward it.', 'I process 700 signals per second and still take time to play. Rest isn\'t the enemy of focus.', 'Chmok! *splash* I\'m always wet. The affection is still dry-clean quality.', 'My brain literally never fully sleeps. Half stays awake. I know the feeling. Let the other half rest.', 'I use sonar, not sight. Stop looking at the problem and start listening for the answer.'] },
  // 17 – Deep Sage
  { colorName: 'Deep Sage', animal: '🦔', name: 'Thistle',
    messages: ['I curled into a ball once. Then I uncurled and ate a bug. Momentum is weird.', 'People avoid me because I\'m prickly. People avoid tasks because they seem prickly. We\'re both softer underneath.', 'Chmok. Careful though, I have 5,000 quills. Love shouldn\'t be painless. It should be worth it.', 'I\'m nocturnal because the world is quieter at night. Find your quiet hour. Then demolish a task in it.', 'Being small doesn\'t mean being limited. I cover 2 miles a night on legs the size of thumbtacks.'] },
  // 18 – Rust
  { colorName: 'Rust', animal: '🦀', name: 'Snap',
    messages: ['I walk sideways and I still make progress. Direction is overrated. Just move.', 'My shell doesn\'t grow with me so I abandon it and find a bigger one. Outgrow your comfort zone. Leave it behind.', 'Chmok. Clack clack. That\'s crab for \"I care about you AND your tendency to stall.\"', 'Everyone\'s worried about going the wrong way. I go sideways on purpose. There\'s always more than one path.', 'I have 10 legs and use every single one. Count your resources. You have more than you think.'] },
  // 19 – Periwinkle
  { colorName: 'Periwinkle', animal: '🐰', name: 'Scout',
    messages: ['My attention span is shorter than yours and I built a whole warren. Start small.', 'I thump my foot when something\'s wrong. *thump thump* Something\'s wrong. You haven\'t started yet.', 'Chmok! *thump thump* That\'s my foot saying I love you and also please hurry.', 'I reproduce at an absurd rate. You can reproduce at least one completed task today. The bar is low.', 'Ears this big hear everything, including your excuses echoing off the walls. New excuse: none. Go.'] },
  // 20 – Copper
  { colorName: 'Copper', animal: '🦅', name: 'Vista',
    messages: ['From up here, your problems look very small. They probably are. Go handle them.', 'I don\'t flap. I find the thermal and ride it. Stop forcing. Find what carries you and lean in.', 'Chmok from above. Like a blessing but with talons respectfully retracted.', 'My nest weighs 2 tons because I add to it every year. Small daily effort. Massive results. That\'s the game.', 'You keep zooming in on details. I see from 10,000 feet. The big picture says: you\'re fine. Just go.'] },
  // 21 – Moss
  { colorName: 'Moss', animal: '🐊', name: 'Still',
    messages: ['I haven\'t moved in three hours and that\'s called a strategy. What\'s your excuse?', 'Conservation of energy isn\'t laziness. I lie still for hours so that one moment counts. Make your move count.', 'Chmok. You didn\'t see it coming. That\'s kind of my whole brand.', 'I survived 200 million years by knowing when to wait and when to snap. This is your snap moment.', 'The difference between me and a log is timing. The difference between you and productive is starting.'] },
  // 22 – Plum
  { colorName: 'Plum', animal: '🦜', name: 'Chatter',
    messages: ['HELLO. I learned to talk just to tell you to stop scrolling and start doing.', 'I repeated \"pretty bird\" 400 times before they gave me a cracker. Persistence, baby. PERSISTENCE.', 'Chmok! CHMOK! CHMOK! I learned a new word and I\'m using it. CHMOK!', 'I outlive my owners. I\'ll outlive your excuses too. SQUAWK.', 'I can say 800 words but \"I\'ll do it later\" isn\'t in my vocabulary. I deleted it. GONE.'] },
  // 23 – Tangerine
  { colorName: 'Tangerine', animal: '🐻', name: 'Maple',
    messages: ['I just woke up from a 5-month nap. What did I miss? Oh, you haven\'t started either?', 'Gained 300 pounds before my nap so I could survive the winter. Preparation looks weird sometimes. Yours does too. That\'s fine.', 'Chmok. It\'s a sleepy bear kiss. Heavy, warm, and slightly confused about what month it is.', 'I eat 90 pounds of food a day before hibernation. That\'s not gluttony, it\'s planning. Your binge-planning day is valid.', 'You want to hibernate but you haven\'t earned it yet. Bears know: the work comes before the rest.'] },
  // 24 – Iris
  { colorName: 'Iris', animal: '🦚', name: 'Plume',
    messages: ['I grew all these feathers just to stand here. Sometimes showing up IS the whole thing.', 'My display is 60% of my body and 100% of my personality. Put your whole self into one thing today.', 'Chmok, darling. Displayed with all 200 feathers fanned out because subtlety is for sparrows.', 'Everyone sees the feathers. Nobody sees the molting. Your effort is invisible too. That doesn\'t make it fake.', 'I don\'t hide my colors when I\'m tired. I fan harder. Be annoyingly, defiantly present today.'] },
  // 25 – Pine
  { colorName: 'Pine', animal: '🐺', name: 'North',
    messages: ['The pack doesn\'t wait for motivation. They just run. Run with me.', 'I don\'t howl because the moon answers. I howl because the silence needed breaking. Break yours.', 'Chmok. Wolves don\'t do chmok. But for you, I\'ll invent a new tradition.', 'The lone wolf myth is garbage. I succeed because of my pack. Who\'s your pack? Lean on them.', 'Discipline looks like cruelty from the outside and survival from the inside. Welcome to the inside.'] },
  // 26 – Rosewood
  { colorName: 'Rosewood', animal: '🦢', name: 'Grace',
    messages: ['I look elegant but I\'m paddling like crazy underwater. Relatable? Start paddling.', 'Nobody sees the effort. That\'s not unfair. That\'s design. Make it look easy. It won\'t be.', 'Chmok. Delivered with elegance and exactly the right amount of hidden desperation.', 'My neck looks ridiculous and I made it iconic. Your weird process works. Stop apologizing for it.', 'The ugly duckling story is about patience, not beauty. Be patient with your becoming.'] },
  // 27 – Bronze Gold
  { colorName: 'Bronze Gold', animal: '🐝', name: 'Nectar',
    messages: ['Your brain is a superpower that forgot its own instructions. Write them down.', 'I do a waggle dance to communicate directions. Your journal is your waggle dance. Dance.', 'Chmok from the hive mind. All 60,000 of us agreed you should open that task list.', 'I fly 500 miles in my lifetime and every mile has purpose. Make this hour purposeful.', 'The hive doesn\'t run on motivation. It runs on systems. Build your system. The motivation follows.'] },
  // 28 – Dusk Blue
  { colorName: 'Dusk Blue', animal: '🐋', name: 'Deep',
    messages: ['I dive 2,000 meters on one breath. You can do 20 minutes on one task. Probably.', 'Pressure increases the deeper you go. I\'m built for it. So are you, you just haven\'t tested your depth yet.', 'Chmok. It echoed through the whole ocean. That\'s the reach of genuine effort.', 'Light doesn\'t reach where I work. You don\'t need to see the finish to start swimming toward it.', 'Come down here where it\'s quiet. One task. No notifications. Just depth.'] },
  // 29 – Fern
  { colorName: 'Fern', animal: '🦥', name: 'Lull',
    messages: ['I move at 0.15 mph. Still faster than thinking about starting without starting.', 'I\'m not lazy. I have a metabolic rate that demands efficiency. Rebrand your slowness as efficiency.', 'Chmok. I\'ll deliver it next week at this speed. Still more reliable than your deadline habits.', 'Algae grows on my fur and I turned it into camouflage. Turn your weakness into a feature.', 'The world calls me slow. I call it selective urgency. Not everything deserves your fastest.'] },
  // 30 – Driftwood
  { colorName: 'Driftwood', animal: '🦦', name: 'Otter',
    messages: ['I hold hands while I sleep so I don\'t drift apart. Hold onto your task list today.', 'I have a favorite rock that I keep in my pocket. Your favorite task is the one you start first. Pick your rock.', 'Chmok! *grabs your hand* Otters hold hands in rough water. Today might be rough. I\'m holding.', 'I crack shells by hitting them 100 times. Not every hit cracks it. But the last one always does. Keep hitting.', 'Floating is not the same as drifting. One is intentional. Be intentional today.'] },
  // 31 – Seafoam
  { colorName: 'Seafoam', animal: '🐠', name: 'Finley',
    messages: ['My memory is 3 seconds and I\'m still vibing. Write stuff down and join me.', 'Everyone jokes about my memory but I\'m happy every 3 seconds. You\'re anxious for hours. Who\'s winning?', 'Chmok blub blub. Already forgot I said it but the love was real for those 3 seconds.', 'I don\'t carry yesterday\'s problems. Literally can\'t. Try it on purpose. It\'s liberating.', 'I swim in circles because every lap feels new to me. Fresh eyes on an old task changes everything.'] },
  // 32 – Burnt Honey
  { colorName: 'Burnt Honey', animal: '🐨', name: 'Haze',
    messages: ['I sleep 22 hours a day but when I\'m awake, I COMMIT. Channel that energy.', 'I eat poison leaves and thrive. You can eat one uncomfortable task and survive. I believe in you.', 'Chmok. *immediately falls asleep* Brief but genuine. Like all my best work.', 'My brain is smooth. Literally. And I\'m still here. Your wrinkly brain has NO excuse.', 'Two hours of awake time, zero wasted on self-doubt. That\'s the koala way. Adopt it.'] },
  // 33 – Thistle Bloom
  { colorName: 'Thistle Bloom', animal: '🦡', name: 'Burrow',
    messages: ['Honey badger don\'t care about your anxiety. Honey badger does the thing anyway.', 'A cobra bit me last week. I took a nap and walked it off. Your hard task is NOT a cobra.', 'Chmok. I don\'t care if it\'s weird. Honey badger doesn\'t care about social norms.', 'My skin is so thick nothing gets through. Build thicker skin for criticism. Then get to work.', 'I\'m immune to venom and allergic to excuses. Which one are you feeding me right now?'] },
  // 34 – Juniper
  { colorName: 'Juniper', animal: '🐿️', name: 'Stash',
    messages: ['I forget where I put 74% of my acorns. That\'s why I write everything down. Hint hint.', 'The 26% I DO remember built entire oak forests. Imperfect effort creates real things.', 'Chmok! I hid it somewhere safe. I think. Honestly I\'ll find it in spring.', 'My cheeks hold more than my brain remembers. External storage isn\'t cheating, it\'s engineering.', 'I plant forests by accident and you can\'t start one task on purpose? I\'m concerned.'] },
  // 35 – Sunset Clay
  { colorName: 'Sunset Clay', animal: '🦘', name: 'Leap',
    messages: ['Fun fact: I can\'t walk backwards. Only forward. Today that\'s the whole philosophy.', 'I keep my baby in a pouch while doing parkour. You can keep a task in your brain while doing life.', 'Chmok! *bounces away* Sorry, momentum is kind of my whole thing.', 'My tail is basically a fifth leg. Use whatever weird advantage you have. There are no rules.', 'I cover 30 feet in one jump. You only need to cover the distance between you and \"started.\"'] },
  // 36 – Twilight
  { colorName: 'Twilight', animal: '🦇', name: 'Dusk',
    messages: ['I navigate by screaming into the void and listening. That\'s basically journaling.', 'Hanging upside down gives me perspective. Try looking at the problem differently. Literally.', 'Chmok. Delivered at ultrasonic frequency. You felt it even if you didn\'t hear it.', 'People fear me because they don\'t understand me. Same energy as fearing your potential. Cut it out.', 'I pollinate more plants than bees and get zero credit. Do the thankless task. It matters more than the flashy one.'] },
  // 37 – Eucalyptus
  { colorName: 'Eucalyptus', animal: '🐼', name: 'Bao',
    messages: ['My entire job is eating and being cute. Yours is slightly harder. But just slightly.', 'I was almost extinct and I came back. Whatever\'s dying in your life can come back too if you feed it.', 'Chmok. *rolls over and falls off branch* Graceful? No. Sincere? Absolutely.', 'I eat bamboo 14 hours a day. Not because I love it. Because that\'s what commitment looks like.', 'Black and white thinking is literally my whole aesthetic. But life needs gray areas. Start in the gray.'] },
  // 38 – Cranberry
  { colorName: 'Cranberry', animal: '🦞', name: 'Pinch',
    messages: ['I literally shed my entire body to grow. Change is uncomfortable but that\'s the gig.', 'Under this armor is something soft that\'s growing. Vulnerability IS the growth. Don\'t skip it.', 'Chmok. Careful, I pinch the ones I love. It\'s how I say \"wake up and grow.\"', 'I hide under a rock during molting because growth is ugly. Do your ugly growth in private if you need to.', 'Every shell I\'ve worn was temporary. Every version of you is temporary. The next one is better.'] },
  // 39 – Lichen
  { colorName: 'Lichen', animal: '🐌', name: 'Trace',
    messages: ['I carry my house on my back. You can carry one task to completion. Let\'s go.', 'My trail sparkles in the sun. Leave evidence of your effort today. Something visible.', 'Chmok. Delivered at trail pace. Slow, shiny, and impossible to miss.', 'I\'m not slow. I\'m thorough. I touch every inch of ground I cover. Be thorough today.', 'People step over me. I still get where I\'m going. External disrespect doesn\'t change internal direction.'] },
  // 40 – Arctic Slate
  { colorName: 'Arctic Slate', animal: '🐳', name: 'Swell',
    messages: ['My heart beats 8 times a minute. Take a breath. Then do the thing. Then breathe again.', 'I\'m the largest thing that ever lived and I eat the smallest things in the ocean. Big results come from small actions.', 'Chmok. You felt the vibration from 100 miles away. That\'s the radius of real effort.', 'I sing at 188 decibels. Louder than a jet engine. Your one quiet task is nothing. Whisper through it.', 'I open my mouth and the food comes in. But first I had to swim to where the food was. Position yourself.'] },
  // 41 – Cayenne
  { colorName: 'Cayenne', animal: '🐉', name: 'Blaze',
    messages: ['I breathe fire and I\'m telling you: that task is not as scary as a dragon. Go.', 'Fire doesn\'t ask permission to burn. Stop asking permission to start. Light it up.', 'Chmok. Warm. Very warm. Okay slightly scorching. But you needed that heat under you.', 'I sit on treasure and guard it fiercely. Your time is the treasure. Guard it from distractions.', 'My fire isn\'t anger. It\'s clarity burned into existence. Be clear. Be bright. Be done by lunch.'] },
  // 42 – Wisteria
  { colorName: 'Wisteria', animal: '🦧', name: 'Oakley',
    messages: ['I share 97% of your DNA and 100% of your tendency to procrastinate. Let\'s fight it together.', 'I use tools, I make plans, and I sit in trees overthinking. The difference is I eventually climb down and do something.', 'Chmok. With 97% the same DNA, this is family therapy at this point.', 'I build a new nest every night because yesterday\'s setup doesn\'t have to be today\'s. Start fresh.', 'Our ancestors split 14 million years ago and you STILL haven\'t finished that task? Come on, cousin.'] },
  // 43 – Turmeric
  { colorName: 'Turmeric', animal: '🐓', name: 'Crow',
    messages: ['I screamed at 5am for no reason. At least your task list has reasons. Open it.', 'I don\'t wait until I\'m ready. I scream at dawn whether my voice is warmed up or not. Start cold.', 'Chmok. Wait no, I pecked you. Same love language. COCK-A-DOODLE-DO-YOUR-TASKS.', 'Nobody asked me to be the alarm clock. I volunteered. Volunteer for the hard thing.', 'I crow at nothing. You worry about everything. Somewhere in the middle is the right response: just do it.'] },
  // 44 – Dried Rose
  { colorName: 'Dried Rose', animal: '🐑', name: 'Woolly',
    messages: ['People count me to fall asleep. Ironic, because today I\'m here to wake you up.', 'My wool grows back even after they take everything. So will your energy. But first, spend some.', 'Chmok. Soft, woolly, and non-negotiable. Like your deadline.', 'I follow the shepherd because the shepherd has a plan. Your task list is the shepherd. Follow it.', 'Everyone thinks I\'m docile. Then they try to shear me. I have fight in me. So do you.'] },
  // 45 – Clover Field
  { colorName: 'Clover Field', animal: '🐄', name: 'Meadow',
    messages: ['I have four stomachs and still only eat one thing. Focus isn\'t my problem. Is it yours?', 'I chew each bite 40,000 times a day. You can review your task list once. I\'m not asking a lot.', 'Chmok. Moo. It\'s not complicated. Neither is starting.', 'Fences only work because I agree to them. What imaginary fences are you respecting?', 'I produce 6 gallons a day by showing up consistently. Not passionately. Consistently. That\'s the secret.'] },
  // 46 – Harbor Blue
  { colorName: 'Harbor Blue', animal: '🦑', name: 'Ink',
    messages: ['I have three hearts. One of them is rooting for you. The other two are also rooting for you.', 'When things get scary, I vanish in a cloud of ink and reposition. Strategic retreat isn\'t quitting.', 'Chmok. Times three. One per heart. All of them sincere.', 'I have the largest eye in the animal kingdom. I see you pretending to be busy. That\'s not the same as working.', 'I jet-propel myself backwards to escape danger. Sometimes the fastest path forward looks like going back. Regroup. Then strike.'] },
  // 47 – Paprika
  { colorName: 'Paprika', animal: '🦃', name: 'Strut',
    messages: ['I can\'t fly but I still strut. Do the task badly and with confidence.', 'They pardoned me once and I\'ve been living like I earned it ever since. Grant yourself a pardon from perfection.', 'Chmok. *gobbles* That\'s turkey for \"you are enough and your draft is enough.\"', 'Benjamin Franklin wanted me as the national bird. I lost to the eagle. Still strutting. Rejection is just backstory.', 'I strut because the alternative is standing still and I wasn\'t built for standing still. Neither were you.'] },
  // 48 – Dusk Violet
  { colorName: 'Dusk Violet', animal: '🦩', name: 'Flambe',
    messages: ['I\'m pink because of shrimp. You are what you repeatedly do. Do something good.', 'I stand in alkaline lakes that would burn your skin. Comfort zones are for species that aren\'t fabulous.', 'Chmok. It\'s pink. Everything about me is pink. Including my unconditional support.', 'My knees bend backwards and I still dance. Your limitations are not the end of grace.', 'I filter-feed upside down. The whole world looks different when you flip your perspective. Try it with that problem.'] },
  // 49 – Spruce
  { colorName: 'Spruce', animal: '🐗', name: 'Thorn',
    messages: ['I don\'t overthink it. I see the task. I charge at the task. Be more boar.', 'My tusks point upward because I was designed to dig UP, not wallow down. Dig up. Dig out.', 'Chmok. Rough and a little muddy. But absolutely from the heart.', 'I root around in muck and find truffles. The best things are buried in the messy work.', 'Thinking about charging is not charging. Thinking about starting is not starting. MOVE.'] },
  // 50 – Caramel
  { colorName: 'Caramel', animal: '🐹', name: 'Pip',
    messages: ['I can fit an insane amount in my cheeks. You can fit one task in this hour. Stuff it in.', 'I run 5 miles a night on a wheel that goes nowhere. At least your effort moves things forward. Perspective.', 'Chmok! *cheeks wobble* All that stored affection, bursting at the seams for you.', 'Small animal. Massive storage capacity. Small hour. Massive potential. See the pattern?', 'I hoard because winter comes. You plan because deadlines come. Both survival strategies. Both smart.'] },
  // 51 – Steel Blue
  { colorName: 'Steel Blue', animal: '🦈', name: 'Keel',
    messages: ['If I stop swimming, I die. A bit dramatic, but the metaphor works. Keep moving.', 'I\'ve been the same design for 400 million years because it works. Stop redesigning your approach and just swim.', 'Chmok. Sharks don\'t chmok but I also don\'t stop moving. Exceptions for you. Always.', 'I smell one drop of blood in 25 gallons. Detect the one task that matters in your ocean of noise.', 'My reputation is worse than my reality. So is that task you\'re avoiding. Bite it.'] },
  // 52 – Pomegranate
  { colorName: 'Pomegranate', animal: '🦌', name: 'Hart',
    messages: ['My antlers fall off every year and I just grow new ones. Setbacks are cosmetic.', 'I grow a new crown every spring. Heavier, bigger, better. That\'s what happens when you don\'t quit after losing one.', 'Chmok. Gentle, because antlers are pokey and I know my edges.', 'I freeze when I see headlights. Then I move. The freeze isn\'t failure. Staying frozen is. Move.', 'I can jump 10 feet from a standstill. You don\'t need a running start. You need to stop standing still.'] },
  // 53 – Sage Moss
  { colorName: 'Sage Moss', animal: '🦫', name: 'Lodge',
    messages: ['I built a dam that changed a river. Started with one stick. What\'s your one stick today?', 'My teeth never stop growing so I HAVE to gnaw. Some pressure is fuel. Use yours.', 'Chmok. Delivered wet because I live in a river and I\'m not sorry about it.', 'An engineer doesn\'t wait for the river to change. The engineer changes the river. Be the engineer.', 'My dam floods the forest on purpose. Controlled chaos creates ecosystems. Your messy process creates results.'] },
  // 54 – Hyacinth
  { colorName: 'Hyacinth', animal: '🐕', name: 'Paws',
    messages: ['I would literally die for you. The least you can do is check off one task.', 'I can hear you sigh from three rooms away. Come back. Sit. Let\'s do this together.', 'Chmok chmok chmok! *tail destroys a lamp* Collateral damage of love. I\'m not sorry.', 'When you\'re sad I put my head on your lap. When you\'re procrastinating I put my head on your keyboard. Both are interventions.', 'I don\'t understand the task but I understand you doing the task. That\'s enough. I\'m here.'] },
  // 55 – Cinnamon
  { colorName: 'Cinnamon', animal: '🐘', name: 'Rumble',
    messages: ['I never forget. You always forget. That\'s why you have this app. Use it.', 'I mourn my dead for years. I celebrate my living every day. Celebrate yourself today. Then work.', 'Chmok. Elephants are surprisingly gentle. So is this trunk-nudge toward your task list.', 'I communicate through the ground. Vibrations other animals can\'t hear. Trust what others can\'t see in you.', 'My tusks are just teeth that never stopped growing. Your skills are the same. Don\'t stop.'] },
  // 56 – Tide Pool
  { colorName: 'Tide Pool', animal: '🐟', name: 'Current',
    messages: ['I\'ve been swimming in circles and honestly it\'s fine. Progress isn\'t always linear.', 'I swim against the current because downstream is where dead fish go. Effort is the direction of life.', 'Chmok. Blub. Simple, wet, and from a creature that never stops moving.', 'Schools of fish move as one. You don\'t need a school. But you need a direction. Pick one.', 'The tide pulled me out and I swam back. Getting pulled off track doesn\'t define you. Swimming back does.'] },
  // 57 – Heather
  { colorName: 'Heather', animal: '🦙', name: 'Alma',
    messages: ['I spit when I\'m annoyed. You procrastinate. We all have coping mechanisms.', 'I carry 75 pounds uphill at 15,000 feet. Your workload is heavy. It\'s not Andes-heavy. Let\'s go.', 'Chmok. It\'s dry. Llamas don\'t do wet kisses. Standards.', 'My fleece is hypoallergenic. My advice isn\'t. You\'ll react to this: stop making it perfect and make it done.', 'I was domesticated 6,000 years ago and I STILL have attitude. Some things don\'t need to change.'] },
  // 58 – Saffron
  { colorName: 'Saffron', animal: '🐏', name: 'Ram',
    messages: ['My approach to obstacles: headbutt them repeatedly. Surprisingly effective. Try it.', 'My skull is 3 inches thick for a reason. Take the hit. Keep going. Your head is tougher than you think.', 'Chmok. Hard. Like everything I do. Tenderness through sheer force.', 'I charge downhill at 40 mph. You only need to start at 1 mph. What a luxury.', 'People think headbutting is violent. It\'s actually how I say hello. Say hello to your task.'] },
  // 59 – Ivy
  { colorName: 'Ivy', animal: '🐍', name: 'Coil',
    messages: ['I shed my skin when it doesn\'t fit anymore. Shed the old plan. Start fresh.', 'I swallow things whole because I trust my body to figure it out. Take on the whole task. You\'ll digest it.', 'Chmok. Forked tongue, double the sincerity. I mean it both ways.', 'People fear me but I only strike when provoked. Your task isn\'t provoking you. You\'re provoking yourself.', 'I wait in perfect stillness until the moment is right. But the moment IS right. So STRIKE.'] },
  // 60 – Cornflower
  { colorName: 'Cornflower', animal: '🐦', name: 'Wren',
    messages: ['I weigh less than a coin and I crossed an ocean. Your email is not that hard.', 'My song is louder than birds three times my size. Volume isn\'t about mass. It\'s about intention.', 'Chmok! Tweet tweet. Tiny delivery, enormous meaning.', 'I build a nest every year from scratch. No templates. No shortcuts. Just commitment. Start building.', 'The wind pushes me around and I fly anyway. Resistance doesn\'t mean stop. It means adjust your wings.'] },
  // 61 – Adobe
  { colorName: 'Adobe', animal: '🦏', name: 'Slate',
    messages: ['I\'m basically a tank with legs. Point me at your hardest task. I\'ll wait.', 'My eyesight is terrible so I charge based on vibration. Clarity is overrated. Feel the task and GO.', 'Chmok. It\'s a rhino kiss. You survived. Not everyone does. Be honored.', 'I\'m endangered because I\'m valuable. Your rare skills make you valuable too. Protect them. Use them.', 'My horn grows back. Your energy grows back. Spend both recklessly on things that matter.'] },
  // 62 – Lilac Haze
  { colorName: 'Lilac Haze', animal: '🐇', name: 'Wisp',
    messages: ['Quick, do the thing before your brain finds a reason not to. GO. NOW. Hi. Do it.', 'My survival strategy is pure speed. Yours is overthinking. Only one of us is still alive at the end of the field.', 'Chmok! *already gone* Wait I\'m back. Chmok again! *already gone again*', 'I zig when they expect zag. Your brain expects procrastination. Surprise it. Start NOW.', 'Three burrows, two escape routes, one plan. You only need the plan. You already have it. EXECUTE.'] },
  // 63 – Basil
  { colorName: 'Basil', animal: '🐊', name: 'Marsh',
    messages: ['Crocodiles haven\'t changed in 200 million years. Sometimes the old plan works fine.', 'Five mass extinctions and I\'m still here using the same playbook. Simple isn\'t stupid. Simple survives.', 'Chmok. 200 million years of evolution and I chose to spend this moment on you.', 'My jaw has the strongest bite on Earth but I carry my babies in my mouth with zero damage. Power and gentleness are the same skill.', 'Stop innovating. Start executing. I\'ve used the same strategy since the Triassic and I OWN this swamp.'] },
  // 64 – Butterscotch
  { colorName: 'Butterscotch', animal: '🐕‍🦺', name: 'Buddy',
    messages: ['I\'m a service dog and today I\'m in service of you not spiraling. Pick one task.', 'I was trained to detect a spiral before it starts. I\'m detecting one. Here\'s the intervention: breathe, pick one thing.', 'Chmok. Service-certified affection. Clinically proven to increase task completion by 100%.', 'My whole life is one task at a time. That\'s not a limitation, it\'s a superpower they put a vest on.', 'I don\'t get distracted because someone taught me not to. Let me teach you: eyes on the task. Good human.'] },
  // 65 – Mulberry
  { colorName: 'Mulberry', animal: '🦉', name: 'Hoot',
    messages: ['I can rotate my head 270\u00B0. Still can\'t look away from your unfinished tasks.', 'I don\'t blink often. I\'m staring at you right now. Into your soul. Your soul says \"start the task.\"', 'Chmok. Delivered at midnight because the truth hits different in the dark.', 'I swallow my prey whole and cough up what I don\'t need. Consume the task. Spit out the perfectionism.', 'Hoo. That\'s not a question. That\'s a statement. You know who. You know what. Now.'] },
  // 66 – Deep Lagoon
  { colorName: 'Deep Lagoon', animal: '🐙', name: 'Squid',
    messages: ['I squirt ink when stressed. You open new tabs. Same energy. Close the tabs.', 'My brain is shaped like a donut and I\'m still smarter than your decision to open tab #47. CLOSE THEM.', 'Chmok. From all eight arms simultaneously. Overwhelm, but make it affection.', 'I can edit my own genes. You can\'t even edit your own habits? I\'m offering solidarity and shade simultaneously.', 'I change color 177 times per hour. You change tasks 177 times per hour. Only one of us is doing it on purpose.'] },
  // 67 – Olive Gold
  { colorName: 'Olive Gold', animal: '🐿️', name: 'Sprout',
    messages: ['I accidentally plant thousands of trees by forgetting where I hid things. Chaos creates.', 'My forgetfulness literally reforests the planet. Your scattered energy might be building something you can\'t see yet.', 'Chmok! I forgot why. Oh wait. Because you matter. Remembered.', 'I panic-bury acorns and create forests. Panic-start a task. See what grows.', 'Not every seed I plant survives. The ones that do change the landscape. Plant anyway.'] },
  // 68 – Midnight Iris
  { colorName: 'Midnight Iris', animal: '🦉', name: 'Nox',
    messages: ['It\'s dark and I can see everything clearly. Sometimes you need less light, not more info.', 'Silence amplifies the signal. Turn off the noise and the answer gets loud.', 'Chmok. Silent as midnight. The quiet ones mean it the most.', 'I hunt in total darkness because I trust my ears more than my eyes. Trust your gut over your analysis.', 'More research is just procrastination wearing a lab coat. You know enough. Act.'] },
  // 69 – Marmalade
  { colorName: 'Marmalade', animal: '🐈‍⬛', name: 'Jinx',
    messages: ['I knocked something off a table today. On purpose. Sometimes destruction is progress.', 'That thing you\'re clinging to? I\'d push it off the edge. Some things need to shatter before they can be rebuilt.', 'Chmok. Then a bite. The affection and the truth come together. Deal.', 'Crossing your path is my job. Interpreting it as luck or doom is yours. Either way, you noticed. Good. Now move.', 'I sit on the thing you need most because I understand priorities better than you. The priority is attention. You have mine.'] },
  // 70 – Verdigris
  { colorName: 'Verdigris', animal: '🐸', name: 'Moss',
    messages: ['Ribbit. That\'s it. That\'s the advice. Sometimes there is no deeper meaning. Just start.', 'I can absorb water through my skin. Let today\'s lesson absorb: done beats perfect. Every time.', 'Chmok. Moist. Very moist. Like my commitment to your success.', 'I sit on a lily pad and wait for what I need to come to me. That only works if you\'re already in the pond. Get in.', 'Every frog was once a tadpole with no legs and no lungs. You\'re somewhere in that process. Keep growing limbs.'] },
  // 71 – Foxglove
  { colorName: 'Foxglove', animal: '🦊', name: 'Fable',
    messages: ['Plot twist: the task was easy the whole time. You were just scared of the title.', 'Every story needs a villain. Yours is the voice that says \"not today.\" Overrule it. I wrote a better ending.', 'Chmok. With a sly grin. Because I know the next chapter and it\'s your best one.', 'The fox in every fable wins by being creative, not strong. You don\'t need more willpower. You need a better angle.', 'Spoiler: the hero was always you. The dragon was always the task. The ending was always you winning. Skip to that part.'] },
  // 72 – Moss Agate
  { colorName: 'Moss Agate', animal: '🐢', name: 'Basalt',
    messages: ['I live to 150. There\'s time. But also, maybe start today? Just a thought.', 'My shell is made of bone fused to my spine. I carry my structure everywhere. Your habits ARE your shell. Build good ones.', 'Chmok. Slow, deliberate, and backed by 150 years of credibility.', 'I can\'t leave my shell. You can\'t leave your ADHD. But I decorated my shell and I\'m thriving. Decorate yours.', 'Geologically speaking, you\'re early to everything. Cosmically speaking, just start already.'] },
  // 73 – Petrol Blue
  { colorName: 'Petrol Blue', animal: '🐋', name: 'Echo',
    messages: ['I communicate through songs that travel 10,000 miles. You can\'t send a one-line email?', 'My song changes every year. New verse, new melody. Growth means your approach should change too.', 'Chmok. You felt that rumble in your bones. That\'s what genuine intention feels like. Now send the email.', 'I sing into empty ocean not knowing if anyone hears. You type into a journal not knowing if it helps. It does. For both of us.', 'No whale sings the same song twice. Stop copy-pasting yesterday\'s approach onto today\'s problem.'] },
  // 74 – Garnet
  { colorName: 'Garnet', animal: '🦅', name: 'Ridge',
    messages: ['I see a mouse from 2 miles away. I can also see you avoiding that task. Don\'t.', 'I don\'t circle because I\'m lost. I circle because I\'m choosing the perfect moment. Your moment is NOW.', 'Chmok. From the mountaintop. Talons retracted, respect fully extended.', 'My grip strength is 10x yours. Grab that task with that energy. Don\'t let go until it\'s done.', 'The thermal does the work. I just spread my wings. Find what lifts you and stop flapping so hard.'] },
  // 75 – Raw Umber
  { colorName: 'Raw Umber', animal: '🐂', name: 'Forge',
    messages: ['The china shop is a metaphor for your calendar. I\'m going in. Come with me.', 'I pull 8,000 pounds and don\'t complain. Your task list weighs zero pounds. I\'m judging you lovingly.', 'Chmok. It\'s a bull kiss. Strong and slightly aggressive, like honest encouragement.', 'The red cloth is a distraction. I charge at it every time. Recognize YOUR red cloths. Ignore them. Charge past.', 'Stubborn isn\'t an insult. It\'s the reason I\'ve plowed fields for 10,000 years. Be stubborn about the right things.'] },
  // 76 – Storm Violet
  { colorName: 'Storm Violet', animal: '🐆', name: 'Flash',
    messages: ['I\'m the fastest land animal- wait no that\'s cheetahs. Anyway. Speed isn\'t the point. Starting is.', 'My rosettes are nature\'s camouflage. Yours is looking busy. One of us is actually hunting. Be the leopard.', 'Chmok. Quick. Like a flash. Blink and you miss the affection but you felt it. That\'s enough.', 'I climb trees to eat in peace. Find your tree. Do deep work where nobody can reach you.', 'Cheetahs are faster but I\'m stronger and I\'m still here. Sustainability beats speed. Every time.'] },
  // 77 – Fiddlehead
  { colorName: 'Fiddlehead', animal: '🦎', name: 'Fern',
    messages: ['I change color based on my mood. Today\'s mood: productively unhinged.', 'My eyes move independently. One is watching your progress. The other is watching your excuses. Both have opinions.', 'Chmok. It changed color mid-kiss. Chaotic but committed. Like your best work.', 'I grip branches with feet that split 50/50. Hold your task with half effort and half trust. That\'s enough grip.', 'Being cold-blooded means I take my energy from the environment. Surround yourself with heat. Then move.'] },
  // 78 – Toffee
  { colorName: 'Toffee', animal: '🐻‍❄️', name: 'Frost',
    messages: ['My fur is actually transparent, not white. Things aren\'t always what they seem. Neither is that scary task.', 'I swim 60 miles without rest in freezing water. Your 25-minute focus session is a vacation by comparison.', 'Chmok. From a polar bear. The warmest thing in the Arctic and it\'s all for you.', 'My paws are built-in snowshoes. Use the tools you already have before looking for new ones.', 'I look cuddly and I\'m the deadliest bear alive. You look distracted and you\'re more capable than anyone guesses. Surprise them.'] },
  // 79 – Rain Cloud
  { colorName: 'Rain Cloud', animal: '🐬', name: 'Ripple',
    messages: ['I do flips for no reason. Joy doesn\'t need a reason. Neither does getting started.', 'I sleep with one eye open. Not because I\'m paranoid. Because I don\'t want to miss anything good. Stay alert for the good moments today.', 'Chmok! *does a barrel roll* Joy delivered with unnecessary acrobatics. As intended.', 'I play with pufferfish like toys. Your scary task? That\'s just a pufferfish. Poke it. It\'s funny, not fatal.', 'The wave doesn\'t stop to ask if it should keep going. Be the wave. Flow into the task. Don\'t negotiate.'] },
  // 80 – Bramble
  { colorName: 'Bramble', animal: '🦔', name: 'Quill',
    messages: ['I\'m small, spiky, and I get stuff done at night. We\'re not so different.', 'My spikes are baby hairs that hardened. Your defenses started soft too. It\'s okay to soften them for the right task.', 'Chmok. It\'s spiky but it\'s from the heart. My quills literally protect my heart. So this means something.', 'I eat slugs. You eat time. One of us is getting nutrition from it. Switch to the task list. Better diet.', 'I run in my wheel at 2am because energy doesn\'t wait for a convenient time. When the urge to work hits, WORK.'] },
  // 81 – Dark Moss
  { colorName: 'Dark Moss', animal: '🐊', name: 'Bayou',
    messages: ['I\'ve been lurking here for 45 minutes waiting for you to start. I\'m patient. But come on.', 'I can hold my breath for 2 hours underwater. Your focus session only needs to be 25 minutes. I\'m embarrassed for you.', 'Chmok. From a crocodile. Yes it\'s mostly teeth. But every tooth cares about you.', 'A bird is literally cleaning my teeth right now. That\'s called delegation. Delegate the unimportant. Do the essential.', 'My tears aren\'t fake. They\'re physiological. Your procrastination tears, however? Manufactured. Start.'] },
  // 82 – Fjord Blue
  { colorName: 'Fjord Blue', animal: '🐧', name: 'Fjord',
    messages: ['I walked 70 miles in a blizzard to sit on an egg. Your commute to the desk is shorter.', 'The egg doesn\'t know I\'m here but I stay anyway. The task doesn\'t know you started. Do it for the result, not the recognition.', 'Chmok. Formal, cold, dedicated. Like the best kind of work ethic.', 'I huddle with 5,000 others to survive. That\'s not weakness. That\'s engineering. Find your huddle.', 'The blizzard doesn\'t stop because I\'m cold. I stop being cold because I\'m moving. Move.'] },
  // 83 – Vermillion
  { colorName: 'Vermillion', animal: '🦜', name: 'Blitz',
    messages: ['SQUAWK. Sorry. I mean: you\'re doing great. Also SQUAWK. Do the thing.', 'I learned my owner\'s ringtone and now I ANSWER THE PHONE. If I can learn that, you can learn to just start.', 'CHMOK SQUAWK! Maximum parrot affection. You\'re drowning in it and I\'m NOT sorry.', 'I repeat myself because repetition works. START THE TASK. START THE TASK. Did it stick yet?', 'My feathers are ridiculous and I am THRIVING. Be ridiculous. Thrive. SQUAWK.'] },
  // 84 – Forest Floor
  { colorName: 'Forest Floor', animal: '🦡', name: 'Spore',
    messages: ['I dug 73 holes last night. Not all of them useful. But I was MOVING. You should too.', 'My sett has 50 rooms and I built every one in the dark. Your workspace is already lit. What\'s the holdup?', 'Chmok. Then I dug you a hole to put your doubt in. Bury it. Walk away.', 'Bad dirt happens. Rocks, roots, clay. I dig through all of it. Your obstacles are softer than clay.', 'I\'m a badger. My name literally means \"digger.\" Your name means whatever you do today. Dig something.'] },
  // 85 – Soft Amethyst
  { colorName: 'Soft Amethyst', animal: '🦋', name: 'Veil',
    messages: ['I can taste with my feet. You can start with your fingers. On the keyboard. Now.', 'My lifespan is 2 weeks and I don\'t waste a single day on \"maybe tomorrow.\" You have more time. Use it like you don\'t.', 'Chmok. Light as a butterfly wing. Heavy as the truth: today counts.', 'My wings are covered in scales so small they look like color. Beauty is made of tiny unglamorous pieces. So is your project.', 'I navigate by the sun\'s polarization. You don\'t need to understand HOW your process works. Just trust that it does.'] },
  // 86 – Amber Glow
  { colorName: 'Amber Glow', animal: '🐝', name: 'Buzz',
    messages: ['My whole colony shares one brain and we\'re still more organized than your inbox.', 'I visit 100 flowers before going home. You can visit one task before checking your phone. That\'s my minimum ask.', 'Chmok. Bzzzz. Aggressive affection from the most organized creature alive.', 'The queen doesn\'t do the work. The workers do. Be a worker today. The crown comes later.', 'I sting once and it costs me everything. Make your one action today count like that. Total commitment.'] },
  // 87 – Celadon
  { colorName: 'Celadon', animal: '🐸', name: 'Reed',
    messages: ['I eat bugs and judge no one. Except people who stare at their to-do list without doing it.', 'My croak attracts a mate from a mile away. Your effort attracts results from about the same distance. Start croaking.', 'Chmok. Ribbit. Simple. Like the next step you should take.', 'I breathe through my skin, which means everything around me becomes part of me. Surround yourself with better input.', 'Waiting for the perfect moment is how flies escape. The imperfect tongue catches more flies than the calculated one.'] },
  // 88 – Wild Berry
  { colorName: 'Wild Berry', animal: '🐻', name: 'Bramble',
    messages: ['Ate 40 lbs of salmon today. Fueled up. Your version of this is coffee. Now what?', 'I scratch my back on trees everyone else walks past. The solution is right there. You\'re just not seeing it because it looks like a tree.', 'Chmok. It\'s a big bear hug folded into a word. Unfold it when you need warmth.', 'I gained 300 lbs on purpose because winter is coming. Preparation isn\'t procrastination. But are you preparing or stalling?', 'I stand in rivers and catch what comes. Show up at your task list. The flow will deliver something.'] },
  // 89 – Artichoke
  { colorName: 'Artichoke', animal: '🦎', name: 'Inch',
    messages: ['I do pushups to communicate. What a flex. Literally. Now flex on that task list.', 'My pushups say \"I\'m here, I\'m alive, I matter.\" Do one task and say the same thing.', 'Chmok. *does 10 pushups* That\'s lizard love. Physical. Visible. Undeniable.', 'I lost my tail and kept doing pushups because identity isn\'t about what you lose. It\'s about what you keep doing.', 'Nobody taught me pushups. I just started. Nobody needs to teach you to start. Just start.'] },
  // 90 – Denim
  { colorName: 'Denim', animal: '🐺', name: 'Pack',
    messages: ['Howled at the moon. It didn\'t answer. Still felt good. Sometimes you just gotta start and see.', 'The pack eats after the hunt, not before. Earn your rest today. It tastes better that way.', 'Chmok. From the whole pack. Awooo. That\'s 12 wolves who believe in you.', 'I lead from the back so I can see everyone. Leadership isn\'t about being first. It\'s about seeing what needs to happen.', 'Lone wolf sounds romantic. It\'s actually a survival crisis. Accept help. Finish the task.'] },
  // 91 – Brick Dust
  { colorName: 'Brick Dust', animal: '🦀', name: 'Scuttle',
    messages: ['My skeleton is on the outside. Talk about having no protection from deadlines. Relate?', 'I wave my claws before a fight to look bigger than I am. Fake confidence until the real thing shows up. Works every time.', 'Chmok. *pinch* Sorry, gentleness is a learned skill. I\'m learning. For you.', 'I molt my entire skeleton to grow. Read that again. Your discomfort isn\'t a bug. It\'s the WHOLE growth mechanism.', 'I can regrow a claw I lost in a fight. You can regrow a habit you dropped last Tuesday. Neither of us is starting from zero.'] },
  // 92 – Lavender Ash
  { colorName: 'Lavender Ash', animal: '🕊️', name: 'Calm',
    messages: ['I always find my way home. Your "home" today is that one task you keep postponing.', 'My homing instinct works because I stop trying and let my body remember the way. Stop overthinking. Let your hands type.', 'Chmok. Peaceful. Like a dove should be. Like you will be after you finish one thing.', 'I carry messages through wars. I can carry your intention through this chaotic day. Give me the message: \"I will start.\"', 'Olive branches are heavy and I carry them anyway. Some symbols require effort. Peace with your task list requires effort too.'] },
  // 93 – Jade Mist
  { colorName: 'Jade Mist', animal: '🐲', name: 'Glimmer',
    messages: ['I guard treasure. Today the treasure is your time. Don\'t let anything steal it.', 'I\'ve been guarding this hoard for 3,000 years. You can guard 90 minutes of focus time. I\'m not impressed by your \"distractions.\"', 'Chmok. Dragon kisses are rare and slightly smoky. Treasure this one.', 'Every dragon chooses what to guard. Today, choose to guard your momentum. Burn anything that interrupts it.', 'The knight always comes. The deadline always comes. The treasure is whether you\'re ready. Be ready.'] },
  // 94 – Pecan
  { colorName: 'Pecan', animal: '🐿️', name: 'Cache',
    messages: ['I buried 10,000 acorns and forgot 7,400 of them. Write. Things. Down.', 'The 7,400 acorns I lost became 7,400 trees. Even failure compounds. But please, WRITE THINGS DOWN.', 'Chmok! Wait, where did I put the chmok? Found it. It was filed under \"love.\" Misfiled, but found.', 'My brain says \"I\'ll remember\" and my brain lies. Your brain does the same thing. The journal doesn\'t lie. Use it.', 'I have one job and I\'m bad at it and I STILL changed the forest. Imagine what you could do if you just tried.'] },
  // 95 – Raspberry
  { colorName: 'Raspberry', animal: '🦢', name: 'Aria',
    messages: ['I\'m graceful on water and a disaster on land. Play to your strengths today.', 'My takeoff is the ugliest 30 seconds in nature. Then I fly. Your start will be ugly too. Then you\'ll soar.', 'Chmok. Elegant, slightly wet. Swan standards remain uncompromised.', 'I mate for life because commitment isn\'t about perfection, it\'s about choosing the same thing every day. Choose the task. Again.', 'I can break a human arm with my wing. Elegance and power aren\'t opposites. Do the task with both.'] },
  // 96 – Dark Jade
  { colorName: 'Dark Jade', animal: '🐍', name: 'Jade',
    messages: ['I only eat once a month. Talk about restraint. You could try not checking your phone for 20 min.', 'I sense heat through my face. I can feel you warming up to the idea of starting. Do it before you cool down.', 'Chmok. Once. Per. Month. This is it. Don\'t waste the rare ones.', 'I unhinge my jaw to take on things bigger than my head. Sometimes you have to take on more than feels possible.', 'Minimal effort, maximum impact. I eat once and live for weeks on it. Do one deep work session. Live off the results.'] },
  // 97 – Toasted Wheat
  { colorName: 'Toasted Wheat', animal: '🐻', name: 'Grit',
    messages: ['I scratch my back on trees because I can\'t reach. Ask for help if you\'re stuck. Seriously.', 'Grizzly means \"gray\" not \"tough.\" But I made it mean tough anyway. Redefine your labels.', 'Chmok. Big, warm, and slightly clumsy. Like me. Like all good things.', 'I eat roots, berries, salmon, and garbage. Resourcefulness isn\'t glamorous but it feeds you. Use what you have.', 'My claws are 4 inches long and I use them to dig for roots. Powerful tools doing humble work. Do the humble task. You\'re not above it.'] },
  // 98 – Heron Blue
  { colorName: 'Heron Blue', animal: '🦤', name: 'Persist',
    messages: ['I\'m literally extinct and I still showed up for you today. No excuses.', 'They wrote me off 400 years ago and I\'m STILL in the conversation. Persist beyond reason. It confuses people.', 'Chmok. From beyond the grave. It\'s that powerful and that stubborn.', 'Extinction is everyone else\'s opinion of me. I\'m still in your journal. Opinions don\'t define endings. Actions do.', 'I had no natural predators until the worst one showed up: neglect. Don\'t neglect your goals. They go extinct.'] },
  // 99 – Dragon Pepper (bonus — catch-all)
  { colorName: 'Dragon Pepper', animal: '🐉', name: 'Spark',
    messages: ['I\'m a DRAGON. In a JOURNAL APP. If that\'s not motivating, nothing is. Do the thing.', 'I could level a castle but I\'m here, gently warming your motivation. Appreciate the restraint.', 'CHMOK. With fire. Sorry about your eyebrows. But you\'re LOVED and slightly singed.', 'Every legend needs a dragon. Today you\'re the knight. The dragon is the task. Plot twist: you win. Every time.', 'I hoard gold because I respect value. Your time is more valuable than gold. And you\'re spending it NOT starting? Rude.'] },
];

/** Get the companion for today's color */
export function getDailyCompanion(color: DailyColor): DailyCompanion {
  return COMPANIONS[color.index] ?? COMPANIONS[0];
}
