import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { useAlert } from "context";
import { useStartXeroImport } from "../hooks/useStartXeroImport";
import { usePtrsV2Context } from "../context/PtrsV2Context";
import { connectXero } from "../services/ptrsXero.api";

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
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const { ptrsId: ctxPtrsId } = usePtrsV2Context();
  const effectivePtrsId = ptrsId || ctxPtrsId || null;

  const [forceRefresh, setForceRefresh] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const { startImport, isStarting, status, refetchStatus } = useStartXeroImport(
    effectivePtrsId,
    { poll: false }
  );

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

  async function handleConnect() {
    if (!effectivePtrsId) {
      showAlert(
        "No PTRS run found. Please create/resume a run first.",
        "error"
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
        })
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
        "error"
      );
      return;
    }

    try {
      setHasStarted(true);
      await startImport({ forceRefresh });
      showAlert("Xero import started.", "success");
      refetchStatus();

      // Take the user to the progress page so they can see updates.
      navigate(
        `/v2/ptrs/xero/progress?ptrsId=${encodeURIComponent(effectivePtrsId)}`
      );
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
            onClick={() =>
              navigate(
                effectivePtrsId
                  ? `/v2/ptrs/xero/select?ptrsId=${encodeURIComponent(
                      effectivePtrsId
                    )}`
                  : "/v2/ptrs/xero/select"
              )
            }
            disabled={!effectivePtrsId || disableAll}
          >
            Select organisation
          </Button>

          <Button
            variant="text"
            onClick={() =>
              navigate(
                effectivePtrsId
                  ? `/v2/ptrs/xero/progress?ptrsId=${encodeURIComponent(
                      effectivePtrsId
                    )}`
                  : "/v2/ptrs/xero/progress"
              )
            }
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
            disabled={disableAll}
          >
            Start Xero import
          </Button>

          <Button
            variant="outlined"
            onClick={() => refetchStatus()}
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
