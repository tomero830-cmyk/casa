import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trophy, X, History, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { isPersonalRecord, lastSessionBefore, summarizeSets } from "@/lib/gym";

function Stepper({ label, value, onChange, step, min = 0, suffix }) {
  const set = (v) => onChange(Math.max(min, Math.round(v * 10) / 10));
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[11px] text-muted-foreground mb-1 text-center">{label}</p>
      <div className="flex items-center justify-between rounded-2xl bg-muted px-1.5 h-11">
        <button type="button" onClick={() => set(value - step)} className="w-8 h-8 rounded-full flex items-center justify-center active:bg-background" aria-label={`הפחתת ${label}`}>
          <Minus className="w-4 h-4" />
        </button>
        <div className="flex items-baseline gap-0.5">
          <input
            type="number"
            inputMode="decimal"
            value={value}
            onChange={e => set(Number(e.target.value))}
            className="w-12 bg-transparent text-center text-base font-semibold tabular outline-none"
            aria-label={label}
          />
          {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
        </div>
        <button type="button" onClick={() => set(value + step)} className="w-8 h-8 rounded-full flex items-center justify-center active:bg-background" aria-label={`הוספת ${label}`}>
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * One exercise within a day: its sets, last session's numbers, and quick entry for the next set.
 */
export default function ExerciseCard({ exercise, daySets, allSets, date, onAdd, onDelete, onOpenProgress, target }) {
  const last = useMemo(() => lastSessionBefore(allSets, exercise, date), [allSets, exercise, date]);

  // Prefill from today's last set, else last session's first set
  const seed = daySets[daySets.length - 1] || last?.sets[0];
  const [weight, setWeight] = useState(Number(seed?.weight_kg) || 0);
  const [reps, setReps] = useState(Number(seed?.reps) || Number(target?.reps) || 10);

  const add = () => {
    if (!reps) return;
    onAdd({ date, exercise, set_number: daySets.length + 1, reps, weight_kg: weight });
  };

  return (
    <div className="surface p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <button onClick={onOpenProgress} className="text-right min-w-0 flex-1">
          <p className="text-base font-semibold truncate flex items-center gap-1">
            {exercise}
            <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
          </p>
          {target && (
            <p className="text-[11px] text-primary mt-0.5">
              יעד: {target.sets} × {target.reps}{daySets.length >= target.sets ? " · הושלם ✓" : ` · נשארו ${target.sets - daySets.length} סטים`}
            </p>
          )}
          {last ? (
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <History className="w-3 h-3" />
              בפעם הקודמת: {summarizeSets(last.sets)}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-0.5">פעם ראשונה בתרגיל הזה</p>
          )}
        </button>
      </div>

      {/* Logged sets */}
      {daySets.length > 0 && (
        <div className="space-y-1.5">
          <AnimatePresence initial={false}>
            {daySets.map((s, i) => {
              const pr = !s._pending && isPersonalRecord(s, allSets);
              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: s._pending ? 0.6 : 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-2"
                >
                  <span className="w-6 h-6 rounded-full bg-background text-[11px] font-semibold flex items-center justify-center tabular">{i + 1}</span>
                  <span className="flex-1 text-sm tabular">
                    <span className="font-semibold">{s.reps}</span> חזרות
                    <span className="text-muted-foreground"> · </span>
                    {Number(s.weight_kg) > 0 ? <><span className="font-semibold">{s.weight_kg}</span> ק״ג</> : "משקל גוף"}
                  </span>
                  {pr && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--tone-gold-bg))] text-[hsl(var(--tone-gold-fg))]">
                      <Trophy className="w-3 h-3" /> שיא
                    </span>
                  )}
                  <button onClick={() => onDelete(s.id)} disabled={s._pending} className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive" aria-label="מחיקת סט">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Next set */}
      <div className="flex items-end gap-2">
        <Stepper label="משקל" value={weight} onChange={setWeight} step={2.5} suffix="ק״ג" />
        <Stepper label="חזרות" value={reps} onChange={setReps} step={1} min={1} />
        <button
          onClick={add}
          className={cn("h-11 px-4 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition shrink-0")}
        >
          סט {daySets.length + 1}
        </button>
      </div>
    </div>
  );
}
