// PTRS v2 service for DataConsole — aligned to /api/v2/ptrs endpoints
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects. .js only.

import { fetchWrapper } from "lib/utils/fetch-wrapper";
import { normDataset, normDatasetList, pickData } from "./ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

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
