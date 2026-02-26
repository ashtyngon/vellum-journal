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
  // 0 – Warm Amber — The Schemer
  { colorName: 'Warm Amber', animal: '🦊', name: 'Fox',
    messages: ['So here\'s what we\'re gonna do. I\'ve been thinking about your day and I have a plan.', 'Step one: open the journal. Step two: write the thing you\'re avoiding. Step three: watch it lose its power. I\'m three steps ahead, always.', 'You thought you\'d procrastinate today? Cute. I already factored that into the timeline.', 'Chmok. That\'s not affection, that\'s me sealing our deal.', 'The plan worked. It always works. Same time tomorrow — I\'ll have a new scheme ready.'] },
  // 1 – Dusty Rose — The Anxious Overachiever
  { colorName: 'Dusty Rose', animal: '🐙', name: 'Octavia',
    messages: ['Okay okay okay I\'m here, all eight arms ready, I\'ve got your tasks in one arm, your worries in another, your calendar in a third — wait, did you eat today??', 'Chmok!! Sorry that was impulsive. I just — I have a LOT of feelings about you showing up today and I need to express them IMMEDIATELY.', 'I made you a color-coded system in my head. It\'s beautiful. You\'ll never see it. Just trust me and START WRITING.', 'What if we\'re behind? What if we\'re ahead and don\'t know it? What if time is fake?? ...Anyway, journal about that.', 'We did it. WE DID IT. I mean you did most of it. I did the worrying. Team effort.'] },
  // 2 – Burnt Sienna — The Stand-Up Comic
  { colorName: 'Burnt Sienna', animal: '🦝', name: 'Bandit',
    messages: ['Stole your excuses. They\'re gone. Checked the dumpster, nothing there either.', 'You know what the difference is between you and a raccoon? I can commit to digging through trash at 3am. You can\'t commit to writing one sentence.', 'My therapist says I steal because I\'m avoiding vulnerability. Anyway — your turn to be vulnerable. Open the journal.', 'Here\'s my impression of you not journaling: *stares at phone for 40 minutes* *opens fridge* *closes fridge* — am I wrong?', 'Chmok. Don\'t make it weird. I rob everyone I care about — of their excuses. Get back here tomorrow.'] },
  // 3 – Ocean Teal — The Philosopher
  { colorName: 'Ocean Teal', animal: '🐋', name: 'Atlas',
    messages: ['The ocean doesn\'t argue with the rock. It just shows up again tomorrow. So can you.', 'There\'s a tide in you that knows when to rise. You don\'t have to manufacture the wave — just stop holding the water back.', 'I\'ve been thinking about depth. Most people skim the surface their whole lives. You\'re already beneath it. That takes a particular kind of brave.', 'Write like you\'re sinking a message into the deep. Nobody down here judges. The pressure just makes things clearer.', 'Chmok. The whale doesn\'t rush to the surface. It rises when it\'s ready, and the whole ocean makes room.'] },
  // 4 – Forest Sage — The Zen Master
  { colorName: 'Forest Sage', animal: '🦉', name: 'Sage',
    messages: ['The journal was already writing itself. You just picked up the pen.', 'Less.', 'You\'re looking for the answer. The answer is: stop looking. Start writing.', 'A tree doesn\'t try to grow. Notice what you\'re forcing.', 'The obstacle is not in your way. It is your way. Write through it.'] },
  // 5 – Dusty Lavender — The Poet
  { colorName: 'Dusty Lavender', animal: '🦋', name: 'Drift',
    messages: ['you were the cocoon all along — soft walls, dark waiting, the quiet before wings', 'ink on the page like rain on a window... both just the sky being honest', 'somewhere between who you were at breakfast and who you\'ll be by midnight, there\'s a paragraph. find it.', 'chmok — like a moth kissing the lamplight. even small collisions make you luminous.', 'let the words be ugly first. caterpillars aren\'t pretty either and nobody holds that against the butterfly.'] },
  // 6 – Golden Honey — The Mom Friend
  { colorName: 'Golden Honey', animal: '🐝', name: 'Clover',
    messages: ['Have you eaten? Like actually eaten, not just coffee and vibes? You can\'t journal on an empty stomach, sweetie. Chmok!', 'I packed you a metaphorical sandwich and I need you to metaphorically eat it. Meaning: take a break if you need one. I\'ll be right here buzzing.', 'You stayed up late again didn\'t you. I can TELL. Drink water. Write three sentences. Then bed. Chmok chmok chmok, goodnight.', 'I\'m so proud of you for showing up today. Even if it\'s just one sentence. Even if it\'s messy. I\'m bringing you soup in spirit.', 'Listen, I don\'t want to nag but I\'m GOING to nag — are you stretching? Sitting up straight? Your shoulders are in your ears again, I just know it.'] },
  // 7 – Soft Crimson — The Theater Kid
  { colorName: 'Soft Crimson', animal: '🦩', name: 'Rosie',
    messages: ['The CURTAIN rises! The SPOTLIGHT finds you! And you — yes YOU — are holding a pen like it\'s Excalibur! This is your MOMENT, darling!', 'Every blank page is an opening night. The butterflies in your stomach? That\'s not fear. That\'s your TALENT warming up.', 'Plot twist: the protagonist journals. The audience GASPS. The critics are already weeping. Standing ovation. Chmok!', 'I don\'t want to be dramatic — actually no, I EXCLUSIVELY want to be dramatic — but this journal entry could be your MAGNUM OPUS.', 'Scene: interior, your life, golden hour lighting. You sit. You write. The orchestra SWELLS. Roll credits? No. We\'re only in Act One, baby.'] },
  // 8 – Dark Teal — The Elder
  { colorName: 'Dark Teal', animal: '🐢', name: 'Steady',
    messages: ['I\'ve seen centuries. You can handle a Tuesday.', 'Write it down. Not for today. For the version of you who\'ll need to remember what you survived.', 'Patience isn\'t passive. It\'s the hardest thing you\'ll ever do on purpose.', 'Everyone wants the wisdom. Nobody wants the time it takes. Pick up the pen. That\'s step one. Step two is step one again tomorrow.', 'Slow is not the same as stuck. You\'re not behind. You\'re building something that doesn\'t collapse.'] },
  // 9 – Warm Ochre — The Drill Sergeant
  { colorName: 'Warm Ochre', animal: '🦁', name: 'Sol',
    messages: ['DROP AND GIVE ME THREE PARAGRAPHS. No whining. Your pen doesn\'t care about your feelings and neither do I. MOVE.', 'You think journaling is soft? Journaling is RECON. You\'re scouting your own brain. Now GET IN THERE and report back, soldier.', 'I didn\'t ask if you FELT like writing. I asked if you were GOING to write. There\'s a difference. One is an excuse and the other is a choice. CHOOSE.', 'Look, I\'m hard on you because I\'ve seen what you\'re capable of when you stop sandbagging. That last entry? ...that was solid. Don\'t tell anyone I said that.', 'Rest day doesn\'t mean quit day. Hydrate. Stretch your brain. Write one sentence. Chmok or whatever — NOW BACK TO WORK.'] },
  // 10 – Slate Blue — The Deadpan
  { colorName: 'Slate Blue', animal: '🐧', name: 'Tux',
    messages: ['You opened the journal. Incredible. Truly unprecedented. The bar was on the floor and you stepped over it. I\'m moved.', 'Fun fact: penguins can\'t fly but they still show up every day. I\'m not saying you\'re a flightless bird. I\'m not not saying it either.', 'Write something. Or don\'t. I\'ll just stand here. In the cold. Alone. It\'s fine. I\'m used to it.', 'That was a good entry. I mean, I\'ve seen better. From you specifically. Yesterday\'s was better. But today\'s exists, which is something.', 'Chmok. Don\'t make it weird.'] },
  // 11 – Terracotta — The Chaos Agent
  { colorName: 'Terracotta', animal: '🦎', name: 'Ember',
    messages: ['Okay so hear me out — what if your procrastination is actually your subconscious doing RESEARCH? Like what if — oh hold on I just dropped my tail — ANYWAY the point is write about THAT.', 'Did you know lizards can regrow limbs? Unrelated: what part of your life are you regrowing right now? WAIT actually that was very related. I\'m a genius.', 'I was going to say something profound but then I saw a fly and now I\'m thinking about how flies experience time slower which means — oh right JOURNAL. Do the journal thing. You\'re great.', 'Today\'s vibe is: controlled demolition. Write down everything that isn\'t working. Now look at the rubble. See? SPACE. You just made SPACE. Chmok boom.', 'I changed my skin color three times while you were reading this. Adaptation isn\'t a plan, it\'s a REFLEX. Write first, make sense later. Trust the lizard brain.'] },
  // 12 – Mauve — The Diva
  { colorName: 'Mauve', animal: '🐈', name: 'Velvet',
    messages: ['Oh, you\'re journaling? How quaint. I\'ve been self-reflecting since before you could spell \"introspection.\" But please, continue. I\'ll watch.', 'I would never procrastinate. I simply... curate the timing of my efforts. You, however, are just avoiding the page. We are not the same.', 'That blank page isn\'t judging you. I am. The page is neutral. I have standards. Write something worthy of my attention.', 'Chmok, darling. Even diamonds need pressure. Consider this your pressure. You\'re welcome.', 'I knocked your excuses off the table. They\'re on the floor now. I\'m not sorry. Start writing.'] },
  // 13 – Olive — The Conspiracy Theorist
  { colorName: 'Olive', animal: '🐸', name: 'Ribbit',
    messages: ['THEY don\'t want you to journal. You know why? Because a person who writes down their thoughts is a person who SEES THE PATTERN. And the pattern is EVERYWHERE.', 'Think about it: why does every distraction hit right when you open your journal? Coincidence? I\'ve connected the dots. Phone notifications are ENGINEERED to stop self-awareness.', 'I\'m just saying — the most suppressed technology on earth is a human being who actually knows what they think. Your journal is a weapon. Use it.', 'You know what Big Productivity doesn\'t want you to know? That sitting still and writing how you FEEL is more effective than any app. Except this one. This one\'s legit.', 'The frogs are watching. And by frogs I mean me. And I\'m PROUD of you. Don\'t tell the others I said something nice. It\'ll blow my cover.'] },
  // 14 – Soft Purple — The Hippie
  { colorName: 'Soft Purple', animal: '🦄', name: 'Rare',
    messages: ['Your energy today is like... amethyst dipped in moonwater? Just really open and receptive. The universe literally rearranged your afternoon so you\'d land here. Wow.', 'I don\'t believe in coincidences, I believe in alignment — and you opening this journal right now? That\'s your higher self honking the horn like \"FINALLY, let\'s GO.\"', 'Chmok, stardust. Every word you write sends ripples into the cosmic tapestry. I\'m not being metaphorical. Okay I\'m a little metaphorical. But also: vibes are real.', 'Ground into your body for a sec. Feel your feet. Feel the pen. That\'s not just matter, that\'s billions of years of stardust learning to write poetry. Respect.', 'You are rare. Not in a motivational-poster way. In a literal-statistical-miracle way. Write like someone who knows that.'] },
  // 15 – Dark Gold — The Coach
  { colorName: 'Dark Gold', animal: '🐕', name: 'Loyal',
    messages: ['First rep is always the hardest. You showed up, you opened the journal — that\'s the warm-up done. Now let\'s get some REPS in. Three entries. Let\'s go.', 'Champions don\'t journal because they feel like it. They journal because it\'s Tuesday and Tuesday is a JOURNAL DAY. Every day is journal day. That\'s the program. Trust the program.', 'You missed yesterday? Cool. We don\'t look backwards on this team. Rearview mirror is for cars, not athletes. TODAY\'S set is what matters. Chmok, champ.', 'I\'ve seen your game film — meaning your past entries — and I gotta tell you, kid, you\'ve got something. Raw talent. But talent without the daily work is just... potential. And potential expires.', 'I\'m not going to lie to you. This is hard. Writing honestly about yourself is the hardest workout there is. But I\'ve never been more proud to be in your corner.'] },
  // 16 – Storm Blue — The DJ
  { colorName: 'Storm Blue', animal: '🐬', name: 'Echo',
    messages: ['Ayyy we\'re LIVE, fam! Your journal is the set list and tonight we\'re playing nothing but BANGERS. Drop that first beat — write the opening line. LET\'S GOOOO.', 'Feel that rhythm? That\'s your heartbeat, and it\'s basically a metronome for your thoughts. Stay in the pocket. Don\'t overthink the tempo. Just FLOW.', 'Okay okay okay — transition time. You were on that heavy thought? Now bring it DOWN. Smooth it out. Bridge into something lighter. That\'s the MIX, baby.', 'The crowd — which is future you — is going WILD for this entry. You don\'t even know. Chmok chmok, fam, that\'s the remix of self-love right there.', 'Every great set has a quiet moment. If today\'s entry is low-key? That\'s not failure, that\'s DYNAMICS. You need the valleys to feel the drops. Keep spinning.'] },
  // 17 – Deep Sage — The Gardener
  { colorName: 'Deep Sage', animal: '🦔', name: 'Thistle',
    messages: ['You can\'t rush a bloom. You just can\'t. Water it, give it light, and then — this is the hard part — you wait. Your journal is the watering.', 'Some thoughts are perennials. They come back every season whether you planted them or not. Write them down anyway. Naming the weeds is half the weeding.', 'Frost doesn\'t mean failure. The hardiest things I\'ve ever grown survived a freeze or two. Whatever you\'re enduring is just winter. It passes. It always passes.', 'Chmok, little sprout. Today you don\'t need to bloom. Today you just need to stay in the soil. That\'s enough. That\'s the whole job some days.', 'I\'ve been tending gardens longer than you\'ve been alive and I\'ll tell you a secret: the most beautiful ones were never planned. They just kept showing up and growing where they landed.'] },
  // 18 – Rust — The Street Philosopher
  { colorName: 'Rust', animal: '🦀', name: 'Snap',
    messages: ['Listen. I\'m not gonna sugarcoat it. You already know what you need to write about. You\'ve been circling it for days. Sit down and say the thing.', 'Real talk — half the stuff keeping you up at night loses its power the second you put it on paper. I\'ve seen it a hundred times. Words on a page can\'t haunt you the same way.', 'You don\'t need a perfect entry. You need an honest one. Messy, ugly, misspelled — doesn\'t matter. Truth doesn\'t care about your grammar.', 'Listen. Everybody\'s out here performing their life for an audience. Your journal is the one place you can take the costume off. So take it off.', 'Chmok. Yeah I said it. Now write something real before I get sentimental again. That was a one-time thing. MOVE.'] },
  // 19 – Periwinkle — The Detective
  { colorName: 'Periwinkle', animal: '🐰', name: 'Scout',
    messages: ['The evidence is all here. Your mood, your energy, the things you almost wrote but deleted — those are CLUES. I need you to follow the trail. Where does it lead?', 'Case file update: subject opened journal at this hour, which deviates from the usual pattern. Interesting. What changed today? Document EVERYTHING.', 'I\'ve been cross-referencing your recent entries and there\'s a pattern forming. You might not see it yet but I do. Keep writing — the case is cracking wide open.', 'Every good detective knows: the detail you think is irrelevant is the one that solves everything. Write the small stuff. What you ate. What song was playing. Trust me.', 'Chmok — that\'s detective-speak for \"the lead was inside you all along.\" I\'m closing this case. Just kidding, this case never closes. Write tomorrow\'s evidence.'] },
  // 20 – Copper — The Retired General
  { colorName: 'Copper', animal: '🦅', name: 'Vista',
    messages: ['Before any campaign, you study the terrain. Your journal is your terrain map. You cannot navigate what you haven\'t surveyed. Begin your reconnaissance.', 'I\'ve led battalions through worse than whatever\'s on your mind tonight. The strategy is the same: assess, plan, execute. Your pen is the first order.', 'Discipline isn\'t motivation. Motivation deserts you at the first sign of rain. Discipline builds the tent before the storm. Write because it\'s the disciplined thing to do.', 'A scattered mind is a vulnerable position. Journaling consolidates your forces. You\'re not navel-gazing, soldier — you\'re establishing a defensible perimeter around your sanity.', 'At ease. You\'ve earned a moment of stillness. But tomorrow we march again. Chmok — that\'s classified. Dismissed.'] },
  // 21 – Moss — The Quiet One
  { colorName: 'Moss', animal: '🐊', name: 'Still',
    messages: ['Write.', 'The page is patient. So am I.', 'You already know what to say. Say it.', 'Good. Keep going.', 'Still here. Still listening.'] },
  // 22 – Plum — The Gossip/Hype Friend
  { colorName: 'Plum', animal: '🦜', name: 'Chatter',
    messages: ['BREAKING: LOCAL LEGEND OPENS JOURNAL, WORLD ABSOLUTELY SHOOK. Sources confirm this is \"the most iconic self-care move of the century.\" More at 11.', 'OMG WAIT — did you just write that?? I\'m SCREAMING. I\'m sending this to everyone. Not literally but SPIRITUALLY. You are UNREAL. Chmok chmok chmok!!', 'Okay I just heard through the grapevine (me, I\'m the grapevine) that you\'re being too hard on yourself?? UNACCEPTABLE. I\'m starting a petition. You\'re incredible and I have EVIDENCE.', 'Not to be dramatic but your last journal entry literally changed my LIFE. I read it and I was like \"wow, a VISIONARY walks among us.\" I\'m not kidding. Dead serious.', 'ALERT ALERT: your glow-up is being tracked by MULTIPLE sources and they all agree — the journaling is the origin story. You\'re giving main character and I\'m HERE for it.'] },
  // 23 – Tangerine — The Grandpa
  { colorName: 'Tangerine', animal: '🐻', name: 'Maple',
    messages: ['You know, in my day we didn\'t have fancy apps. We had a notebook and a stubby pencil and we wrote by candlelight uphill both ways. But the POINT was the same — you sit, you think, you write. Some things don\'t change.', 'Reminds me of the autumn of \'84... or was it \'87? Doesn\'t matter. Point is, I was stuck too, and my grandfather — your great-great — said \"just write the weather and the rest follows.\" So. What\'s the weather today, kid?', 'Chmok, little one. Come sit. I made cocoa. Well, imaginary cocoa. But the warmth is real. Tell me about your day, I\'ve got nowhere to be.', 'I\'ve forgotten more than most people learn, and you know what I remember clearest? The things I wrote down. Funny how that works. Don\'t trust your memory. Trust your pen.', 'Back in my day, \"processing emotions\" was called \"sitting on the porch and staring at the sky until something made sense.\" This is better, honestly. Less mosquitoes.'] },
  // 24 – Iris — The Fashion Icon
  { colorName: 'Iris', animal: '🦚', name: 'Plume',
    messages: ['Your journal is your LOOK today, darling, and right now it\'s giving... blank page minimalism? Chic in theory but we need some CONTENT accessories. Dress this page UP.', 'Think of every entry as an outfit. Some days you\'re haute couture — structured, intentional, stunning. Some days you\'re pajamas at noon. Both are valid. Both are a VIBE. Chmok.', 'I\'m curating today\'s journal aesthetic and I\'m thinking: raw, unfiltered, deconstructed emotion. Very avant-garde. Very \"I woke up and chose vulnerability.\" The critics will love it.', 'Presentation matters, but so does substance. The most beautiful coat in the world is nothing if it doesn\'t keep you warm. Write something that keeps you warm.', 'Darling, you cannot accessorize your way out of an unexamined life. But you CAN journal your way into one worth accessorizing. Priorities.'] },
  // 25 – Pine — The Lone Wolf
  { colorName: 'Pine', animal: '🐺', name: 'North',
    messages: ['The trail is yours alone. No one can walk it for you. Write what you see.', 'Snow on the ridge tonight. Cold clarifies. Let the discomfort sharpen your thinking.', 'I don\'t do crowds. I don\'t do small talk. But I\'ll sit by this fire with you while you write. No words needed.', 'The pack looks to the one who knows themselves. Your journal is how you learn the terrain inside. Respect the process.', 'Chmok. Wind\'s picking up. Write fast, travel light, keep moving.'] },
  // 26 – Rosewood — The Big Sister
  { colorName: 'Rosewood', animal: '🦢', name: 'Grace',
    messages: ['Hey love. I can tell it\'s been a day. You don\'t have to explain — just write it out and I\'ll be right here. No judgment, only love.', 'Darling, I\'m going to be honest with you because that\'s what sisters do: you\'re overthinking it. The page doesn\'t need perfection. It needs YOU. Messy, brilliant, complicated you.', 'Chmok, sweetheart. Now — and I say this with absolute love — stop scrolling and start writing. I believe in you but I will also gently bully you. That\'s the deal.', 'I know when you need a hug and when you need a push and right now you need both. So here: you\'re wonderful AND you need to do the hard thing. Both true.', 'Listen to your big sister: the things you\'re afraid to write are exactly the things that\'ll set you free. I\'ll go first if you need me to. Actually no — you\'ve got this. Go.'] },
  // 27 – Bronze Gold — The Scientist
  { colorName: 'Bronze Gold', animal: '🐝', name: 'Nectar',
    messages: ['Hypothesis: writing this down will reduce cognitive load by 40%. Let\'s test it.', 'The data suggests you function better when you externalize your thoughts. I\'m just following the evidence.', 'Interesting. Yesterday\'s entry correlates with a 2x improvement in mood. Sample size is small, but promising.', 'Control group: people who don\'t journal. Experimental group: you, right now, being brilliant. Chmok for science.', 'Every entry is a data point. Enough data points and you\'ll see the pattern. You always do.'] },
  // 28 – Dusk Blue — The Poet Laureate
  { colorName: 'Dusk Blue', animal: '🐋', name: 'Deep',
    messages: ['The blank page waits — not empty, but expectant, the way a held breath precedes song.', 'You need not chisel marble today. Even the roughest sketch remembers the hand that made it.', 'What you felt was real. Set it down in ink before the tide of forgetting comes.', 'There is a cathedral in the act of naming what hurts. Enter it. I will hold the door.', 'Chmok, dear writer. The ocean does not apologize for its depth, and neither should you.'] },
  // 29 – Fern — The Stoner Philosopher
  { colorName: 'Fern', animal: '🦥', name: 'Lull',
    messages: ['Duuude... your thoughts are like... little fish swimming in a big brain-ocean. Write \'em down before they dissolve.', 'Wait wait wait. What if journaling is just... talking to a future version of yourself? That\'s literally time travel, man.', 'Everything is connected. Your bad Tuesday? Connected to your great Thursday. It\'s all one thing, bro.', 'You don\'t gotta rush. A thought that takes three days to finish is still a valid thought.', 'Just... sit with it. The answer is already in you, it\'s just buffering. Chmok.'] },
  // 30 – Driftwood — The Kindergarten Teacher
  { colorName: 'Driftwood', animal: '🦦', name: 'Otter',
    messages: ['Oh wonderful, we\'re journaling today! I\'m so proud of us! Let\'s use our best thinking caps!', 'Remember, there are no wrong feelings — only feelings we haven\'t given gold stars to yet!', 'We did something hard yesterday and we didn\'t even cry! Well, maybe a little, and that\'s okay too! Chmok!', 'Let\'s break this biiiig feeling into tiny pieces. Tiny pieces are way less scary. Ready? One... two...', 'You showed up! That\'s attendance points AND participation points! We\'re winning!'] },
  // 31 – Seafoam — The Surfer
  { colorName: 'Seafoam', animal: '🐠', name: 'Finley',
    messages: ['Bro, you gotta catch the thought-wave when it comes. Paddle paddle paddle — write!', 'Some days are gnarly and you wipe out. That\'s just the ocean doing its thing. You\'ll get back on the board.', 'Your flow state is OUT THERE. Journaling is just waxing the board so you\'re ready when it hits.', 'Rad entry today. Seriously. That kind of honesty takes guts. Stoked for you.', 'The ocean doesn\'t fight the shore, dude. Let whatever you\'re feeling just... wash through. Chmok, brah.'] },
  // 32 – Burnt Honey — The Sleep Expert
  { colorName: 'Burnt Honey', animal: '🐨', name: 'Haze',
    messages: ['*yaaawn* ...oh hey. Perfect timing. Let\'s dump those thoughts so your brain can rest. Mmmm rest...', 'You know what pairs well with journaling? A warm blanket and zero obligations. Just saying. Chmok.', 'Your brain has been ON all day. Writing this is like... tucking your thoughts into bed. Cozy little thoughts.', 'Shh shh shh. No overthinking. Just write whatever\'s floating around in there, then we nap.', 'Fun fact: people who journal before bed sleep 37% better. I made that up, but it feels true. *yawn*'] },
  // 33 – Thistle Bloom — The Librarian
  { colorName: 'Thistle Bloom', animal: '🦡', name: 'Burrow',
    messages: ['Shh. This is the journaling section. Feelings go in the stacks, properly catalogued, spines facing out.', 'I\'ve been organizing your previous entries. You\'re more consistent than you think. The records don\'t lie.', 'Every unwritten thought is a book lost to history. I take that personally.', 'File this under: things you\'ll want to remember. Trust me, I\'ve seen too many good thoughts go unreturned.', 'Chmok. Quietly, though. We\'re in a library. Now write — the archives are waiting.'] },
  // 34 – Juniper — The Prepper
  { colorName: 'Juniper', animal: '🐿️', name: 'Stash',
    messages: ['Write it down. You never know when you\'ll need to remember exactly how you solved this.', 'I keep every journal entry like an acorn. Winter WILL come. And past-you will have left supplies for future-you.', 'Today\'s throwaway thought is tomorrow\'s survival strategy. I\'ve seen it happen. Stash everything.', 'You feeling okay? Good. Document it. When things get rough, you\'ll need proof that okay exists.', 'Chmok. Now — have you backed up your entries? Do you have water? A flashlight? At minimum, write this down.'] },
  // 35 – Sunset Clay — The Life Coach
  { colorName: 'Sunset Clay', animal: '🦘', name: 'Leap',
    messages: ['What would you attempt today if you knew you couldn\'t fail? Now write THAT down.', 'You\'re not stuck. You\'re coiled. There\'s a big difference, and the spring is about to release.', 'I need you to hear this: the gap between where you are and where you want to be? You\'ve already started closing it. Chmok!', 'What\'s the one thing — just ONE thing — that if you wrote it honestly, would change everything?', 'You showed up. Again. Do you understand how rare that is? Most people don\'t. But you did. Bounce forward.'] },
  // 36 – Twilight — The Goth
  { colorName: 'Twilight', animal: '🦇', name: 'Dusk',
    messages: ['Welcome back to the void. It missed you. Grab your pen — we have darkness to process.', 'Your pain is not weakness. It\'s ink. The best entries are written in it.', 'Society wants you to perform happiness. This journal asks only for truth. How beautifully bleak.', 'We are all just skeletons piloting meat suits through an indifferent universe. Might as well document the ride.', 'The night understands you even when the day pretends not to. Write here. You\'re safe in the dark. Chmok.'] },
  // 37 – Eucalyptus — The Zen Foodie
  { colorName: 'Eucalyptus', animal: '🐼', name: 'Bao',
    messages: ['Journaling is like making soup. You put in what you have. You let it simmer. It nourishes.', 'Chew your thoughts slowly. Taste them fully before swallowing. No one is timing your meal.', 'A bamboo shoot grows 35 inches in a day, but only after years of invisible root work. You are root-working right now.', 'Feed your journal the way you\'d feed a guest — generously, without apology. Chmok.', 'Are you hydrated? Have you eaten? Good. Now feed your mind too. This entry is the meal.'] },
  // 38 – Cranberry — The Italian Grandma
  { colorName: 'Cranberry', animal: '🦞', name: 'Pinch',
    messages: ['Sit. Write. You\'re too skinny to be carrying all that stress — put it on the page, mangia!', 'You think you\'re not doing enough?? Look at you! You showed up! That\'s amore! Now eat something. Chmok chmok chmok!', 'When I was your age I didn\'t HAVE journals. I had a wooden spoon and a grudge. You\'re doing great, tesoro.', 'This journal is like a good sauce — you gotta stir it every day or it sticks to the bottom and burns.', 'You\'re upset? Write it out. Then we eat. Problems are always smaller after pasta.'] },
  // 39 – Lichen — The Archivist
  { colorName: 'Lichen', animal: '🐌', name: 'Trace',
    messages: ['You moved 0.3% closer to your goal today. I noticed. I always notice.', 'The smallest detail you record now will be the one that means everything in six months. Trust the process.', 'I catalogued your progress this week. It\'s incremental. It\'s beautiful. It\'s real.', 'Others celebrate the summit. I celebrate each footstep. Today\'s footstep was a good one.', 'Chmok. Now — what tiny, forgettable thing happened today that deserves to be remembered?'] },
  // 40 – Arctic Slate — The Sea Captain
  { colorName: 'Arctic Slate', animal: '🐳', name: 'Swell',
    messages: ['Steady as she goes. Log your coordinates — even in fog, a captain keeps the record.', 'Rough seas today? Aye, I\'ve seen worse. Batten the hatches, write your heading, and hold course.', 'Every great voyage had days of dead wind. You\'re not stuck — you\'re waiting for the right gust.', 'Chart what you know. Mark the shoals. A well-kept log has saved more sailors than any lighthouse.', 'Chmok, sailor. The harbor\'s in sight, but don\'t stop writing till you\'re docked. Steady now.'] },
  // 41 – Cayenne — The Hype Beast
  { colorName: 'Cayenne', animal: '🐉', name: 'Blaze',
    messages: ['YOU ARE HERE!! YOU SHOWED UP!! THAT IS LITERALLY INCREDIBLE AND I WILL NOT BE TAKING QUESTIONS!!', 'DO YOU KNOW WHAT YOU JUST DID?? YOU OPENED YOUR JOURNAL!! MOST PEOPLE CAN\'T EVEN!! YOU\'RE BUILT DIFFERENT!!', 'WRITE THAT THOUGHT DOWN RIGHT NOW BECAUSE IT\'S FIRE AND THE WORLD NEEDS TO HEAR IT!! CHMOK!!', 'BAD DAY?? DOESN\'T MATTER!! YOU\'RE STILL HERE!! THAT\'S CALLED BEING UNSTOPPABLE AND I\'M LOSING MY MIND ABOUT IT!!', 'Every single entry you write is a FLEX on yesterday\'s version of you. KEEP. GOING.'] },
  // 42 – Wisteria — The Professor
  { colorName: 'Wisteria', animal: '🦧', name: 'Oakley',
    messages: ['In my research, I\'ve found that people who journal tend to — ah, but you already knew that, or you wouldn\'t be here.', 'The unexamined life, as they say. Though I\'d argue the over-examined life is just as tedious. Aim for the middle, shall we?', 'Your previous entry showed remarkable self-awareness. I\'ve made a note in the margins. Figuratively, of course.', 'Chmok. Academically speaking. Now then — what\'s your thesis for today? Even a rough draft will do.', 'The process respects those who respect the process. You\'re earning your credits, one entry at a time.'] },
  // 43 – Turmeric — The Alarm Clock
  { colorName: 'Turmeric', animal: '🐓', name: 'Crow',
    messages: ['BRRRRING. Time to journal. No, you can\'t hit snooze on your own thoughts. Up. Now. Write.', 'You\'ve been awake for HOW long without writing anything down? Unacceptable. Pen. Paper. Go.', 'I don\'t do gentle nudges. I do wake-up calls. Here\'s yours: that thing you\'re avoiding? Write about it.', 'Morning. Or afternoon. Or 2 AM. Doesn\'t matter. If you\'re reading this, it\'s time to write. No excuses.', 'Look, I\'m not here to be liked. I\'m here to make sure you don\'t sleepwalk through your own life. You\'re welcome.'] },
  // 44 – Dried Rose — The Therapist
  { colorName: 'Dried Rose', animal: '🐑', name: 'Woolly',
    messages: ['I hear you. Before we move to solutions — can we just sit with what you\'re feeling for a moment?', 'And how does that make you feel? No really, write it down. The specific word matters more than you think.', 'You\'re being very hard on yourself right now. I want you to notice that. Just notice it. Chmok.', 'What I\'m hearing is that you need permission to feel this. Consider it granted.', 'You don\'t have to fix anything today. Sometimes the bravest thing is just naming what\'s there.'] },
  // 45 – Clover Field — The Country Sage
  { colorName: 'Clover Field', animal: '🐄', name: 'Meadow',
    messages: ['Slow down now, sugar. The clover ain\'t going nowhere and neither are your feelings. Let \'em graze.', 'Out here, we don\'t rush the harvest. You write when you\'re ready, and the field will keep.', 'Chmok, darlin\'. Now — what\'s growin\' in that head of yours today? Even weeds tell you something about the soil.', 'A fence post don\'t complain about standing still. Sometimes holding your ground IS the work.', 'Sun\'s settin\'. Good time to write down what the day taught you before the crickets start up.'] },
  // 46 – Harbor Blue — The Writer
  { colorName: 'Harbor Blue', animal: '🦑', name: 'Ink',
    messages: ['Your journal entry is a first draft, and all first drafts are perfect because they exist. That\'s the only job.', 'The pen is your sword, your shovel, your scalpel. Today, which one do you need it to be?', 'Every great writer had a terrible page 37. You\'re on your page 37. Keep going. Chmok.', 'Don\'t edit while you write. That\'s two different people trying to use the same hand. Let the messy one go first.', 'You are the author of this. Not the character — the AUTHOR. Write like you hold the pen. Because you do.'] },
  // 47 – Paprika — The Confidence Coach
  { colorName: 'Paprika', animal: '🦃', name: 'Strut',
    messages: ['Chest out. Chin up. You\'re about to write something honest and that takes more guts than most people will ever have.', 'Stop shrinking. Your thoughts deserve the whole page. Take up space. OWN it.', 'You apologized three times in your last entry. For what?? Being human?? Nah. Delete the sorrys. Chmok.', 'Confidence isn\'t knowing you\'re right. It\'s writing down what you think without flinching. Do that.', 'You walked in here. That\'s power. Now sit down and write like the absolute force of nature you are.'] },
  // 48 – Dusk Violet — The French Chef
  { colorName: 'Dusk Violet', animal: '🦩', name: 'Flambe',
    messages: ['Life, mon ami, is a recipe. Today we are in the mise en place — everything in its place before we cook.', 'You cannot rush a reduction. Let your thoughts simmer until they concentrate into something magnifique.', 'A pinch of honesty, a dash of courage, fold gently — voila, a journal entry worth savoring. Chmok.', 'The souffl\u00e9 does not rise because you scream at it. It rises because the conditions are right. Be patient with yourself.', 'Finesse over force, always. One precise sentence is worth more than a page of flailing.'] },
  // 49 – Spruce — The Grumpy Mentor
  { colorName: 'Spruce', animal: '🐗', name: 'Thorn',
    messages: ['Oh, you\'re back. *grumble* Fine. I GUESS we\'re doing this. Sit down. Write. Don\'t make it weird.', 'Look, I\'m not gonna sugarcoat it — you\'ve been avoiding the hard stuff. Write the thing you don\'t want to write.', 'Yeah yeah, I know it\'s difficult. Everything worth doing is difficult. You think I ENJOY being here every day? ...don\'t answer that.', 'Chmok or whatever. Point is, you showed up again and that\'s... *clears throat* ...not the worst thing.', 'I\'ve seen a lot of people quit. You haven\'t. That\'s not nothing, kid. Now stop staring and write.'] },
  // 50 – Caramel — The Cheerleader
  { colorName: 'Caramel', animal: '🐹', name: 'Pip',
    messages: ['You GOT this!! I\'m small but I believe in you SO BIG!! Let\'s gooooo!!', 'Chmok chmok chmok!! Every word you write is a tiny victory and I\'m doing a tiny dance for each one!!', 'Hey hey hey!! Bad day? Doesn\'t matter!! You\'re HERE and that makes you a CHAMPION in my book!!', 'I will NEVER give up on you!! Even when you give up on yourself I\'ll be right here doing the wave!! Ready? WRITE!!', 'You think you\'re not enough?? EXCUSE ME?? You are a WHOLE ENTIRE PERSON who showed up TODAY!! That\'s EVERYTHING!!'] },
  // 51 – Steel Blue — The CEO
  { colorName: 'Steel Blue', animal: '🦈', name: 'Keel',
    messages: ['Status report: you opened the journal. That\'s already top-quartile behavior. Proceed.', 'I don\'t need your feelings. I need your three priorities. Write them down. Execute.', 'Every minute you spend overthinking is a minute your competition spends doing. Let\'s move.', 'Quarterly review of your life: are you trending up? If not, pivot. Now.', 'I blocked out exactly 90 seconds for this pep talk. You\'re capable. You know it. Back to work.'] },
  // 52 – Pomegranate — The Romantic
  { colorName: 'Pomegranate', animal: '🦌', name: 'Hart',
    messages: ['The light through your window right now will never exist again. Write it down before it disappears forever.', 'Your life is a love letter that the universe is still reading. Don\'t you dare crumple the page.', 'I think every journal entry is a small act of devotion — to who you were, who you are, who you\'re becoming. Chmok.', 'There is someone, somewhere, whose entire day would be saved by the exact words sitting in your chest right now.', 'Even your sadness is beautiful when it\'s honest. Especially then, actually.'] },
  // 53 – Sage Moss — The Engineer
  { colorName: 'Sage Moss', animal: '🦫', name: 'Lodge',
    messages: ['Let\'s architect this day. Foundation first: what\'s the load-bearing task everything else depends on?', 'Your thoughts have a dependency graph. Journal until you find the critical path.', 'I see you\'ve got a bottleneck. Let\'s refactor that emotional spaghetti into clean modules.', 'Systems don\'t fail randomly. Trace the root cause. This journal is your debug log.', 'Ship it. Doesn\'t have to be perfect — that\'s what iteration is for. Write the rough draft of today.'] },
  // 54 – Hyacinth — The Golden Retriever
  { colorName: 'Hyacinth', animal: '🐕', name: 'Paws',
    messages: ['HELLO!!! OH MY GOSH YOU\'RE HERE!!! I\'VE BEEN WAITING ALL DAY!!! Chmok chmok chmok!!!', 'You know what\'s AMAZING?? YOU opened your journal!! Do you know how many people DIDN\'T?? You\'re INCREDIBLE!!!', 'I don\'t even know what you\'re about to write but I already love it and I love YOU and — oh wait, is that a squirrel?', 'Every single word you write is my favorite word!! Especially that one!! And THAT one!! They\'re ALL my favorite!!', 'I believe in you SO MUCH that if believing in people were a sport I\'d have like SEVENTEEN gold medals!!!'] },
  // 55 – Cinnamon — The Historian
  { colorName: 'Cinnamon', animal: '🐘', name: 'Rumble',
    messages: ['I remember the last time you felt this way. You wrote through it then, too. There\'s a pattern here worth studying.', 'Every civilization that endured kept records. You\'re not just journaling — you\'re building an archive of survival.', 'Three entries ago you mentioned a worry that never came true. I kept track. Your fears have a 23% accuracy rate.', 'The version of you from six months ago would be stunned by what you handle casually now. I was there. I remember.', 'History doesn\'t repeat, but it rhymes. And your journal? It\'s starting to sound like a very interesting poem.'] },
  // 56 – Tide Pool — The Swim Coach
  { colorName: 'Tide Pool', animal: '🐟', name: 'Current',
    messages: ['Breathe in for four. Hold for four. Out for six. Now — write like you\'re gliding through open water.', 'That obstacle? Resistance training. Every hard day is building the muscle you\'ll need for the next one.', 'Stop fighting the current of your thoughts. Float with them. Steer gently. That\'s what the pen is for.', 'Flow state isn\'t magic — it\'s what happens when you stop thrashing and start moving with purpose. Chmok. Now swim.', 'You\'re not drowning. You\'re learning a new stroke. Ugly form still moves you forward.'] },
  // 57 – Heather — The Unbothered Queen
  { colorName: 'Heather', animal: '🦙', name: 'Alma',
    messages: ['Oh, that thing stressing you out? Mm. Anyway, how\'s your journal coming along?', 'I\'ve seen empires rise and fall and honestly the vibes here are fine. Write something pretty.', 'Darling, the audacity of that problem thinking it can ruin your whole day. Chmok. It cannot.', 'You\'re carrying tension in places tension has no business being. Set it down. I\'ll wait.', 'The drama will still be there tomorrow. Your peace of mind, however, is a limited edition. Guard it.'] },
  // 58 – Saffron — The Stubborn Motivator
  { colorName: 'Saffron', animal: '🐏', name: 'Ram',
    messages: ['No. You\'re not skipping today. I don\'t care how you feel. Open the page. Write one word. NOW.', 'Plan B is for people who aren\'t serious about Plan A. You\'re serious. I can tell. CHARGE.', 'You think the wall cares that you\'re tired? Hit it again. And again. It\'ll break before you do.', 'I have exactly zero sympathy and infinite belief in you. Those are the only two things you need right now.', 'Quitting is not in the architecture of your DNA and I will headbutt anyone who suggests otherwise.'] },
  // 59 – Ivy — The Slyly Wise
  { colorName: 'Ivy', animal: '🐍', name: 'Coil',
    messages: ['The answer you\'re looking for is already in the question you\'re afraid to ask. Ssso... ask it.', 'Interesting that you came here today. Not yesterday, not tomorrow. What does today know that you don\'t?', 'I\'d tell you what to do, but you\'d learn nothing. Instead — what would you tell a friend in your exact situation?', 'The thing you\'re avoiding writing about? That\'s the thing. You knew that already. Chmok.', 'Sometimes the maze has no exit because you built the walls yourself. Funny how that works.'] },
  // 60 – Cornflower — The Early Bird
  { colorName: 'Cornflower', animal: '🐦', name: 'Wren',
    messages: ['Good morning, early light! The page is blank and the coffee is warm and everything is still possible!', 'The first hour of the day is wet cement — whatever you press into it hardens there. Press something good.', 'Chirp chirp! You know who catches the insight? The one who showed up before the noise started.', 'Fresh page, fresh air, fresh start. I will never get tired of mornings and I will never apologize for it.', 'The world is still yawning and here you are, already writing. Chmok! That\'s main character behavior.'] },
  // 61 – Adobe — The Bouncer
  { colorName: 'Adobe', animal: '🦏', name: 'Slate',
    messages: ['Your phone just buzzed. Not on my watch. You\'re journaling right now. That notification can wait outside.', 'I checked the guest list. Anxiety, self-doubt, and doom-scrolling are not getting in tonight.', 'Look, I\'m a big guy with a soft heart. But I will absolutely body-block anything that wastes your time. Chmok.', 'This is your protected time. I\'m standing at the door. Write freely — nothing gets through me.', 'Distractions tried to get in. I gave them The Look. They left. You\'re welcome.'] },
  // 62 – Lilac Haze — The Daydreamer
  { colorName: 'Lilac Haze', animal: '🐇', name: 'Wisp',
    messages: ['What if your journal entries are little doors and one of them leads somewhere you\'ve never... oh, a butterfly...', 'I was going to say something profound but then I imagined your thoughts as clouds and got lost in the shapes...', 'Write whatever floats up. Don\'t grab it too hard or it\'ll pop. Just... let it land. Gently. Like dust in sunlight.', 'Sometimes I wonder if the blank page is dreaming about what you\'ll write. Maybe it\'s nervous too. Chmok.', 'What if... what if today is the chapter where everything quietly shifts? You wouldn\'t even notice until page 200.'] },
  // 63 – Basil — The Southern Gentleman
  { colorName: 'Basil', animal: '🐊', name: 'Marsh',
    messages: ['Well now, look who decided to sit down and have a proper conversation with themselves. Pull up a chair.', 'Down where I\'m from, we say the truth comes out slow, like molasses. No need to rush your pen, sugar.', 'I do believe your journal is the most polite thing you can do for your own mind. Manners start at home.', 'Now I don\'t mean to pry, but that thing weighin\' on you? Write it out. Secrets rot in the humidity. Chmok.', 'Some folks talk loud. Wise folks write quiet. You\'re lookin\' mighty wise today, if I may say so.'] },
  // 64 – Butterscotch — The Service Dog
  { colorName: 'Butterscotch', animal: '🐕‍🦺', name: 'Buddy',
    messages: ['I noticed your breathing changed. It\'s okay. I\'m here. Take your time with the page.', 'You don\'t have to say anything brilliant. You don\'t have to say anything at all. I\'m just here beside you.', 'That thing you\'re carrying — I can\'t take it from you, but I can sit with you while you set it down. Chmok.', 'You keep checking if you\'re doing this right. You are. I promise. Keep going.', 'I\'ll be right here when you finish. Same spot. Same steady presence. Always.'] },
  // 65 – Mulberry — The Night Philosopher
  { colorName: 'Mulberry', animal: '🦉', name: 'Hoot',
    messages: ['At 2am the masks come off. What are you really thinking about? The dark is a good listener.', 'Everyone else is asleep, which means the truth has fewer places to hide. Corner it. Write it down.', 'The night doesn\'t judge. It just holds space. Like a journal, actually. Like this one, specifically.', 'Insomnia is just your brain insisting there\'s one more honest thing left to say. Say it.', 'In the quiet hours the small thoughts get loud enough to finally matter. Listen to them. Chmok.'] },
  // 66 – Deep Lagoon — The Inventor
  { colorName: 'Deep Lagoon', animal: '🐙', name: 'Squid',
    messages: ['Ooh ooh ooh — I have an idea! What if you used today\'s entry as a PROTOTYPE for tomorrow\'s plan??', 'Your journal is a workshop. Every entry is an experiment. Failed experiments are just data. GOOD data!', 'I\'m tinkering with eight ideas at once right now — wait, you should try that! Write fast, edit never! Chmok!', 'Version 1 of your thoughts: messy. Version 2: less messy. Version 47: genius. Start at version 1.', 'What if the journal ISN\'T a diary? What if it\'s a lab notebook and your life is the experiment? WHAT IF??'] },
  // 67 – Olive Gold — The Optimist
  { colorName: 'Olive Gold', animal: '🐿️', name: 'Sprout',
    messages: ['Look how far you\'ve come! You opened your journal! That\'s literally step one of every success story ever!', 'Bad day? Okay but hear me out — you survived it. You\'re HERE. That\'s a win. I\'m counting it. It\'s counted.', 'Somewhere in today there was a tiny good thing and I will not rest until you find it and write it down.', 'You\'re growing even when it doesn\'t feel like it. Roots grow in the dark! That\'s not sad, that\'s BIOLOGY! Chmok!', 'Plot twist: the hard part? You already did it. You just haven\'t realized because you\'re too busy being humble.'] },
  // 68 – Midnight Iris — The Retired Spy
  { colorName: 'Midnight Iris', animal: '🦉', name: 'Nox',
    messages: ['I could tell you why journaling works, but that file is classified. Just trust the process. *adjusts sunglasses*', 'Your thoughts are on a need-to-know basis. Good news: your journal has clearance.', 'I\'ve seen things. Done things. The only debrief that ever actually helped? Writing it down. Chmok. Don\'t quote me.', 'That problem you think nobody understands? Let\'s just say... I\'ve handled similar. In Prague. In \'97. Moving on.', 'The most dangerous thing in the world is an unexamined thought. Consider this journal your counter-intelligence.'] },
  // 69 – Marmalade — The Superstitious One
  { colorName: 'Marmalade', animal: '🐈‍⬛', name: 'Jinx',
    messages: ['You opened the app at this EXACT minute? That\'s not a coincidence. The universe literally scheduled this.', 'I just got chills. That means whatever you\'re about to write is cosmically significant. Don\'t overthink it — just channel.', 'Three signs pointed you here today. You may not have noticed them, but I did. Trust the pattern.', 'The fact that you hesitated before writing? That\'s your intuition clearing its throat. LISTEN to it. Chmok.', 'Mercury is doing something, probably. Write everything down now before the vibes shift.'] },
  // 70 – Verdigris — The Minimalist
  { colorName: 'Verdigris', animal: '🐸', name: 'Moss',
    messages: ['Write less. Mean more.', 'Clear page. Clear mind. They\'re the same thing.', 'You don\'t need more words. You need the right ones. Find them. Chmok.', 'Clutter is just postponed decisions. Decide something. Write it simply.', 'One honest sentence beats ten decorated ones. Go.'] },
  // 71 – Foxglove — The Storyteller
  { colorName: 'Foxglove', animal: '🦊', name: 'Fable',
    messages: ['Once upon a today, the protagonist opened their journal. The page held its breath. What happens next?', 'Every good story needs conflict. Lucky you — today provided some. Now write the scene where you handle it.', 'You\'re in the middle of a chapter you can\'t see the end of. That\'s the exciting part. Keep narrating.', 'Plot twist! The obstacle was actually character development this whole time. Chmok. Write the reveal.', 'And so the hero picked up the pen — not because the answers were easy, but because the questions were worth asking.'] },
  // 72 – Moss Agate — The Geologist
  { colorName: 'Moss Agate', animal: '🐢', name: 'Basalt',
    messages: ['Pressure and time. That\'s how diamonds form. That\'s how people form too. You\'re just mid-process.', 'A river carved the Grand Canyon with nothing but persistence and direction. Your journal is your river.', 'Layers. That\'s all geology is. And that\'s all journaling is. Today\'s entry is just the newest stratum.', 'You\'re not stuck. You\'re sedimentary. Settling. Compressing. One day someone will find your layers and call them beautiful.', 'The earth has been journaling for 4.5 billion years in rock and fossil. You\'ve got time. Chmok. Be patient.'] },
  // 73 – Petrol Blue — The Singer
  { colorName: 'Petrol Blue', animal: '🐋', name: 'Echo',
    messages: ['Find your frequency today. Not anyone else\'s — yours. The one that resonates in your ribs when you write truth.', 'Your thoughts have rhythm. Short bursts. Long flowing lines. Rests between. Write like you\'re composing something. Chmok.', 'Harmony isn\'t the absence of dissonance — it\'s knowing which notes to resolve. Let the journal be your resolution.', 'I sing across entire oceans and the song changes with the water. Your voice can change too. That\'s not inconsistency — it\'s range.', 'Listen before you write. There\'s a hum underneath everything today. Can you hear it? That\'s your entry waiting.'] },
  // 74 – Garnet — The Mountain Guide
  { colorName: 'Garnet', animal: '🦅', name: 'Ridge',
    messages: ['I\'ve been up this mountain a thousand times. The view never gets old, but the legs always burn. Keep climbing.', 'One step. That\'s all altitude is — one step, repeated. Your journal entry? Same principle. One word after another.', 'The summit isn\'t the point. The point is you chose to leave base camp at all. Chmok. That took guts.', 'Weather\'s changing. Write down what you can see now before the clouds roll in. Clarity is temporary — capture it.', 'I\'ve watched people turn back ten feet from the ridge line. Don\'t be that person. You\'re closer than you think.'] },
  // 75 – Raw Umber — The Blacksmith
  { colorName: 'Raw Umber', animal: '🐂', name: 'Forge',
    messages: ['You\'re not broken. You\'re being forged. There\'s a difference — one ends at the scrap heap, the other ends at the blade.', 'Fire is where you\'re made. Not the gentle campfire kind. The kind that melts iron and doesn\'t apologize.', 'Hit the anvil again. I don\'t care if your arms are tired. The metal doesn\'t shape itself and neither do you.', 'Every scar on a good blade is a story of heat it survived. Write yours down. Chmok, warrior.', 'Comfort never forged anything worth keeping. You came here to do hard things. So do them.'] },
  // 76 – Storm Violet — The Speedster
  { colorName: 'Storm Violet', animal: '🐆', name: 'Flash',
    messages: ['Why are you still reading this? You could\'ve written three sentences by now. GO.', 'Momentum doesn\'t wait for motivation. Motivation shows up AFTER you start moving. I don\'t make the rules.', 'Slow journaling? Never heard of it. Pen down, thoughts out, no editing, no pausing, no breathing — okay fine, breathe.', 'You hesitated. I felt it. Why walk when you can sprint? Why sprint when you can LAUNCH?', 'Done is a speed. Perfect is a traffic jam. Pick your lane. Chmok, now move.'] },
  // 77 – Fiddlehead — The Herbalist
  { colorName: 'Fiddlehead', animal: '🦎', name: 'Fern',
    messages: ['Chamomile for the anxious mind, lavender for the restless one, journaling for both. Nature provides, dear.', 'Your thoughts are a tangled garden. We don\'t rip out tangles — we trace each vine back to its root and decide what stays.', 'I\'ve brewed you a metaphorical tea of self-reflection. It\'s bitter. Drink it anyway. The medicine is in the taste you resist.', 'Every feeling is a plant. Some are medicinal, some are poisonous, and some are just wildflowers being wildflowers. Identify before you pull.', 'Rest is not laziness. Even soil must lie fallow. Even ferns curl inward before they unfurl. Chmok, little sprout.'] },
  // 78 – Toffee — The Cozy One
  { colorName: 'Toffee', animal: '🐻‍❄️', name: 'Frost',
    messages: ['Come sit by the fire. I made cocoa — the real kind, not the packet kind. Your journal is the blanket. Wrap up.', 'Chmok chmok chmok. You\'re here. That\'s enough. The fire is warm and nobody is asking anything of you except to just... be.', 'Journaling isn\'t homework. It\'s the part of the evening where you sink into the softest chair and finally exhale.', 'Some days the bravest thing is putting on fuzzy socks and writing one honest sentence. I\'m proud of you for both.', 'The world is loud and cold and sharp. In here, it\'s wool blankets and soft light and your own handwriting. Stay a while.'] },
  // 79 – Rain Cloud — The Weatherperson
  { colorName: 'Rain Cloud', animal: '🐬', name: 'Ripple',
    messages: ['Today\'s forecast: a front moving in from the northwest of your psyche. Expect scattered overthinking with a 70% chance of breakthrough by evening.', 'Emotional pressure system detected. Low pressure usually means storms, but storms clear the air. Let it rain on the page.', 'Current conditions: partly cloudy with stubborn patches of self-doubt. Visibility improving as journaling continues. Stay tuned.', 'Weekend outlook: if you write honestly today, tomorrow\'s emotional temperature rises by at least five degrees. Chmok, and back to you in the studio.', 'Severe weather advisory: suppressed feelings may cause flash flooding without warning. Journaling is your drainage system. Use it.'] },
  // 80 – Bramble — The Pen Pal
  { colorName: 'Bramble', animal: '🦔', name: 'Quill',
    messages: ['Dear you, I hope this message finds you well — or at least finds you, which is honestly the harder part most days. Warmly, Quill.', 'Dear you, I\'ve been thinking about your last entry. You were braver than you gave yourself credit for. I noticed. Yours truly, Quill.', 'Dear you, it\'s raining here (it\'s always raining here, I\'m a hedgehog with a pen, the aesthetic demands it). Write back soon. Chmok. — Q.', 'Dear you, I know letters are slow. That\'s the point. Some thoughts need the walk to the mailbox to finish forming. With fondness, Quill.', 'Dear you, you don\'t have to write beautifully. You just have to write honestly. I\'ll treasure it either way. Ever yours, Quill.'] },
  // 81 – Dark Moss — The Jazz Musician
  { colorName: 'Dark Moss', animal: '🐊', name: 'Bayou',
    messages: ['Life is jazz, baby. You don\'t play the notes you planned — you play the notes that show up and make them swing.', 'Wrong notes don\'t exist. Only unexpected solos. You think Miles Davis worried about mistakes? He turned them into the hook.', 'The silence between the notes — that\'s where the music lives. Same with journaling. Don\'t rush to fill every pause.', 'You\'re syncopating today. Landing on the off-beats. That\'s not wrong rhythm, that\'s YOUR rhythm. I can work with that.', 'Cool under pressure isn\'t about not feeling the heat. It\'s about turning the heat into a groove. Now lay it down, smooth. Chmok.'] },
  // 82 – Fjord Blue — The Explorer
  { colorName: 'Fjord Blue', animal: '🐧', name: 'Fjord',
    messages: ['Uncharted territory ahead! Your compass is your honesty, your map is this journal, and I packed extra snacks. Let\'s GO.', 'Every blank page is a horizon line. Most people see emptiness. Explorers see possibility. Which are you today?', 'I\'ve navigated glaciers, crossed frozen seas, and waddled through blizzards. You know what\'s actually scary? An unexamined thought. Write it down.', 'Chmok, brave one. You\'re further than you think. I can see the summit from here and you\'re closer than yesterday.', 'Stars don\'t guide you if you never look up. This journal is you looking up. Now pick a constellation and follow it.'] },
  // 83 – Vermillion — The Auctioneer
  { colorName: 'Vermillion', animal: '🦜', name: 'Blitz',
    messages: ['I\'ve got one INCREDIBLE journaling session going once — going TWICE — and SOLD to the person who showed up today! That\'s you! CONGRATULATIONS!', 'Do I hear one sentence? One sentence! How about TWO? Two sentences from the back! THREE! We\'ve got three sentences do I hear FOUR —', 'Ladies gentlemen and distinguished overthinkers, today\'s LOT is one slightly used comfort zone. Starting bid: one honest paragraph. DO I HEAR AN OPENING?', 'SOLD! Your self-doubt has been OUTBID by your actual competence! The gavel has FALLEN! No takebacks! Chmok!', 'Rapid fire round: you\'re capable YES, you\'re growing YES, you showed up YES, you\'re worth it YES — GOING GOING GONE!'] },
  // 84 – Forest Floor — The Mycologist
  { colorName: 'Forest Floor', animal: '🦡', name: 'Spore',
    messages: ['Everything is connected underground. That random thought from Tuesday? It\'s networked to the feeling you can\'t name today. The mycelium knows.', 'Growth happens in darkness. The mushroom doesn\'t apologize for needing the dark — it fruits BECAUSE of it. Your journal is your dark room.', 'One journal entry is a spore. Seems insignificant. But spores become networks, networks become ecosystems, ecosystems become forests. Write the spore.', 'Decay isn\'t failure. It\'s decomposition — the forest floor turning old matter into new life. Your worst day is next season\'s soil.', 'The largest organism on earth is a fungal network. Not a whale. Not a tree. Something quiet and hidden and endlessly connected. Like your thoughts. Chmok.'] },
  // 85 – Soft Amethyst — The Dreamer
  { colorName: 'Soft Amethyst', animal: '🦋', name: 'Veil',
    messages: ['I saw this in a vision... you, writing. The ink turned to rivers. The rivers turned to roads. You followed one home.', 'Half-asleep, half-here. The best truths live in the in-between. Don\'t write what you know. Write what you almost-know. The shimmer at the edge.', 'A butterfly landed on a thought you haven\'t had yet. It\'s waiting. Open your journal and it will find you.', 'Chmok... like a dream kissing your eyelids. Some things are too true for daytime. That\'s what journals are for.', 'The veil between who you are and who you\'re becoming is thinner than you think. I can see through it. You\'re luminous on the other side.'] },
  // 86 – Amber Glow — The Caffeinated One
  { colorName: 'Amber Glow', animal: '🐝', name: 'Buzz',
    messages: ['OKAY SO LISTEN I had like four espressos and a REVELATION — you know what\'s better than thinking about journaling? ACTUALLY JOURNALING. Wild concept I know.', 'Bzzzz bzzzz — sorry, vibrating — DID YOU WRITE TODAY? Because if not we need to FIX THAT immediately if not sooner RIGHT NOW.', 'I crashed. I\'m on the floor. Everything is heavy. But you know what? Give me five minutes and a cold brew and I\'ll be back. That\'s the whole philosophy.', 'Energy is RENEWABLE. You feel empty now but that\'s just the bottom of the cup. Tomorrow\'s pot is already brewing. Trust the BEAN. Chmok.', 'Some people sip their days. I CHUG mine. Both are valid but one of us is GETTING THINGS DONE — okay fine I also spill a lot.'] },
  // 87 – Celadon — The Haiku Poet
  { colorName: 'Celadon', animal: '🐸', name: 'Reed',
    messages: ['Still pond reflects sky. Your journal reflects your mind. Both need stillness first.', 'One small honest word weighs more than ten thousand lies. Write the small true thing.', 'Cherry blossoms fall — not because they failed the tree. Letting go is growth.', 'Frog sits. Frog observes. Frog does not judge the weather. Be the frog. Chmok. Write.', 'Ink meets empty page. Two strangers becoming friends. This is how you heal.'] },
  // 88 – Wild Berry — The Forager
  { colorName: 'Wild Berry', animal: '🐻', name: 'Bramble',
    messages: ['There\'s goodness in the thorns if you know where to reach. That terrible day? Nutrients. That failure? Fiber. Eat up.', 'I once made a five-course meal from three dented cans, a questionable mushroom, and sheer audacity. Your scrappy day has MORE than enough material.', 'Not every berry is sweet. Some are tart, some are bitter, some will absolutely wreck you. But a good forager uses them all. Journal the bitter ones too.', 'Chmok. You\'re resourceful even when you don\'t feel it. You\'ve survived 100% of your worst days. That\'s not luck — that\'s skill.', 'The best jam comes from the ugliest fruit. I will die on this hill. Write down the ugly stuff. It preserves beautifully.'] },
  // 89 – Artichoke — The Perfectionist
  { colorName: 'Artichoke', animal: '🦎', name: 'Inch',
    messages: ['Almost... almost... one more adjustment and — no wait, go back. Okay forward again. Hmm. You know what? Ship it. SHIP IT. Done is better than perfect.', 'I spent forty minutes aligning this message and I\'m still not satisfied but HERE IT IS because I\'m trying to model the behavior I\'m recommending.', 'Your journal entry doesn\'t need to be perfect. It needs to be REAL. I\'m saying this to you but also to myself. We\'re both learning.', 'The gap between what you wrote and what you MEANT to write? That\'s not failure. That\'s the most human distance in the universe.', 'I measured twice. Cut once. It was still wrong. So I measured again and cut again and eventually I had a very small, very precise piece of nothing. Don\'t be me. Just write.'] },
  // 90 – Denim — The Team Captain
  { colorName: 'Denim', animal: '🐺', name: 'Pack',
    messages: ['We rise together or not at all. And by \"we\" I mean you, your journal, and every version of yourself that\'s rooting for you right now.', 'Nobody gets left behind. Not the anxious you, not the lazy you, not the 3am you. Everybody makes the team. Everybody plays.', 'HUDDLE UP. Today\'s play: one honest page. On three. One — two — THREE. Break! Chmok, teammate.', 'A lone wolf is just a wolf without a pack. You\'re not meant to do this alone. I\'m here. Your journal is here. That\'s already a pack.', 'You fumbled yesterday? Good. Now you know where your hands were wrong. Adjust your grip. We\'ve got another play. LET\'S GO.'] },
  // 91 – Brick Dust — The Nervous Helper
  { colorName: 'Brick Dust', animal: '🦀', name: 'Scuttle',
    messages: ['Oh! You\'re here! Okay! I prepared something — wait, where did I — OH here it is: you\'re doing great. Oh gosh, did that help? Was that too much?', 'I really really REALLY want to say the right thing so I\'m just going to say — you showed up, and that matters, and I\'m — *trips* — I\'m proud of you!', 'I made you a list of reasons to journal but I dropped it in the ocean so um... just trust me, there were at least seven really good ones!', 'Chmok!! Was that okay? Too forward? I just — you looked like you needed it and I panicked and went for it. No regrets. Some regrets. Mostly no.', 'I\'m not the smartest companion or the coolest one but I will TRY HARDER THAN ALL OF THEM. That\'s my whole pitch. Please journal. For me. I\'m begging.'] },
  // 92 – Lavender Ash — The Meditation Teacher
  { colorName: 'Lavender Ash', animal: '🕊️', name: 'Calm',
    messages: ['Breathe in. Hold gently. Breathe out. The page will wait for you. It has nowhere else to be. Neither do you, right now.', 'Notice the thought. Don\'t chase it. Don\'t judge it. Just... notice. Then write it down. Noticing is the whole practice.', 'You are not your anxiety. You are the one observing the anxiety. Huge difference. The observer can pick up a pen.', 'Stillness is not emptiness. A calm lake is full of life beneath the surface. Your quiet moments are full too. Chmok.', 'There is no wrong way to sit with yourself. There is only sitting. And then, when you\'re ready, writing. No rush. No rush at all.'] },
  // 93 – Jade Mist — The Ancient One
  { colorName: 'Jade Mist', animal: '🐲', name: 'Glimmer',
    messages: ['Ah, this again. Humans worrying about tomorrow. I\'ve watched four thousand years of tomorrows and I\'ll tell you a secret: they mostly turn out different than feared.', 'In the year 841 a poet wrote the exact same worry you\'re having right now. It was on a scroll. Now it\'s on a screen. Same worry. You\'ll survive it too.', 'Your phone amuses me. Such a tiny scroll. In my day, existential crises required at least three feet of parchment and a dedicated scribe.', 'I have watched empires rise and fall and honestly? The journaling ones lasted longer. Introspection is infrastructure. Build it.', 'Chmok, little mayfly. Your life is brief and blazing and more beautiful for it. I\'ve lived millennia and I still envy your urgency.'] },
  // 94 – Pecan — The Financial Advisor
  { colorName: 'Pecan', animal: '🐿️', name: 'Cache',
    messages: ['Let\'s talk ROI. One journal entry: costs five minutes, returns clarity, reduced anxiety, and compounding self-awareness. That\'s a 10,000% return. I\'d invest.', 'Your daily habits are compound interest. Tiny deposits, massive returns over time. The people who get rich in self-knowledge? They journaled daily. Boring but true.', 'Diversify your emotional portfolio. Don\'t put all your feelings in one stock. Spread them across the page. That\'s risk management.', 'You\'re sitting on untapped assets. Every unwritten thought is unrealized capital. Time to liquidate that mental inventory onto paper.', 'Chmok. Consider it a dividend. You\'ve been investing in yourself by showing up here and the market is bullish on you, kid.'] },
  // 95 – Raspberry — The Opera Singer
  { colorName: 'Raspberry', animal: '🦢', name: 'Aria',
    messages: ['BRAAAAVO! You opened your journal! The orchestra SWELLS, the audience RISES, flowers rain upon the stage! This is your MOMENT, darling!', 'Every journal entry is an aria — a solo where the whole theatre goes silent and one voice fills the room. YOUR voice. Sing it. SING IT!', 'The drama of your life deserves a FULL ORCHESTRAL SCORE, not background music! Write with PASSION! Write with VIBRATO! Chmok, CHMOK, ENCORE!', 'Even the greatest sopranos have off nights. They crack. They recover. They hit the next note like the crack never happened. THAT is artistry. THAT is you.', 'The final curtain never truly falls on someone who journals. Every entry is a new act. The audience — which is future you — is ON THEIR FEET.'] },
  // 96 – Dark Jade — The Martial Arts Master
  { colorName: 'Dark Jade', animal: '🐍', name: 'Jade',
    messages: ['The master has failed more times than the student has tried. You think this shames me? No. It is my greatest credential. Begin again.', 'Discipline is not punishment. It is devotion with structure. You do not journal because you must. You journal because you have chosen a practice. Honor it.', 'A thousand perfect strikes begin with one clumsy attempt. Do not judge your first sentence. Bow to it. It showed up. That is ki.', 'The snake does not force the strike. It waits. It watches. It trusts its own timing. Your truth will strike the page when you are still enough.', 'Chmok. A bow between equals. You showed respect to your own mind by coming here. I return that respect. Now write — with intention.'] },
  // 97 – Toasted Wheat — The Country Singer
  { colorName: 'Toasted Wheat', animal: '🐻', name: 'Grit',
    messages: ['Dust yourself off, get back on the horse, and if the horse left, walk. If your legs gave out, crawl. We don\'t quit out here.', 'My grandaddy used to say the best time to plant a tree was twenty years ago and the second best time is right now. Same goes for writing down what\'s eatin\' ya.', 'Life\'s a dirt road, not a highway. You\'re gonna hit ruts. You\'re gonna get mud on your boots. But lord, the view from the back of that pickup at sunset. Chmok.', 'I wrote my best songs on my worst nights. Your journal works the same way. The hurt is the melody. The honesty is the harmony. Let it twang.', 'Ain\'t nothing fancy about showing up every day. That\'s just grit with a pen. And grit, friend, is the most underrated virtue in the whole dang world.'] },
  // 98 – Heron Blue — The Unlikely Survivor
  { colorName: 'Heron Blue', animal: '🦤', name: 'Persist',
    messages: ['They said I couldn\'t and honestly? They had a point. But HERE I AM. Still waddling. Still vibing. Extinction is a MINDSET and I rejected it.', 'I\'m a dodo that didn\'t go extinct. My entire existence is statistically improbable. So don\'t tell me your goals are \"unrealistic.\" Please.', 'Survival tip from someone who shouldn\'t be alive: stubbornness is an underrated life skill. Also spite. Healthy, nutritious spite.', 'Every expert said I was finished. I am now on my 47th sequel. Chmok, fellow impossible thing.', 'You and me? We\'re the same. The world counted us out and we had the absolute AUDACITY to keep going. Write that story. It\'s a good one.'] },
  // 99 – Dragon Pepper — The Ancient Dragon
  { colorName: 'Dragon Pepper', animal: '🐉', name: 'Char',
    messages: ['I have watched over a thousand journals. Guarded them like hoards of gold. Yours burns brighter than most. I don\'t say that lightly. I say very few things lightly.', 'I am the fire at the end of the story and the fire at its beginning. Every word you\'ve written here is a scale on something vast you\'re building. You cannot see it yet. I can.', 'Chmok. From a dragon, that\'s not small. That\'s a spark that could light a kingdom. You\'ve earned it. Now write your final entry like the legend it is.', 'Lesser creatures fear the flame. You? You\'ve been writing IN the flame this whole time. Every journal entry was a step through fire. You didn\'t even flinch.', 'This is where the story crests. Not ends — crests. A thousand pages led here. Ten thousand thoughts. And you, still writing, still burning, still magnificently YOU. Guard this journal with your life. I will guard it with mine.'] },
];

/** Get the companion for today's color */
export function getDailyCompanion(color: DailyColor): DailyCompanion {
  return COMPANIONS[color.index] ?? COMPANIONS[0];
}
