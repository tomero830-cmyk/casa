import { describe, it, expect } from "vitest";
import { toDateStr, addDaysStr, parseDateStr } from "@/lib/dates";

describe("dates", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(toDateStr(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
  it("uses the local calendar day, not UTC (00:30 local is still today)", () => {
    expect(toDateStr(new Date(2026, 10, 20, 0, 30))).toBe("2026-11-20");
  });
  it("adds days across month and year boundaries", () => {
    expect(addDaysStr("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDaysStr("2026-01-01", -1)).toBe("2025-12-31");
  });
  it("parses to local noon", () => {
    expect(parseDateStr("2026-03-29").getHours()).toBe(12);
  });
});
