// PTRS v2 service — aligned to /api/v2/ptrs endpoints
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects. .js only.

import { fetchWrapper } from "lib/utils/fetch-wrapper";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

// -------------------- Helpers --------------------
const pickData = (res) =>
  (res && res.data && res.data.data) || res?.data || res || {};

const normPtrs = (x = {}) => ({
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
const normList = (arr = []) => arr.map(normPtrs);

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
      const { field, type = "string", ...rest } = cfg;
      outMappings[cleanSrc] = { field, type, ...rest };
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
const normDataset = (x = {}) => {
  const rawMeta = x.meta || {};
  const headers = Array.isArray(rawMeta.headers) ? rawMeta.headers : [];
  const rowsCount =
    typeof rawMeta.rowsCount === "number"
      ? rawMeta.rowsCount
      : typeof x.rowsCount === "number"
        ? x.rowsCount
        : null;

  return {
    id: x.id,
    customerId: x.customerId,
    ptrsId: x.ptrsId,
    role: x.role,
    sourceName: x.sourceName,
    fileName: x.fileName,
    fileSize: x.fileSize,
    mimeType: x.mimeType,
    storageRef: x.storageRef,
    // keep raw meta in case we need extra stats later
    meta: rawMeta && Object.keys(rawMeta).length ? rawMeta : null,
    // normalised, flat fields for UI consumption
    rowsCount,
    headersCount: headers.length,
    headers,
    createdAt: x.createdAt,
    updatedAt: x.updatedAt,
  };
};
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
          } else if (cfg && typeof cfg === "object" && "field" in cfg) {
            const { field, type = "string", ...rest } = cfg;
            out[src] = { field, type, ...rest };
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
      if (src && field) {
        const { type = "string", ...rest } = row || {};
        // Remove alias keys that identify the source name to avoid duplication
        delete rest.source;
        delete rest.header;
        delete rest.name;
        out[src] = { field, type, ...rest };
      }
    }
    return Object.keys(out).length ? out : null;
  }

  return null;
};

// -------------------- Ptrss (routes: /v2/ptrs) ------------
export const createPtrs = async (payload) => {
  const res = await fetchWrapper.post(`${API_ROOT}/v2/ptrs`, payload);
  return normPtrs(pickData(res));
};

export const listPtrs = async () => {
  try {
    const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs`);
    const data = pickData(res);
    // Controller may return an array directly or wrap in { items }
    const items = Array.isArray(data) ? data : data?.items || [];
    // Return raw items so all fields (label, periodStart, currentStep, etc.) are available to the UI
    return { items };
  } catch (err) {
    // No PTRS runs yet for this customer – just return an empty list
    if (err?.status === 404 || err?.response?.status === 404) {
      return { items: [] };
    }
    throw err;
  }
};

export const listPtrsWithMap = async () => {
  return { items: [] }; // Placeholder implementation
};

export const getPtrs = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/${ptrsId}`);
  return normPtrs(pickData(res));
};

export const updatePtrs = async (ptrsId, payload = {}) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!payload || typeof payload !== "object") {
    throw new Error("payload object is required");
  }

  const res = await fetchWrapper.put(`${API_ROOT}/v2/ptrs/${ptrsId}`, payload);

  // Controller returns the updated PTRS record; return it raw so callers can decide how to use it
  return pickData(res);
};

// -------------------- Ingest (routes: /ptrs/:id/import|sample)
export const uploadCsv = async (ptrsId, file) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetchWrapper.postUpload(
    `${API_ROOT}/v2/ptrs/${ptrsId}/import`,
    fd
  );
  return normIngest(pickData(res));
};

export const getPtrsSample = async (
  ptrsId,
  { limit = 10, offset = 0 } = {}
) => {
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/sample?limit=${limit}&offset=${offset}`
  );
  return normSample(pickData(res));
};

// Unified sample: returns merged headers + examples from all datasets
export const getUnifiedSample = async (
  ptrsId,
  { limit = 10, offset = 0 } = {}
) => {
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/unified-sample?limit=${limit}&offset=${offset}`
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

// -------------------- Column map (routes: /ptrs/:id/map) ------
export const getPtrsMap = async (ptrsId) => {
  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/${ptrsId}/map`);
  return normMap(pickData(res));
};

// Save full map config (mappings are required; others optional)
export const savePtrsMap = async (
  ptrsId,
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
  const res = await fetchWrapper.post(`${API_ROOT}/v2/ptrs/${ptrsId}/map`, {
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

// -------------------- Datasets (routes: /ptrs/:id/datasets) --
// Upload an auxiliary dataset (vendorMaster, termsChanges, entityStructure, other)
export const addDataset = async (
  ptrsId,
  file,
  { role, sourceName = "" } = {}
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!file) throw new Error("file is required");
  if (!role) throw new Error("role is required");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("role", role);
  if (sourceName) fd.append("sourceName", sourceName);
  const res = await fetchWrapper.postUpload(
    `${API_ROOT}/v2/ptrs/${ptrsId}/datasets`,
    fd
  );
  return normDataset(pickData(res));
};

// List datasets attached to a ptrs
export const listDatasets = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/${ptrsId}/datasets`);
  const d = pickData(res);
  const items = d.items || d;
  return { items: normDatasetList(items) };
};

// Remove a dataset
export const removeDataset = async (ptrsId, datasetId) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!datasetId) throw new Error("datasetId is required");
  const res = await fetchWrapper.delete(
    `${API_ROOT}/v2/ptrs/${ptrsId}/datasets/${datasetId}`
  );
  return pickData(res); // { ok: true }
};

// // -------------------- Preview (route: /ptrs/:id/preview) ------
// export const previewPtrs = async (ptrsId, { steps = [], limit = 50 } = {}) => {
//   const res = await fetchWrapper.post(
//     `${API_ROOT}/v2/ptrs/${ptrsId}/preview`,
//     { steps, limit }
//   );
//   return normPreview(pickData(res));
// };

// New function: getStagePreview
export const getStagePreview = async (
  ptrsId,
  { limit = 20, profileId = null } = {}
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  if (profileId) q.set("profileId", String(profileId));
  try {
    const res = await fetchWrapper.get(
      `${API_ROOT}/v2/ptrs/${ptrsId}/stage/preview?${q.toString()}`
    );
    return normPreview(pickData(res));
  } catch (err) {
    // fallback to generic preview if BE doesn't expose stage/preview yet
    const body = { steps: ["stage"], limit };
    if (profileId) body.profileId = profileId;
    const res2 = await fetchWrapper.post(
      `${API_ROOT}/v2/ptrs/${ptrsId}/preview`,
      body
    );
    return normPreview(pickData(res2));
  }
};

// // -------------------- Rules (routes: /ptrs/:id/rules/...) ---
// export const previewRules = async (ptrsId, { limit = 50 } = {}) => {
//   if (!ptrsId) throw new Error("ptrsId is required");
//   const q = new URLSearchParams();
//   q.set("limit", String(limit));
//   const res = await fetchWrapper.get(
//     `${API_ROOT}/v2/ptrs/${ptrsId}/rules/preview?${q.toString()}`
//   );
//   return normPreview(pickData(res)); // { headers, rows, stats }
// };

// export const applyRules = async (ptrsId, { profileId = null } = {}) => {
//   if (!ptrsId) throw new Error("ptrsId is required");
//   const body = {};
//   if (profileId) body.profileId = profileId;
//   const res = await fetchWrapper.post(
//     `${API_ROOT}/v2/ptrs/${ptrsId}/rules/apply`,
//     body
//   );
//   return pickData(res); // { ok, stats, persisted }
// };

// export const getPtrsRules = async (ptrsId) => {
//   if (!ptrsId) throw new Error("ptrsId is required");
//   const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/${ptrsId}/rules`);
//   const d = pickData(res);
//   const data = d?.data || d || {};
//   return {
//     rowRules: data.rowRules || [],
//     crossRowRules: data.crossRowRules || [],
//   };
// };

// export const savePtrsRules = async (
//   ptrsId,
//   { rowRules = [], crossRowRules = [] } = {}
// ) => {
//   if (!ptrsId) throw new Error("ptrsId is required");
//   const res = await fetchWrapper.post(
//     `${API_ROOT}/v2/ptrs/${ptrsId}/rules`,
//     { rowRules, crossRowRules }
//   );
//   const d = pickData(res);
//   const data = d?.data || d || {};
//   return {
//     rowRules: data.rowRules || [],
//     crossRowRules: data.crossRowRules || [],
//   };
// };

// // -------------------- Staging (route: /ptrs/:id/stage) -------
// export const stagePtrs = async (
//   ptrsId,
//   { profileId = "", persist = false } = {}
// ) => {
//   if (!ptrsId) throw new Error("ptrsId is required");

//   // Build payload: always include profileId, optionally include persist
//   const payload = { profileId };
//   if (persist != null) payload.persist = Boolean(persist);

//   const res = await fetchWrapper.post(
//     `${API_ROOT}/v2/ptrs/${ptrsId}/stage`,
//     payload
//   );

//   // Normalise the response so the UI can rely on a stable shape
//   const d = pickData(res) || {};
//   const rowsIn = d.rowsIn ?? d.affectedCount ?? d.inputCount ?? d.inCount ?? 0;
//   const rowsOut =
//     d.rowsOut ?? d.persistedCount ?? d.outputCount ?? d.outCount ?? 0;

//   return {
//     rowsIn,
//     rowsOut,
//     tookMs: d.tookMs ?? d.durationMs ?? null,
//     sample: d.sample || null,
//     stats: d.stats || null,
//   };
// };

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
    `${API_ROOT}/v2/customers/${encodeURIComponent(customerId)}/profiles`
  );

  const data = pickData(res);
  const items = Array.isArray(data) ? data : data?.items || [];

  return { items: items.map(normProfile) };
};

// // Create a new profile (tenant-scoped)
// export const createProfile = async (customerId, payload = {}) => {
//   if (!customerId) throw new Error("customerId is required");
//   const res = await fetchWrapper.post(`${API_ROOT}/v2/ptrs/profiles`, {
//     customerId,
//     ...payload,
//   });
//   return normProfile(pickData(res));
// };

// // Read a single profile
// export const getProfile = async (id) => {
//   if (!id) throw new Error("id is required");
//   const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/profiles/${id}`);
//   return normProfile(pickData(res));
// };

// // Partially update a profile (PATCH)
// export const updateProfile = async (id, payload = {}) => {
//   if (!id) throw new Error("id is required");
//   const res = await fetchWrapper.patch(
//     `${API_ROOT}/v2/ptrs/profiles/${id}`,
//     payload
//   );
//   return normProfile(pickData(res));
// };

// // Fully replace a profile (PUT)
// export const replaceProfile = async (id, payload = {}) => {
//   if (!id) throw new Error("id is required");
//   const res = await fetchWrapper.put(
//     `${API_ROOT}/v2/ptrs/profiles/${id}`,
//     payload
//   );
//   return normProfile(pickData(res));
// };

// // Delete a profile
// export const deleteProfile = async (id) => {
//   if (!id) throw new Error("id is required");
//   const res = await fetchWrapper.delete(`${API_ROOT}/v2/ptrs/profiles/${id}`);
//   return pickData(res); // { ok: true }
// };

// -------------------- Blueprint (route: /blueprint) -----------
export const getBlueprint = async ({ profileId = "" } = {}) => {
  const q = profileId ? `?profileId=${encodeURIComponent(profileId)}` : "";
  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/blueprint${q}`);
  return pickData(res); // already a plain JSON object with fields/fallbacks/etc.
};

// // -------------------- SBI (future - BE routes may not exist yet) ----------------------------
// export const exportSbi = async (ptrsId) => {
//   const res = await fetchWrapper.get(
//     `${API_ROOT}/v2/ptrs/${ptrsId}/sbi/export`
//   );
//   return pickData(res);
// };

// export const importSbi = async (ptrsId, file) => {
//   const fd = new FormData();
//   fd.append("file", file);
//   const res = await fetchWrapper.postUpload(
//     `${API_ROOT}/v2/ptrs/${ptrsId}/sbi/import`,
//     fd
//   );
//   return pickData(res);
// };
