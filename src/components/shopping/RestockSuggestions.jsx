import { useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";

const DAY_MS = 24 * 60 * 60 * 1000;
const normalize = (name) => (name || "").trim().toLowerCase();

/**
 * Builds restock suggestions from purchase history: items bought on at least 2 separate
 * shopping trips whose typical interval has passed since the last purchase.
 */
export function buildRestockSuggestions(historyItems, activeItems, now = new Date()) {
  const onList = new Set(activeItems.map(i => normalize(i.name)));
  const byName = {};

  historyItems.forEach(item => {
    if (!item.purchased_at) return;
    const key = normalize(item.name);
    if (!key || onList.has(key)) return;
    const entry = byName[key] || (byName[key] = { sample: item, times: new Set() });
    // One timestamp per trip (session), so duplicates in the same trip count once
    entry.times.add(`${item.purchase_session_id}|${new Date(item.purchased_at).toDateString()}`);
    if (new Date(item.purchased_at) > new Date(entry.sample.purchased_at)) entry.sample = item;
  });

  return Object.values(byName)
    .map(({ sample, times }) => {
      const dates = [...times]
        .map(t => new Date(t.split("|")[1]).getTime())
        .sort((a, b) => a - b);
      if (dates.length < 2) return null;
      const gaps = dates.slice(1).map((d, i) => d - dates[i]).filter(g => g > 0);
      if (!gaps.length) return null;
      const avgDays = gaps.reduce((s, g) => s + g, 0) / gaps.length / DAY_MS;
      const daysSince = (now.getTime() - dates[dates.length - 1]) / DAY_MS;
      return { item: sample, avgDays, daysSince, count: dates.length, due: daysSince / avgDays };
    })
    .filter(s => s && s.due >= 0.9)
    .sort((a, b) => b.due - a.due || b.count - a.count)
    .slice(0, 8);
}

export default function RestockSuggestions({ historyItems, activeItems, onAdd }) {
  const [added, setAdded] = useState(() => new Set());

  const suggestions = useMemo(
    () => buildRestockSuggestions(historyItems, activeItems).filter(s => !added.has(s.item.id)),
    [historyItems, activeItems, added]
  );

  if (suggestions.length === 0) return null;

  const handleAdd = (s) => {
    setAdded(prev => new Set(prev).add(s.item.id));
    onAdd(s.item);
  };

  return (
    <div className="surface p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <RefreshCw className="w-3.5 h-3.5 text-primary" />
        <p className="text-xs font-semibold">כנראה הגיע הזמן לקנות שוב</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map(s => (
          <button
            key={s.item.id}
            onClick={() => handleAdd(s)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium active:scale-95 transition-transform"
            title={`נקנה ${s.count} פעמים, בערך כל ${Math.round(s.avgDays)} ימים`}
          >
            <Plus className="w-3 h-3" />
            {s.item.name}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">לפי הקצב שבו קניתם את המוצרים בעבר</p>
    </div>
  );
}
