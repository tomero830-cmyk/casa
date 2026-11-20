import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Footprints } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { base44 } from "@/api/base44Client";
import { todayStr, addDaysStr, parseDateStr } from "@/lib/dates";
import { notify, notifyError } from "@/lib/notify";
import { cn } from "@/lib/utils";

/**
 * Quick manual log of an indoor walk (minutes, optional steps). Saved as a HealthWorkout row,
 * the same shape the watch sync uses, so goals, the widget and the shared goal pick it up.
 */
export default function WalkLogSheet({ open, onClose, defaultMinutes = 30 }) {
  const queryClient = useQueryClient();
  const [minutes, setMinutes] = useState(defaultMinutes);
  const [steps, setSteps] = useState("");
  const [date, setDate] = useState(todayStr());

  useEffect(() => {
    if (open) { setMinutes(defaultMinutes); setSteps(""); setDate(todayStr()); }
  }, [open, defaultMinutes]);

  const save = useMutation({
    mutationFn: () => base44.entities.HealthWorkout.create({
      date,
      workout_type: "indoor_walk",
      start_time: `manual-${Date.now()}`,
      duration_min: Number(minutes) || 0,
      steps: Number(steps) || 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-workouts"] });
      queryClient.invalidateQueries({ queryKey: ["health-workouts-household"] });
      notify(`נרשמה הליכה של ${minutes} דקות 👟`);
      onClose();
    },
    onError: (err) => notifyError(err, "שמירת ההליכה נכשלה"),
  });

  const days = [0, 1, 2].map(n => addDaysStr(todayStr(), -n));
  const dayLabel = (d, i) => (i === 0 ? "היום" : i === 1 ? "אתמול" : parseDateStr(d).toLocaleDateString("he-IL", { weekday: "long" }));
  const step = (delta) => setMinutes(m => Math.max(1, Math.min(300, (Number(m) || 0) + delta)));

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl" dir="rtl">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-right flex items-center gap-2">
            <Footprints className="w-5 h-5 text-primary" /> רישום הליכה בפנים
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {/* Minutes: the main metric */}
          <div className="flex items-center justify-center gap-5">
            <button onClick={() => step(-5)} className="w-12 h-12 rounded-full bg-muted flex items-center justify-center active:scale-95" aria-label="פחות 5 דקות">
              <Minus className="w-5 h-5" />
            </button>
            <div className="text-center">
              <input
                type="number" inputMode="numeric" value={minutes}
                onChange={e => setMinutes(e.target.value)}
                className="w-24 bg-transparent text-center text-5xl font-semibold tabular outline-none"
                aria-label="דקות הליכה"
              />
              <p className="text-xs text-muted-foreground">דקות</p>
            </div>
            <button onClick={() => step(5)} className="w-12 h-12 rounded-full bg-muted flex items-center justify-center active:scale-95" aria-label="עוד 5 דקות">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2 justify-center">
            {days.map((d, i) => (
              <button
                key={d}
                onClick={() => setDate(d)}
                className={cn("px-4 py-2 rounded-full text-sm border transition-colors", date === d ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}
              >
                {dayLabel(d, i)}
              </button>
            ))}
          </div>

          <input
            type="number" inputMode="numeric" value={steps}
            onChange={e => setSteps(e.target.value)}
            placeholder="צעדים בהליכה (לא חובה)"
            className="w-full h-11 rounded-2xl bg-muted px-4 text-sm text-center outline-none focus:ring-2 focus:ring-ring/30"
          />

          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || !(Number(minutes) > 0)}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            {save.isPending ? "שומר..." : "שמירה"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
