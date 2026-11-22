import { Palette, Check, RotateCcw } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Switch } from "@/components/ui/switch";
import { THEMES } from "@/lib/theme";
import { ICONS, usePrefs, setPrefs, resetPrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

function Section({ title, hint, children }) {
  return (
    <section className="space-y-2.5">
      <div>
        <h3 className="text-lg leading-tight">{title}</h3>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Segmented control: one choice out of a few, applied immediately. */
function Segmented({ value, options, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-full">
      {options.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn("flex-1 py-2 rounded-full text-xs font-medium transition-colors", value === id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const HOME_CARDS = [
  ["walk", "הליכה בפנים", "זמן ההליכה מול היעד"],
  ["runs", "ריצות", "קילומטרים וקצב השבוע"],
  ["goal", "מטרה משותפת", "האימונים של שניכם השבוע"],
  ["today", "היום שלי", "קלוריות, צעדים, אימון, קניות ומשקל"],
  ["weekly", "סיכום שבועי", "גרף קלוריות ומשקל"],
];

/** Live look & feel settings: every choice applies immediately and is remembered on this device. */
export default function DesignChoice() {
  const prefs = usePrefs();

  return (
    <div className="space-y-7 pb-4">
      <PageHeader icon={Palette} title="עיצוב" subtitle="כל שינוי חל מיד ונשמר במכשיר הזה" />

      <Section title="ערכת צבעים">
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setPrefs({ theme: t.id })}
              className={cn("surface p-3 text-right space-y-2 transition-shadow", prefs.theme === t.id && "ring-2 ring-primary")}
            >
              <div className="flex h-9 rounded-xl overflow-hidden">
                {t.swatch.map(c => <span key={c} className="flex-1" style={{ background: c }} />)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t.name}</span>
                {prefs.theme === t.id && <Check className="w-4 h-4 text-primary" />}
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="בהיר או כהה">
        <Segmented value={prefs.mode} onChange={(mode) => setPrefs({ mode })} options={[["auto", "לפי הטלפון"], ["light", "בהיר"], ["dark", "כהה"]]} />
      </Section>

      <Section title="סגנון כתב">
        <Segmented value={prefs.font} onChange={(font) => setPrefs({ font })} options={[["classic", "קלאסי"], ["modern", "מודרני"], ["rounded", "עגול"]]} />
        <div className="surface px-4 py-3">
          <h3 className="text-xl">כותרת לדוגמה</h3>
          <p className="text-sm text-muted-foreground mt-1">וכך נראה טקסט רגיל באפליקציה.</p>
        </div>
      </Section>

      <Section title="גודל טקסט">
        <Segmented value={prefs.textSize} onChange={(textSize) => setPrefs({ textSize })} options={[["normal", "רגיל"], ["large", "גדול"]]} />
      </Section>

      <Section title="פינות הכרטיסים">
        <Segmented value={prefs.radius} onChange={(radius) => setPrefs({ radius })} options={[["round", "מעוגלות"], ["soft", "עדינות"]]} />
      </Section>

      <Section title="אנימציות">
        <Segmented value={prefs.motion} onChange={(motion) => setPrefs({ motion })} options={[["on", "עדינות"], ["off", "בלי"]]} />
      </Section>

      <Section title="מה מופיע בדף הבית">
        <div className="surface divide-y divide-border/50 overflow-hidden">
          {HOME_CARDS.map(([key, label, note]) => (
            <label key={key} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-[11px] text-muted-foreground">{note}</p>
              </div>
              <Switch checked={prefs.home[key]} onCheckedChange={(on) => setPrefs({ home: { [key]: on } })} aria-label={label} />
            </label>
          ))}
        </div>
      </Section>

      <Section title="אייקון למסך הבית" hint="אחרי בחירה: מוחקים את האייקון ממסך הבית ומוסיפים מחדש מ-Safari (שיתוף ← הוסף למסך הבית).">
        <div className="grid grid-cols-4 gap-3">
          {ICONS.map(i => (
            <button key={i.id} onClick={() => setPrefs({ icon: i.id })} className="flex flex-col items-center gap-1.5">
              <img
                src={`/icons/option-${i.id}.svg`}
                alt={i.name}
                className={cn("w-full aspect-square rounded-[22%] shadow-[var(--card-shadow)] transition", prefs.icon === i.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-80")}
              />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{i.name}</span>
            </button>
          ))}
        </div>
      </Section>

      <button onClick={resetPrefs} className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-2">
        <RotateCcw className="w-3.5 h-3.5" /> חזרה לברירת המחדל
      </button>
    </div>
  );
}
