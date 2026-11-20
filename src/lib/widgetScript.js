// Builds the Scriptable (iOS) widget script with the user's personal token embedded.
// Layout mirrors the in-app daily calorie card: goal ring, big number, remaining + bar,
// and a protein / carbs / fat row. Works in medium (full) and small (ring + number) sizes.

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

const dyn = (light, dark) => Color.dynamic(new Color(light), new Color(dark));
const C = {
  bg: dyn("#ffffff", "#1d1813"),
  text: dyn("#2e2a22", "#efe7da"),
  muted: dyn("#8a8072", "#a89d8e"),
  olive: dyn("#626b40", "#8fa06a"),
  over: dyn("#a8553a", "#d08a6e"),
  track: dyn("#efebe3", "#3a3128"),
  line: dyn("#ece7de", "#332b23"),
  protein: new Color("#2F6A4C"),
  carbs: new Color("#B5803A"),
  fat: new Color("#A8553A"),
};

// Goal ring with the percentage in the middle (drawn as an image)
function ring(pct, size, color) {
  const ctx = new DrawContext();
  ctx.size = new Size(size, size);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const lw = size * 0.12;
  const r = (size - lw) / 2;
  const c = size / 2;
  ctx.setLineWidth(lw);
  ctx.setStrokeColor(C.track);
  ctx.strokeEllipse(new Rect(lw / 2, lw / 2, size - lw, size - lw));
  const p = Math.max(0, Math.min(1, pct));
  if (p > 0) {
    const path = new Path();
    const steps = Math.max(2, Math.round(120 * p));
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      // Start at 12 o'clock, go clockwise
      const a = -Math.PI / 2 + (2 * Math.PI * p * i) / steps;
      pts.push(new Point(c + r * Math.cos(a), c + r * Math.sin(a)));
    }
    path.addLines(pts);
    ctx.addPath(path);
    ctx.setStrokeColor(color);
    ctx.strokePath();
  }
  ctx.setTextAlignedCenter();
  ctx.setTextColor(C.text);
  ctx.setFont(Font.boldSystemFont(size * 0.22));
  ctx.drawTextInRect(Math.round(pct * 100) + "%", new Rect(0, c - size * 0.2, size, size * 0.28));
  ctx.setTextColor(C.muted);
  ctx.setFont(Font.systemFont(size * 0.12));
  ctx.drawTextInRect("יעד", new Rect(0, c + size * 0.08, size, size * 0.16));
  return ctx.getImage();
}

// Thin progress bar that fills from the right (RTL)
function bar(pct, width, color) {
  const h = 6;
  const ctx = new DrawContext();
  ctx.size = new Size(width, h);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const track = new Path();
  track.addRoundedRect(new Rect(0, 0, width, h), 3, 3);
  ctx.addPath(track);
  ctx.setFillColor(C.track);
  ctx.fillPath();
  const p = Math.max(0.03, Math.min(1, pct));
  const fill = new Path();
  fill.addRoundedRect(new Rect(width * (1 - p), 0, width * p, h), 3, 3);
  ctx.addPath(fill);
  ctx.setFillColor(color);
  ctx.fillPath();
  return ctx.getImage();
}

function dot(color) {
  const ctx = new DrawContext();
  ctx.size = new Size(8, 8);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  ctx.setFillColor(color);
  ctx.fillEllipse(new Rect(0, 0, 8, 8));
  return ctx.getImage();
}

function text(stack, value, font, color) {
  const t = stack.addText(value);
  t.font = font;
  t.textColor = color;
  return t;
}

function macro(stack, label, grams, color) {
  const col = stack.addStack();
  col.layoutVertically();
  col.centerAlignContent();
  const d = col.addStack();
  d.addSpacer();
  const img = d.addImage(dot(color));
  img.imageSize = new Size(7, 7);
  d.addSpacer();
  col.addSpacer(3);
  const v = col.addStack();
  v.addSpacer();
  text(v, grams + "ג׳", Font.boldSystemFont(14), C.text);
  v.addSpacer();
  const l = col.addStack();
  l.addSpacer();
  text(l, label, Font.systemFont(10), C.muted);
  l.addSpacer();
}

const w = new ListWidget();
w.backgroundColor = C.bg;
w.url = APP;
w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
const small = config.widgetFamily === "small";
w.setPadding(small ? 12 : 14, 16, small ? 12 : 12, 16);

if (data.error) {
  const t = w.addText(data.error === "Unauthorized" ? "הקוד לא תקין, צרו קוד חדש באפליקציה" : data.error);
  t.font = Font.systemFont(12);
  t.textColor = C.muted;
  t.rightAlignText();
} else {
  const goal = data.calorie_goal || 1400;
  const pct = data.calories / goal;
  const over = data.calories > goal;
  const color = over ? C.over : C.olive;
  const left = goal - data.calories;

  if (small) {
    w.addSpacer();
    const r = w.addStack();
    r.addSpacer();
    const img = r.addImage(ring(pct, 76, color));
    img.imageSize = new Size(76, 76);
    r.addSpacer();
    w.addSpacer(6);
    const n = w.addStack();
    n.addSpacer();
    text(n, data.calories.toLocaleString(), Font.boldSystemFont(22), C.text);
    text(n, " קק״ל", Font.systemFont(12), C.muted);
    n.addSpacer();
    w.addSpacer();
  } else {
    // Top: numbers (left side of the stack = visually left) and ring on the right
    const top = w.addStack();
    top.layoutHorizontally();
    top.centerAlignContent();

    const info = top.addStack();
    info.layoutVertically();
    const big = info.addStack();
    big.addSpacer();
    text(big, "קק״ל ", Font.systemFont(13), C.muted);
    text(big, data.calories.toLocaleString(), Font.boldSystemFont(30), C.text);
    info.addSpacer(2);
    const rem = info.addStack();
    rem.addSpacer();
    text(rem, over ? (-left).toLocaleString() + " מעל היעד של " + goal.toLocaleString() : "נותרו " + left.toLocaleString() + " קק״ל מתוך " + goal.toLocaleString(), Font.systemFont(11), C.muted);
    info.addSpacer(8);
    const b = info.addImage(bar(pct, 170, color));
    b.imageSize = new Size(170, 6);
    b.rightAlignImage();

    top.addSpacer(14);
    const r = top.addImage(ring(pct, 72, color));
    r.imageSize = new Size(72, 72);

    w.addSpacer(10);
    const sep = w.addImage(bar(0, 300, C.line));
    sep.imageSize = new Size(300, 1);
    w.addSpacer(8);

    // Macros row, right to left: protein, carbs, fat
    const m = w.addStack();
    m.layoutHorizontally();
    macro(m, "שומן", data.fat || 0, C.fat);
    m.addSpacer();
    macro(m, "פחמימות", data.carbs || 0, C.carbs);
    m.addSpacer();
    macro(m, "חלבון", data.protein || 0, C.protein);
  }
}

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
