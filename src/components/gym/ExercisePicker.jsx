import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/** Bottom sheet for choosing an exercise: search, recent first, or type a new name. */
export default function ExercisePicker({ open, onClose, options, onPick }) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();

  const filtered = useMemo(
    () => (trimmed ? options.filter(o => o.includes(trimmed)) : options),
    [options, trimmed]
  );
  const isNew = trimmed && !options.some(o => o === trimmed);

  const pick = (name) => {
    onPick(name);
    setQuery("");
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { setQuery(""); onClose(); } }}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] flex flex-col" dir="rtl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-right">בחירת תרגיל</SheetTitle>
        </SheetHeader>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && trimmed) pick(filtered[0] && !isNew ? filtered[0] : trimmed); }}
            placeholder="חיפוש או שם תרגיל חדש"
            className="w-full h-11 rounded-2xl bg-muted pr-10 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="mt-3 overflow-y-auto -mx-1 px-1 pb-4 space-y-1.5">
          {isNew && (
            <button
              onClick={() => pick(trimmed)}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent text-accent-foreground text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              הוספת "{trimmed}"
            </button>
          )}
          {filtered.map(name => (
            <button
              key={name}
              onClick={() => pick(name)}
              className="w-full text-right px-4 py-3 rounded-2xl hover:bg-muted active:bg-muted text-sm transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
