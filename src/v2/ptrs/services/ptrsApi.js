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
  // prefer nested .map first since the controller returns { map, headers }
  const src = x.map && typeof x.map === "object" ? x.map : x;

  const mappingsIn = src.mappings || {};
  const normalizeKey = (s) =>
    String(s || "")
      .trim()
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const outMappings = {};
  for (const [sourceHeader, cfg] of Object.entries(mappingsIn)) {
    const cleanSrc = normalizeKey(sourceHeader);
    if (typeof cfg === "string") {
      outMappings[cleanSrc] = { field: cfg, type: "string" };
    } else if (cfg && typeof cfg === "object" && "field" in cfg) {
      outMappings[cleanSrc] = { field: cfg.field, type: cfg.type || "string" };
    }
  }

  // helper to parse JSON-ish fields that might arrive as strings
  const parseMaybeJson = (v) => {
    if (v == null) return null;
    if (typeof v !== "string") return v;
    try {
      const parsed = JSON.parse(v);
      return parsed ?? v;
    } catch {
      return v; // keep original if not valid JSON
    }
  };

  return {
    mappings: outMappings,
    extras: parseMaybeJson(src.extras) || null,
    fallbacks: parseMaybeJson(src.fallbacks) || null,
    defaults: parseMaybeJson(src.defaults) || null,
    joins: Array.isArray(src.joins)
      ? src.joins
      : parseMaybeJson(src.joins) || null,
    rowRules: parseMaybeJson(src.rowRules) || null,
    profileId: src.profileId || null,
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

// New function: getRun
export const getRun = async (runId) => {
  if (!runId) throw new Error("runId is required");
  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/runs/${runId}`);
  return normRun(pickData(res));
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

// Unified sample: returns merged headers + examples from all datasets
export const getUnifiedSample = async (
  runId,
  { limit = 10, offset = 0 } = {}
) => {
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/runs/${runId}/unified-sample?limit=${limit}&offset=${offset}`
  );
  const d = pickData(res);
  return {
    headers: d.headers || [],
    rows: d.rows || [],
    total: d.total || 0,
    headerMeta: d.headerMeta || {},
  };
};

export const getDatasetSample = async (
  datasetId,
  { limit = 5, offset = 0 } = {}
) => {
  if (!datasetId) throw new Error("datasetId is required");
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/datasets/${datasetId}/sample?limit=${limit}&offset=${offset}`
  );
  return normSample(pickData(res)); // { headers:[], rows:[] }
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
  const res = await fetchWrapper.delete(
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

// New function: getStagePreview
export const getStagePreview = async (
  runId,
  { limit = 20, profileId = null } = {}
) => {
  if (!runId) throw new Error("runId is required");
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  if (profileId) q.set("profileId", String(profileId));
  try {
    const res = await fetchWrapper.get(
      `${API_ROOT}/v2/ptrs/runs/${runId}/stage/preview?${q.toString()}`
    );
    return normPreview(pickData(res));
  } catch (err) {
    // fallback to generic preview if BE doesn't expose stage/preview yet
    const body = { steps: ["stage"], limit };
    if (profileId) body.profileId = profileId;
    const res2 = await fetchWrapper.post(
      `${API_ROOT}/v2/ptrs/runs/${runId}/preview`,
      body
    );
    return normPreview(pickData(res2));
  }
};

// -------------------- Staging (route: /runs/:id/stage) -------
export const stageRun = async (runId, { profileId = "" } = {}) => {
  if (!runId) throw new Error("runId is required");
  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/runs/${runId}/stage`,
    { profileId }
  );
  // BE returns: { rowsIn, rowsOut, tookMs }
  return pickData(res);
};

// -------------------- Profiles (route: /v2/ptrs/profiles) ----
const normProfile = (x = {}) => ({
  id: x.id,
  customerId: x.customerId,
  name: x.name || x.label || x.profileName || null,
  code: x.code || null,
  isDefault: Boolean(x.isDefault || x.default || false),
  // carry-through any extra metadata we may need later
  meta: x.meta || null,
});

export const listProfiles = async (customerId) => {
  if (!customerId) throw new Error("customerId is required");
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/profiles?customerId=${encodeURIComponent(customerId)}`
  );
  // console.log("res: ", res);
  const d = pickData(res);
  const items = d.items || d || [];
  return { items: (items || []).map(normProfile) };
};

// Create a new profile (tenant-scoped)
export const createProfile = async (customerId, payload = {}) => {
  if (!customerId) throw new Error("customerId is required");
  const res = await fetchWrapper.post(`${API_ROOT}/v2/ptrs/profiles`, {
    customerId,
    ...payload,
  });
  return normProfile(pickData(res));
};

// Read a single profile
export const getProfile = async (id) => {
  if (!id) throw new Error("id is required");
  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/profiles/${id}`);
  return normProfile(pickData(res));
};

// Partially update a profile (PATCH)
export const updateProfile = async (id, payload = {}) => {
  if (!id) throw new Error("id is required");
  const res = await fetchWrapper.patch(
    `${API_ROOT}/v2/ptrs/profiles/${id}`,
    payload
  );
  return normProfile(pickData(res));
};

// Fully replace a profile (PUT)
export const replaceProfile = async (id, payload = {}) => {
  if (!id) throw new Error("id is required");
  const res = await fetchWrapper.put(
    `${API_ROOT}/v2/ptrs/profiles/${id}`,
    payload
  );
  return normProfile(pickData(res));
};

// Delete a profile
export const deleteProfile = async (id) => {
  if (!id) throw new Error("id is required");
  const res = await fetchWrapper.delete(`${API_ROOT}/v2/ptrs/profiles/${id}`);
  return pickData(res); // { ok: true }
};

// -------------------- Blueprint (route: /blueprint) -----------
export const getBlueprint = async ({ profileId = "" } = {}) => {
  const q = profileId ? `?profileId=${encodeURIComponent(profileId)}` : "";
  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/blueprint${q}`);
  return pickData(res); // already a plain JSON object with fields/fallbacks/etc.
};

// -------------------- SBI (future - BE routes may not exist yet) ----------------------------
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
