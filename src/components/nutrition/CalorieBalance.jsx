import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Flame, TrendingDown, TrendingUp, Pencil } from "lucide-react";

export default function CalorieBalance({ consumedCalories, date, userEmail, allEntries = [] }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  const burnedEntry = allEntries.find(
    e => e.food_name === "__calories_burned__" && (!userEmail || e.created_by === userEmail)
  );
  const burnedCalories = burnedEntry?.calories || 0;

  useEffect(() => {
    setValue(String(burnedCalories || ""));
  }, [burnedCalories]);

  const handleSave = async () => {
    const cal = parseInt(value);
    if (isNaN(cal)) return;
    if (burnedEntry) {
      await base44.entities.FoodEntry.update(burnedEntry.id, { calories: cal });
    } else {
      await base44.entities.FoodEntry.create({
        date,
        meal_type: "snack",
        food_name: "__calories_burned__",
        calories: cal,
        steps: 0,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["food-entries", date] });
    setEditing(false);
  };

  const balance = consumedCalories - burnedCalories;
  const isDeficit = balance < 0;
  const isSurplus = balance > 0;

  return (
    <div className="p-4 surface space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[hsl(var(--tone-gold-bg))] flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-[hsl(var(--tone-gold))]" />
          </div>
          <h3 className="font-semibold text-sm">מאזן קלורי יומי</h3>
        </div>
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-xl bg-muted/50">
          <p className="text-[10px] text-muted-foreground mb-0.5">נצרכו</p>
          <p className="text-base font-bold">{consumedCalories.toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground">קק״ל</p>
        </div>
        <div className="p-2 rounded-xl bg-[hsl(var(--tone-gold-bg))] border border-[hsl(var(--tone-gold-bg))]">
          <p className="text-[10px] text-muted-foreground mb-0.5">נשרפו</p>
          <p className="text-base font-bold text-[hsl(var(--tone-gold-fg))]">{burnedCalories.toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground">קק״ל</p>
        </div>
        <div className={`p-2 rounded-xl ${isDeficit ? "bg-primary/5 border border-primary/20" : isSurplus ? "bg-destructive/5 border border-destructive/20" : "bg-muted/50"}`}>
          <p className="text-[10px] text-muted-foreground mb-0.5">מאזן</p>
          <p className={`text-base font-bold ${isDeficit ? "text-primary" : isSurplus ? "text-destructive" : "text-foreground"}`}>
            {isSurplus ? "+" : ""}{balance.toLocaleString()}
          </p>
          <p className="text-[9px] text-muted-foreground">קק״ל</p>
        </div>
      </div>

      {/* Manual edit row - like DailyStepsInput */}
      <div className="flex items-center justify-between p-3 surface">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[hsl(var(--tone-gold))]" />
          <span className="text-sm text-muted-foreground">קלוריות שרופות</span>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-24 text-sm bg-background border border-border rounded-lg px-2 py-1 text-center"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            />
            <button onClick={handleSave} className="text-xs text-primary font-medium">שמור</button>
            <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground">ביטול</button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors group"
          >
            {burnedCalories > 0 ? burnedCalories.toLocaleString() : "הוסף ›"}
            {burnedCalories > 0 && <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
          </button>
        )}
      </div>

      {/* Status message */}
      <div className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium ${
        isDeficit ? "bg-primary/5 text-primary" :
        isSurplus && balance > 300 ? "bg-destructive/5 text-destructive" :
        "bg-muted text-muted-foreground"
      }`}>
        {isDeficit ? <TrendingDown className="w-3.5 h-3.5 shrink-0" /> : <TrendingUp className="w-3.5 h-3.5 shrink-0" />}
        {consumedCalories === 0 ? "לא הוזנו ארוחות עדיין" :
          burnedCalories === 0 ? "הזן קלוריות שרופות ידנית או דרך Apple Health" :
          isDeficit ? `גירעון קלורי של ${Math.abs(balance)} קק״ל — כל הכבוד! 🎉` :
          balance <= 200 ? `מאזן מאוזן — עבודה טובה! ✨` :
          `עודף של ${balance} קק״ל — שווה לשים לב 🙏`
        }
      </div>
    </div>
  );
}