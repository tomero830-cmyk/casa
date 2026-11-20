import { useMemo, useState } from "react";
import { Plus, Dumbbell, Loader2, Play, Pencil, BookmarkPlus } from "lucide-react";
import { useGymSets } from "./useGymSets";
import ExerciseCard from "./ExerciseCard";
import ExercisePicker from "./ExercisePicker";
import ExerciseProgress from "./ExerciseProgress";
import TemplateEditor from "./TemplateEditor";
import { useGymTemplates } from "./useGymTemplates";
import { exerciseOptions, groupDayByExercise } from "@/lib/gym";

/** Strength log for one day: exercises with their sets, plus adding exercises and viewing progress. */
export default function GymLog({ date }) {
  const { sets, isLoading, error, addSet, deleteSet } = useGymSets();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [progressFor, setProgressFor] = useState(null);
  // Exercises picked for today that have no sets yet
  const [draft, setDraft] = useState([]);
  const { templates, save: saveTemplate, remove: removeTemplate } = useGymTemplates();
  const [editing, setEditing] = useState(null); // template being edited, or {} for a new one

  const daySets = useMemo(() => sets.filter(s => s.date === date), [sets, date]);
  const groups = useMemo(() => {
    const logged = groupDayByExercise(daySets);
    const names = new Set(logged.map(g => g.exercise));
    const targets = new Map(draft.filter(d => d.date === date).map(d => [d.exercise, d.target]));
    return [
      ...logged.map(g => ({ ...g, target: targets.get(g.exercise) })),
      ...draft.filter(d => d.date === date && !names.has(d.exercise)).map(d => ({ exercise: d.exercise, sets: [], target: d.target })),
    ];
  }, [daySets, draft, date]);
  const options = useMemo(() => exerciseOptions(sets), [sets]);

  const addToDraft = (items) => setDraft(prev => {
    const others = prev.filter(d => !(d.date === date && items.some(i => i.exercise === d.exercise)));
    return [...others, ...items.map(i => ({ date, exercise: i.exercise, target: i.target }))];
  });

  const startTemplate = (t) => addToDraft((t.exercises || []).map(e => ({ exercise: e.exercise, target: { sets: e.sets, reps: e.reps } })));

  // Turn today's logged workout into a reusable template
  const saveTodayAsTemplate = () => setEditing({
    name: "",
    exercises: groups.filter(g => g.sets.length).map(g => ({
      exercise: g.exercise,
      sets: g.sets.length,
      reps: Math.round(g.sets.reduce((s, x) => s + (Number(x.reps) || 0), 0) / g.sets.length),
    })),
  });

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
      {/* Templates */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
        {templates.map(t => (
          <div key={t.id} className="flex items-center shrink-0 rounded-full bg-card shadow-[var(--card-shadow)]">
            <button onClick={() => startTemplate(t)} className="flex items-center gap-1.5 pr-3.5 pl-2 py-2 text-sm font-medium">
              <Play className="w-3.5 h-3.5 text-primary" /> {t.name}
            </button>
            <button onClick={() => setEditing(t)} className="w-8 h-8 mr-0.5 ml-1 rounded-full flex items-center justify-center text-muted-foreground" aria-label={`עריכת ${t.name}`}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button onClick={() => setEditing({})} className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-dashed border-primary/40 text-primary text-sm">
          <Plus className="w-3.5 h-3.5" /> תוכנית
        </button>
      </div>

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
            target={g.target}
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

      {daySets.length > 0 && (
        <button onClick={saveTodayAsTemplate} className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-1">
          <BookmarkPlus className="w-3.5 h-3.5" /> שמירת האימון של היום כתוכנית
        </button>
      )}

      <TemplateEditor
        open={!!editing}
        onClose={() => setEditing(null)}
        template={editing}
        options={options}
        nextOrder={templates.length}
        onSave={(payload) => saveTemplate.mutate(payload)}
        onDelete={(id) => removeTemplate.mutate(id)}
      />

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
