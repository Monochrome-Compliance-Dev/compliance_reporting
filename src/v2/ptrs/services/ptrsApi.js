// PTRS v2 service — aligned to /api/v2/ptrs endpoints
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects. .js only.

import { fetchWrapper } from "lib/utils/fetch-wrapper";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

// -------------------- Helpers --------------------
const pickData = (res) =>
  (res && res.data && res.data.data) || res?.data || res || {};

const normRun = (x = {}) => ({
  id: x.id,
  customerId: x.customerId,
  fileName: x.fileName,
  fileSize: x.fileSize,
  mimeType: x.mimeType,
  rowCount: x.rowCount,
  status: x.status,
  createdAt: x.createdAt,
  updatedAt: x.updatedAt,
});
const normList = (arr = []) => arr.map(normRun);

// Map payloads can include extended config; keep everything surfaced
const normMap = (x = {}) => {
  // Accept and normalise mappings so MapPanel never rejects same-map headers
  const mappingsIn = x.mappings || x.map?.mappings || x || {};
  const normalizeKey = (s) =>
    String(s || "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const outMappings = {};
  for (const [src, cfg] of Object.entries(mappingsIn)) {
    const cleanSrc = normalizeKey(src);
    if (typeof cfg === "string") {
      outMappings[cleanSrc] = { field: cfg, type: "string" };
    } else if (cfg && typeof cfg === "object" && "field" in cfg) {
      outMappings[cleanSrc] = {
        field: cfg.field,
        type: cfg.type || "string",
      };
    }
  }
  return {
    mappings: outMappings,
    extras: x.extras || null,
    fallbacks: x.fallbacks || null,
    defaults: x.defaults || null,
    joins: x.joins || null,
    rowRules: x.rowRules || null,
    profileId: x.profileId || null,
  };
};

const normSample = (x = {}) => ({
  headers: x.headers || [],
  rows: x.rows || [],
});

const normIngest = (x = {}) => ({
  rowsInserted: x.rowsInserted ?? x.inserted ?? 0,
});

const normPreview = (x = {}) => ({
  headers: x.headers || [],
  rows: x.rows || [],
  stats: x.stats || null,
});

// Datasets
const normDataset = (x = {}) => ({
  id: x.id,
  customerId: x.customerId,
  runId: x.runId,
  role: x.role,
  sourceName: x.sourceName,
  fileName: x.fileName,
  fileSize: x.fileSize,
  mimeType: x.mimeType,
  storageRef: x.storageRef,
  meta: x.meta || null, // { headers:[], rowsCount:n }
  createdAt: x.createdAt,
  updatedAt: x.updatedAt,
});
const normDatasetList = (arr = []) => arr.map(normDataset);

// -------------------- Map import compatibility ----------------
// Accepts a variety of shapes and returns a plain mappings object or null.
export const extractMappingsFromAny = (raw) => {
  if (!raw) return null;
  // Unwrap common envelopes
  const candidates = [
    raw?.mappings,
    raw?.map?.mappings,
    raw?.data?.mappings,
    raw?.data?.map?.mappings,
    raw?.data?.data?.mappings,
    raw?.data?.data?.map?.mappings,
    raw, // allow raw mappings object already
  ].filter(Boolean);

  // First candidate that looks like an object of mappings wins
  for (const m of candidates) {
    if (m && typeof m === "object" && !Array.isArray(m)) {
      const entries = Object.entries(m);
      if (!entries.length) return {};
      const looksOk = entries.every(([k, v]) => {
        if (!k) return false;
        if (typeof v === "string") return true;
        if (v && typeof v === "object") return "field" in v;
        return false;
      });
      if (looksOk) {
        const out = {};
        for (const [src, cfg] of entries) {
          if (typeof cfg === "string") {
            out[src] = { field: cfg, type: "string" };
          } else {
            out[src] = { field: cfg.field, type: cfg.type || "string" };
          }
        }
        return out;
      }
    }
  }

  // Also accept array form: [{ source/header/name, field, type? }]
  if (Array.isArray(raw)) {
    const out = {};
    for (const row of raw) {
      const src = row?.source || row?.header || row?.name;
      const field = row?.field;
      if (src && field) out[src] = { field, type: row?.type || "string" };
    }
    return Object.keys(out).length ? out : null;
  }

  return null;
};

// -------------------- Runs (routes: /v2/ptrs/runs) ------------
export const createRun = async (payload) => {
  const res = await fetchWrapper.post(`${API_ROOT}/v2/ptrs/runs`, payload);
  return normRun(pickData(res));
};

export const listRuns = async ({ hasMap = false } = {}) => {
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/runs${hasMap ? "?hasMap=true" : ""}`
  );
  const d = pickData(res);
  const items = d.items || d;
  return { items: normList(items) };
};

// -------------------- Ingest (routes: /runs/:id/import|sample)
export const uploadCsv = async (runId, file) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetchWrapper.postUpload(
    `${API_ROOT}/v2/ptrs/runs/${runId}/import`,
    fd
  );
  return normIngest(pickData(res));
};

export const getRunSample = async (runId, { limit = 10, offset = 0 } = {}) => {
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/runs/${runId}/sample?limit=${limit}&offset=${offset}`
  );
  return normSample(pickData(res));
};

// -------------------- Column map (routes: /runs/:id/map) ------
export const getRunMap = async (runId) => {
  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/runs/${runId}/map`);
  return normMap(pickData(res));
};

// Save full map config (mappings are required; others optional)
export const saveRunMap = async (
  runId,
  {
    mappings,
    extras = null,
    fallbacks = null,
    defaults = null,
    joins = null,
    rowRules = null,
    profileId = null,
  }
) => {
  const res = await fetchWrapper.post(`${API_ROOT}/v2/ptrs/runs/${runId}/map`, {
    mappings,
    extras,
    fallbacks,
    defaults,
    joins,
    rowRules,
    profileId,
  });
  return normMap(pickData(res));
};

// -------------------- Datasets (routes: /runs/:id/datasets) --
// Upload an auxiliary dataset (vendorMaster, termsChanges, entityStructure, other)
export const addDataset = async (
  runId,
  file,
  { role, sourceName = "" } = {}
) => {
  if (!runId) throw new Error("runId is required");
  if (!file) throw new Error("file is required");
  if (!role) throw new Error("role is required");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("role", role);
  if (sourceName) fd.append("sourceName", sourceName);
  const res = await fetchWrapper.postUpload(
    `${API_ROOT}/v2/ptrs/runs/${runId}/datasets`,
    fd
  );
  return normDataset(pickData(res));
};

// List datasets attached to a run
export const listDatasets = async (runId) => {
  if (!runId) throw new Error("runId is required");
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/runs/${runId}/datasets`
  );
  const d = pickData(res);
  const items = d.items || d;
  return { items: normDatasetList(items) };
};

// Remove a dataset
export const removeDataset = async (runId, datasetId) => {
  if (!runId) throw new Error("runId is required");
  if (!datasetId) throw new Error("datasetId is required");
  const res = await fetchWrapper.del(
    `${API_ROOT}/v2/ptrs/runs/${runId}/datasets/${datasetId}`
  );
  return pickData(res); // { ok: true }
};

// -------------------- Preview (route: /runs/:id/preview) ------
export const previewRun = async (runId, { steps = [], limit = 50 } = {}) => {
  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/runs/${runId}/preview`,
    { steps, limit }
  );
  return normPreview(pickData(res));
};

// -------------------- Blueprint (route: /blueprint) -----------
export const getBlueprint = async ({ profileId = "" } = {}) => {
  const q = profileId ? `?profileId=${encodeURIComponent(profileId)}` : "";
  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/blueprint${q}`);
  return pickData(res); // already a plain JSON object with fields/fallbacks/etc.
};

// -------------------- SBI (future) ----------------------------
export const exportSbi = async (runId) => {
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/runs/${runId}/sbi/export`
  );
  return pickData(res);
};

export const importSbi = async (runId, file) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetchWrapper.postUpload(
    `${API_ROOT}/v2/ptrs/runs/${runId}/sbi/import`,
    fd
  );
  return pickData(res);
};
