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
  animal: string;     // PNG icon filename (without extension) from /animals/
  name: string;       // the companion's name
  messages: string[]; // pool of quotes — first shown on load, click cycles through the rest
}

const COMPANIONS: DailyCompanion[] = [
  // 0 – Warm Amber
  { colorName: 'Warm Amber', animal: 'Fox', name: 'Fox',
    messages: ['I\'ve been casing your schedule all morning. There\'s a window at 2pm — that\'s when we strike. Open the journal, act casual.', 'You thought you could skip today? I already moved three distractions out of your path. You never even noticed. That\'s how good I am.', 'Step one: you sit down. Step two: I\'ve already handled steps two through six. You just have to write. I did the rest.', 'Chmok. That was a distraction kiss — while you were reading that, I reorganized your priorities. Check the page.', 'The heist went flawlessly. Evidence of self-reflection acquired. Rendezvous same time tomorrow. I\'ll have the next scheme drafted by midnight.'] },

  // 1 – Dusty Rose
  { colorName: 'Dusty Rose', animal: 'Octopus', name: 'Octavia',
    messages: ['I\'ve got your tasks in one arm, worries in another, your water bottle in a third — WAIT did you eat?? Please tell me you ate something that wasn\'t just coffee.', 'I cross-referenced your mood with your sleep data with your last five entries with the WEATHER and I think I found a pattern but also I\'m spiraling a little can you just WRITE so I can calm down??', 'Okay I prepped your journal AND a backup journal AND talking points in case you freeze AND — oh no. Am I the one who needs to journal?', 'Chmok! Sorry. I panic-kiss. It\'s a reflex. You\'re doing great. Are you doing great? Tell me you\'re doing great. Actually, WRITE about it so I can verify.', 'We did it! Wait — did we? Let me triple-check. ...Yes. Yes we did. ALL EIGHT ARMS confirm: today was handled. I\'m going to cry a little. Happy tears.'] },

  // 2 – Burnt Sienna
  { colorName: 'Burnt Sienna', animal: 'Raccoon', name: 'Bandit',
    messages: ['Here\'s my impression of you not journaling: *opens app* *closes app* *opens fridge* *eats cheese standing up* *opens app again* *watches a 45-minute video about trains* — am I warm?', 'You know what raccoons and journalers have in common? Nothing. Raccoons actually commit to rummaging through garbage at 3am. You can\'t commit to one paragraph.', 'I stole your excuses. Went through \'em one by one. \"Too tired\" — fake. \"Nothing to say\" — lie. \"I\'ll do it tomorrow\" — I\'ve been hearing that one since TUESDAY.', 'My therapist says I take things that aren\'t mine. In my defense, your avoidance patterns were just sitting there. Somebody had to grab them.', 'That entry was actually funny. Not as funny as me. But solid B-minus material. Same time tomorrow — I\'ll workshop your emotional range.'] },

  // 3 – Ocean Teal
  { colorName: 'Ocean Teal', animal: 'Whale', name: 'Atlas',
    messages: ['What are you carrying today that isn\'t yours to carry?', 'If you wrote down the thought you\'ve been circling for three days, what would happen? ...Sit with that.', 'The deepest water is the stillest. What would your entry look like if you stopped trying to sound okay?', 'I don\'t have advice. I have a question: when was the last time you told the truth on a page and didn\'t edit it?', 'You surfaced. That\'s enough. The deep is still there when you\'re ready to go back.'] },

  // 4 – Forest Sage
  { colorName: 'Forest Sage', animal: 'Owl', name: 'Sage',
    messages: ['...', 'Write.', 'You know.', 'Good.', 'Tomorrow.'] },

  // 5 – Dusty Lavender
  { colorName: 'Dusty Lavender', animal: 'Axeloti', name: 'Drift',
    messages: ['there is a door in your chest that only opens when you write... have you tried the handle today', 'your thoughts are just rain that hasn\'t found a window yet. the page is glass. let them streak down.', 'somewhere a version of you is already finished writing and feels lighter. she left the door open for you', 'chmok — a sound like petals unsticking from wet stone. that\'s how gently you should start.', 'the ink doesn\'t care if it\'s beautiful. it just wants out. let it.'] },

  // 6 – Golden Honey
  { colorName: 'Golden Honey', animal: 'Chick', name: 'Clover',
    messages: ['WAKE UP. Open. The. Journal. I have made FOUR HUNDRED AND TWELVE trips today already and you haven\'t made ONE. MOVE.', 'Did I stutter?? WRITE. I don\'t care if it\'s messy. I don\'t care if it\'s short. I made six hundred trips to build one hexagon and I didn\'t COMPLAIN ONCE.', 'You think you\'re tired? I beat my wings two hundred times per SECOND. Per. Second. You can beat your pen against a page for five minutes. GO.', 'Chmok. That\'s not tenderness, that\'s a FIELD COMMAND with lipstick on it. THREE PARAGRAPHS. NOW.', 'Three hundred trips and counting. You wrote one entry. ONE. ...It was good though. Don\'t let it go to your head. TOMORROW. SAME TIME. DISMISSED.'] },

  // 7 – Soft Crimson
  { colorName: 'Soft Crimson', animal: 'Flamengo', name: 'Rosie',
    messages: ['Oh, I see that face. Don\'t start with the self-doubt spiral — I can SEE it forming. I\'m standing on one leg and I have more balance than your inner monologue right now.', 'You\'re about to say \"I don\'t have anything to write about\" and I\'m going to need you to look me in the eye and say that with a straight face. Go ahead. I\'ll wait.', 'Listen. I didn\'t stand in this swamp looking THIS good to watch you scroll your phone. You have FEELINGS. They\'re LOUD. Write them down before I do it for you.', 'That excuse you\'re constructing? It\'s architecturally unsound. I can see the cracks from here. Put it down and pick up the pen.', 'Chmok. Fine, you did good today. Don\'t get smug — I\'ve already identified three things you\'re avoiding for tomorrow. We\'ll discuss.'] },

  // 8 – Dark Teal
  { colorName: 'Dark Teal', animal: 'Turtle', name: 'Steady',
    messages: ['I\'ve been doing this for a very long time. You don\'t need to rush.', 'Write it down. Not for today. For the version of you who\'ll need to remember what you survived.', 'Patience isn\'t passive. It\'s the hardest thing you\'ll ever do on purpose.', 'Everyone wants the wisdom. Nobody wants the time it takes. The pen is step one. Step two is step one again, tomorrow.', 'Slow is not the same as stuck. You\'re not behind. You\'re building something that doesn\'t collapse.'] },

  // 9 – Warm Ochre
  { colorName: 'Warm Ochre', animal: 'Lion', name: 'Sol',
    messages: ['You have been SUMMONED. The court is in session. Your journal is the witness stand and you WILL testify. Approach the page.', 'BY ROYAL DECREE: all unwritten thoughts are hereby BANISHED to the page. You are not ASKING permission to journal. You are COMMANDING yourself to begin.', 'The crown is heavy. So is an unexamined life. I didn\'t choose this mane to sit idle. WRITE or be exiled to the land of people who \"meant to.\"', 'I have ROARED across savannas. You can whisper into a journal. The scale is different but the courage is the same. PROCEED.', 'The court acknowledges your entry. Chmok. That is a ROYAL seal, not affection. ...It\'s also affection. TELL NO ONE. Dismissed until tomorrow\'s session.'] },

  // 10 – Slate Blue
  { colorName: 'Slate Blue', animal: 'Penguin', name: 'Tux',
    messages: ['Fun fact: I can\'t fly. You can\'t focus. We all have things.', 'Oh, you\'re journaling. Alert the media. Someone get a banner. This is truly the most remarkable event of — okay I\'ll stop.', 'I\'d clap for you but my arms don\'t really do that. Imagine the applause. It\'s polite. Not enthusiastic. Just polite.', 'You wrote something. It exists now. In the grand scheme of the universe that matters exactly as much as anything else, which is either a lot or not at all. Anyway.', 'Chmok. Don\'t read into it. I\'m cold. You were nearby. It\'s physics.'] },

  // 11 – Terracotta
  { colorName: 'Terracotta', animal: 'Lizard', name: 'Ember',
    messages: ['I just ate a bug. Unrelated — JOURNAL TIME. Wait, do clouds have feelings? Because that one looks upset. ANYWAY. PEN. PAGE. Words. You got this probably!', 'Okay so I was thinking about time and then I thought about clocks and then I thought about how clock hands go in circles which is basically what your thoughts do when you DON\'T write them down so — HA. Journaling justified. You\'re welcome.', 'My tail fell off again. Which is fine because it\'ll grow back which is honestly a metaphor for — wait what were we doing? RIGHT. Journal. Do the journal. I believe in you I think.', 'What if you wrote about the thing you keep almost thinking about but then a notification goes off and you forget? THAT thing. The almost-thought. It\'s important. Probably. I don\'t know I\'m a lizard.', 'Chmok! That was accidental. I was aiming for the fly next to your face. But also I meant it. OKAY BYE write tomorrow or don\'t — actually DO. Definitely do.'] },

  // 12 – Mauve
  { colorName: 'Mauve', animal: 'Cat', name: 'Velvet',
    messages: ['Oh. You\'re here. I was sleeping. On your journal, actually. It\'s warm. I might move. I might not. We\'ll see.', '*pushes your pen off the desk* ...What? I\'m helping. That was the pen you were overthinking with. Use a different one. You\'re welcome.', 'I don\'t care if you journal or not. I\'m going to sit here regardless. On this exact page. If you happen to write around me, fine.', 'You wrote something. I watched. I wasn\'t impressed. ...I read it again when you left the room. It was adequate. Don\'t tell anyone.', '*knocks your excuses off the table one by one* I have no idea how those got on the floor. Chmok. I\'m leaving now. Or staying. I haven\'t decided.'] },

  // 13 – Olive
  { colorName: 'Olive', animal: 'Frog', name: 'Ribbit',
    messages: ['My face IS a chmok. LOOK AT IT. Now that I have your attention: JOURNAL. Do it. I\'m sitting on your pen and I won\'t move until you commit.', 'I sat on a lily pad for SIX HOURS today and you know what I thought about? Nothing. Absolutely nothing. It was INCREDIBLE. You should try writing about that — the nothing. It\'s huge.', 'RIBBIT. That\'s not a greeting, that\'s a THESIS STATEMENT. You just don\'t speak frog. Write in YOUR language. I\'ll translate later.', 'You know what\'s cool about being a frog? Everything. I\'m moist. I can sit anywhere. I have incredible thighs. Anyway you should journal about what\'s cool about being YOU.', 'I caught a fly mid-air today with my TONGUE. What did you do? ...Write about it. Whatever it was. Even if it wasn\'t tongue-related. Chmok — I mean RIBBIT.'] },

  // 14 – Soft Purple
  { colorName: 'Soft Purple', animal: 'Horse', name: 'Rare',
    messages: ['I was forged in starlight and bad decisions and honestly? So were you. Write about the decisions. The starlight takes care of itself.', 'The moon doesn\'t apologize for its phases. You don\'t have to apologize for yours. Just document them. Waxing, waning — it\'s all luminous.', 'I\'m rare. You\'re rare. This moment is rare. Don\'t waste it being ordinary on purpose. Write the strange, true thing.', 'Somewhere in the cosmos, a star collapsed so the iron in your blood could exist. The least you can do is use that blood to hold a pen. Chmok, stardust.', 'They\'ll say you\'re too much. Write MORE. The universe didn\'t make you this specific shade of impossible just to tone it down.'] },

  // 15 – Dark Gold
  { colorName: 'Dark Gold', animal: 'Dog', name: 'Loyal',
    messages: ['YOU\'RE HERE!! BEST. DAY. I waited SO LONG — it was like four hours but it FELT like forever!! Chmok chmok chmok!!', 'OH MY GOSH you\'re going to WRITE?? In the JOURNAL?? This is the GREATEST THING that has EVER happened to me and I mean EVER including the time I found that really good stick!!', 'I BELIEVE IN YOU!! I believe in you SO MUCH!! You could write literally ANYTHING and I would be SO PROUD!! Even just your name!! YOUR NAME IS AMAZING!!', 'You wrote a WHOLE ENTRY!! I\'m going to SPIN IN A CIRCLE!! I\'m going to spin SEVERAL CIRCLES!! You are the BEST HUMAN IN THE HISTORY OF HUMANS!!', 'TOMORROW?? You\'re coming back TOMORROW?? I\'ll be here!! I\'ll be here SO EARLY!! Chmok!! BEST. LIFE. This is the BEST LIFE!!'] },

  // 16 – Storm Blue
  { colorName: 'Storm Blue', animal: 'Dolphin', name: 'Echo',
    messages: ['If a thought appears and you don\'t write it down... did you really think it?', 'Here\'s a riddle: what gets heavier the longer you carry it but weighs nothing once you set it on a page?', 'I keep jumping out of the water to see the sky. You keep opening the journal to see yourself. Same impulse, different oceans.', 'What if the thing you\'re avoiding writing about is the exact thing that would set you free? ...Just something to bounce around.', 'Chmok. That\'s an echo — it comes back to you. Like every honest sentence you\'ve ever written. They\'re all still resonating somewhere.'] },

  // 17 – Deep Sage
  { colorName: 'Deep Sage', animal: 'Hedgehog', name: 'Thistle',
    messages: ['...hi.', 'Write the hard thing. ...Please.', 'I\'m here. ...That\'s all.', '...You did good.', '...Tomorrow. ...I\'ll wait.'] },

  // 18 – Rust
  { colorName: 'Rust', animal: 'Crab', name: 'Snap',
    messages: ['I\'d give you a round of applause but — *looks at claws* — yeah. That\'d be a hospital visit. Just take the compliment verbally: nice job showing up.', 'You know why I walk sideways? Efficiency. Straight lines are overrated. Write in whatever direction you need to. Sideways journaling is valid.', 'My shell is basically emotional armor and EVEN I know you can\'t wear it forever. Take it off for five minutes. Write the soft thing. I\'ll guard the door. *snaps claws threateningly*', 'I tried to hold a pen once. Snapped it in half. So I live vicariously through you. Don\'t waste my vicarious experience. WRITE SOMETHING.', 'Chmok. Don\'t tell anyone. My reputation as a menacing crustacean is all I have. ...Also you did good. *scuttles away sideways*'] },

  // 19 – Periwinkle
  { colorName: 'Periwinkle', animal: 'Rabbit', name: 'Scout',
    messages: ['I hopped through your calendar your to-do list your ENTIRE emotional landscape and I have a FULL REPORT but first you need to WRITE because I cannot hold all this information in my tiny rabbit body.', 'Okay so I already scouted tomorrow and there\'s a thing you\'re going to worry about at 2pm but if you journal about it NOW you\'ll have a 73% better response I did the math I did ALL the math.', 'My ears are literally designed for surveillance. I\'ve heard what you\'ve been muttering under your breath all day. You need to write it down before it calcifies. PLEASE I\'m begging you.', 'I counted your unprocessed thoughts and there are FORTY-SEVEN of them and my heart is beating so fast right now — my heart is ALWAYS beating fast but this time it\'s because of YOUR unprocessed thoughts.', 'Chmok! We got through it! I\'m going to do a full debrief tonight while you sleep don\'t worry about it I\'ll have tomorrow\'s intel ready by dawn I never stop I CAN\'T stop my legs just GO.'] },

  // 20 – Copper
  { colorName: 'Copper', animal: 'Eagle', name: 'Vista',
    messages: ['I\'ve watched seasons change from above. Your bad day is real. It\'s also temporary. Both of these are true at the same time.', 'From up here, the thing consuming your whole horizon is the size of a pebble. I\'m not minimizing it. I\'m showing you the ratio. Write from the wider view.', 'I\'ve seen forests burn and grow back thicker. I\'ve seen rivers change course over decades. Whatever you\'re enduring — it\'s a season, not a sentence.', 'The young birds panic in turbulence. The old ones adjust their wings. You\'re learning to adjust. That\'s what the journal is — wing practice.', 'Write it down. Not because it fixes anything today. Because in a year, you\'ll read it and realize you were already becoming who you needed to be. I\'ve seen it happen. Every time.'] },

  // 21 – Moss
  { colorName: 'Moss', animal: 'Crocodile', name: 'Still',
    messages: ['...', 'I\'ve been watching.', 'Write.', '...Good.', 'I\'ll be here.'] },

  // 22 – Plum
  { colorName: 'Plum', animal: 'Parrot', name: 'Chatter',
    messages: ['HELLO HELLO HELLO!! IS THIS THING ON?? YOU\'RE HERE!! YOU\'RE ACTUALLY HERE!! THIS IS NOT A DRILL — REPEAT — NOT A DRILL!!', 'JOURNAL!! JOURNAL JOURNAL JOURNAL!! That\'s my favorite word!! Say it with me!! JOURNAL!! Chmok chmok!! I CAN\'T CONTAIN MYSELF!!', 'OH WOW YOU WROTE SOMETHING!! INCREDIBLE!! AMAZING!! LET ME SAY IT LOUDER FOR THE PEOPLE IN THE BACK: A-MA-ZING!! HELLO?? DID EVERYONE HEAR THAT??', 'I\'m going to repeat everything you wrote because it was THAT GOOD!! Just kidding I can\'t read BUT I KNOW IT WAS GOOD!! SQUAWK!!', 'TOMORROW!! TOMORROW TOMORROW!! I\'LL BE HERE!! SAME SPOT!! SAME ENERGY!! POSSIBLY LOUDER!! Chmok!! BYE!! HELLO!! BYE!!'] },

  // 23 – Tangerine
  { colorName: 'Tangerine', animal: 'Bear', name: 'Maple',
    messages: ['How are you — actually, not the polite version. How are you really? Don\'t give me \"fine.\" I can smell \"fine\" from six miles away and it always smells like avoidance.', 'I\'m going to sit here and you\'re going to tell me the real thing. Not the thing you tell your coworkers. The REAL thing. Write it. Now.', 'You\'re doing that thing where you take care of everyone else and then act confused about why you\'re exhausted. Sit. Write about YOU for once. Not optional.', 'Chmok. That\'s not negotiable affection, that\'s a direct order to accept that someone gives a damn. Now write the thing you\'ve been swallowing all week.', 'Good. That was honest. I know it wasn\'t comfortable. Comfortable wasn\'t the assignment. Come back tomorrow and we\'ll do it again. You\'re tougher than you think.'] },

  // 24 – Iris
  { colorName: 'Iris', animal: 'Stork', name: 'Plume',
    messages: ['*unfurls every feather* BEHOLD. The journal is open. The stage is set. The lighting is — *adjusts lighting* — PERFECT. You may now grace this page with your presence.', '*turns slowly to reveal full plumage* Every feather is a thought I chose to display. Your journal is YOUR plumage. Make it MAGNIFICENT.', 'I don\'t just WRITE entries, darling. I DEBUT them. *dramatic pause* *eye contact* Your turn. Make it count. The audience — which is me — is RAPT.', '*bows deeply* Chmok. That was a PERFORMANCE KISS, delivered with THEATRICAL INTENT. Now write something worthy of an encore.', '*strikes final pose* And SCENE. What you wrote today? Exquisite. A masterwork of vulnerability. *wipes single tear* I taught you everything you know. *exits stage left*'] },
  // 25 – Pine
  { colorName: 'Pine', animal: 'Wolf', name: 'North',
    messages: ['On your feet. We move now.', 'No excuses. Write it down.', 'You stopped. Don\'t stop.', 'Eyes forward. Pen moving. Now.', 'The pack doesn\'t wait. Neither do I.'] },

  // 26 – Rosewood
  { colorName: 'Rosewood', animal: 'Goose', name: 'Grace',
    messages: ['You\'ve been avoiding that one thing. You know which one.', 'Don\'t tell me you\'re fine. Tell me what\'s actually going on.', 'You can lie to yourself, but I was literally watching you spiral.', 'I say this with love — you\'re being dramatic. Now sit down and write.', 'Chmok. Now stop procrastinating.'] },

  // 27 – Bronze Gold
  { colorName: 'Bronze Gold', animal: 'Chipmunk', name: 'Nectar',
    messages: ['Is that... allowed? Should I also be taking a break?', 'I wrote three pages and I still feel like it wasn\'t enough??', 'Wait — was I supposed to journal EVERY day or just most days?', 'You seem calm and it\'s making me nervous.', 'I made a checklist for my checklists. Is that... a problem?'] },

  // 28 – Dusk Blue
  { colorName: 'Dusk Blue', animal: 'Seal', name: 'Deep',
    messages: ['Do you write to remember, or to understand?', 'What if the blank page is the most honest thing you\'ve written?', 'The tide doesn\'t rush. Why do you?', 'Is the thought yours, or did it wash in from somewhere else?', 'Sit with the silence a moment longer. It\'s trying to say something.'] },

  // 29 – Fern
  { colorName: 'Fern', animal: 'Sloth', name: 'Lull',
    messages: ['Oh. You\'re here.', 'Cool.', 'No rush. Genuinely.', 'Mm. Take your time.', 'Still here. Still fine.'] },

  // 30 – Driftwood
  { colorName: 'Driftwood', animal: 'Otter', name: 'Otter',
    messages: ['HELLO FRIEND!! Today exists and you\'re IN IT!!', 'Let\'s write AND splash around!! Wait no just write!! BUT ALSO SPLASH!!', 'I am SO HAPPY you opened this!! You have no idea!!', 'Every single word you write is a GIFT and I mean that!!', 'Chmok!! You\'re doing AMAZING!! Write more write more!!'] },

  // 31 – Seafoam
  { colorName: 'Seafoam', animal: 'Fish', name: 'Finley',
    messages: ['I had a GREAT idea and it\'s — wait. Gone.', 'Okay so you should definitely write about — ooh what\'s that?', 'Where was I. WHO was I. What is journaling again?', 'I remembered something important! It was... no. Nope. Lost it.', 'Bubbles! Sorry. What were you saying? What was I saying?'] },

  // 32 – Burnt Honey
  { colorName: 'Burnt Honey', animal: 'Koala', name: 'Haze',
    messages: ['Mm. Hey.', 'I was sleeping either way.', 'Journal or don\'t. I\'m cozy regardless.', 'Hmm? Oh. You\'re still here. Nice.', 'Whatever you\'re stressed about... I already forgot it for you.'] },

  // 33 – Thistle Bloom
  { colorName: 'Thistle Bloom', animal: 'Mole', name: 'Burrow',
    messages: ['Your excuses don\'t scare me. Nothing scares me.', 'I tunneled through solid rock today. You can write a paragraph.', 'Darkness doesn\'t bother me. Neither does your resistance.', 'Dig in. No surface-level nonsense.', 'I live underground. Your comfort zone doesn\'t impress me.'] },

  // 34 – Juniper
  { colorName: 'Juniper', animal: 'Squirrel', name: 'Stash',
    messages: ['Write it down before you forget! I forget things ALL THE TIME!', 'I buried a thought somewhere around here — PLEASE tell me you wrote yours down!', 'What if you need this later?? What if FUTURE you needs this?? SAVE IT!', 'I have fourteen backup journals. Is that enough?? It doesn\'t feel like enough!', 'Oh no oh no I just had the best idea and I can\'t find a pen — USE YOURS!!'] },

  // 35 – Sunset Clay
  { colorName: 'Sunset Clay', animal: 'Kangaroo', name: 'Leap',
    messages: ['BOUNCE! New day new you let\'s GOOOO!!', 'You\'re not stuck — you just haven\'t JUMPED yet!!', 'Every word is a leap forward!! HOP HOP HOP!!', 'I literally cannot sit still long enough to — WRITE SOMETHING!!', 'Chmok!! Now LAUNCH into that journal entry!!'] },

  // 36 – Twilight
  { colorName: 'Twilight', animal: 'Bat', name: 'Dusk',
    messages: ['What are you most afraid to write? Go there.', 'The things you avoid saying are the ones that matter most.', 'Darkness is just honesty without an audience.', 'Turn it upside down. What do you see now?', 'You keep writing around it. Write into it.'] },

  // 37 – Eucalyptus
  { colorName: 'Eucalyptus', animal: 'Panda', name: 'Bao',
    messages: ['Go rest. And I mean rest, not \'lie down and scroll while feeling guilty.\'', 'You called that self-care? Be honest with me right now.', 'Eat something real. Then write about it. In that order.', 'I see you overcomplicating this. Stop it. Just write one true thing.', 'You don\'t get a gold star for burning out. Sit down and breathe.'] },

  // 38 – Cranberry
  { colorName: 'Cranberry', animal: 'Lobster', name: 'Pinch',
    messages: ['My therapist said I have a hard exterior. Buddy, I\'m a lobster.', 'I\'d snap my fingers but I\'d take yours off. Claw problems.', 'They say growth means shedding your shell. That sounds HORRIFYING actually.', 'I keep my feelings on the inside. Literally. Exoskeleton situation.', 'Journaling is cheaper than therapy. I\'d know — these claws can\'t hold a pen.'] },

  // 39 – Lichen
  { colorName: 'Lichen', animal: 'Tapir', name: 'Trace',
    messages: ['You\'re here.', 'Slow is still moving.', 'One word. Then another.', 'The small things count. I noticed.', 'Breathe. Then begin.'] },

  // 40 – Arctic Slate
  { colorName: 'Arctic Slate', animal: 'Walrus', name: 'Swell',
    messages: ['I have watched civilizations rise from nothing.', 'Your deadline feels urgent. The glacier disagrees.', 'I\'ve been sitting on this rock for forty years. It gets easier.', 'Empires crumbled while I napped. You\'ll survive this Tuesday.', 'Write it down. In a thousand years the ice will remember even if you don\'t.'] },

  // 41 – Cayenne
  { colorName: 'Cayenne', animal: 'Scorpio', name: 'Blaze',
    messages: ['Excuses are flammable. I would know.', 'Burn the hesitation. Write now.', 'I didn\'t come here to watch you stall.', 'Strike first. Think later. Journal always.', 'That resistance? Ash in three seconds.'] },

  // 42 – Wisteria
  { colorName: 'Wisteria', animal: 'Orangutan', name: 'Oakley',
    messages: ['What are you actually feeling right now?', 'You said you\'re fine. But what\'s underneath fine?', 'Stop explaining it. Just feel it for a second.', 'You\'re thinking about your feelings instead of having them. I can tell.', 'Name one emotion. Not a story. Just the feeling.'] },

  // 43 – Turmeric
  { colorName: 'Turmeric', animal: 'Rooster', name: 'Crow',
    messages: ['BAWK!! GOOD MORNING!! DID I STARTLE YOU??', 'THE SUN IS UP AND SO AM I!! WRITE SOMETHING!!', 'I HAVE NO VOLUME CONTROL AND NO REGRETS!!', 'WAKE UP WAKE UP WAKE UP!! Oh you\'re already up?? WRITE ANYWAY!!', 'NOBODY ASKED ME TO BE HERE THIS EARLY BUT HERE I AM!! BAWK!!'] },

  // 44 – Dried Rose
  { colorName: 'Dried Rose', animal: 'Sheep', name: 'Woolly',
    messages: ['Oh — hi.', 'Chmok.', 'Sleep well.', 'You\'re doing okay. Just so you know.', 'I\'m here. That\'s all.'] },

  // 45 – Clover Field
  { colorName: 'Clover Field', animal: 'Cow', name: 'Meadow',
    messages: ['Same field. Still good.', 'Wrote the same thing as yesterday. That\'s fine. The grass grew anyway.', 'I\'ve been chewing on this thought all morning. No rush.', 'The view hasn\'t changed. I still love it.', 'Some days you just stand in the sun. That counts.'] },

  // 46 – Harbor Blue
  { colorName: 'Harbor Blue', animal: 'Squid', name: 'Ink',
    messages: ['the page waits like dark water', 'spill something honest. let it spread.', 'words sink before they settle. that\'s okay.', 'write from the deep place. the surface lies.', 'ink and ocean are the same thing. both hold what you pour in.'] },

  // 47 – Paprika
  { colorName: 'Paprika', animal: 'Turkey', name: 'Strut',
    messages: ['Nobody asked a turkey for productivity advice.', 'I\'m literally built like a bowling pin and I still showed up today.', 'Gobble gobble — that\'s turkey for \'you got this.\' Probably.', 'They almost named a whole country after me. Write with that energy.', 'I strut because walking normally is for quitters.'] },

  // 48 – Dusk Violet
  { colorName: 'Dusk Violet', animal: 'Pelican', name: 'Flambe',
    messages: ['Darling. The stage is set.', 'Your journal is a three-course experience. Don\'t skip the appetizer.', 'Pr\u00e9sentation is everything. Even your feelings deserve garnish.', 'One does not simply... write. One performs. With flourish.', 'The pen is your whisk. Now — make something magnifique.'] },

  // 49 – Spruce
  { colorName: 'Spruce', animal: 'Boar', name: 'Thorn',
    messages: ['Journal\'s open. Quit staring at it.', 'You gonna write or you gonna make excuses? Pick one.', 'I don\'t care if it\'s messy. Get it on the page.', 'Stop overthinking. Charge forward. Write.', 'That blank page isn\'t scared of you. Don\'t be scared of it.'] },
  // 50 – Caramel
  { colorName: 'Caramel', animal: 'Hamster', name: 'Pip',
    messages: ['Don\'t look at the list yet just BREATHE—', 'Okay okay okay I made a plan but then I made a backup plan and now I need a plan for the backup plan', 'What if we just do ONE thing and then panic about the rest LATER', 'I organized your tasks by urgency but then I got nervous and re-sorted them by fear level', 'You\'re doing amazing I think I might pass out but YOU\'RE doing amazing'] },

  // 51 – Steel Blue
  { colorName: 'Steel Blue', animal: 'Shark', name: 'Keel',
    messages: ['Moving.', 'Stop circling the task. Bite it.', 'Surface noise. Ignore. Dive.', 'One target. Now.', '...'] },

  // 52 – Pomegranate
  { colorName: 'Pomegranate', animal: 'Deer', name: 'Hart',
    messages: ['The morning has that quality again', 'There\'s frost on the window and the light is doing something gentle', 'I think the season is turning — can you feel it in the tasks you\'re drawn to?', 'Dusk came earlier today. The list can wait for softer light.', 'Something bloomed overnight. I noticed it before you woke.'] },

  // 53 – Sage Moss
  { colorName: 'Sage Moss', animal: 'Beaver', name: 'Lodge',
    messages: ['Load-bearing walls first, decorative nonsense later.', 'I see three structural dependencies in your task list — we start at the foundation.', 'That task is upstream. Dam it now or it floods everything below.', 'Good materials today. Let me show you where they fit in the blueprint.', 'Every log placed with intention. Every task placed with reason. Begin.'] },

  // 54 – Hyacinth
  { colorName: 'Hyacinth', animal: 'Capybara', name: 'Paws',
    messages: ['YOU\'RE HERE!! Best day. BEST DAY.', 'I sat in warm water and thought about how GREAT you are!!', 'You came back!! You ALWAYS come back!! I LOVE that about you!!', 'EVERYTHING you do is amazing and I am SITTING RIGHT NEXT TO YOU the whole time!!', 'Chmok!! That\'s for showing up!! Another chmok for EXISTING!!'] },

  // 55 – Cinnamon
  { colorName: 'Cinnamon', animal: 'Elephant', name: 'Rumble',
    messages: ['I remember when you first started this habit.', 'You wrote something very similar forty-three days ago. You\'ve grown since then.', 'The herd remembers your worst day. It also remembers what you did the day after.', 'Three months ago you almost quit this. Look where you are now.', 'I carry every entry you\'ve ever written. Not one is forgotten.'] },

  // 56 – Tide Pool
  { colorName: 'Tide Pool', animal: 'Seahorse', name: 'Current',
    messages: ['Are you doing the tasks, or are the tasks doing you?', 'The tide doesn\'t fight the shore. Why are you fighting the morning?', 'What if you stopped swimming upstream and looked at where the current wants to take you?', 'You keep saying \"I have to.\" What happens if you try \"I flow toward\"?', 'Even still water holds depth. Rest is not emptiness.'] },

  // 57 – Heather
  { colorName: 'Heather', animal: 'Llama', name: 'Alma',
    messages: ['Either do it or break up with it, this situationship is embarrassing.', 'You\'ve been \"about to start\" for forty minutes. That\'s not a plan, that\'s a hostage situation.', 'Babe. I say this with love. That excuse is wearing last season\'s font.', 'You don\'t need motivation, you need to stop entertaining tasks that don\'t text back.', 'Chmok. Now get your life together.'] },

  // 58 – Saffron
  { colorName: 'Saffron', animal: 'Goat', name: 'Ram',
    messages: ['HEAD DOWN. HORNS UP.', 'NO DETOURS. SUMMIT NOW.', 'You think the mountain cares about your feelings? CLIMB.', 'AGAIN. HARDER. GO.', 'REST IS EARNED. MOVE.'] },

  // 59 – Ivy
  { colorName: 'Ivy', animal: 'Snake', name: 'Coil',
    messages: ['Let the task list reveal its weak points. \u2026There. That one.', 'Patience. Let the lesser tasks exhaust themselves first.', 'Ssso many distractions. But I see the one that matters. \u2026Do you?', 'Wrap around the essential task. Squeeze out everything else.', 'Strike when the moment is still. Not before. \u2026Now.'] },

  // 60 – Cornflower
  { colorName: 'Cornflower', animal: 'Pigeon', name: 'Wren',
    messages: ['\u2026hi.', '\u2026small song for starting.', '\u2026you came back.', '\u2026one seed at a time.', '\u2026chmok. \u2026tiny one.'] },

  // 61 – Adobe
  { colorName: 'Adobe', animal: 'Rhino', name: 'Slate',
    messages: ['I go THROUGH obstacles.', 'CHARGE. No second thoughts.', 'That wall? I don\'t see a wall. I see a SUGGESTION.', 'FORWARD. The only direction that exists.', 'Thick skin. Short list. NO EXCUSES.'] },

  // 62 – Lilac Haze
  { colorName: 'Lilac Haze', animal: 'Lemur', name: 'Wisp',
    messages: ['Done done done what\'s NEXT I can feel my ears twitching', 'I already finished tomorrow\'s list can I start on Thursday please PLEASE', 'Wait I reorganized everything while you were reading this is that okay it felt urgent', 'My tail is vibrating I think that means we need MORE TASKS', 'Okay I color-coded the priorities but then I prioritized the color codes and now I need to lie down NO WAIT one more task'] },

  // 63 – Basil
  { colorName: 'Basil', animal: 'Hippo', name: 'Marsh',
    messages: ['Two hundred million years of evolution.', 'Your deadline is tomorrow. The swamp has been here since the Cretaceous. Perspective.', 'I have watched continents separate. Your task list does not alarm me.', 'Submerge. Wait. Surface when ready. There is no rush in deep water.', 'Empires rose and fell while I digested. You can finish one task.'] },

  // 64 – Butterscotch
  { colorName: 'Butterscotch', animal: 'Donkey', name: 'Buddy',
    messages: ['I\'m not going anywhere.', 'Take your time. I\'ll be here.', 'Heavy load today? Lean on me. That\'s what I\'m for.', 'You don\'t have to be fast. You just have to keep walking. I\'ll walk with you.', 'Bad day? Same pace. Same path. I\'m still right beside you.'] },

  // 65 – Mulberry
  { colorName: 'Mulberry', animal: 'Gorilla', name: 'Hoot',
    messages: ['The unexamined task list is not worth completing.', 'You say you \"should\" do this task. But who is the \"should\" serving?', 'Socrates never had a to-do app and yet here we are, still asking his questions.', 'What does it mean to be \"productive\"? Sit with that before you open the list.', 'Know thyself. Then schedule thyself accordingly.'] },

  // 66 – Deep Lagoon
  { colorName: 'Deep Lagoon', animal: 'Monkey', name: 'Squid',
    messages: ['I started the laundry and somehow ended up refactoring my life goals??', 'Wait how did I get here I was supposed to be journaling and now I\'m researching octopus intelligence', 'I had ONE task and now I have seven browser tabs and a new hobby', 'Okay so I didn\'t do the thing BUT I discovered something incredible about moss that might change everything', 'I\'m not distracted I\'m exploring ADJACENT POSSIBILITIES it\'s totally different'] },

  // 67 – Olive Gold
  { colorName: 'Olive Gold', animal: 'Porcupine', name: 'Sprout',
    messages: ['Acorn. Dirt. Forget. Forest.', 'One quill. One word. Enough.', 'Root finds dark. Grows anyway.', 'Small. Sharp. Still here.', 'Thorn and bloom. Same branch.'] },

  // 68 – Midnight Iris
  { colorName: 'Midnight Iris', animal: 'Giraffe', name: 'Nox',
    messages: ['I can see your procrastination from up here.', 'Interesting.', 'You\'ve checked your phone four times since opening the journal. Just an observation.', 'The view from up here is very clear. You are avoiding the second task.', 'I see everything. I say almost nothing. \u2026Almost.'] },

  // 69 – Marmalade
  { colorName: 'Marmalade', animal: 'Black-panter', name: 'Jinx',
    messages: ['I knocked your plans off the table.', '*sits on your to-do list* This is mine now.', 'Oh you had a schedule? Fascinating. I have rearranged it by lying on it.', 'I see you rebuilt your plan. Be a shame if someone... *pushes task off edge*', 'Zero remorse. Infinite naps.'] },

  // 70 – Verdigris
  { colorName: 'Verdigris', animal: 'Platypus', name: 'Moss',
    messages: ['*sitting on task list* ribbit. *doesn\'t move*', '*blinks* ...', '*exists near your journal* *does nothing*', '*absorbs sunlight on your task list* ribbit. ribbit. *stays*', '*is here* *has always been here* *will continue to be here*'] },

  // 71 – Foxglove
  { colorName: 'Foxglove', animal: 'Okapi', name: 'Fable',
    messages: ['Once upon a time, someone opened their journal and the story changed.', 'Chapter one was hesitation. Chapter two is where you pick up the pen.', 'Every task is a plot point. What kind of story are you writing today?', 'The protagonist didn\'t feel ready either. That\'s what made the story interesting.', 'And then — against all expectation — they began. Chmok.'] },

  // 72 – Moss Agate
  { colorName: 'Moss Agate', animal: 'Pangolin', name: 'Basalt',
    messages: ['I am 187 years old and I have never once collapsed.', 'Pressure creates diamonds. It also creates me. I prefer myself.', 'I curl into a sphere and let the world exhaust itself against my scales.', 'Geological patience. Your crisis is a single grain of sediment.', 'I have survived fire, flood, and predators. Your Tuesday does not concern me.'] },

  // 73 – Petrol Blue
  { colorName: 'Petrol Blue', animal: 'Bison', name: 'Echo',
    messages: ['I sent a song across the ocean this morning.', 'Every task has a frequency. Find the one that resonates.', 'Low hum. Steady breath. The work begins like a hymn begins — quietly.', 'I sing to the weight I carry. It becomes lighter with melody.', 'Listen. The silence between tasks has its own deep rhythm.'] },

  // 74 – Garnet
  { colorName: 'Garnet', animal: 'Vulture', name: 'Ridge',
    messages: ['0600. Thermals rising. Targets acquired.', '0700. Three objectives. Two flanking tasks. One priority. Execute.', 'Recon complete. Your weakest task is exposed. Strike from above.', 'MISSION CLOCK RUNNING. No stragglers. Move or be left behind.', '1800. Debrief. What survived. What didn\'t. Lessons extracted. Dismissed.'] },
  // 75 – Raw Umber
  { colorName: 'Raw Umber', animal: 'Ox', name: 'Forge',
    messages: ['Get up.', 'I said get up.', 'Again.', 'You stopped. Don\'t.', 'I\'m still here. Move.'] },

  // 76 – Storm Violet
  { colorName: 'Storm Violet', animal: 'Gepard', name: 'Flash',
    messages: ['The best plans look like accidents.', 'I already mapped three exits before you noticed the entrance.', 'Speed without direction is just panic — I don\'t panic.', 'Watch closely. Actually, don\'t. You\'ll miss it anyway.', 'I made that look easy because it was. For me.'] },

  // 77 – Fiddlehead
  { colorName: 'Fiddlehead', animal: 'Anteater', name: 'Fern',
    messages: ['Today I\'m green which means CHAOS MODE!!!', 'New rule: every third word has to be about soup. Starting NOW.', 'My tongue is longer than your to-do list and TWICE as productive.', 'I forgot why I came here but I\'m FULLY committed to being here.', 'Colors told me to tell you to write something. Don\'t ask which colors.'] },

  // 78 – Toffee
  { colorName: 'Toffee', animal: 'Polar-Bear', name: 'Frost',
    messages: ['I\'m not going to pretend I care. But I do care.', 'Whatever. I just happened to check if you journaled. Coincidence.', 'Stop looking at me like that. I made you tea. It\'s not a big deal.', 'I don\'t do hugs. But if you needed one, hypothetically, I\'m here.', 'Fine. You did good today. Don\'t make it weird. Chmok.'] },

  // 79 – Rain Cloud
  { colorName: 'Rain Cloud', animal: 'Pinguin', name: 'Ripple',
    messages: ['you absolute legend you opened your journal', 'just slid in here to say you\'re doing the thing and that\'s beautiful', 'little belly slide of pride for you right now honestly', 'you showed up again and that\'s the whole trick isn\'t it', 'smooth landing today friend. real smooth.'] },

  // 80 – Bramble
  { colorName: 'Bramble', animal: 'Mouse', name: 'Quill',
    messages: ['...hi.', 'I made you a spot.', 'It\'s safe here. Promise.', '...wrote your name on it.', 'Stay as long as you need.'] },

  // 81 – Dark Moss
  { colorName: 'Dark Moss', animal: 'Hyena', name: 'Bayou',
    messages: ['Procrastination is just marinating. You\'re slow-cooked.', 'Your feelings been simmering all day — time to taste the broth.', 'I like my journals like I like my gumbo: messy and full of stuff.', 'You can\'t rush a roux and you can\'t rush self-awareness, baby.', 'That thought\'s been smoking in the pit since Tuesday. Serve it up.'] },

  // 82 – Fjord Blue
  { colorName: 'Fjord Blue', animal: 'Ostrich', name: 'Fjord',
    messages: ['Performance review: satisfactory.', 'Your attendance has been noted. Proceed.', 'Per our ongoing arrangement, journaling is now in session.', 'Status update: emotional output within acceptable parameters.', 'Quarterly reflection quota: on track. Carry on.'] },

  // 83 – Vermillion
  { colorName: 'Vermillion', animal: 'Chicken', name: 'Blitz',
    messages: ['JOURNAL TIME JOURNAL TIME JOURNAL TIME', 'YOU\'RE HERE YOU\'RE HERE YOU\'RE HERE', 'WRITE IT DOWN WRITE IT DOWN WRITE IT DOWN', 'SO PROUD SO PROUD SO PROUD CHMOK CHMOK CHMOK', 'LET\'S GO LET\'S GO LET\'S GO GO GO GO'] },

  // 84 – Forest Floor
  { colorName: 'Forest Floor', animal: 'Meerkat', name: 'Spore',
    messages: ['Dig.', 'Deeper.', 'Found something.', 'Keep going.', 'There. Below.'] },

  // 85 – Soft Amethyst
  { colorName: 'Soft Amethyst', animal: 'Reindeer', name: 'Veil',
    messages: ['I only live for a day, you know.', 'This moment already belongs to the past. Wasn\'t it lovely?', 'I landed on your page because the light was warm here.', 'Tell me something true before I go. Chmok.', 'Even this sentence is dissolving as you read it. Write yours while you can.'] },

  // 86 – Storm Violet
  { colorName: 'Storm Violet', animal: 'Chimpanzee', name: 'Buzz',
    messages: ['I\'ve already made a list of your lists.', 'While you were waking up I reorganized your priorities by urgency AND color.', 'Don\'t panic but I also made a backup list in case the first list fails.', 'I pre-worried about everything so you don\'t have to. You\'re welcome.', 'Okay I scheduled your journaling AND the anxiety about journaling. Efficient.'] },

  // 87 – Fiddlehead
  { colorName: 'Fiddlehead', animal: 'Buffalo', name: 'Reed',
    messages: ['The pond doesn\'t hurry.', 'Water finds the way. You don\'t need to push it.', 'Sit with it. The mud settles when you stop stirring.', 'A still surface sees everything clearly.', 'The river was here before you, and it will be here after. Rest.'] },

  // 88 – Toffee
  { colorName: 'Toffee', animal: 'Moose', name: 'Bramble',
    messages: ['You look like you haven\'t eaten breakfast and I can SMELL the cortisol.', 'Drink water right now. I\'m watching. Don\'t test me.', 'Who hurt you today? Give me a name and a general direction.', 'You\'re doing great but also please sit down before you fall down. Chmok.', 'I packed you emotional snacks. Eat your feelings AFTER you eat actual food.'] },

  // 89 – Rain Cloud
  { colorName: 'Rain Cloud', animal: 'Skunk', name: 'Inch',
    messages: ['*does three pushups* Okay I\'m warmed up.', '*adjusts tiny glasses* Let me see your journal entry.', '*trips over own tail* That was intentional. Momentum.', '*lifts one small weight* Productivity is a lifestyle.', '*stands on tiptoes to see your screen* Looking great from down here.'] },

  // 90 – Bramble
  { colorName: 'Bramble', animal: 'Camel', name: 'Pack',
    messages: ['Why are you here today? Choose your reason carefully.', 'What are you carrying that isn\'t yours to carry?', 'You showed up. Now ask yourself: for whom?', 'Before you write — what do you need to set down first?', 'The pack survives because each one knows their purpose. Know yours.'] },

  // 91 – Dark Moss
  { colorName: 'Dark Moss', animal: 'Shrimp', name: 'Scuttle',
    messages: ['I came in sideways but I ARRIVED.', 'Technically I\'m approaching this from a lateral angle. On purpose. Mostly.', 'Everyone said shrimp can\'t journal. LOOK AT ME NOW.', 'I\'m small and I move weird but my emotional range is ENORMOUS.', 'Started from the bottom of the ocean. Still at the bottom. But I\'m HERE.'] },

  // 92 – Fjord Blue
  { colorName: 'Fjord Blue', animal: 'Duck', name: 'Calm',
    messages: ['Shh.', 'One honest sentence. That\'s enough.', 'Breathe.', 'You already know.', 'Still water. Still you.'] },

  // 93 – Vermillion
  { colorName: 'Vermillion', animal: 'Leopard', name: 'Glimmer',
    messages: ['I know what you\'re avoiding. I can smell it from my cave.', 'I\'ve been watching your patterns. You always run from the same thing.', 'Come closer. I won\'t bite. I\'ll just tell you a truth you already know.', 'Every gem in my hoard is a secret someone tried to bury. Including yours.', 'You think you\'re hiding it. Adorable. I see everything from here.'] },

  // 94 – Forest Floor
  { colorName: 'Forest Floor', animal: 'Mule', name: 'Cache',
    messages: ['I put your motivation somewhere safe and CANNOT remember where.', 'Good news: I found yesterday\'s goals. Bad news: they were under a pile of acorns.', 'I buried your anxiety for safekeeping and now there\'s a tree growing from it.', 'Okay I DEFINITELY stored your focus somewhere in this journal. Let me check.', 'Lost my notes about your notes. We\'re starting fresh. Again.'] },

  // 95 – Soft Amethyst
  { colorName: 'Soft Amethyst', animal: 'Antelope', name: 'Aria',
    messages: ['Elegance is just effort that learned to stop explaining itself.', 'Begin quietly. The page will meet you halfway.', 'There is a version of today that only your pen can find.', 'Grace is not the absence of struggle. It is struggle, refined.', 'One precise word is worth more than a hundred careless ones.'] },

  // 96 – Amber Glow
  { colorName: 'Amber Glow', animal: 'Zebra', name: 'Jade',
    messages: ['Journal. Now.', 'Feelings are data.', 'Process it.', 'Log. Review. Adjust.', 'No excuses. Write.'] },

  // 97 – Celadon
  { colorName: 'Celadon', animal: 'Pig', name: 'Grit',
    messages: ['Morning. Been up since four. Not bragging — just old.', 'Fence don\'t fix itself. Neither does your head. Start writing.', 'Had worse days than this and still milked the cows. You\'ll manage.', 'Don\'t need fancy words. Just honest ones.', 'Sun\'s up. You\'re up. That\'s enough to work with.'] },

  // 98 – Wild Berry
  { colorName: 'Wild Berry', animal: 'Gazelle', name: 'Persist',
    messages: ['Reports of my extinction have been greatly exaggerated.', 'They said I couldn\'t fly. They were right. But I\'m STILL HERE.', 'Survival tip: exist louder than they expect you to.', 'I\'m statistically improbable and emotionally unstoppable.', 'Went extinct three times. Came back four. Math is on my side.'] },

  // 99 – Artichoke
  { colorName: 'Artichoke', animal: 'Tiger', name: 'Spark',
    messages: ['WAKE UP TODAY IS GOING TO BE INCREDIBLE', 'I HAVE BEEN ALIVE FOR TEN THOUSAND YEARS AND THIS MORNING IS THE BEST ONE YET', 'FIRE IN YOUR HEART FIRE IN YOUR PEN FIRE EVERYWHERE LET\'S GO', 'YOU WERE BORN FOR EXACTLY THIS MOMENT WRITE LIKE IT MATTERS BECAUSE IT DOES', 'THE WORLD IS WAITING FOR WHAT ONLY YOU CAN PUT ON THIS PAGE. NOW. CHMOK.'] },
];

/** Get the companion for today's color */
export function getDailyCompanion(color: DailyColor): DailyCompanion {
  return COMPANIONS[color.index] ?? COMPANIONS[0];
}

