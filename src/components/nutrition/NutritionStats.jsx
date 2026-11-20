import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Flame, Beef, Zap, Calendar, PartyPopper, Plus, X, ChevronDown, ChevronUp, ArrowDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { todayStr } from "@/lib/dates";

const EVENT_TYPE_LABELS = {
  restaurant: "🍽️ מסעדה",
  holiday: "🕎 חג",
  wedding: "💍 חתונה",
  family: "👨‍👩‍👧 אירוע משפחתי",
  other: "🎉 אחר",
};

function StatCard({ icon: Icon, label, value, sub, color = "text-primary" }) {
  return (
    <div className="surface p-3 text-center">
      <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} />
      <p className={cn("text-lg font-bold leading-tight", color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}


export default function NutritionStats({ userEmail, goalCalories = 1400 }) {
  const [showEvents, setShowEvents] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ date: todayStr(), event_type: "other", description: "" });
  const queryClient = useQueryClient();

  // Fetch all food entries for this user
  const { data: allEntries = [] } = useQuery({
    queryKey: ["food-entries-all-stats", userEmail],
    queryFn: () => base44.entities.FoodEntry.filter({ created_by: userEmail }, "-created_date", 1000),
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: eventDays = [] } = useQuery({
    queryKey: ["event-days", userEmail],
    queryFn: () => base44.entities.EventDay.list("-date", 200),
    enabled: !!userEmail,
  });

  const createEvent = useMutation({
    mutationFn: (data) => base44.entities.EventDay.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-days", userEmail] });
      setAddingEvent(false);
      setNewEvent({ date: todayStr(), event_type: "other", description: "" });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: (id) => base44.entities.EventDay.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-days", userEmail] }),
  });

  // Fetch burned calories entries
  const { data: burnedEntries = [] } = useQuery({
    queryKey: ["burned-entries-stats", userEmail],
    queryFn: () => base44.entities.FoodEntry.filter({ created_by: userEmail, food_name: "__calories_burned__" }, "-date", 200),
    enabled: !!userEmail,
  });

  const stats = useMemo(() => {
    const INTERNAL = ["__steps__", "__calories_burned__"];
    const myEntries = allEntries.filter(e => e.created_by === userEmail && !INTERNAL.includes(e.food_name));

    // Group by date
    const byDate = {};
    myEntries.forEach(e => {
      if (!e.date) return;
      if (!byDate[e.date]) byDate[e.date] = { calories: 0, protein: 0 };
      byDate[e.date].calories += e.calories || 0;
      byDate[e.date].protein += e.protein || 0;
    });

    const today = todayStr();
    const eventDates = new Set(eventDays.map(e => e.date));
    const pastDates = Object.keys(byDate).filter(d => d < today);
    const nonEventDates = pastDates.filter(d => !eventDates.has(d));
    const totalDays = pastDates.length;

    const avgCalories = totalDays > 0
      ? Math.round(pastDates.reduce((s, d) => s + byDate[d].calories, 0) / totalDays)
      : 0;

    const avgProtein = totalDays > 0
      ? Math.round(pastDates.reduce((s, d) => s + byDate[d].protein, 0) / totalDays)
      : 0;

    const MAX_CAL = goalCalories;
    const daysInRange = nonEventDates.filter(d => byDate[d].calories <= MAX_CAL).length;
    const nonEventTotal = nonEventDates.length;
    const daysOver = nonEventDates.filter(d => byDate[d].calories > MAX_CAL).length;
    const daysNotInRange = nonEventTotal - daysInRange;

    // Per-day breakdown for calories
    const calDaysInRange = pastDates.filter(d => byDate[d].calories <= MAX_CAL).length;
    const calDaysPct = totalDays > 0 ? Math.round((calDaysInRange / totalDays) * 100) : 0;

    // Protein goal: 100g
    const PROTEIN_GOAL = 100;
    const proteinDaysInRange = pastDates.filter(d => byDate[d].protein >= PROTEIN_GOAL).length;
    const proteinDaysPct = totalDays > 0 ? Math.round((proteinDaysInRange / totalDays) * 100) : 0;

    return { avgCalories, avgProtein, daysInRange, nonEventTotal, totalDays, eventCount: eventDays.length, daysOver, daysNotInRange, calDaysInRange, calDaysPct, proteinDaysInRange, proteinDaysPct };
  }, [allEntries, userEmail, eventDays]);

  // Caloric deficit streak: consecutive past days where consumed < burned
  const deficitStreak = useMemo(() => {
    const today = todayStr();
    const INTERNAL = ["__steps__", "__calories_burned__"];

    // Build consumed per date
    const consumed = {};
    allEntries
      .filter(e => !INTERNAL.includes(e.food_name))
      .forEach(e => { if (e.date) consumed[e.date] = (consumed[e.date] || 0) + (e.calories || 0); });

    // Build burned per date
    const burned = {};
    burnedEntries.forEach(e => { if (e.date) burned[e.date] = (e.calories || 0); });

    // Get all past dates that have consumed data
    const dates = Object.keys(consumed).filter(d => d < today).sort().reverse();

    let streak = 0;
    for (const d of dates) {
      const b = burned[d] || 0;
      const c = consumed[d] || 0;
      if (b > 0 && c < b) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [allEntries, burnedEntries]);

  const avgBurned = useMemo(() => {
    const today = todayStr();
    const pastBurned = burnedEntries.filter(e => e.created_by === userEmail && e.date < today && (e.calories || 0) > 0);
    if (!pastBurned.length) return 0;
    const total = pastBurned.reduce((s, e) => s + (e.calories || 0), 0);
    return Math.round(total / pastBurned.length);
  }, [burnedEntries, userEmail]);

  const { data: weightEntries = [] } = useQuery({
    queryKey: ["weight-entries", userEmail],
    queryFn: () => base44.entities.WeightEntry.list("-date", 200),
    enabled: !!userEmail,
  });

  const avgMonthlyLoss = useMemo(() => {
    const sorted = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length < 2) return null;
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const diffKg = first.weight_kg - last.weight_kg;
    if (diffKg <= 0) return null;
    const diffDays = (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24);
    if (diffDays < 7) return null;
    return parseFloat(((diffKg / diffDays) * 30).toFixed(2));
  }, [weightEntries]);

  const avgDailyDeficit = useMemo(() => {
    const today = todayStr();
    const INTERNAL = ["__steps__", "__calories_burned__"];
    const consumed = {};
    allEntries
      .filter(e => e.created_by === userEmail && !INTERNAL.includes(e.food_name) && e.date < today)
      .forEach(e => { if (e.date) consumed[e.date] = (consumed[e.date] || 0) + (e.calories || 0); });
    const burned = {};
    burnedEntries.filter(e => e.date < today).forEach(e => { if (e.date) burned[e.date] = (e.calories || 0); });
    const deficitDays = Object.keys(consumed).filter(d => (burned[d] || 0) > 0 && consumed[d] < burned[d]);
    if (!deficitDays.length) return 0;
    return Math.round(deficitDays.reduce((s, d) => s + (burned[d] - consumed[d]), 0) / deficitDays.length);
  }, [allEntries, burnedEntries, userEmail]);

  return (
    <div className="space-y-3">
      {/* Stats cards */}
      {/* Big avg calories card */}
      <div className="surface px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="w-4 h-4 text-[hsl(var(--tone-gold))]" />
              <p className="text-xs text-muted-foreground">ממוצע קלוריות יומי</p>
            </div>
            <p className="text-4xl font-bold text-[hsl(var(--tone-gold))] leading-none">{stats.avgCalories.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-1">קלוריות • {stats.totalDays} ימי מעקב</p>
          </div>
          <div className="text-left text-xs text-muted-foreground space-y-1">
            <p>יעד: {goalCalories.toLocaleString()} קל׳</p>
            <p className={cn("font-semibold", stats.avgCalories <= goalCalories ? "text-primary" : "text-destructive")}>
              {stats.avgCalories <= goalCalories
                ? `${goalCalories - stats.avgCalories} מתחת ליעד`
                : `${stats.avgCalories - goalCalories} מעל היעד`}
            </p>
          </div>
        </div>
        {stats.totalDays > 0 && (
        <div className="flex items-center justify-between text-xs bg-muted/40 rounded-xl px-3 py-2">
          <span className="text-muted-foreground">ימים עד {goalCalories.toLocaleString()} קל׳</span>
          <span className="font-bold text-primary">{stats.calDaysPct}% <span className="text-muted-foreground font-normal">({stats.calDaysInRange}/{stats.totalDays})</span></span>
        </div>
        )}
      </div>

      {/* Total days tracked bar */}
      {stats.totalDays > 0 && (
        <div className="surface px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              ימים עד {goalCalories.toLocaleString()} קל׳ מסך הכל
            </span>
            <span className="font-bold text-primary text-sm">
              {Math.round((stats.daysInRange / stats.totalDays) * 100)}%
              <span className="text-muted-foreground font-normal"> ({stats.daysInRange}/{stats.totalDays} ימים)</span>
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.round((stats.daysInRange / stats.totalDays) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">כולל {stats.eventCount} ימי אירוע מתוך {stats.totalDays} ימי מעקב</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={Beef} label="ממוצע חלבון יומי" value={`${stats.avgProtein}ג'`} sub={stats.totalDays > 0 ? `${stats.proteinDaysPct}% הגיעו ל-100ג׳ (${stats.proteinDaysInRange}/${stats.totalDays})` : undefined} color="text-primary" />
        <StatCard icon={Zap} label="ממוצע שריפת קלוריות יומי" value={avgBurned ? avgBurned.toLocaleString() : "—"} color="text-[hsl(var(--tone-gold))]" />
        <StatCard icon={Zap} label="ממוצע גירעון קלורי יומי" value={avgDailyDeficit > 0 ? `${avgDailyDeficit.toLocaleString()}` : "—"} sub="קק״ל בגירעון (ימי גירעון בלבד)" color="text-primary" />
        <StatCard icon={ArrowDown} label="ממוצע ירידה חודשי" value={avgMonthlyLoss ? `${avgMonthlyLoss} ק״ג` : "—"} sub="ממוצע לחודש מתחילת המעקב" color="text-[hsl(var(--tone-brown))]" />
        <StatCard
          icon={Flame}
          label={`ימים מתחת ל-${goalCalories.toLocaleString()} קל׳`}
          value={stats.nonEventTotal > 0 ? `${Math.round((stats.daysInRange / stats.nonEventTotal) * 100)}%` : "—"}
          sub={`${stats.daysInRange}/${stats.nonEventTotal} ללא אירועים`}
          color="text-primary"
        />
        <StatCard
          icon={Flame}
          label={`ימים מעל ${goalCalories.toLocaleString()} קל׳`}
          value={stats.totalDays > 0 ? `${Math.round(((stats.totalDays - stats.calDaysInRange) / stats.totalDays) * 100)}%` : "—"}
          sub={`${stats.totalDays - stats.calDaysInRange}/${stats.totalDays} ימים`}
          color="text-destructive"
        />
      </div>

      {/* Deficit streak */}
      <div className={cn(
        "rounded-2xl border px-4 py-3 flex items-center justify-between",
        deficitStreak >= 7 ? "bg-primary/5 border-primary/30" :
        deficitStreak >= 3 ? "bg-primary/10 border-primary/30" :
        "bg-card border-border/50"
      )}>
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center text-lg",
            deficitStreak >= 7 ? "bg-primary/10" :
            deficitStreak >= 3 ? "bg-primary/10" :
            "bg-muted"
          )}>
            🔥
          </div>
          <div>
            <p className="text-sm font-semibold">רצף בגירעון קלורי</p>
            <p className="text-[10px] text-muted-foreground">ימים רצופים שצרכת פחות ממה ששרפת</p>
          </div>
        </div>
        <div className="text-left">
          <p className={cn(
            "text-3xl font-bold leading-none",
            deficitStreak >= 7 ? "text-primary" :
            deficitStreak >= 3 ? "text-primary" :
            deficitStreak > 0 ? "text-foreground" :
            "text-muted-foreground"
          )}>{deficitStreak}</p>
          <p className="text-[10px] text-muted-foreground text-left">ימים</p>
        </div>
      </div>

      {/* Event days */}
      <div className="surface overflow-hidden">
        <button
          onClick={() => setShowEvents(!showEvents)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <PartyPopper className="w-4 h-4 text-[hsl(var(--tone-brown))]" />
            <span className="text-sm font-semibold">ימי אירוע</span>
            <span className="text-xs bg-[hsl(var(--tone-brown-bg))] text-[hsl(var(--tone-brown-fg))] rounded-full px-2 py-0.5 font-bold">{stats.eventCount}</span>
          </div>
          {showEvents ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showEvents && (
          <div className="border-t border-border/50 px-4 pb-4 space-y-3 pt-3">
            {/* Event list */}
            {eventDays.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">אין ימי אירוע עדיין</p>
            ) : (
              <div className="space-y-2">
                {[...eventDays].sort((a, b) => b.date.localeCompare(a.date)).map(ev => (
                  <div key={ev.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold">{EVENT_TYPE_LABELS[ev.event_type] || "🎉 אירוע"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(ev.date + "T12:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })}
                        {ev.description ? ` • ${ev.description}` : ""}
                      </p>
                    </div>
                    <button onClick={() => deleteEvent.mutate(ev.id)} className="p-1 hover:text-destructive transition-colors text-muted-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add event */}
            {addingEvent ? (
              <div className="space-y-2 pt-1">
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))}
                  className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setNewEvent(p => ({ ...p, event_type: k }))}
                      className={cn(
                        "py-2 px-2 rounded-xl text-xs font-medium border transition-colors",
                        newEvent.event_type === k
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent border-border text-muted-foreground hover:border-[hsl(var(--tone-brown-mid))]"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="תיאור קצר (לא חובה)"
                  value={newEvent.description}
                  onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                  className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => createEvent.mutate(newEvent)}
                    className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    שמור
                  </button>
                  <button
                    onClick={() => setAddingEvent(false)}
                    className="px-4 h-9 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingEvent(true)}
                className="w-full h-9 rounded-xl border border-dashed border-[hsl(var(--tone-brown-mid))] text-xs text-[hsl(var(--tone-brown))] font-medium flex items-center justify-center gap-1.5 hover:bg-[hsl(var(--tone-brown-bg))] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                הוסף יום אירוע
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}