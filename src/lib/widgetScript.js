// Builds the Scriptable (iOS) widget script with the user's personal token embedded.
// The script calls the widgetSummary function and draws calories + indoor-walk progress.

export function buildWidgetScript({ apiUrl, token, appUrl }) {
  return `// Casa widget for Scriptable. Personal: contains your access code, don't share it.
const API = ${JSON.stringify(apiUrl)};
const TOKEN = ${JSON.stringify(token)};
const APP = ${JSON.stringify(appUrl)};

const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const today = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());

let data;
try {
  const req = new Request(API + "?token=" + encodeURIComponent(TOKEN) + "&date=" + today);
  req.timeoutInterval = 15;
  data = await req.loadJSON();
} catch (e) {
  data = { error: "אין חיבור" };
}

const C = {
  bg: Color.dynamic(new Color("#faf7f1"), new Color("#1d1813")),
  text: Color.dynamic(new Color("#2e2a22"), new Color("#efe7da")),
  muted: Color.dynamic(new Color("#8a8072"), new Color("#a89d8e")),
  olive: Color.dynamic(new Color("#5d6a43"), new Color("#8fa06a")),
  terra: Color.dynamic(new Color("#b0654a"), new Color("#d08a6e")),
  track: Color.dynamic(new Color("#ebe5d8"), new Color("#3a3128")),
};

function bar(value, max, color, width) {
  const h = 6;
  const ctx = new DrawContext();
  ctx.size = new Size(width, h);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  ctx.setFillColor(C.track);
  const track = new Path();
  track.addRoundedRect(new Rect(0, 0, width, h), 3, 3);
  ctx.addPath(track);
  ctx.fillPath();
  const pct = max > 0 ? Math.max(0.04, Math.min(1, value / max)) : 0;
  ctx.setFillColor(color);
  const fill = new Path();
  // Right-to-left: progress grows from the right edge
  fill.addRoundedRect(new Rect(width * (1 - pct), 0, width * pct, h), 3, 3);
  ctx.addPath(fill);
  ctx.fillPath();
  return ctx.getImage();
}

function row(w, label, valueText, value, max, color, width) {
  const top = w.addStack();
  top.layoutHorizontally();
  const v = top.addText(valueText);
  v.font = Font.semiboldSystemFont(15);
  v.textColor = C.text;
  top.addSpacer();
  const l = top.addText(label);
  l.font = Font.systemFont(11);
  l.textColor = C.muted;
  w.addSpacer(4);
  const img = w.addImage(bar(value, max, color, width));
  img.imageSize = new Size(width, 6);
}

const w = new ListWidget();
w.backgroundColor = C.bg;
w.url = APP;
w.setPadding(14, 14, 14, 14);
w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

const head = w.addStack();
head.layoutHorizontally();
const time = head.addText(pad(now.getHours()) + ":" + pad(now.getMinutes()));
time.font = Font.systemFont(10);
time.textColor = C.muted;
head.addSpacer();
const title = head.addText("casa");
title.font = new Font("Georgia-Italic", 15);
title.textColor = C.olive;
w.addSpacer(8);

const width = config.widgetFamily === "small" ? 120 : 280;

if (data.error) {
  const t = w.addText(data.error === "Unauthorized" ? "הקוד לא תקין, צרו קוד חדש באפליקציה" : data.error);
  t.font = Font.systemFont(12);
  t.textColor = C.muted;
  t.rightAlignText();
} else {
  row(w, "קלוריות", data.calories.toLocaleString() + " / " + data.calorie_goal.toLocaleString(), data.calories, data.calorie_goal, data.calories > data.calorie_goal + 100 ? C.terra : C.olive, width);
  if (data.walk && data.walk.goal_minutes) {
    w.addSpacer(10);
    const label = data.walk.is_today ? "הליכה היום" : "הליכה אחרונה";
    row(w, label, data.walk.last_minutes + " / " + data.walk.goal_minutes + " דק׳", data.walk.last_minutes, data.walk.goal_minutes, C.olive, width);
  } else if (data.steps) {
    w.addSpacer(10);
    const s = w.addText(Number(data.steps).toLocaleString() + " צעדים");
    s.font = Font.systemFont(12);
    s.textColor = C.muted;
    s.rightAlignText();
  }
}
w.addSpacer();

if (config.runsInWidget) Script.setWidget(w);
else await w.presentMedium();
Script.complete();
`;
}

/** Random 32-byte hex token. */
export function newWidgetToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
