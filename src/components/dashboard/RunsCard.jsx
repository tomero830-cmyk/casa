import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { runStats, formatPace } from "@/lib/runs";
import { parseDateStr, todayStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Outdoor runs from the watch: this week's distance vs last week, last run and pace. Hidden without runs. */
export default function RunsCard({ userEmail }) {
  const { data: runs = [] } = useQuery({
    queryKey: ["health-workouts", "outdoor_run", userEmail],
    queryFn: () => base44.entities.HealthWorkout.filter({ created_by: userEmail, workout_type: "outdoor_run" }, "-date", 100),
    enabled: !!userEmail,
    retry: false,
  });

  const today = todayStr();
  const stats = useMemo(() => runStats(runs, today), [runs, today]);
  if (!stats) return null;

  const diff = Math.round((stats.weekKm - stats.prevWeekKm) * 10) / 10;
  const last = stats.last;
  const lastLabel = last.date === today ? "היום" : parseDateStr(last.date).toLocaleDateString("he-IL", { weekday: "long" });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
          <Activity className="w-4 h-4" />
        </div>
        <span className="text-xs text-muted-foreground">ריצות</span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] text-muted-foreground">השבוע</p>
          <p className="text-3xl font-semibold tabular leading-none mt-1">
            {stats.weekKm}<span className="text-sm font-normal text-muted-foreground mr-1">ק״מ</span>
          </p>
        </div>
        {stats.prevWeekKm > 0 && (
          <p className={cn("text-xs font-medium flex items-center gap-1", diff >= 0 ? "text-primary" : "text-muted-foreground")}>
            {diff >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {diff >= 0 ? "+" : ""}{diff} מהשבוע שעבר
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-muted/60 py-2">
          <p className="text-[10px] text-muted-foreground">ריצה אחרונה · {lastLabel}</p>
          <p className="text-sm font-semibold tabular mt-0.5">{Number(last.distance_km) || 0} ק״מ</p>
        </div>
        <div className="rounded-2xl bg-muted/60 py-2">
          <p className="text-[10px] text-muted-foreground">קצב אחרון</p>
          <p className="text-sm font-semibold tabular mt-0.5" dir="ltr">{formatPace(stats.lastPace)}</p>
        </div>
        <div className="rounded-2xl bg-muted/60 py-2">
          <p className="text-[10px] text-muted-foreground">קצב ממוצע</p>
          <p className="text-sm font-semibold tabular mt-0.5" dir="ltr">{formatPace(stats.avgPace)}</p>
        </div>
      </div>
    </motion.div>
  );
}
