import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Target, TrendingDown, TrendingUp, Pencil, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { forecastWeight } from "@/lib/weightForecast";
import { parseDateStr, todayStr } from "@/lib/dates";
import { notifyError } from "@/lib/notify";
import { cn } from "@/lib/utils";

const CONFIDENCE_LABEL = { high: "הערכה טובה", medium: "הערכה סבירה", low: "מעט נתונים, הערכה גסה" };

function GoalInput({ initial, onSave, onCancel }) {
  const [value, setValue] = useState(initial ? String(initial) : "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const goal = parseFloat(value);
    if (!Number.isFinite(goal) || goal < 30 || goal > 250) return;
    setSaving(true);
    try { await onSave(goal); } finally { setSaving(false); }
  };
  return (
    <div className="flex items-center gap-2">
      <input
        type="number" inputMode="decimal" step="0.1" autoFocus
        value={value} onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") onCancel?.(); }}
        placeholder="למשל 62"
        className="w-24 h-9 rounded-xl border border-border bg-background px-3 text-sm text-center tabular"
      />
      <span className="text-xs text-muted-foreground">ק״ג</span>
      <button onClick={save} disabled={saving} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">
        <Check className="w-4 h-4" />
      </button>
      {onCancel && (
        <button onClick={onCancel} className="w-8 h-8 rounded-full text-muted-foreground flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Weight-goal forecast. Shown in full only to a user who set `weight_goal`;
 * others see a small "set a goal" prompt.
 */
export default function WeightForecast({ userEmail }) {
  const { user, updateCurrentUser } = useAuth();
  const goal = user?.weight_goal;
  const [editing, setEditing] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const { data: weightEntries = [] } = useQuery({
    queryKey: ["weight-entries", userEmail],
    queryFn: () => base44.entities.WeightEntry.list("-date", 200),
    enabled: !!userEmail,
  });

  const mine = useMemo(
    () => weightEntries.filter(e => e.created_by === userEmail || !e.created_by),
    [weightEntries, userEmail]
  );

  const forecast = useMemo(() => (goal ? forecastWeight(mine, goal, { today: todayStr() }) : null), [mine, goal]);

  const saveGoal = async (value) => {
    try {
      await updateCurrentUser({ weight_goal: value });
      setEditing(false);
      setShowSetup(false);
    } catch (err) {
      notifyError(err, "שמירת היעד נכשלה");
    }
  };

  if (!goal) {
    return (
      <div className="surface px-4 py-3">
        {showSetup ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">משקל יעד</span>
            <GoalInput onSave={saveGoal} onCancel={() => setShowSetup(false)} />
          </div>
        ) : (
          <button onClick={() => setShowSetup(true)} className="w-full flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4" />
            הגדרת משקל יעד לקבלת תחזית
          </button>
        )}
      </div>
    );
  }

  const losing = goal < (forecast?.current ?? goal);
  // Progress from the first recorded weigh-in toward the goal
  const start = [...mine].sort((a, b) => a.date.localeCompare(b.date))[0]?.weight_kg;
  const progressPct = forecast && start != null && start !== goal
    ? Math.max(0, Math.min(100, ((start - forecast.current) / (start - goal)) * 100))
    : 0;
  const TrendIcon = losing ? TrendingDown : TrendingUp;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[hsl(var(--tone-brown-bg))] text-[hsl(var(--tone-brown-fg))] flex items-center justify-center">
            <Target className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <span className="text-sm font-semibold">תחזית משקל</span>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-muted-foreground">
            יעד {goal} ק״ג <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>

      {editing && <GoalInput initial={goal} onSave={saveGoal} onCancel={() => setEditing(false)} />}

      {!forecast ? (
        <p className="text-sm text-muted-foreground">צריך לפחות שתי שקילות כדי לחשב תחזית.</p>
      ) : forecast.status === "reached" ? (
        <p className="text-base font-medium text-primary">הגעת ליעד! 🎉</p>
      ) : forecast.status === "on_track" ? (
        <>
          <div>
            <p className="text-xs text-muted-foreground">בקצב הנוכחי, היעד של {goal} ק״ג צפוי בערך ב-</p>
            <p className="text-2xl font-semibold mt-0.5">
              {parseDateStr(forecast.etaDate).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className={cn("inline-flex items-center gap-1 font-medium", "text-primary")}>
              <TrendIcon className="w-3.5 h-3.5" />
              {Math.abs(forecast.kgPerWeek)} ק״ג בשבוע
            </span>
            <span className="text-muted-foreground">עוד {forecast.daysLeft} ימים</span>
            <span className="text-muted-foreground">· {CONFIDENCE_LABEL[forecast.confidence]}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(4, progressPct)}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {forecast.status === "flat"
            ? "המשקל יציב בשבועות האחרונים, אז אין עדיין תאריך משוער."
            : `המגמה בשבועות האחרונים היא ${losing ? "עלייה" : "ירידה"} (${Math.abs(forecast.kgPerWeek)} ק״ג בשבוע), אז אי אפשר לחזות תאריך.`}
        </p>
      )}
    </motion.div>
  );
}
