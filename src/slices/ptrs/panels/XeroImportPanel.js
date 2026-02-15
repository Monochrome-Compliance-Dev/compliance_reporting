import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Typography,
  Alert,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { usePtrsContext } from "../context/PtrsContext";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";
import { useStartXeroImport } from "../hooks/useStartXeroImport";
import {
  connectXero,
  downloadXeroImportExceptions,
  getXeroImportExceptionsSummary,
  getXeroReadiness,
} from "../services/ptrsXero.api";
import { LoadingSpinner } from "shared/ui";

/**
 * Step 1 alternative to CSV upload: Import payment records from Xero.
 *
 * This must end by populating tbl_ptrs_import_raw for the given ptrsId so the existing
 * "Link tables / custom fields" step (immediately after upload/import) can remain unchanged.
 *
 * Flow:
 * 1) Connect to Xero (OAuth) -> selection (if needed) -> progress
 * 2) Start Import (uses cached tenant/token)
 */
export default function XeroImportPanel({ ptrsId, onImported }) {
  const theme = useTheme();
  const { goTo } = usePtrsNavigation();
  const { showAlert } = useAlert();

  const { ptrsId: ctxPtrsId } = usePtrsContext();
  const effectivePtrsId = ptrsId || ctxPtrsId || null;

  const [forceRefresh, setForceRefresh] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [exceptionsCount, setExceptionsCount] = useState(null);

  const { startImport, isStarting, status, refetchStatus } = useStartXeroImport(
    effectivePtrsId,
    { poll: false },
  );

  const [readiness, setReadiness] = useState(null);
  const [isReadinessLoading, setIsReadinessLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!effectivePtrsId) {
        setReadiness(null);
        return;
      }

      setIsReadinessLoading(true);
      try {
        const d = await getXeroReadiness(effectivePtrsId);
        if (!cancelled) setReadiness(d);
      } catch (err) {
        if (!cancelled)
          setReadiness({
            connectionValid: false,
            selectedTenantIds: [],
            selectedValid: null,
            missingSelectedTenantIds: [],
            connectionsCount: 0,
            hasAnyToken: false,
            error: {
              message: err?.message || "Failed to check Xero readiness.",
            },
          });
      } finally {
        if (!cancelled) setIsReadinessLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [effectivePtrsId]);

  const derivedStatus = useMemo(() => {
    const s = status?.status || status?.state || status?.stage || "";
    return typeof s === "string" ? s : "";
  }, [status]);

  const isRunning = useMemo(() => {
    const s = derivedStatus.toUpperCase();
    return ["RUNNING", "IN_PROGRESS", "PROCESSING", "STARTED"].includes(s);
  }, [derivedStatus]);

  const isComplete = useMemo(() => {
    const s = derivedStatus.toUpperCase();
    return ["COMPLETE", "COMPLETED", "DONE", "SUCCESS"].includes(s);
  }, [derivedStatus]);

  const isFailed = useMemo(() => {
    const s = derivedStatus.toUpperCase();
    return ["FAILED", "ERROR"].includes(s);
  }, [derivedStatus]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!effectivePtrsId) {
        setExceptionsCount(null);
        return;
      }

      try {
        const { count } = await getXeroImportExceptionsSummary(effectivePtrsId);
        if (!cancelled) setExceptionsCount(count);
      } catch (_) {
        // If auth/session is temporarily unavailable, don't brick the UI.
        if (!cancelled) setExceptionsCount(null);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [effectivePtrsId, derivedStatus]);

  const isConnectionValid = readiness?.connectionValid === true;
  const requiresSelection =
    Array.isArray(readiness?.selectedTenantIds) &&
    readiness.selectedTenantIds.length > 0;
  const isSelectionValid =
    readiness?.selectedValid === true || readiness?.selectedValid === null;
  const canStartImport =
    Boolean(effectivePtrsId) && isConnectionValid && isSelectionValid;

  async function handleConnect() {
    if (!effectivePtrsId) {
      showAlert(
        "No PTRS run found. Please create/resume a run first.",
        "error",
      );
      return;
    }

    setIsConnecting(true);
    showAlert("Connecting to Xero…", "info");

    try {
      // Keep callback data minimal; BE should infer customer/user from auth.
      localStorage.setItem(
        "ptrsXeroCallback",
        JSON.stringify({
          ptrsId: effectivePtrsId,
          createdAt: Date.now(),
        }),
      );

      const { authUrl } = await connectXero(effectivePtrsId);
      window.location.href = authUrl;
    } catch (err) {
      showAlert(err?.message || "Failed to connect to Xero.", "error");
      setIsConnecting(false);
    }
  }

  async function handleStart() {
    if (!effectivePtrsId) {
      showAlert(
        "No PTRS run found. Please create/resume a run first.",
        "error",
      );
      return;
    }

    if (!canStartImport) {
      if (!isConnectionValid) {
        showAlert(
          "Xero connection is not valid. Please reconnect first.",
          "warning",
        );
        return;
      }
      if (!isSelectionValid) {
        showAlert(
          "Selected organisations are not valid for the current Xero connection. Please re-select organisations.",
          "warning",
        );
        return;
      }
    }

    try {
      setHasStarted(true);
      await startImport({ forceRefresh });
      showAlert("Xero import started.", "success");
      refetchStatus();

      // Take the user to the progress page so they can see updates.
      goTo(`xero/progress?ptrsId=${encodeURIComponent(effectivePtrsId)}`, {
        includeId: false,
      });
    } catch (err) {
      setHasStarted(false);

      const msg = err?.message || "Failed to start Xero import.";
      showAlert(msg, "error");

      // If tenant isn't linked, nudge user to connect.
      if (/No active Xero tenant/i.test(msg)) {
        showAlert("Connect to Xero first, then try import again.", "info");
      }
    }
  }

  async function handleContinue() {
    if (typeof onImported === "function") onImported();
  }

  async function handleDownloadExceptions() {
    if (!effectivePtrsId) {
      showAlert("No PTRS run found.", "error");
      return;
    }

    try {
      showAlert("Preparing import exceptions…", "info");

      const csvText = await downloadXeroImportExceptions(effectivePtrsId);
      if (!csvText || typeof csvText !== "string") {
        throw new Error("Export returned no data");
      }

      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");

      a.download = `ptrs_import_exceptions_${effectivePtrsId}_${yyyy}-${mm}-${dd}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showAlert("Import exceptions downloaded.", "success");
    } catch (err) {
      showAlert(
        err?.message || "Failed to download import exceptions.",
        "error",
      );
    }
  }

  // Only disable controls while we are actively connecting/starting/running an import.
  const disableAll = isConnecting || isStarting || isRunning;

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(2) }}
    >
      <Paper sx={{ p: theme.spacing(2) }}>
        <Typography variant="h6" sx={{ mb: theme.spacing(1) }}>
          Import from Xero
        </Typography>

        <Typography variant="body2" sx={{ mb: theme.spacing(2) }}>
          Connect to Xero once per customer, then import payments to build your
          main dataset. The next step (link tables and custom fields) stays
          unchanged.
        </Typography>

        {isReadinessLoading ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: theme.spacing(1),
              mb: theme.spacing(2),
            }}
          >
            <LoadingSpinner size={20} />
            <Typography variant="body2">Checking Xero connection…</Typography>
          </Box>
        ) : readiness ? (
          <Alert
            severity={
              isConnectionValid && isSelectionValid ? "success" : "warning"
            }
            sx={{
              mb: theme.spacing(2),
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: theme.spacing(1),
            }}
          >
            <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
              {!isConnectionValid
                ? "Xero connection isn't valid. Please reconnect."
                : !isSelectionValid
                  ? "Your previously selected organisations no longer match your Xero connection. Please re-select organisations."
                  : "Xero connection looks good."}
              {!isConnectionValid || !isSelectionValid ? (
                readiness?.error?.message ? (
                  <Typography
                    component="span"
                    sx={{ ml: 1, opacity: 0.8 }}
                    title={readiness.error.message}
                  >
                    (
                    {readiness.error.message.length > 140
                      ? readiness.error.message.slice(0, 137) + "..."
                      : readiness.error.message}
                    )
                  </Typography>
                ) : null
              ) : null}
            </Box>
            <Box
              sx={{ display: "flex", gap: theme.spacing(1), flexWrap: "wrap" }}
            >
              <Chip
                label={
                  isConnectionValid ? "Connection: OK" : "Connection: Reconnect"
                }
                size="small"
                color={isConnectionValid ? "success" : "warning"}
              />
              {requiresSelection && (
                <>
                  <Chip
                    label={`Orgs: ${readiness.selectedTenantIds.length}`}
                    size="small"
                  />
                  {readiness.missingSelectedTenantIds.length > 0 && (
                    <Chip
                      label={`Missing: ${readiness.missingSelectedTenantIds.length}`}
                      size="small"
                      color="warning"
                    />
                  )}
                </>
              )}
            </Box>
          </Alert>
        ) : null}

        <Box sx={{ display: "flex", gap: theme.spacing(2), flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            onClick={handleConnect}
            disabled={disableAll}
          >
            {isConnecting ? "Connecting…" : "Connect to Xero"}
          </Button>

          <Button
            variant="text"
            onClick={() => {
              if (!effectivePtrsId) return;
              goTo(
                `xero/select?ptrsId=${encodeURIComponent(effectivePtrsId)}`,
                {
                  includeId: false,
                },
              );
            }}
            disabled={!effectivePtrsId || disableAll}
          >
            Select organisation
          </Button>

          <Button
            variant="text"
            onClick={() => {
              if (!effectivePtrsId) return;
              goTo(
                `xero/progress?ptrsId=${encodeURIComponent(effectivePtrsId)}`,
                {
                  includeId: false,
                },
              );
            }}
            disabled={!effectivePtrsId || disableAll}
          >
            View progress
          </Button>
        </Box>

        <FormControlLabel
          sx={{ mt: theme.spacing(2) }}
          control={
            <Checkbox
              checked={forceRefresh}
              onChange={(e) => setForceRefresh(e.target.checked)}
              disabled={disableAll}
            />
          }
          label="Force refresh from Xero (ignore cached records)"
        />

        <Box
          sx={{
            display: "flex",
            gap: theme.spacing(2),
            alignItems: "center",
            mt: theme.spacing(1),
          }}
        >
          <Button
            variant="contained"
            onClick={handleStart}
            disabled={disableAll || !canStartImport}
          >
            Start Xero import
          </Button>

          <Button
            variant="outlined"
            onClick={async () => {
              await refetchStatus();
              if (effectivePtrsId) {
                setIsReadinessLoading(true);
                try {
                  const d = await getXeroReadiness(effectivePtrsId);
                  setReadiness(d);
                } catch (err) {
                  setReadiness({
                    connectionValid: false,
                    selectedTenantIds: [],
                    selectedValid: null,
                    missingSelectedTenantIds: [],
                    connectionsCount: 0,
                    hasAnyToken: false,
                    error: {
                      message:
                        err?.message || "Failed to check Xero readiness.",
                    },
                  });
                } finally {
                  setIsReadinessLoading(false);
                }
              }
            }}
            disabled={!effectivePtrsId || disableAll}
          >
            Refresh status
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: theme.spacing(2) }}>
        <Typography variant="subtitle1" sx={{ mb: theme.spacing(1) }}>
          Import status
        </Typography>

        {(isConnecting || isStarting || isRunning) && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: theme.spacing(2),
            }}
          >
            <LoadingSpinner />
            <Typography variant="body2">
              Working{derivedStatus ? ` (${derivedStatus})` : ""}…
            </Typography>
          </Box>
        )}

        {!isConnecting && !isStarting && !isRunning && (
          <Typography variant="body2">
            {derivedStatus
              ? `Status: ${derivedStatus}`
              : "No import started yet."}
          </Typography>
        )}

        {status?.message && (
          <Typography variant="body2" sx={{ mt: theme.spacing(1) }}>
            {status.message}
          </Typography>
        )}

        <Box
          sx={{ display: "flex", gap: theme.spacing(2), mt: theme.spacing(2) }}
        >
          <Button
            variant="outlined"
            onClick={handleDownloadExceptions}
            disabled={!effectivePtrsId || exceptionsCount === 0}
          >
            Download import exceptions
          </Button>

          <Button
            variant="contained"
            onClick={handleContinue}
            disabled={!isComplete || disableAll}
          >
            Continue to linking step
          </Button>

          {isFailed && (
            <Button
              variant="outlined"
              onClick={handleStart}
              disabled={disableAll}
            >
              Retry import
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
