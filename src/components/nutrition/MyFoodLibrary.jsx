import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, BookOpen, Pencil, Check, X } from "lucide-react";

const emptyForm = { name: "", brand: "", serving_size_grams: "", calories_per_serving: "", protein_per_serving: "", carbs_per_serving: "", fat_per_serving: "" };

export default function MyFoodLibrary() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["food-products"],
    queryFn: () => base44.entities.FoodProduct.list("-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FoodProduct.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-products"] });
      setForm(emptyForm);
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FoodProduct.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-products"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FoodProduct.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["food-products"] }),
  });

  const handleSave = () => {
    if (!form.name || !form.calories_per_serving) return;
    createMutation.mutate({
      name: form.name,
      brand: form.brand || undefined,
      serving_size_grams: Number(form.serving_size_grams) || undefined,
      calories_per_serving: Number(form.calories_per_serving),
      protein_per_serving: Number(form.protein_per_serving) || 0,
      carbs_per_serving: Number(form.carbs_per_serving) || 0,
      fat_per_serving: Number(form.fat_per_serving) || 0,
    });
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({
      name: p.name || "",
      brand: p.brand || "",
      serving_size_grams: p.serving_size_grams || "",
      calories_per_serving: p.calories_per_serving || "",
      protein_per_serving: p.protein_per_serving || "",
      carbs_per_serving: p.carbs_per_serving || "",
      fat_per_serving: p.fat_per_serving || "",
    });
  };

  const handleUpdate = () => {
    if (!editForm.name || !editForm.calories_per_serving) return;
    updateMutation.mutate({
      id: editingId,
      data: {
        name: editForm.name,
        brand: editForm.brand || undefined,
        serving_size_grams: Number(editForm.serving_size_grams) || undefined,
        calories_per_serving: Number(editForm.calories_per_serving),
        protein_per_serving: Number(editForm.protein_per_serving) || 0,
        carbs_per_serving: Number(editForm.carbs_per_serving) || 0,
        fat_per_serving: Number(editForm.fat_per_serving) || 0,
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">המאגר שלי</h3>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{products.length}</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-primary font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          הוסף מוצר
        </button>
      </div>

      {showForm && (
        <div className="p-3 rounded-xl bg-accent/30 border border-accent/50 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] font-semibold">שם המוצר *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="לדוגמה: קוטג׳ 5%" className="mt-0.5 h-9 rounded-lg text-sm" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">מותג / מקור</Label>
              <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="תנובה, טרה..." className="mt-0.5 h-9 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] font-semibold">גודל מנה (גרם)</Label>
              <Input type="number" value={form.serving_size_grams} onChange={e => setForm({ ...form, serving_size_grams: e.target.value })} placeholder="100" className="mt-0.5 h-9 rounded-lg text-sm" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">קלוריות למנה *</Label>
              <Input type="number" value={form.calories_per_serving} onChange={e => setForm({ ...form, calories_per_serving: e.target.value })} placeholder="0" className="mt-0.5 h-9 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px] font-semibold">חלבון (ג׳)</Label>
              <Input type="number" value={form.protein_per_serving} onChange={e => setForm({ ...form, protein_per_serving: e.target.value })} placeholder="0" className="mt-0.5 h-9 rounded-lg text-sm" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">פחמימות (ג׳)</Label>
              <Input type="number" value={form.carbs_per_serving} onChange={e => setForm({ ...form, carbs_per_serving: e.target.value })} placeholder="0" className="mt-0.5 h-9 rounded-lg text-sm" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold">שומן (ג׳)</Label>
              <Input type="number" value={form.fat_per_serving} onChange={e => setForm({ ...form, fat_per_serving: e.target.value })} placeholder="0" className="mt-0.5 h-9 rounded-lg text-sm" />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={!form.name || !form.calories_per_serving || createMutation.isPending}
            className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            שמור מוצר
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : products.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">המאגר ריק — הוסיפי מוצרים שאת אוכלת לעיתים קרובות</p>
      ) : (
        <div className="space-y-1.5">
          {products.map(p => (
            <div key={p.id} className="rounded-xl bg-muted/40 overflow-hidden">
              {editingId === p.id ? (
                <div className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] font-semibold">שם *</Label>
                      <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="mt-0.5 h-8 rounded-lg text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] font-semibold">מותג</Label>
                      <Input value={editForm.brand} onChange={e => setEditForm({ ...editForm, brand: e.target.value })} className="mt-0.5 h-8 rounded-lg text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] font-semibold">גרם למנה</Label>
                      <Input type="number" value={editForm.serving_size_grams} onChange={e => setEditForm({ ...editForm, serving_size_grams: e.target.value })} className="mt-0.5 h-8 rounded-lg text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] font-semibold">קלוריות *</Label>
                      <Input type="number" value={editForm.calories_per_serving} onChange={e => setEditForm({ ...editForm, calories_per_serving: e.target.value })} className="mt-0.5 h-8 rounded-lg text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px] font-semibold">חלבון</Label>
                      <Input type="number" value={editForm.protein_per_serving} onChange={e => setEditForm({ ...editForm, protein_per_serving: e.target.value })} className="mt-0.5 h-8 rounded-lg text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] font-semibold">פחמימות</Label>
                      <Input type="number" value={editForm.carbs_per_serving} onChange={e => setEditForm({ ...editForm, carbs_per_serving: e.target.value })} className="mt-0.5 h-8 rounded-lg text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] font-semibold">שומן</Label>
                      <Input type="number" value={editForm.fat_per_serving} onChange={e => setEditForm({ ...editForm, fat_per_serving: e.target.value })} className="mt-0.5 h-8 rounded-lg text-xs" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdate}
                      disabled={updateMutation.isPending}
                      className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      שמור
                    </button>
                    <button onClick={() => setEditingId(null)} className="h-8 px-3 rounded-lg bg-muted text-xs font-semibold flex items-center gap-1">
                      <X className="w-3 h-3" /> ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5">
                  <div>
                    <p className="text-xs font-semibold">{p.name} {p.brand ? <span className="text-muted-foreground font-normal">· {p.brand}</span> : null}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.calories_per_serving} קק״ל
                      {p.serving_size_grams ? ` / ${p.serving_size_grams}ג׳` : ""}
                      {p.protein_per_serving ? ` · חל׳ ${p.protein_per_serving}ג׳` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}