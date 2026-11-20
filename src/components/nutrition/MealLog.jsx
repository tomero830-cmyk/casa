import { useState } from "react";
import { Loader2, Trash2, Leaf, Pencil, Check, X } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

const mealConfig = {
  breakfast: { label: "ארוחת בוקר", emoji: "🌅" },
  lunch: { label: "ארוחת צהריים", emoji: "☀️" },
  dinner: { label: "ארוחת ערב", emoji: "🌙" },
  snack: { label: "חטיף", emoji: "🍎" },
};

function EditableRow({ entry, onSave, onCancel }) {
  const [form, setForm] = useState({
    food_name: entry.food_name || "",
    amount_grams: entry.amount_grams || "",
    calories: entry.calories || "",
    protein: entry.protein || "",
    carbs: entry.carbs || "",
    fat: entry.fat || "",
  });

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = () => {
    onSave({
      food_name: form.food_name.trim() || entry.food_name,
      amount_grams: form.amount_grams ? parseFloat(form.amount_grams) : 0,
      calories: form.calories ? parseFloat(form.calories) : 0,
      protein: form.protein ? parseFloat(form.protein) : 0,
      carbs: form.carbs ? parseFloat(form.carbs) : 0,
      fat: form.fat ? parseFloat(form.fat) : 0,
    });
  };

  const inputClass = "w-full h-8 rounded-lg border border-input bg-transparent px-2 text-xs";

  return (
    <div className="px-4 py-3 space-y-2 bg-muted/20">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={form.food_name}
          onChange={e => set("food_name", e.target.value)}
          className={inputClass}
          placeholder="שם המזון"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[9px] text-muted-foreground block mb-0.5">כמות (ג׳)</label>
          <input type="number" value={form.amount_grams} onChange={e => set("amount_grams", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground block mb-0.5">קלוריות</label>
          <input type="number" value={form.calories} onChange={e => set("calories", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground block mb-0.5">חלבון (ג׳)</label>
          <input type="number" value={form.protein} onChange={e => set("protein", e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] text-muted-foreground block mb-0.5">פחמימות (ג׳)</label>
          <input type="number" value={form.carbs} onChange={e => set("carbs", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground block mb-0.5">שומן (ג׳)</label>
          <input type="number" value={form.fat} onChange={e => set("fat", e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1 hover:bg-primary/90 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          שמור
        </button>
        <button
          onClick={onCancel}
          className="px-4 h-8 rounded-lg border border-border text-xs text-muted-foreground flex items-center justify-center gap-1 hover:bg-muted transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          ביטול
        </button>
      </div>
    </div>
  );
}

export default function MealLog({ entries, isLoading, onDelete, onUpdate }) {
  const [editingId, setEditingId] = useState(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <Leaf className="w-10 h-10 text-primary/20 mx-auto" />
        <p className="text-sm text-muted-foreground">לא הוזנו ארוחות עדיין</p>
        <p className="text-xs text-muted-foreground">לחץ על + הוסף כדי להתחיל</p>
      </div>
    );
  }

  // Group by meal type
  const grouped = {};
  entries.forEach(e => {
    if (!grouped[e.meal_type]) grouped[e.meal_type] = [];
    grouped[e.meal_type].push(e);
  });

  const order = ["breakfast", "lunch", "dinner", "snack"];

  const handleSave = (entry, data) => {
    onUpdate(entry.id, data);
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm">ארוחות היום</h3>
      {order.filter(m => grouped[m]).map(mealType => {
        const meal = mealConfig[mealType];
        const items = grouped[mealType];
        const mealCals = items.reduce((s, e) => s + (e.calories || 0), 0);

        return (
          <div key={mealType} className="surface overflow-hidden">
            {/* Meal header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-base">{meal.emoji}</span>
                <span className="font-semibold text-sm">{meal.label}</span>
              </div>
              <span className="text-xs font-bold text-primary">{mealCals} קק״ל</span>
            </div>

            {/* Items */}
            <div className="divide-y divide-border/30">
              {items.map(entry => (
                <div key={entry.id}>
                  {editingId === entry.id ? (
                    <EditableRow
                      entry={entry}
                      onSave={(data) => handleSave(entry, data)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3">
                      {entry.photo_url && (
                        <img src={entry.photo_url} alt={entry.food_name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{entry.food_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {entry.amount_grams > 0 && (
                            <span className="text-xs text-muted-foreground">{entry.amount_grams}ג׳</span>
                          )}
                          {entry.protein > 0 && <span className="text-[10px] text-primary">ח׳ {Math.round(entry.protein)}ג׳</span>}
                          {entry.carbs > 0 && <span className="text-[10px] text-[hsl(var(--tone-gold))]">פ׳ {Math.round(entry.carbs)}ג׳</span>}
                          {entry.fat > 0 && <span className="text-[10px] text-destructive">ש׳ {Math.round(entry.fat)}ג׳</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-sm font-bold mr-1">{entry.calories}</span>
                        <span className="text-[10px] text-muted-foreground">קק״ל</span>
                        <button
                          onClick={() => setEditingId(entry.id)}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
                        >
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <ConfirmDialog title={`למחוק את ${entry.food_name}?`} onConfirm={() => onDelete(entry.id)}>
                          <button
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </ConfirmDialog>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}