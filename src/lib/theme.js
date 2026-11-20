// Per-device color theme (a convenience, not synced): stored in localStorage and
// applied as html[data-theme]. "sage" is the default palette in index.css.
export const THEMES = [
  { id: "sage", name: "מרווה וחול", note: "רך ושקט, ירוק עדין על רקע פשתן", swatch: ["#e9e4da", "#5b7a60", "#d9cbb5"] },
  { id: "forest", name: "יער", note: "לבן נקי וירוק עמוק, הכי מקצועי וחד", swatch: ["#f5f4f1", "#265c40", "#e0e9e3"] },
  { id: "coffee", name: "קפה", note: "לאטה חמים וחום קפה, ירוק כהדגשה", swatch: ["#e6dccd", "#73553d", "#d5ddd4"] },
  { id: "olive", name: "זית וטרקוטה", note: "ירוק זית עם נגיעות כתום-אדמה", swatch: ["#efe9dc", "#5d6a43", "#e9c9b8"] },
];

const KEY = "casa-theme";

export function getTheme() {
  try { return localStorage.getItem(KEY) || "sage"; } catch { return "sage"; }
}

export function applyTheme(id) {
  const theme = THEMES.some(t => t.id === id) ? id : "sage";
  if (theme === "sage") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem(KEY, theme); } catch { /* private mode: theme just won't persist */ }
  return theme;
}
