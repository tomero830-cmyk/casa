// Indoor-walk statistics from Apple Watch workouts (HealthWorkout rows).
// Main metric: walking time (minutes per walk). Goal = 10% above the recent average.
// Steps and cadence are secondary context.

export const GOAL_BOOST = 1.1;

/** Steps per minute for one walk, or null when duration/steps are missing. */
export function cadence(walk) {
  const steps = Number(walk?.steps) || 0;
  const minutes = Number(walk?.duration_min) || 0;
  if (steps <= 0 || minutes <= 0) return null;
  return Math.round(steps / minutes);
}

const avg = (nums) => (nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : null);

/**
 * Baseline and goals from the last `window` walks (excluding the most recent one,
 * so the latest walk is judged against the goal it was aiming for).
 * @returns {null | {
 *   count, last, lastCadence,
 *   avgMinutes, goalMinutes, lastVsGoalMinutes,
 *   avgSteps, goalSteps, avgCadence, goalCadence,
 *   lastVsGoalSteps, lastVsGoalCadence   // ratios, 1 = exactly on goal
 * }}
 */
export function walkStats(walks, { window = 8 } = {}) {
  const sorted = (walks || [])
    .filter(w => w && w.date)
    .sort((a, b) => `${a.date}${a.start_time || ""}`.localeCompare(`${b.date}${b.start_time || ""}`));
  if (!sorted.length) return null;

  const last = sorted[sorted.length - 1];
  const history = sorted.length > 1 ? sorted.slice(0, -1) : sorted;
  const base = history.slice(-window);

  const minutesList = base.map(w => Number(w.duration_min) || 0).filter(n => n > 0);
  const stepsList = base.map(w => Number(w.steps) || 0).filter(n => n > 0);
  const cadenceList = base.map(cadence).filter(n => n != null);

  const avgMinutes = avg(minutesList);
  const goalMinutes = avgMinutes != null ? Math.round(avgMinutes * GOAL_BOOST) : null;
  const avgSteps = avg(stepsList);
  const avgCadence = avg(cadenceList);
  const goalSteps = avgSteps != null ? Math.round(avgSteps * GOAL_BOOST) : null;
  const goalCadence = avgCadence != null ? Math.round(avgCadence * GOAL_BOOST) : null;
  const lastCadence = cadence(last);

  return {
    count: sorted.length,
    last,
    lastCadence,
    avgMinutes: avgMinutes != null ? Math.round(avgMinutes) : null,
    goalMinutes,
    lastVsGoalMinutes: goalMinutes && Number(last.duration_min) ? Number(last.duration_min) / goalMinutes : null,
    avgSteps: avgSteps != null ? Math.round(avgSteps) : null,
    goalSteps,
    avgCadence: avgCadence != null ? Math.round(avgCadence) : null,
    goalCadence,
    lastVsGoalSteps: goalSteps && Number(last.steps) ? Number(last.steps) / goalSteps : null,
    lastVsGoalCadence: goalCadence && lastCadence ? lastCadence / goalCadence : null,
  };
}
