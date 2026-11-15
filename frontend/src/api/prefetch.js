import { prefetch } from "./useApi";

// Param objects must match what each page sends (same keys, same order).
function routeData(path) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const map = {
    "/": [["/dashboard/overview", {}]],
    "/transactions": [["/transactions", { page: 1, limit: 10 }], ["/categories", {}]],
    "/categories": [["/categories", {}]],
    "/analytics": [["/analytics/monthly-trend", { months: 6 }], ["/analytics/category-report", { type: "expense" }]],
    "/budgets": [["/budgets", { month, year }], ["/categories", {}]],
    "/goals": [["/goals", {}]],
    "/calendar": [["/dashboard/calendar", { month, year }]],
  };
  return map[path] || [];
}

export function prefetchRoute(path) {
  routeData(path).forEach(([url, params]) => prefetch(url, params));
}

// After the dashboard paints, quietly load the other pages so navigation feels instant.
export function prefetchAll() {
  ["/transactions", "/categories", "/budgets", "/goals", "/analytics", "/calendar"].forEach(prefetchRoute);
}
