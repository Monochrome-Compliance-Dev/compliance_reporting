import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Stack,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";

import { useAlert } from "context";
import { useCallback, useMemo, useState } from "react";
import { usePtrsContext } from "../context/PtrsContext";
import {
  usePtrsValidateSummary,
  useUpdatePtrsMutation,
  useValidateMutation,
} from "../hooks/usePtrsQueries";
import {
  getStageRowById,
  getValidate,
  setStageRowExcluded,
} from "../services/validate.ptrsApi";
import { LoadingSpinner } from "shared/ui";

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

const IssueAccordion = ({ title, items, color, onExclude, onViewRow }) => {
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
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography variant="body2" fontWeight={600} sx={{ color }}>
                    {it.code || "ISSUE"}
                    {typeof it.rowNo === "number" ? ` (row ${it.rowNo})` : ""}
                  </Typography>

                  <Stack direction="row" spacing={1}>
                    {typeof onViewRow === "function" && it?.stageRowId ? (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onViewRow(it)}
                      >
                        View row
                      </Button>
                    ) : null}

                    {typeof onExclude === "function" && it?.stageRowId ? (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onExclude(it)}
                      >
                        Exclude
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
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
  const { goTo } = usePtrsNavigation();

  const { ptrsId: ctxPtrsId, profileId: ctxProfileId } = usePtrsContext();
  const ptrsId = ctxPtrsId || "";
  const profileId = ctxProfileId || null;

  const { status: loadStatus, data, error } = usePtrsValidateSummary(ptrsId);

  const runMut = useValidateMutation(ptrsId);
  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const isBusy =
    runMut.isPending || updatePtrsStep.isPending || isManualRefreshing;

  const [overrideValidate, setOverrideValidate] = useState(null);
  const effectiveValidate = overrideValidate || data || null;

  const [excludeOpen, setExcludeOpen] = useState(false);
  const [excludeTarget, setExcludeTarget] = useState(null);
  const [excludeComment, setExcludeComment] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [viewRowLoading, setViewRowLoading] = useState(false);
  const [viewRowError, setViewRowError] = useState("");
  const [viewRowData, setViewRowData] = useState(null);

  const counts = effectiveValidate?.counts || {};
  const blockers = effectiveValidate?.blockers || [];
  const warnings = effectiveValidate?.warnings || [];

  const statusText = useMemo(
    () => formatStatus(effectiveValidate?.status || (ptrsId ? "—" : "")),
    [effectiveValidate?.status, ptrsId],
  );

  const onRunValidate = useCallback(async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    try {
      showAlert("Running validation…", "info");
      const res = await runMut.mutateAsync();
      setOverrideValidate(res);
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
  const onOpenExclude = useCallback((issue) => {
    setExcludeTarget(issue);
    setExcludeComment("");
    setExcludeOpen(true);
  }, []);

  const onOpenViewRow = useCallback(
    async (issue) => {
      if (!ptrsId || !issue?.stageRowId) {
        showAlert("Missing ptrsId or stage row id", "error");
        return;
      }

      setViewTarget(issue);
      setViewRowError("");
      setViewRowData(null);
      setViewOpen(true);
      setViewRowLoading(true);

      try {
        const row = await getStageRowById(ptrsId, issue.stageRowId);
        setViewRowData(row);
      } catch (err) {
        setViewRowError(err?.message || "Failed to load staged row");
      } finally {
        setViewRowLoading(false);
      }
    },
    [ptrsId, showAlert],
  );

  const onCloseExclude = useCallback(() => {
    setExcludeOpen(false);
    setExcludeTarget(null);
    setExcludeComment("");
  }, []);

  const onCloseViewRow = useCallback(() => {
    setViewOpen(false);
    setViewTarget(null);
    setViewRowError("");
    setViewRowData(null);
    setViewRowLoading(false);
  }, []);

  const onConfirmExclude = useCallback(async () => {
    if (!ptrsId || !excludeTarget?.stageRowId) {
      showAlert("Missing ptrsId or stage row id", "error");
      return;
    }

    try {
      showAlert("Excluding row from validation + metrics…", "info");
      await setStageRowExcluded(ptrsId, excludeTarget.stageRowId, {
        exclude: true,
        comment: excludeComment,
      });

      // Reload validate summary so UI reflects the exclusion immediately.
      const next = await getValidate(ptrsId);
      setOverrideValidate(next);

      showAlert("Row excluded.", "success");
      onCloseExclude();
    } catch (err) {
      showAlert(err?.message || "Failed to exclude row.", "error");
    }
  }, [ptrsId, excludeTarget, excludeComment, showAlert, onCloseExclude]);

  const goBackToSbi = useCallback(() => {
    const qs = new URLSearchParams();
    if (ptrsId) qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    goTo(`sbi?${qs.toString()}`, { includeId: false });
  }, [goTo, ptrsId, profileId]);

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
        "warning",
      );
    }

    const qs = new URLSearchParams();
    if (ptrsId) qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    goTo(`metrics?${qs.toString()}`, { includeId: false });
  }, [goTo, ptrsId, profileId, showAlert, updatePtrsStep]);

  const refresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      const qs = new URLSearchParams();
      if (ptrsId) qs.set("ptrsId", ptrsId);
      if (profileId) qs.set("profileId", profileId);
      goTo(`validate?${qs.toString()}`, { includeId: false, replace: true });
    } finally {
      setTimeout(() => setIsManualRefreshing(false), 250);
    }
  }, [goTo, ptrsId, profileId]);

  return (
    <>
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
            This step checks report readiness across your staged rows. It does
            not change data — it flags what would make the report unsafe or
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
            onExclude={onOpenExclude}
            onViewRow={onOpenViewRow}
          />

          <IssueAccordion
            title="Warnings"
            items={warnings}
            color={theme.palette.warning.main}
            onExclude={onOpenExclude}
            onViewRow={onOpenViewRow}
          />
        </Stack>
      </Box>

      <Dialog open={viewOpen} onClose={onCloseViewRow} fullWidth maxWidth="md">
        <DialogTitle>Staged row</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {viewTarget ? (
                <>
                  From <b>{viewTarget.code || "ISSUE"}</b>
                  {typeof viewTarget.rowNo === "number"
                    ? ` (row ${viewTarget.rowNo})`
                    : ""}
                </>
              ) : (
                ""
              )}
            </Typography>

            {viewRowLoading ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <LoadingSpinner />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Loading staged row…
                </Typography>
              </Stack>
            ) : viewRowError ? (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.error.main }}
              >
                {viewRowError}
              </Typography>
            ) : viewRowData ? (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  overflow: "auto",
                  maxHeight: 420,
                }}
              >
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(viewRowData, null, 2)}
                </pre>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No data.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseViewRow} disabled={isBusy}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={excludeOpen}
        onClose={onCloseExclude}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Exclude row</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              This will exclude the row from validation and metrics, but it will
              remain in staging for audit.
            </Typography>

            {excludeTarget ? (
              <Typography variant="body2">
                Target: <b>{excludeTarget.code || "ISSUE"}</b>
                {typeof excludeTarget.rowNo === "number"
                  ? ` (row ${excludeTarget.rowNo})`
                  : ""}
              </Typography>
            ) : null}

            <TextField
              label="Reason (optional)"
              value={excludeComment}
              onChange={(e) => setExcludeComment(e.target.value)}
              multiline
              minRows={3}
              placeholder="e.g. Bad ABN in source extract; excluding for MVP submission"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseExclude} disabled={isBusy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onConfirmExclude}
            disabled={isBusy}
          >
            Exclude
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
