import type { RapidLogEntry, Habit, JournalEntry, DayDebrief } from '../context/AppContext';
import { todayStr, daysAgo } from './dateUtils';

/* ── Helpers ──────────────────────────────────────────────────────────── */

function yesterdayStr(): string {
  return daysAgo(1);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.round(
    Math.abs(new Date(a).getTime() - new Date(b).getTime()) / msPerDay,
  );
}

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

function formatRelativeDay(dateStr: string): string {
  const today = todayStr();
  const diff = daysBetween(today, dateStr);
  if (dateStr === today) return 'today';
  if (diff === 1 && dateStr > today) return 'tomorrow';
  if (diff <= 6) {
    const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
    return dayName;
  }
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Inspirational Prompt Pool ────────────────────────────────────────── */

const INSPIRATIONAL_POOL: string[] = [
  "What would make today feel successful -- even a little?",
  "You don't have to do everything. You just have to start.",
  "What's one thing you'd be proud of finishing today?",
  "A good day isn't a perfect day. It's a present day.",
  "What can you let go of today?",
  "Start with the easiest thing. Momentum builds itself.",
  "Your only competition is yesterday's version of you.",
  "What would future you thank present you for doing?",
  "Done is better than perfect. Always.",
  "The day is yours. How do you want to spend it?",
  "What would you do today if you weren't afraid of getting it wrong?",
  "Rest counts. Doing nothing is sometimes the most productive choice.",
  "You don't need more hours. You need more intention.",
  "What's the one thing that, if you did it, would make everything else easier?",
  "Progress isn't always visible. Trust the process today.",
  "You're allowed to change your mind about what matters.",
  "Small things done consistently beat big things done occasionally.",
  "What do you actually want to do today -- not should, want?",
  "A five-minute start is still a start.",
  "You've handled hard days before. You'll handle this one too.",
  "What would a kind friend tell you to focus on today?",
  "Not every day has to be productive. Some days just need to be survived.",
  "The task you're avoiding is probably the one that matters most.",
  "Give yourself the same grace you'd give someone you love.",
  "Today doesn't have to be extraordinary. Ordinary is enough.",
  "What's one small thing you can do to take care of yourself today?",
  "You don't owe anyone a perfect performance. Show up as you are.",
  "Finished is a feeling worth chasing.",
  "What would today look like if you trusted yourself more?",
  "The goal isn't to be busy. It's to be intentional.",
  "Some of your best work will come from your quietest days.",
  "What can you simplify today?",
  "You're not behind. You're on your own timeline.",
  "One clear priority beats ten vague intentions.",
  "Energy management matters more than time management.",
  "What's worth your attention today, and what isn't?",
  "You don't have to earn rest. You can just rest.",
  "Celebrate the tasks you finished, not just the ones still open.",
  "It's okay to do less and do it well.",
  "What would you attempt if you knew you wouldn't judge yourself for failing?",
  "The boring stuff counts too. Laundry, emails, groceries -- all progress.",
  "A slow start is still a start.",
  "What's one thing you've been putting off that would take less than ten minutes?",
  "Breathe first. Plan second.",
  "You can hold two things at once: ambition and gentleness.",
  "Today's task list is a suggestion, not a contract.",
  "What are you grateful for right now, before the day begins?",
  "The hardest part is usually the first two minutes.",
  "You've already survived 100% of your worst days.",
  "What would make tonight's version of you feel at peace?",
  "Don't measure today by yesterday's expectations.",
  "Sometimes the bravest thing is asking for help.",
  "Focus on depth, not breadth. One thing done well beats five things half-done.",
  "Your worth isn't determined by your output.",
  "What would make this an unexpectedly good day?",
  "Take the pressure off. Lower the bar. Then start.",
  "Discomfort is often a sign that you're growing.",
  "Write the messy draft. Send the imperfect email. Ship the rough version.",
  "What would you tell yourself if you were your own coach?",
  "Momentum doesn't require motivation. It requires movement.",
  "Be honest with yourself about what you actually have energy for.",
  "Today is a good day to finish something old instead of starting something new.",
  "You don't need a perfect morning to have a meaningful day.",
  "What's one boundary you can protect today?",
  "Comparison is a thief. Stay in your own lane.",
  "The best productivity hack is self-compassion.",
  "What matters to you -- not your inbox, not your calendar -- you?",
  "You can always course-correct. Starting wrong is better than not starting.",
  "It's not about having time. It's about making a choice.",
];

/* ── Contextual Prompt Generator ──────────────────────────────────────── */

function getContextualPrompt(data: {
  entries: RapidLogEntry[];
  habits: Habit[];
  journalEntries: JournalEntry[];
  debriefs: DayDebrief[];
}): string {
  const { entries, habits, journalEntries, debriefs } = data;
  const today = todayStr();
  const yesterday = yesterdayStr();

  // ── Check for overdue tasks (tasks from before today still open) ──
  const overdueTasks = entries.filter(
    (e) =>
      e.type === 'task' &&
      e.status === 'todo' &&
      e.date < today,
  );
  if (overdueTasks.length > 0) {
    return `You have ${overdueTasks.length} task${overdueTasks.length === 1 ? '' : 's'} from yesterday still open \u2014 want to review them?`;
  }

  // ── Check yesterday's debrief for planRealism > 4 ──
  const yesterdayDebrief = debriefs.find((d) => d.date === yesterday);
  if (yesterdayDebrief && yesterdayDebrief.planRealism > 4) {
    return "Yesterday you said the plan was too ambitious. Be gentle with today.";
  }

  // ── Check if all yesterday's tasks were completed ──
  const yesterdayTasks = entries.filter(
    (e) => e.type === 'task' && e.date === yesterday,
  );
  if (
    yesterdayTasks.length > 0 &&
    yesterdayTasks.every((t) => t.status === 'done')
  ) {
    return "You finished everything yesterday \u2014 nice. Same energy?";
  }

  // ── Count tasks done yesterday ──
  const doneYesterday = entries.filter(
    (e) => e.type === 'task' && e.date === yesterday && e.status === 'done',
  );
  if (doneYesterday.length >= 3) {
    return `You completed ${doneYesterday.length} tasks yesterday. Solid day.`;
  }

  // ── Highest streak habit ──
  if (habits.length > 0) {
    const best = habits.reduce((a, b) => (a.streak > b.streak ? a : b));
    if (best.streak >= 2) {
      return `You've had a ${best.streak}-day streak on ${best.name} \u2014 keep it going!`;
    }
  }

  // ── Events in the next 3 days ──
  const upcomingEvents = entries.filter((e) => {
    if (e.type !== 'event') return false;
    const diff = daysBetween(today, e.date);
    return e.date >= today && diff <= 3 && diff > 0;
  });
  if (upcomingEvents.length > 0) {
    const next = upcomingEvents.sort((a, b) => a.date.localeCompare(b.date))[0];
    return `You have ${next.title} coming up on ${formatRelativeDay(next.date)}. Plan around it.`;
  }

  // ── Days since last journal entry ──
  if (journalEntries.length > 0) {
    const sorted = [...journalEntries].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    const latestDate = sorted[0].date;
    const gap = daysBetween(today, latestDate);
    if (gap > 3) {
      return `It's been ${gap} days since your last journal entry. How about a quick reflection tonight?`;
    }
  }

  // ── Fallback ──
  return "Fresh start today. No pressure \u2014 just one thing at a time.";
}

/* ── Main Export ──────────────────────────────────────────────────────── */

export function generateMorningPrompt(data: {
  entries: RapidLogEntry[];
  habits: Habit[];
  journalEntries: JournalEntry[];
  debriefs: DayDebrief[];
}): { contextual: string; inspirational: string } {
  const contextual = getContextualPrompt(data);

  // Deterministic rotation based on day of year so the same prompt
  // won't repeat within a cycle of the pool length (~70 days).
  const index = dayOfYear() % INSPIRATIONAL_POOL.length;
  const inspirational = INSPIRATIONAL_POOL[index];

  return { contextual, inspirational };
}
