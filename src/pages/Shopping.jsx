import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Check, Trash2, Plus, ShoppingCart, CheckCheck, RotateCcw, Pencil } from "lucide-react";
import AddItemSheet from "@/components/shopping/AddItemSheet";
import ShoppingInsights from "@/components/shopping/ShoppingInsights";
import EditItemInline from "@/components/shopping/EditItemInline";
import RestockSuggestions from "@/components/shopping/RestockSuggestions";
import { notifyError } from "@/lib/notify";
import PageHeader from "@/components/layout/PageHeader";

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

export default function Shopping() {
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState("current");
  const [editingId, setEditingId] = useState(null);
  const queryClient = useQueryClient();

  const PENDING_KEY = ["shopping-items", "pending"];
  const PURCHASED_KEY = ["shopping-items", "purchased"];

  // Two queries instead of one capped list: the open list never gets pushed out by a long history.
  const { data: pendingItems = [] } = useQuery({
    queryKey: PENDING_KEY,
    queryFn: () => base44.entities.ShoppingItem.filter({ is_purchased: false }, "-created_date", 500),
  });

  // Checked items: both "in the cart" (no session yet) and finalized history
  const { data: purchasedItems = [] } = useQuery({
    queryKey: PURCHASED_KEY,
    queryFn: () => base44.entities.ShoppingItem.filter({ is_purchased: true }, "-purchased_at", 500),
  });

  const checkedItems = purchasedItems.filter(i => !i.purchase_session_id);
  const historyItems = purchasedItems.filter(i => !!i.purchase_session_id);
  const activeItems = [...pendingItems, ...checkedItems];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["shopping-items"] });

  // Optimistically moves an item between the pending and purchased caches.
  const moveOptimistic = async (item, patch, from, to) => {
    await queryClient.cancelQueries({ queryKey: ["shopping-items"] });
    const prevFrom = queryClient.getQueryData(from);
    const prevTo = queryClient.getQueryData(to);
    queryClient.setQueryData(from, (old = []) => old.filter(i => i.id !== item.id));
    queryClient.setQueryData(to, (old = []) => [{ ...item, ...patch }, ...old]);
    return { rollback: () => { queryClient.setQueryData(from, prevFrom); queryClient.setQueryData(to, prevTo); } };
  };

  const checkMutation = useMutation({
    mutationFn: ({ item, patch }) => base44.entities.ShoppingItem.update(item.id, patch),
    onMutate: ({ item, patch }) => moveOptimistic(item, patch, PENDING_KEY, PURCHASED_KEY),
    onError: (err, _vars, ctx) => { ctx?.rollback(); notifyError(err, "הסימון נכשל"); },
    onSettled: invalidate,
  });

  const uncheckMutation = useMutation({
    mutationFn: ({ item, patch }) => base44.entities.ShoppingItem.update(item.id, patch),
    onMutate: ({ item, patch }) => moveOptimistic(item, patch, PURCHASED_KEY, PENDING_KEY),
    onError: (err, _vars, ctx) => { ctx?.rollback(); notifyError(err, "ביטול הסימון נכשל"); },
    onSettled: invalidate,
  });

  const checkItem = (item) => checkMutation.mutate({ item, patch: { is_purchased: true, purchased_at: new Date().toISOString() } });
  const uncheckItem = (item) => uncheckMutation.mutate({ item, patch: { is_purchased: false, purchased_at: null } });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ShoppingItem.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["shopping-items"] });
      const prev = queryClient.getQueryData(PENDING_KEY);
      queryClient.setQueryData(PENDING_KEY, (old = []) => old.filter(i => i.id !== id));
      return { rollback: () => queryClient.setQueryData(PENDING_KEY, prev) };
    },
    onError: (err, _id, ctx) => { ctx?.rollback(); notifyError(err, "המחיקה נכשלה"); },
    onSettled: invalidate,
  });

  // Moves the checked items to history as one shopping trip. Unchecked items stay on the list.
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const sid = `session_${Date.now()}`;
      await Promise.all(checkedItems.map(item =>
        base44.entities.ShoppingItem.update(item.id, { purchase_session_id: sid })
      ));
    },
    onError: (err) => notifyError(err, "העברה להיסטוריה נכשלה"),
    onSettled: invalidate,
  });

  const restoreMutation = useMutation({
    mutationFn: (item) => base44.entities.ShoppingItem.update(item.id, {
      is_purchased: false,
      purchased_at: null,
      purchase_session_id: null,
    }),
    onError: (err) => notifyError(err, "ההחזרה נכשלה"),
    onSettled: invalidate,
  });

  // Re-add a past item from the restock suggestions
  const addAgainMutation = useMutation({
    mutationFn: (item) => base44.entities.ShoppingItem.create({
      name: item.name,
      category: item.category || "other",
      quantity: item.quantity || 1,
      unit: item.unit || undefined,
      is_purchased: false,
    }),
    onError: (err) => notifyError(err, "הוספת המוצר נכשלה"),
    onSettled: invalidate,
  });

  // Group pending items by category
  const grouped = pendingItems.reduce((acc, item) => {
    const cat = item.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Group checked items by category
  const checkedGrouped = checkedItems.reduce((acc, item) => {
    const cat = item.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Group history by session
  const sessions = historyItems.reduce((acc, item) => {
    const sid = item.purchase_session_id || "unknown";
    if (!acc[sid]) acc[sid] = { date: item.purchased_at, items: [] };
    acc[sid].items.push(item);
    return acc;
  }, {});
  const sessionList = Object.entries(sessions).sort(([, a], [, b]) => new Date(b.date) - new Date(a.date));

  const tabs = [
    { key: "current", label: "רשימה" },
    { key: "history", label: "היסטוריה" },
    { key: "insights", label: "תובנות" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader icon={ShoppingCart} title="רשימת קניות" subtitle={`${pendingItems.length} ממתינים · ${checkedItems.length} בעגלה`}>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          הוסף
        </button>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* === CURRENT LIST === */}
      {activeTab === "current" && (
        <div className="space-y-4">
          <RestockSuggestions
            historyItems={historyItems}
            activeItems={activeItems}
            onAdd={(item) => addAgainMutation.mutate(item)}
          />
          {activeItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">הרשימה ריקה</p>
              <p className="text-muted-foreground/60 text-xs mt-1">לחץ + כדי להוסיף מוצרים</p>
            </div>
          ) : (
            <>
              {/* Pending items by category */}
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-[10px] tracking-widest text-muted-foreground uppercase mb-2">
                    {CATEGORIES[cat]?.emoji} {CATEGORIES[cat]?.label}
                  </p>
                  <div className="space-y-1.5">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 bg-card border border-border/50 rounded-xl px-3 py-2.5">
                        <button
                          onClick={() => checkItem(item)}
                          className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center flex-shrink-0 hover:border-primary transition-colors"
                        />
                        {editingId === item.id ? (
                          <EditItemInline item={item} onDone={() => setEditingId(null)} />
                        ) : (
                          <>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingId(item.id)}>
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              {(item.quantity > 1 || item.unit) && (
                                <p className="text-xs text-muted-foreground">{item.quantity} {item.unit || "יח׳"}</p>
                              )}
                            </div>
                            <button
                              onClick={() => setEditingId(item.id)}
                              className="text-muted-foreground/30 hover:text-muted-foreground transition-colors p-1"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate(item.id)}
                              className="text-muted-foreground/40 hover:text-destructive transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Checked items */}
              {checkedItems.length > 0 && (
                <div>
                  <p className="text-[10px] tracking-widest text-muted-foreground uppercase mb-2">✓ נסמנו כנקנו</p>
                  <div className="space-y-1.5">
                    {Object.entries(checkedGrouped).map(([cat, items]) =>
                      items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5 opacity-75">
                          <button
                            onClick={() => uncheckItem(item)}
                            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                          >
                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate line-through text-muted-foreground">{item.name}</p>
                            {(item.quantity > 1 || item.unit) && (
                              <p className="text-xs text-muted-foreground">{item.quantity} {item.unit || "יח׳"}</p>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground/60">{CATEGORIES[item.category]?.emoji}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Finalize */}
                  <div className="mt-4">
                    <button
                      onClick={() => finalizeMutation.mutate()}
                      disabled={finalizeMutation.isPending || checkedItems.length === 0}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 transition-opacity"
                    >
                      <CheckCheck className="w-4 h-4" />
                      {finalizeMutation.isPending ? "מעביר..." : `סיימתי — העבר ${checkedItems.length} מוצרים להיסטוריה`}
                    </button>
                    {pendingItems.length > 0 && (
                      <p className="text-[10px] text-muted-foreground text-center mt-1.5">מה שלא סומן יישאר ברשימה</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* === HISTORY === */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {sessionList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              עוד לא סיימתם קנייה
            </div>
          ) : (
            sessionList.map(([sid, session]) => (
              <div key={sid} className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    🛍️ קניה {new Date(session.date).toLocaleDateString("he-IL", { day: "numeric", month: "long" })}
                  </p>
                  <p className="text-xs text-muted-foreground">{session.items.length} מוצרים</p>
                </div>
                <div className="p-3 space-y-1">
                  {session.items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 py-1">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="text-sm flex-1">{item.name}</span>
                      {(item.quantity > 1 || item.unit) && (
                        <span className="text-xs text-muted-foreground">{item.quantity} {item.unit || "יח׳"}</span>
                      )}
                      <button
                        onClick={() => restoreMutation.mutate(item)}
                        className="text-xs text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        החזר
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* === INSIGHTS === */}
      {activeTab === "insights" && (
        <ShoppingInsights history={historyItems} />
      )}

      <AddItemSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => queryClient.invalidateQueries({ queryKey: ["shopping-items"] })}
      />
    </div>
  );
}