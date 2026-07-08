import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAlert } from "context";
import PlatformDataUploadPage from "platform/data/PlatformDataUploadPage";
import { createDataDataset, createWorkingDataset } from "platform/data/dataApi";
import {
  acquireWorkingDatasetEditorLease,
  finaliseWorkingDataset,
  materialiseWorkingDataset,
  renewWorkingDatasetEditorLease,
} from "platform/transformation/transformationApi";

jest.mock("platform/data/dataApi", () => ({
  createDataDataset: jest.fn(),
  createWorkingDataset: jest.fn(),
}));

jest.mock("platform/transformation/transformationApi", () => ({
  acquireWorkingDatasetEditorLease: jest.fn(),
  finaliseWorkingDataset: jest.fn(),
  materialiseWorkingDataset: jest.fn(),
  renewWorkingDatasetEditorLease: jest.fn(),
}));

jest.mock("context", () => ({
  useAlert: jest.fn(),
}));

const showAlert = jest.fn();

function createDataset(overrides = {}) {
  return {
    datasetId: "dataset123",
    profileId: "profile-123",
    sourceName: "July payments",
    rowsCount: 2,
    headersCount: 3,
    ...overrides,
  };
}

function createWorkingDatasetResponse(overrides = {}) {
  return {
    workingDatasetId: "working-dataset-123",
    sourceDatasetId: "dataset123",
    profileId: "profile-123",
    rowsCount: 2,
    headersCount: 2,
    headers: ["Supplier", "Invoice"],
    activeEditor: null,
    ...overrides,
  };
}

function createEditorLeaseResponse(overrides = {}) {
  const editorSession = {
    sessionId: "session-123",
    userId: "user-123",
    startedAt: "2099-07-07T07:41:05.287Z",
    lastSeenAt: "2099-07-07T07:41:05.287Z",
    expiresAt: "2099-07-07T08:11:05.287Z",
    ...overrides.editorSession,
  };

  return {
    success: true,
    workingDataset: createWorkingDatasetResponse({
      activeEditor: editorSession,
      ...overrides.workingDataset,
    }),
    editorSession,
  };
}

function createMaterialisedWorkingDatasetResponse(overrides = {}) {
  return {
    workingDatasetId: "working-dataset-123",
    sourceDatasetId: "dataset123",
    profileId: "profile-123",
    workingName: "July payments working data",
    rowsCount: 1,
    headersCount: 3,
    headers: ["invoice_reference_number", "supplier_name", "source_file_type"],
    storagePath:
      "/storage/data_hub/customer-123/datasets/working-dataset-123-materialised.csv",
    storedFileName: "working-dataset-123-materialised.csv",
    ...overrides,
  };
}

function createFinalisedWorkingDatasetResponse(overrides = {}) {
  return createMaterialisedWorkingDatasetResponse({
    status: "final",
    activeEditor: null,
    finalisedAt: "2099-07-07T08:00:00.000Z",
    finalisedBy: "user-123",
    ...overrides,
  });
}

describe("PlatformDataUploadPage", () => {
  beforeEach(() => {
    useAlert.mockReturnValue({ showAlert });
    createDataDataset.mockResolvedValue({
      success: true,
      dataset: createDataset(),
    });
    createWorkingDataset.mockResolvedValue({
      success: true,
      workingDataset: createWorkingDatasetResponse(),
    });
    acquireWorkingDatasetEditorLease.mockResolvedValue(
      createEditorLeaseResponse(),
    );
    renewWorkingDatasetEditorLease.mockResolvedValue(
      createEditorLeaseResponse(),
    );
    materialiseWorkingDataset.mockResolvedValue({
      success: true,
      workingDataset: createMaterialisedWorkingDatasetResponse(),
      activity: {
        activityId: "activity-123",
        activityType: "working_dataset_materialised",
        summary: "Materialised working dataset from projection configuration",
      },
    });
    finaliseWorkingDataset.mockResolvedValue({
      success: true,
      workingDataset: createFinalisedWorkingDatasetResponse(),
      activity: {
        activityId: "activity-456",
        activityType: "working_dataset_finalised",
        summary: "Finalised working dataset",
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Data upload form", () => {
    render(<PlatformDataUploadPage />);

    expect(screen.getByRole("heading", { name: "Platform Data" })).toBeTruthy();
    expect(screen.getByLabelText("Source name *")).toBeTruthy();
    expect(screen.getByLabelText("Dataset type *")).toBeTruthy();
    expect(screen.getByLabelText("Profile ID *")).toBeTruthy();
    expect(screen.getByLabelText("CSV file")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create dataset" })).toBeTruthy();
  });

  it("creates a Data dataset and displays the created dataset summary", async () => {
    const user = userEvent.setup();
    const file = new File(["A,B,C\n1,2,3\n"], "payments.csv", {
      type: "text/csv",
    });

    render(<PlatformDataUploadPage />);

    await user.type(screen.getByLabelText("Source name *"), "July payments");
    await user.type(screen.getByLabelText("Profile ID *"), "profile-123");
    await user.upload(screen.getByLabelText("CSV file"), file);
    await user.click(screen.getByRole("button", { name: "Create dataset" }));

    await waitFor(() => {
      expect(createDataDataset).toHaveBeenCalledWith({
        file,
        sourceName: "July payments",
        datasetType: "payment",
        profileId: "profile-123",
      });
    });

    expect(showAlert).toHaveBeenCalledWith(
      "Dataset uploaded successfully.",
      "success",
    );
    expect(screen.getByText("Dataset created")).toBeTruthy();
    expect(screen.getByText("Dataset ID: dataset123")).toBeTruthy();
    expect(screen.getByText("Rows: 2")).toBeTruthy();
    expect(screen.getByText("Headers: 3")).toBeTruthy();
  });

  it("creates a working dataset from the created immutable dataset", async () => {
    const user = userEvent.setup();
    const file = new File(["A,B,C\n1,2,3\n"], "payments.csv", {
      type: "text/csv",
    });

    render(<PlatformDataUploadPage />);

    await user.type(screen.getByLabelText("Source name *"), "July payments");
    await user.type(screen.getByLabelText("Profile ID *"), "profile-123");
    await user.upload(screen.getByLabelText("CSV file"), file);
    await user.click(screen.getByRole("button", { name: "Create dataset" }));

    await screen.findByText("Dataset created");

    await user.click(
      screen.getByRole("button", { name: "Create working dataset" }),
    );

    await waitFor(() => {
      expect(createWorkingDataset).toHaveBeenCalledWith({
        sourceDatasetId: "dataset123",
        profileId: "profile-123",
        workingName: "July payments working data",
      });
    });

    await waitFor(() => {
      expect(acquireWorkingDatasetEditorLease).toHaveBeenCalledWith({
        workingDatasetId: "working-dataset-123",
        profileId: "profile-123",
      });
    });

    expect(showAlert).toHaveBeenCalledWith(
      "Working dataset editor session acquired successfully.",
      "success",
    );
    expect(screen.getByText("Working dataset created")).toBeTruthy();
    expect(
      screen.getByText("Working Dataset ID: working-dataset-123"),
    ).toBeTruthy();
    expect(screen.getByText("Source Dataset ID: dataset123")).toBeTruthy();
  });

  it("materialises the working dataset from explicit projection inputs", async () => {
    const user = userEvent.setup();
    const file = new File(
      ["Supplier,Invoice\nABC Pty Ltd,INV-001\n"],
      "payments.csv",
      {
        type: "text/csv",
      },
    );

    render(<PlatformDataUploadPage />);

    await user.type(screen.getByLabelText("Source name *"), "July payments");
    await user.type(screen.getByLabelText("Profile ID *"), "profile-123");
    await user.upload(screen.getByLabelText("CSV file"), file);
    await user.click(screen.getByRole("button", { name: "Create dataset" }));

    await screen.findByText("Dataset created");

    await user.click(
      screen.getByRole("button", { name: "Create working dataset" }),
    );

    await screen.findByText("Working dataset created");

    await user.type(
      screen.getByLabelText("Target field for Supplier"),
      "supplier_name",
    );
    await user.type(
      screen.getByLabelText("Target field for Invoice"),
      "invoice_reference_number",
    );
    await user.type(
      screen.getByLabelText("Custom field target"),
      "source_file_type",
    );
    await user.type(screen.getByLabelText("Custom field value"), "payments");

    await user.click(
      screen.getByRole("button", { name: "Materialise working dataset" }),
    );

    await waitFor(() => {
      expect(materialiseWorkingDataset).toHaveBeenCalledWith({
        workingDatasetId: "working-dataset-123",
        profileId: "profile-123",
        editorSessionId: "session-123",
        stepNumber: 2,
        fields: [
          {
            sourceField: "Supplier",
            targetField: "supplier_name",
          },
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
    });

    expect(screen.getByText("Working dataset materialised")).toBeTruthy();
    expect(screen.getAllByText("Rows: 1")).toHaveLength(2);
    expect(screen.getAllByText("Headers: 3")).toHaveLength(3);
    expect(
      screen.getByText(
        "Headers: invoice_reference_number, supplier_name, source_file_type",
      ),
    ).toBeTruthy();
  });

  it("finalises the materialised working dataset with the backend-issued editor session", async () => {
    const user = userEvent.setup();
    const file = new File(
      ["Supplier,Invoice\nABC Pty Ltd,INV-001\n"],
      "payments.csv",
      {
        type: "text/csv",
      },
    );

    render(<PlatformDataUploadPage />);

    await user.type(screen.getByLabelText("Source name *"), "July payments");
    await user.type(screen.getByLabelText("Profile ID *"), "profile-123");
    await user.upload(screen.getByLabelText("CSV file"), file);
    await user.click(screen.getByRole("button", { name: "Create dataset" }));

    await screen.findByText("Dataset created");

    await user.click(
      screen.getByRole("button", { name: "Create working dataset" }),
    );

    await screen.findByText("Working dataset created");

    await user.type(
      screen.getByLabelText("Target field for Supplier"),
      "supplier_name",
    );
    await user.type(
      screen.getByLabelText("Target field for Invoice"),
      "invoice_reference_number",
    );

    await user.click(
      screen.getByRole("button", { name: "Materialise working dataset" }),
    );

    await screen.findByText("Working dataset materialised");

    await user.click(
      screen.getByRole("button", { name: "Finalise working dataset" }),
    );

    await waitFor(() => {
      expect(finaliseWorkingDataset).toHaveBeenCalledWith({
        workingDatasetId: "working-dataset-123",
        profileId: "profile-123",
        editorSessionId: "session-123",
        stepNumber: 3,
      });
    });

    expect(showAlert).toHaveBeenCalledWith(
      "Working dataset finalised successfully.",
      "success",
    );
    expect(screen.getByText("Working dataset finalised")).toBeTruthy();
    expect(screen.getByText("Status: final")).toBeTruthy();
    expect(
      screen.getByText("Finalised at: 2099-07-07T08:00:00.000Z"),
    ).toBeTruthy();
    expect(screen.getByText("Finalised by: user-123")).toBeTruthy();
  });

  it("shows an error alert when no projection fields are entered", async () => {
    const user = userEvent.setup();
    const file = new File(
      ["Supplier,Invoice\nABC Pty Ltd,INV-001\n"],
      "payments.csv",
      {
        type: "text/csv",
      },
    );

    render(<PlatformDataUploadPage />);

    await user.type(screen.getByLabelText("Source name *"), "July payments");
    await user.type(screen.getByLabelText("Profile ID *"), "profile-123");
    await user.upload(screen.getByLabelText("CSV file"), file);
    await user.click(screen.getByRole("button", { name: "Create dataset" }));

    await screen.findByText("Dataset created");

    await user.click(
      screen.getByRole("button", { name: "Create working dataset" }),
    );

    await screen.findByText("Working dataset created");

    await user.click(
      screen.getByRole("button", { name: "Materialise working dataset" }),
    );

    expect(materialiseWorkingDataset).not.toHaveBeenCalled();
    expect(showAlert).toHaveBeenCalledWith(
      "Add at least one projection field before materialising working data.",
      "error",
    );
  });

  it("shows an error alert when required fields are missing", async () => {
    const user = userEvent.setup();

    render(<PlatformDataUploadPage />);

    await user.click(screen.getByRole("button", { name: "Create dataset" }));

    expect(createDataDataset).not.toHaveBeenCalled();
    expect(showAlert).toHaveBeenCalledWith(
      "Complete all dataset upload fields before continuing.",
      "error",
    );
  });

  it("shows an error alert when dataset creation fails", async () => {
    const user = userEvent.setup();
    const file = new File(["A,B,C\n1,2,3\n"], "payments.csv", {
      type: "text/csv",
    });
    createDataDataset.mockRejectedValue(new Error("Upload failed"));

    render(<PlatformDataUploadPage />);

    await user.type(screen.getByLabelText("Source name *"), "July payments");
    await user.type(screen.getByLabelText("Profile ID *"), "profile-123");
    await user.upload(screen.getByLabelText("CSV file"), file);
    await user.click(screen.getByRole("button", { name: "Create dataset" }));

    await waitFor(() => {
      expect(showAlert).toHaveBeenCalledWith("Upload failed", "error");
    });
  });

  it("shows an error alert when working dataset creation fails", async () => {
    const user = userEvent.setup();
    const file = new File(["A,B,C\n1,2,3\n"], "payments.csv", {
      type: "text/csv",
    });
    createWorkingDataset.mockRejectedValue(
      new Error("Working creation failed"),
    );

    render(<PlatformDataUploadPage />);

    await user.type(screen.getByLabelText("Source name *"), "July payments");
    await user.type(screen.getByLabelText("Profile ID *"), "profile-123");
    await user.upload(screen.getByLabelText("CSV file"), file);
    await user.click(screen.getByRole("button", { name: "Create dataset" }));

    await screen.findByText("Dataset created");

    await user.click(
      screen.getByRole("button", { name: "Create working dataset" }),
    );

    await waitFor(() => {
      expect(showAlert).toHaveBeenCalledWith(
        "Working creation failed",
        "error",
      );
    });
  });

  it("shows an error alert when materialisation fails", async () => {
    const user = userEvent.setup();
    const file = new File(
      ["Supplier,Invoice\nABC Pty Ltd,INV-001\n"],
      "payments.csv",
      {
        type: "text/csv",
      },
    );
    materialiseWorkingDataset.mockRejectedValue(
      new Error("Materialisation failed"),
    );

    render(<PlatformDataUploadPage />);

    await user.type(screen.getByLabelText("Source name *"), "July payments");
    await user.type(screen.getByLabelText("Profile ID *"), "profile-123");
    await user.upload(screen.getByLabelText("CSV file"), file);
    await user.click(screen.getByRole("button", { name: "Create dataset" }));

    await screen.findByText("Dataset created");

    await user.click(
      screen.getByRole("button", { name: "Create working dataset" }),
    );

    await screen.findByText("Working dataset created");

    await user.type(
      screen.getByLabelText("Target field for Supplier"),
      "supplier_name",
    );
    await user.type(
      screen.getByLabelText("Target field for Invoice"),
      "invoice_reference_number",
    );

    await user.click(
      screen.getByRole("button", { name: "Materialise working dataset" }),
    );

    await waitFor(() => {
      expect(showAlert).toHaveBeenCalledWith("Materialisation failed", "error");
    });
  });

  it("shows an error alert when finalisation fails", async () => {
    const user = userEvent.setup();
    const file = new File(
      ["Supplier,Invoice\nABC Pty Ltd,INV-001\n"],
      "payments.csv",
      {
        type: "text/csv",
      },
    );
    finaliseWorkingDataset.mockRejectedValue(new Error("Finalisation failed"));

    render(<PlatformDataUploadPage />);

    await user.type(screen.getByLabelText("Source name *"), "July payments");
    await user.type(screen.getByLabelText("Profile ID *"), "profile-123");
    await user.upload(screen.getByLabelText("CSV file"), file);
    await user.click(screen.getByRole("button", { name: "Create dataset" }));

    await screen.findByText("Dataset created");

    await user.click(
      screen.getByRole("button", { name: "Create working dataset" }),
    );

    await screen.findByText("Working dataset created");

    await user.type(
      screen.getByLabelText("Target field for Supplier"),
      "supplier_name",
    );
    await user.type(
      screen.getByLabelText("Target field for Invoice"),
      "invoice_reference_number",
    );

    await user.click(
      screen.getByRole("button", { name: "Materialise working dataset" }),
    );

    await screen.findByText("Working dataset materialised");

    await user.click(
      screen.getByRole("button", { name: "Finalise working dataset" }),
    );

    await waitFor(() => {
      expect(showAlert).toHaveBeenCalledWith("Finalisation failed", "error");
    });
  });
});
