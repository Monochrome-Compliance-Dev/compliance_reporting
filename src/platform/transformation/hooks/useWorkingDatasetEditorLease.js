import { useEffect } from "react";
import { acquireWorkingDatasetEditorLease } from "platform/data/dataApi";
import { formatDateTime } from "shared/utils/formatters";

function getActiveEditorLeaseExpiryTime(workingDataset) {
  if (!workingDataset?.activeEditor?.expiresAt) {
    return null;
  }

  const expiryTime = new Date(workingDataset.activeEditor.expiresAt).getTime();

  if (Number.isNaN(expiryTime)) {
    return null;
  }

  return expiryTime;
}

function hasActiveEditorLeaseForWorkingDataset(workingDataset) {
  const expiryTime = getActiveEditorLeaseExpiryTime(workingDataset);

  return Boolean(
    workingDataset?.activeEditor?.sessionId &&
    expiryTime &&
    expiryTime > Date.now(),
  );
}

function hasExpiredEditorLease(workingDataset) {
  const expiryTime = getActiveEditorLeaseExpiryTime(workingDataset);

  return Boolean(
    workingDataset?.activeEditor?.sessionId &&
    expiryTime &&
    expiryTime <= Date.now(),
  );
}

function getEditorLeaseLabel(workingDataset) {
  if (!workingDataset?.activeEditor) {
    return "No active editor lease.";
  }

  if (hasExpiredEditorLease(workingDataset)) {
    return `Editor lease expired ${formatDateTime(
      workingDataset.activeEditor.expiresAt,
    )}.`;
  }

  return `Active editor lease expires ${formatDateTime(
    workingDataset.activeEditor.expiresAt,
  )}.`;
}

function createEditorSessionId() {
  return crypto.randomUUID();
}

export default function useWorkingDatasetEditorLease({
  profileId,
  showAlert,
  setWorkingDataset,
  workingDataset,
  workingDatasetId,
}) {
  const hasActiveEditorLease =
    hasActiveEditorLeaseForWorkingDataset(workingDataset);
  const editorLeaseLabel = getEditorLeaseLabel(workingDataset);

  useEffect(() => {
    const expiryTime = getActiveEditorLeaseExpiryTime(workingDataset);

    if (!workingDataset?.activeEditor?.sessionId || !expiryTime) {
      return undefined;
    }

    const millisecondsUntilExpiry = expiryTime - Date.now();

    if (millisecondsUntilExpiry <= 0) {
      setWorkingDataset((currentWorkingDataset) => {
        if (!currentWorkingDataset?.activeEditor) {
          return currentWorkingDataset;
        }

        return {
          ...currentWorkingDataset,
          activeEditor: null,
        };
      });
      return undefined;
    }

    const timer = setTimeout(() => {
      setWorkingDataset((currentWorkingDataset) => {
        if (!currentWorkingDataset?.activeEditor) {
          return currentWorkingDataset;
        }

        return {
          ...currentWorkingDataset,
          activeEditor: null,
        };
      });
      showAlert("Your editor lease has expired.", "info");
    }, millisecondsUntilExpiry);

    return () => clearTimeout(timer);
  }, [
    showAlert,
    setWorkingDataset,
    workingDataset?.activeEditor?.expiresAt,
    workingDataset?.activeEditor?.sessionId,
  ]);

  async function handleAcquireEditorLease() {
    if (!profileId) {
      showAlert("Profile ID is required to acquire an editor lease.", "error");
      return;
    }

    try {
      const editorSessionId = createEditorSessionId();
      const result = await acquireWorkingDatasetEditorLease({
        workingDatasetId,
        profileId,
        editorSessionId,
      });

      setWorkingDataset(result.workingDataset);
      showAlert("Editor lease acquired successfully.", "success");
    } catch (error) {
      showAlert(error.message || "Editor lease acquisition failed.", "error");
    }
  }

  return {
    editorLeaseLabel,
    hasActiveEditorLease,
    handleAcquireEditorLease,
  };
}
