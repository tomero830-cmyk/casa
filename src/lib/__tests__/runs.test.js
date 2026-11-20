import { describe, it, expect } from "vitest";
import { pace, formatPace, weekStart, runStats } from "@/lib/runs";

const runs = [
  { date: "2026-11-10", duration_min: 30, distance_km: 5 },   // prev week (Sun 11-08)
  { date: "2026-11-12", duration_min: 33, distance_km: 5.5 },
  { date: "2026-11-15", duration_min: 28, distance_km: 5 },   // this week (Sun 11-15)
  { date: "2026-11-18", duration_min: 55, distance_km: 10 },
];

describe("runs", () => {
  it("computes and formats pace", () => {
    expect(pace({ duration_min: 30, distance_km: 5 })).toBe(6);
    expect(formatPace(5.7)).toBe("5:42");
    expect(formatPace(5.999)).toBe("6:00");
    expect(formatPace(null)).toBe("—");
  });
  it("starts weeks on Sunday", () => {
    expect(weekStart("2026-11-20")).toBe("2026-11-15"); // Friday → Sunday
    expect(weekStart("2026-11-15")).toBe("2026-11-15");
  });
  it("summarizes this week vs last week", () => {
    const s = runStats(runs, "2026-11-20");
    expect(s.weekKm).toBe(15);
    expect(s.weekRuns).toBe(2);
    expect(s.prevWeekKm).toBe(10.5);
    expect(s.longestKm).toBe(10);
    expect(s.last.date).toBe("2026-11-18");
    expect(s.lastPace).toBeCloseTo(5.5);
  });
  it("returns null without runs", () => {
    expect(runStats([], "2026-11-20")).toBeNull();
  });
});
