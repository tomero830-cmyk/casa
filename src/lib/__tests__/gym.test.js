import { describe, it, expect } from "vitest";
import { estimate1RM, exerciseSessions, personalRecords, isPersonalRecord, lastSessionBefore, summarizeSets, exerciseOptions, groupDayByExercise } from "@/lib/gym";

const S = (id, date, exercise, n, reps, w, t = 1) => ({ id, date, exercise, set_number: n, reps, weight_kg: w, created_date: `${date}T10:0${t}:00Z` });
const sets = [
  S(1, "2026-11-10", "סקוואט", 1, 10, 40, 1), S(2, "2026-11-10", "סקוואט", 2, 10, 40, 2),
  S(3, "2026-11-14", "סקוואט", 1, 8, 45, 1), S(4, "2026-11-14", "סקוואט", 2, 8, 45, 2),
  S(5, "2026-11-17", "סקוואט", 1, 10, 45, 1),
  S(6, "2026-11-17", "מתח", 1, 5, 0, 2), S(7, "2026-11-20", "מתח", 1, 7, 0, 1),
];

describe("gym", () => {
  it("estimates 1RM with Epley and handles edge cases", () => {
    expect(estimate1RM(40, 10)).toBe(53.3);
    expect(estimate1RM(100, 1)).toBe(100);
    expect(estimate1RM(0, 10)).toBe(0);
  });
  it("summarizes sessions per exercise", () => {
    const s = exerciseSessions(sets, "סקוואט");
    expect(s.map(x => x.date)).toEqual(["2026-11-10", "2026-11-14", "2026-11-17"]);
    expect(s[0].volume).toBe(800);
  });
  it("computes personal records", () => {
    const r = personalRecords(sets, "סקוואט");
    expect(r.heaviest).toEqual({ value: 45, date: "2026-11-14" });
    expect(r.best1RM.value).toBe(60);
    expect(r.sessions).toBe(3);
  });
  it("flags PRs but not the first-ever set or an equal repeat", () => {
    expect(isPersonalRecord(sets[0], sets)).toBe(false);
    expect(isPersonalRecord(sets[2], sets)).toBe(true);
    expect(isPersonalRecord(sets[3], sets)).toBe(false);
    expect(isPersonalRecord(sets[6], sets)).toBe(true); // bodyweight: more reps
  });
  it("finds the previous session and summarizes it", () => {
    expect(summarizeSets(lastSessionBefore(sets, "סקוואט", "2026-11-17").sets)).toBe("2 × 8 · 45 ק״ג");
    expect(lastSessionBefore(sets, "סקוואט", "2026-11-10")).toBeNull();
  });
  it("lists recent exercises first, then defaults", () => {
    const opts = exerciseOptions(sets);
    expect(opts.slice(0, 2)).toEqual(["מתח", "סקוואט"]);
    expect(opts).toContain("דדליפט");
    expect(new Set(opts).size).toBe(opts.length);
  });
  it("groups a day by exercise in logging order", () => {
    const g = groupDayByExercise(sets.filter(s => s.date === "2026-11-17"));
    expect(g.map(x => x.exercise)).toEqual(["סקוואט", "מתח"]);
  });
});
