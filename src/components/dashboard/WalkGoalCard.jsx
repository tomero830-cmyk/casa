import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Footprints, Target, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { walkStats, GOAL_BOOST } from "@/lib/walks";
import { parseDateStr, todayStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Indoor-walk goal: average walking time from Apple Watch "Indoor Walk" workouts and a goal
 * 10% longer. Shown only to a user who has synced walks.
 */
export default function WalkGoalCard({ userEmail }) {
  const { data: walks = [] } = useQuery({
    queryKey: ["health-workouts", "indoor_walk", userEmail],
    queryFn: () => base44.entities.HealthWorkout.filter({ created_by: userEmail, workout_type: "indoor_walk" }, "-date", 100),
    enabled: !!userEmail,
    retry: false, // the entity may not exist yet; just hide the card
  });

  const stats = useMemo(() => walkStats(walks), [walks]);
  if (!stats || !stats.goalMinutes) return null;

  const last = stats.last;
  const lastMinutes = Math.round(Number(last.duration_min) || 0);
  const pct = Math.min(1, stats.lastVsGoalMinutes || 0);
  const reached = (stats.lastVsGoalMinutes || 0) >= 1;
  const isToday = last.date === todayStr();
  const lastLabel = isToday ? "היום" : parseDateStr(last.date).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "numeric" });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
            <Footprints className="w-4 h-4" />
          </div>
          <span className="text-xs text-muted-foreground">הליכה בפנים</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Target className="w-3.5 h-3.5" /> יעד {stats.goalMinutes} דק׳
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] text-muted-foreground">הליכה אחרונה · {lastLabel}</p>
          <p className="text-3xl font-semibold tabular leading-none mt-1">
            {lastMinutes}<span className="text-sm font-normal text-muted-foreground mr-1">דקות</span>
          </p>
        </div>
        <p className={cn("text-xs font-medium flex items-center gap-1", reached ? "text-primary" : "text-muted-foreground")}>
          {reached ? <><Check className="w-3.5 h-3.5" /> עמדת ביעד</> : `עוד ${Math.max(1, stats.goalMinutes - lastMinutes)} דק׳ ליעד`}
        </p>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(4, pct * 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>ממוצע {stats.avgMinutes} דק׳ · היעד {Math.round((GOAL_BOOST - 1) * 100)}% יותר</span>
        {Number(last.steps) > 0 && <span className="tabular">{Number(last.steps).toLocaleString()} צעדים{stats.lastCadence ? ` · ${stats.lastCadence} לדקה` : ""}</span>}
      </div>
    </motion.div>
  );
}
