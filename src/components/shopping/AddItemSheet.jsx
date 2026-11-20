import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { notifyError } from "@/lib/notify";

const CATEGORIES = {
  produce: { label: "ירקות ופירות", emoji: "🥦" },
  dairy: { label: "חלב וגבינות", emoji: "🧀" },
  meat: { label: "בשר ודגים", emoji: "🥩" },
  bakery: { label: "לחם ומאפים", emoji: "🍞" },
  pantry: { label: "מזווה", emoji: "🥫" },
  cleaning: { label: "ניקיון", emoji: "🧹" },
  hygiene: { label: "היגיינה", emoji: "🧴" },
  other: { label: "אחר", emoji: "📦" },
};

export default function AddItemSheet({ open, onClose, onAdded }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.ShoppingItem.create({
        name: name.trim(),
        category,
        quantity,
        unit: unit.trim() || undefined,
        is_purchased: false,
      });
    } catch (err) {
      notifyError(err, "הוספת המוצר נכשלה");
      return;
    } finally {
      setSaving(false);
    }
    setName("");
    setCategory("other");
    setQuantity(1);
    setUnit("");
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto bg-card rounded-t-2xl border border-border/50 p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto" />
        <h3 className="font-playfair italic text-lg text-center">הוסף מוצר</h3>

        <input
          autoFocus
          className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary"
          placeholder="שם המוצר..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
        />

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(CATEGORIES).map(([key, { label, emoji }]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-colors ${
                category === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted border-border/50 text-muted-foreground hover:border-primary/40"
              }`}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-muted border border-border rounded-xl px-3 py-2">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground">−</button>
            <span className="text-sm font-semibold w-6 text-center">{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground">+</button>
          </div>
          <input
            className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="יחידה (ק״ג, יח׳...)"
            value={unit}
            onChange={e => setUnit(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50"
        >
          {saving ? "שומר..." : "הוסף לרשימה"}
        </button>
      </div>
    </div>
  );
}