// Data Hub service.
// Uploaded dataset calls use the real Data Hub endpoints exposed by dataset.routes.js.
// Top-level dataset asset CRUD is not currently exposed by the backend routes file.
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects. .js only.

import { fetchWrapper, getCurrentCustomer } from "shared/utils";

// Avoid trailing slashes. Kept here so the real BE alignment is straightforward later.
export const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(
  /\/+$/,
  "",
);

// -------------------- Helpers --------------------
export const pickData = (res) =>
  (res && res.data && res.data.data) || res?.data || res || {};

function getCustomerContext() {
  const customer = getCurrentCustomer?.() || {};
  return {
    customerId: customer.id || customer.customerId || null,
    customerName: customer.name || customer.label || "Customer",
    profileId: customer.profileId || null,
    profileName: customer.profileName || "Current profile",
  };
}

export const normaliseProfile = (x = {}) => ({
  ...x,
  id: x.id,
  profileId: x.profileId || x.id,
  customerId: x.customerId,
  name: x.name || x.label || x.profileName || null,
  profileName: x.profileName || x.name || x.label || null,
  code: x.code || null,
  isDefault: Boolean(x.isDefault || x.default || false),
  meta: x.meta || null,
});

export const normaliseProfileList = (arr = []) => arr.map(normaliseProfile);

export const normaliseDataHubDataset = (x = {}) => ({
  ...x,
  id: x.id,
  customerId: x.customerId,
  profileId: x.profileId,
  datasetType: x.datasetType || null,
  sourceName: x.sourceName || null,
  fileName: x.fileName || x.originalFileName || x.sourceName || null,
  rowsCount: Number(x.rowsCount || 0),
  status: x.status || "uploaded",
  createdAt: x.createdAt || null,
  updatedAt: x.updatedAt || null,
});

export const normaliseDataHubDatasetList = (arr = []) =>
  arr.map(normaliseDataHubDataset);

export const normaliseDataset = (x = {}) => ({
  ...x,
  id: x.id,
  datasetType: x.datasetType || null,
  fileName: x.fileName || x.originalFileName || x.sourceName || null,
  fileSize: x.fileSize || null,
  mimeType: x.mimeType || null,
  rowsCount: Number(x.rowsCount || 0),
  headers: Array.isArray(x.headers) ? x.headers : [],
  headersCount: Array.isArray(x.headers)
    ? x.headers.length
    : Number(x.headersCount || 0),
  status: x.status || "uploaded",
  createdAt: x.createdAt || null,
  updatedAt: x.updatedAt || null,
});

export const normaliseDatasetList = (arr = []) => arr.map(normaliseDataset);

export const normaliseSample = (x = {}) => ({
  headers: Array.isArray(x.headers) ? x.headers : [],
  rows: Array.isArray(x.rows) ? x.rows : [],
  total:
    typeof x.total === "number"
      ? x.total
      : typeof x.rowsCount === "number"
        ? x.rowsCount
        : Array.isArray(x.rows)
          ? x.rows.length
          : 0,
  headerMeta:
    x.headerMeta && typeof x.headerMeta === "object" ? x.headerMeta : {},
});

export const normaliseDatasetMap = (x = {}) => ({
  ...x,
  id: x.id,
  customerId: x.customerId,
  profileId: x.profileId,
  datasetType: x.datasetType || null,
  fieldMapping:
    x.fieldMapping && typeof x.fieldMapping === "object" ? x.fieldMapping : {},
  mappingStatus: x.mappingStatus || "draft",
  mappedCount: Number(x.mappedCount || 0),
  recommendedCount: Number(x.recommendedCount || 0),
  updatedAt: x.updatedAt || null,
});

export const normaliseDatasetStatus = (x = {}) => ({
  id: x.id || null,
  status: x.status || "Uploaded",
  currentStep: x.currentStep || "upload",
  steps: {
    upload: x.steps?.upload || "pending",
    map: x.steps?.map || "pending",
    publish: x.steps?.publish || "pending",
  },
  metrics: x.metrics || null,
  updatedAt: x.updatedAt || null,
});

// -------------------- Profiles --------------------
export const listProfiles = async (customerId) => {
  if (!customerId) throw new Error("customerId is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/customers/${encodeURIComponent(customerId)}/profiles`,
  );

  const data = pickData(res);
  const items = Array.isArray(data) ? data : data?.items || [];

  return { items: normaliseProfileList(items) };
};

// -------------------- Data Hub Datasets --------------------
export const listDataHubDatasets = async (params = {}) => {
  const context = getCustomerContext();
  const profileId = params.profileId || context.profileId;

  if (!profileId) throw new Error("profileId is required");

  const search = new URLSearchParams();
  search.set("profileId", profileId);
  if (params.datasetType) {
    search.set("datasetType", params.datasetType);
  }

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/data-hub/datasets?${search.toString()}`,
  );

  const data = pickData(res);
  return { items: normaliseDatasetList(data.items || data || []) };
};

export const uploadDataHubDataset = async (payload = {}) => {
  if (!payload.profileId) throw new Error("profileId is required");
  if (!payload.datasetType) throw new Error("datasetType is required");
  if (!payload.file) throw new Error("file is required");

  const formData = new FormData();

  formData.append("profileId", String(payload.profileId));
  formData.append("datasetType", String(payload.datasetType));
  formData.append("sourceType", "csv");
  formData.append(
    "sourceName",
    payload.sourceName || payload.label || payload.name || payload.file.name,
  );
  formData.append("file", payload.file);

  const res = await fetchWrapper.postUpload(
    `${API_ROOT}/v2/data-hub/datasets`,
    formData,
  );

  return normaliseDataset(pickData(res));
};

export const getDataHubDataset = async (id, params = {}) => {
  if (!id) throw new Error("id is required");

  const context = getCustomerContext();
  const profileId = params.profileId || context.profileId;
  if (!profileId) throw new Error("profileId is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/data-hub/datasets/${encodeURIComponent(id)}?profileId=${encodeURIComponent(profileId)}`,
  );

  return normaliseDataset(pickData(res));
};

export const updateDataHubDataset = async () => {
  throw new Error(
    "General Data Hub dataset update endpoint is not implemented. Use a specific endpoint such as updateDataHubDatasetMap.",
  );
};

export const deleteDataHubDataset = async (id, params = {}) => {
  if (!id) throw new Error("id is required");

  const context = getCustomerContext();
  const profileId = params.profileId || context.profileId;
  if (!profileId) throw new Error("profileId is required");

  const res = await fetchWrapper.delete(
    `${API_ROOT}/v2/data-hub/datasets/${encodeURIComponent(id)}?profileId=${encodeURIComponent(profileId)}`,
  );

  return pickData(res);
};

// -------------------- Status / Readiness --------------------

export const getDatasetSample = async (id, params = {}) => {
  if (!id) throw new Error("id is required");

  const context = getCustomerContext();
  const profileId = params.profileId || context.profileId;
  if (!profileId) throw new Error("profileId is required");

  const search = new URLSearchParams();
  search.set("profileId", profileId);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.offset) search.set("offset", String(params.offset));

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/data-hub/datasets/${encodeURIComponent(id)}/sample?${search.toString()}`,
  );

  return normaliseSample(pickData(res));
};

export const getDataHubDatasetMap = async (id, params = {}) => {
  if (!id) throw new Error("id is required");

  const context = getCustomerContext();
  const profileId = params.profileId || context.profileId;
  if (!profileId) throw new Error("profileId is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/data-hub/datasets/${encodeURIComponent(id)}/map?profileId=${encodeURIComponent(profileId)}`,
  );

  return normaliseDatasetMap(pickData(res));
};

export const updateDataHubDatasetMap = async (id, payload = {}) => {
  if (!id) throw new Error("id is required");

  const context = getCustomerContext();
  const profileId = payload.profileId || context.profileId;
  if (!profileId) throw new Error("profileId is required");

  const fieldMapping =
    payload.fieldMapping && typeof payload.fieldMapping === "object"
      ? payload.fieldMapping
      : null;

  if (!fieldMapping) throw new Error("fieldMapping is required");

  const res = await fetchWrapper.patch(
    `${API_ROOT}/v2/data-hub/datasets/${encodeURIComponent(id)}/map`,
    {
      profileId,
      fieldMapping,
    },
  );

  return normaliseDatasetMap(pickData(res));
};
