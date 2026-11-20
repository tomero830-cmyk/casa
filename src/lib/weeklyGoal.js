// Shared weekly goal: counts "workout days" per person across all workout sources.
// A person-day counts once even if it has gym sets, a watch walk and a completed plan.

import { parseDateStr, toDateStr } from "@/lib/dates";
import { weekStart } from "@/lib/runs";

export const DEFAULT_WEEKLY_TARGET = 8;

/** Normalizes rows from GymSet / HealthWorkout / Workout(is_completed) into {email, date}. */
export function activityDays({ gymSets = [], watchWorkouts = [], plannedWorkouts = [] }) {
  const days = new Set();
  const add = (email, date) => { if (email && date) days.add(`${email.toLowerCase()}|${date}`); };
  gymSets.forEach(s => add(s.created_by, s.date));
  watchWorkouts.forEach(w => add(w.created_by, w.date));
  plannedWorkouts.filter(w => w.is_completed).forEach(w => add(w.created_by, w.date));
  return [...days].map(k => { const [email, date] = k.split("|"); return { email, date }; });
}

/** Per-person and total workout days in the week starting `start` (Sunday, "YYYY-MM-DD"). */
export function weekTotals(days, start) {
  const end = toDateStr(new Date(parseDateStr(start).getTime() + 6 * 86400000));
  const perPerson = {};
  for (const d of days) {
    if (d.date < start || d.date > end) continue;
    perPerson[d.email] = (perPerson[d.email] || 0) + 1;
  }
  const total = Object.values(perPerson).reduce((s, n) => s + n, 0);
  return { start, end, perPerson, total };
}

/** Consecutive completed weeks before the current one (the current week doesn't break a streak). */
export function goalStreak(days, today, target, maxWeeks = 52) {
  let streak = 0;
  let start = weekStart(today);
  for (let i = 0; i < maxWeeks; i++) {
    start = toDateStr(new Date(parseDateStr(start).getTime() - 7 * 86400000));
    if (weekTotals(days, start).total >= target) streak++;
    else break;
  }
  return streak;
}

/** Everything the card needs for "this week". */
export function weeklyGoalSummary(sources, today, target = DEFAULT_WEEKLY_TARGET) {
  const days = activityDays(sources);
  const week = weekTotals(days, weekStart(today));
  return {
    ...week,
    target,
    reached: week.total >= target,
    remaining: Math.max(0, target - week.total),
    streak: goalStreak(days, today, target),
  };
}
