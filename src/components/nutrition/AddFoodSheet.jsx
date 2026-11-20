import { useState, useRef, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, Sparkles, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { notifyError } from "@/lib/notify";

const mealOptions = [
  { value: "breakfast", label: "ארוחת בוקר 🌅" },
  { value: "lunch", label: "ארוחת צהריים ☀️" },
  { value: "dinner", label: "ארוחת ערב 🌙" },
  { value: "snack", label: "חטיף 🍎" },
];

export default function AddFoodSheet({ open, onClose, date, onAdded }) {
  const fileInputRef = useRef(null);
  const [mealType, setMealType] = useState("lunch");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  // Manual form
  const [manualForm, setManualForm] = useState({
    food_name: "",
    amount_grams: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  // AI result (shared between tabs)
  const [aiItems, setAiItems] = useState([]);
  const [aiDone, setAiDone] = useState(false);

  // Library
  const [librarySearch, setLibrarySearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [libraryGrams, setLibraryGrams] = useState("");

  const { data: foodProducts = [] } = useQuery({
    queryKey: ["food-products"],
    queryFn: () => base44.entities.FoodProduct.list("-created_date", 100),
  });

  const filteredProducts = useMemo(() => {
    if (!librarySearch) return foodProducts;
    return foodProducts.filter(p => p.name.toLowerCase().includes(librarySearch.toLowerCase()) || (p.brand || "").toLowerCase().includes(librarySearch.toLowerCase()));
  }, [foodProducts, librarySearch]);

  const resetAll = () => {
    setPhotoUrl("");
    setManualForm({ food_name: "", amount_grams: "", calories: "", protein: "", carbs: "", fat: "" });
    setAiItems([]);
    setAiDone(false);
    setMealType("lunch");
    setLibrarySearch("");
    setSelectedProduct(null);
    setLibraryGrams("");
  };

  const saveFromLibrary = async () => {
    if (!selectedProduct) return;
    const grams = parseFloat(libraryGrams);
    const refGrams = selectedProduct.serving_size_grams || 100;
    const ratio = grams / refGrams;
    setSaving(true);
    try {
    await base44.entities.FoodEntry.create({
      date,
      meal_type: mealType,
      food_name: selectedProduct.name + (selectedProduct.brand ? ` (${selectedProduct.brand})` : ""),
      amount_grams: grams,
      calories: Math.round((selectedProduct.calories_per_serving || 0) * ratio),
      protein: Math.round((selectedProduct.protein_per_serving || 0) * ratio * 10) / 10,
      carbs: Math.round((selectedProduct.carbs_per_serving || 0) * ratio * 10) / 10,
      fat: Math.round((selectedProduct.fat_per_serving || 0) * ratio * 10) / 10,
      ai_analyzed: false,
    });
    } catch (err) {
      notifyError(err, "השמירה נכשלה");
      return;
    } finally {
      setSaving(false);
    }
    onAdded();
    handleClose();
  };

  const handleClose = () => { resetAll(); onClose(); };

  // ---- Photo upload + AI ----
  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
    } catch (err) {
      notifyError(err, "העלאת התמונה נכשלה");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const analyzePhoto = async () => {
    setAnalyzing(true);
    setAiDone(false);
    let result;
    try {
    result = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      prompt: `אתה דיאטן מוסמך. נתח את תמונת האוכל והחזר רשימת מרכיבים עם ערכים תזונתיים.
      זהה כל פריט אוכל בתמונה, הערך את הכמות הסבירה בגרמים, והחזר ערכים תזונתיים מדויקים.
      אם לא ניתן לזהות, תן הערכה הגיונית.`,
      file_urls: [photoUrl],
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                food_name: { type: "string" },
                amount_grams: { type: "number" },
                calories: { type: "number" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
              }
            }
          },
          total_calories: { type: "number" },
          notes: { type: "string" }
        }
      }
    });
    } catch (err) {
      notifyError(err, "ניתוח התמונה נכשל");
      setAnalyzing(false);
      return;
    }
    setAiItems(result?.items || []);
    setAiDone(true);
    setAnalyzing(false);
  };

  // ---- AI text analysis ----
  const [textQuery, setTextQuery] = useState("");
  const [textGrams, setTextGrams] = useState("");

  const analyzeText = async () => {
    if (!textQuery) return;
    setAnalyzing(true);
    setAiDone(false);
    let result;
    try {
    result = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      prompt: `אתה דיאטן מוסמך. חשב ערכים תזונתיים עבור: "${textQuery}"${textGrams ? ` — ${textGrams} גרם` : ""}.
      תן ערכים מדויקים ומפורטים.`,
      response_json_schema: {
        type: "object",
        properties: {
          food_name: { type: "string" },
          amount_grams: { type: "number" },
          calories: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" },
        }
      }
    });
    } catch (err) {
      notifyError(err, "החיפוש נכשל");
      setAnalyzing(false);
      return;
    }
    setAiItems([result]);
    setAiDone(true);
    setAnalyzing(false);
  };

  // ---- Save ----
  const saveManual = async () => {
    setSaving(true);
    try {
    await base44.entities.FoodEntry.create({
      date,
      meal_type: mealType,
      food_name: manualForm.food_name,
      amount_grams: Number(manualForm.amount_grams) || 0,
      calories: Number(manualForm.calories) || 0,
      protein: Number(manualForm.protein) || 0,
      carbs: Number(manualForm.carbs) || 0,
      fat: Number(manualForm.fat) || 0,
      ai_analyzed: false,
    });
    } catch (err) {
      notifyError(err, "השמירה נכשלה");
      return;
    } finally {
      setSaving(false);
    }
    onAdded();
    handleClose();
  };

  const saveAiItems = async () => {
    setSaving(true);
    try {
    await base44.entities.FoodEntry.bulkCreate(
      aiItems.map(item => ({
        date,
        meal_type: mealType,
        food_name: item.food_name,
        amount_grams: item.amount_grams || 0,
        calories: item.calories || 0,
        protein: item.protein || 0,
        carbs: item.carbs || 0,
        fat: item.fat || 0,
        photo_url: photoUrl || "",
        ai_analyzed: true,
      }))
    );
    } catch (err) {
      notifyError(err, "השמירה נכשלה");
      return;
    } finally {
      setSaving(false);
    }
    onAdded();
    handleClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto" dir="rtl">
        <SheetHeader className="pb-2">
          <SheetTitle>הוספת אוכל</SheetTitle>
        </SheetHeader>

        {/* Meal type selector */}
        <div className="mb-4">
          <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">ארוחה</Label>
          <Select value={mealType} onValueChange={setMealType}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mealOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="library" dir="rtl">
          <TabsList className="w-full bg-muted rounded-xl h-9 mb-4">
            <TabsTrigger value="library" className="flex-1 text-xs rounded-lg">המאגר שלי</TabsTrigger>
            <TabsTrigger value="ai-text" className="flex-1 text-xs rounded-lg">חיפוש AI</TabsTrigger>
            <TabsTrigger value="photo" className="flex-1 text-xs rounded-lg">תמונה</TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 text-xs rounded-lg">ידני</TabsTrigger>
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-3">
            <Input
              placeholder="חפשי מוצר מהמאגר..."
              value={librarySearch}
              onChange={e => setLibrarySearch(e.target.value)}
              className="h-10 rounded-xl"
            />
            {filteredProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                {foodProducts.length === 0 ? "המאגר ריק — הוסיפי מוצרים דרך כפתור ״המאגר שלי״ בדף התזונה" : "לא נמצאו תוצאות"}
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(selectedProduct?.id === p.id ? null : p)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-right transition-colors ${selectedProduct?.id === p.id ? "border-primary bg-primary/5" : "border-border/50 bg-muted/30 hover:bg-muted/60"}`}
                  >
                    <div>
                      <p className="text-xs font-semibold">{p.name} {p.brand ? <span className="text-muted-foreground font-normal">· {p.brand}</span> : null}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.calories_per_serving} קק״ל
                        {p.serving_size_grams ? ` / ${p.serving_size_grams}ג׳` : " / מנה"}
                        {p.protein_per_serving ? ` · חל׳ ${p.protein_per_serving}ג׳` : ""}
                      </p>
                    </div>
                    {selectedProduct?.id === p.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            )}
            {selectedProduct && (
              <div className="space-y-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-xs font-semibold">{selectedProduct.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  מנת ייחוס: {selectedProduct.calories_per_serving} קק״ל
                  {selectedProduct.serving_size_grams ? ` / ${selectedProduct.serving_size_grams}ג׳` : ""}
                </p>
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] shrink-0">כמה גרם אכלת?</Label>
                  <Input
                    type="number"
                    value={libraryGrams}
                    onChange={e => setLibraryGrams(e.target.value)}
                    placeholder={String(selectedProduct.serving_size_grams || 100)}
                    className="h-8 rounded-lg text-sm w-24"
                    autoFocus
                  />
                  <p className="text-xs font-bold text-primary">
                    {libraryGrams && selectedProduct.serving_size_grams
                      ? `${Math.round(selectedProduct.calories_per_serving * parseFloat(libraryGrams) / selectedProduct.serving_size_grams)} קק״ל`
                      : "—"}
                  </p>
                </div>
                <button
                  onClick={saveFromLibrary}
                  disabled={saving || !libraryGrams || parseFloat(libraryGrams) <= 0}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  הוסף לרשומות
                </button>
              </div>
            )}
          </TabsContent>

          {/* AI Text Tab */}
          <TabsContent value="ai-text" className="space-y-3">
            <div className="space-y-2">
              <Input
                placeholder="מה אכלת? לדוגמה: חומוס, פיתה, שקד"
                value={textQuery}
                onChange={e => setTextQuery(e.target.value)}
                className="h-11 rounded-xl"
                onKeyDown={e => e.key === "Enter" && analyzeText()}
              />
              <Input
                placeholder="כמה גרם? (אופציונלי)"
                type="number"
                value={textGrams}
                onChange={e => setTextGrams(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <button
              onClick={analyzeText}
              disabled={!textQuery || analyzing}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {analyzing ? "מחשב קלוריות..." : "חשב קלוריות"}
            </button>
            {aiDone && aiItems.length > 0 && <AiResultList items={aiItems} onSave={saveAiItems} saving={saving} />}
          </TabsContent>

          {/* Photo Tab */}
          <TabsContent value="photo" className="space-y-3">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { fileInputRef.current.setAttribute("capture", "environment"); fileInputRef.current.click(); }}
                disabled={uploading}
                className="h-16 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Camera className="w-5 h-5" />
                צלם
              </button>
              <button
                onClick={() => { fileInputRef.current.removeAttribute("capture"); fileInputRef.current.click(); }}
                disabled={uploading}
                className="h-16 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Upload className="w-5 h-5" />
                העלה
              </button>
            </div>
            {uploading && <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="w-4 h-4 animate-spin" />מעלה תמונה...</div>}
            {photoUrl && !uploading && (
              <>
                <img src={photoUrl} alt="אוכל" className="w-full h-44 object-cover rounded-xl" />
                <button
                  onClick={analyzePhoto}
                  disabled={analyzing}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {analyzing ? "מנתח תמונה..." : "נתח עם AI"}
                </button>
              </>
            )}
            {aiDone && aiItems.length > 0 && <AiResultList items={aiItems} onSave={saveAiItems} saving={saving} />}
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual" className="space-y-3">
            <div className="space-y-2">
              <div>
                <Label className="text-xs font-semibold">שם המזון</Label>
                <Input value={manualForm.food_name} onChange={e => setManualForm({ ...manualForm, food_name: e.target.value })} placeholder="לדוגמה: אורז לבן" className="mt-1 h-10 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold">גרמים</Label>
                  <Input type="number" value={manualForm.amount_grams} onChange={e => setManualForm({ ...manualForm, amount_grams: e.target.value })} placeholder="100" className="mt-1 h-10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">קלוריות</Label>
                  <Input type="number" value={manualForm.calories} onChange={e => setManualForm({ ...manualForm, calories: e.target.value })} placeholder="0" className="mt-1 h-10 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs font-semibold">חלבון</Label>
                  <Input type="number" value={manualForm.protein} onChange={e => setManualForm({ ...manualForm, protein: e.target.value })} placeholder="0" className="mt-1 h-10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">פחמימות</Label>
                  <Input type="number" value={manualForm.carbs} onChange={e => setManualForm({ ...manualForm, carbs: e.target.value })} placeholder="0" className="mt-1 h-10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">שומן</Label>
                  <Input type="number" value={manualForm.fat} onChange={e => setManualForm({ ...manualForm, fat: e.target.value })} placeholder="0" className="mt-1 h-10 rounded-xl" />
                </div>
              </div>
            </div>
            <button
              onClick={saveManual}
              disabled={!manualForm.food_name || !manualForm.calories || saving}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              שמור
            </button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function AiResultList({ items, onSave, saving }) {
  const total = items.reduce((s, i) => s + (i.calories || 0), 0);
  return (
    <div className="space-y-2">
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">תוצאות AI</span>
          <span className="text-xs font-bold text-primary mr-auto">סה״כ: {total} קק״ל</span>
        </div>
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="font-medium">{item.food_name} {item.amount_grams > 0 ? `(${item.amount_grams}ג׳)` : ""}</span>
              <span className="font-bold">{item.calories} קק״ל</span>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        הוסף לרשומות
      </button>
    </div>
  );
}