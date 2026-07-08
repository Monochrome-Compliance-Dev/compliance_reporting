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

function normaliseWorkingDataset(workingDataset) {
  requireValue(workingDataset, "Working dataset response is required.");
  requireValue(
    workingDataset.workingDatasetId,
    "workingDatasetId is required in working dataset response.",
  );
  requireValue(
    workingDataset.sourceDatasetId,
    "sourceDatasetId is required in working dataset response.",
  );
  requireValue(
    workingDataset.customerId,
    "customerId is required in working dataset response.",
  );
  requireValue(
    workingDataset.profileId,
    "profileId is required in working dataset response.",
  );
  requireValue(
    workingDataset.workingName,
    "workingName is required in working dataset response.",
  );
  requireValue(
    workingDataset.datasetType,
    "datasetType is required in working dataset response.",
  );
  requireValue(
    workingDataset.status,
    "status is required in working dataset response.",
  );
  requireValue(
    workingDataset.createdAt,
    "createdAt is required in working dataset response.",
  );

  if (!Array.isArray(workingDataset.headers)) {
    throw new Error("headers must be an array in working dataset response.");
  }

  if (
    !Number.isInteger(workingDataset.headersCount) ||
    workingDataset.headersCount < 0
  ) {
    throw new Error(
      "headersCount must be a non-negative integer in working dataset response.",
    );
  }

  if (
    !Number.isInteger(workingDataset.rowsCount) ||
    workingDataset.rowsCount < 0
  ) {
    throw new Error(
      "rowsCount must be a non-negative integer in working dataset response.",
    );
  }

  requireValue(
    workingDataset.lineage,
    "lineage is required in working dataset response.",
  );
  requireValue(
    workingDataset.lineage.sourceDatasetId,
    "lineage sourceDatasetId is required in working dataset response.",
  );

  if (
    workingDataset.lineage.sourceDatasetId !== workingDataset.sourceDatasetId
  ) {
    throw new Error(
      "lineage sourceDatasetId must match sourceDatasetId in working dataset response.",
    );
  }

  return {
    workingDatasetId: workingDataset.workingDatasetId,
    sourceDatasetId: workingDataset.sourceDatasetId,
    customerId: workingDataset.customerId,
    profileId: workingDataset.profileId,
    workingName: workingDataset.workingName,
    datasetType: workingDataset.datasetType,
    headers: workingDataset.headers,
    headersCount: workingDataset.headersCount,
    rowsCount: workingDataset.rowsCount,
    status: workingDataset.status,
    lineage: workingDataset.lineage,
    createdAt: workingDataset.createdAt,
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

export function normaliseWorkingDatasetCreationResponse(response) {
  const data = unwrapResponse(response);

  if (!data || data.success !== true) {
    throw new Error("Working dataset creation response was not successful.");
  }

  return {
    success: true,
    workingDataset: normaliseWorkingDataset(data.workingDataset),
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

export function buildWorkingDatasetCreationPayload({
  sourceDatasetId,
  profileId,
  workingName,
}) {
  requireValue(
    sourceDatasetId,
    "sourceDatasetId is required for working dataset creation.",
  );
  requireValue(
    profileId,
    "profileId is required for working dataset creation.",
  );
  requireValue(
    workingName,
    "workingName is required for working dataset creation.",
  );

  return {
    sourceDatasetId,
    profileId,
    workingName,
  };
}

export async function createDataDataset(command) {
  const formData = buildDatasetCreationFormData(command);
  const response = await fetchWrapper.postUpload(
    `${baseUrl}/datasets`,
    formData,
  );
  return normaliseDataDatasetCreationResponse(response);
}

export async function createWorkingDataset(command) {
  const payload = buildWorkingDatasetCreationPayload(command);
  const response = await fetchWrapper.post(
    `${baseUrl}/working-datasets`,
    payload,
  );
  return normaliseWorkingDatasetCreationResponse(response);
}
