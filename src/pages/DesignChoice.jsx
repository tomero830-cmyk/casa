import { useState } from "react";
import { Palette, Check, Send } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { THEMES, applyTheme, getTheme } from "@/lib/theme";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

const ICONS = [
  { id: "1", name: "גג, ארובה ועלה" },
  { id: "2", name: "קשת ומונוגרמה" },
  { id: "3", name: "בית ועלים" },
  { id: "4", name: "ירוק עם חלון" },
];

const QUESTIONS = [
  { id: "feel", q: "איך האפליקציה צריכה להרגיש?", options: ["רגועה ושקטה", "מקצועית וחדה", "חמימה וביתית", "שמחה ותוססת"] },
  { id: "background", q: "איזה רקע נעים לך?", options: ["בהיר מאוד, כמעט לבן", "בז' חמים", "כהה"] },
  { id: "lead", q: "איזה צבע יוביל?", options: ["ירוק", "חום", "ניטרלי (שחור-לבן)", "משהו אחר"] },
  { id: "density", q: "כמה מידע במסך אחד?", options: ["מעט ובגדול", "מאוזן", "הרבה, הכל במבט אחד"] },
  { id: "font", q: "איזה סגנון כתב?", options: ["מודרני ונקי", "קלאסי ואלגנטי", "עגול ורך"] },
  { id: "motion", q: "כמה תנועה ואנימציה?", options: ["כמעט בלי", "עדינה", "הרבה, שיהיה חי"] },
  { id: "home", q: "מה הכי חשוב לראות כשפותחים את האפליקציה?", multi: true, options: ["קלוריות היום", "הליכה והיעד", "אימון כוח", "משקל ותחזית", "רשימת קניות", "צעדים"] },
];

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3.5 py-2 rounded-full text-sm transition-colors border",
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/50"
      )}
    >
      {children}
    </button>
  );
}

/** Lets a household member try the themes live, pick an icon, answer design questions and share the result. */
export default function DesignChoice() {
  const [theme, setTheme] = useState(getTheme());
  const [icon, setIcon] = useState(null);
  const [answers, setAnswers] = useState({});
  const [extra, setExtra] = useState("");

  const chooseTheme = (id) => setTheme(applyTheme(id));
  const toggle = (q, option) => setAnswers(prev => {
    if (!q.multi) return { ...prev, [q.id]: option };
    const current = prev[q.id] || [];
    return { ...prev, [q.id]: current.includes(option) ? current.filter(o => o !== option) : [...current, option] };
  });

  const summary = () => {
    const lines = [
      "בחירות עיצוב ל-Casa",
      `ערכת צבעים: ${THEMES.find(t => t.id === theme)?.name}`,
      `אייקון: ${icon ? `${icon} · ${ICONS.find(i => i.id === icon)?.name}` : "לא נבחר"}`,
      ...QUESTIONS.map(q => {
        const a = answers[q.id];
        return `${q.q} ${Array.isArray(a) ? (a.length ? a.join(", ") : "—") : a || "—"}`;
      }),
    ];
    if (extra.trim()) lines.push(`עוד: ${extra.trim()}`);
    return lines.join("\n");
  };

  const send = async () => {
    const text = summary();
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      notify("הבחירות הועתקו. אפשר להדביק בוואטסאפ.");
    } catch (err) {
      if (err?.name !== "AbortError") notify("לא הצלחנו לשתף. נסו שוב.");
    }
  };

  return (
    <div className="space-y-6 pb-4">
      <PageHeader icon={Palette} title="בחירת עיצוב" subtitle="בוחרים, מנסים, ושולחים את התשובות" />

      {/* Themes: applied live to the whole app */}
      <section className="space-y-3">
        <div>
          <h3 className="text-lg">ערכת צבעים</h3>
          <p className="text-xs text-muted-foreground">לחיצה מחליפה את הצבעים בכל האפליקציה. אפשר לעבור בין המסכים ולחזור לכאן.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => chooseTheme(t.id)}
              className={cn("surface p-3 text-right space-y-2 transition-shadow", theme === t.id && "ring-2 ring-primary")}
            >
              <div className="flex h-10 rounded-xl overflow-hidden">
                {t.swatch.map(c => <span key={c} className="flex-1" style={{ background: c }} />)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t.name}</span>
                {theme === t.id && <Check className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">{t.note}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Icons */}
      <section className="space-y-3">
        <h3 className="text-lg">אייקון למסך הבית</h3>
        <div className="grid grid-cols-4 gap-3">
          {ICONS.map(i => (
            <button key={i.id} onClick={() => setIcon(i.id)} className="flex flex-col items-center gap-1.5">
              <img
                src={`/icons/option-${i.id}.svg`}
                alt={i.name}
                className={cn("w-full aspect-square rounded-[22%] shadow-[var(--card-shadow)] transition", icon === i.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-90")}
              />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{i.id} · {i.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Questions */}
      <section className="space-y-5">
        <h3 className="text-lg">כמה שאלות</h3>
        {QUESTIONS.map(q => (
          <div key={q.id} className="space-y-2">
            <p className="text-sm font-medium">{q.q}{q.multi && <span className="text-xs text-muted-foreground font-normal"> (אפשר כמה)</span>}</p>
            <div className="flex flex-wrap gap-2">
              {q.options.map(o => (
                <Chip
                  key={o}
                  active={q.multi ? (answers[q.id] || []).includes(o) : answers[q.id] === o}
                  onClick={() => toggle(q, o)}
                >
                  {o}
                </Chip>
              ))}
            </div>
          </div>
        ))}
        <div className="space-y-2">
          <p className="text-sm font-medium">עוד משהו שחשוב לך בעיצוב?</p>
          <textarea
            value={extra}
            onChange={e => setExtra(e.target.value)}
            rows={3}
            placeholder="מה אהבת, מה מפריע, השראה מאפליקציה אחרת..."
            className="w-full rounded-2xl bg-card border border-border p-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </section>

      <button
        onClick={send}
        className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition"
      >
        <Send className="w-4 h-4" />
        שליחת הבחירות
      </button>
    </div>
  );
}
