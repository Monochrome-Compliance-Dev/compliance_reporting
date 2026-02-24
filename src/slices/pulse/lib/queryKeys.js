export const qk = {
  clients: ["pulse", "clients"],
  resources: ["pulse", "resources"],
  trackables: (params = {}) => ["pulse", "trackables", params],
  activeBudget: (trackableId) => [
    "pulse",
    "trackables",
    trackableId,
    "budget",
    "active",
  ],
  lines: (budgetId) => ["pulse", "budgets", budgetId, "lines"],
  assignments: (lineId) => ["pulse", "lines", lineId, "assignments"],
  contributions: (filters = {}) => ["pulse", "contributions", filters],
};
