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
    messages: ['I hid your phone. Kidding. But imagine how much you\'d get done.', 'You look nice today. Suspiciously nice. What are you avoiding?', 'Chmok. That\'s fox for \"now open your task list.\"', 'I could outsmart you but I\'d rather just watch you outsmart your own excuses.', 'Fun fact: foxes hunt alone. You don\'t have to. But you do have to start.'] },
  // 1 – Dusty Rose
  { colorName: 'Dusty Rose', animal: '🐙', name: 'Octavia',
    messages: ['I have eight arms and even I can only do one thing at a time.', 'I\'d give you a hug but I have eight arms and it gets weird fast.', 'Chmok from tentacle #3. The others are busy organizing your priorities.', 'You\'re overthinking this. I have a beak AND eight arms and I manage fine.', 'One arm for each excuse you\'re making. I\'m running out of arms.'] },
  // 2 – Burnt Sienna
  { colorName: 'Burnt Sienna', animal: '🦝', name: 'Bandit',
    messages: ['Stole your excuses. You can have them back at 5pm.', 'Nice face. I\'d steal it if I could. Instead I\'ll steal your procrastination.', 'Chmok. Don\'t tell anyone. I have a reputation to maintain.', 'You\'re cute when you\'re pretending to be productive while reading this.', 'I\'ve robbed 47 trash cans today. You can\'t even open one email?'] },
  // 3 – Ocean Teal
  { colorName: 'Ocean Teal', animal: '🐋', name: 'Atlas',
    messages: ['I weigh 80 tons and I still showed up today.', 'Hey. You\'re doing better than you think. I can see from way down here.', 'Chmok. It\'s a 80-ton kiss. You\'ll feel it in your productivity.', 'I hold my breath for 90 minutes. You can hold your focus for 10. Probably.', 'The deep is quiet. Your brain should try it sometime. Just one task, no noise.'] },
  // 4 – Forest Sage
  { colorName: 'Forest Sage', animal: '🦉', name: 'Sage',
    messages: ['Fun fact: the first step is always the ugliest. That\'s normal.', 'You\'re smarter than you\'re acting right now. I can tell. I\'m an owl.', 'Chmok. Delivered silently at 3am like all good wisdom.', 'I rotate my whole head to look at problems. You just need to rotate your attitude.', 'I\'ve been watching you. Not in a creepy way. In a \"you\'re capable\" way.'] },
  // 5 – Dusty Lavender
  { colorName: 'Dusty Lavender', animal: '🦋', name: 'Drift',
    messages: ['I was a caterpillar last week. Things change fast. Start something.', 'You\'re already transforming. You just can\'t see it from inside the cocoon.', 'Chmok, light as a wing. Now go be something beautiful and productive.', 'I literally dissolved into goo before becoming this. Your rough draft is fine.', 'Pretty bold of you to procrastinate in front of a symbol of change.'] },
  // 6 – Golden Honey
  { colorName: 'Golden Honey', animal: '🐝', name: 'Clover',
    messages: ['I visited 2,000 flowers today and none of them were perfect. Still made honey.', 'You\'re sweet enough already. Now be productive too.', 'Chmok! Bzz. That\'s the sound of affection AND urgency.', 'I make honey and never eat it. You make plans and never follow them. We\'re both ridiculous.', 'I pollinate entire ecosystems by accident. Imagine what you could do on purpose.'] },
  // 7 – Soft Crimson
  { colorName: 'Soft Crimson', animal: '🦩', name: 'Rosie',
    messages: ['I stand on one leg all day. You can sit and do one task. We believe in each other.', 'You look great today. Almost as good as me, and I\'m literally pink.', 'Chmok. Delivered while standing on one leg because I\'m dramatic like that.', 'You\'re wobbling through life just like me. The trick is to make it look intentional.', 'I stand in water all day and still get things done. What\'s your excuse?'] },
  // 8 – Dark Teal
  { colorName: 'Dark Teal', animal: '🐢', name: 'Steady',
    messages: ['I\'ve been walking since the Jurassic period. I\'ll get there. So will you.', 'Slow and steady is not boring. It\'s strategic. Like me.', 'Chmok. It took me 20 minutes to deliver it. Worth the wait.', 'You\'re faster than me and you\'re STILL not starting? Embarrassing.', 'My shell has growth rings like a tree. Every day counts. Even this one.'] },
  // 9 – Warm Ochre
  { colorName: 'Warm Ochre', animal: '🦁', name: 'Sol',
    messages: ['Lions sleep 20 hours a day. The other 4 are terrifying. Be terrifyingly focused.', 'You have my respect. Don\'t waste it. I\'m a lion, it\'s rare.', 'Chmok. Now pretend it\'s a roar and go intimidate your to-do list.', 'I nap professionally. You procrastinate as an amateur. Know the difference.', 'My mane looks effortless. It\'s not. Neither is your day. But you\'ll manage.'] },
  // 10 – Slate Blue
  { colorName: 'Slate Blue', animal: '🐧', name: 'Tux',
    messages: ['I wore a tuxedo to this. The least you can do is open your task list.', 'You\'re looking sharp. Not tuxedo-sharp, but sharp enough to start something.', 'Chmok. Formal penguin affection. Very dignified.', 'I live in Antarctica and I\'m more consistent than you. Let that sink in.', 'I can\'t fly either but you don\'t see me moping about it. Adapt. Proceed.'] },
  // 11 – Terracotta
  { colorName: 'Terracotta', animal: '🦎', name: 'Ember',
    messages: ['If my tail falls off, I grow a new one. Your failed plan is not that serious.', 'You\'re more adaptable than you think. Trust me, I regrow body parts.', 'Chmok from my regenerating tail. It\'s new, like your fresh start today.', 'You\'re not broken, you\'re molting. There\'s a difference. Google it later, work now.', 'I change color with temperature. You change productivity with deadlines. Both valid.'] },
  // 12 – Mauve
  { colorName: 'Mauve', animal: '🐈', name: 'Velvet',
    messages: ['I knocked your perfectionism off the counter. You\'re welcome.', 'I like you. Don\'t let it go to your head. I\'m a cat, I\'ll deny it later.', 'Chmok. I\'ll bite you in 30 seconds. Enjoy it while it lasts.', 'You think you\'re independent? Cute. I invented independent. Now do your tasks independently.', 'I sat on your keyboard and somehow wrote better goals than you. Meow.'] },
  // 13 – Olive
  { colorName: 'Olive', animal: '🐸', name: 'Ribbit',
    messages: ['Today\'s vibe: chaotic good. Let\'s see what happens.', 'You\'re a beautiful mess and I respect it. Ribbit.', 'Chmok. It\'s moist. I\'m a frog. Deal with it.', 'I eat flies for breakfast and judge no one. Except you, right now, for stalling.', 'I can breathe through my skin. You can\'t even breathe through your anxiety. Try anyway.'] },
  // 14 – Soft Purple
  { colorName: 'Soft Purple', animal: '🦄', name: 'Rare',
    messages: ['I\'m literally mythical and even I think your to-do list is too long. Pick three.', 'You\'re one of the rare ones. That\'s why I\'m here and not somewhere else.', 'Chmok from a mythical creature. Frame it. Then do your tasks.', 'My horn is worth more than your entire to-do list. Pick the three things that actually matter.', 'I only appear to people who deserve it. So. You\'re welcome. Now earn it.'] },
  // 15 – Dark Gold
  { colorName: 'Dark Gold', animal: '🐕', name: 'Loyal',
    messages: ['You came back! That\'s 90% of the battle. The other 10% is typing something.', 'You came back and that makes my tail wag so hard I might fall over.', 'Chmok chmok chmok! Sorry, I\'m a dog, I don\'t know when to stop.', 'I fetched your motivation. It was under the couch. You\'re welcome.', 'I believe in you unconditionally. Like, medically. I can\'t stop. It\'s a dog thing.'] },
  // 16 – Storm Blue
  { colorName: 'Storm Blue', animal: '🐬', name: 'Echo',
    messages: ['Echolocation update: your next task is directly ahead. Swim toward it.', 'Your brain is doing its best sonar impression. Let me help you focus the signal.', 'Chmok! *splash* Sorry, I\'m wet. Dolphins are always wet.', 'I\'m literally one of the smartest animals alive and even I need a pod. Ask for help.', 'I use echolocation, not procrastination. One of us is doing it wrong.'] },
  // 17 – Deep Sage
  { colorName: 'Deep Sage', animal: '🦔', name: 'Thistle',
    messages: ['I curled into a ball once. Then I uncurled and ate a bug. Momentum is weird.', 'You\'re cute. Spiky, but cute. Like me. Now do something with all that energy.', 'Chmok. Careful though, I have 5,000 quills. Affection is dangerous.', 'I\'m tiny and covered in needles and I still face the world every night. Your turn.', 'Curling into a ball is valid self-care. But then you gotta uncurl and do the thing.'] },
  // 18 – Rust
  { colorName: 'Rust', animal: '🦀', name: 'Snap',
    messages: ['I walk sideways and I still make progress. Direction is overrated. Just move.', 'Straight to the point: you\'re great and you need to start. Pinch.', 'Chmok. Clack clack. That\'s crab for \"I care about you AND your deadlines.\"', 'You think YOU walk in weird directions? I go sideways everywhere and I\'m thriving.', 'My claws are for hugs. Aggressive, slightly painful hugs. Like honest feedback.'] },
  // 19 – Periwinkle
  { colorName: 'Periwinkle', animal: '🐰', name: 'Scout',
    messages: ['My attention span is shorter than yours and I built a whole warren. Start small.', 'You\'re fast when you want to be. I\'ve seen it. Now want to be.', 'Chmok! *thump thump* That\'s my foot telling you you\'re appreciated.', 'My attention span is literally 3 seconds and LOOK what I\'ve built. Get moving.', 'I have 40 babies a year. You have like 4 tasks. Perspective.'] },
  // 20 – Copper
  { colorName: 'Copper', animal: '🦅', name: 'Vista',
    messages: ['From up here, your problems look very small. They probably are. Go handle them.', 'I see great things in your future. Literally. Eagle eyes. It\'s right there. Go.', 'Chmok from above. Like a blessing but with talons.', 'You\'re soaring, actually. You just think you\'re falling because you looked down.', 'I eat things bigger than me. Your task list doesn\'t scare me. Should it scare you?'] },
  // 21 – Moss
  { colorName: 'Moss', animal: '🐊', name: 'Still',
    messages: ['I haven\'t moved in three hours and that\'s called a strategy. What\'s your excuse?', 'I respect your patience. Now stop being patient and actually do something.', 'Chmok. You didn\'t see it coming. That\'s kind of my whole thing.', 'I\'ve been pretending to be a log for an hour. At least I\'m committed to something.', 'My strategy looks like laziness until the last second. Yours just IS laziness. Fix that.'] },
  // 22 – Plum
  { colorName: 'Plum', animal: '🦜', name: 'Chatter',
    messages: ['HELLO. I learned to talk just to tell you to stop scrolling and start doing.', 'HEY. You\'re GORGEOUS. Now STOP preening and START working. SQUAWK.', 'Chmok! Repeated back to you twelve times because that\'s what I do.', 'I\'m loud, colorful, and right about everything. Today\'s truth: just start.', 'I can learn 800 words. None of them are \"later.\" Think about that.'] },
  // 23 – Tangerine
  { colorName: 'Tangerine', animal: '🐻', name: 'Maple',
    messages: ['I just woke up from a 5-month nap. What did I miss? Oh, you haven\'t started either?', 'Good morning. Or whatever. Time is fake. But your tasks aren\'t.', 'Chmok. It\'s a sleepy bear kiss. Heavy but warm.', 'I hibernate for 5 months and I\'m STILL more rested than you. Go to bed tonight. But first: tasks.', 'I\'m grumpy before noon. You\'re grumpy before coffee. We\'re the same creature.'] },
  // 24 – Iris
  { colorName: 'Iris', animal: '🦚', name: 'Plume',
    messages: ['I grew all these feathers just to stand here. Sometimes showing up IS the whole thing.', 'Looking good today. Not as good as me, obviously, but respectable.', 'Chmok, darling. Displayed with all 200 feathers fanned out because I\'m EXTRA.', 'My beauty is a distraction technique. Your phone is a distraction technique. Only one of us is honest about it.', 'I\'m gorgeous AND functional. You\'re at least one of those. Prove which.'] },
  // 25 – Pine
  { colorName: 'Pine', animal: '🐺', name: 'North',
    messages: ['The pack doesn\'t wait for motivation. They just run. Run with me.', 'The pack runs together. Today, I run with you. Let\'s go.', 'Chmok. Wolves don\'t do chmok. But for you, exception.', 'I howl at the moon knowing it won\'t answer. You email your boss knowing the same. Solidarity.', 'Discipline isn\'t punishment. It\'s what the pack does to survive. Now survive this task list.'] },
  // 26 – Rosewood
  { colorName: 'Rosewood', animal: '🦢', name: 'Grace',
    messages: ['I look elegant but I\'m paddling like crazy underwater. Relatable? Start paddling.', 'You look calm on the surface. I know you\'re paddling like crazy. Same, bestie.', 'Chmok. Delivered with elegance and concealed panic.', 'Grace under pressure is my entire brand. Steal it. It\'s free.', 'My neck is ridiculous and I still carry myself with dignity. You can do hard things gracefully.'] },
  // 27 – Bronze Gold
  { colorName: 'Bronze Gold', animal: '🐝', name: 'Nectar',
    messages: ['Your brain is a superpower that forgot its own instructions. Write them down.', 'Your brain is incredible. It just needs an instruction manual. That\'s what this journal is for.', 'Chmok from the hive mind. We all voted. It was unanimous.', 'I build hexagons. They\'re the most efficient shape. Your task list should be that elegant.', 'Honey never spoils. Neither does a good system. Build one today.'] },
  // 28 – Dusk Blue
  { colorName: 'Dusk Blue', animal: '🐋', name: 'Deep',
    messages: ['I dive 2,000 meters on one breath. You can do 20 minutes on one task. Probably.', 'The surface is noisy. Come down here where it\'s quiet and do one thing well.', 'Chmok. It echoed through the whole ocean. You\'re that important.', 'I hold my breath longer than you hold your attention. Let\'s work on that together.', 'Deep water doesn\'t panic. Be deep water. Then do the task.'] },
  // 29 – Fern
  { colorName: 'Fern', animal: '🦥', name: 'Lull',
    messages: ['I move at 0.15 mph. Still faster than thinking about starting without starting.', 'Moving slowly is not the same as not moving. You\'re doing fine. Slowly.', 'Chmok. I\'ll deliver it next week at this speed. Worth the wait.', 'I\'m literally the world\'s chillest animal and even I think you should start now.', 'I hang upside down because it works for me. Find what works for you. Then do it.'] },
  // 30 – Driftwood
  { colorName: 'Driftwood', animal: '🦦', name: 'Otter',
    messages: ['I hold hands while I sleep so I don\'t drift apart. Hold onto your task list today.', 'Come here. Let\'s hold hands and float through this task list together.', 'Chmok! *grabs your hand* Otters hold hands so we don\'t drift. I\'m holding yours today.', 'I crack shells on my belly and it\'s adorable. Crack open that to-do list. Also adorable.', 'You\'re my favorite rock. I\'m keeping you. Now do your tasks or I\'ll float away.'] },
  // 31 – Seafoam
  { colorName: 'Seafoam', animal: '🐠', name: 'Finley',
    messages: ['My memory is 3 seconds and I\'m still vibing. Write stuff down and join me.', 'Wait, what were we talking about? Oh right. You\'re awesome. Blub.', 'Chmok blub blub. I already forgot I said that. But I meant it.', 'My memory resets every 3 seconds and I\'m STILL happier than you. Food for thought.', 'Just keep swimming, just keep- oh look a task. Do the task. What task?'] },
  // 32 – Burnt Honey
  { colorName: 'Burnt Honey', animal: '🐨', name: 'Haze',
    messages: ['I sleep 22 hours a day but when I\'m awake, I COMMIT. Channel that energy.', 'I\'m awake for you. Do you know how much that means? I sleep 22 hours.', 'Chmok. *immediately falls asleep* That\'s koala affection. Brief but genuine.', 'You and I have the same energy levels. The difference is I own it.', 'I eat eucalyptus, which is basically poison, and I\'m fine. You can handle one hard task.'] },
  // 33 – Thistle Bloom
  { colorName: 'Thistle Bloom', animal: '🦡', name: 'Burrow',
    messages: ['Honey badger don\'t care about your anxiety. Honey badger does the thing anyway.', 'You\'re tougher than you think. Honey badger certified.', 'Chmok. I don\'t care if it\'s weird. Honey badger doesn\'t care about anything.', 'I fought a cobra yesterday. Your inbox is not that venomous. Probably.', 'Fear is just a suggestion and I\'m great at ignoring suggestions. Join me.'] },
  // 34 – Juniper
  { colorName: 'Juniper', animal: '🐿️', name: 'Stash',
    messages: ['I forget where I put 74% of my acorns. That\'s why I write everything down. Hint hint.', 'You\'re a genius with a filing problem. Sound familiar? Same.', 'Chmok! I hid it somewhere for later. Oh no. Anyway.', 'I\'m organized in a way only I understand. You\'re the same. Embrace the chaos, but write it down.', 'My cheeks are full of plans. Yours are full of excuses. Let\'s swap.'] },
  // 35 – Sunset Clay
  { colorName: 'Sunset Clay', animal: '🦘', name: 'Leap',
    messages: ['Fun fact: I can\'t walk backwards. Only forward. Today that\'s the whole philosophy.', 'Forward is the only direction that matters. I\'m literally built for it.', 'Chmok! *bounces away* Sorry, I can\'t stay still. Neither should you.', 'I keep a whole baby in my pocket. You can keep one task in your brain. Probably.', 'You can\'t bounce backwards. Metaphorically. So stop trying to undo and just GO.'] },
  // 36 – Twilight
  { colorName: 'Twilight', animal: '🦇', name: 'Dusk',
    messages: ['I navigate by screaming into the void and listening. That\'s basically journaling.', 'You\'re braver than you think. I hang upside down ALL DAY and I\'m fine.', 'Chmok. Delivered at ultrasonic frequency. You felt it even if you didn\'t hear it.', 'Screaming into the void is my commute. Journaling is yours. Both are productive.', 'I navigate in total darkness. You have a screen, a plan, and coffee. You\'re overprepared.'] },
  // 37 – Eucalyptus
  { colorName: 'Eucalyptus', animal: '🐼', name: 'Bao',
    messages: ['My entire job is eating and being cute. Yours is slightly harder. But just slightly.', 'You\'re doing great. Not panda-level cute, but great.', 'Chmok. *rolls over and falls off branch* I meant to do that.', 'I\'m endangered and still showing up. Your excuses are endangered too. Good.', 'I eat bamboo 14 hours a day and that\'s called dedication. What do you call yours?'] },
  // 38 – Cranberry
  { colorName: 'Cranberry', animal: '🦞', name: 'Pinch',
    messages: ['I literally shed my entire body to grow. Change is uncomfortable but that\'s the gig.', 'Growth hurts. I literally rip my skeleton off to get bigger. Your discomfort is valid.', 'Chmok. Careful, I pinch the ones I love. It\'s complicated.', 'My shell doesn\'t fit anymore. That\'s a GOOD thing. Outgrow your old patterns today.', 'I\'m dramatic about change and I\'m not sorry. Be dramatic. Then be productive.'] },
  // 39 – Lichen
  { colorName: 'Lichen', animal: '🐌', name: 'Trace',
    messages: ['I carry my house on my back. You can carry one task to completion. Let\'s go.', 'Home is wherever you are. Literally. I carry mine. Yours is this journal.', 'Chmok. Delivered at trail pace. Slow, shiny, meaningful.', 'I leave a trail everywhere I go. Make sure yours leads somewhere today.', 'People think I\'m slow. I\'m not slow, I\'m thorough. There\'s a difference. Claim it.'] },
  // 40 – Arctic Slate
  { colorName: 'Arctic Slate', animal: '🐳', name: 'Swell',
    messages: ['My heart beats 8 times a minute. Take a breath. Then do the thing. Then breathe again.', 'Breathe. Your heart doesn\'t need to race. Mine does 8 beats a minute and I\'m massive.', 'Chmok. You felt the vibration from 100 miles away. That\'s whale love.', 'I\'m the biggest thing on Earth and I\'m telling you: your problem is small. Handle it.', 'My heartbeat is calm. Yours should be too. After you do the task.'] },
  // 41 – Cayenne
  { colorName: 'Cayenne', animal: '🐉', name: 'Blaze',
    messages: ['I breathe fire and I\'m telling you: that task is not as scary as a dragon. Go.', 'You\'re fire. Not like me fire, but like, metaphorical fire. Which is still cool.', 'Chmok. Warm. Very warm. Okay slightly scorching. Sorry.', 'I could burn this whole place down but instead I\'m here helping you journal. You\'re welcome.', 'Breathe fire at your problems. Or at least breathe near them. Lukewarm counts.'] },
  // 42 – Wisteria
  { colorName: 'Wisteria', animal: '🦧', name: 'Oakley',
    messages: ['I share 97% of your DNA and 100% of your tendency to procrastinate. Let\'s fight it together.', 'We\'re practically cousins, genetically. I\'m rooting for you, family.', 'Chmok. With 97% the same DNA, this is basically self-love for both of us.', 'I swing from trees to avoid responsibilities. You scroll your phone. Same primate energy.', 'My arms are longer than yours and even I can\'t reach my potential without trying.'] },
  // 43 – Turmeric
  { colorName: 'Turmeric', animal: '🐓', name: 'Crow',
    messages: ['I screamed at 5am for no reason. At least your task list has reasons. Open it.', 'Rise and grind. I\'ve been up since before the sun. Where have YOU been?', 'Chmok. Wait no, I pecked you. Same thing. COCK-A-DOODLE-DO.', 'I\'m annoying on purpose. It\'s my job. Your job is the task list. We both know it.', 'Nobody asked me to scream at dawn. I do it because I\'m committed. Be committed.'] },
  // 44 – Dried Rose
  { colorName: 'Dried Rose', animal: '🐑', name: 'Woolly',
    messages: ['People count me to fall asleep. Ironic, because today I\'m here to wake you up.', 'You counted me last night. I noticed. Now I\'m counting on you today.', 'Chmok. Soft and woolly. Like a cloud but with accountability.', 'My wool keeps growing whether I want it to or not. So does your task list. Shear it.', 'I follow the flock. Today the flock is going toward productivity. Baa. Let\'s go.'] },
  // 45 – Clover Field
  { colorName: 'Clover Field', animal: '🐄', name: 'Meadow',
    messages: ['I have four stomachs and still only eat one thing. Focus isn\'t my problem. Is it yours?', 'I chew things over. Literally, four times. Think twice, then do. That\'s the move.', 'Chmok. Moo. That\'s the whole thing.', 'I stare at fields all day and I\'m more focused than you. Take the L and start working.', 'Four stomachs, one purpose. You have one stomach. Pick one task. Math checks out.'] },
  // 46 – Harbor Blue
  { colorName: 'Harbor Blue', animal: '🦑', name: 'Ink',
    messages: ['I have three hearts. One of them is rooting for you. The other two are also rooting for you.', 'All three of my hearts are rooting for you. That\'s a lot of cardiovascular support.', 'Chmok. Times three. One per heart.', 'I squirt ink when scared. You close the app when scared. At least I make art.', 'My blood is blue. My mood is supportive. My patience is finite. Start.'] },
  // 47 – Paprika
  { colorName: 'Paprika', animal: '🦃', name: 'Strut',
    messages: ['I can\'t fly but I still strut. Do the task badly and with confidence.', 'You\'re beautiful even when you can\'t fly. Especially then.', 'Chmok. *gobbles* That\'s turkey for \"I adore you and your potential.\"', 'I strut around like I own the place and I can\'t even get off the ground. Be delusional. It works.', 'Confidence isn\'t about ability. I\'m proof. Now strut toward your tasks.'] },
  // 48 – Dusk Violet
  { colorName: 'Dusk Violet', animal: '🦩', name: 'Flambe',
    messages: ['I\'m pink because of shrimp. You are what you repeatedly do. Do something good.', 'You are what you do. Today, do something you\'d be proud of.', 'Chmok. It\'s pink. Everything about me is pink. Including my affection.', 'My whole identity is built on what I eat. Yours is built on what you do. No pressure.', 'I stand on one leg to conserve energy. You should conserve yours for the important stuff.'] },
  // 49 – Spruce
  { colorName: 'Spruce', animal: '🐗', name: 'Thorn',
    messages: ['I don\'t overthink it. I see the task. I charge at the task. Be more boar.', 'Stop thinking. Start charging. I didn\'t become a boar by being careful.', 'Chmok. Rough and a little muddy. But heartfelt.', 'You\'re overthinking the approach angle. Just CHARGE. Adjust mid-sprint.', 'I root around in dirt all day and find treasures. Dig into that task. Something good is in there.'] },
  // 50 – Caramel
  { colorName: 'Caramel', animal: '🐹', name: 'Pip',
    messages: ['I can fit an insane amount in my cheeks. You can fit one task in this hour. Stuff it in.', 'You can fit more in your day than you think. I\'d know. Look at my cheeks.', 'Chmok! *cheeks wobble* All that stored affection, just for you.', 'I\'m tiny, I hoard snacks, and I run on pure chaos energy. You relate. I know you relate.', 'My cheeks are at capacity. Your task list doesn\'t have to be. Pick one and go.'] },
  // 51 – Steel Blue
  { colorName: 'Steel Blue', animal: '🦈', name: 'Keel',
    messages: ['If I stop swimming, I die. A bit dramatic, but the metaphor works. Keep moving.', 'Keep swimming. Not because it\'s deep, but because that\'s how you\'re built.', 'Chmok. Sharks don\'t chmok. But I\'ll make an exception for you.', 'I have rows of teeth I\'ll never use and I\'m still the apex predator. Unused potential is still potential.', 'Everyone\'s scared of me but I\'m just trying to swim. Relatable? Start swimming.'] },
  // 52 – Pomegranate
  { colorName: 'Pomegranate', animal: '🦌', name: 'Hart',
    messages: ['My antlers fall off every year and I just grow new ones. Setbacks are cosmetic.', 'You\'re resilient. I literally regrow a crown every year. Takes one to know one.', 'Chmok. Gentle, because antlers are pokey and I\'m self-aware.', 'Every fall, I lose everything. Every spring, I come back better. You\'re in your spring.', 'I look majestic in the forest. You\'d look majestic finishing that task. Trust me.'] },
  // 53 – Sage Moss
  { colorName: 'Sage Moss', animal: '🦫', name: 'Lodge',
    messages: ['I built a dam that changed a river. Started with one stick. What\'s your one stick today?', 'One stick at a time. That\'s how you build anything worth building.', 'Chmok. Delivered wet because I live in a river. It\'s a beaver thing.', 'I chew through trees for a living. Your problems are softer than wood. Chew through them.', 'My dam looks messy but it works perfectly. Your process can be messy too.'] },
  // 54 – Hyacinth
  { colorName: 'Hyacinth', animal: '🐕', name: 'Paws',
    messages: ['I would literally die for you. The least you can do is check off one task.', 'I love you. That\'s it. That\'s the message. Now do your tasks, I\'ll be right here.', 'Chmok chmok chmok! *tail destroys a lamp* Sorry. I just love you that much.', 'I learned \"sit\" and \"stay.\" You can learn \"start\" and \"finish.\" Same energy.', 'I\'d follow you anywhere. Even into productivity. Especially into productivity.'] },
  // 55 – Cinnamon
  { colorName: 'Cinnamon', animal: '🐘', name: 'Rumble',
    messages: ['I never forget. You always forget. That\'s why you have this app. Use it.', 'I remembered every task on your list. Yes, even THAT one. Don\'t pretend you forgot.', 'Chmok. Elephants are surprisingly gentle. So is this nudge to get moving.', 'My memory is legendary and I still write things in the dirt. Use your journal.', 'I\'m enormous and graceful. You can be overwhelmed and productive. Both things are real.'] },
  // 56 – Tide Pool
  { colorName: 'Tide Pool', animal: '🐟', name: 'Current',
    messages: ['I\'ve been swimming in circles and honestly it\'s fine. Progress isn\'t always linear.', 'Circles are progress when you\'re getting stronger each lap. Keep going.', 'Chmok. Blub. I\'m a fish, that\'s all I\'ve got. But I mean it.', 'I swim in circles and call it exercise. You call it procrastination. Rebrand it.', 'The current takes me where I need to go. Your task list is your current. Trust it.'] },
  // 57 – Heather
  { colorName: 'Heather', animal: '🦙', name: 'Alma',
    messages: ['I spit when I\'m annoyed. You procrastinate. We all have coping mechanisms.', 'I like you. Don\'t make me spit on you. Just do the thing.', 'Chmok. It\'s dry. Llamas don\'t have wet kisses. Be grateful.', 'My coping mechanism is spitting. Yours is avoidance. At least mine is honest.', 'I carry heavy loads uphill for a living. Your workload is metaphorically lighter. Literally carry on.'] },
  // 58 – Saffron
  { colorName: 'Saffron', animal: '🐏', name: 'Ram',
    messages: ['My approach to obstacles: headbutt them repeatedly. Surprisingly effective. Try it.', 'You\'ve got a thick skull. I mean that as a compliment. Use it. Headbutt the day.', 'Chmok. Hard. Like everything I do. Affectionately aggressive.', 'I don\'t go around obstacles. I go through them. Try it. It\'s liberating.', 'My horns grow back every year. Your courage can too. Charge.'] },
  // 59 – Ivy
  { colorName: 'Ivy', animal: '🐍', name: 'Coil',
    messages: ['I shed my skin when it doesn\'t fit anymore. Shed the old plan. Start fresh.', 'Fresh skin. Fresh day. Fresh start. Shed the old and slither forward.', 'Chmok. Forked tongue, double the affection.', 'I shed my entire identity regularly. You can\'t even shed a bad habit? Come on.', 'I\'m cold-blooded and I\'m still warmer than your excuses.'] },
  // 60 – Cornflower
  { colorName: 'Cornflower', animal: '🐦', name: 'Wren',
    messages: ['I weigh less than a coin and I crossed an ocean. Your email is not that hard.', 'Tiny but mighty. Like your next step. Just take it.', 'Chmok! Tweet tweet. Small but full of heart.', 'I flew across an actual ocean weighing almost nothing. Your task weighs even less. Fly.', 'I\'m the size of a thumb and I migrated 5,000 miles. Scale is irrelevant. Just start.'] },
  // 61 – Adobe
  { colorName: 'Adobe', animal: '🦏', name: 'Slate',
    messages: ['I\'m basically a tank with legs. Point me at your hardest task. I\'ll wait.', 'I\'m a tank with feelings. Today I feel like you should do your tasks.', 'Chmok. It\'s a rhino kiss. Heavy and unavoidable, like your deadline.', 'My horn is made of the same stuff as your fingernails. You\'re tougher than you think.', 'I charge at problems at 35 mph. You can at least walk toward yours.'] },
  // 62 – Lilac Haze
  { colorName: 'Lilac Haze', animal: '🐇', name: 'Wisp',
    messages: ['Quick, do the thing before your brain finds a reason not to. GO. NOW. Hi. Do it.', 'You\'re fast. You\'re smart. You\'re stalling. STOP STALLING.', 'Chmok! *already gone* Wait I\'m back. Chmok again! *gone*', 'I made three burrows before breakfast. What have you done? Don\'t answer. Just start.', 'My impulse control is zero and I\'m still more productive than you right now. Ouch.'] },
  // 63 – Basil
  { colorName: 'Basil', animal: '🐊', name: 'Marsh',
    messages: ['Crocodiles haven\'t changed in 200 million years. Sometimes the old plan works fine.', 'The classics work. Stop reinventing the wheel. Just start rolling.', 'Chmok. 200 million years of evolution led to this kiss. You\'re welcome.', 'I\'ve survived five mass extinctions. You can survive one Monday.', 'My approach hasn\'t changed since the dinosaurs because it WORKS. Simple beats clever.'] },
  // 64 – Butterscotch
  { colorName: 'Butterscotch', animal: '🐕‍🦺', name: 'Buddy',
    messages: ['I\'m a service dog and today I\'m in service of you not spiraling. Pick one task.', 'I\'m here. You\'re here. The spiral stops now. One task.', 'Chmok. Service-certified affection. Doctor-recommended.', 'I\'m trained to detect spiraling. I\'m detecting it. Hey. Look at me. One. Task.', 'My vest says I\'m working. Where\'s your vest? Metaphorically. Get to work.'] },
  // 65 – Mulberry
  { colorName: 'Mulberry', animal: '🦉', name: 'Hoot',
    messages: ['I can rotate my head 270°. Still can\'t look away from your unfinished tasks.', 'I see you. All 270 degrees of you. Including the part that\'s hiding from work.', 'Chmok. Delivered at midnight because I\'m an owl and that\'s when I\'m most sincere.', 'I can\'t turn my eyeballs so I rotate my whole head. Commitment looks different for everyone.', 'Hoo. That\'s owl for \"I believe in you but also you\'re testing my patience.\"'] },
  // 66 – Deep Lagoon
  { colorName: 'Deep Lagoon', animal: '🐙', name: 'Squid',
    messages: ['I squirt ink when stressed. You open new tabs. Same energy. Close the tabs.', 'Close the tabs. CLOSE THEM. I\'m not inking up in here because of your 47 tabs.', 'Chmok. From all eight arms simultaneously. It\'s overwhelming and that\'s the point.', 'My brain is donut-shaped. Yours is making donut-shaped decisions. Focus.', 'I have three hearts, blue blood, and nine brains. Still can\'t figure out why you won\'t start.'] },
  // 67 – Olive Gold
  { colorName: 'Olive Gold', animal: '🐿️', name: 'Sprout',
    messages: ['I accidentally plant thousands of trees by forgetting where I hid things. Chaos creates.', 'Every accident is an opportunity. I\'m a squirrel, I know things.', 'Chmok! I forgot why. But it felt right.', 'I plant forests by being forgetful. Imagine what you could create by being intentional.', 'My chaos built an ecosystem. Your chaos could build something too. Channel it.'] },
  // 68 – Midnight Iris
  { colorName: 'Midnight Iris', animal: '🦉', name: 'Nox',
    messages: ['It\'s dark and I can see everything clearly. Sometimes you need less light, not more info.', 'I see clearly in the dark. Let me tell you: you\'re doing better than you think.', 'Chmok. Silent as midnight. You deserved a quiet, sincere one.', 'Too much information is just noise. Turn off the extra and listen for the one thing that matters.', 'The darkness isn\'t scary. It\'s just quiet. Work in the quiet.'] },
  // 69 – Marmalade
  { colorName: 'Marmalade', animal: '🐈‍⬛', name: 'Jinx',
    messages: ['I knocked something off a table today. On purpose. Sometimes destruction is progress.', 'I broke that on purpose to teach you about impermanence. You\'re welcome.', 'Chmok. Then a bite. It\'s a package deal with black cats.', 'Crossing your path means good luck, actually. The luck is that I\'m here to bother you into action.', 'I destroy things beautifully. You should destroy your procrastination with the same elegance.'] },
  // 70 – Verdigris
  { colorName: 'Verdigris', animal: '🐸', name: 'Moss',
    messages: ['Ribbit. That\'s it. That\'s the advice. Sometimes there is no deeper meaning. Just start.', 'Not everything needs a meaning. Some things just need doing. Ribbit.', 'Chmok. Moist. Very moist. I\'m a frog, what did you expect?', 'I sit on a lily pad and contemplate nothing. You should contemplate one task. Then do it.', 'Ribbit ribbit. Translation: stop waiting for inspiration and just move.'] },
  // 71 – Foxglove
  { colorName: 'Foxglove', animal: '🦊', name: 'Fable',
    messages: ['Plot twist: the task was easy the whole time. You were just scared of the title.', 'The scary part is always fiction. The doing part is always real. I\'m a fox, I know plots.', 'Chmok. With a sly grin. Because I know you\'re about to do something great.', 'I\'ve read your story. The plot twist is that you were capable the whole time.', 'Fear is the boring part of the story. Skip to the action scene.'] },
  // 72 – Moss Agate
  { colorName: 'Moss Agate', animal: '🐢', name: 'Basalt',
    messages: ['I live to 150. There\'s time. But also, maybe start today? Just a thought.', 'You\'re early. Geologically speaking. There\'s time for everything.', 'Chmok. Slow, deliberate, and 150 years in the making.', 'I started slow and I\'ll outlive everything in this app. Pace yourself, but START yourself.', 'Patience isn\'t waiting. It\'s doing things slowly on purpose. Big difference.'] },
  // 73 – Petrol Blue
  { colorName: 'Petrol Blue', animal: '🐋', name: 'Drift',
    messages: ['I communicate through songs that travel 10,000 miles. You can\'t send a one-line email?', 'My song reaches across oceans. This message reaches across your procrastination. Same energy.', 'Chmok. You felt that rumble in your bones. That\'s 10,000 miles of whale love.', 'I sing and the whole ocean listens. You type and your future self thanks you. Same magic.', 'Communication is my superpower. Yours is doing the task. Use your power.'] },
  // 74 – Garnet
  { colorName: 'Garnet', animal: '🦅', name: 'Ridge',
    messages: ['I see a mouse from 2 miles away. I can also see you avoiding that task. Don\'t.', 'I spotted you avoiding that task from two miles away. My eyes don\'t lie.', 'Chmok. From the mountain. With talons retracted, obviously. I\'m not a monster.', 'I soar effortlessly but it took years to learn. Your productivity will too. Start the training.', 'Eagle-eye assessment: you\'re ready. The only one who doesn\'t see it is you.'] },
  // 75 – Raw Umber
  { colorName: 'Raw Umber', animal: '🐂', name: 'Forge',
    messages: ['The china shop is a metaphor for your calendar. I\'m going in. Come with me.', 'Your calendar doesn\'t stand a chance. I\'m going in with you.', 'Chmok. It\'s a bull kiss. Strong, slightly aggressive, undeniably affectionate.', 'I see red and I charge. Your task list isn\'t even red. Why are you scared?', 'The china shop survived. Barely. Your task list will survive you tackling it. Barely. Go.'] },
  // 76 – Storm Violet
  { colorName: 'Storm Violet', animal: '🐆', name: 'Flash',
    messages: ['I\'m the fastest land animal- wait no that\'s cheetahs. Anyway. Speed isn\'t the point. Starting is.', 'You\'re fast enough. The speed was never the problem. Starting is the problem.', 'Chmok. Quick. Like a flash. Because I don\'t do anything slowly.', 'I\'m a leopard, not a cheetah, and I STILL don\'t care about the difference. Neither should you. Just run.', 'Spots are just birthmarks that look cool. Your quirks are features too.'] },
  // 77 – Fiddlehead
  { colorName: 'Fiddlehead', animal: '🦎', name: 'Fern',
    messages: ['I change color based on my mood. Today\'s mood: productively unhinged.', 'My mood is: ready. My color is: whatever I want. Today\'s vibe is GO.', 'Chmok. It changed color mid-kiss. I\'m unpredictable like that.', 'I match my environment. Right now my environment is productivity. Match me.', 'Being unhinged is underrated. Productively unhinged is a superpower.'] },
  // 78 – Toffee
  { colorName: 'Toffee', animal: '🐻‍❄️', name: 'Frost',
    messages: ['My fur is actually transparent, not white. Things aren\'t always what they seem. Neither is that scary task.', 'Things look scary? Look closer. Half the scary is just lighting.', 'Chmok. From a polar bear. The warmest cold kiss you\'ll ever get.', 'My fur is transparent and I\'m still iconic. Fake it till you make it is REAL advice.', 'I swim in Arctic waters for fun. Your task list is room temperature. Get in.'] },
  // 79 – Rain Cloud
  { colorName: 'Rain Cloud', animal: '🐬', name: 'Ripple',
    messages: ['I do flips for no reason. Joy doesn\'t need a reason. Neither does getting started.', 'Flip! For no reason! Joy first, justification later.', 'Chmok! *does a barrel roll* Dolphins express love athletically.', 'I do tricks because it\'s fun, not because someone trained me. Do your task because it\'s yours.', 'The ocean is vast and I choose to play in it. Your day is vast. Choose to play.'] },
  // 80 – Bramble
  { colorName: 'Bramble', animal: '🦔', name: 'Quill',
    messages: ['I\'m small, spiky, and I get stuff done at night. We\'re not so different.', 'Night shift crew represent. We do our best work when nobody\'s watching.', 'Chmok. It\'s spiky but it\'s from the heart. Literally my quills are near my heart.', 'I\'m small, I\'m pointy, and I eat slugs. We all have unglamorous strengths. Use yours.', 'I curl up when threatened but that\'s rest, not defeat. Curl, rest, uncurl, go.'] },
  // 81 – Dark Moss
  { colorName: 'Dark Moss', animal: '🐊', name: 'Bayou',
    messages: ['I\'ve been lurking here for 45 minutes waiting for you to start. I\'m patient. But come on.', 'I\'ve been watching. Waiting. You\'re ready. Don\'t make me wait longer.', 'Chmok. From a crocodile. Yes it\'s mostly teeth. But the intention is pure.', 'I\'ve been still so long a bird landed on me. Your procrastination is that obvious too.', 'My patience is legendary but it\'s not infinite. Neither is your deadline.'] },
  // 82 – Fjord Blue
  { colorName: 'Fjord Blue', animal: '🐧', name: 'Fjord',
    messages: ['I walked 70 miles in a blizzard to sit on an egg. Your commute to the desk is shorter.', 'If I can waddle 70 miles for an egg, you can waddle to your desk.', 'Chmok. Formal, cold, dedicated. Like everything I do.', 'My dedication looks insane to outsiders. So does yours. That\'s how you know it matters.', 'I huddle with others to survive. You don\'t have to do this alone either.'] },
  // 83 – Vermillion
  { colorName: 'Vermillion', animal: '🦜', name: 'Blitz',
    messages: ['SQUAWK. Sorry. I mean: you\'re doing great. Also SQUAWK. Do the thing.', 'SQUAWK means \"I love you\" and also \"START WORKING.\" Context is everything.', 'CHMOK SQUAWK! That\'s maximum parrot affection. You\'re drowning in it.', 'I\'m chaotic, colorful, and CORRECT. The correct move is to start the task NOW.', 'I repeat everything. Especially this: you CAN do it. You CAN do it. You CAN do it.'] },
  // 84 – Forest Floor
  { colorName: 'Forest Floor', animal: '🦡', name: 'Spore',
    messages: ['I dug 73 holes last night. Not all of them useful. But I was MOVING. You should too.', 'I dig because standing still is boring. Your tasks are less boring than standing still. Dig in.', 'Chmok. Then I dug a hole. It\'s a gift. You\'re welcome.', 'I moved 73 tons of earth last week. You can move one project forward today.', 'Not every hole is useful. Not every task is perfect. DIG ANYWAY.'] },
  // 85 – Soft Amethyst
  { colorName: 'Soft Amethyst', animal: '🦋', name: 'Veil',
    messages: ['I can taste with my feet. You can start with your fingers. On the keyboard. Now.', 'Your talents are unique. Like tasting with feet. Weird but powerful.', 'Chmok. Light as a butterfly wing. Which is literally what this is.', 'I emerged from goo and became beautiful. Your rough draft will do the same.', 'I taste the world differently than anyone else. So do you. That\'s not a bug, it\'s a feature.'] },
  // 86 – Amber Glow
  { colorName: 'Amber Glow', animal: '🐝', name: 'Buzz',
    messages: ['My whole colony shares one brain and we\'re still more organized than your inbox.', 'The hive needs you today. By hive I mean your life. By needs I mean \"do the task.\"', 'Chmok. Bzzzz. That\'s the sound of aggressive affection.', 'We\'re 60,000 bees sharing one brain and we STILL finished our tasks. What\'s your excuse?', 'I make organized hexagons from chaos. You can make a productive day from this mess.'] },
  // 87 – Celadon
  { colorName: 'Celadon', animal: '🐸', name: 'Reed',
    messages: ['I eat bugs and judge no one. Except people who stare at their to-do list without doing it.', 'I judge one type of person: the type who reads their to-do list without doing it. Don\'t be that type.', 'Chmok. Ribbit. It\'s simple. Like your next step should be.', 'I sit still and the food comes to me. Your tasks won\'t do that. Go get them.', 'My tongue is faster than your excuses. Catch the task. Gulp.'] },
  // 88 – Wild Berry
  { colorName: 'Wild Berry', animal: '🐻', name: 'Bramble',
    messages: ['Ate 40 lbs of salmon today. Fueled up. Your version of this is coffee. Now what?', 'I ate enough to fuel a marathon. You drank coffee. Close enough. Let\'s go.', 'Chmok. It\'s a big bear hug disguised as a word. Feel it.', 'I caught a salmon mid-air today. You can catch a break after you finish one task.', 'Hibernation is earned. Work first, long sleep later. Bear rules.'] },
  // 89 – Artichoke
  { colorName: 'Artichoke', animal: '🦎', name: 'Inch',
    messages: ['I do pushups to communicate. What a flex. Literally. Now flex on that task list.', 'Do a pushup. Or do a task. Either way, flex on something today.', 'Chmok. *does 10 pushups* That\'s how I show affection. Aggressively.', 'Communication is physical for me. Typing is physical for you. Start communicating with your keyboard.', 'I do pushups to attract attention. You should do tasks to attract satisfaction.'] },
  // 90 – Denim
  { colorName: 'Denim', animal: '🐺', name: 'Pack',
    messages: ['Howled at the moon. It didn\'t answer. Still felt good. Sometimes you just gotta start and see.', 'The moon never answers but I howl anyway. Do the task even if results aren\'t guaranteed.', 'Chmok. From the whole pack. Awooo.', 'I run with others. You\'re not alone in this. But you DO have to start running.', 'Howling feels pointless. So does starting sometimes. Do it for the feeling, not the logic.'] },
  // 91 – Brick Dust
  { colorName: 'Brick Dust', animal: '🦀', name: 'Scuttle',
    messages: ['My skeleton is on the outside. Talk about having no protection from deadlines. Relate?', 'Exposed and vulnerable is just another way of saying honest and ready. Let\'s go.', 'Chmok. *pinch* Sorry, I don\'t know how to be gentle. But I tried.', 'My skeleton is on the outside. Your deadlines are on the outside. We\'re both exposed. Deal.', 'I scuttle sideways but I always reach the destination. Direction is a suggestion.'] },
  // 92 – Lavender Ash
  { colorName: 'Lavender Ash', animal: '🕊️', name: 'Calm',
    messages: ['I always find my way home. Your "home" today is that one task you keep postponing.', 'You\'ll find your way. I always do. It\'s literally my thing.', 'Chmok. Peaceful. Like a dove. Because I am one.', 'I\'ve been lost and I\'ve always come home. Today\'s home is that one task you keep avoiding.', 'Peace isn\'t the absence of tasks. It\'s the calm of knowing you\'ll do them. Start and find peace.'] },
  // 93 – Jade Mist
  { colorName: 'Jade Mist', animal: '🐲', name: 'Glimmer',
    messages: ['I guard treasure. Today the treasure is your time. Don\'t let anything steal it.', 'Your time is treasure. I\'m guarding it. Don\'t waste what I\'m protecting.', 'Chmok. Dragon kisses are rare and slightly smoky.', 'I sit on treasure for centuries. You sit on potential for hours. At least I\'m consistent.', 'The treasure isn\'t the gold. It\'s the time you have left today. Spend it wisely.'] },
  // 94 – Pecan
  { colorName: 'Pecan', animal: '🐿️', name: 'Cache',
    messages: ['I buried 10,000 acorns and forgot 7,400 of them. Write. Things. Down.', 'I forgot most things but I never forgot to keep trying. Neither should you.', 'Chmok! Wait, where did I put the chmok? Oh here it is. Chmok!', 'I\'m a cautionary tale with a fluffy tail. WRITE THINGS DOWN.', '10,000 plans, 2,600 executed. That\'s a 26% success rate. Better than 0%. Start burying acorns.'] },
  // 95 – Raspberry
  { colorName: 'Raspberry', animal: '🦢', name: 'Aria',
    messages: ['I\'m graceful on water and a disaster on land. Play to your strengths today.', 'You\'re graceful in your own element. Find your element today.', 'Chmok. Elegant and slightly wet. Swan standards.', 'I\'m a disaster on land and a vision on water. Find your water. Then dominate it.', 'My landing is terrible. My swimming is art. Specialize in what works.'] },
  // 96 – Dark Jade
  { colorName: 'Dark Jade', animal: '🐍', name: 'Jade',
    messages: ['I only eat once a month. Talk about restraint. You could try not checking your phone for 20 min.', 'Restraint is power. Not checking your phone for 20 minutes is the new black belt.', 'Chmok. One. Per. Month. Use it wisely.', 'I eat once a month and it\'s always worth the wait. Your focused work session will be too.', 'Less is more. I\'m a snake, I know minimalism. Shed the distractions.'] },
  // 97 – Toasted Wheat
  { colorName: 'Toasted Wheat', animal: '🐻', name: 'Grit',
    messages: ['I scratch my back on trees because I can\'t reach. Ask for help if you\'re stuck. Seriously.', 'It\'s okay to need help. I\'m a bear who uses trees as back scratchers. No shame.', 'Chmok. Big, warm, and slightly clumsy. Like everything I do.', 'My back itches and I can\'t reach it. Your task is RIGHT THERE and you won\'t reach for it?', 'I\'m grizzly on the outside, soft on the inside. Your task is the opposite. Dig in.'] },
  // 98 – Heron Blue
  { colorName: 'Heron Blue', animal: '🦤', name: 'Persist',
    messages: ['I\'m literally extinct and I still showed up for you today. No excuses.', 'Extinction couldn\'t stop me. Your lack of motivation definitely won\'t.', 'Chmok. From beyond the grave. It\'s that powerful.', 'I\'m literally a dead species delivering you a pep talk. What\'s YOUR excuse for not showing up?', 'They said I couldn\'t. They were right. I\'m extinct. But I\'M STILL HERE. Do the task.'] },
  // 99 – Dragon Pepper (bonus — catch-all)
  { colorName: 'Dragon Pepper', animal: '🐉', name: 'Spark',
    messages: ['I\'m a DRAGON. In a JOURNAL APP. If that\'s not motivating, nothing is. Do the thing.', 'I\'m a DRAGON in a JOURNAL APP and I chose to be HERE. With YOU. Be honored. Now work.', 'CHMOK. With fire. Sorry about your eyebrows. But you\'re LOVED.', 'I could be terrorizing a kingdom but instead I\'m motivating you. Priorities.', 'I hoard gold. You hoard unfinished tasks. Only one of us has a cool collection.'] },
];

/** Get the companion for today's color */
export function getDailyCompanion(color: DailyColor): DailyCompanion {
  return COMPANIONS[color.index] ?? COMPANIONS[0];
}
