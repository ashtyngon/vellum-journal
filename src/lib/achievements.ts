// ---------------------------------------------------------------------------
// Achievement system for Vellum Journal
// ---------------------------------------------------------------------------

/** Per-user achievement record stored in Firestore / local state. */
export interface Achievement {
  id: string;
  unlockedAt: string; // ISO date
  seen: boolean; // user dismissed the notification
}

/** Static definition that lives in code -- never mutated at runtime. */
export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  category:
    | "consistency"
    | "momentum"
    | "sections"
    | "journaling"
    | "time"
    | "resilience"
    | "collections";
}

/** Snapshot of app state fed into the checker each time we evaluate. */
export interface AchievementContext {
  totalActiveDays: number;
  todayTasksCompleted: number;
  todaySessionTasksInARow: number;
  allSectionsComplete: boolean;
  sectionJustCompleted: boolean;
  cleanSweepDaysThisMonth: number;
  cleanSweepDaysTotal: number;
  totalTasksCompleted: number;
  journalExercisesCompleted: number;
  journalMethodsUsed: Set<string>;
  hasDebrief: boolean;
  currentHour: number;
  isWeekend: boolean;
  daysSinceLastActive: number;
  parkingLotUsageCount: number;
  deferredTaskCount: number;
  maxRescheduleCount: number;
  collectionsCreated: number;
  maxCollectionSize: number;
  sectionCompletedInUnder30Min: boolean;
  allDailyTasksCompletedInUnder2Hours: boolean;
}

// ---------------------------------------------------------------------------
// Definitions
// ---------------------------------------------------------------------------

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // -- Consistency (cumulative days, NOT consecutive) -----------------------
  {
    id: "showed_up",
    name: "Showed Up",
    description: "Your first active day",
    icon: "\u{1F331}",
    category: "consistency",
  },
  {
    id: "regular",
    name: "Regular",
    description: "10 active days",
    icon: "\u{1F33F}",
    category: "consistency",
  },
  {
    id: "rooted",
    name: "Rooted",
    description: "30 active days",
    icon: "\u{1F333}",
    category: "consistency",
  },
  {
    id: "part_of_furniture",
    name: "Part of the Furniture",
    description: "100 active days",
    icon: "\u{1F3E1}",
    category: "consistency",
  },

  // -- Momentum -------------------------------------------------------------
  {
    id: "first_blood",
    name: "First Blood",
    description: "First task completed ever",
    icon: "\u26A1",
    category: "momentum",
  },
  {
    id: "on_a_roll",
    name: "On a Roll",
    description: "5 tasks in one session",
    icon: "\u{1F525}",
    category: "momentum",
  },
  {
    id: "avalanche",
    name: "Avalanche",
    description: "Complete a section in under 30 min",
    icon: "\u{1F3D4}\uFE0F",
    category: "momentum",
  },
  {
    id: "speedrun",
    name: "Speedrun",
    description: "All daily tasks done in under 2 hours",
    icon: "\u23F1\uFE0F",
    category: "momentum",
  },

  // -- Sections -------------------------------------------------------------
  {
    id: "full_morning",
    name: "Full Morning",
    description: "All morning tasks done",
    icon: "\u2600\uFE0F",
    category: "sections",
  },
  {
    id: "clean_sweep",
    name: "Clean Sweep",
    description: "All sections done in a day",
    icon: "\u2728",
    category: "sections",
  },
  {
    id: "hat_trick",
    name: "Hat Trick",
    description: "3 clean sweep days total",
    icon: "\u{1F3A9}",
    category: "sections",
  },
  {
    id: "grand_slam",
    name: "Grand Slam",
    description: "5 clean sweep days in a month",
    icon: "\u{1F3C6}",
    category: "sections",
  },

  // -- Journaling -----------------------------------------------------------
  {
    id: "dear_diary",
    name: "Dear Diary",
    description: "First journal exercise completed",
    icon: "\u{1F4D6}",
    category: "journaling",
  },
  {
    id: "method_actor",
    name: "Method Actor",
    description: "Tried 3 different journal methods",
    icon: "\u{1F3AD}",
    category: "journaling",
  },
  {
    id: "self_archaeologist",
    name: "Self-Archaeologist",
    description: "10 exercises completed",
    icon: "\u{1F50D}",
    category: "journaling",
  },
  {
    id: "cartographer",
    name: "Cartographer",
    description: "Completed a debrief",
    icon: "\u{1F5FA}\uFE0F",
    category: "journaling",
  },

  // -- Time Patterns --------------------------------------------------------
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Completed tasks before 8am",
    icon: "\u{1F426}",
    category: "time",
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Journaled after 10pm",
    icon: "\u{1F989}",
    category: "time",
  },
  {
    id: "weekend_warrior",
    name: "Weekend Warrior",
    description: "Active on a weekend",
    icon: "\u2694\uFE0F",
    category: "time",
  },

  // -- Resilience (anti-shame -- warm / celebratory) ------------------------
  {
    id: "phoenix",
    name: "Phoenix",
    description:
      "Came back after 7+ day absence. That takes more courage than a streak ever could.",
    icon: "\u{1F525}",
    category: "resilience",
  },
  {
    id: "parking_pro",
    name: "Parking Pro",
    description:
      "Used parking lot 10 times. Guilt-free deferral is a SKILL.",
    icon: "\u{1F17F}\uFE0F",
    category: "resilience",
  },
  {
    id: "not_today",
    name: "Not Today",
    description: "Deferred 3 tasks without guilt",
    icon: "\u{1F6E1}\uFE0F",
    category: "resilience",
  },
  {
    id: "plot_twist",
    name: "Plot Twist",
    description: "Completed a task rescheduled 3+ times",
    icon: "\u{1F4DC}",
    category: "resilience",
  },

  // -- Collections ----------------------------------------------------------
  {
    id: "curator",
    name: "Curator",
    description: "Created first collection",
    icon: "\u{1F3A8}",
    category: "collections",
  },
  {
    id: "archivist",
    name: "Archivist",
    description: "10 items in a collection",
    icon: "\u{1F4DA}",
    category: "collections",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a static achievement definition by id. */
export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENT_DEFS.find((d) => d.id === id);
}

/**
 * Simple levelling curve.
 * Grows with both breadth (achievements) and depth (active days).
 */
export function calculateLevel(
  achievementCount: number,
  activeDays: number,
): number {
  return Math.floor(Math.sqrt(achievementCount * 10 + activeDays));
}

// ---------------------------------------------------------------------------
// Checker
// ---------------------------------------------------------------------------

/**
 * Given the current app-state snapshot and the set of already-unlocked
 * achievement ids, returns an array of *newly* unlocked achievement ids.
 *
 * This is a pure function -- it never mutates its arguments.
 */
export function checkAchievements(
  ctx: AchievementContext,
  unlocked: Set<string>,
): string[] {
  const newly: string[] = [];

  const grant = (id: string) => {
    if (!unlocked.has(id)) {
      newly.push(id);
    }
  };

  // -- Consistency ----------------------------------------------------------
  if (ctx.totalActiveDays >= 1) grant("showed_up");
  if (ctx.totalActiveDays >= 10) grant("regular");
  if (ctx.totalActiveDays >= 30) grant("rooted");
  if (ctx.totalActiveDays >= 100) grant("part_of_furniture");

  // -- Momentum -------------------------------------------------------------
  if (ctx.totalTasksCompleted >= 1) grant("first_blood");
  if (ctx.todaySessionTasksInARow >= 5) grant("on_a_roll");
  if (ctx.sectionCompletedInUnder30Min) grant("avalanche");
  if (ctx.allDailyTasksCompletedInUnder2Hours) grant("speedrun");

  // -- Sections -------------------------------------------------------------
  if (ctx.sectionJustCompleted) grant("full_morning");
  if (ctx.allSectionsComplete) grant("clean_sweep");
  if (ctx.cleanSweepDaysTotal >= 3) grant("hat_trick");
  if (ctx.cleanSweepDaysThisMonth >= 5) grant("grand_slam");

  // -- Journaling -----------------------------------------------------------
  if (ctx.journalExercisesCompleted >= 1) grant("dear_diary");
  if (ctx.journalMethodsUsed.size >= 3) grant("method_actor");
  if (ctx.journalExercisesCompleted >= 10) grant("self_archaeologist");
  if (ctx.hasDebrief) grant("cartographer");

  // -- Time Patterns --------------------------------------------------------
  if (ctx.todayTasksCompleted >= 1 && ctx.currentHour < 8) grant("early_bird");
  if (ctx.journalExercisesCompleted >= 1 && ctx.currentHour >= 22)
    grant("night_owl");
  if (ctx.isWeekend && ctx.totalActiveDays >= 1) grant("weekend_warrior");

  // -- Resilience -----------------------------------------------------------
  if (ctx.daysSinceLastActive >= 7 && ctx.totalActiveDays >= 2)
    grant("phoenix");
  if (ctx.parkingLotUsageCount >= 10) grant("parking_pro");
  if (ctx.deferredTaskCount >= 3) grant("not_today");
  if (ctx.maxRescheduleCount >= 3 && ctx.totalTasksCompleted >= 1)
    grant("plot_twist");

  // -- Collections ----------------------------------------------------------
  if (ctx.collectionsCreated >= 1) grant("curator");
  if (ctx.maxCollectionSize >= 10) grant("archivist");

  return newly;
}
