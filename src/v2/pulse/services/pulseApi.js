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
export const listResourceUtilisation = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return unwrap(
    fetchWrapper.get(`${base}/resource-utilisation${q ? `?${q}` : ""}`)
  ).then((res) => (Array.isArray(res) ? res : []));
};

// Trackables
export const listTrackables = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return unwrap(fetchWrapper.get(`${base}/trackables${q ? `?${q}` : ""}`)).then(
    (res) => (Array.isArray(res) ? res : [])
  );
};
export const getTrackableById = (id) =>
  unwrap(fetchWrapper.get(`${base}/trackables/${encodeURIComponent(id)}`));
export const createTrackable = (payload) =>
  unwrap(fetchWrapper.post(`${base}/trackables`, payload));
export const updateTrackable = (id, payload) =>
  unwrap(
    fetchWrapper.put(`${base}/trackables/${encodeURIComponent(id)}`, payload)
  );
export const patchTrackable = (id, payload) =>
  unwrap(
    fetchWrapper.patch(`${base}/trackables/${encodeURIComponent(id)}`, payload)
  );
export const deleteTrackable = (id) =>
  unwrap(fetchWrapper.delete(`${base}/trackables/${encodeURIComponent(id)}`));

// Assignments (per trackable)
export const listAssignmentsByTrackable = (trackableId, params = {}) => {
  const q = new URLSearchParams({ ...params, trackableId }).toString();
  return unwrap(fetchWrapper.get(`${base}/assignments${q ? `?${q}` : ""}`));
};
export const createAssignment = (payload) =>
  unwrap(fetchWrapper.post(`${base}/assignments`, payload));
export const updateAssignment = (id, payload) =>
  unwrap(
    fetchWrapper.put(`${base}/assignments/${encodeURIComponent(id)}`, payload)
  );
export const deleteAssignment = (id) =>
  unwrap(fetchWrapper.delete(`${base}/assignments/${encodeURIComponent(id)}`));

// Budgets
export const getActiveBudgetByTrackable = (trackableId) =>
  unwrap(
    fetchWrapper.get(
      `${base}/budgets/active?trackableId=${encodeURIComponent(trackableId)}`
    )
  );

// Legacy naming: listBudgetItems points to the same endpoint as listItemsByBudget.
export const listBudgetItems = (budgetId) =>
  unwrap(
    fetchWrapper.get(
      `${base}/budget-items?budgetId=${encodeURIComponent(budgetId)}`
    )
  );

// Contributions
export const listContributions = ({ budgetItemId, resourceId } = {}) => {
  const params = new URLSearchParams();
  if (budgetItemId) params.append("budgetItemId", budgetItemId);
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

// Label projection for Assignments UI
export const listBudgetItemLabels = (budgetId) =>
  unwrap(
    fetchWrapper.get(
      `${base}/budget-items/labels?budgetId=${encodeURIComponent(budgetId)}`
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

// --- Budget Summary (computed on FE from items) ---
export const getBudgetSummary = async (budgetId) => {
  if (!budgetId) return { totalAmount: 0, totalHours: 0 };
  const items = await listItemsByBudget(budgetId);
  const arr = Array.isArray(items) ? items : [];
  let totalAmount = 0;
  let totalHours = 0;
  for (const it of arr) {
    const hours = Number(it.numberOfHours ?? it.hours ?? 0) || 0;
    const rate = Number(it.chargeOutRate ?? it.rate ?? 0) || 0;
    const flat = Number(it.flatAmount ?? 0) || 0;
    totalHours += hours;
    totalAmount += flat || hours * rate;
  }
  return { totalAmount, totalHours };
};
