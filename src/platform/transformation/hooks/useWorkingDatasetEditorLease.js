import { useEffect, useRef, useState } from "react";
import {
  acquireWorkingDatasetEditorLease,
  renewWorkingDatasetEditorLease,
} from "platform/data/dataApi";
import { formatDateTime } from "shared/utils/formatters";

const EDITOR_LEASE_ACTIVITY_EVENTS = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
];
const EDITOR_LEASE_ACTIVITY_WINDOW_MS = 10 * 60 * 1000;
const EDITOR_LEASE_RENEWAL_INTERVAL_MS = 5 * 60 * 1000;
const EDITOR_LEASE_WARNING_BEFORE_EXPIRY_MS = 2 * 60 * 1000;

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
  const [isEditorLeaseExpiryWarningOpen, setIsEditorLeaseExpiryWarningOpen] =
    useState(false);

  const lastWorkspaceActivityAtRef = useRef(Date.now());
  const isRenewingEditorLeaseRef = useRef(false);

  useEffect(() => {
    if (!hasActiveEditorLease) {
      return undefined;
    }

    function recordWorkspaceActivity() {
      lastWorkspaceActivityAtRef.current = Date.now();
    }

    EDITOR_LEASE_ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, recordWorkspaceActivity);
    });

    return () => {
      EDITOR_LEASE_ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, recordWorkspaceActivity);
      });
    };
  }, [hasActiveEditorLease]);

  useEffect(() => {
    if (!hasActiveEditorLease || !profileId) {
      return undefined;
    }

    async function renewEditorLease() {
      const expiryTime = getActiveEditorLeaseExpiryTime(workingDataset);
      const editorSessionId = workingDataset?.activeEditor?.sessionId;

      if (!editorSessionId || !expiryTime || expiryTime <= Date.now()) {
        return;
      }

      const hasRecentWorkspaceActivity =
        Date.now() - lastWorkspaceActivityAtRef.current <=
        EDITOR_LEASE_ACTIVITY_WINDOW_MS;

      if (!hasRecentWorkspaceActivity || isRenewingEditorLeaseRef.current) {
        return;
      }

      try {
        isRenewingEditorLeaseRef.current = true;
        const result = await renewWorkingDatasetEditorLease({
          workingDatasetId,
          profileId,
          editorSessionId,
        });

        setWorkingDataset(result.workingDataset);
        setIsEditorLeaseExpiryWarningOpen(false);
      } catch (error) {
        showAlert(
          error.message ||
            "Editor lease renewal failed. Your editor lease may expire soon.",
          "error",
        );
      } finally {
        isRenewingEditorLeaseRef.current = false;
      }
    }

    const interval = setInterval(
      renewEditorLease,
      EDITOR_LEASE_RENEWAL_INTERVAL_MS,
    );

    return () => clearInterval(interval);
  }, [
    hasActiveEditorLease,
    profileId,
    setWorkingDataset,
    showAlert,
    workingDataset?.activeEditor?.expiresAt,
    workingDataset?.activeEditor?.sessionId,
    workingDatasetId,
    workingDataset,
  ]);

  useEffect(() => {
    const expiryTime = getActiveEditorLeaseExpiryTime(workingDataset);

    if (!workingDataset?.activeEditor?.sessionId || !expiryTime) {
      return undefined;
    }

    if (expiryTime <= Date.now()) {
      return undefined;
    }

    const millisecondsUntilWarning =
      expiryTime - Date.now() - EDITOR_LEASE_WARNING_BEFORE_EXPIRY_MS;

    if (millisecondsUntilWarning <= 0) {
      setIsEditorLeaseExpiryWarningOpen(true);
      return undefined;
    }

    const timer = setTimeout(() => {
      setIsEditorLeaseExpiryWarningOpen(true);
    }, millisecondsUntilWarning);

    return () => clearTimeout(timer);
  }, [
    workingDataset?.activeEditor?.expiresAt,
    workingDataset?.activeEditor?.sessionId,
    workingDataset,
  ]);

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
    workingDataset,
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

  function handleCloseEditorLeaseExpiryWarning() {
    setIsEditorLeaseExpiryWarningOpen(false);
  }

  async function handleContinueEditing() {
    if (!hasActiveEditorLease || !profileId) {
      return;
    }

    const expiryTime = getActiveEditorLeaseExpiryTime(workingDataset);
    const editorSessionId = workingDataset?.activeEditor?.sessionId;

    if (!editorSessionId || !expiryTime || expiryTime <= Date.now()) {
      return;
    }

    try {
      isRenewingEditorLeaseRef.current = true;
      const result = await renewWorkingDatasetEditorLease({
        workingDatasetId,
        profileId,
        editorSessionId,
      });

      setWorkingDataset(result.workingDataset);
      setIsEditorLeaseExpiryWarningOpen(false);
      showAlert("Editor lease renewed successfully.", "success");
    } catch (error) {
      showAlert(
        error.message ||
          "Editor lease renewal failed. Your editor lease may expire soon.",
        "error",
      );
    } finally {
      isRenewingEditorLeaseRef.current = false;
    }
  }

  return {
    editorLeaseLabel,
    handleAcquireEditorLease,
    handleCloseEditorLeaseExpiryWarning,
    handleContinueEditing,
    hasActiveEditorLease,
    isEditorLeaseExpiryWarningOpen,
  };
}
