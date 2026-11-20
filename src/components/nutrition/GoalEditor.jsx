import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { notifyError } from "@/lib/notify";
import { Target, Pencil, Check, X } from "lucide-react";

export default function GoalEditor({ goalCalories, onGoalChange }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(goalCalories));
  const { updateCurrentUser } = useAuth();

  const handleSave = async () => {
    const goal = parseInt(value);
    if (isNaN(goal) || goal < 100) return;
    try {
      await updateCurrentUser({ calorie_goal: goal });
      onGoalChange?.(goal);
      setEditing(false);
    } catch (err) {
      notifyError(err, "עדכון היעד נכשל");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Target className="w-3 h-3 text-muted-foreground" />
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-20 text-xs bg-background border border-border rounded-lg px-2 py-0.5 text-center"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
          />
          <button onClick={handleSave} className="text-primary"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setEditing(false); setValue(String(goalCalories)); }} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          יעד: {goalCalories} קק״ל
          <Pencil className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}