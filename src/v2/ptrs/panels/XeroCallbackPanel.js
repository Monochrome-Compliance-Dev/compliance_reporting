import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Box, Button, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { usePtrsV2Context } from "../context/PtrsV2Context";

function readCallbackDraftFromStorage() {
  try {
    const raw = localStorage.getItem("ptrsXeroCallback");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export default function XeroCallbackPanel() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showAlert } = useAlert();
  const { ptrsId: ctxPtrsId } = usePtrsV2Context();

  // Carry ptrsId via query string to survive a full-page OAuth redirect.
  const ptrsIdFromQuery = searchParams.get("ptrsId") || null;

  // As a last resort, fall back to what we stored right before we redirected to Xero.
  const ptrsIdFromStorage = useMemo(() => {
    const draft = readCallbackDraftFromStorage();
    return draft?.ptrsId || null;
  }, []);

  const effectivePtrsId =
    ctxPtrsId || ptrsIdFromQuery || ptrsIdFromStorage || null;

  const outcome = useMemo(() => {
    const error = searchParams.get("error") || null;
    const errorDescription = searchParams.get("error_description") || null;
    const status = searchParams.get("status") || null;

    // Some providers send "access_denied" when user cancels.
    const cancelled =
      status === "cancelled" ||
      searchParams.get("cancelled") === "1" ||
      error === "access_denied";

    return {
      cancelled,
      error,
      errorDescription,
      status,
    };
  }, [searchParams]);

  const hasHandledRef = useRef(false);

  useEffect(() => {
    if (hasHandledRef.current) return;
    hasHandledRef.current = true;

    if (!effectivePtrsId) {
      showAlert(
        "No PTRS run found. Please create/resume a run first.",
        "error"
      );
      navigate("/v2/ptrs", { replace: true });
      return;
    }

    if (outcome.cancelled) {
      showAlert("Xero connection was cancelled.", "warning");
      navigate(
        `/v2/ptrs/xero/import?ptrsId=${encodeURIComponent(effectivePtrsId)}`,
        {
          replace: true,
        }
      );
      return;
    }

    if (outcome.error) {
      const msg =
        outcome.errorDescription ||
        outcome.error ||
        "Xero connection failed. Please try again.";
      showAlert(msg, "error");
      navigate(
        `/v2/ptrs/xero/import?ptrsId=${encodeURIComponent(effectivePtrsId)}`,
        {
          replace: true,
        }
      );
      return;
    }

    // Success (or provider did not include any explicit error)
    showAlert("Xero connected. Select an organisation to continue.", "success");
    navigate(
      `/v2/ptrs/xero/select?ptrsId=${encodeURIComponent(effectivePtrsId)}`,
      {
        replace: true,
      }
    );
  }, [effectivePtrsId, navigate, outcome, showAlert]);

  // If something prevents auto-redirect, provide a manual escape hatch.
  return (
    <Box sx={{ p: theme.spacing(2) }}>
      <Paper sx={{ p: theme.spacing(2) }}>
        <Typography variant="h6" sx={{ mb: theme.spacing(1) }}>
          Returning from Xero…
        </Typography>
        <Typography variant="body2" sx={{ mb: theme.spacing(2) }}>
          If you are not redirected automatically, use the buttons below.
        </Typography>

        <Box sx={{ display: "flex", gap: theme.spacing(2), flexWrap: "wrap" }}>
          <Button
            variant="contained"
            onClick={() =>
              navigate(
                effectivePtrsId
                  ? `/v2/ptrs/xero/select?ptrsId=${encodeURIComponent(
                      effectivePtrsId
                    )}`
                  : "/v2/ptrs"
              )
            }
          >
            Select organisation
          </Button>

          <Button
            variant="outlined"
            onClick={() =>
              navigate(
                effectivePtrsId
                  ? `/v2/ptrs/xero/import?ptrsId=${encodeURIComponent(
                      effectivePtrsId
                    )}`
                  : "/v2/ptrs"
              )
            }
          >
            Back to import
          </Button>

          <Button variant="text" onClick={() => navigate("/v2/ptrs")}>
            Return to PTRS
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
