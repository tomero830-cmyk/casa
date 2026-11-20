import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Trophy, Dumbbell, BarChart3 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { exerciseSessions, personalRecords, summarizeSets } from "@/lib/gym";
import { parseDateStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

const METRICS = {
  best1RM: { label: "כוח משוער (1RM)", unit: "ק״ג" },
  topWeight: { label: "משקל מקסימלי", unit: "ק״ג" },
  volume: { label: "נפח (משקל × חזרות)", unit: "ק״ג" },
};

const shortDate = (d) => parseDateStr(d).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });

function Record({ icon: Icon, label, value, date }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="text-xl font-semibold tabular mt-1">{value}</p>
      {date && <p className="text-[10px] text-muted-foreground mt-0.5">{shortDate(date)}</p>}
    </div>
  );
}

/** Records and progress chart for one exercise. */
export default function ExerciseProgress({ exercise, allSets, onClose }) {
  const [metric, setMetric] = useState("best1RM");
  const sessions = useMemo(() => (exercise ? exerciseSessions(allSets, exercise) : []), [allSets, exercise]);
  const records = useMemo(() => (exercise ? personalRecords(allSets, exercise) : null), [allSets, exercise]);
  const data = sessions.map(s => ({ date: s.date, label: shortDate(s.date), value: Math.round(s[metric] * 10) / 10 }));

  return (
    <Sheet open={!!exercise} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-right">{exercise}</SheetTitle>
        </SheetHeader>

        {!records ? (
          <p className="text-sm text-muted-foreground py-6 text-center">אין עדיין נתונים לתרגיל הזה.</p>
        ) : (
          <div className="space-y-4 pb-6">
            <div className="grid grid-cols-3 gap-2">
              <Record icon={Trophy} label="1RM משוער" value={`${records.best1RM.value}`} date={records.best1RM.date} />
              <Record icon={Dumbbell} label="הכי כבד" value={`${records.heaviest.value}`} date={records.heaviest.date} />
              <Record icon={BarChart3} label="אימונים" value={records.sessions} />
            </div>

            {/* Metric switch */}
            <div className="flex gap-1 p-1 bg-muted rounded-full">
              {Object.entries(METRICS).map(([key, m]) => (
                <button
                  key={key}
                  onClick={() => setMetric(key)}
                  className={cn("flex-1 py-1.5 rounded-full text-[11px] font-medium transition-colors", metric === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {data.length >= 2 ? (
              <div className="h-48 -mx-2" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v) => [`${v} ${METRICS[metric].unit}`, METRICS[metric].label]}
                      contentStyle={{ borderRadius: 16, border: "none", background: "hsl(var(--card))", boxShadow: "var(--card-shadow)", fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">הגרף יופיע אחרי שני אימונים בתרגיל הזה.</p>
            )}

            {/* History */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">היסטוריה</p>
              {[...sessions].reverse().slice(0, 12).map(s => (
                <div key={s.date} className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground text-xs">{shortDate(s.date)}</span>
                  <span className="tabular text-xs">{summarizeSets(s.sets)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
