import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Read-only daily summary for the iPhone home-screen widget (Scriptable).
// Auth: a personal token the user creates in the app (WidgetToken row). The token
// identifies the user; nothing else from the request is trusted.

const INTERNAL = ["__steps__", "__calories_burned__"];

/** Today's date in Israel as YYYY-MM-DD (server runs in UTC). */
function israelToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
}

const isDate = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    let token = url.searchParams.get("token") || "";
    let date = url.searchParams.get("date") || "";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      token = body.token || token;
      date = body.date || date;
    }
    if (typeof token !== "string" || token.length < 20) {
      return Response.json({ error: "Missing or invalid token" }, { status: 401 });
    }
    const today = isDate(date) ? date : israelToday();

    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;

    const tokens = await db.WidgetToken.filter({ token });
    const email = (tokens[0]?.created_by || "").toLowerCase();
    if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Calories today vs goal
    const [entries, users] = await Promise.all([
      db.FoodEntry.filter({ date: today, created_by: email }),
      db.User.filter({ email }),
    ]);
    const food = entries.filter((e) => !INTERNAL.includes(e.food_name));
    const sum = (key: string) => food.reduce((total, e) => total + (Number(e[key]) || 0), 0);
    const calories = sum("calories");
    const calorieGoal = Number(users[0]?.calorie_goal) || 1400;
    const steps = entries.find((e) => e.food_name === "__steps__")?.steps ?? null;

    // Indoor walk: last walk vs goal (average of up to 8 previous walks + 10%)
    const walks = (await db.HealthWorkout.filter({ created_by: email, workout_type: "indoor_walk" }, "-date", 20))
      .sort((a, b) => `${a.date}${a.start_time || ""}`.localeCompare(`${b.date}${b.start_time || ""}`));
    let walk = null;
    if (walks.length) {
      const last = walks[walks.length - 1];
      const history = (walks.length > 1 ? walks.slice(0, -1) : walks).slice(-8)
        .map((w) => Number(w.duration_min) || 0).filter((m) => m > 0);
      const avg = history.length ? history.reduce((s, m) => s + m, 0) / history.length : null;
      walk = {
        last_minutes: Math.round(Number(last.duration_min) || 0),
        last_date: last.date,
        is_today: last.date === today,
        goal_minutes: avg ? Math.round(avg * 1.1) : null,
      };
    }

    return Response.json({
      date: today,
      calories: Math.round(calories),
      calorie_goal: calorieGoal,
      protein: Math.round(sum("protein")),
      carbs: Math.round(sum("carbs")),
      fat: Math.round(sum("fat")),
      steps,
      walk,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
