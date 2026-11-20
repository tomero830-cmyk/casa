import { useState } from "react";
import { Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { notifyError } from "@/lib/notify";

export default function EditItemInline({ item, onDone }) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity || 1);
  const [unit, setUnit] = useState(item.unit || "");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.ShoppingItem.update(item.id, {
        name: name.trim(),
        quantity,
        unit: unit.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      onDone();
    } catch (err) {
      notifyError(err, "העדכון נכשל");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
      <input
        autoFocus
        className="flex-1 min-w-0 bg-background border border-primary rounded-lg px-2 py-1 text-sm outline-none"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onDone(); }}
      />
      <div className="flex items-center gap-1 bg-muted border border-border rounded-lg px-1.5 py-1 shrink-0">
        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground text-base leading-none">−</button>
        <span className="text-xs font-semibold w-5 text-center">{quantity}</span>
        <button onClick={() => setQuantity(q => q + 1)} className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground text-base leading-none">+</button>
      </div>
      <input
        className="w-16 bg-muted border border-border rounded-lg px-2 py-1 text-xs outline-none focus:border-primary shrink-0"
        placeholder="יח׳"
        value={unit}
        onChange={e => setUnit(e.target.value)}
      />
      <button onClick={handleSave} disabled={saving} className="text-primary hover:text-primary/80 shrink-0">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={onDone} className="text-muted-foreground hover:text-foreground shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}