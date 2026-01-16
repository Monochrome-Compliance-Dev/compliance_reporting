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

export default function XeroConnectProgressPanel() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showAlert } = useAlert();
  const { ptrsId } = usePtrsV2Context();

  const ptrsIdFromQuery = searchParams.get("ptrsId") || null;
  const effectivePtrsId = ptrsId || ptrsIdFromQuery || null;

  const startedAtRef = useRef(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Passive mode: no polling here. We only read cached status + allow manual refresh.
  const { status, refetchStatus, isStatusLoading } = useStartXeroImport(
    effectivePtrsId,
    { poll: false }
  );

  const derivedStatus = useMemo(() => {
    const s = status?.status || status?.state || status?.stage || "";
    return typeof s === "string" ? s : "";
  }, [status]);

  const progress = useMemo(() => {
    const p = status?.progress;
    if (!p) return null;

    const current =
      p.current ?? p.done ?? p.processed ?? p.count ?? p.completed ?? 0;
    const total = p.total ?? p.max ?? p.expected ?? 0;

    if (!total || Number(total) <= 0) return { current, total: 0, pct: 0 };

    const pct = Math.max(
      0,
      Math.min(100, Math.round((Number(current) / Number(total)) * 100))
    );

    return { current: Number(current) || 0, total: Number(total) || 0, pct };
  }, [status]);

  useEffect(() => {
    if (!effectivePtrsId) return;

    if (!startedAtRef.current) startedAtRef.current = Date.now();

    const t = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);

    return () => clearInterval(t);
  }, [effectivePtrsId]);

  // If refetch throws, show a friendly error (do not auto-loop here)
  async function handleRefresh() {
    if (!effectivePtrsId) return;
    try {
      await refetchStatus();
    } catch (err) {
      showAlert(err?.message || "Failed to fetch status.", "error");
    }
  }

  const statusUpper = derivedStatus.toUpperCase();
  const isComplete = ["COMPLETE", "COMPLETED", "DONE", "SUCCESS"].includes(
    statusUpper
  );

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
            {status?.message ||
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
                variant={progress?.total ? "determinate" : "indeterminate"}
                value={progress?.total ? progress.pct : 0}
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
              onClick={() => navigate("/v2/ptrs")}
              disabled={!isComplete}
            >
              Return to PTRS
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}
