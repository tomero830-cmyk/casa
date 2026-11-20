import { useState, useMemo } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { todayStr } from "@/lib/dates";

const DAYS_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const MONTHS_HE = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

const TYPE_DOT_COLORS = {
  coral: "bg-[hsl(var(--tone-terra))]",
  green: "bg-primary",
  blue: "bg-[hsl(var(--tone-sage))]",
  purple: "bg-[hsl(var(--tone-gold))]",
};


export default function WorkoutCalendar({ workouts, typeColors = {}, selectedDate, onSelectDate }) {
  const today = todayStr();
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

  const workoutsByDate = useMemo(() => {
    const map = {};
    workouts.forEach(w => {
      if (!map[w.date]) map[w.date] = [];
      map[w.date].push(w);
    });
    return map;
  }, [workouts]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDOW = new Date(viewYear, viewMonth, 1).getDay();

  const navigateMonth = (dir) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  return (
    <div className="surface overflow-hidden">
      {/* Month navigator */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <button onClick={() => navigateMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">
          <ChevronRight className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold">
          {MONTHS_HE[viewMonth]} {viewYear}
        </p>
        <button onClick={() => navigateMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-3 pt-2 pb-1">
        {DAYS_HE.map((d, i) => (
          <div key={i} className="text-center text-[9px] text-muted-foreground/60 font-medium">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5 p-2 pt-0">
        {Array.from({ length: firstDOW }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const ds = dateStr(viewYear, viewMonth, day);
          const isToday = ds === today;
          const isSelected = ds === selectedDate;
          const dayWorkouts = workoutsByDate[ds] || [];
          const isFuture = ds > today;

          return (
            <button
              key={day}
              onClick={() => onSelectDate(ds)}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg py-1.5 min-h-[42px] transition-all relative",
                isSelected && "bg-primary/15 ring-1 ring-primary/40",
                !isSelected && !isFuture && "hover:bg-muted/50",
                isFuture && !isSelected && "opacity-30"
              )}
            >
              <span className={cn(
                "text-[11px] font-semibold leading-none",
                isToday ? "text-primary" : isSelected ? "text-primary" : "text-foreground/75"
              )}>
                {day}
              </span>
              {dayWorkouts.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {dayWorkouts.slice(0, 3).map((w, idx) => {
                    const colorKey = typeColors[w.workout_type] || "coral";
                    return (
                      <div key={idx} className={cn("w-1.5 h-1.5 rounded-full", TYPE_DOT_COLORS[colorKey] || TYPE_DOT_COLORS.coral)} />
                    );
                  })}
                </div>
              )}
              {isToday && (
                <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}