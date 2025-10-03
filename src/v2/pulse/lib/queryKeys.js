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
  allocations: (lineId) => ["pulse", "lines", lineId, "allocations"],
  contributions: (filters = {}) => ["pulse", "contributions", filters],
};
