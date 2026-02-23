import { fetchWrapper } from "shared/utils";
import { normMap, normSample, pickData } from "./ptrsApi";
import { getDatasetSample, listDatasets } from "./data.ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

// -------------------- Map meta helpers (stable signature) --------------------
const stableStringify = (value) => {
  const seen = new WeakSet();

  const norm = (v) => {
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v)) return "[Circular]";
    seen.add(v);

    if (Array.isArray(v)) return v.map(norm);

    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = norm(v[k]);
    return out;
  };

  return JSON.stringify(norm(value));
};

// Simple deterministic hash (NOT crypto)
const hashString = (str) => {
  let h = 5381;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16);
};

const buildMapSignature = ({
  mappings,
  joins,
  defaults,
  fallbacks,
  rowRules,
  customFields,
}) => {
  const payload = {
    mappings: mappings || {},
    joins: joins || null,
    defaults: defaults || null,
    fallbacks: fallbacks || null,
    rowRules: rowRules || null,
    customFields: customFields || null,
  };

  return `v1_${hashString(stableStringify(payload))}`;
};

// -------------------- Column map (routes: /ptrs/:id/map) ------
export const getPtrsMap = async (ptrsId) => {
  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/${ptrsId}/map`);
  const raw = pickData(res) || {};
  const base = normMap(raw) || {};

  // ---- normalise joins into a simple array of conditions ----
  let joins = null;

  // top-level array (new shape)
  if (Array.isArray(raw.joins)) {
    joins = raw.joins;
  }
  // top-level object with { conditions }
  else if (raw.joins && Array.isArray(raw.joins.conditions)) {
    joins = raw.joins.conditions;
  }
  // nested under map.joins as array
  else if (raw.map && Array.isArray(raw.map.joins)) {
    joins = raw.map.joins;
  }
  // nested under map.joins.conditions
  else if (
    raw.map &&
    raw.map.joins &&
    Array.isArray(raw.map.joins.conditions)
  ) {
    joins = raw.map.joins.conditions;
  }
  // whatever normMap produced
  else if (Array.isArray(base.joins)) {
    joins = base.joins;
  } else if (base.joins && Array.isArray(base.joins.conditions)) {
    joins = base.joins.conditions;
  }

  // ---- normalise customFields into a plain array ----
  let customFields = null;

  // preferred: top-level customFields
  if (Array.isArray(raw.customFields)) {
    customFields = raw.customFields;
  } else if (raw.map && Array.isArray(raw.map.customFields)) {
    customFields = raw.map.customFields;
  }
  // sometimes stuck on joins
  else if (raw.joins && Array.isArray(raw.joins.customFields)) {
    customFields = raw.joins.customFields;
  } else if (
    raw.map &&
    raw.map.joins &&
    Array.isArray(raw.map.joins.customFields)
  ) {
    customFields = raw.map.joins.customFields;
  }
  // fallback to whatever normMap did
  else if (Array.isArray(base.customFields)) {
    customFields = base.customFields;
  }

  return {
    ...base,
    joins: Array.isArray(joins) ? joins : [],
    customFields: Array.isArray(customFields) ? customFields : null,
  };
};

// Save full map config (mappings are required; others optional, including joins.conditions and joins.computedFields)
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
    customFields = null,
  },
) => {
  console.log("savePtrsMap called with:", {
    ptrsId,
    mappings,
    customFields,
  });

  // Always include mapMeta inside extras for server-side compatibility listing
  const normHeaderKey = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();

  const sourceHeaders =
    mappings && typeof mappings === "object" ? Object.keys(mappings) : [];
  const sourceHeadersNorm = sourceHeaders.map(normHeaderKey).filter(Boolean);

  const targets = Array.from(
    new Set(
      Object.values(mappings || {})
        .map((cfg) => cfg?.field)
        .filter(Boolean)
        .map((v) => String(v).trim())
        .filter(Boolean),
    ),
  );

  const signature = buildMapSignature({
    mappings,
    joins,
    defaults,
    fallbacks,
    rowRules,
    customFields,
  });

  const prevMapMeta =
    extras && typeof extras === "object" && !Array.isArray(extras)
      ? extras.mapMeta
      : null;

  const prevSignature = prevMapMeta?.signature || null;
  const prevUpdatedAt = prevMapMeta?.updatedAt || null;
  const prevVersion =
    typeof prevMapMeta?.version === "number" &&
    Number.isFinite(prevMapMeta.version)
      ? prevMapMeta.version
      : 1;

  const didChange = !prevSignature || prevSignature !== signature;

  const nextExtras = {
    ...(extras && typeof extras === "object" && !Array.isArray(extras)
      ? extras
      : {}),
    mapMeta: {
      version: didChange ? prevVersion + 1 : prevVersion,
      sourceHeaders,
      sourceHeadersNorm,
      targets,
      signature,
      updatedAt: didChange
        ? new Date().toISOString()
        : prevUpdatedAt || new Date().toISOString(),
    },
  };

  const res = await fetchWrapper.post(`${API_ROOT}/v2/ptrs/${ptrsId}/map`, {
    mappings,
    extras: nextExtras,
    fallbacks,
    defaults,
    joins,
    rowRules,
    profileId,
    customFields,
  });
  return normMap(pickData(res));
};

// Build and persist the mapped + joined dataset for this PTRS run
export const buildPtrsMappedDataset = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/map/build-mapped`,
    {},
  );

  const data = pickData(res) || {};

  const count =
    typeof data.count === "number" && Number.isFinite(data.count)
      ? data.count
      : 0;

  const headers = Array.isArray(data.headers) ? data.headers : [];

  return { count, headers };
};

// Unified sample: returns merged headers + examples from main + supporting datasets
export const getUnifiedSample = async (ptrsId, opts = {}) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const datasetId = opts?.datasetId || null;
  const limit = Number(opts?.limit) || 10;
  const offset = Number(opts?.offset) || 0;

  // Fast-path: if caller already knows the datasetId, do not re-list datasets.
  if (datasetId) {
    const qs = new URLSearchParams();
    qs.set("limit", String(limit));
    qs.set("offset", String(offset));

    const res = await fetchWrapper.get(
      `${API_ROOT}/v2/ptrs/datasets/${datasetId}/sample?${qs.toString()}`,
    );

    // Return the sample shape directly (headers/rows/total)
    return normSample(pickData(res));
  }

  // 1) Load datasets so we can treat multiple mains correctly
  let datasets = [];
  try {
    const { items } = await listDatasets(ptrsId);
    datasets = items || [];
  } catch {
    datasets = [];
  }

  const isMainRole = (role) => {
    const r = String(role || "");
    return r === "main" || r.startsWith("main_");
  };

  const mainDatasets = datasets.filter((d) => isMainRole(d?.role));
  const supportingDatasets = datasets.filter((d) => !isMainRole(d?.role));

  // 2) Get samples for each main dataset (lightweight)
  const mainSamples = await Promise.all(
    mainDatasets.map(async (ds) => {
      try {
        const s = await getDatasetSample(ds.id, { limit, offset });
        return { dataset: ds, sample: s };
      } catch {
        return { dataset: ds, sample: { headers: [], rows: [] } };
      }
    }),
  );

  // 3) For each supporting dataset, grab headers (prefer meta.headers to avoid extra BE work)
  const datasetSamples = await Promise.all(
    supportingDatasets.map(async (ds) => {
      const metaHeaders =
        ds?.meta && Array.isArray(ds.meta.headers) ? ds.meta.headers : null;

      let sample = { headers: metaHeaders || [], rows: [] };

      // If we don’t have headers in meta, or we want examples, hit the sample endpoint lightly
      if (!metaHeaders || !metaHeaders.length) {
        try {
          const s = await getDatasetSample(ds.id, { limit: 1, offset: 0 });
          sample = s || sample;
        } catch {
          // ignore dataset sample failures; they’re optional
        }
      }

      return {
        dataset: ds,
        sample,
      };
    }),
  );

  // 4) Merge headers + build headerMeta
  const headersSet = new Set();
  const headerMeta = {};

  const registerHeader = (header, sourceInfo) => {
    if (!header) return;
    const key = String(header);
    headersSet.add(key);
    if (!headerMeta[key]) {
      headerMeta[key] = { sources: [] };
    }
    headerMeta[key].sources.push(sourceInfo);
  };

  // Main sample headers (multiple mains supported)
  for (const { dataset, sample } of mainSamples) {
    const srcRole = dataset?.role || null;
    const srcFile = dataset?.fileName || null;
    for (const h of sample?.headers || []) {
      registerHeader(h, {
        kind: "main",
        datasetId: dataset?.id,
        role: srcRole,
        fileName: srcFile,
      });
    }
  }

  // Supporting dataset headers
  for (const { dataset, sample } of datasetSamples) {
    const srcRole = dataset?.role || null;
    const srcFile = dataset?.fileName || null;
    for (const h of sample.headers || []) {
      registerHeader(h, {
        kind: "dataset",
        datasetId: dataset.id,
        role: srcRole,
        fileName: srcFile,
      });
    }
  }

  const allHeaders = Array.from(headersSet);

  // 5) Build example values per header (from all mains first, then supporting datasets)
  const examples = {};

  const pickCell = (row, h) => {
    if (row && typeof row === "object") {
      if (row.data && typeof row.data === "object" && h in row.data)
        return row.data[h];
      if (h in row) return row[h];
    }
    return undefined;
  };

  // helper to fill examples from a sample
  const fillExamplesFromSample = (sample, tag) => {
    if (!sample || !Array.isArray(sample.rows)) return;
    for (const h of allHeaders) {
      if (examples[h] != null && String(examples[h]).trim() !== "") continue;
      for (const r of sample.rows) {
        const v = pickCell(r, h);
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          examples[h] = v;
          break;
        }
      }
    }
  };

  // Prefer examples from all mains first
  for (const { sample } of mainSamples) {
    if (sample) fillExamplesFromSample(sample, "main");
  }

  // Then fill gaps from supporting datasets
  for (const { sample } of datasetSamples) {
    fillExamplesFromSample(sample, "dataset");
  }

  // 6) Build a synthetic single row combining examples so MapPanel can reuse its logic
  const combinedRow = {};
  for (const h of allHeaders) {
    if (examples[h] != null) {
      combinedRow[h] = examples[h];
    }
  }

  const rows = Object.keys(combinedRow).length ? [combinedRow] : [];

  const totalMainRows = mainSamples.reduce((acc, { sample }) => {
    const n =
      sample?.total ?? (Array.isArray(sample?.rows) ? sample.rows.length : 0);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);

  return {
    headers: allHeaders,
    rows,
    // total is mostly relevant to main; we expose it in case someone cares later
    total: totalMainRows,
    headerMeta,
  };
};

export const listPtrsWithMap = async () => {
  try {
    const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/compatible-maps`);
    const data = pickData(res) || {};
    const items = Array.isArray(data.items) ? data.items : [];
    return { items };
  } catch (err) {
    if (err?.status === 404 || err?.response?.status === 404) {
      return { items: [] };
    }
    throw err;
  }
};

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

export const getPtrsSample = async (
  ptrsId,
  { limit = 10, offset = 0 } = {},
) => {
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/sample?limit=${limit}&offset=${offset}`,
  );
  return normSample(pickData(res));
};
