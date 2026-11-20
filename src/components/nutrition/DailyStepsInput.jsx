import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Footprints, Pencil } from "lucide-react";

export default function DailyStepsInput({ date, userEmail, allEntries = [] }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  const stepsEntry = allEntries.find(e => e.steps != null && e.created_by === userEmail);
  const currentSteps = stepsEntry?.steps;

  useEffect(() => {
    if (currentSteps != null) setValue(String(currentSteps));
  }, [currentSteps]);

  const handleSave = async () => {
    const steps = parseInt(value);
    if (isNaN(steps)) return;
    if (stepsEntry) {
      await base44.entities.FoodEntry.update(stepsEntry.id, { steps });
    } else {
      await base44.entities.FoodEntry.create({
        date,
        meal_type: "snack",
        food_name: "__steps__",
        calories: 0,
        steps,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["food-entries", date] });
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between p-3 surface">
      <div className="flex items-center gap-2">
        <Footprints className="w-4 h-4 text-primary" />
        <span className="text-sm text-muted-foreground">צעדים היום</span>
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
          {currentSteps != null ? currentSteps.toLocaleString() : "הוסף ›"}
          {currentSteps != null && <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
        </button>
      )}
    </div>
  );
}