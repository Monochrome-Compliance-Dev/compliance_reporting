import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransformationWorkingDatasetPage from "platform/transformation/TransformationWorkingDatasetPage";
import {
  acquireWorkingDatasetEditorLease,
  getWorkingDataset,
  listWorkingDatasetActivity,
} from "platform/data/dataApi";

const mockShowAlert = jest.fn();
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock("context", () => ({
  useAlert: () => ({
    showAlert: mockShowAlert,
  }),
}));

jest.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
  useSearchParams: () => mockUseSearchParams(),
}));

jest.mock("platform/data/dataApi", () => ({
  acquireWorkingDatasetEditorLease: jest.fn(),
  getWorkingDataset: jest.fn(),
  listWorkingDatasetActivity: jest.fn(),
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
    headersCount: 2,
    rowsCount: 12,
    activeEditor: null,
    finalisedAt: null,
    finalisedBy: null,
    updatedAt: "2026-07-06T08:30:00.000Z",
    ...overrides,
  };
}

function createActivity(overrides = {}) {
  return {
    activityId: "activity-123",
    workingDatasetId: "working-dataset-123",
    activityType: "working_dataset_created",
    message: "Working dataset created from immutable source dataset.",
    createdAt: "2026-07-06T08:05:00.000Z",
    ...overrides,
  };
}

describe("TransformationWorkingDatasetPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({
      workingDatasetId: "working-dataset-123",
    });
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams("profileId=profile-123"),
    ]);
    getWorkingDataset.mockResolvedValue({
      success: true,
      workingDataset: createWorkingDataset(),
    });
    listWorkingDatasetActivity.mockResolvedValue({
      success: true,
      activities: [createActivity()],
    });
    acquireWorkingDatasetEditorLease.mockResolvedValue({
      success: true,
      workingDataset: createWorkingDataset({
        activeEditor: {
          sessionId: "editor-session-123",
          expiresAt: "2026-07-09T03:30:00.000Z",
        },
      }),
      editorSession: {
        sessionId: "editor-session-123",
        expiresAt: "2026-07-09T03:30:00.000Z",
      },
    });
  });

  it("loads and displays working dataset detail and activity history", async () => {
    render(<TransformationWorkingDatasetPage />);

    const expectedCommand = {
      workingDatasetId: "working-dataset-123",
      profileId: "profile-123",
    };

    await waitFor(() => {
      expect(getWorkingDataset).toHaveBeenCalledWith(expectedCommand);
    });
    expect(listWorkingDatasetActivity).toHaveBeenCalledWith(expectedCommand);

    expect(
      await screen.findByRole("heading", { name: "Working Dataset Detail" }),
    ).toBeTruthy();
    expect(screen.getByText("July payments working data")).toBeTruthy();
    expect(
      screen.getByText("Working Dataset ID: working-dataset-123"),
    ).toBeTruthy();
    expect(screen.getByText("Activity History")).toBeTruthy();
    expect(screen.getByText("working_dataset_created")).toBeTruthy();
    expect(
      screen.getByText(
        "Working dataset created from immutable source dataset.",
      ),
    ).toBeTruthy();
  });

  it("shows editor lease state for non-final working datasets", async () => {
    render(<TransformationWorkingDatasetPage />);

    expect(await screen.findByText("No active editor lease.")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Acquire edit lease" }),
    ).toBeTruthy();
  });

  it("acquires an editor lease and updates the displayed lease state", async () => {
    const user = userEvent.setup();
    render(<TransformationWorkingDatasetPage />);

    await screen.findByText("No active editor lease.");

    await user.click(
      screen.getByRole("button", { name: "Acquire edit lease" }),
    );

    await waitFor(() => {
      expect(acquireWorkingDatasetEditorLease).toHaveBeenCalledWith({
        workingDatasetId: "working-dataset-123",
        profileId: "profile-123",
      });
    });

    expect(
      await screen.findByText(
        "Active editor lease expires at 2026-07-09T03:30:00.000Z.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Editor lease active" }).disabled,
    ).toBe(true);
    expect(mockShowAlert).toHaveBeenCalledWith(
      "Editor lease acquired successfully.",
      "success",
    );
  });

  it("shows final working datasets as read-only", async () => {
    getWorkingDataset.mockResolvedValue({
      success: true,
      workingDataset: createWorkingDataset({
        status: "final",
        finalisedAt: "2026-07-06T09:00:00.000Z",
        finalisedBy: "user-123",
      }),
    });

    render(<TransformationWorkingDatasetPage />);

    expect(await screen.findByText("Final")).toBeTruthy();
    expect(
      screen.getByText("This working dataset is final and read-only."),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Acquire edit lease" }),
    ).toBeNull();
  });

  it("shows an empty activity state when no activity exists", async () => {
    listWorkingDatasetActivity.mockResolvedValue({
      success: true,
      activities: [],
    });

    render(<TransformationWorkingDatasetPage />);

    expect(
      await screen.findByText(
        "No activity history found for this working dataset.",
      ),
    ).toBeTruthy();
  });

  it("shows an alert and does not load when profileId is missing", async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams("")]);

    render(<TransformationWorkingDatasetPage />);

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith(
        "Profile ID is required to open a working dataset.",
        "error",
      );
    });
    expect(getWorkingDataset).not.toHaveBeenCalled();
    expect(listWorkingDatasetActivity).not.toHaveBeenCalled();
  });

  it("shows an alert when working dataset detail loading fails", async () => {
    getWorkingDataset.mockRejectedValue(new Error("Detail failed"));

    render(<TransformationWorkingDatasetPage />);

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith("Detail failed", "error");
    });
  });

  it("shows an alert when editor lease acquisition fails", async () => {
    acquireWorkingDatasetEditorLease.mockRejectedValue(
      new Error("Lease failed"),
    );

    const user = userEvent.setup();
    render(<TransformationWorkingDatasetPage />);

    await screen.findByText("No active editor lease.");

    await user.click(
      screen.getByRole("button", { name: "Acquire edit lease" }),
    );

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith("Lease failed", "error");
    });
  });

  it("navigates back to the working dataset hub", async () => {
    const user = userEvent.setup();
    render(<TransformationWorkingDatasetPage />);

    await user.click(
      screen.getByRole("button", { name: "Back to working dataset hub" }),
    );

    expect(mockNavigate).toHaveBeenCalledWith("..");
  });
});
