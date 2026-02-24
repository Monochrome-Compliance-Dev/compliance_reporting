// PTRS v2 service — aligned to /api/v2/ptrs endpoints
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects. .js only.

import { fetchWrapper } from "shared/utils";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

// -------------------- Helpers --------------------
export const pickData = (res) =>
  (res && res.data && res.data.data) || res?.data || res || {};

const normPtrs = (x = {}) => ({
  // keep everything the controller returns so the UI can evolve without
  // constantly revisiting this normaliser
  ...x,

  // ensure our core fields are present and consistently named
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
// const normList = (arr = []) => arr.map(normPtrs);

// Map payloads can include extended config; keep everything surfaced
export const normMap = (x = {}) => {
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

  // Parse all JSON-ish fields into local variables
  const parsedExtras = parseMaybeJson(src.extras) || null;
  const parsedFallbacks = parseMaybeJson(src.fallbacks) || null;
  const parsedDefaults = parseMaybeJson(src.defaults) || null;
  const parsedJoins = Array.isArray(src.joins)
    ? src.joins
    : parseMaybeJson(src.joins) || null;
  const parsedRowRules = parseMaybeJson(src.rowRules) || null;
  const parsedCustomFields = parseMaybeJson(src.customFields) || null;

  return {
    mappings: outMappings,
    extras: parsedExtras,
    fallbacks: parsedFallbacks,
    defaults: parsedDefaults,
    joins: parsedJoins,
    rowRules: parsedRowRules,
    profileId: src.profileId || null,
    customFields: parsedCustomFields,
    raw: src,
  };
};

export const normSample = (x = {}) => ({
  headers: x.headers || [],
  rows: x.rows || [],
});

const normIngest = (x = {}) => ({
  rowsInserted: x.rowsInserted ?? x.inserted ?? 0,
});

export const normPreview = (raw = {}) => {
  // Support both { status, data: {...} } and bare objects
  const data = raw && raw.data != null ? raw.data : raw;

  // Rows: staged/rules preview.
  const rows = Array.isArray(data.rows)
    ? data.rows
    : Array.isArray(data.sample)
      ? data.sample
      : [];

  // Headers: prefer explicit, otherwise infer from first row's data
  let headers = Array.isArray(data.headers) ? data.headers : [];
  if (!headers.length && rows.length) {
    const first = rows[0];
    const candidate =
      first && typeof first.data === "object" && first.data
        ? first.data
        : first;
    headers = Object.keys(candidate || {});
  }

  // Total rows: prefer explicit count from BE, fall back to rows.length
  const totalRows =
    data.totalRows ??
    data.total ??
    data.count ??
    (typeof data.rowsCount === "number" ? data.rowsCount : rows.length);

  return {
    headers,
    rows,
    totalRows,
    stats: data.stats ?? null,
  };
};

// Datasets
export const normDataset = (x = {}) => {
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

export const normDatasetList = (arr = []) => arr.map(normDataset);

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
    fd,
  );
  return normIngest(pickData(res));
};

// // -------------------- Preview (route: /ptrs/:id/preview) ------
// export const previewPtrs = async (ptrsId, { steps = [], limit = 50 } = {}) => {
//   const res = await fetchWrapper.post(
//     `${API_ROOT}/v2/ptrs/${ptrsId}/preview`,
//     { steps, limit }
//   );
//   return normPreview(pickData(res));
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
    `${API_ROOT}/v2/customers/${encodeURIComponent(customerId)}/profiles`,
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
