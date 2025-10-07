// Pulse v2 service — thin, explicit endpoints
// Best practice: components/hooks call this service; service calls fetch-wrapper.
// No React imports here. .js only.

import { fetchWrapper } from "lib/utils/fetch-wrapper";

const API = process.env.REACT_APP_API_URL || ""; // ptrsApi style base

const base = `${API}/pulse`;

// Uniformly unwrap `{ data: ... }` API responses
const unwrap = (promise) =>
  Promise.resolve(promise).then((res) =>
    res &&
    typeof res === "object" &&
    Object.prototype.hasOwnProperty.call(res, "data")
      ? res.data
      : res
  );

// Clients
export const listClients = () => unwrap(fetchWrapper.get(`${base}/clients`));
export const createClient = (payload) =>
  unwrap(fetchWrapper.post(`${base}/clients`, payload));
export const updateClient = (id, payload) =>
  unwrap(fetchWrapper.put(`${base}/clients/${id}`, payload));

// Resources
export const listResources = () =>
  unwrap(fetchWrapper.get(`${base}/resources`));
export const createResource = (payload) =>
  unwrap(fetchWrapper.post(`${base}/resources`, payload));
export const updateResource = (id, payload) =>
  unwrap(fetchWrapper.put(`${base}/resources/${id}`, payload));
export const deleteResource = (id, options = {}) =>
  unwrap(fetchWrapper.delete(`${base}/resources/${id}`, options));

// Trackables
export const listTrackables = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return unwrap(fetchWrapper.get(`${base}/trackables${q ? `?${q}` : ""}`));
};

// Budgets

export const getActiveBudgetByTrackable = (trackableId) =>
  unwrap(
    fetchWrapper.get(
      `${base}/budgets/active?trackableId=${encodeURIComponent(trackableId)}`
    )
  );

export const listBudgetLines = (budgetId) =>
  unwrap(
    fetchWrapper.get(`${base}/budgets/${encodeURIComponent(budgetId)}/lines`)
  );

// Contributions
export const listContributions = ({ budgetLineId, resourceId } = {}) => {
  const params = new URLSearchParams();
  if (budgetLineId) params.append("budgetLineId", budgetLineId);
  if (resourceId) params.append("resourceId", resourceId);
  const qs = params.toString();
  return unwrap(fetchWrapper.get(`${base}/contributions${qs ? `?${qs}` : ""}`));
};

export const createContribution = (payload) =>
  unwrap(fetchWrapper.post(`${base}/contributions`, payload));

export const updateContribution = (id, payload) =>
  unwrap(fetchWrapper.put(`${base}/contributions/${id}`, payload));

export const patchContribution = (id, payload) =>
  unwrap(fetchWrapper.patch(`${base}/contributions/${id}`, payload));

export const deleteContribution = (id) =>
  unwrap(fetchWrapper.delete(`${base}/contributions/${id}`));

// --- Budgets (admin) ---
export const listBudgets = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return unwrap(fetchWrapper.get(`${base}/budgets${q ? `?${q}` : ""}`));
};
export const getBudgetById = (id) =>
  unwrap(fetchWrapper.get(`${base}/budgets/${encodeURIComponent(id)}`));
export const createBudget = (payload) =>
  unwrap(fetchWrapper.post(`${base}/budgets`, payload));
export const updateBudget = (id, payload) =>
  unwrap(
    fetchWrapper.put(`${base}/budgets/${encodeURIComponent(id)}`, payload)
  );
export const listUnlinkedBudgets = () =>
  unwrap(fetchWrapper.get(`${base}/budgets?unlinked=true`));
export const linkBudgetToTrackable = ({ trackableId, budgetId }) =>
  unwrap(fetchWrapper.post(`${base}/budgets/link`, { trackableId, budgetId }));

// --- Budget Sections ---
export const listSectionsByBudget = (budgetId) =>
  unwrap(
    fetchWrapper.get(`${base}/budgets/${encodeURIComponent(budgetId)}/sections`)
  );
export const createSection = (budgetId, payload) =>
  unwrap(
    fetchWrapper.post(
      `${base}/budgets/${encodeURIComponent(budgetId)}/sections`,
      payload
    )
  );
export const updateSection = (id, payload) =>
  unwrap(
    fetchWrapper.put(
      `${base}/budget-sections/${encodeURIComponent(id)}`,
      payload
    )
  );
export const deleteSection = (id) =>
  unwrap(
    fetchWrapper.delete(`${base}/budget-sections/${encodeURIComponent(id)}`)
  );

// --- Budget Items ---
export const listItemsByBudget = (budgetId) =>
  unwrap(
    fetchWrapper.get(
      `${base}/budget-items?budgetId=${encodeURIComponent(budgetId)}`
    )
  );
export const createItem = (payload) =>
  unwrap(fetchWrapper.post(`${base}/budget-items`, payload));
export const updateItem = (id, payload) =>
  unwrap(
    fetchWrapper.put(`${base}/budget-items/${encodeURIComponent(id)}`, payload)
  );
export const deleteItem = (id) =>
  unwrap(fetchWrapper.delete(`${base}/budget-items/${encodeURIComponent(id)}`));
