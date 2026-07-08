import {
  buildDatasetCreationFormData,
  buildWorkingDatasetActivityQuery,
  buildWorkingDatasetCreationPayload,
  buildWorkingDatasetDetailQuery,
  buildWorkingDatasetListQuery,
  createDataDataset,
  createWorkingDataset,
  getWorkingDataset,
  listWorkingDatasetActivity,
  listWorkingDatasets,
  normaliseDataDatasetCreationResponse,
  normaliseWorkingDatasetActivityResponse,
  normaliseWorkingDatasetCreationResponse,
  normaliseWorkingDatasetDetailResponse,
  normaliseWorkingDatasetListResponse,
} from "platform/data/dataApi";
import { fetchWrapper } from "shared/utils";

jest.mock("shared/utils", () => ({
  fetchWrapper: {
    get: jest.fn(),
    post: jest.fn(),
    postUpload: jest.fn(),
  },
}));

function createBackendDataset(overrides = {}) {
  return {
    datasetId: "dataset123",
    customerId: "customer-123",
    profileId: "profile-123",
    datasetType: "payment",
    sourceType: "csv_upload",
    sourceName: "July payments",
    originalFileName: "payments.csv",
    storedFileName: "dataset123.csv",
    storagePath: "/storage/data_hub/customer-123/datasets/dataset123.csv",
    mimeType: "text/csv",
    fileSize: 12345,
    headers: ["Supplier", "Invoice"],
    headersCount: 2,
    rowsCount: 1,
    status: "available",
    isImmutable: true,
    createdAt: "2026-07-06T07:00:00.000Z",
    // updatedAt removed as per instructions
    ...overrides,
  };
}

function createBackendResponse(overrides = {}) {
  return {
    success: true,
    dataset: createBackendDataset(overrides),
  };
}

function createBackendWorkingDataset(overrides = {}) {
  return {
    workingDatasetId: "working-dataset-123",
    sourceDatasetId: "dataset123",
    customerId: "customer-123",
    profileId: "profile-123",
    workingName: "July payments working data",
    datasetType: "payment",
    headers: ["Supplier", "Invoice"],
    headersCount: 2,
    rowsCount: 1,
    status: "available",
    currentStepNumber: null,
    storagePath: null,
    storedFileName: null,
    mimeType: null,
    fileSize: null,
    lineage: {
      sourceDatasetId: "dataset123",
      createdFrom: "immutable_dataset",
    },
    meta: {},
    activeEditor: null,
    finalisedAt: null,
    finalisedBy: null,
    createdAt: "2026-07-06T08:00:00.000Z",
    updatedAt: "2026-07-06T08:30:00.000Z",
    ...overrides,
  };
}

function createBackendWorkingDatasetResponse(overrides = {}) {
  return {
    success: true,
    workingDataset: createBackendWorkingDataset(overrides),
  };
}

function createBackendWorkingDatasetListResponse(overrides = {}) {
  return {
    success: true,
    workingDatasets: [createBackendWorkingDataset(overrides)],
  };
}

function createBackendWorkingDatasetActivity(overrides = {}) {
  return {
    activityId: "activity-123",
    customerId: "customer-123",
    profileId: "profile-123",
    workingDatasetId: "working-dataset-123",
    activityType: "working_dataset_created",
    stepNumber: 1,
    summary: "Created working dataset July payments working data",
    details: {
      sourceDatasetId: "dataset123",
    },
    relatedCapability: "data",
    relatedRecordId: "working-dataset-123",
    createdBy: "user-123",
    createdAt: "2026-07-06T08:00:00.000Z",
    ...overrides,
  };
}

function createBackendWorkingDatasetActivityResponse(overrides = {}) {
  return {
    success: true,
    activities: [createBackendWorkingDatasetActivity(overrides)],
  };
}

describe("normaliseDataDatasetCreationResponse", () => {
  it("normalises a direct backend response", () => {
    const result = normaliseDataDatasetCreationResponse(
      createBackendResponse(),
    );

    expect(result).toEqual({
      success: true,
      dataset: createBackendDataset(),
    });
  });

  it("normalises a wrapped backend response", () => {
    const result = normaliseDataDatasetCreationResponse({
      data: createBackendResponse({
        datasetId: "dataset456",
        sourceName: "Wrapped payments",
      }),
    });

    expect(result).toEqual({
      success: true,
      dataset: createBackendDataset({
        datasetId: "dataset456",
        sourceName: "Wrapped payments",
      }),
    });
  });

  it("fails loudly when the response was not successful", () => {
    expect(() =>
      normaliseDataDatasetCreationResponse({
        success: false,
        dataset: createBackendDataset(),
      }),
    ).toThrow("Data dataset creation response was not successful.");
  });

  it("fails loudly when the dataset is missing", () => {
    expect(() =>
      normaliseDataDatasetCreationResponse({
        success: true,
        dataset: null,
      }),
    ).toThrow("Data dataset response is required.");
  });

  it("fails loudly when a required string field is missing", () => {
    expect(() =>
      normaliseDataDatasetCreationResponse(
        createBackendResponse({
          datasetId: "",
        }),
      ),
    ).toThrow("datasetId is required in Data dataset response.");
  });

  it("fails loudly when fileSize is invalid", () => {
    expect(() =>
      normaliseDataDatasetCreationResponse(
        createBackendResponse({
          fileSize: -1,
        }),
      ),
    ).toThrow(
      "fileSize must be a non-negative integer in Data dataset response.",
    );
  });

  it("fails loudly when headers are not an array", () => {
    expect(() =>
      normaliseDataDatasetCreationResponse(
        createBackendResponse({
          headers: "Supplier,Invoice",
        }),
      ),
    ).toThrow("headers must be an array in Data dataset response.");
  });
});

describe("normaliseWorkingDatasetCreationResponse", () => {
  it("normalises a direct backend working dataset response", () => {
    const result = normaliseWorkingDatasetCreationResponse(
      createBackendWorkingDatasetResponse(),
    );

    expect(result).toEqual({
      success: true,
      workingDataset: createBackendWorkingDataset(),
    });
  });

  it("normalises a wrapped backend working dataset response", () => {
    const result = normaliseWorkingDatasetCreationResponse({
      data: createBackendWorkingDatasetResponse({
        workingDatasetId: "working-dataset-456",
        workingName: "Wrapped working data",
      }),
    });

    expect(result).toEqual({
      success: true,
      workingDataset: createBackendWorkingDataset({
        workingDatasetId: "working-dataset-456",
        workingName: "Wrapped working data",
      }),
    });
  });

  it("fails loudly when the working dataset response was not successful", () => {
    expect(() =>
      normaliseWorkingDatasetCreationResponse({
        success: false,
        workingDataset: createBackendWorkingDataset(),
      }),
    ).toThrow("Working dataset creation response was not successful.");
  });

  it("fails loudly when lineage does not match the source dataset", () => {
    expect(() =>
      normaliseWorkingDatasetCreationResponse(
        createBackendWorkingDatasetResponse({
          lineage: {
            sourceDatasetId: "different-source",
            createdFrom: "immutable_dataset",
          },
        }),
      ),
    ).toThrow(
      "lineage sourceDatasetId must match sourceDatasetId in working dataset response.",
    );
  });
});

describe("normaliseWorkingDatasetListResponse", () => {
  it("normalises a direct backend working dataset list response", () => {
    const result = normaliseWorkingDatasetListResponse(
      createBackendWorkingDatasetListResponse(),
    );

    expect(result).toEqual({
      success: true,
      workingDatasets: [createBackendWorkingDataset()],
    });
  });

  it("normalises a wrapped backend working dataset list response", () => {
    const result = normaliseWorkingDatasetListResponse({
      data: createBackendWorkingDatasetListResponse({
        workingDatasetId: "working-dataset-456",
        workingName: "Wrapped working data",
      }),
    });

    expect(result).toEqual({
      success: true,
      workingDatasets: [
        createBackendWorkingDataset({
          workingDatasetId: "working-dataset-456",
          workingName: "Wrapped working data",
        }),
      ],
    });
  });

  it("fails loudly when workingDatasets is not an array", () => {
    expect(() =>
      normaliseWorkingDatasetListResponse({
        success: true,
        workingDatasets: createBackendWorkingDataset(),
      }),
    ).toThrow(
      "workingDatasets must be an array in working dataset list response.",
    );
  });
});

describe("normaliseWorkingDatasetDetailResponse", () => {
  it("normalises a direct backend working dataset detail response", () => {
    const result = normaliseWorkingDatasetDetailResponse(
      createBackendWorkingDatasetResponse(),
      "working-dataset-123",
    );

    expect(result).toEqual({
      success: true,
      workingDataset: createBackendWorkingDataset(),
    });
  });

  it("fails loudly when the response id does not match the requested id", () => {
    expect(() =>
      normaliseWorkingDatasetDetailResponse(
        createBackendWorkingDatasetResponse({
          workingDatasetId: "working-dataset-999",
        }),
        "working-dataset-123",
      ),
    ).toThrow(
      "workingDatasetId must match requested working dataset id in working dataset detail response.",
    );
  });
});

describe("normaliseWorkingDatasetActivityResponse", () => {
  it("normalises a direct backend working dataset activity response", () => {
    const result = normaliseWorkingDatasetActivityResponse(
      createBackendWorkingDatasetActivityResponse(),
      "working-dataset-123",
    );

    expect(result).toEqual({
      success: true,
      activities: [createBackendWorkingDatasetActivity()],
    });
  });

  it("normalises a wrapped backend working dataset activity response", () => {
    const result = normaliseWorkingDatasetActivityResponse(
      {
        data: createBackendWorkingDatasetActivityResponse({
          activityId: "activity-456",
          activityType: "working_dataset_finalised",
          summary: "Finalised working dataset July payments working data",
        }),
      },
      "working-dataset-123",
    );

    expect(result).toEqual({
      success: true,
      activities: [
        createBackendWorkingDatasetActivity({
          activityId: "activity-456",
          activityType: "working_dataset_finalised",
          summary: "Finalised working dataset July payments working data",
        }),
      ],
    });
  });

  it("fails loudly when activity workingDatasetId does not match the requested id", () => {
    expect(() =>
      normaliseWorkingDatasetActivityResponse(
        createBackendWorkingDatasetActivityResponse({
          workingDatasetId: "working-dataset-999",
        }),
        "working-dataset-123",
      ),
    ).toThrow(
      "activity workingDatasetId must match requested working dataset id in working dataset activity response.",
    );
  });
});

describe("buildDatasetCreationFormData", () => {
  it("builds multipart form data for Data dataset creation", () => {
    const file = new File(["Supplier,Invoice\nABC,INV-001\n"], "payments.csv", {
      type: "text/csv",
    });

    const result = buildDatasetCreationFormData({
      file,
      sourceName: "July payments",
      datasetType: "payment",
      profileId: "profile-123",
    });

    expect(result).toBeInstanceOf(FormData);
    expect(result.get("file")).toBe(file);
    expect(result.get("sourceName")).toBe("July payments");
    expect(result.get("datasetType")).toBe("payment");
    expect(result.get("profileId")).toBe("profile-123");
  });

  it("fails loudly when file is missing", () => {
    expect(() =>
      buildDatasetCreationFormData({
        sourceName: "July payments",
        datasetType: "payment",
        profileId: "profile-123",
      }),
    ).toThrow("file is required for Data dataset creation.");
  });

  it("fails loudly when profileId is missing", () => {
    const file = new File(["Supplier,Invoice\nABC,INV-001\n"], "payments.csv", {
      type: "text/csv",
    });

    expect(() =>
      buildDatasetCreationFormData({
        file,
        sourceName: "July payments",
        datasetType: "payment",
      }),
    ).toThrow("profileId is required for Data dataset creation.");
  });
});

describe("buildWorkingDatasetCreationPayload", () => {
  it("builds JSON payload for working dataset creation", () => {
    const result = buildWorkingDatasetCreationPayload({
      sourceDatasetId: "dataset123",
      profileId: "profile-123",
      workingName: "July payments working data",
    });

    expect(result).toEqual({
      sourceDatasetId: "dataset123",
      profileId: "profile-123",
      workingName: "July payments working data",
    });
  });

  it("fails loudly when sourceDatasetId is missing", () => {
    expect(() =>
      buildWorkingDatasetCreationPayload({
        profileId: "profile-123",
        workingName: "July payments working data",
      }),
    ).toThrow("sourceDatasetId is required for working dataset creation.");
  });
});

describe("buildWorkingDatasetListQuery", () => {
  it("builds query params for working dataset listing", () => {
    expect(
      buildWorkingDatasetListQuery({
        profileId: "profile-123",
      }),
    ).toEqual({
      profileId: "profile-123",
    });
  });

  it("fails loudly when profileId is missing", () => {
    expect(() => buildWorkingDatasetListQuery({})).toThrow(
      "profileId is required for working dataset listing.",
    );
  });
});

describe("buildWorkingDatasetDetailQuery", () => {
  it("builds query params for working dataset detail retrieval", () => {
    expect(
      buildWorkingDatasetDetailQuery({
        profileId: "profile-123",
      }),
    ).toEqual({
      profileId: "profile-123",
    });
  });

  it("fails loudly when profileId is missing", () => {
    expect(() => buildWorkingDatasetDetailQuery({})).toThrow(
      "profileId is required for working dataset detail retrieval.",
    );
  });
});

describe("buildWorkingDatasetActivityQuery", () => {
  it("builds query params for working dataset activity listing", () => {
    expect(
      buildWorkingDatasetActivityQuery({
        profileId: "profile-123",
      }),
    ).toEqual({
      profileId: "profile-123",
    });
  });

  it("fails loudly when profileId is missing", () => {
    expect(() => buildWorkingDatasetActivityQuery({})).toThrow(
      "profileId is required for working dataset activity listing.",
    );
  });
});

describe("createDataDataset", () => {
  beforeEach(() => {
    fetchWrapper.postUpload.mockResolvedValue(createBackendResponse());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("posts multipart form data to the Platform Data dataset endpoint", async () => {
    const file = new File(["Supplier,Invoice\nABC,INV-001\n"], "payments.csv", {
      type: "text/csv",
    });

    const result = await createDataDataset({
      file,
      sourceName: "July payments",
      datasetType: "payment",
      profileId: "profile-123",
    });

    expect(fetchWrapper.postUpload).toHaveBeenCalledWith(
      "http://localhost:4000/api/platform/data/datasets",
      expect.any(FormData),
    );
    expect(fetchWrapper.postUpload.mock.calls[0][1].get("file")).toBe(file);
    expect(result).toEqual({
      success: true,
      dataset: createBackendDataset(),
    });
  });

  it("fails loudly when the backend response is malformed", async () => {
    fetchWrapper.postUpload.mockResolvedValue({
      success: true,
      dataset: {
        datasetId: "dataset123",
      },
    });

    const file = new File(["Supplier,Invoice\nABC,INV-001\n"], "payments.csv", {
      type: "text/csv",
    });

    await expect(
      createDataDataset({
        file,
        sourceName: "July payments",
        datasetType: "payment",
        profileId: "profile-123",
      }),
    ).rejects.toThrow("customerId is required in Data dataset response.");
  });
});

describe("createWorkingDataset", () => {
  beforeEach(() => {
    fetchWrapper.post.mockResolvedValue(createBackendWorkingDatasetResponse());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("posts JSON payload to the Platform Data working dataset endpoint", async () => {
    const result = await createWorkingDataset({
      sourceDatasetId: "dataset123",
      profileId: "profile-123",
      workingName: "July payments working data",
    });

    expect(fetchWrapper.post).toHaveBeenCalledWith(
      "http://localhost:4000/api/platform/data/working-datasets",
      {
        sourceDatasetId: "dataset123",
        profileId: "profile-123",
        workingName: "July payments working data",
      },
    );
    expect(result).toEqual({
      success: true,
      workingDataset: createBackendWorkingDataset(),
    });
  });

  it("fails loudly when backend working dataset response is malformed", async () => {
    fetchWrapper.post.mockResolvedValue({
      success: true,
      workingDataset: {
        workingDatasetId: "working-dataset-123",
      },
    });

    await expect(
      createWorkingDataset({
        sourceDatasetId: "dataset123",
        profileId: "profile-123",
        workingName: "July payments working data",
      }),
    ).rejects.toThrow(
      "sourceDatasetId is required in working dataset response.",
    );
  });
});

describe("listWorkingDatasets", () => {
  beforeEach(() => {
    fetchWrapper.get.mockResolvedValue(
      createBackendWorkingDatasetListResponse(),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("gets working datasets from the Platform Data working dataset endpoint", async () => {
    const result = await listWorkingDatasets({
      profileId: "profile-123",
    });

    expect(fetchWrapper.get).toHaveBeenCalledWith(
      "http://localhost:4000/api/platform/data/working-datasets",
      {
        profileId: "profile-123",
      },
    );
    expect(result).toEqual({
      success: true,
      workingDatasets: [createBackendWorkingDataset()],
    });
  });

  it("fails loudly when backend working dataset list response is malformed", async () => {
    fetchWrapper.get.mockResolvedValue({
      success: true,
      workingDatasets: [{ workingDatasetId: "working-dataset-123" }],
    });

    await expect(
      listWorkingDatasets({
        profileId: "profile-123",
      }),
    ).rejects.toThrow(
      "sourceDatasetId is required in working dataset response.",
    );
  });
});

describe("getWorkingDataset", () => {
  beforeEach(() => {
    fetchWrapper.get.mockResolvedValue(createBackendWorkingDatasetResponse());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("gets working dataset detail from the Platform Data working dataset endpoint", async () => {
    const result = await getWorkingDataset({
      workingDatasetId: "working-dataset-123",
      profileId: "profile-123",
    });

    expect(fetchWrapper.get).toHaveBeenCalledWith(
      "http://localhost:4000/api/platform/data/working-datasets/working-dataset-123",
      {
        profileId: "profile-123",
      },
    );
    expect(result).toEqual({
      success: true,
      workingDataset: createBackendWorkingDataset(),
    });
  });

  it("fails loudly when workingDatasetId is missing", async () => {
    await expect(
      getWorkingDataset({
        profileId: "profile-123",
      }),
    ).rejects.toThrow(
      "workingDatasetId is required for working dataset detail retrieval.",
    );

    expect(fetchWrapper.get).not.toHaveBeenCalled();
  });
});

describe("listWorkingDatasetActivity", () => {
  beforeEach(() => {
    fetchWrapper.get.mockResolvedValue(
      createBackendWorkingDatasetActivityResponse(),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("gets working dataset activity from the Platform Data working dataset activity endpoint", async () => {
    const result = await listWorkingDatasetActivity({
      workingDatasetId: "working-dataset-123",
      profileId: "profile-123",
    });

    expect(fetchWrapper.get).toHaveBeenCalledWith(
      "http://localhost:4000/api/platform/data/working-datasets/working-dataset-123/activity",
      {
        profileId: "profile-123",
      },
    );
    expect(result).toEqual({
      success: true,
      activities: [createBackendWorkingDatasetActivity()],
    });
  });

  it("fails loudly when workingDatasetId is missing", async () => {
    await expect(
      listWorkingDatasetActivity({
        profileId: "profile-123",
      }),
    ).rejects.toThrow(
      "workingDatasetId is required for working dataset activity listing.",
    );

    expect(fetchWrapper.get).not.toHaveBeenCalled();
  });
});
