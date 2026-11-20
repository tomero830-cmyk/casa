// Local-date helpers. Dates are stored as "YYYY-MM-DD" in the device's local time zone.
// Never use toISOString() for a calendar date: it is UTC, which in Israel is still
// "yesterday" until 02:00/03:00 local time.

const pad = (n) => String(n).padStart(2, "0");

/** Local calendar date of a Date as "YYYY-MM-DD". */
export function toDateStr(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today's local date as "YYYY-MM-DD". */
export function todayStr() {
  return toDateStr(new Date());
}

/** Parses "YYYY-MM-DD" as local noon (safe against DST and UTC shifts). */
export function parseDateStr(str) {
  return new Date(`${str}T12:00:00`);
}

/** Adds (or subtracts) whole days to a "YYYY-MM-DD" string. */
export function addDaysStr(str, days) {
  const [y, m, d] = str.split("-").map(Number);
  return toDateStr(new Date(y, m - 1, d + days));
}
