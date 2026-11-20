import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Flame, Pencil, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { weeklyGoalSummary, DEFAULT_WEEKLY_TARGET } from "@/lib/weeklyGoal";
import { todayStr } from "@/lib/dates";
import { notifyError } from "@/lib/notify";

const KIND = "weekly_sessions";

/** Shared weekly goal: workout days of both partners together vs a household target. */
export default function SharedGoalCard() {
  const { user } = useAuth();
  const me = (user?.email || "").toLowerCase();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // All household rows (not filtered by user): the goal is shared
  const { data: gymSets = [] } = useQuery({ queryKey: ["gym-sets-household"], queryFn: () => base44.entities.GymSet.list("-date", 600), retry: false });
  const { data: watchWorkouts = [] } = useQuery({ queryKey: ["health-workouts-household"], queryFn: () => base44.entities.HealthWorkout.list("-date", 300), retry: false });
  const { data: plannedWorkouts = [] } = useQuery({ queryKey: ["workouts"], queryFn: () => base44.entities.Workout.list("-date", 500) });
  const { data: goals = [] } = useQuery({ queryKey: ["household-goal"], queryFn: () => base44.entities.HouseholdGoal.filter({ kind: KIND }, "-updated_date", 1), retry: false });

  const goal = goals[0];
  const target = Number(goal?.target) || DEFAULT_WEEKLY_TARGET;
  const today = todayStr();
  const summary = useMemo(
    () => weeklyGoalSummary({ gymSets, watchWorkouts, plannedWorkouts }, today, target),
    [gymSets, watchWorkouts, plannedWorkouts, today, target]
  );

  const saveTarget = useMutation({
    mutationFn: (value) => (goal ? base44.entities.HouseholdGoal.update(goal.id, { target: value }) : base44.entities.HouseholdGoal.create({ kind: KIND, target: value })),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["household-goal"] }); setEditing(false); },
    onError: (err) => notifyError(err, "שמירת היעד נכשלה"),
  });

  const mine = summary.perPerson[me] || 0;
  const partner = summary.total - mine;
  const width = (n) => `${Math.min(100, (n / target) * 100)}%`;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-xs text-muted-foreground">המטרה המשותפת של השבוע</span>
        </div>
        {summary.streak > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--tone-brown-fg))] bg-[hsl(var(--tone-brown-bg))] rounded-full px-2 py-0.5">
            <Flame className="w-3 h-3" /> {summary.streak} שבועות ברצף
          </span>
        )}
      </div>

      <div className="flex items-end justify-between">
        <p className="text-3xl font-semibold tabular leading-none">
          {summary.total}
          <span className="text-base font-normal text-muted-foreground"> / </span>
          {editing ? (
            <span className="inline-flex items-center gap-1 align-middle">
              <input
                autoFocus type="number" inputMode="numeric" value={draft}
                onChange={e => setDraft(e.target.value)}
                className="w-14 h-8 rounded-xl bg-muted text-center text-base outline-none"
              />
              <button onClick={() => { const v = parseInt(draft, 10); if (v > 0 && v < 50) saveTarget.mutate(v); }} className="w-8 h-8 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center" aria-label="שמירת יעד">
                <Check className="w-4 h-4" />
              </button>
            </span>
          ) : (
            <button onClick={() => { setDraft(String(target)); setEditing(true); }} className="inline-flex items-center gap-1 text-base font-normal text-muted-foreground">
              {target} <Pencil className="w-3 h-3" />
            </button>
          )}
        </p>
        <p className="text-xs font-medium text-muted-foreground">
          {summary.reached ? "עמדתם במטרה! 🎉" : `עוד ${summary.remaining} אימונים ביחד`}
        </p>
      </div>

      {/* Stacked progress: me + partner */}
      <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
        <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: width(mine) }} transition={{ duration: 0.8 }} />
        <motion.div className="h-full bg-[hsl(var(--tone-terra))]" initial={{ width: 0 }} animate={{ width: width(partner) }} transition={{ duration: 0.8, delay: 0.1 }} />
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> אני · {mine}</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[hsl(var(--tone-terra))]" /> בן/בת הזוג · {partner}</span>
      </div>
    </motion.div>
  );
}
