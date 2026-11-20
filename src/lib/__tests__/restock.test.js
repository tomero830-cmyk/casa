import { describe, it, expect } from "vitest";
import { buildRestockSuggestions } from "@/components/shopping/RestockSuggestions";

const item = (id, name, at, sid) => ({ id, name, purchased_at: at, purchase_session_id: sid });

describe("restock suggestions", () => {
  const history = [
    item(1, "חלב", "2026-11-01T10:00:00Z", "a"),
    item(2, "חלב", "2026-11-08T10:00:00Z", "b"),
    item(3, "חלב", "2026-11-15T10:00:00Z", "c"),
    item(4, "אורז", "2026-11-14T10:00:00Z", "c"),
  ];
  it("suggests items whose usual interval has passed", () => {
    const s = buildRestockSuggestions(history, [], new Date("2026-11-22T12:00:00Z"));
    expect(s.map(x => x.item.name)).toEqual(["חלב"]);
    expect(Math.round(s[0].avgDays)).toBe(7);
  });
  it("skips items bought only once or already on the list", () => {
    const s = buildRestockSuggestions(history, [{ name: "חלב" }], new Date("2026-11-22T12:00:00Z"));
    expect(s).toEqual([]);
  });
  it("does not suggest too early", () => {
    expect(buildRestockSuggestions(history, [], new Date("2026-11-17T12:00:00Z"))).toEqual([]);
  });
});
