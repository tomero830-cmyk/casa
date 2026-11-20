import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Plus, Check, Loader2, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { notifyError } from "@/lib/notify";

const COLOR_OPTIONS = [
  { key: "coral", class: "bg-[hsl(var(--tone-terra))]" },
  { key: "green", class: "bg-primary" },
  { key: "blue", class: "bg-[hsl(var(--tone-sage))]" },
  { key: "purple", class: "bg-[hsl(var(--tone-gold))]" },
];

export default function AddWorkoutSheet({ open, onClose, date, onSaved }) {
  const [selectedDate, setSelectedDate] = useState(date);
  const [selectedTypeName, setSelectedTypeName] = useState("");
  const [isNewType, setIsNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("coral");
  const queryClient = useQueryClient();

  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const { data: workoutTypes = [] } = useQuery({
    queryKey: ["workout-types"],
    queryFn: () => base44.entities.WorkoutType.list("-created_date", 50),
    enabled: open,
  });

  // When selecting an existing type, auto-fill content from template
  const selectType = (type) => {
    setSelectedTypeName(type.name);
    setIsNewType(false);
    setContent(type.content || "");
    setSelectedColor(type.color || "coral");
  };

  const startNewType = () => {
    setIsNewType(true);
    setSelectedTypeName("");
    setContent("");
    setNewTypeName("");
    setSelectedColor("coral");
  };

  const createWorkoutMutation = useMutation({
    mutationFn: async (data) => {
      // If new type, create the WorkoutType first
      if (data.is_new_type) {
        await base44.entities.WorkoutType.create({
          name: data.workout_type,
          content: data.content,
          color: data.color,
        });
      }
      // Create the workout
      await base44.entities.Workout.create({
        date: data.date,
        workout_type: data.workout_type,
        content: data.content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["workout-types"] });
      // Reset
      setSelectedTypeName("");
      setIsNewType(false);
      setNewTypeName("");
      setContent("");
      onSaved?.();
      onClose();
    },
    onError: (err) => notifyError(err, "שמירת האימון נכשלה"),
  });

  const handleSave = () => {
    const typeName = isNewType ? newTypeName.trim() : selectedTypeName;
    if (!typeName || !selectedDate) return;
    createWorkoutMutation.mutate({
      date: selectedDate,
      workout_type: typeName,
      content: content.trim(),
      color: selectedColor,
      is_new_type: isNewType,
    });
  };

  if (!open) return null;

  const canSave = isNewType ? newTypeName.trim() && selectedDate : selectedTypeName && selectedDate;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-card rounded-t-3xl border-t border-border/50 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
        {/* Handle */}
        <div className="sticky top-0 bg-card pt-3 pb-2 z-10">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-2" />
          <div className="flex items-center justify-between px-5">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              <h3 className="text-base font-bold">הוסף אימון</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* Date */}
          <div>
            <label className="text-[11px] text-muted-foreground font-medium mb-1.5 block">תאריך</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
            />
          </div>

          {/* Workout type selection */}
          <div>
            <label className="text-[11px] text-muted-foreground font-medium mb-1.5 block">סוג אימון</label>

            {workoutTypes.length > 0 && !isNewType && (
              <div className="flex flex-wrap gap-2 mb-2">
                {workoutTypes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => selectType(t)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5",
                      selectedTypeName === t.name && !isNewType
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-transparent border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full", COLOR_OPTIONS.find(c => c.key === (t.color || "coral"))?.class || "bg-[hsl(var(--tone-terra))]")} />
                    {t.name}
                  </button>
                ))}
              </div>
            )}

            {isNewType ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="שם סוג האימון (לדוגמה: ריצת אינטרוולים)"
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  className="w-full h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
                  autoFocus
                />
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">צבע</p>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c.key}
                        onClick={() => setSelectedColor(c.key)}
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                          c.class,
                          selectedColor === c.key ? "ring-2 ring-offset-2 ring-offset-card ring-foreground/30 scale-110" : ""
                        )}
                      >
                        {selectedColor === c.key && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => { setIsNewType(false); setNewTypeName(""); }}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← בחר מסוג קיים
                </button>
              </div>
            ) : (
              <button
                onClick={startNewType}
                className="w-full h-11 rounded-xl border border-dashed border-primary/30 text-xs text-primary font-medium flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                סוג אימון חדש (פעם ראשונה — תוכן יישמר כתבנית)
              </button>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="text-[11px] text-muted-foreground font-medium mb-1.5 block">
              תוכן האימון {isNewType && <span className="text-primary">(יישמר כתבנית לסוג זה)</span>}
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              placeholder="פרטי האימון... (לדוגמה: 10 דק חימום, 6×400מ בקצב 5:00, 10 דק שחרור)"
              className="w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm resize-none"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!canSave || createWorkoutMutation.isPending}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {createWorkoutMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                שמור אימון
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}