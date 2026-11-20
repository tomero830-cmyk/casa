import { describe, it, expect } from "vitest";
import { walkStats, cadence } from "@/lib/walks";

const walks = [
  { date: "2026-11-10", duration_min: 30, steps: 3300 },
  { date: "2026-11-13", duration_min: 35, steps: 3900 },
  { date: "2026-11-16", duration_min: 40, steps: 4500 },
  { date: "2026-11-19", duration_min: 42, steps: 4600 },
];

describe("walks", () => {
  it("computes cadence", () => {
    expect(cadence({ steps: 3300, duration_min: 30 })).toBe(110);
    expect(cadence({ steps: 0, duration_min: 30 })).toBeNull();
  });
  it("sets the walking-time goal 10% above the average of previous walks", () => {
    const s = walkStats(walks);
    expect(s.avgMinutes).toBe(35);
    expect(s.goalMinutes).toBe(39);
    expect(s.last.date).toBe("2026-11-19");
    expect(s.lastVsGoalMinutes).toBeGreaterThan(1);
  });
  it("orders by date regardless of input order", () => {
    expect(walkStats([...walks].reverse()).last.date).toBe("2026-11-19");
  });
  it("returns null without walks", () => {
    expect(walkStats([])).toBeNull();
  });
});
