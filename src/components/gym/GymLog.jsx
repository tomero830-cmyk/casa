import { useMemo, useState } from "react";
import { Plus, Dumbbell, Loader2 } from "lucide-react";
import { useGymSets } from "./useGymSets";
import ExerciseCard from "./ExerciseCard";
import ExercisePicker from "./ExercisePicker";
import ExerciseProgress from "./ExerciseProgress";
import { exerciseOptions, groupDayByExercise } from "@/lib/gym";

/** Strength log for one day: exercises with their sets, plus adding exercises and viewing progress. */
export default function GymLog({ date }) {
  const { sets, isLoading, error, addSet, deleteSet } = useGymSets();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [progressFor, setProgressFor] = useState(null);
  // Exercises picked for today that have no sets yet
  const [draft, setDraft] = useState([]);

  const daySets = useMemo(() => sets.filter(s => s.date === date), [sets, date]);
  const groups = useMemo(() => {
    const logged = groupDayByExercise(daySets);
    const names = new Set(logged.map(g => g.exercise));
    return [...logged, ...draft.filter(d => d.date === date && !names.has(d.exercise)).map(d => ({ exercise: d.exercise, sets: [] }))];
  }, [daySets, draft, date]);
  const options = useMemo(() => exerciseOptions(sets), [sets]);

  const dayVolume = daySets.reduce((sum, s) => sum + (Number(s.weight_kg) || 0) * (Number(s.reps) || 0), 0);

  if (error) {
    return (
      <div className="surface p-5 text-center text-sm text-muted-foreground space-y-1">
        <p>לא הצלחנו לטעון את יומן הכוח.</p>
        <p className="text-xs">ייתכן שהישות GymSet עוד לא נוצרה ב-Base44.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {daySets.length > 0 && (
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>{groups.length} תרגילים · {daySets.length} סטים</span>
          {dayVolume > 0 && <span className="tabular">נפח כולל {Math.round(dayVolume).toLocaleString()} ק״ג</span>}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : groups.length === 0 ? (
        <div className="surface px-5 py-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center mx-auto">
            <Dumbbell className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium">עוד לא נרשמו תרגילים ליום הזה</p>
          <p className="text-xs text-muted-foreground">בוחרים תרגיל ומוסיפים סטים. בפעם הבאה יופיע מה עשיתם בפעם הקודמת.</p>
        </div>
      ) : (
        groups.map(g => (
          <ExerciseCard
            key={`${date}-${g.exercise}`}
            exercise={g.exercise}
            daySets={g.sets}
            allSets={sets}
            date={date}
            onAdd={(data) => addSet.mutate(data)}
            onDelete={(id) => deleteSet.mutate(id)}
            onOpenProgress={() => setProgressFor(g.exercise)}
          />
        ))
      )}

      <button
        onClick={() => setPickerOpen(true)}
        className="w-full h-12 rounded-full border-2 border-dashed border-primary/30 text-primary text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition"
      >
        <Plus className="w-4 h-4" />
        הוספת תרגיל
      </button>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        options={options}
        onPick={(name) => setDraft(prev => [...prev.filter(d => !(d.date === date && d.exercise === name)), { date, exercise: name }])}
      />
      <ExerciseProgress exercise={progressFor} allSets={sets} onClose={() => setProgressFor(null)} />
    </div>
  );
}
