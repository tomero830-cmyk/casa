// Color theme catalog. Applied via prefs.js as html[data-theme]; "sage" is the :root palette in index.css.
export const THEMES = [
  { id: "sage", name: "מרווה וחול", note: "רך ושקט, ירוק עדין על רקע פשתן", swatch: ["#e9e4da", "#5b7a60", "#d9cbb5"] },
  { id: "forest", name: "יער", note: "לבן נקי וירוק עמוק, הכי מקצועי וחד", swatch: ["#f5f4f1", "#265c40", "#e0e9e3"] },
  { id: "coffee", name: "קפה", note: "לאטה חמים וחום קפה, ירוק כהדגשה", swatch: ["#e6dccd", "#73553d", "#d5ddd4"] },
  { id: "olive", name: "זית וטרקוטה", note: "ירוק זית ונגיעות כתום-אדמה על רקע בהיר מאוד", swatch: ["#faf7f1", "#5d6a43", "#e9c9b8"] },
];

/** Household default, chosen in the design picker. */
export const DEFAULT_THEME = "olive";
