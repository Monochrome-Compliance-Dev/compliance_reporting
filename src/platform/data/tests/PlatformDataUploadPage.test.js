import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAlert } from "context";
import PlatformDataUploadPage from "platform/data/PlatformDataUploadPage";
import { createDataDataset, createWorkingDataset } from "platform/data/dataApi";

jest.mock("platform/data/dataApi", () => ({
  createDataDataset: jest.fn(),
  createWorkingDataset: jest.fn(),
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
    rowsCount: 2,
    headersCount: 3,
    ...overrides,
  };
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

    expect(showAlert).toHaveBeenCalledWith(
      "Working dataset created successfully.",
      "success",
    );
    expect(screen.getByText("Working dataset created")).toBeTruthy();
    expect(
      screen.getByText("Working Dataset ID: working-dataset-123"),
    ).toBeTruthy();
    expect(screen.getByText("Source Dataset ID: dataset123")).toBeTruthy();
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
});
