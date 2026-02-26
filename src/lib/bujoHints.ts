/* ── Rapid Log Placeholders ────────────────────────────────────────────
   Short, BuJo-style placeholder strings shown in the entry input.
   Tasks are action-verb-first. Events are descriptive.
   Notes are observational or reflective.
   ──────────────────────────────────────────────────────────────────── */

export const RAPID_LOG_PLACEHOLDERS: Record<'task' | 'event' | 'note', string[]> = {
  task: [
    'Review quarterly budget',
    'Call dentist to reschedule',
    'Email Alex re: project timeline',
    'Buy groceries for the week',
    'Submit expense report',
    'Fix broken link on landing page',
    'Prepare slides for Friday meeting',
    'Schedule 1-on-1 with manager',
    'Return library books',
    'Update resume with recent projects',
    'Research new standing desk options',
    'Clean out the hall closet',
    'Write thank-you note to Sarah',
    'Back up laptop to external drive',
    'Order new running shoes',
    'Read chapter 4 of current book',
    'File tax extension paperwork',
    'Set up automatic bill payment',
    'Organize digital photos from trip',
    'Draft outline for blog post',
    'Replace kitchen light bulb',
    'Cancel unused subscription',
    'Water the plants',
    'Respond to client feedback',
    'Pack lunch for tomorrow',
  ],

  event: [
    'Coffee with Alex at 10am',
    'Dentist appointment at 2:30',
    'Team standup at 9:15',
    'Birthday dinner for Sam',
    'Flight to Portland, 6am departure',
    'Parent-teacher conference at 4pm',
    'Book club meets tonight',
    'Oil change at noon',
    'Annual review with manager',
    'Yoga class at 7am',
    'Lease renewal deadline',
    'Concert at the amphitheater',
    'Volunteering shift, 10am-1pm',
    'Package delivery expected today',
    'Friends visiting from out of town',
    'Quarterly all-hands meeting',
    'Farmers market opens at 8am',
    'Car inspection due this week',
    'Networking event downtown at 6pm',
    'Anniversary dinner reservation',
  ],

  note: [
    'Idea: try morning walks before coffee',
    'The new podcast on focus was really good',
    'Noticed I feel calmer when I plan the night before',
    'Want to explore watercolor painting this summer',
    'Interesting article on habit stacking',
    'The cold brew ratio that finally worked: 1:8',
    'Reminded that slowing down isn\'t the same as stopping',
    'Book recommendation from Jamie: "Four Thousand Weeks"',
    'Felt genuinely grateful for the quiet this morning',
    'Observation: I work better with ambient noise',
    'The sourdough starter is finally active',
    'Thought: maybe I should journal more about wins',
    'Realized I\'ve been skipping lunch too often',
    'Quote I liked: "The obstacle is the way"',
    'Sleep was better after cutting evening screen time',
    'Dream about the old house again',
    'Noticed tension in shoulders during meeting',
    'The light through the kitchen window was beautiful today',
    'Feeling like I need a creative outlet',
    'Note to self: stop checking email before breakfast',
  ],
};

/* ── Rotating Placeholder ─────────────────────────────────────────────── */

const counters: Record<string, number> = {
  task: 0,
  event: 0,
  note: 0,
};

/**
 * Returns a rotating placeholder from the pool for the given entry type.
 * Each call advances the internal counter so the user sees variety.
 */
export function getPlaceholder(type: 'task' | 'event' | 'note'): string {
  const pool = RAPID_LOG_PLACEHOLDERS[type];
  const index = counters[type] % pool.length;
  counters[type] = counters[type] + 1;
  return pool[index];
}

/* ── Signifier Tooltips ───────────────────────────────────────────────── */

export const SIGNIFIER_TOOLTIPS: Array<{ symbol: string; meaning: string }> = [
  { symbol: '\u25cf', meaning: 'Task \u2014 something to do' },
  { symbol: '\u2713', meaning: 'Done \u2014 completed' },
  { symbol: '\u2717', meaning: 'Not doing \u2014 cancelled' },
  { symbol: '\u2192', meaning: 'Moved \u2014 rescheduled' },
  { symbol: '\u25cb', meaning: 'Event \u2014 scheduled' },
  { symbol: '\u2014', meaning: 'Note \u2014 thought or observation' },
];
