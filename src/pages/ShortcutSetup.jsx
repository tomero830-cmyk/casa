import { useState } from "react";
import { Copy, Check, Footprints, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { appParams } from "@/lib/app-params";
import { useAuth } from "@/lib/AuthContext";

export default function ShortcutSetup() {
  const [copied, setCopied] = useState(null);
  const [openStep, setOpenStep] = useState(1);
  const { user } = useAuth();
  const userEmail = user?.email || "";

  const copyText = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard can be blocked (e.g. in-app browsers); the value stays visible for manual copy.
    }
  };

  // Backend functions are served from the app's own domain (the platform domain rejects them)
  const API_URL = appParams.appBaseUrl
    ? `${appParams.appBaseUrl.replace(/\/$/, "")}/functions/logSteps`
    : `https://base44.app/api/apps/${appParams.appId}/functions/logSteps`;

  const steps = [
    {
      id: 1,
      title: "פתח את אפליקציית Shortcuts באייפון",
      content: (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">אם אין לך — הורד מ-App Store, היא חינמית של Apple.</p>
          <div className="bg-primary/5 rounded-xl p-3 text-xs font-medium text-primary">
            לחץ על <strong>+</strong> בפינה הימנית עליונה כדי ליצור קיצור חדש
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'הוסף פעולה: "Find Health Samples" — שלוש פעמים',
      content: (
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground text-xs">חפש "Health" בחיפוש הפעולות, בחר <strong>Find Health Samples (Quantity)</strong></p>

          <div className="space-y-2">
            <p className="font-semibold text-xs text-primary">פעולה 1 — צעדים:</p>
            <div className="bg-muted rounded-xl p-3 text-xs space-y-1">
              <p>• <strong>Type:</strong> Steps</p>
              <p>• <strong>Include samples from:</strong> Today</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-xs text-[hsl(var(--tone-gold-fg))]">פעולה 2 — קלוריות פעילות:</p>
            <p className="text-muted-foreground text-xs">הוסף <strong>עוד</strong> פעולה של Find Health Samples:</p>
            <div className="bg-muted rounded-xl p-3 text-xs space-y-1">
              <p>• <strong>Type:</strong> Active Energy Burned</p>
              <p>• <strong>Include samples from:</strong> Today</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-xs text-[hsl(var(--tone-brown-fg))]">פעולה 3 — קלוריות מנוחה (BMR):</p>
            <p className="text-muted-foreground text-xs">הוסף <strong>עוד</strong> פעולה של Find Health Samples:</p>
            <div className="bg-muted rounded-xl p-3 text-xs space-y-1">
              <p>• <strong>Type:</strong> Resting Energy Burned</p>
              <p>• <strong>Include samples from:</strong> Today</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'הוסף פעולה: "Calculate Statistics" — שלוש פעמים',
      content: (
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground text-xs">חפש "Statistics" ובחר <strong>Calculate Statistics</strong></p>

          <div className="space-y-2">
            <p className="font-semibold text-xs text-primary">פעולה 1:</p>
            <div className="bg-muted rounded-xl p-3 text-xs space-y-1">
              <p>• <strong>Input:</strong> Health Samples של Steps</p>
              <p>• <strong>Statistic:</strong> Sum</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-xs text-[hsl(var(--tone-gold-fg))]">פעולה 2:</p>
            <div className="bg-muted rounded-xl p-3 text-xs space-y-1">
              <p>• <strong>Input:</strong> Health Samples של Active Energy</p>
              <p>• <strong>Statistic:</strong> Sum</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-xs text-[hsl(var(--tone-brown-fg))]">פעולה 3:</p>
            <div className="bg-muted rounded-xl p-3 text-xs space-y-1">
              <p>• <strong>Input:</strong> Health Samples של Resting Energy</p>
              <p>• <strong>Statistic:</strong> Sum</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: "אימונים מהשעון: הליכה בפנים וריצה (לא חובה)",
      content: (
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground text-xs">טיפ: באייפון בעברית, כדאי להעביר רק את אפליקציית הקיצורים לאנגלית (הגדרות ← אפליקציות ← קיצורים ← שפה), כדי שהשמות כאן יתאימו בדיוק.</p>
          <p className="text-muted-foreground text-xs">כך האפליקציה יודעת כמה זמן הלכת בהליכה בפנים, ומציבה יעד של 10% יותר מהממוצע שלך.</p>

          <div className="space-y-2">
            <p className="font-semibold text-xs text-primary">א. מציאת ההליכה של היום</p>
            <div className="bg-muted rounded-xl p-3 text-xs space-y-1">
              <p>• הוסף פעולה <strong>Find Workouts</strong></p>
              <p>• <strong>Add Filter:</strong> Type is <strong>Walking</strong></p>
              <p>• <strong>Add Filter:</strong> Start Date is <strong>Today</strong></p>
              <p>• <strong>Sort by:</strong> Start Date · <strong>Latest First</strong> · <strong>Limit:</strong> 1</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-xs text-primary">ב. הפרטים של ההליכה</p>
            <div className="bg-muted rounded-xl p-3 text-xs space-y-1">
              <p>• הוסף <strong>Get Details of Workouts</strong> ← בחר <strong>Duration</strong></p>
              <p>• הוסף <strong>Convert Measurement</strong> ← ל-<strong>minutes</strong> (זה ה"זמן הליכה")</p>
              <p>• הוסף עוד <strong>Get Details of Workouts</strong> ← <strong>Distance</strong>, ואחר כך עוד אחד ← <strong>Start Date</strong></p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-xs text-primary">ג. צעדים בזמן ההליכה (בונוס)</p>
            <div className="bg-muted rounded-xl p-3 text-xs space-y-1">
              <p>• הוסף <strong>Find Health Samples</strong>: Type <strong>Steps</strong></p>
              <p>• Filter: Start Date is after ← ה-<strong>Start Date</strong> של האימון</p>
              <p>• Filter: End Date is before ← ה-<strong>End Date</strong> של האימון</p>
              <p>• הוסף <strong>Calculate Statistics</strong> ← <strong>Sum</strong></p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-xs text-primary">ד. ריצה (אותו דבר, לריצות)</p>
            <div className="bg-muted rounded-xl p-3 text-xs space-y-1">
              <p>• עוד <strong>Find Workouts</strong> עם Type <strong>Running</strong>, מהיום, Latest First, Limit 1</p>
              <p>• <strong>Duration</strong> ← <strong>Convert Measurement</strong> לדקות, <strong>Distance</strong> (בק״מ), ו-<strong>Start Date</strong></p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">בימים בלי אימון הערכים יישלחו ריקים, והאפליקציה פשוט תתעלם מהם.</p>
        </div>
      ),
    },
    {
      id: 5,
      title: 'הוסף פעולה: "Get Contents of URL"',
      content: (
        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold">כתובת ה-URL (לחץ להעתקה):</p>
            <button
              onClick={() => copyText(API_URL, "url")}
              className="w-full flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5 text-xs font-mono"
            >
              <span className="truncate text-foreground/70 flex-1 text-left" dir="ltr">{API_URL}</span>
              {copied === "url"
                ? <Check className="w-4 h-4 text-primary shrink-0" />
                : <Copy className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <p>• שנה את <strong>Method</strong> ל: <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">POST</span></p>
            <p>• שנה את <strong>Request Body</strong> ל: <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">JSON</span></p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold">הוסף את השדות הבאים ל-JSON:</p>
            <div className="bg-muted rounded-xl p-3 text-xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-primary shrink-0">"steps"</span>
                <span className="text-muted-foreground text-right">→ בחר "Calculated Result" של Steps</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[hsl(var(--tone-gold-fg))] shrink-0">"calories_burned"</span>
                <span className="text-muted-foreground text-right">→ "Calculated Result" של Active Energy</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[hsl(var(--tone-brown-fg))] shrink-0">"resting_calories"</span>
                <span className="text-muted-foreground text-right">→ "Calculated Result" של Resting Energy</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-primary shrink-0">"date"</span>
                <span className="text-muted-foreground text-right">→ Current Date, פורמט: YYYY-MM-DD</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-primary shrink-0">"user_email"</span>
                <button onClick={() => copyText(userEmail, "email")} className="text-muted-foreground flex items-center gap-1" dir="ltr">
                  {userEmail}
                  {copied === "email" ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-primary shrink-0">"secret"</span>
                <span className="text-muted-foreground text-right">← ראה למטה</span>
              </div>
              <div className="pt-2 mt-1 border-t border-border/60 text-[11px] text-muted-foreground">שדות האימונים מהשעון (משלב 4):</div>
              {[
                ["walk_minutes", "התוצאה של Convert Measurement (דקות)"],
                ["walk_steps", "Calculated Result של צעדי ההליכה"],
                ["walk_distance_km", "Distance של האימון"],
                ["walk_start", "Start Date של האימון"],
                ["run_minutes", "דקות הריצה (Convert Measurement)"],
                ["run_distance_km", "Distance של הריצה"],
                ["run_start", "Start Date של הריצה"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-2">
                  <span className="font-mono text-primary shrink-0">"{k}"</span>
                  <span className="text-muted-foreground text-right">→ {v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Secret note */}
          <div className="rounded-xl bg-[hsl(var(--tone-gold-bg))] border border-[hsl(var(--tone-gold-mid))] p-3 text-xs space-y-1">
            <p className="font-semibold text-[hsl(var(--tone-gold-fg))]">🔑 איפה מוצאים את ה-Secret?</p>
            <p className="text-[hsl(var(--tone-gold-fg))]">
              זה הקוד הסודי שנוצר בהגדרת השרת (SHORTCUTS_SECRET). מי שהגדיר את האפליקציה שולח אותו,<br />
              ומדביקים אותו בשדה "secret". בלעדיו השרת לא יקבל את הנתונים.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 6,
      title: "הגדר אוטומציה יומית בחצות",
      content: (
        <div className="space-y-3 text-sm">
          <div className="bg-muted rounded-xl p-3 text-xs space-y-1.5">
            <p>1. לך ל-<strong>Automation</strong> (הלשונית האמצעית למטה)</p>
            <p>2. לחץ <strong>+</strong> ← <strong>New Automation</strong></p>
            <p>3. בחר <strong>Time of Day</strong></p>
            <p>4. הגדר שעה: <strong>23:55</strong> ← Daily</p>
            <p>5. לחץ <strong>Next</strong> ← בחר את הקיצור שיצרת</p>
            <p>6. <strong>כבה</strong> את "Ask Before Running"</p>
          </div>
          <p className="text-xs text-muted-foreground">כך הקיצור ירוץ אוטומטית כל לילה ויעדכן את הנתונים 🎉</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-12">
      <div className="pt-2">
        <h2 className="text-3xl font-playfair italic font-light">Apple Health סנכרון</h2>
        <p className="text-xs text-muted-foreground mt-1.5 tracking-wide">הגדרת קיצור דרך לסנכרון אוטומטי</p>
      </div>

      {/* What it does */}
      <div className="surface p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">מה הקיצור עושה?</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Footprints className="w-4 h-4 text-primary" />
            </div>
            <span>שולח צעדים יומיים</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--tone-gold-bg))] flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-[hsl(var(--tone-gold))]" />
            </div>
            <span>שולח קלוריות שרופות (פעילות + מנוחה)</span>
          </div>
        </div>
      </div>

      {/* Accordion Steps */}
      <div className="space-y-2">
        <p className="text-[10px] tracking-widest text-muted-foreground uppercase">שלבי ההגדרה</p>
        {steps.map((step) => (
          <div key={step.id} className="surface overflow-hidden">
            <button
              onClick={() => setOpenStep(openStep === step.id ? null : step.id)}
              className="w-full flex items-center justify-between p-4 text-right"
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${openStep === step.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {step.id}
                </div>
                <p className="text-sm font-medium">{step.title}</p>
              </div>
              {openStep === step.id
                ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>
            {openStep === step.id && (
              <div className="px-4 pb-4 border-t border-border/30 pt-3">
                {step.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Note for other household members */}
      <div className="rounded-2xl bg-accent/30 border border-accent/50 p-4">
        <p className="text-xs font-medium mb-1">💡 לשאר בני הבית</p>
        <p className="text-xs text-muted-foreground">
          כל אחד יוצר קיצור משלו באייפון שלו. כדי לקבל את המייל הנכון בשדה <strong>user_email</strong>, פותחים את הדף הזה כשמחוברים מהחשבון שלו.
        </p>
      </div>
    </div>
  );
}