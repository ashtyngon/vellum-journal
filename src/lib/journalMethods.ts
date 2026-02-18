/* ── Journal Method Definitions ────────────────────────────────────────
   Static definitions for all 8 guided journaling methods available
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
  /* ─── 1. Thought Record (CBT) ─────────────────────────────────────── */
  {
    id: 'thought-record',
    name: 'Thought Record',
    description:
      'Examine an automatic thought by weighing evidence for and against it, then form a more balanced perspective.',
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
      'Drill down through layers of a feeling or frustration to uncover the root belief underneath.',
    icon: 'search_insights',
    category: 'cbt',
    steps: [
      {
        prompt: 'What\'s bothering you right now?',
        placeholder:
          'e.g. I snapped at my partner this morning over something trivial.',
        inputType: 'textarea',
      },
      {
        prompt: 'Why does that bother you?',
        placeholder:
          'e.g. Because I don\'t want to be the kind of person who takes frustration out on people I love.',
        inputType: 'textarea',
      },
      {
        prompt: 'Why does that matter to you?',
        placeholder:
          'e.g. Because I watched my father do the same thing and I swore I\'d be different.',
        inputType: 'textarea',
      },
      {
        prompt: 'Go deeper. Why is that significant?',
        placeholder:
          'e.g. Because I\'m afraid that I\'m becoming someone I don\'t respect.',
        inputType: 'textarea',
      },
      {
        prompt: 'One more time -- why?',
        placeholder:
          'e.g. Because I tie my self-worth to how well I treat others, and when I fail at that I feel fundamentally flawed.',
        inputType: 'textarea',
      },
      {
        prompt:
          'You\'ve reached a root belief. Write it as a single sentence.',
        placeholder:
          'e.g. I believe that if I can\'t control my emotions perfectly, I\'m not a good person.',
        inputType: 'textarea',
      },
      {
        prompt:
          'What did you discover? Does this belief feel true, exaggerated, or somewhere in between?',
        placeholder:
          'e.g. It\'s exaggerated. One bad moment doesn\'t erase everything else. I can apologize and do better.',
        inputType: 'textarea',
      },
    ],
  },

  /* ─── 3. Positive Data Log (CBT) ──────────────────────────────────── */
  {
    id: 'positive-data-log',
    name: 'Positive Data Log',
    description:
      'Actively collect evidence that contradicts a harsh belief you hold about yourself.',
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
      'Reframe a negative story by examining it through different narrative lenses until a more realistic version emerges.',
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

  /* ─── 5. Session Integration (Integration) ────────────────────────── */
  {
    id: 'integration',
    name: 'Session Integration',
    description:
      'Process what came up in a therapy or coaching session so the insights don\'t fade by tomorrow.',
    icon: 'self_improvement',
    category: 'integration',
    steps: [
      {
        prompt:
          'What images, feelings, or moments from the session are still with you?',
        placeholder:
          'e.g. The image of myself as a kid sitting alone at the lunch table. A heavy feeling in my chest when we talked about the move.',
        inputType: 'textarea',
      },
      {
        prompt: 'What felt most significant or surprising?',
        placeholder:
          'e.g. I didn\'t expect to cry when we talked about my grandmother. I think I\'ve been carrying that grief longer than I realized.',
        inputType: 'textarea',
      },
      {
        prompt:
          'Is there an old belief that feels a little less true now?',
        placeholder:
          'e.g. The belief that needing help means I\'m weak. Today it felt more like needing help means I\'m honest.',
        inputType: 'textarea',
      },
      {
        prompt:
          'What new understanding or perspective is forming?',
        placeholder:
          'e.g. I\'m starting to see that my perfectionism isn\'t discipline -- it\'s fear. And I can work with fear differently than I thought.',
        inputType: 'textarea',
      },
      {
        prompt:
          'What\'s one thing from this session you want to carry forward into your week?',
        placeholder:
          'e.g. When I notice the urge to over-prepare, pause and ask: "Am I preparing, or am I hiding?"',
        inputType: 'textarea',
      },
    ],
  },

  /* ─── 6. Body Scan (Integration) ──────────────────────────────────── */
  {
    id: 'body-scan',
    name: 'Body Scan',
    description:
      'Tune into a specific area of your body and listen to what it might be holding or communicating.',
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
          'Throat',
          'Chest',
          'Stomach',
          'Shoulders',
          'Back',
          'Hands',
          'Legs',
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
      'End the day by naming three things that went well and exploring why. Simple, but surprisingly powerful over time.',
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
          'e.g. Good things don\'t just happen to me -- I create the conditions for them. When I slow down and show up, life meets me halfway.',
        inputType: 'textarea',
      },
    ],
  },

  /* ─── 8. Anxiety Reality Check (CBT) ────────────────────────────── */
  {
    id: 'anxiety-reality-check',
    name: 'Anxiety Reality Check',
    description:
      'Catch your anxiety in the act. Name what it\'s telling you, then compare the prediction to what\'s actually happening.',
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
];
