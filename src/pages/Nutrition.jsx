import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Smartphone, BookOpen, Apple, Plus, LayoutGrid } from "lucide-react";
import DailyNutritionSummary from "@/components/nutrition/DailyNutritionSummary";
import MealLog from "@/components/nutrition/MealLog";
import AddFoodSheet from "@/components/nutrition/AddFoodSheet";
import CalorieBalance from "@/components/nutrition/CalorieBalance";
import CalorieCalendar from "@/components/nutrition/CalorieCalendar";
import GoalEditor from "@/components/nutrition/GoalEditor";
import MyFoodLibrary from "@/components/nutrition/MyFoodLibrary";
import NutritionStats from "@/components/nutrition/NutritionStats";
import WeightTracker from "@/components/nutrition/WeightTracker";
import WeightForecast from "@/components/nutrition/WeightForecast";
import { todayStr, addDaysStr, parseDateStr } from "@/lib/dates";
import { useAuth } from "@/lib/AuthContext";
import { notifyError } from "@/lib/notify";
import PageHeader from "@/components/layout/PageHeader";

export default function Nutrition() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showAdd, setShowAdd] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [activeTab, setActiveTab] = useState("my");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const goalCalories = user?.calorie_goal || 1400;

  // Only the current user's entries are fetched (food log is private)
  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: ["food-entries", selectedDate, user?.email],
    queryFn: () => base44.entities.FoodEntry.filter({ date: selectedDate, created_by: user.email }, "-created_date", 200),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const INTERNAL_ENTRIES = ["__steps__", "__calories_burned__"];
  const entries = allEntries.filter(e => e.created_by === user?.email && !INTERNAL_ENTRIES.includes(e.food_name));

  // Show loading only when there are truly no cached entries (first load for this date)
  const showLoading = isLoading && allEntries.length === 0;

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FoodEntry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["food-entries", selectedDate] }),
    onError: (err) => notifyError(err, "המחיקה נכשלה"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FoodEntry.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["food-entries", selectedDate] }),
    onError: (err) => notifyError(err, "העדכון נכשל"),
  });

  const totalCalories = entries.reduce((s, e) => s + (e.calories || 0), 0);
  const totalProtein = entries.reduce((s, e) => s + (e.protein || 0), 0);
  const totalCarbs = entries.reduce((s, e) => s + (e.carbs || 0), 0);
  const totalFat = entries.reduce((s, e) => s + (e.fat || 0), 0);

  const navigateDate = (dir) => setSelectedDate(addDaysStr(selectedDate, dir));

  const isToday = selectedDate === todayStr();

  return (
    <div className="space-y-4">
      <PageHeader icon={Apple} title="תזונה" subtitle={isToday ? "היום" : parseDateStr(selectedDate).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}>
        {activeTab === "my" && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            הוסף
          </button>
        )}
      </PageHeader>

      {/* Secondary actions */}
      <div className="flex items-center gap-2">
        <button onClick={() => setShowLibrary(!showLibrary)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${showLibrary ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary hover:text-primary"}`}>
          <BookOpen className="w-3.5 h-3.5" />
          המאגר שלי
        </button>
        <Link to="/shortcut-setup" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Smartphone className="w-3.5 h-3.5" />
          סנכרון Apple Health
        </Link>
        <Link to="/widget" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          <LayoutGrid className="w-3.5 h-3.5" />
          ווידג'ט
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl">
        <button
          onClick={() => setActiveTab("my")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === "my" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          האוכל שלי
        </button>
        <button
          onClick={() => setActiveTab("competition")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === "competition" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          לוח שנה
        </button>
      </div>

      {activeTab === "my" ? (
        <>
          {/* Date Navigator */}
          <div className="flex items-center justify-between bg-card border border-border/50 rounded-2xl px-4 py-3">
            <button onClick={() => navigateDate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">›</button>
            <div className="text-center">
              <p className="font-semibold text-sm">
                {isToday ? "היום" : parseDateStr(selectedDate).toLocaleDateString("he-IL", { weekday: "long" })}
              </p>
              <p className="text-xs text-muted-foreground">
                {parseDateStr(selectedDate).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <button onClick={() => navigateDate(1)} disabled={isToday} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30">‹</button>
          </div>

          {/* My Food Library (collapsible) */}
          {showLibrary && (
            <div className="p-4 surface">
              <MyFoodLibrary />
            </div>
          )}

          {/* Daily Summary with goal editor */}
          <div className="space-y-1">
            <div className="flex justify-end">
              <GoalEditor goalCalories={goalCalories} />
            </div>
            <DailyNutritionSummary
              totalCalories={totalCalories}
              totalProtein={totalProtein}
              totalCarbs={totalCarbs}
              totalFat={totalFat}
              goalCalories={goalCalories}
            />
          </div>

          {/* Calorie Balance */}
          <CalorieBalance consumedCalories={totalCalories} date={selectedDate} userEmail={user?.email} allEntries={allEntries} />

          {/* Stats */}
          <NutritionStats userEmail={user?.email} goalCalories={goalCalories} />

          {/* Weight Tracker */}
          <WeightTracker userEmail={user?.email} />

          {/* Weight goal forecast (only for users who set a goal) */}
          <WeightForecast userEmail={user?.email} />

          {/* Meal Log */}
          <MealLog
            entries={entries}
            isLoading={showLoading}
            onDelete={(id) => deleteMutation.mutate(id)}
            onUpdate={(id, data) => updateMutation.mutate({ id, data })}
          />
        </>
      ) : (
        <>
          <CalorieCalendar userEmail={user?.email} goalCalories={goalCalories} />
        </>
      )}

      <AddFoodSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        date={selectedDate}
        onAdded={() => queryClient.invalidateQueries({ queryKey: ["food-entries", selectedDate] })}
      />
    </div>
  );
}