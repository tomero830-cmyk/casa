import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const shiftLabels = {
  morning: "בוקר",
  afternoon: "צהריים",
  evening: "ערב",
};

export default function IncomeChart({ entries }) {
  // Group by shift type
  const byShift = {};
  entries.forEach(e => {
    const key = e.shift_type || "other";
    if (!byShift[key]) byShift[key] = { shift: shiftLabels[key] || key, total: 0, count: 0 };
    byShift[key].total += e.total_earned || 0;
    byShift[key].count += 1;
  });

  const data = Object.values(byShift);

  if (data.length === 0) return null;

  return (
    <div className="p-4 surface">
      <h4 className="text-xs font-semibold text-muted-foreground mb-4">הכנסה לפי סוג משמרת</h4>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="shift" tick={{ fontSize: 11 }} width={50} />
          <Tooltip
            formatter={(v) => [`₪${v.toLocaleString()}`, "הכנסה"]}
            contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
          />
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}