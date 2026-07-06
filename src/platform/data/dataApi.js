import { fetchWrapper } from "shared/utils";

const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
const baseUrl = `${API_ROOT}/platform/data`;

function requireValue(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function unwrapResponse(response) {
  return response && typeof response === "object" && "data" in response
    ? response.data
    : response;
}

function normaliseDataset(dataset) {
  requireValue(dataset, "Data dataset response is required.");
  requireValue(
    dataset.datasetId,
    "datasetId is required in Data dataset response.",
  );
  requireValue(
    dataset.customerId,
    "customerId is required in Data dataset response.",
  );
  requireValue(
    dataset.profileId,
    "profileId is required in Data dataset response.",
  );
  requireValue(
    dataset.datasetType,
    "datasetType is required in Data dataset response.",
  );
  requireValue(
    dataset.sourceType,
    "sourceType is required in Data dataset response.",
  );
  requireValue(
    dataset.sourceName,
    "sourceName is required in Data dataset response.",
  );
  requireValue(
    dataset.originalFileName,
    "originalFileName is required in Data dataset response.",
  );
  requireValue(
    dataset.storedFileName,
    "storedFileName is required in Data dataset response.",
  );
  requireValue(
    dataset.storagePath,
    "storagePath is required in Data dataset response.",
  );
  requireValue(
    dataset.mimeType,
    "mimeType is required in Data dataset response.",
  );
  requireValue(
    dataset.createdAt,
    "createdAt is required in Data dataset response.",
  );

  if (!Number.isInteger(dataset.fileSize) || dataset.fileSize < 0) {
    throw new Error(
      "fileSize must be a non-negative integer in Data dataset response.",
    );
  }

  if (!Array.isArray(dataset.headers)) {
    throw new Error("headers must be an array in Data dataset response.");
  }

  if (!Number.isInteger(dataset.headersCount) || dataset.headersCount < 0) {
    throw new Error(
      "headersCount must be a non-negative integer in Data dataset response.",
    );
  }

  if (!Number.isInteger(dataset.rowsCount) || dataset.rowsCount < 0) {
    throw new Error(
      "rowsCount must be a non-negative integer in Data dataset response.",
    );
  }

  return {
    datasetId: dataset.datasetId,
    customerId: dataset.customerId,
    profileId: dataset.profileId,
    datasetType: dataset.datasetType,
    sourceType: dataset.sourceType,
    sourceName: dataset.sourceName,
    originalFileName: dataset.originalFileName,
    storedFileName: dataset.storedFileName,
    storagePath: dataset.storagePath,
    mimeType: dataset.mimeType,
    fileSize: dataset.fileSize,
    headers: dataset.headers,
    headersCount: dataset.headersCount,
    rowsCount: dataset.rowsCount,
    status: dataset.status || "available",
    isImmutable: dataset.isImmutable === true,
    createdAt: dataset.createdAt,
  };
}

export function normaliseDataDatasetCreationResponse(response) {
  const data = unwrapResponse(response);

  if (!data || data.success !== true) {
    throw new Error("Data dataset creation response was not successful.");
  }

  return {
    success: true,
    dataset: normaliseDataset(data.dataset),
  };
}

export function buildDatasetCreationFormData({
  file,
  sourceName,
  datasetType,
  profileId,
}) {
  requireValue(file, "file is required for Data dataset creation.");
  requireValue(sourceName, "sourceName is required for Data dataset creation.");
  requireValue(
    datasetType,
    "datasetType is required for Data dataset creation.",
  );
  requireValue(profileId, "profileId is required for Data dataset creation.");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("sourceName", sourceName);
  formData.append("datasetType", datasetType);
  formData.append("profileId", profileId);

  return formData;
}

export async function createDataDataset(command) {
  const formData = buildDatasetCreationFormData(command);
  const response = await fetchWrapper.post(`${baseUrl}/datasets`, formData);
  return normaliseDataDatasetCreationResponse(response);
}
