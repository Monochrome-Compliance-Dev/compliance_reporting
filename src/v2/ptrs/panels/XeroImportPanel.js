import { useMemo, useState } from "react";
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

/**
 * Step 1 alternative to CSV upload: Import payment records from Xero.
 *
 * This must end by populating tbl_ptrs_import_raw for the given ptrsId so the existing
 * "Link tables / custom fields" step (immediately after upload/import) can remain unchanged.
 */
export default function XeroImportPanel({ ptrsId, onImported }) {
  const theme = useTheme();
  const { showAlert } = useAlert();

  const [forceRefresh, setForceRefresh] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const { startImport, isStarting, status, isStatusLoading, refetchStatus } =
    useStartXeroImport(ptrsId, {
      poll: hasStarted,
      refetchIntervalMs: 2000,
    });

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

  async function handleStart() {
    if (!ptrsId) {
      showAlert(
        "No PTRS run found (ptrsId missing). Please create/resume a run first.",
        "error"
      );
      return;
    }

    try {
      setHasStarted(true);
      await startImport({ forceRefresh });
      showAlert("Xero import started.", "success");
      refetchStatus();
    } catch (err) {
      setHasStarted(false);
      showAlert(err?.message || "Failed to start Xero import.", "error");
    }
  }

  async function handleContinue() {
    if (typeof onImported === "function") onImported();
  }

  const disableAll = isStarting || isRunning || isStatusLoading;

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(2) }}
    >
      <Paper sx={{ p: theme.spacing(2) }}>
        <Typography variant="h6" sx={{ mb: theme.spacing(1) }}>
          Import from Xero
        </Typography>

        <Typography variant="body2" sx={{ mb: theme.spacing(2) }}>
          This will pull payment records from Xero and build your main dataset
          so the next step (link tables and custom fields) works the same as a
          CSV upload.
        </Typography>

        <FormControlLabel
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
            disabled={disableAll || !ptrsId}
          >
            Start Xero import
          </Button>

          <Button
            variant="outlined"
            onClick={() => refetchStatus()}
            disabled={!ptrsId || disableAll}
          >
            Refresh status
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: theme.spacing(2) }}>
        <Typography variant="subtitle1" sx={{ mb: theme.spacing(1) }}>
          Import status
        </Typography>

        {(isStarting || isRunning) && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: theme.spacing(2),
            }}
          >
            <LoadingSpinner />
            <Typography variant="body2">
              Import in progress{derivedStatus ? ` (${derivedStatus})` : ""}…
            </Typography>
          </Box>
        )}

        {!isStarting && !isRunning && (
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
