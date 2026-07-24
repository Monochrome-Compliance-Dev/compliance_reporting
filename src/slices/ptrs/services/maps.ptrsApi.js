import { fetchWrapper } from "shared/utils";
import { normMap, normSample, pickData } from "./ptrsApi";
import { getDatasetSample, listDatasets } from "./data.ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

const debugPtrsApiCall = (label, meta = {}) => {
  if (process.env.NODE_ENV === "production") return;

  try {
    console.debug(`[ptrsApi] ${label}`, {
      ...meta,
      stack: new Error().stack?.split("\n").slice(2, 7).join("\n"),
    });
  } catch {
    console.debug(`[ptrsApi] ${label}`, meta);
  }
};

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
  debugPtrsApiCall("getPtrsMap", { ptrsId });
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
    joins,
    customFields,
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
  debugPtrsApiCall("savePtrsMap", {
    ptrsId,
    mappingsCount:
      mappings && typeof mappings === "object"
        ? Object.keys(mappings).length
        : 0,
    hasJoins: !!joins,
    profileId: profileId || null,
    customFieldsCount: Array.isArray(customFields) ? customFields.length : 0,
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

export const getPtrsFieldMap = async (ptrsId, profileId, datasetId) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!profileId) throw new Error("profileId is required");

  debugPtrsApiCall("getPtrsFieldMap", { ptrsId, profileId, datasetId });

  const qs = new URLSearchParams();
  qs.set("profileId", String(profileId));
  if (datasetId) qs.set("datasetId", String(datasetId));

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/field-map?${qs.toString()}`,
  );

  const data = pickData(res) || {};
  return Array.isArray(data.fieldMap)
    ? data.fieldMap
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];
};

export const importPtrsFieldMap = async (
  ptrsId,
  { sourcePtrsId, profileId },
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!sourcePtrsId) throw new Error("sourcePtrsId is required");
  if (!profileId) throw new Error("profileId is required");

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/field-map/import`,
    { sourcePtrsId, profileId },
  );

  return pickData(res) || {};
};

export const savePtrsFieldMap = async (
  ptrsId,
  profileId,
  datasetId,
  fieldMap,
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!profileId) throw new Error("profileId is required");
  if (!datasetId) throw new Error("datasetId is required");
  if (!Array.isArray(fieldMap)) throw new Error("fieldMap array is required");

  debugPtrsApiCall("savePtrsFieldMap", {
    ptrsId,
    profileId,
    datasetId,
    fieldMapCount: Array.isArray(fieldMap) ? fieldMap.length : 0,
  });

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/field-map`,
    {
      profileId,
      datasetId,
      fieldMap,
    },
  );

  const data = pickData(res) || {};
  return Array.isArray(data.fieldMap)
    ? data.fieldMap
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];
};

// Build and persist the mapped + joined dataset for this PTRS run
export const buildPtrsMappedDataset = async (
  ptrsId,
  { profileId = null } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  debugPtrsApiCall("buildPtrsMappedDataset", {
    ptrsId,
    profileId: profileId || null,
  });

  const qs = new URLSearchParams();
  if (profileId) qs.set("profileId", String(profileId));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/map/build-mapped${suffix}`,
    profileId ? { profileId } : {},
  );

  const data = pickData(res) || {};

  const count =
    typeof data.count === "number" && Number.isFinite(data.count)
      ? data.count
      : 0;

  const headers = Array.isArray(data.headers) ? data.headers : [];

  return {
    count,
    headers,
    skipped: !!data.skipped,
    reason: data.reason || null,
    inputHash: data.inputHash || null,
    previousRunId: data.previousRunId || null,
    profileId: data.profileId || profileId || null,
  };
};

export const getUnifiedSample = async (
  ptrsId,
  { limit = 5, offset = 0 } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  debugPtrsApiCall("getUnifiedSample", { ptrsId, limit, offset });

  const datasetsRes = await listDatasets(ptrsId);
  const datasets = Array.isArray(datasetsRes?.items)
    ? datasetsRes.items
    : Array.isArray(datasetsRes)
      ? datasetsRes
      : [];

  const targets = datasets.filter((d) => !!d?.id);
  const results = await Promise.all(
    targets.map(async (dataset) => {
      const sample = await getDatasetSample(dataset.id, { limit, offset });
      return {
        dataset,
        sample: normSample(sample) || { headers: [], rows: [] },
      };
    }),
  );

  const headers = [];
  const examples = {};
  const headerMeta = {};
  const seen = new Set();

  for (const { dataset, sample } of results) {
    const role = String(dataset?.role || "");
    const datasetId = String(dataset?.id || "");
    const fileName = String(dataset?.fileName || dataset?.sourceName || "");
    const sampleHeaders = Array.isArray(sample?.headers) ? sample.headers : [];
    const sampleRows = Array.isArray(sample?.rows) ? sample.rows : [];

    sampleHeaders.forEach((header, index) => {
      const h = String(header || "").trim();
      if (!h) return;

      if (!seen.has(h)) {
        seen.add(h);
        headers.push(h);
      }

      if (!headerMeta[h]) {
        headerMeta[h] = {
          header: h,
          sources: [],
        };
      }

      const sourceKey = `${role}::${datasetId}::${fileName}`;
      const existingSources = Array.isArray(headerMeta[h].sources)
        ? headerMeta[h].sources
        : [];

      const alreadyHasSource = existingSources.some(
        (src) =>
          `${String(src?.role || "")}::${String(src?.datasetId || "")}::${String(src?.fileName || "")}` ===
          sourceKey,
      );

      if (!alreadyHasSource) {
        headerMeta[h].sources = [
          ...existingSources,
          {
            role,
            datasetId,
            fileName,
          },
        ];
      }

      if (examples[h] == null) {
        for (const row of sampleRows) {
          const val = Array.isArray(row)
            ? row[index]
            : row?.data && typeof row.data === "object"
              ? row.data[h]
              : row?.[h];
          if (val != null && String(val).trim() !== "") {
            examples[h] = String(val);
            break;
          }
        }
      }
    });
  }

  return {
    headers,
    examples,
    headerMeta,
  };
};

export const listPtrsWithMap = async ({ profileId } = {}) => {
  debugPtrsApiCall("listPtrsWithMap", { profileId: profileId || null });

  const qs = new URLSearchParams();
  if (profileId) qs.set("profileId", String(profileId));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/compatible-maps${suffix}`,
  );

  const data = pickData(res) || {};
  const items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];

  return { items };
};
