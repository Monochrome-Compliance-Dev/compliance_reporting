import {
  buildDatasetCreationFormData,
  createDataDataset,
  normaliseDataDatasetCreationResponse,
} from "platform/data/dataApi";
import { fetchWrapper } from "shared/utils";

jest.mock("shared/utils", () => ({
  fetchWrapper: {
    post: jest.fn(),
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
    ...overrides,
  };
}

function createBackendResponse(overrides = {}) {
  return {
    success: true,
    dataset: createBackendDataset(overrides),
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

describe("createDataDataset", () => {
  beforeEach(() => {
    fetchWrapper.post.mockResolvedValue(createBackendResponse());
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

    expect(fetchWrapper.post).toHaveBeenCalledWith(
      "http://localhost:4000/api/platform/data/datasets",
      expect.any(FormData),
    );
    expect(fetchWrapper.post.mock.calls[0][1].get("file")).toBe(file);
    expect(result).toEqual({
      success: true,
      dataset: createBackendDataset(),
    });
  });

  it("fails loudly when the backend response is malformed", async () => {
    fetchWrapper.post.mockResolvedValue({
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
