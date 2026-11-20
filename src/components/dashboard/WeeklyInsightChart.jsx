import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import { format, startOfWeek, subWeeks } from "date-fns";

function getLast8Weeks() {
  return Array.from({ length: 8 }, (_, i) => {
    const d = subWeeks(new Date(), 7 - i);
    return format(startOfWeek(d, { weekStartsOn: 0 }), "yyyy-MM-dd");
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-xl p-3 text-xs space-y-1 shadow-lg">
      <p className="font-semibold text-foreground/80 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>
            {p.dataKey === "weight" ? `${p.value} ק״ג` : `${p.value} קק״ל`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function WeeklyInsightChart({ userEmail }) {
  const weeks = getLast8Weeks();

  const { data: foodEntries = [] } = useQuery({
    queryKey: ["food-entries-week-chart"],
    queryFn: () => base44.entities.FoodEntry.list("-created_date", 1000),
  });

  const { data: weightEntries = [] } = useQuery({
    queryKey: ["weight-entries-chart"],
    queryFn: () => base44.entities.WeightEntry.list("-date", 100),
  });

  const chartData = weeks.map((weekStart) => {
    const weekEnd = format(new Date(new Date(weekStart).getTime() + 6 * 86400000), "yyyy-MM-dd");

    const weekFood = foodEntries.filter(e =>
      e.date >= weekStart && e.date <= weekEnd &&
      e.food_name !== "__steps__" && e.food_name !== "__calories_burned__" &&
      (!userEmail || e.created_by === userEmail)
    );

    const daysWithEntries = new Set(weekFood.map(e => e.date)).size;
    const totalCal = weekFood.reduce((s, e) => s + (e.calories || 0), 0);
    const avgCal = daysWithEntries > 0 ? Math.round(totalCal / daysWithEntries) : null;

    const weekWeights = weightEntries.filter(e =>
      e.date >= weekStart && e.date <= weekEnd &&
      (!userEmail || e.created_by === userEmail)
    );
    const avgWeight = weekWeights.length > 0
      ? Math.round((weekWeights.reduce((s, e) => s + e.weight_kg, 0) / weekWeights.length) * 10) / 10
      : null;

    const d = new Date(weekStart + "T12:00:00");
    return {
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      avgCalories: avgCal,
      weight: avgWeight,
    };
  });

  const hasData = chartData.some(d => d.avgCalories || d.weight);

  return (
    <div className="surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-widest text-muted-foreground uppercase">סיכום שבועי</p>
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "hsl(var(--chart-2))" }} />
            קלוריות
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 rounded-full inline-block" style={{ background: "hsl(var(--chart-4))" }} />
            משקל
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
          אין נתונים לשבועות האחרונים
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="cal"
              orientation="left"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              domain={[1000, 2000]}
            />
            <YAxis
              yAxisId="weight"
              orientation="right"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="cal"
              dataKey="avgCalories"
              name="ממוצע קל׳ יומי"
              fill="hsl(var(--chart-2))"
              opacity={0.5}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Line
              yAxisId="weight"
              dataKey="weight"
              name="משקל"
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-4))", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}