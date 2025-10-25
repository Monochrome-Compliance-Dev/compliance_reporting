// PTRS v2 service — aligned to /api/v2/ptrs endpoints
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects (no axios/fetch response wrappers). .js only.

import { fetchWrapper } from "lib/utils/fetch-wrapper";

// Make sure we don't end up with double slashes or double /api
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

const normMap = (x = {}) => ({
  // allow raw object of source->{field,type} or { mappings }
  mappings: x.mappings || x,
});

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
      // quick structural sanity check: values are objects with at least a 'field' prop or strings (legacy)
      const entries = Object.entries(m);
      if (!entries.length) return {};
      const looksOk = entries.every(([k, v]) => {
        if (!k) return false;
        if (typeof v === "string") return true;
        if (v && typeof v === "object") return "field" in v;
        return false;
      });
      if (looksOk) {
        // normalise string values to { field, type: "string" }
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

  // Also accept an array form: [{ source, field, type }]
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

// -------------------- Runs -----------------------
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

// -------------------- Ingest ---------------------
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

// -------------------- Column map -----------------
export const getRunMap = async (runId) => {
  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/runs/${runId}/map`);
  return normMap(pickData(res));
};

export const saveRunMap = async (runId, mappings) => {
  const res = await fetchWrapper.post(`${API_ROOT}/v2/ptrs/runs/${runId}/map`, {
    mappings,
  });
  return normMap(pickData(res));
};

// -------------------- Preview --------------------
export const previewRun = async (runId, { steps = [], limit = 50 } = {}) => {
  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/runs/${runId}/preview`,
    { steps, limit }
  );
  return normPreview(pickData(res));
};

// -------------------- SBI (future) ---------------
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
