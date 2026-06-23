// Data Hub service.
// Run CRUD calls the real /api/v2/data-hub/runs endpoints.
// Dataset/upload calls remain mock-backed until those BE endpoints exist.
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

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getCustomerContext() {
  const customer = getCurrentCustomer?.() || {};
  return {
    customerId: customer.id || customer.customerId || null,
    customerName: customer.name || customer.label || "Customer",
    profileId: customer.profileId || null,
    profileName: customer.profileName || "Current profile",
  };
}

export const normaliseRun = (x = {}) => ({
  ...x,
  id: x.id || x.runId,
  runId: x.runId || x.id,
  customerId: x.customerId || null,
  profileId: x.profileId || null,
  name: x.name || x.label || "Untitled Data Hub Run",
  description: x.description || null,
  status: x.status || "Created",
  currentStep: x.currentStep || "upload",
  profileName: x.profileName || null,
  coverage: x.coverage || "Not detected yet",
  paymentsRows: Number(x.paymentsRows || 0),
  invoicesRows: Number(x.invoicesRows || 0),
  supportingRows: Number(x.supportingRows || 0),
  createdAt: x.createdAt || null,
  updatedAt: x.updatedAt || null,
});

export const normaliseRunList = (arr = []) => arr.map(normaliseRun);

export const normaliseDataset = (x = {}) => ({
  ...x,
  id: x.id || x.datasetId,
  datasetId: x.datasetId || x.id,
  runId: x.runId || null,
  datasetType: x.datasetType || x.role || null,
  role: x.role || x.datasetType || null,
  fileName: x.fileName || null,
  fileSize: x.fileSize || null,
  mimeType: x.mimeType || null,
  rowsInserted: Number(x.rowsInserted || x.rowsCount || 0),
  rowsCount: Number(x.rowsCount || x.rowsInserted || 0),
  headers: Array.isArray(x.headers) ? x.headers : [],
  headersCount: Array.isArray(x.headers)
    ? x.headers.length
    : Number(x.headersCount || 0),
  status: x.status || "uploaded",
  uploadedAt: x.uploadedAt || x.createdAt || null,
  createdAt: x.createdAt || x.uploadedAt || null,
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

export const normaliseRunStatus = (x = {}) => ({
  runId: x.runId || x.id || null,
  status: x.status || "Created",
  currentStep: x.currentStep || "upload",
  steps: {
    upload: x.steps?.upload || "pending",
    link: x.steps?.link || "pending",
    map: x.steps?.map || "pending",
    stage: x.steps?.stage || "pending",
    exclusions: x.steps?.exclusions || "pending",
    rules: x.steps?.rules || "pending",
    sbi: x.steps?.sbi || "pending",
    validate: x.steps?.validate || "pending",
  },
  metrics: x.metrics || null,
  updatedAt: x.updatedAt || null,
});

const mockDatasetsByRun = {};

// -------------------- Runs --------------------
export const listRuns = async (params = {}) => {
  const search = new URLSearchParams();
  if (params.profileId) search.set("profileId", params.profileId);

  const suffix = search.toString() ? `?${search.toString()}` : "";
  const res = await fetchWrapper.get(`${API_ROOT}/v2/data-hub/runs${suffix}`);
  const data = pickData(res);
  return { items: normaliseRunList(data.items || []) };
};

export const createRun = async (payload = {}) => {
  const context = getCustomerContext();
  const res = await fetchWrapper.post(`${API_ROOT}/v2/data-hub/runs`, {
    profileId: payload.profileId || context.profileId,
    label:
      payload.label || payload.name || `${context.customerName} Data Hub Run`,
    description: payload.description || null,
    meta: payload.meta || null,
  });

  return normaliseRun(pickData(res));
};

export const getRun = async (runId) => {
  if (!runId) throw new Error("runId is required");
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/data-hub/runs/${encodeURIComponent(runId)}`,
  );
  return normaliseRun(pickData(res));
};

export const updateRun = async (runId, payload = {}) => {
  if (!runId) throw new Error("runId is required");
  if (!payload || typeof payload !== "object") {
    throw new Error("payload object is required");
  }

  const res = await fetchWrapper.patch(
    `${API_ROOT}/v2/data-hub/runs/${encodeURIComponent(runId)}`,
    payload,
  );

  return normaliseRun(pickData(res));
};

export const deleteRun = async (runId) => {
  if (!runId) throw new Error("runId is required");
  const res = await fetchWrapper.delete(
    `${API_ROOT}/v2/data-hub/runs/${encodeURIComponent(runId)}`,
  );
  return pickData(res);
};

// -------------------- Datasets / Upload --------------------
export const uploadDataset = async (runId, datasetType, file) => {
  if (!runId) throw new Error("runId is required");
  if (!datasetType) throw new Error("datasetType is required");
  if (!file) throw new Error("file is required");

  await delay(500);

  const baseRows = {
    payments: 2932,
    invoices: 1814,
    supporting: 4,
  };

  const dataset = normaliseDataset({
    id: `dataset-${runId}-${datasetType}-${Date.now()}`,
    runId,
    datasetType,
    role: datasetType,
    fileName: file.name,
    fileSize: file.size || null,
    mimeType: file.type || "text/csv",
    rowsInserted: baseRows[datasetType] || 0,
    rowsCount: baseRows[datasetType] || 0,
    status: "uploaded",
    uploadedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const existing = mockDatasetsByRun[runId] || [];
  mockDatasetsByRun[runId] = [
    dataset,
    ...existing.filter((item) => item.datasetType !== datasetType),
  ];

  await updateRun(runId, {
    status: "Uploaded",
    currentStep: "link",
    [`${datasetType}Rows`]: dataset.rowsInserted,
  }).catch(() => null);

  return dataset;
};

export const listDatasets = async (runId) => {
  if (!runId) throw new Error("runId is required");
  await delay(100);
  return { items: normaliseDatasetList(mockDatasetsByRun[runId] || []) };
};

export const removeDataset = async (runId, datasetId) => {
  if (!runId) throw new Error("runId is required");
  if (!datasetId) throw new Error("datasetId is required");
  mockDatasetsByRun[runId] = (mockDatasetsByRun[runId] || []).filter(
    (dataset) => dataset.datasetId !== datasetId && dataset.id !== datasetId,
  );
  await delay(100);
  return { ok: true };
};

export const getRunSample = async (runId, datasetType) => {
  if (!runId) throw new Error("runId is required");

  await delay(250);

  return normaliseSample({
    headers: [
      "sourceRowNo",
      "supplierName",
      "invoiceReference",
      "paymentDate",
      "paymentAmount",
    ],
    total: datasetType === "supporting" ? 4 : 10,
    rows: [
      {
        sourceRowNo: 1,
        supplierName: "Example Supplier Pty Ltd",
        invoiceReference: "INV-10001",
        paymentDate: "2026-01-15",
        paymentAmount: 1250.5,
      },
      {
        sourceRowNo: 2,
        supplierName: "Another Supplier Pty Ltd",
        invoiceReference: "INV-10002",
        paymentDate: "2026-01-22",
        paymentAmount: 879.1,
      },
    ],
  });
};

// -------------------- Status / Readiness --------------------
export const getRunStatus = async (runId) => {
  if (!runId) throw new Error("runId is required");
  await delay(100);
  const run = await getRun(runId);
  const datasets = mockDatasetsByRun[runId] || [];

  return normaliseRunStatus({
    runId,
    status: run.status,
    currentStep: run.currentStep,
    steps: {
      upload: datasets.length ? "complete" : "pending",
      link: datasets.length ? "ready" : "pending",
      map: "pending",
      stage: "pending",
      exclusions: "pending",
      rules: "pending",
      sbi: "pending",
      validate: "pending",
    },
    metrics: {
      datasets: datasets.length,
      rows: datasets.reduce(
        (sum, dataset) => sum + Number(dataset.rowsCount || 0),
        0,
      ),
    },
    updatedAt: run.updatedAt,
  });
};
