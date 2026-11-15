// Dates are stored at UTC midnight, so they are always displayed in UTC
// (this keeps the weekday/date exactly what the user picked).
const FULL = { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" };

export function inr(n, decimals = 2) {
  return (
    "₹ " +
    Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

export function compactInr(v) {
  const n = Number(v || 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${sign}₹${+(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${abs}`;
}

// "Wed, 04 Nov 2026"
export function formatDate(d) {
  if (!d) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-IN", FULL).formatToParts(new Date(d)).map((p) => [p.type, p.value])
  );
  return `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`;
}

// "Wednesday" (or "Wed" with long=false)
export function formatDay(d, long = true) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { weekday: long ? "long" : "short", timeZone: "UTC" });
}

// "04 Nov"
export function formatShort(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", timeZone: "UTC" });
}

// yyyy-mm-dd for <input type="date"> from a stored date
export function toInputDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

// Today's date in the user's own timezone, yyyy-mm-dd
export function todayInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function firstOfMonthInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export function capitalize(s = "") {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
