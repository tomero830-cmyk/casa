import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Check, Dumbbell, Footprints, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import WorkoutHeroCard from "@/components/workouts/WorkoutHeroCard";
import WorkoutCalendar from "@/components/workouts/WorkoutCalendar";
import AddWorkoutSheet from "@/components/workouts/AddWorkoutSheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import GymLog from "@/components/gym/GymLog";
import WalkLogSheet from "@/components/walks/WalkLogSheet";
import { notifyError } from "@/lib/notify";
import { parseDateStr } from "@/lib/dates";
import { todayStr } from "@/lib/dates";
import PageHeader from "@/components/layout/PageHeader";

const TYPE_COLORS = ["coral", "green", "blue", "purple"];


export default function Workouts() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState("plan");
  const [walkOpen, setWalkOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ["workouts"],
    queryFn: () => base44.entities.Workout.list("-date", 500),
  });

  const { data: workoutTypes = [] } = useQuery({
    queryKey: ["workout-types"],
    queryFn: () => base44.entities.WorkoutType.list("-created_date", 50),
  });

  // Map workout type -> color key
  const typeColors = useMemo(() => {
    const map = {};
    workoutTypes.forEach((t, i) => {
      map[t.name] = t.color || TYPE_COLORS[i % TYPE_COLORS.length];
    });
    return map;
  }, [workoutTypes]);

  const today = todayStr();
  const todaysWorkout = workouts.find(w => w.date === today);

  const selectedDayWorkouts = useMemo(
    () => workouts.filter(w => w.date === selectedDate).sort((a, b) => (a.workout_type || "").localeCompare(b.workout_type || "")),
    [workouts, selectedDate]
  );

  const completeMutation = useMutation({
    mutationFn: ({ id, is_completed }) => base44.entities.Workout.update(id, { is_completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workouts"] }),
    onError: (err) => notifyError(err, "העדכון נכשל"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Workout.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workouts"] }),
    onError: (err) => notifyError(err, "המחיקה נכשלה"),
  });

  const isToday = selectedDate === today;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader icon={Dumbbell} title="אימונים" subtitle={todaysWorkout ? `היום: ${todaysWorkout.workout_type}` : "אין אימון מתוכנן להיום"}>
        <button
          onClick={() => setWalkOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-primary/40 text-primary text-sm font-medium active:scale-95 transition"
        >
          <Footprints className="w-4 h-4" />
          הליכה
        </button>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          הוסף
        </button>
      </PageHeader>

      {/* Today's workout hero */}
      <WorkoutHeroCard
        workout={todaysWorkout}
        onAdd={() => { setSelectedDate(today); setShowAdd(true); }}
        onComplete={() => todaysWorkout && completeMutation.mutate({ id: todaysWorkout.id, is_completed: !todaysWorkout.is_completed })}
        colorKey={todaysWorkout ? (typeColors[todaysWorkout.workout_type] || "coral") : "coral"}
      />

      {/* Calendar */}
      <WorkoutCalendar
        workouts={workouts}
        typeColors={typeColors}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Plan vs. strength log for the selected day */}
      <div className="flex gap-1 p-1 bg-secondary/70 rounded-full">
        {[["plan", "תוכנית היום"], ["gym", "יומן כוח"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn("flex-1 py-2 rounded-full text-xs font-medium transition-colors", tab === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "gym" && <GymLog date={selectedDate} />}

      {/* Selected day workouts */}
      {tab === "plan" && (
      <div className="surface overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div>
            <p className="text-sm font-semibold">
              {isToday ? "היום" : parseDateStr(selectedDate).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {selectedDayWorkouts.length === 0 ? "אין אימונים מתוכננים" : `${selectedDayWorkouts.length} אימון${selectedDayWorkouts.length > 1 ? "ים" : ""}`}
            </p>
          </div>
          {/* Any day can get a workout: past (log) or future (plan) */}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-[11px] text-primary font-medium hover:text-primary/80 transition-colors"
          >
            <Plus className="w-3 h-3" />
            הוסף ליום זה
          </button>
        </div>

        {selectedDayWorkouts.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Dumbbell className="w-7 h-7 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">אין אימונים ליום זה</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {selectedDayWorkouts.map(w => {
              const colorKey = typeColors[w.workout_type] || "coral";
              const dotColor = colorKey === "coral" ? "bg-[hsl(var(--tone-terra))]" : colorKey === "green" ? "bg-primary" : colorKey === "blue" ? "bg-[hsl(var(--tone-sage))]" : "bg-[hsl(var(--tone-gold))]";
              return (
                <div key={w.id} className="px-4 py-3 flex items-start gap-3 group">
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", dotColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-semibold", w.is_completed && "line-through text-muted-foreground")}>{w.workout_type}</p>
                      {w.is_completed && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-primary font-medium">
                          <Check className="w-3 h-3" />
                          בוצע
                        </span>
                      )}
                    </div>
                    {w.content && (
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">{w.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!w.is_completed && (
                      <button
                        onClick={() => completeMutation.mutate({ id: w.id, is_completed: true })}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ConfirmDialog title="למחוק את האימון?" onConfirm={() => deleteMutation.mutate(w.id)}>
                      <button
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </ConfirmDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      <WalkLogSheet open={walkOpen} onClose={() => setWalkOpen(false)} />

      <AddWorkoutSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        date={selectedDate}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["workouts"] })}
      />
    </div>
  );
}