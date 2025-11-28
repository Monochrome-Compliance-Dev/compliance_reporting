// PTRS v2 service for TablesAndJoins and JoinsDesigner — aligned to /api/v2/ptrs endpoints
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects. .js only.

import { fetchWrapper } from "lib/utils/fetch-wrapper";
import { getDatasetSample, getPtrsSample, normMap, pickData } from "./ptrsApi";
import { listDatasets } from "./data.ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

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
  console.log("savePtrsMap called with:", {
    ptrsId,
    mappings,
  });
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

// Unified sample: returns merged headers + examples from main + supporting datasets
export const getUnifiedSample = async (
  ptrsId,
  { limit = 10, offset = 0 } = {}
) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  // 1) Get main sample (cheap, indexed on tbl_ptrs_import_raw)
  let mainSample = null;
  try {
    mainSample = await getPtrsSample(ptrsId, { limit, offset });
  } catch {
    mainSample = null;
  }

  // 2) Get supporting datasets list
  let datasets = [];
  try {
    const { items } = await listDatasets(ptrsId);
    datasets = items || [];
  } catch {
    datasets = [];
  }

  // 3) For each dataset, grab headers (prefer meta.headers to avoid extra BE work)
  const datasetSamples = await Promise.all(
    datasets.map(async (ds) => {
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
    })
  );

  // 4) Merge headers + build headerMeta
  const headersSet = new Set(mainSample?.headers || []);
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

  // Main sample headers
  for (const h of mainSample?.headers || []) {
    registerHeader(h, { kind: "main" });
  }

  // Dataset headers
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

  // 5) Build example values per header (from main first, then datasets)
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

  // Prefer examples from main
  if (mainSample) fillExamplesFromSample(mainSample, "main");

  // Then fill gaps from datasets
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

  return {
    headers: allHeaders,
    rows,
    // total is mostly relevant to main; we expose it in case someone cares later
    total: mainSample?.total || mainSample?.rows?.length || 0,
    headerMeta,
  };
};
