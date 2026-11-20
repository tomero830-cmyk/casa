import { useAuth } from "@/lib/AuthContext";
import { HOUSEHOLD_NAME } from "@/lib/household";
import WeeklyInsightChart from "@/components/dashboard/WeeklyInsightChart";
import TodayWidgets from "@/components/dashboard/TodayWidgets";

export default function Dashboard() {
  const { user } = useAuth();
  const goalCalories = user?.calorie_goal || 1400;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : "ערב טוב";

  return (
    <div className="space-y-5">

      {/* Hero greeting: soft sage-to-sand card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(var(--hero-from))] to-[hsl(var(--hero-to))] text-foreground px-5 py-6 shadow-[var(--card-shadow)]">
        <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full border border-foreground/[0.06]" aria-hidden="true" />
        <div className="absolute -left-4 -top-4 w-24 h-24 rounded-full border border-foreground/[0.06]" aria-hidden="true" />
        <p className="text-xs tracking-widest text-muted-foreground mb-1">{greeting}</p>
        <h2 className="text-4xl tracking-tight">{HOUSEHOLD_NAME}</h2>
        <div className="mt-3 h-px w-12 bg-[hsl(var(--tone-brown))]/50" aria-hidden="true" />
        <p className="text-xs text-muted-foreground mt-3 tracking-wide">
          {now.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Today Summary */}
      <TodayWidgets userEmail={user?.email} goalCalories={goalCalories} />

      {/* Weekly Insight Chart */}
      <WeeklyInsightChart userEmail={user?.email} />

    </div>
  );
}
