import { useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { todayStr } from "@/lib/dates";


const DAYS_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const MONTHS_HE = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

const START_YEAR = 2026;
const START_MONTH = 0; // January

function MonthGrid({ year, month, caloriesByDate, burnedByDate, goalCalories, today }) {
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = (day) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDOW = new Date(year, month, 1).getDay(); // 0=Sun

  return (
    <div className="mb-4">
      {/* Month title */}
      <p className="text-xs font-semibold text-muted-foreground px-1 mb-1.5">
        {MONTHS_HE[month]} {year}
      </p>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_HE.map((d, i) => (
          <div key={i} className="text-center text-[9px] text-muted-foreground/60 font-medium">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDOW }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const ds = dateStr(day);
          const isToday = ds === today;
          const isFuture = ds > today;
          const cals = caloriesByDate[ds];
          const burned = burnedByDate[ds] || 0;
          const hasConsumed = cals != null;
          const hasDeficit = hasConsumed && burned > 0 && cals < burned;
          const isSurplus = hasConsumed && burned > 0 && cals >= burned;
          const isOver = hasConsumed && cals > goalCalories;
          const isUnder = hasConsumed && cals <= goalCalories && burned === 0;

          return (
            <div
              key={day}
              className={cn(
                "flex flex-col items-center justify-start rounded-lg py-1 px-0.5 min-h-[44px] transition-all",
                isToday && "ring-1 ring-primary",
                hasDeficit && !isToday && "bg-primary/10",
                isSurplus && !isToday && "bg-destructive/8",
                isOver && !hasDeficit && !isSurplus && !isToday && "bg-destructive/5",
                isUnder && !isToday && "bg-primary/5",
                isFuture && "opacity-25",
              )}
            >
              <span className={cn(
                "text-[10px] font-semibold leading-none mb-0.5",
                isToday ? "text-primary" : "text-foreground/75"
              )}>
                {day}
              </span>
              {hasConsumed && !isFuture ? (
                <span className={cn(
                  "text-[8px] font-bold leading-none",
                  hasDeficit ? "text-primary" : isOver ? "text-destructive" : "text-muted-foreground"
                )}>
                  {cals >= 1000 ? `${(cals / 1000).toFixed(1)}K` : cals}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CalorieCalendar({ userEmail, goalCalories = 1400 }) {
  const today = todayStr();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const scrollRef = useRef(null);

  // Fetch all food entries
  const { data: allEntries = [] } = useQuery({
    queryKey: ["food-entries-all-stats", userEmail],
    queryFn: () => base44.entities.FoodEntry.filter({ created_by: userEmail }, "-created_date", 1000),
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Build per-day consumed calories
  const caloriesByDate = useMemo(() => {
    const INTERNAL = ["__steps__", "__calories_burned__"];
    const map = {};
    allEntries
      .filter(e => e.created_by === userEmail && !INTERNAL.includes(e.food_name))
      .forEach(e => { if (e.date) map[e.date] = (map[e.date] || 0) + (e.calories || 0); });
    return map;
  }, [allEntries, userEmail]);

  // Build per-day burned calories
  const burnedByDate = useMemo(() => {
    const map = {};
    allEntries
      .filter(e => e.created_by === userEmail && e.food_name === "__calories_burned__")
      .forEach(e => { if (e.date) map[e.date] = (e.calories || 0); });
    return map;
  }, [allEntries, userEmail]);

  // Generate list of months from Jan 2026 to current month
  const months = useMemo(() => {
    const result = [];
    let y = START_YEAR, m = START_MONTH;
    while (y < currentYear || (y === currentYear && m <= currentMonth)) {
      result.push({ year: y, month: m });
      m++;
      if (m > 11) { m = 0; y++; }
    }
    return result;
  }, [currentYear, currentMonth]);

  // Scroll to bottom (current month) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // Summary stats
  const { deficitDays, surplusDays, totalDays } = useMemo(() => {
    let deficitDays = 0, surplusDays = 0, totalDays = 0;
    Object.keys(caloriesByDate).forEach(d => {
      if (d >= today) return;
      const burned = burnedByDate[d] || 0;
      if (burned === 0) return;
      totalDays++;
      if (caloriesByDate[d] < burned) deficitDays++;
      else surplusDays++;
    });
    return { deficitDays, surplusDays, totalDays };
  }, [caloriesByDate, burnedByDate, today]);

  return (
    <div className="surface overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-border/20">
        <p className="text-sm font-semibold">לוח שנה 2026</p>
        {totalDays > 0 && (
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-primary font-medium">✓ גירעון: {deficitDays} ימים</span>
            <span className="text-[10px] text-destructive font-medium">✗ עודף: {surplusDays} ימים</span>
          </div>
        )}
      </div>

      {/* Scrollable months */}
      <div ref={scrollRef} className="overflow-y-auto max-h-[70vh] p-3">
        {months.map(({ year, month }) => (
          <MonthGrid
            key={`${year}-${month}`}
            year={year}
            month={month}
            caloriesByDate={caloriesByDate}
            burnedByDate={burnedByDate}
            goalCalories={goalCalories}
            today={today}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 border-t border-border/20">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[9px] text-muted-foreground">גירעון (צרכת פחות משרפת)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-destructive" />
          <span className="text-[9px] text-muted-foreground">עודף</span>
        </div>
      </div>
    </div>
  );
}