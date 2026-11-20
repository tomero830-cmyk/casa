import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { todayStr } from "@/lib/dates";
import { notifyError } from "@/lib/notify";

const shiftLabels = {
  morning: "בוקר",
  afternoon: "צהריים",
  evening: "ערב",
};

export default function AddIncomeDialog({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: todayStr(),
    shift_type: "evening",
    hours_worked: "",
    hourly_rate: "",
    total_earned: "",
    notes: "",
  });

  const computedTotal = form.hours_worked && form.hourly_rate
    ? Number(form.hours_worked) * Number(form.hourly_rate)
    : Number(form.total_earned) || 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.IncomeEntry.create({
        ...form,
        hours_worked: Number(form.hours_worked),
        hourly_rate: Number(form.hourly_rate) || 0,
        total_earned: computedTotal,
      });
      setOpen(false);
      setForm({
        date: todayStr(),
        shift_type: "evening",
        hours_worked: "",
        hourly_rate: "",
        total_earned: "",
        notes: "",
      });
      if (onAdded) onAdded();
    } catch (err) {
      notifyError(err, "שמירת המשמרת נכשלה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full h-10 px-4 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 ml-1" />
          משמרת חדשה
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת משמרת</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs font-semibold">תאריך</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold">סוג משמרת</Label>
            <Select value={form.shift_type} onValueChange={(v) => setForm({ ...form, shift_type: v })}>
              <SelectTrigger className="mt-1 h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(shiftLabels).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">שעות עבודה</Label>
              <Input
                type="number"
                value={form.hours_worked}
                onChange={(e) => setForm({ ...form, hours_worked: e.target.value })}
                placeholder="6"
                className="mt-1 h-10 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">שכר לשעה</Label>
              <Input
                type="number"
                value={form.hourly_rate}
                onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                placeholder="35"
                className="mt-1 h-10 rounded-xl"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold">או: סה״כ הכנסה ידנית</Label>
            <Input
              type="number"
              value={form.total_earned}
              onChange={(e) => setForm({ ...form, total_earned: e.target.value })}
              placeholder="לא חובה"
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          {computedTotal > 0 && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
              <p className="text-xs text-muted-foreground">סה״כ</p>
              <p className="text-xl font-bold text-primary">₪{computedTotal.toLocaleString()}</p>
            </div>
          )}
          <div>
            <Label className="text-xs font-semibold">הערות</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="אופציונלי"
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={!form.hours_worked || saving}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            שמור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}