import { fetchWrapper } from "shared/utils";
import {
  API_ROOT,
  normaliseDataset,
  normaliseDatasetList,
  normaliseSample,
  pickData,
} from "./dhApi";

export const listDatasets = async (runId, params = {}) => {
  if (!runId) throw new Error("runId is required");

  const search = new URLSearchParams();
  if (params.role) search.set("role", params.role);

  const suffix = search.toString() ? `?${search.toString()}` : "";
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/data-hub/datasets/runs/${encodeURIComponent(runId)}${suffix}`,
  );
  const data = pickData(res);
  return { items: normaliseDatasetList(data.items || []) };
};

export const uploadDataset = async (runId, datasetType, file, options = {}) => {
  if (!runId) throw new Error("runId is required");
  if (!datasetType) throw new Error("datasetType is required");
  if (!file) throw new Error("file is required");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("role", datasetType);
  formData.append("sourceType", options.sourceType || "csv");
  if (options.profileId) formData.append("profileId", options.profileId);
  if (options.sourceName) formData.append("sourceName", options.sourceName);
  if (options.meta) formData.append("meta", JSON.stringify(options.meta));

  const res = await fetchWrapper.postUpload(
    `${API_ROOT}/v2/data-hub/datasets/runs/${encodeURIComponent(runId)}`,
    formData,
  );

  return normaliseDataset(pickData(res));
};

export const getDataset = async (runId, datasetId) => {
  if (!runId) throw new Error("runId is required");
  if (!datasetId) throw new Error("datasetId is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/data-hub/datasets/runs/${encodeURIComponent(runId)}/${encodeURIComponent(datasetId)}`,
  );

  return normaliseDataset(pickData(res));
};

export const removeDataset = async (runId, datasetId) => {
  if (!runId) throw new Error("runId is required");
  if (!datasetId) throw new Error("datasetId is required");

  const res = await fetchWrapper.delete(
    `${API_ROOT}/v2/data-hub/datasets/runs/${encodeURIComponent(runId)}/${encodeURIComponent(datasetId)}`,
  );

  return pickData(res);
};

export const getRunSample = async (runId, params = {}) => {
  if (!runId) throw new Error("runId is required");

  const search = new URLSearchParams();
  if (params.datasetId) search.set("datasetId", params.datasetId);
  if (params.role) search.set("role", params.role);
  if (params.limit) search.set("limit", params.limit);
  if (params.offset) search.set("offset", params.offset);

  const suffix = search.toString() ? `?${search.toString()}` : "";
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/data-hub/datasets/runs/${encodeURIComponent(runId)}/sample${suffix}`,
  );

  return normaliseSample(pickData(res));
};
