import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const MONTH_NAMES = ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני", "יולי", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳"];

export default function YearlyIncomeChart({ entries }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Build monthly data for Jan → current month
  const monthlyData = Array.from({ length: currentMonth + 1 }, (_, i) => ({
    month: MONTH_NAMES[i],
    monthIndex: i,
    total: 0,
  }));

  entries.forEach(e => {
    const d = new Date(e.date);
    if (d.getFullYear() !== currentYear) return;
    const m = d.getMonth();
    if (m <= currentMonth) {
      monthlyData[m].total += e.total_earned || 0;
    }
  });

  const yearlyTotal = monthlyData.reduce((s, m) => s + m.total, 0);

  if (monthlyData.every(m => m.total === 0)) return null;

  return (
    <div className="surface p-4 space-y-4">
      <h4 className="text-xs font-semibold text-muted-foreground">הכנסות לפי חודש — {currentYear}</h4>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₪${(v/1000).toFixed(0)}K`} />
          <Tooltip
            formatter={(v) => [`₪${v.toLocaleString()}`, "הכנסה"]}
            contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {monthlyData.map((m) => (
              <Cell
                key={m.monthIndex}
                fill={m.monthIndex === currentMonth ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Yearly total */}
      <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
        <p className="text-xs text-muted-foreground">סה״כ הכנסות {currentYear}</p>
        <p className="text-lg font-bold text-primary">₪{yearlyTotal.toLocaleString()}</p>
      </div>
    </div>
  );
}