import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings as SettingsIcon, Bell, Palette, LayoutGrid, Smartphone, ChevronLeft, Loader2, Share } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Switch } from "@/components/ui/switch";
import { pushSupported, isStandalone, currentSubscription, enablePush, disablePush } from "@/lib/push";
import { notify, notifyError } from "@/lib/notify";

function Row({ to, icon: Icon, title, subtitle }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5 active:bg-muted/60 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
    </Link>
  );
}

/** Settings hub: weekly-summary notifications and links to design, widget and Apple Health sync. */
export default function Settings() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true);
  const supported = pushSupported();
  const standalone = isStandalone();

  useEffect(() => {
    if (!supported) { setBusy(false); return; }
    currentSubscription().then(sub => setEnabled(!!sub)).finally(() => setBusy(false));
  }, [supported]);

  const toggle = async (on) => {
    setBusy(true);
    try {
      if (on) { await enablePush(); notify("ההתראות הופעלו. הסיכום השבועי יגיע ביום ראשון בבוקר."); }
      else { await disablePush(); notify("ההתראות כובו."); }
      setEnabled(on);
    } catch (err) {
      notifyError(err, on ? "הפעלת ההתראות נכשלה" : "כיבוי ההתראות נכשל");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 pb-4">
      <PageHeader icon={SettingsIcon} title="הגדרות" />

      <div className="surface p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">סיכום שבועי</p>
            <p className="text-[11px] text-muted-foreground">התראה ביום ראשון בבוקר: המטרה המשותפת, האימונים שלך וההליכה</p>
          </div>
          {busy ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : (
            <Switch checked={enabled} onCheckedChange={toggle} disabled={!supported || (!standalone && !enabled)} aria-label="סיכום שבועי" />
          )}
        </div>
        {!standalone && (
          <p className="text-[11px] text-muted-foreground flex items-start gap-1.5 bg-muted/60 rounded-xl p-2.5">
            <Share className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            באייפון, התראות עובדות רק כשהאפליקציה מותקנת במסך הבית: Safari ← שיתוף ← הוסף למסך הבית, ואז פותחים מהאייקון.
          </p>
        )}
        {standalone && !supported && (
          <p className="text-[11px] text-muted-foreground">צריך iOS 16.4 ומעלה כדי לקבל התראות.</p>
        )}
      </div>

      <div className="surface overflow-hidden divide-y divide-border/50">
        <Row to="/design" icon={Palette} title="עיצוב" subtitle="ערכת צבעים ואייקון" />
        <Row to="/widget" icon={LayoutGrid} title="ווידג'ט לאייפון" subtitle="קלוריות והליכה במסך הבית" />
        <Row to="/shortcut-setup" icon={Smartphone} title="סנכרון Apple Health" subtitle="צעדים, שריפה, הליכה וריצה" />
      </div>
    </div>
  );
}
