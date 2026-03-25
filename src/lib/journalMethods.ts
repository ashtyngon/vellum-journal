/* ── Journal Method Definitions ────────────────────────────────────────
   Static definitions for all 10 guided journaling methods available
   in vellum-journal. Each method defines a multi-step flow with
   typed inputs (textarea, slider, select, body-picker).
   ──────────────────────────────────────────────────────────────────── */

export interface MethodStep {
  prompt: string;
  placeholder?: string;
  inputType?: 'textarea' | 'slider' | 'select' | 'body-picker';
  options?: string[];
  min?: number;
  max?: number;
}

export interface JournalMethod {
  id: string;
  name: string;
  description: string;
  icon: string; // Material Symbols icon name
  category: 'cbt' | 'integration' | 'daily';
  steps: MethodStep[];
}

/* ── Method Definitions ───────────────────────────────────────────────── */

export const JOURNAL_METHODS: JournalMethod[] = [
  /* ─── 0. Morning Pages (Daily) ─────────────────────────────────────── */
  {
    id: 'morning-pages',
    name: 'Morning Pages',
    description:
      'Dump your brain. Four prompts, no rules.',
    icon: 'wb_twilight',
    category: 'daily',
    steps: [
      {
        prompt: 'What\'s on your mind right now? Dump everything — worries, tasks, random thoughts.',
        placeholder:
          'e.g. I keep thinking about that email I need to send. Also I\'m hungry. The meeting yesterday was weird...',
        inputType: 'textarea',
      },
      {
        prompt: 'What\'s bugging you that you haven\'t said out loud?',
        placeholder:
          'e.g. I\'m annoyed that I agreed to that deadline. I feel like I\'m falling behind on the project.',
        inputType: 'textarea',
      },
      {
        prompt: 'What are you avoiding? What keeps getting pushed to tomorrow?',
        placeholder:
          'e.g. Calling the dentist. Starting that proposal. Having that conversation with my manager.',
        inputType: 'textarea',
      },
      {
        prompt: 'What would make today feel like a good day?',
        placeholder:
          'e.g. If I just finished that one report. Or went for a walk. Or actually ate lunch away from my desk.',
        inputType: 'textarea',
      },
    ],
  },

  /* ─── 1. Thought Record (CBT) ─────────────────────────────────────── */
  {
    id: 'thought-record',
    name: 'Thought Record',
    description:
      'Challenge a thought. Find what\'s really true.',
    icon: 'psychology',
    category: 'cbt',
    steps: [
      {
        prompt: 'What happened? Describe the situation briefly.',
        placeholder:
          'e.g. My manager didn\'t respond to my message for three hours during a busy workday.',
        inputType: 'textarea',
      },
      {
        prompt:
          'What thought popped into your head automatically?',
        placeholder:
          'e.g. She thinks my work isn\'t important. I\'m probably going to get passed over for the project.',
        inputType: 'textarea',
      },
      {
        prompt: 'How strongly do you feel the emotion right now?',
        placeholder: 'Slide to rate the intensity of the feeling.',
        inputType: 'slider',
        min: 0,
        max: 100,
      },
      {
        prompt:
          'What evidence supports this thought? Be specific.',
        placeholder:
          'e.g. She replied quickly to someone else\'s message in the group chat. She seemed distracted in our last call.',
        inputType: 'textarea',
      },
      {
        prompt:
          'What evidence goes against this thought?',
        placeholder:
          'e.g. She praised my last deliverable. She mentioned being slammed with deadlines this week. She\'s always been slow to reply to non-urgent messages.',
        inputType: 'textarea',
      },
      {
        prompt:
          'Now write a more balanced thought that accounts for both sides.',
        placeholder:
          'e.g. She\'s probably just busy. Her response time isn\'t a reliable measure of how she sees my work.',
        inputType: 'textarea',
      },
      {
        prompt:
          'Rate the emotion again. Has anything shifted?',
        placeholder: 'Slide to rate how you feel now.',
        inputType: 'slider',
        min: 0,
        max: 100,
      },
    ],
  },

  /* ─── 2. Five Whys (CBT) ──────────────────────────────────────────── */
  {
    id: 'five-whys',
    name: 'Five Whys',
    description:
      'Keep asking why until you hit the root.',
    icon: 'search_insights',
    category: 'cbt',
    steps: [
      {
        prompt: 'What\'s the thing?',
        placeholder:
          'e.g. I snapped at my partner over something trivial.',
        inputType: 'textarea',
      },
      {
        prompt: 'Why?',
        placeholder: 'Keep going...',
        inputType: 'textarea',
      },
      {
        prompt: 'Why?',
        placeholder: 'Dig deeper...',
        inputType: 'textarea',
      },
      {
        prompt: 'Why?',
        placeholder: 'Keep pulling the thread...',
        inputType: 'textarea',
      },
      {
        prompt: 'Why?',
        placeholder: 'Almost there...',
        inputType: 'textarea',
      },
      {
        prompt: 'Why?',
        placeholder: 'What\'s at the root?',
        inputType: 'textarea',
      },
    ],
  },

  /* ─── 3. Positive Data Log (CBT) ──────────────────────────────────── */
  {
    id: 'positive-data-log',
    name: 'Positive Data Log',
    description:
      'Collect proof your inner critic is wrong.',
    icon: 'trending_up',
    category: 'cbt',
    steps: [
      {
        prompt:
          'What negative belief about yourself do you want to examine?',
        placeholder:
          'e.g. I\'m not creative enough to do meaningful work.',
        inputType: 'textarea',
      },
      {
        prompt:
          'Rewrite it as a kinder, more realistic version.',
        placeholder:
          'e.g. I have creative ideas, even if they don\'t always feel polished right away.',
        inputType: 'textarea',
      },
      {
        prompt:
          'What happened today that supports the kinder version? Even something small counts.',
        placeholder:
          'e.g. I came up with a new approach to the dashboard layout that the team liked. I also wrote a paragraph I was proud of.',
        inputType: 'textarea',
      },
      {
        prompt:
          'How much do you believe the kinder version right now?',
        placeholder: 'Slide to rate your belief in the new statement.',
        inputType: 'slider',
        min: 0,
        max: 100,
      },
    ],
  },

  /* ─── 4. Pattern Breaker (CBT) ────────────────────────────────────── */
  {
    id: 'pattern-breaker',
    name: 'Pattern Breaker',
    description:
      'Rewrite the story you\'re telling yourself.',
    icon: 'auto_fix_high',
    category: 'cbt',
    steps: [
      {
        prompt:
          'What story are you telling yourself right now?',
        placeholder:
          'e.g. I\'m falling behind everyone my age. They all seem to have it figured out and I\'m stuck.',
        inputType: 'textarea',
      },
      {
        prompt:
          'If this story were a movie, what genre would it be?',
        placeholder: 'Pick the genre that fits the emotional tone.',
        inputType: 'select',
        options: ['Horror', 'Drama', 'Tragedy', 'Comedy', 'Thriller', 'Documentary'],
      },
      {
        prompt:
          'Now rewrite it as a plot twist. What if the story takes an unexpected turn?',
        placeholder:
          'e.g. The protagonist realizes that "behind" was an illusion -- everyone was lost in their own way, and the slow path turned out to be the one with the best view.',
        inputType: 'textarea',
      },
      {
        prompt:
          'Imagine you\'re your own defense attorney. What evidence would you present in your favor?',
        placeholder:
          'e.g. I changed careers, which takes courage. I\'m building skills most people my age never try. I have deep friendships.',
        inputType: 'textarea',
      },
      {
        prompt:
          'Now write the boring, realistic version. No drama, no catastrophe -- just what\'s actually happening.',
        placeholder:
          'e.g. I\'m 30. I\'m in a career transition. Some things are uncertain. I\'m doing okay by most measures.',
        inputType: 'textarea',
      },
    ],
  },

  /* ─── 5. Session Integration (Integration) ──────────────────────────
     Evidence base:
     - Neuroplasticity window: first 24-48h post-ketamine are when
       cortical changes are most active (MGH pilot study, Wilkinson 2017)
     - Memory reconsolidation: reactivating the felt experience (not
       just thinking about it) is what allows memories to update
       (PsyA-EMDR, Hase 2023)
     - MAPS protocol: non-directive exploration first, structured
       reflection later — premature meaning-making blocks integration
     - Pennebaker: write while fresh, don't edit, "deepest thoughts"
     - Pairs with Session Prep — closes the arc opened there
     ──────────────────────────────────────────────────────────────────── */
  {
    id: 'integration',
    name: 'Session Integration',
    description:
      'Capture what surfaced before your mind rewrites it.',
    icon: 'self_improvement',
    category: 'integration',
    steps: [
      // ══ PHASE 1: CAPTURE (do this soon after — raw, nonverbal) ═════

      // ── Step 1: Re-read your prep message ─────────────────────────
      // Closes the arc from Session Prep step 7. Grounds you in your
      // own voice from before the experience.
      {
        prompt: 'If you wrote yourself a message before the session, read it now. How does it land? Does it still feel true, or has something shifted?',
        placeholder:
          'e.g. I told myself "whatever you saw was real." It feels different now — I saw something I didn\'t expect and I\'m not sure I want it to be real. But it is.',
        inputType: 'textarea',
      },
      // ── Step 2: Raw fragments — images, sensations, words ─────────
      // The post-session brain is image-rich and pre-verbal.
      // Capture fragments before the narrative mind tidies them up.
      // Pennebaker: write while fresh, no editing.
      {
        prompt: 'What\'s still with you right now? Don\'t organize it — just write fragments. Images, body sensations, colors, phrases, feelings, faces, memories. Whatever is floating.',
        placeholder:
          'e.g. A dark room with warm light. My hands felt enormous. The word "permission" kept appearing. I saw my younger self but wasn\'t sad about it. A sensation of something unclenching in my chest. The color blue.',
        inputType: 'textarea',
      },
      // ── Step 3: Body check — what changed somatically ─────────────
      // Memory reconsolidation research: the body holds the update
      // before the mind catches up. Gendlin: check the felt sense.
      {
        prompt: 'Scan your body like you did before the session. What\'s different now? What shifted, released, or appeared?',
        placeholder:
          'e.g. The tight band across my forehead is gone. My chest feels open in a way it hasn\'t in weeks. But there\'s a new tenderness in my stomach — like something was touched that\'s still raw.',
        inputType: 'textarea',
      },

      // ══ PHASE 2: PROCESS (connect, name, anchor) ══════════════════

      // ── Step 4: What surprised you ────────────────────────────────
      // Surprise = the gap between expectation and experience.
      // This gap is where new learning lives.
      {
        prompt: 'What happened that you didn\'t expect? What surprised you — about the session, about yourself, about what came up?',
        placeholder:
          'e.g. I expected to work on the anxiety but what came up was loneliness. I didn\'t expect to feel compassion for the version of me I usually criticize. The fear I named in prep didn\'t show up at all — something else did.',
        inputType: 'textarea',
      },
      // ── Step 5: Belief update — what feels less true now ──────────
      // Lieberman affect labeling: name the old belief precisely.
      // Reconsolidation: the old belief must be activated and then
      // contradicted by felt experience to update.
      {
        prompt: 'Is there something you believed before the session that feels less solid now? Name the old belief, then write what\'s replacing it — even if the new version is blurry.',
        placeholder:
          'e.g. Old: "I have to earn rest." New: something like... rest isn\'t a reward, it\'s a requirement. I felt that in my body, not just my head. Old: "I\'m too much." New: I\'m not too much. I\'ve just been around people who couldn\'t hold it.',
        inputType: 'textarea',
      },
      // ── Step 6: The dump — what do you want to remember ───────────
      // Consolidation window: explicitly encoding what matters
      // strengthens the memory trace. This is the "take-home message"
      // from MAPS integration protocol.
      {
        prompt: 'If this experience could be distilled into one thing you don\'t want to forget — one sentence, one image, one feeling — what is it?',
        placeholder:
          'e.g. The feeling of my own hand on my chest and realizing I\'ve never once comforted myself like that. Or: "You\'re allowed to put it down." Or: the image of the kid, and the fact that I smiled at him.',
        inputType: 'textarea',
      },
      // ── Step 7: Anchor — what changes this week ───────────────────
      // Integration research: insights without behavioral anchors fade
      // within days. One specific, concrete action prevents this.
      // MGH pilot: patients with structured integration had 25% relapse
      // vs 55-89% without.
      {
        prompt: 'Name one concrete thing you\'ll do differently this week because of what you experienced. Not a vague intention — something specific, something you\'d notice yourself doing.',
        placeholder:
          'e.g. When I feel the urge to apologize for existing, I\'ll pause and say nothing instead. Or: I\'ll let myself sit in the car for five minutes before going inside — just to be with myself. Or: I\'ll call my sister and actually say the thing.',
        inputType: 'textarea',
      },
    ],
  },

  /* ─── 6. Body Scan (Integration) ──────────────────────────────────── */
  {
    id: 'body-scan',
    name: 'Body Scan',
    description:
      'Notice what your body is holding right now.',
    icon: 'accessibility_new',
    category: 'integration',
    steps: [
      {
        prompt: 'Where in your body do you notice something right now?',
        placeholder: 'Select the area that\'s calling your attention.',
        inputType: 'select',
        options: [
          'Head',
          'Jaw / Face',
          'Neck',
          'Throat',
          'Chest',
          'Stomach',
          'Shoulders',
          'Upper Back',
          'Lower Back',
          'Arms',
          'Hands',
          'Hips',
          'Legs',
          'Feet',
          'Whole body',
        ],
      },
      {
        prompt:
          'Describe the sensation. What does it actually feel like?',
        placeholder:
          'e.g. A tightness in my chest, like a belt cinched one notch too tight. It\'s warm and slightly buzzing.',
        inputType: 'textarea',
      },
      {
        prompt:
          'If this sensation could speak, what would it say?',
        placeholder:
          'e.g. "Slow down. You\'ve been ignoring me for weeks and I\'m tired of holding all of this."',
        inputType: 'textarea',
      },
      {
        prompt: 'What emotion lives here?',
        placeholder:
          'e.g. Anxiety, but also a layer of sadness underneath. Like I\'m bracing for something that already happened.',
        inputType: 'textarea',
      },
      {
        prompt: 'What does this part of you need?',
        placeholder:
          'e.g. Permission to stop performing. A deep breath. Maybe just acknowledgment that it\'s been a hard month.',
        inputType: 'textarea',
      },
    ],
  },

  /* ─── 7. Three Good Things (Daily) ────────────────────────────────── */
  {
    id: 'three-good-things',
    name: 'Three Good Things',
    description:
      'Name three wins. Tiny counts.',
    icon: 'stars',
    category: 'daily',
    steps: [
      {
        prompt: 'First good thing that happened today.',
        placeholder:
          'e.g. I had a really good conversation with a coworker I don\'t usually talk to.',
        inputType: 'textarea',
      },
      {
        prompt: 'Why did this happen? What made it possible?',
        placeholder:
          'e.g. I made the effort to sit somewhere different at lunch. Being open to small moments pays off.',
        inputType: 'textarea',
      },
      {
        prompt: 'Second good thing.',
        placeholder:
          'e.g. I finished the report I\'d been dreading, and it turned out better than I expected.',
        inputType: 'textarea',
      },
      {
        prompt: 'Why did this one happen?',
        placeholder:
          'e.g. I set a timer for 25 minutes and just started. The dread was worse than the actual work.',
        inputType: 'textarea',
      },
      {
        prompt: 'Third good thing.',
        placeholder:
          'e.g. The sunset on my walk home was extraordinary. I actually stopped to look at it.',
        inputType: 'textarea',
      },
      {
        prompt: 'Why did this one happen?',
        placeholder:
          'e.g. I left work on time for once. And I chose to walk instead of taking the bus. Small choices matter.',
        inputType: 'textarea',
      },
      {
        prompt:
          'Looking at all three -- what does this say about you or the world today?',
        placeholder:
          'e.g. Today was better than I thought. Small things added up.',
        inputType: 'textarea',
      },
    ],
  },

  /* ─── 8. Anxiety Reality Check (CBT) ────────────────────────────── */
  {
    id: 'anxiety-reality-check',
    name: 'Anxiety Reality Check',
    description:
      'Catch anxiety lying. Compare fear vs. reality.',
    icon: 'fact_check',
    category: 'cbt',
    steps: [
      {
        prompt: 'First -- name something good happening today. Anything.',
        placeholder:
          'e.g. A coworker complimented my work. I cooked a real meal. The weather is perfect.',
        inputType: 'textarea',
      },
      {
        prompt:
          'What are you anxious about right now? Pick one specific thing.',
        placeholder:
          'e.g. I have to present quarterly numbers to the leadership team and I\'m convinced I\'ll freeze up.',
        inputType: 'textarea',
      },
      {
        prompt:
          'What is your anxiety telling you will happen? Be specific about the worst-case scenario your brain is running.',
        placeholder:
          'e.g. I\'ll forget my talking points, stumble over my words, they\'ll think I\'m incompetent, and I\'ll get pulled off the project.',
        inputType: 'textarea',
      },
      {
        prompt: 'How intense is the anxiety right now?',
        placeholder: 'Slide to rate how anxious you feel.',
        inputType: 'slider',
        min: 0,
        max: 100,
      },
      {
        prompt:
          'Why does your brain believe this? What\'s triggering the fear? Dig into the "because..."',
        placeholder:
          'e.g. Because I stumbled once in a meeting six months ago. Because I always assume people are judging me. Because my inner critic says I\'m not qualified.',
        inputType: 'textarea',
      },
      {
        prompt:
          'Now step back. What\'s actually likely to happen? Not the story -- the realistic version.',
        placeholder:
          'e.g. I\'ll present for 12 minutes. I might pause to check my notes. People will ask follow-up questions. It\'ll be fine.',
        inputType: 'textarea',
      },
      {
        prompt:
          'Look at the gap between the fear and the realistic version. What does your anxiety get wrong consistently?',
        placeholder:
          'e.g. It always assumes the absolute worst. It treats a small mistake as a catastrophe. It ignores all the times things went fine. It confuses "uncomfortable" with "disaster."',
        inputType: 'textarea',
      },
      {
        prompt:
          'What do you want to tell yourself right now, before it happens?',
        placeholder:
          'e.g. You\'re going to be nervous and that\'s fine. The nervousness doesn\'t mean it\'ll go badly -- it means you care. You\'ve done this before and survived every time.',
        inputType: 'textarea',
      },
    ],
  },

  /* ─── 9. Session Prep (Integration) ─────────────────────────────────
     Evidence base:
     - Gendlin Focusing (1978): body-first entry, felt sense → handle → asking
     - Pennebaker Expressive Writing: "very deepest thoughts and feelings,"
       progressive deepening across steps
     - Lieberman Affect Labeling (2007): granular naming reduces amygdala
       reactivity — specificity matters more than duration
     - MAPS MDMA-AT prep protocol: fears, expectations, "nothing comes up
       that isn't already there," open-ended intentions
     - KAP clinical protocols: set/setting, envelope of intention,
       trust-building before medicine session
     ──────────────────────────────────────────────────────────────────── */
  {
    id: 'ketamine-prep',
    name: 'Session Prep',
    description:
      'Surface what\'s underneath before you go in.',
    icon: 'spa',
    category: 'integration',
    steps: [
      // ── Step 1: Clearing a space (Gendlin Step 1) ──────────────────
      // Body-first entry. Emotions live in the body before cognition.
      // Gendlin: "Clearing a space is asking, what's between me and
      // feeling fine right now?" — scan for what's *there*, not what
      // you *think* is there.
      {
        prompt: 'Close your eyes for ten seconds. Scan slowly from head to feet. Where is something sitting in your body right now? Describe exactly what you feel there — not why, just the raw sensation.',
        placeholder:
          'e.g. Tight band across my forehead. Something heavy and warm sitting on my chest. My jaw is clenched and I didn\'t notice until now. Stomach feels hollow, like before a flight.',
        inputType: 'textarea',
      },
      // ── Step 2: Felt sense → handle (Gendlin Steps 2-3) ───────────
      // Move from raw sensation to emotional meaning. The "handle" is
      // the word or image that makes the felt sense click.
      // Lieberman: the more granular the label, the more the amygdala
      // quiets. Push past "anxious" to the specific texture.
      {
        prompt: 'Stay with the strongest sensation. If it had an emotional name — more specific than "bad" or "anxious" — what would it be? Find the word that makes your body go "...yes, that\'s it."',
        placeholder:
          'e.g. It\'s not anxiety, it\'s dread. Specifically: dread of being seen and found empty. Or: it\'s grief, but the sticky kind — like I\'m mourning something I never had.',
        inputType: 'textarea',
      },
      // ── Step 3: Pennebaker deepening — what's underneath ──────────
      // Pennebaker: "write your very deepest thoughts and feelings."
      // Progressive disclosure: surface → underneath → underneath that.
      // This is where buried material surfaces.
      {
        prompt: 'Now go underneath it. What is this feeling really about? Write your deepest, most honest thoughts — the ones you haven\'t said to anyone, maybe not even yourself. No editing.',
        placeholder:
          'e.g. I think I\'m afraid that I\'m broken in a way that can\'t be fixed. That everyone else figured something out that I missed. That the sessions help but I\'m still the same person when the medicine wears off.',
        inputType: 'textarea',
      },
      // ── Step 4: The inventory — everything that's bothering you ────
      // Structured surfacing. Lists bypass the avoidance that free-form
      // writing allows. MAPS protocol: gather "fears and concerns."
      // Instruction is to be exhaustive, not polished.
      {
        prompt: 'List everything that\'s bothering you right now. Big and small, rational and irrational. Don\'t filter — just dump. One thing per line if it helps.',
        placeholder:
          'e.g. The conversation I\'m avoiding with my mom. Money. That I haven\'t exercised in two weeks. A comment someone made that I can\'t stop replaying. The feeling that I\'m wasting my potential. That weird pain in my side.',
        inputType: 'textarea',
      },
      // ── Step 5: Fears about the session (MAPS protocol) ───────────
      // MAPS: "It is helpful to remember nothing is going to come up
      // that is not already there. Whatever comes up is something you
      // are walking around with already but not conscious of."
      {
        prompt: 'What are you afraid might happen in this session? Name every fear — including the embarrassing ones. Remember: nothing will come up that isn\'t already inside you.',
        placeholder:
          'e.g. That I\'ll feel nothing and waste the session. That I\'ll cry and not be able to stop. That something will surface I\'m not ready for. That it\'ll work and then I\'ll have to actually change.',
        inputType: 'textarea',
      },
      // ── Step 6: Gendlin "asking" — what wants attention ───────────
      // Gendlin Step 5: "Ask the felt sense what it needs."
      // After surfacing everything, let the material self-organize.
      // The intention should *emerge* from what was surfaced, not be
      // imposed top-down.
      {
        prompt: 'Look at everything you just wrote. What feels like it\'s asking for attention most? Not what you think you *should* work on — what\'s pulling at you? Let your intention come from that.',
        placeholder:
          'e.g. I want to understand why I feel empty even when things are going well. Or: I want to let myself feel the grief I keep intellectualizing. Or just: I want to stop fighting myself.',
        inputType: 'textarea',
      },
      // ── Step 7: Safety anchor + letter to self ─────────────────────
      // KAP protocols: establish felt safety. MAPS: "you will be
      // supported." Pennebaker: closing with self-directed compassion
      // helps contain the material that was opened.
      {
        prompt: 'Write a message to yourself for when you come back. Speak to yourself the way you\'d speak to someone you love who just went through something hard.',
        placeholder:
          'e.g. Whatever you saw was real, even if it fades. You don\'t have to understand it tonight. Drink water, eat something warm, don\'t make any decisions. You did a brave thing.',
        inputType: 'textarea',
      },
    ],
  },
];
