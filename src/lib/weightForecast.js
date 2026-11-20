// Weight-goal forecast: least-squares trend over recent weigh-ins, projected to the goal.
// Pure functions (no React / Base44) so they can be unit-tested.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days between two "YYYY-MM-DD" strings, at local noon to avoid DST shifts. */
function dayIndex(dateStr) {
  return Math.round(new Date(`${dateStr}T12:00:00`).getTime() / DAY_MS);
}

/** Least-squares line through points [{x, y}] → { slope, intercept, r2 } or null. */
export function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (const p of points) {
    sxx += (p.x - mx) ** 2;
    sxy += (p.x - mx) * (p.y - my);
    syy += (p.y - my) ** 2;
  }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const r2 = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);
  return { slope, intercept, r2 };
}

/**
 * Forecasts when `goal` will be reached.
 * @param {{date: string, weight_kg: number}[]} entries weigh-ins (any order)
 * @param {number} goal target weight in kg
 * @param {{ windowDays?: number, today?: string }} options trend window (default 42 days)
 * @returns {null | {
 *   status: "reached" | "on_track" | "wrong_direction" | "flat",
 *   current: number, goal: number, kgPerWeek: number,
 *   etaDate?: string, daysLeft?: number, confidence: "low" | "medium" | "high",
 *   trend: {date: string, weight: number}[]
 * }}
 */
export function forecastWeight(entries, goal, { windowDays = 42, today } = {}) {
  const valid = (entries || [])
    .filter(e => e && e.date && Number.isFinite(Number(e.weight_kg)))
    .map(e => ({ date: e.date, y: Number(e.weight_kg), x: dayIndex(e.date) }))
    .sort((a, b) => a.x - b.x);
  if (!valid.length || !Number.isFinite(Number(goal))) return null;

  const last = valid[valid.length - 1];
  const current = last.y;
  const losing = goal < current;

  if (Math.abs(current - goal) < 0.05) {
    return { status: "reached", current, goal, kgPerWeek: 0, confidence: "high", trend: [] };
  }

  const recent = valid.filter(p => p.x >= last.x - windowDays);
  const fit = linearRegression(recent.length >= 3 ? recent : valid);
  if (!fit) return { status: "flat", current, goal, kgPerWeek: 0, confidence: "low", trend: [] };

  const kgPerWeek = Math.round(fit.slope * 7 * 100) / 100;
  const spanDays = recent.length ? last.x - recent[0].x : 0;
  const confidence = recent.length >= 8 && spanDays >= 21 && fit.r2 >= 0.5 ? "high"
    : recent.length >= 4 && spanDays >= 10 ? "medium" : "low";

  if (Math.abs(fit.slope) < 0.005) return { status: "flat", current, goal, kgPerWeek, confidence, trend: [] };
  const movingToward = losing ? fit.slope < 0 : fit.slope > 0;
  if (!movingToward) return { status: "wrong_direction", current, goal, kgPerWeek, confidence, trend: [] };

  // Project from the trend line's value today, not the last noisy weigh-in
  const todayX = today ? dayIndex(today) : last.x;
  const trendNow = fit.intercept + fit.slope * todayX;
  const daysLeft = Math.max(0, Math.ceil((goal - trendNow) / fit.slope));
  const etaX = todayX + daysLeft;
  const toStr = (x) => {
    const d = new Date(x * DAY_MS);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  };

  // Points for drawing the projected line: today → goal date
  const steps = Math.min(daysLeft, 365);
  const trend = [0, Math.round(steps / 2), steps].map(d => ({
    date: toStr(todayX + d),
    weight: Math.round((trendNow + fit.slope * d) * 10) / 10,
  }));

  return { status: "on_track", current, goal, kgPerWeek, etaDate: toStr(etaX), daysLeft, confidence, trend };
}
