import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import { Box, Button, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";
import { usePtrsContext } from "../context/PtrsContext";

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
  const { goTo, goHome } = usePtrsNavigation();
  const [searchParams] = useSearchParams();
  const { showAlert } = useAlert();
  const { ptrsId: ctxPtrsId } = usePtrsContext();

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
        "error",
      );
      goHome({ replace: true, includeId: false });
      return;
    }

    if (outcome.cancelled) {
      showAlert("Xero connection was cancelled.", "warning");
      goTo(`xero/import?ptrsId=${encodeURIComponent(effectivePtrsId)}`, {
        replace: true,
        includeId: false,
      });
      return;
    }

    if (outcome.error) {
      const msg =
        outcome.errorDescription ||
        outcome.error ||
        "Xero connection failed. Please try again.";
      showAlert(msg, "error");
      goTo(`xero/import?ptrsId=${encodeURIComponent(effectivePtrsId)}`, {
        replace: true,
        includeId: false,
      });
      return;
    }

    // Success (or provider did not include any explicit error)
    showAlert("Xero connected. Select an organisation to continue.", "success");
    goTo(`xero/select?ptrsId=${encodeURIComponent(effectivePtrsId)}`, {
      replace: true,
      includeId: false,
    });
  }, [effectivePtrsId, goHome, goTo, outcome, showAlert]);

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
            onClick={() => {
              if (!effectivePtrsId) {
                goHome({ includeId: false });
                return;
              }
              goTo(
                `xero/select?ptrsId=${encodeURIComponent(effectivePtrsId)}`,
                {
                  includeId: false,
                },
              );
            }}
          >
            Select organisation
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              if (!effectivePtrsId) {
                goHome({ includeId: false });
                return;
              }
              goTo(
                `xero/import?ptrsId=${encodeURIComponent(effectivePtrsId)}`,
                {
                  includeId: false,
                },
              );
            }}
          >
            Back to import
          </Button>

          <Button variant="text" onClick={() => goHome({ includeId: false })}>
            Return to PTRS
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
