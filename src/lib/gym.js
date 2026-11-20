// Strength-training log helpers. Pure functions over GymSet rows:
// { id, date: "YYYY-MM-DD", exercise, set_number, reps, weight_kg, created_date }

/** Common gym exercises (Hebrew) offered before the user has history. */
export const DEFAULT_EXERCISES = [
  "סקוואט", "דדליפט", "דדליפט רומני", "היפ ת'ראסט", "לאנג'ים", "לחיצת רגליים",
  "פשיטת ברכיים", "כפיפת ברכיים", "לחיצת חזה", "לחיצת חזה בשיפוע", "לחיצת כתפיים",
  "הרחקת כתפיים", "פולי עליון", "חתירה בכבל", "חתירה במשקולת", "מתח",
  "כפיפת מרפקים", "פשיטת מרפקים", "פלאנק", "עליות תאומים",
];

const normalize = (s) => (s || "").trim();

/** Estimated one-rep max (Epley). Bodyweight sets (0 kg) return 0. */
export function estimate1RM(weightKg, reps) {
  const w = Number(weightKg) || 0;
  const r = Number(reps) || 0;
  if (w <= 0 || r <= 0) return 0;
  if (r === 1) return w;
  return Math.round(w * (1 + r / 30) * 10) / 10;
}

/** Orders sets within a day: by set_number, then creation time. */
export function sortSets(sets) {
  return [...sets].sort((a, b) =>
    (a.set_number || 0) - (b.set_number || 0) ||
    String(a.created_date || "").localeCompare(String(b.created_date || ""))
  );
}

/** Exercise names for the picker: history first (most recent use), then defaults. */
export function exerciseOptions(allSets) {
  const lastUsed = new Map();
  for (const s of allSets) {
    const name = normalize(s.exercise);
    if (!name) continue;
    if (!lastUsed.has(name) || s.date > lastUsed.get(name)) lastUsed.set(name, s.date);
  }
  const used = [...lastUsed.entries()].sort((a, b) => b[1].localeCompare(a[1])).map(([n]) => n);
  return [...used, ...DEFAULT_EXERCISES.filter(n => !lastUsed.has(n))];
}

/** Groups one day's sets by exercise, keeping the order exercises were first logged. */
export function groupDayByExercise(daySets) {
  const groups = new Map();
  const ordered = [...daySets].sort((a, b) => String(a.created_date || "").localeCompare(String(b.created_date || "")));
  for (const s of ordered) {
    const name = normalize(s.exercise);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(s);
  }
  return [...groups.entries()].map(([exercise, sets]) => ({ exercise, sets: sortSets(sets) }));
}

/** Per-session summary for one exercise, oldest → newest. */
export function exerciseSessions(allSets, exercise) {
  const byDate = new Map();
  for (const s of allSets) {
    if (normalize(s.exercise) !== normalize(exercise) || !s.date) continue;
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date).push(s);
  }
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, sets]) => ({
      date,
      sets: sortSets(sets),
      topWeight: Math.max(...sets.map(s => Number(s.weight_kg) || 0)),
      best1RM: Math.max(...sets.map(s => estimate1RM(s.weight_kg, s.reps))),
      volume: sets.reduce((sum, s) => sum + (Number(s.weight_kg) || 0) * (Number(s.reps) || 0), 0),
      totalReps: sets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0),
    }));
}

/** The most recent session of an exercise strictly before `date`, or null. */
export function lastSessionBefore(allSets, exercise, date) {
  const sessions = exerciseSessions(allSets, exercise).filter(s => s.date < date);
  return sessions[sessions.length - 1] || null;
}

/** All-time records for an exercise. */
export function personalRecords(allSets, exercise) {
  const sessions = exerciseSessions(allSets, exercise);
  if (!sessions.length) return null;
  const pick = (key) => sessions.reduce((best, s) => (s[key] > best[key] ? s : best), sessions[0]);
  const heaviest = pick("topWeight");
  const strongest = pick("best1RM");
  const biggest = pick("volume");
  return {
    heaviest: { value: heaviest.topWeight, date: heaviest.date },
    best1RM: { value: strongest.best1RM, date: strongest.date },
    volume: { value: biggest.volume, date: biggest.date },
    sessions: sessions.length,
  };
}

/**
 * Whether `set` beat every earlier set of the same exercise (by weight, or by
 * estimated 1RM for the same or lighter weight). The first time an exercise is
 * logged is not a PR, so a new exercise doesn't light up every set.
 */
export function isPersonalRecord(set, allSets) {
  const earlier = allSets.filter(s =>
    s.id !== set.id &&
    normalize(s.exercise) === normalize(set.exercise) &&
    (s.date < set.date || (s.date === set.date && String(s.created_date || "") < String(set.created_date || "")))
  );
  if (!earlier.length) return false;
  const w = Number(set.weight_kg) || 0;
  const e1 = estimate1RM(set.weight_kg, set.reps);
  const maxW = Math.max(...earlier.map(s => Number(s.weight_kg) || 0));
  const maxE1 = Math.max(...earlier.map(s => estimate1RM(s.weight_kg, s.reps)));
  if (w > 0) return w > maxW || e1 > maxE1;
  // Bodyweight: more reps than ever before
  const maxReps = Math.max(...earlier.filter(s => !(Number(s.weight_kg) > 0)).map(s => Number(s.reps) || 0), 0);
  return (Number(set.reps) || 0) > maxReps;
}

/** "3 × 10 · 40 ק״ג" style summary for a list of sets. */
export function summarizeSets(sets) {
  if (!sets?.length) return "";
  const sameReps = sets.every(s => s.reps === sets[0].reps);
  const sameWeight = sets.every(s => s.weight_kg === sets[0].weight_kg);
  const kg = (w) => (Number(w) > 0 ? `${w} ק״ג` : "משקל גוף");
  if (sameReps && sameWeight) return `${sets.length} × ${sets[0].reps} · ${kg(sets[0].weight_kg)}`;
  return sets.map(s => `${s.reps}×${Number(s.weight_kg) > 0 ? s.weight_kg : "BW"}`).join("  ");
}
