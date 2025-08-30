import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/pulse`;
const dashboardBaseUrl = `${baseUrl}/dashboard`;

// ---- response normalisers (service-level) ----
const unwrap = (res) =>
  res && typeof res === "object" && "data" in res ? res.data : res;
const unwrapArray = (res) => {
  const arr = unwrap(res);
  if (Array.isArray(arr)) return arr;
  if (Array.isArray(arr?.items)) return arr.items;
  if (Array.isArray(arr?.rows)) return arr.rows;
  if (arr && typeof arr === "object") return Object.values(arr);
  return [];
};

function buildCrud(entity) {
  const entityUrl = `${baseUrl}/${entity}`;
  return {
    list: async () => unwrapArray(await fetchWrapper.get(entityUrl)),
    getById: async (id) => unwrap(await fetchWrapper.get(`${entityUrl}/${id}`)),
    create: async (params) =>
      unwrap(await fetchWrapper.post(entityUrl, params)),
    update: async (id, params) =>
      unwrap(await fetchWrapper.put(`${entityUrl}/${id}`, params)),
    patch: async (id, params) =>
      unwrap(await fetchWrapper.patch(`${entityUrl}/${id}`, params)),
    delete: async (id) => fetchWrapper.delete(`${entityUrl}/${id}`),
  };
}

export const pulseService = {
  resources: buildCrud("resources"),
  assignments: {
    ...buildCrud("assignments"),
    listByEngagement: (engagementId) =>
      fetchWrapper
        .get(
          `${baseUrl}/assignments?engagementId=${encodeURIComponent(engagementId)}`
        )
        .then(unwrapArray),
  },
  clients: buildCrud("clients"),
  engagements: buildCrud("engagements"),
  budgets: buildCrud("budgets"),
  timesheets: {
    ...buildCrud("timesheets"),
    rows: {
      list: async (timesheetId) =>
        unwrapArray(
          await fetchWrapper.get(
            `${baseUrl}/timesheets/${encodeURIComponent(timesheetId)}/rows`
          )
        ),
      create: async (timesheetId, body) =>
        unwrap(
          await fetchWrapper.post(
            `${baseUrl}/timesheets/${encodeURIComponent(timesheetId)}/rows`,
            body
          )
        ),
      update: async (rowId, body) =>
        unwrap(
          await fetchWrapper.put(
            `${baseUrl}/timesheets/rows/${encodeURIComponent(rowId)}`,
            body
          )
        ),
      patch: async (rowId, body) =>
        unwrap(
          await fetchWrapper.patch(
            `${baseUrl}/timesheets/rows/${encodeURIComponent(rowId)}`,
            body
          )
        ),
      delete: async (rowId) =>
        fetchWrapper.delete(
          `${baseUrl}/timesheets/rows/${encodeURIComponent(rowId)}`
        ),
    },
  },
  // Matches server routes in budget.controller.js → /pulse/budget-items
  budgetItems: {
    ...buildCrud("budget-items"),
    // Convenience helper when filtering by engagement on the server
    listByEngagement: async (engagementId) =>
      unwrapArray(
        await fetchWrapper.get(
          `${baseUrl}/budget-items?engagementId=${encodeURIComponent(engagementId)}`
        )
      ),
    // Helper to list items by budget
    listByBudget: async (budgetId) =>
      unwrapArray(
        await fetchWrapper.get(
          `${baseUrl}/budget-items?budgetId=${encodeURIComponent(budgetId)}`
        )
      ),
  },
  // Dashboard metrics, backed by pulse_dashboard.controller.js
  dashboard: {
    // Full payload
    get: async (orgId = "current") =>
      unwrap(
        await fetchWrapper.get(
          `${dashboardBaseUrl}/${encodeURIComponent(orgId)}`
        )
      ),
    // Individual sections
    totals: async (orgId = "current") =>
      unwrap(
        await fetchWrapper.get(
          `${dashboardBaseUrl}/${encodeURIComponent(orgId)}/totals`
        )
      ),
    status: async (orgId = "current") =>
      unwrapArray(
        await fetchWrapper.get(
          `${dashboardBaseUrl}/${encodeURIComponent(orgId)}/status`
        )
      ),
    weeklyBurn: async (orgId = "current") =>
      unwrapArray(
        await fetchWrapper.get(
          `${dashboardBaseUrl}/${encodeURIComponent(orgId)}/weekly-burn`
        )
      ),
    overruns: async (orgId = "current") =>
      unwrapArray(
        await fetchWrapper.get(
          `${dashboardBaseUrl}/${encodeURIComponent(orgId)}/overruns`
        )
      ),
    utilisation: async (orgId = "current") =>
      unwrapArray(
        await fetchWrapper.get(
          `${dashboardBaseUrl}/${encodeURIComponent(orgId)}/utilisation`
        )
      ),
    billable: async (orgId = "current") =>
      unwrapArray(
        await fetchWrapper.get(
          `${dashboardBaseUrl}/${encodeURIComponent(orgId)}/billable`
        )
      ),
    revenue: async (orgId = "current") =>
      unwrap(
        await fetchWrapper.get(
          `${dashboardBaseUrl}/${encodeURIComponent(orgId)}/revenue`
        )
      ),
    timeliness: async (orgId = "current") =>
      unwrap(
        await fetchWrapper.get(
          `${dashboardBaseUrl}/${encodeURIComponent(orgId)}/timeliness`
        )
      ),
    turnaround: async (orgId = "current") =>
      unwrapArray(
        await fetchWrapper.get(
          `${dashboardBaseUrl}/${encodeURIComponent(orgId)}/turnaround`
        )
      ),
  },
};
