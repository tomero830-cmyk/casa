import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Scale, Plus, X, Upload, ChevronDown, ChevronUp } from "lucide-react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { format, parseISO, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { todayStr } from "@/lib/dates";
import ConfirmDialog from "@/components/ConfirmDialog";
import { notifyError } from "@/lib/notify";

export default function WeightTracker({ userEmail }) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({ date: todayStr(), weight_kg: "" });
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const queryClient = useQueryClient();

  const { data: weightEntries = [] } = useQuery({
    queryKey: ["weight-entries", userEmail],
    queryFn: () => base44.entities.WeightEntry.list("-date", 200),
    enabled: !!userEmail,
  });

  const { data: foodEntries = [] } = useQuery({
    queryKey: ["food-entries-weight-chart", userEmail],
    queryFn: () => base44.entities.FoodEntry.list("-date", 500),
    enabled: !!userEmail,
  });

  const createEntry = useMutation({
    mutationFn: (data) => base44.entities.WeightEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-entries", userEmail] });
      setAdding(false);
      setNewEntry({ date: todayStr(), weight_kg: "" });
    },
    onError: (err) => notifyError(err, "שמירת המשקל נכשלה"),
  });

  const deleteEntry = useMutation({
    mutationFn: (id) => base44.entities.WeightEntry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weight-entries", userEmail] }),
    onError: (err) => notifyError(err, "המחיקה נכשלה"),
  });

  const bulkImport = () => {
    // Expected format: one entry per line: "DD/MM/YYYY KG" or "YYYY-MM-DD KG"
    const lines = bulkText.trim().split("\n").filter(Boolean);
    const entries = [];
    for (const line of lines) {
      const parts = line.trim().split(/[\s,\t]+/);
      if (parts.length < 2) continue;
      let dateStr = parts[0];
      const kg = parseFloat(parts[1]);
      if (isNaN(kg)) continue;
      // Convert DD/MM/YYYY to YYYY-MM-DD
      if (dateStr.includes("/")) {
        const [d, m, y] = dateStr.split("/");
        dateStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
      entries.push({ date: dateStr, weight_kg: kg });
    }
    Promise.all(entries.map(e => base44.entities.WeightEntry.create(e))).then(() => {
      queryClient.invalidateQueries({ queryKey: ["weight-entries", userEmail] });
      setShowBulk(false);
      setBulkText("");
    }).catch(err => notifyError(err, "הייבוא נכשל"));
  };

  const chartData = useMemo(() => {
    // Weekly calories from food entries (excluding steps/burned)
    const myFood = foodEntries.filter(
      e => e.created_by === userEmail && e.food_name !== "__steps__" && e.food_name !== "__calories_burned__"
    );
    const calByWeek = {};
    const countByWeek = {};
    myFood.forEach(e => {
      if (!e.date) return;
      const week = format(startOfWeek(parseISO(e.date), { weekStartsOn: 0 }), "yyyy-MM-dd");
      calByWeek[week] = (calByWeek[week] || 0) + (e.calories || 0);
      countByWeek[week] = countByWeek[week] || new Set();
      countByWeek[week].add(e.date);
    });

    // Weight entries by date
    const weightByDate = {};
    weightEntries.forEach(e => {
      if (e.created_by === userEmail || !e.created_by) {
        weightByDate[e.date] = e.weight_kg;
      }
    });

    // Merge: for each weight entry, find its week's avg calories
    const allWeights = [...weightEntries]
      .filter(e => !e.created_by || e.created_by === userEmail)
      .sort((a, b) => a.date.localeCompare(b.date));

    return allWeights.map(w => {
      const week = format(startOfWeek(parseISO(w.date), { weekStartsOn: 0 }), "yyyy-MM-dd");
      const days = countByWeek[week]?.size || 1;
      const avgCal = calByWeek[week] ? Math.round(calByWeek[week] / days) : null;
      return {
        date: w.date,
        label: format(parseISO(w.date), "d/M"),
        weight: w.weight_kg,
        avgCalories: avgCal,
        id: w.id,
      };
    });
  }, [weightEntries, foodEntries, userEmail]);

  const latestWeight = chartData.length > 0 ? chartData[chartData.length - 1].weight : null;
  const firstWeight = chartData.length > 0 ? chartData[0].weight : null;
  const totalChange = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : null;

  return (
    <div className="surface overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-[hsl(var(--tone-brown))]" />
          <span className="text-sm font-semibold">מעקב משקל</span>
          {latestWeight && (
            <span className="text-xs bg-[hsl(var(--tone-brown-bg))] text-[hsl(var(--tone-brown-fg))] rounded-full px-2 py-0.5 font-bold">
              {latestWeight} ק״ג
              {totalChange && (
                <span className={cn("mr-1", parseFloat(totalChange) <= 0 ? "text-primary" : "text-destructive")}>
                  ({parseFloat(totalChange) > 0 ? "+" : ""}{totalChange})
                </span>
              )}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-4">
          {/* Chart */}
          {chartData.length >= 2 && (
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="weight" orientation="right" domain={["auto", "auto"]} tick={{ fontSize: 10 }} unit="ק" />
                <YAxis yAxisId="cal" orientation="left" tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val, name) =>
                    name === "weight" ? [`${val} ק״ג`, "משקל"] : [`${val} קל׳`, "ממוצע קל׳ יומי"]
                  }
                />
                <Legend formatter={v => v === "weight" ? "משקל" : "ממוצע קל׳ יומי"} wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="cal" dataKey="avgCalories" fill="hsl(var(--chart-2))" opacity={0.4} radius={[3, 3, 0, 0]} name="avgCalories" />
                <Line yAxisId="weight" type="monotone" dataKey="weight" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} name="weight" />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {/* Entries list */}
          {chartData.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {[...chartData].reverse().map(w => (
                <div key={w.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(w.date), "d בMMMM yyyy", { locale: undefined })} — {w.date}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[hsl(var(--tone-brown-fg))]">{w.weight} ק״ג</span>
                    <ConfirmDialog title="למחוק את השקילה?" onConfirm={() => deleteEntry.mutate(w.id)}>
                      <button className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </ConfirmDialog>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add entry */}
          {adding ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={e => setNewEntry(p => ({ ...p, date: e.target.value }))}
                  className="flex-1 h-9 rounded-xl border border-input bg-transparent px-3 text-sm"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="ק״ג"
                  value={newEntry.weight_kg}
                  onChange={e => setNewEntry(p => ({ ...p, weight_kg: e.target.value }))}
                  className="w-24 h-9 rounded-xl border border-input bg-transparent px-3 text-sm text-center"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => createEntry.mutate({ ...newEntry, weight_kg: parseFloat(newEntry.weight_kg) })}
                  disabled={!newEntry.weight_kg}
                  className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  שמור
                </button>
                <button
                  onClick={() => setAdding(false)}
                  className="px-4 h-9 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setAdding(true)}
                className="flex-1 h-9 rounded-xl border border-dashed border-[hsl(var(--tone-brown-mid))] text-xs text-[hsl(var(--tone-brown))] font-medium flex items-center justify-center gap-1.5 hover:bg-[hsl(var(--tone-brown-bg))] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                הוסף שקילה
              </button>
              <button
                onClick={() => setShowBulk(!showBulk)}
                className="px-3 h-9 rounded-xl border border-dashed border-[hsl(var(--tone-brown-mid))] text-xs text-[hsl(var(--tone-brown))] flex items-center gap-1 hover:bg-[hsl(var(--tone-brown-bg))] transition-colors"
                title="ייבוא נתונים היסטוריים"
              >
                <Upload className="w-3.5 h-3.5" />
                ייבוא
              </button>
            </div>
          )}

          {/* Bulk import */}
          {showBulk && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">הכנס שורה לכל שקילה: <code className="bg-muted px-1 rounded">DD/MM/YYYY משקל</code></p>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                rows={6}
                placeholder={"01/01/2025 72.5\n08/01/2025 72.1\n15/01/2025 71.8"}
                className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm font-mono"
              />
              <div className="flex gap-2">
                <button
                  onClick={bulkImport}
                  disabled={!bulkText.trim()}
                  className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  ייבא
                </button>
                <button
                  onClick={() => setShowBulk(false)}
                  className="px-4 h-9 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}