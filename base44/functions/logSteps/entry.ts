import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Receives daily steps, burned calories and (optionally) today's indoor walk / outdoor run from iOS Shortcuts.
// Records are written with the service role, so they are attributed explicitly to user_email:
// the app reads __steps__ / __calories_burned__ rows by created_by.

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

Deno.serve(async (req) => {
  try {
    // Fail closed: without a configured secret the endpoint must not accept writes.
    const expectedSecret = Deno.env.get("SHORTCUTS_SECRET");
    if (!expectedSecret) {
      return Response.json({ error: "SHORTCUTS_SECRET is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { steps, calories_burned, resting_calories, date, secret, user_email } = body;

    if (secret !== expectedSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Without an owner the rows can't be shown to anyone, and both users would overwrite one row.
    const email = typeof user_email === "string" ? user_email.trim().toLowerCase() : "";
    if (!email) {
      return Response.json({ error: "user_email is required" }, { status: 400 });
    }

    const todayDate = date || new Date().toISOString().split("T")[0];
    const base44 = createClientFromRequest(req);
    const FoodEntry = base44.asServiceRole.entities.FoodEntry;

    let attributed = true;

    // Updates this user's row for the date, or creates one owned by them.
    const upsert = async (foodName: string, values: Record<string, number>) => {
      const existing = await FoodEntry.filter({ date: todayDate, food_name: foodName });
      const mine = existing.filter(e => (e.created_by || "").toLowerCase() === email);

      if (mine.length > 0) {
        await FoodEntry.update(mine[0].id, values);
        return;
      }

      const created = await FoodEntry.create({
        date: todayDate,
        meal_type: "snack",
        food_name: foodName,
        calories: 0,
        steps: 0,
        ...values,
        created_by: email,
      });
      if ((created?.created_by || "").toLowerCase() !== email) attributed = false;
    };

    const stepsValue = toNumber(steps);
    if (stepsValue !== null && stepsValue > 0) {
      await upsert("__steps__", { steps: stepsValue });
    }

    // Total burned = active + resting
    const totalCaloriesBurned = (toNumber(calories_burned) ?? 0) + (toNumber(resting_calories) ?? 0);
    if (totalCaloriesBurned > 0) {
      await upsert("__calories_burned__", { calories: totalCaloriesBurned });
    }

    // Watch workouts (optional): indoor walk (walk_*) and outdoor run (run_*).
    // One HealthWorkout row per workout, keyed by its start time, so re-runs update instead of duplicating.
    const saveWorkout = async (type: string, prefix: string) => {
      const minutes = toNumber(body[`${prefix}_minutes`]);
      if (minutes === null || minutes <= 0) return false;
      const HealthWorkout = base44.asServiceRole.entities.HealthWorkout;
      const rawStart = body[`${prefix}_start`];
      const startKey = typeof rawStart === "string" && rawStart.trim() ? rawStart.trim() : todayDate;
      const values = {
        date: todayDate,
        workout_type: type,
        start_time: startKey,
        duration_min: Math.round(minutes * 10) / 10,
        steps: toNumber(body[`${prefix}_steps`]) ?? 0,
        distance_km: toNumber(body[`${prefix}_distance_km`]) ?? 0,
        calories: toNumber(body[`${prefix}_calories`]) ?? 0,
      };
      const existing = await HealthWorkout.filter({ date: todayDate, workout_type: type, start_time: startKey });
      const mine = existing.filter(e => (e.created_by || "").toLowerCase() === email);
      if (mine.length > 0) {
        await HealthWorkout.update(mine[0].id, values);
      } else {
        const created = await HealthWorkout.create({ ...values, created_by: email });
        if ((created?.created_by || "").toLowerCase() !== email) attributed = false;
      }
      return true;
    };
    const walkSaved = await saveWorkout("indoor_walk", "walk");
    const runSaved = await saveWorkout("outdoor_run", "run");

    return Response.json({
      success: true,
      walk_saved: walkSaved,
      run_saved: runSaved,
      steps: stepsValue ?? 0,
      calories_burned: totalCaloriesBurned,
      date: todayDate,
      user_email: email,
      // false means Base44 ignored created_by on create, so the new rows won't show in the app.
      attributed,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
