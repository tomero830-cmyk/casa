// Per-device look & feel preferences, applied live as data-* attributes on <html>.
// Stored in localStorage (a convenience: the Home Screen app and Safari keep separate copies).
import { useSyncExternalStore } from "react";
import { THEMES, DEFAULT_THEME } from "@/lib/theme";

const KEY = "casa-prefs";
const LEGACY_THEME_KEY = "casa-theme";

export const DEFAULT_PREFS = {
  theme: DEFAULT_THEME,      // see THEMES
  mode: "auto",              // auto | light | dark
  font: "classic",           // classic (serif headings) | modern | rounded
  textSize: "normal",        // normal | large
  radius: "round",           // round | soft
  motion: "on",              // on | off
  icon: "3",                 // 1..4 (Home Screen icon)
  home: { walk: true, runs: true, goal: true, today: true, weekly: true },
};

export const ICONS = [
  { id: "1", name: "גג, ארובה ועלה" },
  { id: "2", name: "קשת ומונוגרמה" },
  { id: "3", name: "בית ועלים" },
  { id: "4", name: "ירוק עם חלון" },
];

function read() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null");
    const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY);
    const base = { ...DEFAULT_PREFS, ...(legacyTheme ? { theme: legacyTheme } : {}) };
    return stored ? { ...base, ...stored, home: { ...DEFAULT_PREFS.home, ...(stored.home || {}) } } : base;
  } catch {
    return DEFAULT_PREFS;
  }
}

let current = typeof window === "undefined" ? DEFAULT_PREFS : read();
const listeners = new Set();

function setAttr(name, value, fallback) {
  const el = document.documentElement;
  if (value === fallback || value == null) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

function setLink(rel, href, type) {
  let link = document.querySelector(`link[rel="${rel}"]`);
  if (!link) { link = document.createElement("link"); link.rel = rel; document.head.appendChild(link); }
  link.href = href;
  if (type) link.type = type;
}

/** Applies preferences to the document (attributes + icons). */
export function applyPrefs(prefs = current) {
  const theme = THEMES.some(t => t.id === prefs.theme) ? prefs.theme : DEFAULT_THEME;
  setAttr("data-theme", theme, "sage");
  setAttr("data-mode", prefs.mode, "auto");
  setAttr("data-font", prefs.font, "classic");
  setAttr("data-text", prefs.textSize, "normal");
  setAttr("data-radius", prefs.radius, "round");
  setAttr("data-motion", prefs.motion, "on");
  // iOS reads apple-touch-icon when the app is added to the Home Screen
  setLink("apple-touch-icon", `/icons/option-${prefs.icon}-180.png`);
  setLink("icon", `/icons/option-${prefs.icon}.svg`, "image/svg+xml");
}

export function getPrefs() {
  return current;
}

/** Updates (part of) the preferences, persists and applies them. */
export function setPrefs(patch) {
  current = { ...current, ...patch, home: { ...current.home, ...(patch.home || {}) } };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* private mode: won't persist */ }
  applyPrefs(current);
  listeners.forEach(l => l());
}

export function resetPrefs() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(LEGACY_THEME_KEY); } catch { /* ignore */ }
  current = { ...DEFAULT_PREFS };
  applyPrefs(current);
  listeners.forEach(l => l());
}

/** React hook: current preferences, re-rendering on change. */
export function usePrefs() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => current,
    () => DEFAULT_PREFS
  );
}
