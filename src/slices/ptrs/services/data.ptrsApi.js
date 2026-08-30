import { fetchWrapper } from "shared/utils";
import { normDataset, normDatasetList, normSample, pickData } from "./ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

// -------------------- Transaction CSV ingest / run sample --------------------

export const uploadCsv = async (ptrsId, file) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!file) throw new Error("file is required");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("purpose", "transaction");
  fd.append("sourceFormat", "csv");
  fd.append("sourceName", file.name || "Transaction dataset");

  const res = await fetchWrapper.postUpload(
    `${API_ROOT}/v2/ptrs/${ptrsId}/datasets`,
    fd,
  );

  const data = pickData(res) || {};

  return {
    ...data,
    rowsInserted: data?.meta?.rowsCount ?? data?.rowsCount ?? 0,
  };
};

export const getRunSample = async (
  ptrsId,
  { datasetId, limit = 10, offset = 0 } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!datasetId) throw new Error("datasetId is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/sample?datasetId=${encodeURIComponent(datasetId)}&limit=${limit}&offset=${offset}`,
  );

  return normSample(pickData(res));
};

// Upload one explicitly classified dataset.
export const addDataset = async (
  ptrsId,
  file,
  {
    purpose,
    referenceKind = null,
    sourceFormat = "csv",
    adapterType = null,
    adapterVersion = null,
    sourceGroupScope = null,
    sourceName = "",
  } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!file) throw new Error("file is required");
  if (!purpose) throw new Error("purpose is required");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("purpose", purpose);
  fd.append("sourceFormat", sourceFormat);
  if (referenceKind) fd.append("referenceKind", referenceKind);
  if (adapterType) fd.append("adapterType", adapterType);
  if (adapterVersion) fd.append("adapterVersion", adapterVersion);
  if (sourceGroupScope) fd.append("sourceGroupScope", sourceGroupScope);
  if (sourceName) fd.append("sourceName", sourceName);
  const res = await fetchWrapper.postUpload(
    `${API_ROOT}/v2/ptrs/${ptrsId}/datasets`,
    fd,
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
    `${API_ROOT}/v2/ptrs/${ptrsId}/datasets/${datasetId}`,
  );
  return pickData(res); // { ok: true }
};

export const getDatasetSample = async (
  datasetId,
  { limit = 5, offset = 0 } = {},
) => {
  if (!datasetId) throw new Error("datasetId is required");
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/datasets/${datasetId}/sample?limit=${limit}&offset=${offset}`,
  );
  return normSample(pickData(res)); // { headers:[], rows:[] }
};
