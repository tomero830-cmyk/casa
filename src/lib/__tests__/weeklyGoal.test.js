import { describe, it, expect } from "vitest";
import { activityDays, weekTotals, goalStreak, weeklyGoalSummary } from "@/lib/weeklyGoal";

const A = "a@x.com";
const B = "b@x.com";

const sources = {
  gymSets: [
    { created_by: A, date: "2026-11-15" }, { created_by: A, date: "2026-11-15" }, // same day, many sets
    { created_by: A, date: "2026-11-17" },
    { created_by: A, date: "2026-11-09" }, { created_by: A, date: "2026-11-11" },
  ],
  watchWorkouts: [
    { created_by: A, date: "2026-11-17" }, // same day as gym → counts once
    { created_by: B, date: "2026-11-16" }, { created_by: B, date: "2026-11-18" },
    { created_by: B, date: "2026-11-10" }, { created_by: B, date: "2026-11-12" },
  ],
  plannedWorkouts: [
    { created_by: B, date: "2026-11-19", is_completed: true },
    { created_by: B, date: "2026-11-20", is_completed: false }, // not done → ignored
    { created_by: A, date: "2026-11-13", is_completed: true },
  ],
};

describe("weekly goal", () => {
  it("counts each person-day once across sources", () => {
    const days = activityDays(sources);
    expect(days.filter(d => d.email === A && d.date === "2026-11-17")).toHaveLength(1);
    expect(days.some(d => d.date === "2026-11-20")).toBe(false);
  });
  it("totals a Sunday-to-Saturday week per person", () => {
    const t = weekTotals(activityDays(sources), "2026-11-15");
    expect(t.end).toBe("2026-11-21");
    expect(t.perPerson).toEqual({ [A]: 2, [B]: 3 });
    expect(t.total).toBe(5);
  });
  it("summarizes this week against the target", () => {
    const s = weeklyGoalSummary(sources, "2026-11-20", 8);
    expect(s.total).toBe(5);
    expect(s.remaining).toBe(3);
    expect(s.reached).toBe(false);
  });
  it("counts the streak of past completed weeks", () => {
    const days = activityDays(sources);
    // Week of 11-08: A on 9, 11, 13 and B on 10, 12 → 5 days
    expect(goalStreak(days, "2026-11-20", 5)).toBe(1);
    expect(goalStreak(days, "2026-11-20", 6)).toBe(0);
  });
});
