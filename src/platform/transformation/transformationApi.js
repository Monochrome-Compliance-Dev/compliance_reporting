import { fetchWrapper } from "shared/utils";

const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
const baseUrl = `${API_ROOT}/platform/transformation`;

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

function requireNonNegativeInteger(value, message) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(message);
  }
}

function normaliseActivity(activity, expectedActivityType) {
  requireValue(activity, "Transformation activity response is required.");
  requireValue(
    activity.activityId,
    "activityId is required in transformation activity response.",
  );
  requireValue(
    activity.activityType,
    "activityType is required in transformation activity response.",
  );
  requireValue(
    activity.summary,
    "summary is required in transformation activity response.",
  );
  requireValue(
    activity.createdAt,
    "createdAt is required in transformation activity response.",
  );

  if (activity.activityType !== expectedActivityType) {
    throw new Error(
      `activityType must be ${expectedActivityType} in transformation activity response.`,
    );
  }

  return {
    activityId: activity.activityId,
    activityType: activity.activityType,
    summary: activity.summary,
    stepNumber: activity.stepNumber ?? null,
    details: activity.details || {},
    createdAt: activity.createdAt,
  };
}

function normaliseWorkingDataset(workingDataset) {
  requireValue(
    workingDataset,
    "Materialised working dataset response is required.",
  );
  requireValue(
    workingDataset.workingDatasetId,
    "workingDatasetId is required in materialised working dataset response.",
  );
  requireValue(
    workingDataset.sourceDatasetId,
    "sourceDatasetId is required in materialised working dataset response.",
  );
  requireValue(
    workingDataset.customerId,
    "customerId is required in materialised working dataset response.",
  );
  requireValue(
    workingDataset.profileId,
    "profileId is required in materialised working dataset response.",
  );
  requireValue(
    workingDataset.workingName,
    "workingName is required in materialised working dataset response.",
  );
  requireValue(
    workingDataset.datasetType,
    "datasetType is required in materialised working dataset response.",
  );
  requireValue(
    workingDataset.status,
    "status is required in materialised working dataset response.",
  );
  requireValue(
    workingDataset.storagePath,
    "storagePath is required in materialised working dataset response.",
  );
  requireValue(
    workingDataset.storedFileName,
    "storedFileName is required in materialised working dataset response.",
  );
  requireValue(
    workingDataset.mimeType,
    "mimeType is required in materialised working dataset response.",
  );
  requireValue(
    workingDataset.createdAt,
    "createdAt is required in materialised working dataset response.",
  );
  requireValue(
    workingDataset.updatedAt,
    "updatedAt is required in materialised working dataset response.",
  );

  requireNonNegativeInteger(
    workingDataset.fileSize,
    "fileSize must be a non-negative integer in materialised working dataset response.",
  );

  if (!Array.isArray(workingDataset.headers)) {
    throw new Error(
      "headers must be an array in materialised working dataset response.",
    );
  }

  requireNonNegativeInteger(
    workingDataset.headersCount,
    "headersCount must be a non-negative integer in materialised working dataset response.",
  );
  requireNonNegativeInteger(
    workingDataset.rowsCount,
    "rowsCount must be a non-negative integer in materialised working dataset response.",
  );

  requireValue(
    workingDataset.lineage,
    "lineage is required in materialised working dataset response.",
  );
  requireValue(
    workingDataset.lineage.sourceDatasetId,
    "lineage sourceDatasetId is required in materialised working dataset response.",
  );

  if (
    workingDataset.lineage.sourceDatasetId !== workingDataset.sourceDatasetId
  ) {
    throw new Error(
      "lineage sourceDatasetId must match sourceDatasetId in materialised working dataset response.",
    );
  }

  return {
    workingDatasetId: workingDataset.workingDatasetId,
    sourceDatasetId: workingDataset.sourceDatasetId,
    customerId: workingDataset.customerId,
    profileId: workingDataset.profileId,
    workingName: workingDataset.workingName,
    datasetType: workingDataset.datasetType,
    status: workingDataset.status,
    currentStepNumber: workingDataset.currentStepNumber ?? null,
    storagePath: workingDataset.storagePath,
    storedFileName: workingDataset.storedFileName,
    mimeType: workingDataset.mimeType,
    fileSize: workingDataset.fileSize,
    headers: workingDataset.headers,
    headersCount: workingDataset.headersCount,
    rowsCount: workingDataset.rowsCount,
    lineage: workingDataset.lineage,
    meta: workingDataset.meta || {},
    activeEditor: workingDataset.activeEditor || null,
    finalisedAt: workingDataset.finalisedAt || null,
    finalisedBy: workingDataset.finalisedBy || null,
    createdAt: workingDataset.createdAt,
    updatedAt: workingDataset.updatedAt,
  };
}

function normaliseEditorSession(editorSession) {
  requireValue(
    editorSession,
    "editorSession is required in working dataset editor lease response.",
  );
  requireValue(
    editorSession.sessionId,
    "sessionId is required in working dataset editor lease response.",
  );
  requireValue(
    editorSession.userId,
    "userId is required in working dataset editor lease response.",
  );
  requireValue(
    editorSession.startedAt,
    "startedAt is required in working dataset editor lease response.",
  );
  requireValue(
    editorSession.lastSeenAt,
    "lastSeenAt is required in working dataset editor lease response.",
  );
  requireValue(
    editorSession.expiresAt,
    "expiresAt is required in working dataset editor lease response.",
  );

  return {
    sessionId: editorSession.sessionId,
    userId: editorSession.userId,
    startedAt: editorSession.startedAt,
    lastSeenAt: editorSession.lastSeenAt,
    expiresAt: editorSession.expiresAt,
  };
}

export function normaliseWorkingDatasetEditorLeaseResponse(response) {
  const data = unwrapResponse(response);

  if (!data || data.success !== true) {
    throw new Error(
      "Working dataset editor lease response was not successful.",
    );
  }

  return {
    success: true,
    workingDataset: normaliseWorkingDataset(data.workingDataset),
    editorSession: normaliseEditorSession(data.editorSession),
  };
}

export function normaliseWorkingDatasetMaterialisationResponse(response) {
  const data = unwrapResponse(response);

  if (!data || data.success !== true) {
    throw new Error(
      "Working dataset materialisation response was not successful.",
    );
  }

  return {
    success: true,
    workingDataset: normaliseWorkingDataset(data.workingDataset),
    activity: normaliseActivity(data.activity, "working_dataset_materialised"),
  };
}

export function normaliseWorkingDatasetFinalisationResponse(response) {
  const data = unwrapResponse(response);

  if (!data || data.success !== true) {
    throw new Error(
      "Working dataset finalisation response was not successful.",
    );
  }

  return {
    success: true,
    workingDataset: normaliseWorkingDataset(data.workingDataset),
    activity: normaliseActivity(data.activity, "working_dataset_finalised"),
  };
}
export function buildWorkingDatasetFinalisationPayload({
  profileId,
  editorSessionId,
  stepNumber,
}) {
  requireValue(
    profileId,
    "profileId is required for working dataset finalisation.",
  );
  requireValue(
    editorSessionId,
    "editorSessionId is required for working dataset finalisation.",
  );

  const payload = {
    profileId,
    editorSessionId,
  };

  if (stepNumber !== undefined && stepNumber !== null) {
    payload.stepNumber = stepNumber;
  }

  return payload;
}

function normaliseProjectionFields(fields) {
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error(
      "fields must contain at least one projection field for working dataset materialisation.",
    );
  }

  return fields.map((field) => {
    requireValue(
      field?.sourceField,
      "sourceField is required for working dataset materialisation.",
    );
    requireValue(
      field?.targetField,
      "targetField is required for working dataset materialisation.",
    );

    return {
      sourceField: field.sourceField,
      targetField: field.targetField,
    };
  });
}

function normaliseCustomFields(customFields = []) {
  if (!Array.isArray(customFields)) {
    throw new Error(
      "customFields must be an array for working dataset materialisation.",
    );
  }

  return customFields.map((field) => {
    requireValue(
      field?.targetField,
      "custom field targetField is required for working dataset materialisation.",
    );

    return {
      targetField: field.targetField,
      value: field.value ?? "",
    };
  });
}

export function buildWorkingDatasetEditorLeasePayload({ profileId }) {
  requireValue(
    profileId,
    "profileId is required for working dataset editor lease.",
  );

  return {
    profileId,
  };
}

export function buildWorkingDatasetEditorLeaseRenewalPayload({
  profileId,
  editorSessionId,
}) {
  requireValue(
    profileId,
    "profileId is required for working dataset editor lease renewal.",
  );
  requireValue(
    editorSessionId,
    "editorSessionId is required for working dataset editor lease renewal.",
  );

  return {
    profileId,
    editorSessionId,
  };
}

export function buildWorkingDatasetMaterialisationPayload({
  profileId,
  editorSessionId,
  stepNumber,
  fields,
  customFields = [],
}) {
  requireValue(
    profileId,
    "profileId is required for working dataset materialisation.",
  );
  requireValue(
    editorSessionId,
    "editorSessionId is required for working dataset materialisation.",
  );

  const payload = {
    profileId,
    editorSessionId,
    fields: normaliseProjectionFields(fields),
    customFields: normaliseCustomFields(customFields),
  };

  if (stepNumber !== undefined && stepNumber !== null) {
    payload.stepNumber = stepNumber;
  }

  return payload;
}

export async function acquireWorkingDatasetEditorLease(command) {
  requireValue(
    command?.workingDatasetId,
    "workingDatasetId is required for working dataset editor lease.",
  );

  const payload = buildWorkingDatasetEditorLeasePayload(command);
  const response = await fetchWrapper.post(
    `${baseUrl}/working-datasets/${command.workingDatasetId}/editor-lease`,
    payload,
  );

  return normaliseWorkingDatasetEditorLeaseResponse(response);
}

export async function renewWorkingDatasetEditorLease(command) {
  requireValue(
    command?.workingDatasetId,
    "workingDatasetId is required for working dataset editor lease renewal.",
  );

  const payload = buildWorkingDatasetEditorLeaseRenewalPayload(command);
  const response = await fetchWrapper.post(
    `${baseUrl}/working-datasets/${command.workingDatasetId}/editor-lease/renew`,
    payload,
  );

  return normaliseWorkingDatasetEditorLeaseResponse(response);
}

export async function materialiseWorkingDataset(command) {
  requireValue(
    command?.workingDatasetId,
    "workingDatasetId is required for working dataset materialisation.",
  );

  const payload = buildWorkingDatasetMaterialisationPayload(command);
  const response = await fetchWrapper.post(
    `${baseUrl}/working-datasets/${command.workingDatasetId}/materialise`,
    payload,
  );

  return normaliseWorkingDatasetMaterialisationResponse(response);
}

export async function finaliseWorkingDataset(command) {
  requireValue(
    command?.workingDatasetId,
    "workingDatasetId is required for working dataset finalisation.",
  );

  const payload = buildWorkingDatasetFinalisationPayload(command);
  const response = await fetchWrapper.post(
    `${baseUrl}/working-datasets/${command.workingDatasetId}/finalise`,
    payload,
  );

  return normaliseWorkingDatasetFinalisationResponse(response);
}
