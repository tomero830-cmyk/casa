// Outdoor-run statistics from Apple Watch workouts (HealthWorkout rows, workout_type "outdoor_run").

import { parseDateStr, toDateStr } from "@/lib/dates";

/** Pace in minutes per km, or null. */
export function pace(run) {
  const km = Number(run?.distance_km) || 0;
  const min = Number(run?.duration_min) || 0;
  if (km <= 0 || min <= 0) return null;
  return min / km;
}

/** "5:42" style pace (min:sec per km). */
export function formatPace(minPerKm) {
  if (minPerKm == null || !Number.isFinite(minPerKm)) return "—";
  let m = Math.floor(minPerKm);
  let s = Math.round((minPerKm - m) * 60);
  if (s === 60) { m += 1; s = 0; }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Sunday of the week containing `dateStr` (weeks start on Sunday in Israel). */
export function weekStart(dateStr) {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() - d.getDay());
  return toDateStr(d);
}

/**
 * Summary for the runs card.
 * @param {object[]} runs HealthWorkout rows
 * @param {string} today "YYYY-MM-DD"
 */
export function runStats(runs, today) {
  const sorted = (runs || [])
    .filter(r => r && r.date)
    .sort((a, b) => `${a.date}${a.start_time || ""}`.localeCompare(`${b.date}${b.start_time || ""}`));
  if (!sorted.length) return null;

  const thisWeek = weekStart(today);
  const lastWeekStart = weekStart(toDateStr(new Date(parseDateStr(thisWeek).getTime() - 3 * 86400000)));
  const sumKm = (list) => Math.round(list.reduce((s, r) => s + (Number(r.distance_km) || 0), 0) * 10) / 10;

  const weekRuns = sorted.filter(r => r.date >= thisWeek && r.date <= today);
  const prevWeekRuns = sorted.filter(r => r.date >= lastWeekStart && r.date < thisWeek);
  const recentPaces = sorted.slice(-5).map(pace).filter(p => p != null);
  const last = sorted[sorted.length - 1];

  return {
    count: sorted.length,
    last,
    lastPace: pace(last),
    weekKm: sumKm(weekRuns),
    weekRuns: weekRuns.length,
    prevWeekKm: sumKm(prevWeekRuns),
    avgPace: recentPaces.length ? recentPaces.reduce((s, p) => s + p, 0) / recentPaces.length : null,
    longestKm: Math.max(...sorted.map(r => Number(r.distance_km) || 0)),
  };
}
