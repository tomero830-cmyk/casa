import { useEffect, useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import ExercisePicker from "./ExercisePicker";

const numberInput = "w-12 h-9 rounded-xl bg-muted text-center text-sm font-semibold tabular outline-none";

/** Create or edit a workout template: a name plus ordered exercises with target sets × reps. */
export default function TemplateEditor({ open, onClose, template, options, onSave, onDelete, nextOrder }) {
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(template?.name || "");
    setExercises(template?.exercises?.length ? template.exercises.map(e => ({ ...e })) : []);
  }, [open, template]);

  const update = (i, patch) => setExercises(list => list.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const move = (i, dir) => setExercises(list => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const copy = [...list];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  });

  const save = () => {
    if (!name.trim() || !exercises.length) return;
    onSave({
      id: template?.id,
      data: {
        name: name.trim(),
        exercises: exercises.map(e => ({ exercise: e.exercise, sets: Number(e.sets) || 3, reps: Number(e.reps) || 10 })),
        order: template?.order ?? nextOrder,
      },
    });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-right">{template?.id ? "עריכת תוכנית" : "תוכנית חדשה"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="שם התוכנית, למשל: אימון A · רגליים"
            className="w-full h-11 rounded-2xl bg-muted px-4 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          />

          <div className="space-y-2">
            {exercises.map((e, i) => (
              <div key={`${e.exercise}-${i}`} className="flex items-center gap-2 rounded-2xl bg-muted/50 px-2 py-2">
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} className="text-muted-foreground px-1 leading-none" aria-label="הזזה למעלה">▲</button>
                  <button onClick={() => move(i, 1)} className="text-muted-foreground px-1 leading-none" aria-label="הזזה למטה">▼</button>
                </div>
                <span className="flex-1 text-sm font-medium truncate">{e.exercise}</span>
                <input type="number" inputMode="numeric" value={e.sets} onChange={ev => update(i, { sets: ev.target.value })} className={numberInput} aria-label="סטים" />
                <span className="text-xs text-muted-foreground">×</span>
                <input type="number" inputMode="numeric" value={e.reps} onChange={ev => update(i, { reps: ev.target.value })} className={numberInput} aria-label="חזרות" />
                <button onClick={() => setExercises(list => list.filter((_, j) => j !== i))} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground" aria-label="הסרת תרגיל">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setPickerOpen(true)}
              className="w-full h-11 rounded-2xl border-2 border-dashed border-primary/30 text-primary text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> הוספת תרגיל
            </button>
          </div>

          <button
            onClick={save}
            disabled={!name.trim() || !exercises.length}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            שמירת התוכנית
          </button>

          {template?.id && (
            <ConfirmDialog title={`למחוק את "${template.name}"?`} description="האימונים שכבר נרשמו לא יימחקו." onConfirm={() => { onDelete(template.id); onClose(); }}>
              <button className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-2">
                <Trash2 className="w-3.5 h-3.5" /> מחיקת התוכנית
              </button>
            </ConfirmDialog>
          )}
        </div>

        <ExercisePicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          options={options}
          onPick={(exercise) => setExercises(list => [...list, { exercise, sets: 3, reps: 10 }])}
        />
      </SheetContent>
    </Sheet>
  );
}
