// In-memory stand-in for the Base44 client, used by the public demo (/demo).
// Same surface the app uses: entities.<Name>.list/filter/create/update/delete/bulkCreate,
// auth.me/updateMe/logout, integrations.Core.InvokeLLM/UploadFile. Data is generated
// relative to today and never leaves the browser.

import { toDateStr, addDaysStr } from "@/lib/dates";

export const DEMO_FLAG = "casa-demo";
const ME = "demo@casa.app";
const PARTNER = "partner@casa.app";

// Deterministic pseudo-random numbers so the demo looks the same on every visit
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

let nextId = 1;
const id = () => `demo-${nextId++}`;
const stamp = (date, hour = 9) => `${date}T${String(hour).padStart(2, "0")}:00:00.000Z`;

function seed() {
  const r = rng(42);
  const today = toDateStr(new Date());
  const day = (n) => addDaysStr(today, -n);
  const db = {
    FoodEntry: [], WeightEntry: [], Workout: [], WorkoutType: [], GymSet: [], GymTemplate: [],
    HealthWorkout: [], ShoppingItem: [], IncomeEntry: [], FoodProduct: [], EventDay: [],
    HouseholdGoal: [], WidgetToken: [], PushSubscription: [], User: [],
  };
  const add = (name, row, created_by = ME, date) => {
    db[name].push({ id: id(), created_by, created_date: stamp(date || row.date || today), updated_date: stamp(date || row.date || today), ...row });
  };

  // Meals, burned calories and steps for the last 35 days
  const meals = [
    ["breakfast", "יוגורט עם גרנולה ופירות", 320, 18, 42, 8],
    ["breakfast", "שתי פרוסות עם ביצה וסלט", 360, 22, 34, 14],
    ["lunch", "חזה עוף, אורז וירקות", 520, 42, 55, 12],
    ["lunch", "סלט קינואה עם טונה", 450, 34, 40, 15],
    ["dinner", "שקשוקה ולחם מלא", 410, 22, 38, 18],
    ["dinner", "סלמון ובטטה אפויה", 480, 36, 35, 20],
    ["snack", "תפוח וחמאת בוטנים", 190, 5, 22, 9],
    ["snack", "קוטג' וקרקרים", 160, 14, 14, 5],
  ];
  for (let n = 0; n <= 34; n++) {
    const date = day(n);
    const count = n === 0 ? 2 : 3 + Math.floor(r() * 2);
    for (let i = 0; i < count; i++) {
      const [meal_type, food_name, calories, protein, carbs, fat] = meals[Math.floor(r() * meals.length)];
      const k = 0.85 + r() * 0.3;
      add("FoodEntry", { date, meal_type, food_name, calories: Math.round(calories * k), protein: Math.round(protein * k), carbs: Math.round(carbs * k), fat: Math.round(fat * k), amount_grams: 0 }, ME, date);
    }
    if (n > 0) add("FoodEntry", { date, meal_type: "snack", food_name: "__calories_burned__", calories: 1650 + Math.round(r() * 350) }, ME, date);
    add("FoodEntry", { date, meal_type: "snack", food_name: "__steps__", calories: 0, steps: 6000 + Math.round(r() * 6000) }, ME, date);
  }

  // Weight: gentle downward trend with noise
  for (let n = 42; n >= 0; n -= 3) {
    add("WeightEntry", { date: day(n), weight_kg: Math.round((66.2 + n * 0.045 + (r() - 0.5) * 0.5) * 10) / 10 });
  }

  // Gym: 3 sessions a week with progressive overload
  const plan = [["סקוואט", 30, 10], ["היפ ת'ראסט", 40, 10], ["לחיצת חזה", 15, 10], ["חתירה בכבל", 25, 12], ["דדליפט רומני", 25, 10]];
  let session = 0;
  for (let n = 34; n >= 1; n--) {
    if (![1, 3, 5].includes(new Date(`${day(n)}T12:00:00`).getDay())) continue;
    const exercises = session % 2 === 0 ? plan.slice(0, 3) : plan.slice(2);
    exercises.forEach(([exercise, base, reps], i) => {
      const weight = base + Math.floor(session / 2) * 2.5;
      for (let s = 1; s <= 3; s++) {
        add("GymSet", { date: day(n), exercise, set_number: s, reps: reps - (s === 3 ? 2 : 0), weight_kg: weight }, ME, day(n));
        db.GymSet[db.GymSet.length - 1].created_date = `${day(n)}T18:${String(i * 10 + s).padStart(2, "0")}:00.000Z`;
      }
    });
    session++;
  }
  add("GymTemplate", { name: "אימון A · רגליים", order: 0, exercises: plan.slice(0, 3).map(([exercise, , reps]) => ({ exercise, sets: 3, reps })) });
  add("GymTemplate", { name: "אימון B · גב וחזה", order: 1, exercises: plan.slice(2).map(([exercise, , reps]) => ({ exercise, sets: 3, reps })) });

  // Watch workouts: my indoor walks, partner's runs
  for (let n = 30; n >= 0; n -= 2) {
    const minutes = 32 + (30 - n) * 0.35 + r() * 4;
    add("HealthWorkout", { date: day(n), workout_type: "indoor_walk", start_time: stamp(day(n), 7), duration_min: Math.round(minutes), steps: Math.round(minutes * 112), distance_km: Math.round(minutes * 0.09 * 10) / 10 });
  }
  for (let n = 27; n >= 0; n -= 3) {
    const km = Math.round((5 + r() * 4) * 10) / 10;
    add("HealthWorkout", { date: day(n), workout_type: "outdoor_run", start_time: stamp(day(n), 6), distance_km: km, duration_min: Math.round(km * (5.4 + r() * 0.6)) }, PARTNER);
  }

  // Planned workouts (calendar)
  add("WorkoutType", { name: "כוח", color: "green", content: "" });
  add("WorkoutType", { name: "ריצה", color: "coral", content: "" });
  add("Workout", { date: today, workout_type: "כוח", content: "אימון A · רגליים", is_completed: false });
  add("Workout", { date: day(2), workout_type: "ריצה", content: "6 ק״מ קל", is_completed: true }, PARTNER);
  add("Workout", { date: addDaysStr(today, 2), workout_type: "כוח", content: "אימון B", is_completed: false });

  // Shopping: weekly trips with repeating staples, plus an open list
  const staples = [["חלב", "dairy"], ["ביצים", "dairy"], ["לחם", "bakery"], ["עגבניות", "produce"], ["מלפפונים", "produce"], ["קוטג'", "dairy"], ["אורז", "pantry"], ["בננות", "produce"]];
  for (let w = 5; w >= 1; w--) {
    const date = day(w * 7);
    const sid = `session_demo_${w}`;
    staples.forEach(([name, category], i) => {
      if ((w + i) % 3 === 0 && name !== "חלב" && name !== "ביצים") return;
      add("ShoppingItem", { name, category, quantity: 1, is_purchased: true, purchased_at: stamp(date, 18), purchase_session_id: sid }, ME, date);
    });
  }
  [["אבוקדו", "produce"], ["שמן זית", "pantry"], ["נייר טואלט", "hygiene"]].forEach(([name, category]) =>
    add("ShoppingItem", { name, category, quantity: 1, is_purchased: false }, PARTNER));

  // Income this month
  for (let n = 1; n <= 20; n += 3) {
    const hours = 5 + Math.round(r() * 3);
    add("IncomeEntry", { date: day(n), shift_type: ["morning", "evening"][n % 2], hours_worked: hours, hourly_rate: 55, total_earned: hours * 55 });
  }

  add("FoodProduct", { name: "יוגורט חלבון", brand: "", serving_size_grams: 200, calories_per_serving: 140, protein_per_serving: 20, carbs_per_serving: 9, fat_per_serving: 0 });
  add("FoodProduct", { name: "לחם מלא", brand: "", serving_size_grams: 30, calories_per_serving: 75, protein_per_serving: 3, carbs_per_serving: 13, fat_per_serving: 1 });
  add("HouseholdGoal", { kind: "weekly_sessions", target: 8 });

  return db;
}

function sortRows(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const x = a[key] ?? "", y = b[key] ?? "";
    const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
    return desc ? -c : c;
  });
}

const matches = (row, query = {}) =>
  Object.entries(query).every(([k, v]) => (v === null ? row[k] == null : row[k] === v));

export function isDemoMode() {
  try { return sessionStorage.getItem(DEMO_FLAG) === "1"; } catch { return false; }
}

export function createDemoClient() {
  const db = seed();
  let user = { id: "demo-user", email: ME, full_name: "דמו", role: "user", calorie_goal: 1400, weight_goal: 63 };
  const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), 120));

  const entity = (name) => {
    db[name] ||= [];
    return {
      list: (sort, limit = 1000) => delay(sortRows(db[name], sort).slice(0, limit)),
      filter: (query, sort, limit = 1000) => delay(sortRows(db[name].filter((r) => matches(r, query)), sort).slice(0, limit)),
      get: (rowId) => delay(db[name].find((r) => r.id === rowId) || null),
      create: (data) => {
        const now = new Date().toISOString();
        const row = { id: id(), created_by: user.email, created_date: now, updated_date: now, ...data };
        db[name].push(row);
        return delay(row);
      },
      bulkCreate: (rows) => Promise.all(rows.map((data) => entity(name).create(data))),
      update: (rowId, data) => {
        const row = db[name].find((r) => r.id === rowId);
        if (row) Object.assign(row, data, { updated_date: new Date().toISOString() });
        return delay(row);
      },
      delete: (rowId) => {
        db[name] = db[name].filter((r) => r.id !== rowId);
        return delay({ success: true });
      },
    };
  };

  const exitDemo = () => {
    try { sessionStorage.removeItem(DEMO_FLAG); } catch { /* ignore */ }
    window.location.href = "/login";
  };

  return {
    entities: new Proxy({}, { get: (_, name) => entity(String(name)) }),
    auth: {
      me: () => delay(user),
      updateMe: (data) => { user = { ...user, ...data }; return delay(user); },
      logout: exitDemo,
      redirectToLogin: exitDemo,
      loginWithProvider: exitDemo,
      setToken: () => {},
    },
    integrations: {
      Core: {
        UploadFile: ({ file }) => delay({ file_url: file ? URL.createObjectURL(file) : "" }),
        InvokeLLM: ({ response_json_schema }) => {
          const props = response_json_schema?.properties || {};
          if (props.items) return delay({ items: [{ food_name: "סלט ירקות עם טונה", amount_grams: 250, calories: 310, protein: 28, carbs: 12, fat: 16 }] });
          if (props.food_name) return delay({ food_name: "חביתה משתי ביצים", amount_grams: 120, calories: 190, protein: 13, carbs: 1, fat: 15 });
          if (props.recommendation) return delay({ avg_days_between_trips: 7, recommendation: "אתם קונים חלב וביצים כל שבוע. כדאי להוסיף אותם לרשימה קבועה.", frequent_items: [{ name: "חלב", suggested_quantity: "2" }] });
          return delay({});
        },
      },
    },
  };
}
