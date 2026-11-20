import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function DailyNutritionSummary({ totalCalories, totalProtein, totalCarbs, totalFat, goalCalories }) {
  const pct = Math.min(100, Math.round((totalCalories / goalCalories) * 100));
  const remaining = Math.max(0, goalCalories - totalCalories);
  const over = totalCalories > goalCalories ? totalCalories - goalCalories : 0;

  const ringData = [
    { value: pct },
    { value: 100 - pct },
  ];

  const macros = [
    { label: "חלבון", value: totalProtein, color: "#2F6A4C", unit: "ג׳" },
    { label: "פחמימות", value: totalCarbs, color: "#B5803A", unit: "ג׳" },
    { label: "שומן", value: totalFat, color: "#A8553A", unit: "ג׳" },
  ];

  return (
    <div className="p-4 surface space-y-4">
      <div className="flex items-center gap-4">
        {/* Ring */}
        <div className="relative w-24 h-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ringData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={42}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill="hsl(var(--primary))" />
                <Cell fill="hsl(var(--muted))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold leading-none">{pct}%</span>
            <span className="text-[9px] text-muted-foreground">יעד</span>
          </div>
        </div>

        {/* Calories summary */}
        <div className="flex-1 space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{totalCalories.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">קק״ל</span>
          </div>
          {over > 0 ? (
            <p className="text-xs font-medium text-destructive">חריגה של {over} קק״ל</p>
          ) : (
            <p className="text-xs text-muted-foreground">נותרו <span className="font-semibold text-foreground">{remaining}</span> קק״ל מתוך {goalCalories}</p>
          )}
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, pct)}%`,
                backgroundColor: over > 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))"
              }}
            />
          </div>
        </div>
      </div>

      {/* Macros row */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50">
        {macros.map(m => (
          <div key={m.label} className="text-center">
            <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: m.color }} />
            <p className="text-sm font-bold">{Math.round(m.value)}{m.unit}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}