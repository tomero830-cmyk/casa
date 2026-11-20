import { describe, it, expect } from "vitest";
import { forecastWeight, linearRegression } from "@/lib/weightForecast";

const series = (start, kgPerDay, days, from = "2026-10-01") => {
  const base = new Date(`${from}T12:00:00`);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(base); d.setDate(base.getDate() + i);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { date, weight_kg: Math.round((start + kgPerDay * i) * 10) / 10 };
  });
};

describe("linearRegression", () => {
  it("fits a perfect line", () => {
    const fit = linearRegression([{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }]);
    expect(fit.slope).toBeCloseTo(2);
    expect(fit.intercept).toBeCloseTo(1);
    expect(fit.r2).toBeCloseTo(1);
  });
  it("returns null for fewer than two points", () => {
    expect(linearRegression([{ x: 0, y: 1 }])).toBeNull();
  });
});

describe("forecastWeight", () => {
  it("projects an ETA when moving toward the goal", () => {
    const f = forecastWeight(series(70, -0.05, 30), 66);
    expect(f.status).toBe("on_track");
    expect(f.kgPerWeek).toBeCloseTo(-0.35, 1);
    expect(f.daysLeft).toBeGreaterThan(40);
    expect(f.daysLeft).toBeLessThan(70);
    expect(f.etaDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("reports wrong direction instead of inventing a date", () => {
    expect(forecastWeight(series(70, 0.05, 20), 66).status).toBe("wrong_direction");
  });
  it("reports a flat trend", () => {
    expect(forecastWeight(series(70, 0, 20), 66).status).toBe("flat");
  });
  it("detects a reached goal", () => {
    expect(forecastWeight([{ date: "2026-10-01", weight_kg: 66 }], 66).status).toBe("reached");
  });
  it("ignores invalid rows and handles empty input", () => {
    expect(forecastWeight([], 60)).toBeNull();
    expect(forecastWeight([{ date: "2026-10-01", weight_kg: "x" }], 60)).toBeNull();
  });
});
