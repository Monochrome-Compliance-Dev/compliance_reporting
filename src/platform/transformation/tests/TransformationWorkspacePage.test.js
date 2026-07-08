import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransformationWorkspacePage from "platform/transformation/TransformationWorkspacePage";
import { listWorkingDatasets } from "platform/data/dataApi";

const mockShowAlert = jest.fn();

jest.mock("context", () => ({
  useAlert: () => ({
    showAlert: mockShowAlert,
  }),
}));

jest.mock("platform/data/dataApi", () => ({
  listWorkingDatasets: jest.fn(),
}));

function createWorkingDataset(overrides = {}) {
  return {
    workingDatasetId: "working-dataset-123",
    sourceDatasetId: "source-dataset-123",
    customerId: "customer-123",
    profileId: "profile-123",
    workingName: "July payments working data",
    datasetType: "payment",
    status: "in_progress",
    currentStepNumber: 1,
    storagePath: null,
    storedFileName: null,
    mimeType: null,
    fileSize: null,
    headers: ["Supplier", "Invoice"],
    headersCount: 2,
    rowsCount: 12,
    lineage: {
      sourceDatasetId: "source-dataset-123",
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

describe("TransformationWorkspacePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listWorkingDatasets.mockResolvedValue({
      success: true,
      workingDatasets: [createWorkingDataset()],
    });
  });

  it("renders the Transformation Workspace hub shell", () => {
    render(<TransformationWorkspacePage />);

    expect(
      screen.getByRole("heading", { name: "Transformation Workspace" }),
    ).toBeTruthy();
    expect(screen.getByRole("textbox", { name: /profile id/i })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Load working datasets" }),
    ).toBeTruthy();
  });

  it("loads and displays working datasets for the supplied profile", async () => {
    const user = userEvent.setup();
    render(<TransformationWorkspacePage />);

    await user.type(
      screen.getByRole("textbox", { name: /profile id/i }),
      "profile-123",
    );
    await user.click(
      screen.getByRole("button", { name: "Load working datasets" }),
    );

    await waitFor(() => {
      expect(listWorkingDatasets).toHaveBeenCalledWith({
        profileId: "profile-123",
      });
    });

    expect(
      await screen.findByRole("heading", { name: "Working Dataset Hub" }),
    ).toBeTruthy();
    expect(screen.getByText("July payments working data")).toBeTruthy();
    expect(
      screen.getByText("Working Dataset ID: working-dataset-123"),
    ).toBeTruthy();
    expect(screen.getByText("Rows: 12")).toBeTruthy();
    expect(screen.getByText("Headers: 2")).toBeTruthy();
    expect(mockShowAlert).toHaveBeenCalledWith(
      "Working datasets loaded successfully.",
      "success",
    );
  });

  it("trims the supplied profileId before loading working datasets", async () => {
    const user = userEvent.setup();
    render(<TransformationWorkspacePage />);

    await user.type(
      screen.getByRole("textbox", { name: /profile id/i }),
      "  profile-123  ",
    );
    await user.click(
      screen.getByRole("button", { name: "Load working datasets" }),
    );

    await waitFor(() => {
      expect(listWorkingDatasets).toHaveBeenCalledWith({
        profileId: "profile-123",
      });
    });
  });

  it("shows an empty state when no working datasets exist", async () => {
    listWorkingDatasets.mockResolvedValue({
      success: true,
      workingDatasets: [],
    });

    const user = userEvent.setup();
    render(<TransformationWorkspacePage />);

    await user.type(
      screen.getByRole("textbox", { name: /profile id/i }),
      "profile-123",
    );
    await user.click(
      screen.getByRole("button", { name: "Load working datasets" }),
    );

    expect(
      await screen.findByRole("heading", { name: "No working datasets found" }),
    ).toBeTruthy();
  });

  it("shows final working datasets as read-only", async () => {
    listWorkingDatasets.mockResolvedValue({
      success: true,
      workingDatasets: [
        createWorkingDataset({
          status: "final",
          finalisedAt: "2026-07-06T09:00:00.000Z",
          finalisedBy: "user-123",
        }),
      ],
    });

    const user = userEvent.setup();
    render(<TransformationWorkspacePage />);

    await user.type(
      screen.getByRole("textbox", { name: /profile id/i }),
      "profile-123",
    );
    await user.click(
      screen.getByRole("button", { name: "Load working datasets" }),
    );

    expect(await screen.findByText("Final")).toBeTruthy();
    expect(
      screen.getByText("This working dataset is final and read-only."),
    ).toBeTruthy();
  });

  it("shows an alert when profileId is missing", async () => {
    const user = userEvent.setup();
    render(<TransformationWorkspacePage />);

    await user.click(
      screen.getByRole("button", { name: "Load working datasets" }),
    );

    expect(mockShowAlert).toHaveBeenCalledWith(
      "Enter a profile ID before loading working datasets.",
      "error",
    );
    expect(listWorkingDatasets).not.toHaveBeenCalled();
  });

  it("shows an alert when working dataset listing fails", async () => {
    listWorkingDatasets.mockRejectedValue(new Error("Backend unavailable"));

    const user = userEvent.setup();
    render(<TransformationWorkspacePage />);

    await user.type(
      screen.getByRole("textbox", { name: /profile id/i }),
      "profile-123",
    );
    await user.click(
      screen.getByRole("button", { name: "Load working datasets" }),
    );

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith(
        "Backend unavailable",
        "error",
      );
    });
  });
});
