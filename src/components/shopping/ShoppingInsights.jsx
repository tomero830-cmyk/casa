import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { notifyError } from "@/lib/notify";

export default function ShoppingInsights({ history }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const generateInsights = async () => {
    if (insights) { setExpanded(e => !e); return; }
    setLoading(true);

    // Build summary of purchase history
    const sessions = {};
    history.forEach(item => {
      if (item.purchase_session_id && item.purchased_at) {
        if (!sessions[item.purchase_session_id]) {
          sessions[item.purchase_session_id] = { date: item.purchased_at, items: [] };
        }
        sessions[item.purchase_session_id].items.push(item.name);
      }
    });

    const sessionList = Object.values(sessions).sort((a, b) => new Date(a.date) - new Date(b.date));

    let result;
    try {
    result = await base44.integrations.Core.InvokeLLM({
      prompt: `אתה עוזר ביתי חכם לזוג ישראלי. בהתבסס על היסטוריית הקניות הבאה, תן המלצות:
      
היסטוריית קניות (${sessionList.length} קניות):
${sessionList.map((s, i) => `קניה ${i + 1} (${new Date(s.date).toLocaleDateString("he-IL")}): ${s.items.join(", ")}`).join("\n")}

ענה בעברית ותן:
1. כמה ימים בין קניות בממוצע
2. המוצרים שנקנים הכי הרבה וכמות מומלצת
3. מוצרים שנגמרים מהר ושווה לקנות כפול
4. המלצה לתדירות קניות מיטבית

כתוב בצורה קצרה וידידותית, עד 150 מילים.`,
      response_json_schema: {
        type: "object",
        properties: {
          avg_days_between_trips: { type: "number" },
          recommendation: { type: "string" },
          frequent_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                suggested_quantity: { type: "string" }
              }
            }
          }
        }
      }
    });
    } catch (err) {
      notifyError(err, "יצירת התובנות נכשלה");
      setLoading(false);
      return;
    }

    setInsights(result);
    setExpanded(true);
    setLoading(false);
  };

  const sessionCount = new Set(history.filter(i => i.purchase_session_id).map(i => i.purchase_session_id)).size;

  if (sessionCount < 2) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-2xl text-xs text-muted-foreground">
        <Sparkles className="w-3.5 h-3.5" />
        <span>אחרי 2 קניות, AI יוכל לנתח את ההרגלים שלכם</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-accent/30 overflow-hidden">
      <button
        onClick={generateInsights}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">תובנות קניות חכמות</span>
        </div>
        {loading ? (
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && insights && (
        <div className="px-4 pb-4 space-y-3 border-t border-primary/10">
          {insights.avg_days_between_trips && (
            <div className="flex items-center gap-2 pt-3">
              <span className="text-2xl font-bold text-primary">{Math.round(insights.avg_days_between_trips)}</span>
              <span className="text-xs text-muted-foreground">ימים בין קניה לקניה בממוצע</span>
            </div>
          )}

          {insights.frequent_items?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">מוצרים שכדאי תמיד להביא:</p>
              <div className="flex flex-wrap gap-1.5">
                {insights.frequent_items.map((item, i) => (
                  <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                    {item.name} {item.suggested_quantity && `· ${item.suggested_quantity}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {insights.recommendation && (
            <p className="text-xs text-foreground/70 leading-relaxed border-t border-border/50 pt-3">
              {insights.recommendation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}