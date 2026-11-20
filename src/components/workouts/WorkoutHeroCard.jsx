import { Check, Plus, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_COLORS = {
  coral: { bg: "from-[hsl(var(--tone-terra))]/20 to-[hsl(var(--tone-terra-fg))]/5", text: "text-[hsl(var(--tone-terra-fg))]", dot: "bg-[hsl(var(--tone-terra))]" },
  green: { bg: "from-primary/20 to-primary/5", text: "text-primary", dot: "bg-primary" },
  blue: { bg: "from-[hsl(var(--tone-sage))]/20 to-[hsl(var(--tone-sage-fg))]/5", text: "text-[hsl(var(--tone-sage-fg))]", dot: "bg-[hsl(var(--tone-sage))]" },
  purple: { bg: "from-[hsl(var(--tone-gold))]/20 to-[hsl(var(--tone-gold-fg))]/5", text: "text-[hsl(var(--tone-gold-fg))]", dot: "bg-[hsl(var(--tone-gold))]" },
};

export default function WorkoutHeroCard({ workout, onAdd, onComplete, colorKey = "coral" }) {
  const colors = TYPE_COLORS[colorKey] || TYPE_COLORS.coral;

  if (!workout) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-[hsl(var(--tone-brown-bg))] to-card p-5 text-foreground shadow-[var(--card-shadow)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-muted-foreground" />
            <span className="text-[11px] tracking-widest text-muted-foreground uppercase">האימון של היום</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>
        <div className="py-6 text-center">
          <p className="text-muted-foreground text-sm mb-3">אין אימון מתוכנן להיום</p>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            הוסף אימון
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-3xl bg-gradient-to-br from-[hsl(var(--tone-brown-bg))] to-card p-5 text-foreground shadow-[var(--card-shadow)]", colors.bg)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", colors.dot)} />
          <span className="text-[11px] tracking-widest text-muted-foreground uppercase">האימון של היום</span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {new Date(workout.date + "T12:00:00").toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>

      <h3 className={cn("text-2xl font-bold mb-2", colors.text)}>{workout.workout_type}</h3>

      {workout.content && (
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap mb-4">{workout.content}</p>
      )}

      <div className="flex items-center gap-2 mt-auto">
        {workout.is_completed ? (
          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-semibold">
            <Check className="w-4 h-4" />
            הושלם
          </div>
        ) : (
          <button
            onClick={onComplete}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground text-sm font-semibold transition-colors border border-foreground/10"
          >
            <Check className="w-4 h-4" />
            סמן כבוצע
          </button>
        )}
      </div>
    </div>
  );
}