import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { UtensilsCrossed, Footprints, Dumbbell, ShoppingCart, Scale, Flame, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { todayStr } from "@/lib/dates";

const INTERNAL = ["__steps__", "__calories_burned__"];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

function Widget({ to, icon: Icon, tone, label, children, className }) {
  return (
    <motion.div variants={item} className={className}>
      <Link
        to={to}
        className="surface h-full p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", tone)}>
            <Icon className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <div className="flex-1 flex flex-col justify-end">{children}</div>
      </Link>
    </motion.div>
  );
}

function Ring({ value, max, className }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 52 52" className={cn("w-12 h-12 -rotate-90", className)} aria-hidden="true">
      <circle cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="5" />
      <motion.circle
        cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - pct) }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function TodayWidgets({ userEmail, goalCalories = 1400 }) {
  const today = todayStr();

  const { data: todayEntries = [] } = useQuery({
    queryKey: ["food-entries", today, userEmail],
    queryFn: () => base44.entities.FoodEntry.filter({ date: today, created_by: userEmail }, "-created_date", 200),
    enabled: !!userEmail,
  });

  const { data: myFood = [] } = useQuery({
    queryKey: ["food-entries-all-stats", userEmail],
    queryFn: () => base44.entities.FoodEntry.filter({ created_by: userEmail }, "-created_date", 1000),
    enabled: !!userEmail,
  });

  const { data: workouts = [] } = useQuery({
    queryKey: ["workouts"],
    queryFn: () => base44.entities.Workout.list("-date", 500),
  });

  const { data: pendingItems = [] } = useQuery({
    queryKey: ["shopping-items", "pending"],
    queryFn: () => base44.entities.ShoppingItem.filter({ is_purchased: false }, "-created_date", 500),
  });

  const { data: weightEntries = [] } = useQuery({
    queryKey: ["weight-entries-all"],
    queryFn: () => base44.entities.WeightEntry.list("-date", 200),
  });

  const mine = todayEntries.filter(e => e.created_by === userEmail);
  const calories = mine.filter(e => !INTERNAL.includes(e.food_name)).reduce((s, e) => s + (e.calories || 0), 0);
  const steps = mine.find(e => e.food_name === "__steps__")?.steps ?? mine.find(e => e.steps)?.steps ?? 0;
  const burned = mine.find(e => e.food_name === "__calories_burned__")?.calories || 0;

  const todaysWorkouts = workouts.filter(w => w.date === today);
  const workoutDone = todaysWorkouts.length > 0 && todaysWorkouts.every(w => w.is_completed);

  // Own weights + legacy entries without an owner, oldest → newest
  const myWeights = useMemo(() => weightEntries
    .filter(e => e.date && (e.created_by === userEmail || !e.created_by))
    .sort((a, b) => a.date.localeCompare(b.date)), [weightEntries, userEmail]);
  const latestWeight = myWeights[myWeights.length - 1];
  const firstWeight = myWeights[0];
  const weightChange = latestWeight && firstWeight && firstWeight !== latestWeight
    ? Math.round((latestWeight.weight_kg - firstWeight.weight_kg) * 10) / 10
    : null;

  // Consecutive past days where consumed < burned
  const deficitStreak = useMemo(() => {
    const consumed = {};
    const burnedByDay = {};
    myFood.forEach(e => {
      if (!e.date || e.date >= today) return;
      if (e.food_name === "__calories_burned__") burnedByDay[e.date] = e.calories || 0;
      else if (!INTERNAL.includes(e.food_name)) consumed[e.date] = (consumed[e.date] || 0) + (e.calories || 0);
    });
    let streak = 0;
    for (const d of Object.keys(consumed).sort().reverse()) {
      if ((burnedByDay[d] || 0) > 0 && consumed[d] < burnedByDay[d]) streak++;
      else break;
    }
    return streak;
  }, [myFood, today]);

  const caloriesLeft = goalCalories - calories;
  const overGoal = caloriesLeft < -100;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
      {/* Calories: wide */}
      <Widget to="/nutrition" icon={UtensilsCrossed} tone="bg-accent text-accent-foreground" label="קלוריות היום" className="col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-semibold tabular leading-none">{calories.toLocaleString()}</p>
            <p className={cn("text-xs mt-1.5", overGoal ? "text-destructive" : "text-muted-foreground")}>
              {overGoal ? `${(-caloriesLeft).toLocaleString()} מעל היעד` : caloriesLeft >= 0 ? `נותרו ${caloriesLeft.toLocaleString()} מתוך ${goalCalories.toLocaleString()}` : "ביעד"}
              {burned > 0 && ` · נשרפו ${burned.toLocaleString()}`}
            </p>
          </div>
          <Ring value={calories} max={goalCalories} className={overGoal ? "text-destructive" : "text-primary"} />
        </div>
      </Widget>

      <Widget to="/nutrition" icon={Footprints} tone="bg-accent text-accent-foreground" label="צעדים">
        <p className="text-2xl font-semibold tabular leading-none">{steps ? steps.toLocaleString() : "—"}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{steps ? "מ-Apple Health" : "עוד לא סונכרן היום"}</p>
      </Widget>

      <Widget to="/workouts" icon={Dumbbell} tone="bg-[hsl(var(--tone-brown-bg))] text-[hsl(var(--tone-brown-fg))]" label="אימון היום">
        {todaysWorkouts.length === 0 ? (
          <>
            <p className="text-base font-medium leading-tight">יום מנוחה</p>
            <p className="text-[11px] text-muted-foreground mt-1">לחצו כדי לתכנן</p>
          </>
        ) : (
          <>
            <p className="text-base font-medium leading-tight truncate">{todaysWorkouts[0].workout_type}</p>
            <p className={cn("text-[11px] mt-1 flex items-center gap-1", workoutDone ? "text-primary" : "text-muted-foreground")}>
              {workoutDone ? <><Check className="w-3 h-3" /> בוצע</> : "ממתין"}
            </p>
          </>
        )}
      </Widget>

      <Widget to="/shopping" icon={ShoppingCart} tone="bg-accent text-accent-foreground" label="קניות">
        <p className="text-2xl font-semibold tabular leading-none">{pendingItems.length}</p>
        <p className="text-[11px] text-muted-foreground mt-1 truncate">
          {pendingItems.length ? pendingItems.slice(0, 3).map(i => i.name).join(", ") : "הרשימה ריקה"}
        </p>
      </Widget>

      <Widget to="/nutrition" icon={Scale} tone="bg-[hsl(var(--tone-brown-bg))] text-[hsl(var(--tone-brown-fg))]" label="משקל">
        <p className="text-2xl font-semibold tabular leading-none">{latestWeight ? latestWeight.weight_kg : "—"}</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {weightChange == null ? "ק״ג" : `${weightChange > 0 ? "+" : ""}${weightChange} ק״ג מההתחלה`}
        </p>
      </Widget>

      <Widget to="/nutrition" icon={Flame} tone="bg-[hsl(var(--tone-brown-bg))] text-[hsl(var(--tone-brown-fg))]" label="רצף גירעון" className="col-span-2">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold tabular leading-none">{deficitStreak}</p>
          <p className="text-xs text-muted-foreground">{deficitStreak === 1 ? "יום" : "ימים"} ברצף שבהם אכלת פחות ממה ששרפת</p>
        </div>
      </Widget>
    </motion.div>
  );
}
