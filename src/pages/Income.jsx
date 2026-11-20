import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet, Clock, TrendingUp, Trash2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddIncomeDialog from "@/components/income/AddIncomeDialog";
import IncomeChart from "@/components/income/IncomeChart";
import YearlyIncomeChart from "@/components/income/YearlyIncomeChart";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/lib/AuthContext";
import { notifyError } from "@/lib/notify";
import { parseDateStr } from "@/lib/dates";
import PageHeader from "@/components/layout/PageHeader";

const shiftLabels = { morning: "בוקר ☀️", afternoon: "צהריים 🌤️", evening: "ערב 🌙" };

export default function Income() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Private section: only the current user's entries are requested from the server
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["income", user?.email],
    queryFn: () => base44.entities.IncomeEntry.filter({ created_by: user.email }, "-date", 500),
    enabled: !!user?.email,
  });

  const myEntries = entries.filter(e => e.created_by === user?.email);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyEntries = myEntries.filter(e => {
    const d = parseDateStr(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyTotal = monthlyEntries.reduce((s, e) => s + (e.total_earned || 0), 0);
  const totalHours = monthlyEntries.reduce((s, e) => s + (e.hours_worked || 0), 0);
  const avgHourly = totalHours > 0 ? monthlyTotal / totalHours : 0;

  const handleDelete = async (id) => {
    try {
      await base44.entities.IncomeEntry.delete(id);
      queryClient.invalidateQueries({ queryKey: ["income"] });
    } catch (err) {
      notifyError(err, "מחיקת המשמרת נכשלה");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader icon={Wallet} title="ההכנסות שלי" subtitle={<span className="inline-flex items-center gap-1"><Lock className="w-3 h-3" />מוצג רק לך</span>}>
        <AddIncomeDialog onAdded={() => queryClient.invalidateQueries({ queryKey: ["income"] })} />
      </PageHeader>

      {/* Monthly Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 text-center">
          <span className="text-base mx-auto mb-1 block font-bold text-primary">₪</span>
          <p className="text-lg font-bold">₪{monthlyTotal.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">סה״כ החודש</p>
        </div>
        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/10 text-center">
          <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold">{totalHours}</p>
          <p className="text-[10px] text-muted-foreground">שעות</p>
        </div>
        <div className="p-3 rounded-2xl bg-accent/5 border border-accent/10 text-center">
          <TrendingUp className="w-4 h-4 text-accent mx-auto mb-1" />
          <p className="text-lg font-bold">₪{avgHourly.toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground">ממוצע לשעה</p>
        </div>
      </div>

      {/* Yearly Chart */}
      <YearlyIncomeChart entries={myEntries} />

      {/* Chart */}
      <IncomeChart entries={monthlyEntries} />

      {/* Entries list */}
      <div>
        <h3 className="font-bold text-sm mb-3">משמרות אחרונות</h3>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : myEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            אין משמרות עדיין
          </div>
        ) : (
          <div className="space-y-2">
            {myEntries.slice(0, 20).map(entry => (
              <div key={entry.id} className="flex items-center gap-3 p-3 surface">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{parseDateStr(entry.date).toLocaleDateString("he-IL")}</p>
                    <span className="text-xs text-muted-foreground">{shiftLabels[entry.shift_type]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.hours_worked} שעות {entry.hourly_rate ? `× ₪${entry.hourly_rate}` : ""}
                    {entry.notes ? ` • ${entry.notes}` : ""}
                  </p>
                </div>
                <p className="font-bold text-sm text-primary">₪{(entry.total_earned || 0).toLocaleString()}</p>
                <ConfirmDialog title="למחוק את המשמרת?" onConfirm={() => handleDelete(entry.id)}>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </ConfirmDialog>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}