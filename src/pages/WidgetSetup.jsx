import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, Copy, Check, KeyRound, Trash2, Loader2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ConfirmDialog from "@/components/ConfirmDialog";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { appParams } from "@/lib/app-params";
import { notifyError, notify } from "@/lib/notify";
import { buildWidgetScript, newWidgetToken } from "@/lib/widgetScript";

const STEPS = [
  "מתקינים מה-App Store את האפליקציה החינמית Scriptable.",
  "לוחצים כאן על \"העתקת הסקריפט\".",
  "ב-Scriptable לוחצים + למעלה, מדביקים, ונותנים שם: Casa.",
  "לוחצים ▶︎ פעם אחת כדי לראות שהווידג'ט עובד.",
  "במסך הבית: לחיצה ארוכה ← עריכה ← הוספת ווידג'ט ← Scriptable ← גודל בינוני.",
  "לחיצה ארוכה על הווידג'ט ← עריכת ווידג'ט ← Script: בוחרים Casa.",
];

/** Creates a personal widget token and hands out the ready-to-paste Scriptable script. */
export default function WidgetSetup() {
  const { user } = useAuth();
  const email = user?.email;
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const key = ["widget-tokens", email];

  const { data: tokens = [], isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => base44.entities.WidgetToken.filter({ created_by: email }, "-created_date", 10),
    enabled: !!email,
    retry: false,
  });
  const token = tokens[0]?.token;

  const create = useMutation({
    mutationFn: () => base44.entities.WidgetToken.create({ token: newWidgetToken(), label: "iPhone" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: (err) => notifyError(err, "יצירת הקוד נכשלה"),
  });

  const revoke = useMutation({
    mutationFn: () => Promise.all(tokens.map(t => base44.entities.WidgetToken.delete(t.id))),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: key }); notify("הקוד בוטל. הווידג'ט יפסיק להתעדכן."); },
    onError: (err) => notifyError(err, "ביטול הקוד נכשל"),
  });

  const apiUrl = appParams.appBaseUrl
    ? `${appParams.appBaseUrl.replace(/\/$/, "")}/functions/widgetSummary`
    : `https://base44.app/api/apps/${appParams.appId}/functions/widgetSummary`;
  const script = useMemo(
    () => (token ? buildWidgetScript({ apiUrl, token, appUrl: window.location.origin }) : ""),
    [apiUrl, token]
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      notifyError(err, "ההעתקה נכשלה");
    }
  };

  return (
    <div className="space-y-5 pb-4">
      <PageHeader icon={LayoutGrid} title="ווידג'ט לאייפון" subtitle="קלוריות והליכה ישר במסך הבית" />

      {error ? (
        <div className="surface p-4 text-sm text-muted-foreground">
          הווידג'ט עוד לא הופעל בשרת. צריך להוסיף את הישות WidgetToken ואת הפונקציה widgetSummary ב-Base44.
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : !token ? (
        <div className="surface p-5 space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <p className="text-sm">כדי שהווידג'ט יראה את הנתונים שלך, צריך קוד גישה אישי.</p>
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="h-11 px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
          >
            {create.isPending ? "יוצר..." : "יצירת קוד אישי"}
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={copy}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "הועתק" : "העתקת הסקריפט"}
          </button>

          <ol className="surface p-4 space-y-2.5">
            {STEPS.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>

          <p className="text-[11px] text-muted-foreground px-1">
            הסקריפט כולל את הקוד האישי שלך, אז אל תשתפו אותו. הווידג'ט מתעדכן בערך כל רבע שעה, ולחיצה עליו פותחת את Casa.
          </p>

          <ConfirmDialog
            title="לבטל את הקוד?"
            description="הווידג'ט יפסיק להתעדכן עד שתיצרו קוד חדש ותדביקו סקריפט חדש."
            confirmLabel="ביטול הקוד"
            onConfirm={() => revoke.mutate()}
          >
            <button className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-2">
              <Trash2 className="w-3.5 h-3.5" /> ביטול הקוד ויצירת חדש
            </button>
          </ConfirmDialog>
        </>
      )}
    </div>
  );
}
