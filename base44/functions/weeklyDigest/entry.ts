import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@3.6.7';

// Weekly summary push, triggered every Sunday morning by a scheduled GitHub Action.
// Auth: header x-cron-secret must equal the CRON_SECRET secret. `?dry=1` returns the
// messages without sending them (for testing).

const DAY = 86400000;
const toStr = (d: Date) => d.toISOString().slice(0, 10);
const israelToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());

/** Sunday-to-Saturday range of the week before the one containing `today`. */
function lastWeek(today: string) {
  const d = new Date(`${today}T12:00:00Z`);
  const thisSunday = new Date(d.getTime() - d.getUTCDay() * DAY);
  const start = new Date(thisSunday.getTime() - 7 * DAY);
  return { start: toStr(start), end: toStr(new Date(start.getTime() + 6 * DAY)), prevStart: toStr(new Date(start.getTime() - 7 * DAY)) };
}

Deno.serve(async (req) => {
  try {
    const expected = Deno.env.get("CRON_SECRET");
    if (!expected) return Response.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
    if (req.headers.get("x-cron-secret") !== expected) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const dry = new URL(req.url).searchParams.get("dry") === "1";

    const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!dry && (!publicKey || !privateKey)) return Response.json({ error: "VAPID keys are not configured" }, { status: 500 });
    if (!dry) webpush.setVapidDetails("mailto:casa-app@users.noreply.github.com", publicKey!, privateKey!);

    const db = createClientFromRequest(req).asServiceRole.entities;
    const { start, end, prevStart } = lastWeek(israelToday());

    const [gymSets, watch, planned, goals, subs] = await Promise.all([
      db.GymSet.list("-date", 1000),
      db.HealthWorkout.list("-date", 500),
      db.Workout.list("-date", 500),
      db.HouseholdGoal.filter({ kind: "weekly_sessions" }, "-updated_date", 1),
      db.PushSubscription.list("-created_date", 100),
    ]);
    const target = Number(goals[0]?.target) || 8;

    // Workout days per person (a person-day counts once across sources)
    const daysIn = (from: string, to: string) => {
      const set = new Set<string>();
      const add = (email?: string, date?: string) => {
        if (email && date && date >= from && date <= to) set.add(`${email.toLowerCase()}|${date}`);
      };
      gymSets.forEach((s) => add(s.created_by, s.date));
      watch.forEach((w) => add(w.created_by, w.date));
      planned.filter((w) => w.is_completed).forEach((w) => add(w.created_by, w.date));
      const per: Record<string, number> = {};
      for (const k of set) { const e = k.split("|")[0]; per[e] = (per[e] || 0) + 1; }
      return { per, total: set.size };
    };
    const week = daysIn(start, end);
    const prev = daysIn(prevStart, toStr(new Date(new Date(`${start}T12:00:00Z`).getTime() - DAY)));

    const walkMinutes = (email: string) => watch
      .filter((w) => (w.created_by || "").toLowerCase() === email && w.workout_type === "indoor_walk" && w.date >= start && w.date <= end)
      .reduce((s, w) => s + (Number(w.duration_min) || 0), 0);

    const messages = subs.map((sub) => {
      const email = (sub.created_by || "").toLowerCase();
      const mine = week.per[email] || 0;
      const reached = week.total >= target;
      const trend = week.total > prev.total ? " · יותר מהשבוע שלפני 💪" : "";
      const walk = Math.round(walkMinutes(email));
      const body = [
        reached
          ? `עמדתם במטרה: ${week.total} אימונים ביחד מתוך ${target} 🎉`
          : `${week.total} אימונים ביחד מתוך ${target}${trend}`,
        `את/ה: ${mine} ימי אימון${walk ? ` · ${walk} דק׳ הליכה` : ""}`,
        "שבוע טוב!",
      ].join("\n");
      return { sub, email, payload: { title: "הסיכום השבועי של Casa", body, url: "/", tag: `weekly-${start}` } };
    });

    if (dry) {
      return Response.json({ week: { start, end, total: week.total, target }, messages: messages.map(({ email, payload }) => ({ email, ...payload })) });
    }

    let sent = 0, removed = 0, failed = 0;
    for (const m of messages) {
      try {
        await webpush.sendNotification(
          { endpoint: m.sub.endpoint, keys: { p256dh: m.sub.p256dh, auth: m.sub.auth } },
          JSON.stringify(m.payload),
          { TTL: 60 * 60 * 12 },
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) { await db.PushSubscription.delete(m.sub.id); removed++; }
        else failed++;
      }
    }
    return Response.json({ week: { start, end, total: week.total, target }, sent, removed, failed });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
