// Pulse v2 service — thin, explicit endpoints
// Best practice: components/hooks call this service; service calls fetch-wrapper.
// No React imports here. .js only.

import { fetchWrapper } from "lib/utils/fetch-wrapper";

const API = process.env.REACT_APP_API_URL || ""; // ptrsApi style base
const base = `${API}/api/pulse`;

// Clients
export const listClients = () => fetchWrapper.get(`${base}/clients`);
export const createClient = (payload) =>
  fetchWrapper.post(`${base}/clients`, payload);
export const updateClient = (id, payload) =>
  fetchWrapper.put(`${base}/clients/${id}`, payload);

// Resources
export const listResources = () => fetchWrapper.get(`${base}/resources`);
export const createResource = (payload) =>
  fetchWrapper.post(`${base}/resources`, payload);
export const updateResource = (id, payload) =>
  fetchWrapper.put(`${base}/resources/${id}`, payload);

// Trackables
export const listTrackables = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetchWrapper.get(`${base}/trackables${q ? `?${q}` : ""}`);
};

// Budgets
export const getActiveBudgetByTrackable = (trackableId) =>
  fetchWrapper.get(
    `${base}/budgets/active?trackableId=${encodeURIComponent(trackableId)}`
  );

export const listBudgetLines = (budgetId) =>
  fetchWrapper.get(`${base}/budgets/${encodeURIComponent(budgetId)}/lines`);

// Allocations
export const listAllocationsByLine = (budgetLineId) =>
  fetchWrapper.get(
    `${base}/allocations?budgetLineId=${encodeURIComponent(budgetLineId)}`
  );

// Contributions
export const listContributions = ({ budgetLineId, resourceId } = {}) => {
  const params = new URLSearchParams();
  if (budgetLineId) params.append("budgetLineId", budgetLineId);
  if (resourceId) params.append("resourceId", resourceId);
  const qs = params.toString();
  return fetchWrapper.get(`${base}/contributions${qs ? `?${qs}` : ""}`);
};

export const createContribution = (payload) =>
  fetchWrapper.post(`${base}/contributions`, payload);

export const updateContribution = (id, payload) =>
  fetchWrapper.put(`${base}/contributions/${id}`, payload);

export const patchContribution = (id, payload) =>
  fetchWrapper.patch(`${base}/contributions/${id}`, payload);

export const deleteContribution = (id) =>
  fetchWrapper.delete(`${base}/contributions/${id}`);
