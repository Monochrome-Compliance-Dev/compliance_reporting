import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/pulse`;

function buildCrudReal(entity) {
  const entityUrl = `${baseUrl}/${entity}`;
  return {
    list: async () => fetchWrapper.get(entityUrl),
    getById: async (id) => fetchWrapper.get(`${entityUrl}/${id}`),
    create: async (params) => fetchWrapper.post(entityUrl, params),
    update: async (id, params) =>
      fetchWrapper.put(`${entityUrl}/${id}`, params),
    patch: async (id, params) =>
      fetchWrapper.patch(`${entityUrl}/${id}`, params),
    delete: async (id) => fetchWrapper.delete(`${entityUrl}/${id}`),
  };
}

const buildCrud = buildCrudReal;

export const pulseService = {
  resources: buildCrud("resources"),
  assignments: {
    ...buildCrud("assignments"),
    listByEngagement: (engagementId) =>
      fetchWrapper.get(
        `${baseUrl}/assignments?engagementId=${encodeURIComponent(engagementId)}`
      ),
  },
  clients: buildCrud("clients"),
  engagements: buildCrud("engagements"),
  timesheets: buildCrud("timesheets"),
  // Matches server routes in budget.controller.js → /pulse/budget-items
  budgetItems: {
    ...buildCrud("budget-items"),
    // Convenience helper when filtering by engagement on the server
    listByEngagement: async (engagementId) =>
      fetchWrapper.get(
        `${baseUrl}/budget-items?engagementId=${encodeURIComponent(engagementId)}`
      ),
  },
};
