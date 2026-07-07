import {
  buildWorkingDatasetMaterialisationPayload,
  materialiseWorkingDataset,
  normaliseWorkingDatasetMaterialisationResponse,
} from "platform/transformation/transformationApi";
import { fetchWrapper } from "shared/utils";

jest.mock("shared/utils", () => ({
  fetchWrapper: {
    post: jest.fn(),
  },
}));

function createBackendWorkingDataset(overrides = {}) {
  return {
    workingDatasetId: "working-dataset-123",
    sourceDatasetId: "dataset-123",
    customerId: "customer-123",
    profileId: "profile-123",
    workingName: "July payments working data",
    datasetType: "payment",
    status: "in_progress",
    currentStepNumber: 2,
    storagePath:
      "/storage/data_hub/customer-123/datasets/working-dataset-123-materialised.csv",
    storedFileName: "working-dataset-123-materialised.csv",
    mimeType: "text/csv",
    fileSize: 85,
    headers: ["invoice_reference_number", "supplier_name", "source_file_type"],
    headersCount: 3,
    rowsCount: 1,
    lineage: {
      sourceDatasetId: "dataset-123",
      createdFrom: "immutable_dataset",
    },
    meta: {
      materialisedFrom: "projection_config",
    },
    activeEditor: {
      userId: "user-123",
      sessionId: "session-123",
      expiresAt: "2026-07-07T08:11:05.287Z",
    },
    finalisedAt: null,
    finalisedBy: null,
    createdAt: "2026-07-07T02:41:58.685Z",
    updatedAt: "2026-07-07T07:42:08.588Z",
    ...overrides,
  };
}

function createBackendActivity(overrides = {}) {
  return {
    activityId: "activity-123",
    activityType: "working_dataset_materialised",
    summary: "Materialised working dataset from projection configuration",
    stepNumber: 2,
    details: {
      editorSessionId: "session-123",
      storedFileName: "working-dataset-123-materialised.csv",
      rowsCount: 1,
      headersCount: 3,
    },
    createdAt: "2026-07-07T07:42:08.593Z",
    ...overrides,
  };
}

function createBackendMaterialisationResponse(overrides = {}) {
  return {
    success: true,
    workingDataset: createBackendWorkingDataset(overrides.workingDataset),
    activity: createBackendActivity(overrides.activity),
  };
}

describe("buildWorkingDatasetMaterialisationPayload", () => {
  it("builds the materialisation request payload", () => {
    const result = buildWorkingDatasetMaterialisationPayload({
      profileId: "profile-123",
      editorSessionId: "session-123",
      stepNumber: 2,
      fields: [
        {
          sourceField: "Invoice",
          targetField: "invoice_reference_number",
        },
        {
          sourceField: "Supplier",
          targetField: "supplier_name",
        },
      ],
      customFields: [
        {
          targetField: "source_file_type",
          value: "payments",
        },
      ],
    });

    expect(result).toEqual({
      profileId: "profile-123",
      editorSessionId: "session-123",
      stepNumber: 2,
      fields: [
        {
          sourceField: "Invoice",
          targetField: "invoice_reference_number",
        },
        {
          sourceField: "Supplier",
          targetField: "supplier_name",
        },
      ],
      customFields: [
        {
          targetField: "source_file_type",
          value: "payments",
        },
      ],
    });
  });

  it("defaults custom field values to an empty string", () => {
    const result = buildWorkingDatasetMaterialisationPayload({
      profileId: "profile-123",
      editorSessionId: "session-123",
      fields: [
        {
          sourceField: "Invoice",
          targetField: "invoice_reference_number",
        },
      ],
      customFields: [
        {
          targetField: "source_file_type",
        },
      ],
    });

    expect(result.customFields).toEqual([
      {
        targetField: "source_file_type",
        value: "",
      },
    ]);
    expect(result).not.toHaveProperty("stepNumber");
  });

  it("fails loudly when profileId is missing", () => {
    expect(() =>
      buildWorkingDatasetMaterialisationPayload({
        editorSessionId: "session-123",
        fields: [
          {
            sourceField: "Invoice",
            targetField: "invoice_reference_number",
          },
        ],
      }),
    ).toThrow("profileId is required for working dataset materialisation.");
  });

  it("fails loudly when fields are empty", () => {
    expect(() =>
      buildWorkingDatasetMaterialisationPayload({
        profileId: "profile-123",
        editorSessionId: "session-123",
        fields: [],
      }),
    ).toThrow(
      "fields must contain at least one projection field for working dataset materialisation.",
    );
  });
});

describe("normaliseWorkingDatasetMaterialisationResponse", () => {
  it("normalises a direct backend materialisation response", () => {
    const result = normaliseWorkingDatasetMaterialisationResponse(
      createBackendMaterialisationResponse(),
    );

    expect(result).toEqual({
      success: true,
      workingDataset: createBackendWorkingDataset(),
      activity: createBackendActivity(),
    });
  });

  it("normalises a wrapped backend materialisation response", () => {
    const result = normaliseWorkingDatasetMaterialisationResponse({
      data: createBackendMaterialisationResponse({
        workingDataset: {
          workingDatasetId: "working-dataset-456",
          workingName: "Wrapped materialised working data",
        },
        activity: {
          activityId: "activity-456",
        },
      }),
    });

    expect(result.workingDataset.workingDatasetId).toBe("working-dataset-456");
    expect(result.workingDataset.workingName).toBe(
      "Wrapped materialised working data",
    );
    expect(result.activity.activityId).toBe("activity-456");
  });

  it("fails loudly when the response was not successful", () => {
    expect(() =>
      normaliseWorkingDatasetMaterialisationResponse({
        success: false,
        workingDataset: createBackendWorkingDataset(),
        activity: createBackendActivity(),
      }),
    ).toThrow("Working dataset materialisation response was not successful.");
  });

  it("fails loudly when required working dataset fields are missing", () => {
    expect(() =>
      normaliseWorkingDatasetMaterialisationResponse(
        createBackendMaterialisationResponse({
          workingDataset: {
            storagePath: "",
          },
        }),
      ),
    ).toThrow(
      "storagePath is required in materialised working dataset response.",
    );
  });

  it("fails loudly when lineage does not match sourceDatasetId", () => {
    expect(() =>
      normaliseWorkingDatasetMaterialisationResponse(
        createBackendMaterialisationResponse({
          workingDataset: {
            lineage: {
              sourceDatasetId: "different-dataset",
              createdFrom: "immutable_dataset",
            },
          },
        }),
      ),
    ).toThrow(
      "lineage sourceDatasetId must match sourceDatasetId in materialised working dataset response.",
    );
  });

  it("fails loudly when activity type is not materialised", () => {
    expect(() =>
      normaliseWorkingDatasetMaterialisationResponse(
        createBackendMaterialisationResponse({
          activity: {
            activityType: "working_dataset_created",
          },
        }),
      ),
    ).toThrow(
      "activityType must be working_dataset_materialised in materialisation activity response.",
    );
  });
});

describe("materialiseWorkingDataset", () => {
  beforeEach(() => {
    fetchWrapper.post.mockResolvedValue(createBackendMaterialisationResponse());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("posts the materialisation payload to the Transformation endpoint", async () => {
    const result = await materialiseWorkingDataset({
      workingDatasetId: "working-dataset-123",
      profileId: "profile-123",
      editorSessionId: "session-123",
      stepNumber: 2,
      fields: [
        {
          sourceField: "Invoice",
          targetField: "invoice_reference_number",
        },
      ],
      customFields: [
        {
          targetField: "source_file_type",
          value: "payments",
        },
      ],
    });

    expect(fetchWrapper.post).toHaveBeenCalledWith(
      "http://localhost:4000/api/platform/transformation/working-datasets/working-dataset-123/materialise",
      {
        profileId: "profile-123",
        editorSessionId: "session-123",
        stepNumber: 2,
        fields: [
          {
            sourceField: "Invoice",
            targetField: "invoice_reference_number",
          },
        ],
        customFields: [
          {
            targetField: "source_file_type",
            value: "payments",
          },
        ],
      },
    );
    expect(result).toEqual({
      success: true,
      workingDataset: createBackendWorkingDataset(),
      activity: createBackendActivity(),
    });
  });

  it("fails loudly when workingDatasetId is missing", async () => {
    await expect(
      materialiseWorkingDataset({
        profileId: "profile-123",
        editorSessionId: "session-123",
        fields: [
          {
            sourceField: "Invoice",
            targetField: "invoice_reference_number",
          },
        ],
      }),
    ).rejects.toThrow(
      "workingDatasetId is required for working dataset materialisation.",
    );

    expect(fetchWrapper.post).not.toHaveBeenCalled();
  });

  it("fails loudly when the backend response is malformed", async () => {
    fetchWrapper.post.mockResolvedValue({
      success: true,
      workingDataset: {
        workingDatasetId: "working-dataset-123",
      },
      activity: createBackendActivity(),
    });

    await expect(
      materialiseWorkingDataset({
        workingDatasetId: "working-dataset-123",
        profileId: "profile-123",
        editorSessionId: "session-123",
        fields: [
          {
            sourceField: "Invoice",
            targetField: "invoice_reference_number",
          },
        ],
      }),
    ).rejects.toThrow(
      "sourceDatasetId is required in materialised working dataset response.",
    );
  });
});
