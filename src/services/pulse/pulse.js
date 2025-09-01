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

// ---- light payload sanitizers for UI safety ----
const _isFiniteNumber = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};
const _asString = (x, fallback = "") => {
  if (x === null || x === undefined) return fallback;
  if (typeof x === "string" || typeof x === "number" || typeof x === "boolean")
    return String(x);
  try {
    return JSON.stringify(x);
  } catch {
    return fallback;
  }
};
const _sanitizeUtilRows = (input) => {
  if (!Array.isArray(input)) return [];
  return input.map((r) => {
    const byEngRaw = Array.isArray(r?.byEngagement) ? r.byEngagement : [];
    const byEngagement = byEngRaw
      .map((e) => ({
        engagementId: _asString(e?.engagementId, ""),
        engagementName: _asString(e?.engagementName, ""),
        hours: _isFiniteNumber(e?.hours),
      }))
      .filter((e) => e.engagementId || e.engagementName || e.hours > 0);
    return {
      resourceId: _asString(r?.resourceId, _asString(r?.id, "")),
      resourceName: _asString(r?.resourceName, _asString(r?.name, "")),
      role: _asString(r?.role, ""),
      capacityHours: _isFiniteNumber(r?.capacityHours),
      loggedHours: _isFiniteNumber(r?.loggedHours),
      utilPct: _isFiniteNumber(r?.utilPct),
      byEngagement,
    };
  });
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
  budgets: {
    ...buildCrud("budgets"),
    // Override list to support optional query params (e.g., { unlinked: true })
    async list(query) {
      if (!query || Object.keys(query).length === 0) {
        return unwrapArray(await fetchWrapper.get(`${baseUrl}/budgets`));
      }
      const qs = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "")
          qs.append(k, String(v));
      });
      return unwrapArray(
        await fetchWrapper.get(`${baseUrl}/budgets?${qs.toString()}`)
      );
    },
    // List budgets that are not linked to any engagement (engagementId IS NULL)
    async listUnlinked() {
      return unwrapArray(
        await fetchWrapper.get(`${baseUrl}/budgets?unlinked=true`)
      );
    },
    // Link an existing unlinked budget to a specific engagement
    async linkToEngagement({ engagementId, budgetId }) {
      if (!engagementId || !budgetId)
        throw new Error("engagementId and budgetId are required");
      return unwrap(
        await fetchWrapper.post(
          `${baseUrl}/engagements/${encodeURIComponent(engagementId)}/link-budget/${encodeURIComponent(budgetId)}`,
          {}
        )
      );
    },
  },
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
    utilisation: async ({ from, to, includeNonBillable } = {}) => {
      const qs = new URLSearchParams();
      if (from) qs.append("from", String(from));
      if (to) qs.append("to", String(to));
      if (includeNonBillable !== undefined)
        qs.append("includeNonBillable", String(includeNonBillable));
      return unwrapArray(
        await fetchWrapper.get(
          `${baseUrl}/timesheets/utilisation?${qs.toString()}`
        )
      );
    },
    utilisationSanitized: async (params = {}) => {
      const raw = await pulseService.timesheets.utilisation(params);
      return _sanitizeUtilRows(raw);
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
  budgetSections: {
    // List sections for a given budget
    async listByBudget(budgetId) {
      return unwrapArray(
        await fetchWrapper.get(
          `${baseUrl}/budgets/${encodeURIComponent(budgetId)}/sections`
        )
      );
    },
    // Create a section under a budget
    async create(payload) {
      const { budgetId, ...rest } = payload || {};
      if (!budgetId) {
        throw new Error("budgetId is required to create a section");
      }
      return unwrap(
        await fetchWrapper.post(
          `${baseUrl}/budgets/${encodeURIComponent(budgetId)}/sections`,
          rest
        )
      );
    },
    // Update a section by id
    async update(sectionId, body) {
      return unwrap(
        await fetchWrapper.patch(
          `${baseUrl}/budget-sections/${encodeURIComponent(sectionId)}`,
          body
        )
      );
    },
    // Delete a section by id
    async delete(sectionId) {
      return fetchWrapper.delete(
        `${baseUrl}/budget-sections/${encodeURIComponent(sectionId)}`
      );
    },
  },

  // Dashboard metrics
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
