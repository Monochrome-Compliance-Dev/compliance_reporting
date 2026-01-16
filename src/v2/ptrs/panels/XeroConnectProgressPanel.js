import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Box,
  Button,
  Container,
  LinearProgress,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { usePtrsV2Context } from "../context/PtrsV2Context";
import { useStartXeroImport } from "../hooks/useStartXeroImport";
import TableChartIcon from "@mui/icons-material/TableChart";
import { useUpdatePtrsMutation } from "../hooks/usePtrsQueries";

export default function XeroConnectProgressPanel() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showAlert } = useAlert();
  const { ptrsId } = usePtrsV2Context();

  const ptrsIdFromQuery = searchParams.get("ptrsId") || null;
  const effectivePtrsId = ptrsId || ptrsIdFromQuery || null;

  const updatePtrsStep = useUpdatePtrsMutation(effectivePtrsId);

  const goToTables = async () => {
    if (!effectivePtrsId) {
      showAlert("Create a PTRS first", "info");
      return;
    }

    try {
      await updatePtrsStep.mutateAsync({ currentStep: "tables" });
    } catch (err) {
      console.error(err);
      // Don't block navigation if the step update fails
      showAlert(
        "Failed to update PTRS step. Continuing to Tables & Joins.",
        "warning"
      );
    }

    navigate(`/v2/ptrs/tables?ptrsId=${encodeURIComponent(effectivePtrsId)}`);
  };

  const startedAtRef = useRef(null);
  const elapsedTimerRef = useRef(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [pollEnabled, setPollEnabled] = useState(true);

  const { status, refetchStatus, isStatusLoading, statusError } =
    useStartXeroImport(effectivePtrsId, {
      poll: pollEnabled,
      refetchIntervalMs: 2000,
    });

  const derivedStatus = useMemo(() => {
    const s = status?.status || status?.state || status?.stage || "";
    return typeof s === "string" ? s : "";
  }, [status]);

  const statusUpper = useMemo(
    () => derivedStatus.toUpperCase(),
    [derivedStatus]
  );

  const isComplete = useMemo(
    () => ["COMPLETE", "COMPLETED", "DONE", "SUCCESS"].includes(statusUpper),
    [statusUpper]
  );

  const isFailed = useMemo(
    () => ["FAILED", "ERROR"].includes(statusUpper),
    [statusUpper]
  );

  const isTerminal = useMemo(
    () => isComplete || isFailed,
    [isComplete, isFailed]
  );

  const progress = useMemo(() => {
    const p = status?.progress;
    if (!p) return null;

    // Prefer tenant progress (org-by-org) while running.
    const tenantTotal = Number(p.tenantCount || 0);
    const tenantCurrent = Number(p.currentTenantIndex || 0);

    if (tenantTotal > 0) {
      const total = tenantTotal;

      // If the run is complete/failed, treat progress as 100% even if the last
      // status payload doesn't advance currentTenantIndex.
      if (isTerminal) {
        return { current: total, total, pct: 100 };
      }

      const current = Math.min(Math.max(tenantCurrent, 0), total);
      const pct = Math.max(
        0,
        Math.min(100, Math.round((current / total) * 100))
      );
      return { current, total, pct };
    }

    // Fallback to extract counters if present.
    const extractTotal = Number(p.extractLimit || 0);
    const extractCurrent = Number(p.extractedCount || 0);

    if (extractTotal > 0) {
      const total = extractTotal;

      if (isTerminal) {
        return { current: total, total, pct: 100 };
      }

      const current = Math.min(Math.max(extractCurrent, 0), total);
      const pct = Math.max(
        0,
        Math.min(100, Math.round((current / total) * 100))
      );
      return { current, total, pct };
    }

    // No meaningful total available; use indeterminate.
    return { current: 0, total: 0, pct: 0 };
  }, [status, isTerminal]);

  useEffect(() => {
    if (!effectivePtrsId) return;

    // Once we hit a terminal status, stop the timer.
    if (isTerminal) {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      return;
    }

    if (!startedAtRef.current) startedAtRef.current = Date.now();

    // Ensure we only ever have one timer running.
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }

    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);

    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, [effectivePtrsId, isTerminal]);

  // If refetch throws, show a friendly error (do not auto-loop here)
  async function handleRefresh() {
    if (!effectivePtrsId) return;
    try {
      await refetchStatus();
    } catch (err) {
      showAlert(err?.message || "Failed to fetch status.", "error");
    }
  }

  return (
    <Container
      maxWidth="sm"
      sx={{
        marginTop: theme.spacing(6),
        textAlign: "center",
        position: "relative",
      }}
    >
      <Typography variant="h5" sx={{ mb: theme.spacing(2) }}>
        Xero status
      </Typography>

      {!effectivePtrsId && (
        <Typography variant="body2">
          No PTRS run found. Please create/resume a run first.
        </Typography>
      )}

      {effectivePtrsId && (
        <>
          <Typography variant="body1" sx={{ mb: theme.spacing(2) }}>
            {statusError?.message ||
              status?.message ||
              (derivedStatus
                ? `Status: ${derivedStatus}`
                : "Waiting for updates…")}
          </Typography>

          <Box mt={2}>
            <Typography variant="body2" sx={{ mb: theme.spacing(1) }}>
              Elapsed: {elapsedSeconds}s
            </Typography>

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                padding: 1,
                backgroundColor: "background.paper",
              }}
            >
              <LinearProgress
                variant={
                  isTerminal
                    ? "determinate"
                    : progress?.total
                      ? "determinate"
                      : "indeterminate"
                }
                value={isTerminal ? 100 : progress?.total ? progress.pct : 0}
                sx={{ height: 10, borderRadius: 1 }}
              />
            </Box>

            {progress?.total ? (
              <Typography variant="body2" sx={{ mt: theme.spacing(1) }}>
                {progress.current} of {progress.total} ({progress.pct}%)
              </Typography>
            ) : null}
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: theme.spacing(2),
              justifyContent: "center",
              mt: theme.spacing(3),
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              onClick={() =>
                navigate(
                  effectivePtrsId
                    ? `/v2/ptrs/xero/import?ptrsId=${encodeURIComponent(
                        effectivePtrsId
                      )}`
                    : "/v2/ptrs/xero/import"
                )
              }
            >
              Back
            </Button>

            <Button
              variant="outlined"
              onClick={handleRefresh}
              disabled={!effectivePtrsId || isStatusLoading}
            >
              {isStatusLoading ? "Refreshing…" : "Refresh status"}
            </Button>

            <Button
              variant="contained"
              startIcon={<TableChartIcon />}
              onClick={goToTables}
              disabled={!isComplete}
            >
              Go to Tables & Joins
            </Button>

            <Button
              variant="contained"
              onClick={() => navigate("/v2/ptrs")}
              disabled={!isTerminal}
            >
              Return to PTRS
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}
