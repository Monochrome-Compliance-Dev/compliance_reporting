import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useNavigate } from "react-router";

import { useAlert } from "context";
import { usePtrsV2Context } from "v2/ptrs/context/PtrsV2Context";
import { LoadingSpinner } from "components/ui/";
import {
  usePtrsValidateSummary,
  useValidateMutation,
  useUpdatePtrsMutation,
} from "v2/ptrs/hooks/usePtrsQueries";
import { useState } from "react";
import { useMemo } from "react";
import { useCallback } from "react";

const formatStatus = (status) => {
  if (!status) return "—";
  const s = String(status).trim();
  if (!s) return "—";

  const words = s.replace(/_/g, " ").toLowerCase().split(" ").filter(Boolean);
  if (!words.length) return "—";

  return words
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
};

const IssueAccordion = ({ title, items, color }) => {
  const count = items?.length || 0;

  return (
    <Accordion
      defaultExpanded={false}
      disableGutters
      sx={{
        borderRadius: 2,
        border: (t) => `1px solid ${t.palette.divider}`,
        backgroundColor: (t) => t.palette.background.paper,
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1" fontWeight={600}>
          {title} ({count})
        </Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
        {!count ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            None.
          </Typography>
        ) : (
          <Stack spacing={0.75}>
            {items.slice(0, 50).map((it, idx) => (
              <Box
                key={`${it.code || "issue"}-${it.rowNo || idx}-${idx}`}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  border: (t) => `1px solid ${t.palette.divider}`,
                }}
              >
                <Typography variant="body2" fontWeight={600} sx={{ color }}>
                  {it.code || "ISSUE"}
                  {typeof it.rowNo === "number" ? ` (row ${it.rowNo})` : ""}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {it.message || "—"}
                </Typography>
              </Box>
            ))}

            {count > 50 ? (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Showing first 50 issues only.
              </Typography>
            ) : null}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default function ValidatePanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const { ptrsId: ctxPtrsId, profileId: ctxProfileId } = usePtrsV2Context();
  const ptrsId = ctxPtrsId || "";
  const profileId = ctxProfileId || null;

  const { status: loadStatus, data, error } = usePtrsValidateSummary(ptrsId);

  const runMut = useValidateMutation(ptrsId);
  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const isBusy =
    runMut.isPending || updatePtrsStep.isPending || isManualRefreshing;

  const counts = data?.counts || {};
  const blockers = data?.blockers || [];
  const warnings = data?.warnings || [];

  const statusText = useMemo(
    () => formatStatus(data?.status || (ptrsId ? "—" : "")),
    [data?.status, ptrsId]
  );

  const onRunValidate = useCallback(async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    try {
      showAlert("Running validation…", "info");
      const res = await runMut.mutateAsync();
      const s = res?.status || "unknown";

      if (s === "BLOCKED") {
        showAlert("Validation blocked. Fix blockers and try again.", "error");
      } else if (s === "PASSED_WITH_WARNINGS") {
        showAlert("Validation passed with warnings.", "warning");
      } else {
        showAlert("Validation passed.", "success");
      }

      try {
        await updatePtrsStep.mutateAsync({ currentStep: "validate" });
      } catch (e) {
        // non-blocking
      }
    } catch (err) {
      showAlert(err?.message || "Failed to run validation.", "error");
    }
  }, [ptrsId, runMut, showAlert, updatePtrsStep]);

  const goBackToSbi = useCallback(() => {
    const qs = new URLSearchParams();
    if (ptrsId) qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    navigate(`/v2/ptrs/sbi?${qs.toString()}`);
  }, [navigate, ptrsId, profileId]);

  const goToMetrics = useCallback(async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    try {
      await updatePtrsStep.mutateAsync({ currentStep: "metrics" });
    } catch (err) {
      console.error(err);
      showAlert(
        "Failed to update PTRS step. Continuing to Metrics.",
        "warning"
      );
    }

    const qs = new URLSearchParams();
    if (ptrsId) qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    navigate(`/v2/ptrs/metrics?${qs.toString()}`);
  }, [navigate, ptrsId, profileId, showAlert, updatePtrsStep]);

  const refresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      const qs = new URLSearchParams();
      if (ptrsId) qs.set("ptrsId", ptrsId);
      if (profileId) qs.set("profileId", profileId);
      navigate(`/v2/ptrs/validate?${qs.toString()}`, { replace: true });
    } finally {
      setTimeout(() => setIsManualRefreshing(false), 250);
    }
  }, [navigate, ptrsId, profileId]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={600}>
          Validate
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          Ptrs: {ptrsId || "—"}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        <Typography
          variant="body1"
          sx={{ color: theme.palette.text.secondary }}
        >
          This step checks report readiness across your staged rows. It does not
          change data — it flags what would make the report unsafe or
          misleading.
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={goBackToSbi}
            disabled={isBusy}
          >
            Back: SBI Check
          </Button>

          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onRunValidate}
            disabled={!ptrsId || isBusy}
          >
            Run validation
          </Button>

          <Button
            variant="contained"
            endIcon={<NavigateNextIcon />}
            onClick={goToMetrics}
            disabled={!ptrsId || isBusy}
          >
            Next: Metrics
          </Button>

          <Button
            variant="outlined"
            onClick={refresh}
            disabled={!ptrsId || isBusy}
          >
            Refresh
          </Button>

          {isBusy ? <LoadingSpinner /> : null}
        </Stack>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Stack spacing={1}>
            <Typography variant="subtitle1" fontWeight={600}>
              Summary
            </Typography>

            {!ptrsId ? (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Select or resume a PTRS run to validate.
              </Typography>
            ) : loadStatus === "loading" ? (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Loading validation summary…
              </Typography>
            ) : loadStatus === "error" ? (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.error.main }}
              >
                {error || "Failed to load validation summary"}
              </Typography>
            ) : (
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  Status: <b>{statusText}</b>
                </Typography>

                <Typography variant="body2">
                  Rows: {counts.totalRows ?? "—"} (excluded:{" "}
                  {counts.excludedRows ?? "—"})
                </Typography>

                <Typography variant="body2">
                  Blockers: {counts.blockers ?? blockers.length ?? 0} •
                  Warnings: {counts.warnings ?? warnings.length ?? 0}
                </Typography>

                {typeof counts.duplicatesSuspectedCount === "number" ? (
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Duplicates suspected: {counts.duplicatesSuspectedCount}
                  </Typography>
                ) : null}

                {typeof counts.smallBusinessUnknownCount === "number" ? (
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Small business unknown: {counts.smallBusinessUnknownCount}
                  </Typography>
                ) : null}
              </Stack>
            )}
          </Stack>
        </Box>

        <IssueAccordion
          title="Blockers"
          items={blockers}
          color={theme.palette.error.main}
        />

        <IssueAccordion
          title="Warnings"
          items={warnings}
          color={theme.palette.warning.main}
        />
      </Stack>
    </Box>
  );
}
