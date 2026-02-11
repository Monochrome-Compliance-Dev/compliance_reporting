import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { useAlert } from "context";
import { LoadingSpinner } from "components/ui/";
import { usePtrsV2Context } from "v2/ptrs/context/PtrsV2Context";

export default function PackPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const { ptrsId: ctxPtrsId, profileId: ctxProfileId } = usePtrsV2Context();
  const ptrsId = ctxPtrsId || "";
  const profileId = ctxProfileId || null;

  // MVP mock data (hardcoded) so we can design the pack layout before wiring real data.
  const mock = {
    reportingEntityName: "Veolia ANZ (Mock)",
    periodStart: "2024-01-01",
    periodEnd: "2024-06-30",
    generatedAt: "2026-02-05 07:10 AEST",
    status: "Needs inputs",
    readiness: {
      requiredMissingCount: 2,
      requiredMissing: [
        {
          label: "Approving responsible member given name",
          owner: "Customer",
          help: "Required in regulator portal.",
        },
        {
          label: "Responsible member approval date",
          owner: "Customer",
          help: "Must be entered before submission.",
        },
      ],
    },
    metrics: {
      basedOnRowCount: 18342,
      sbRowCount: 6210,
      invoiceDateRange: { min: "2024-01-02", max: "2024-06-29" },
      averageDays: 31.4,
      medianDays: 24.0,
      p80Days: 46,
      p95Days: 88,
      pct0to30: 64.52,
      pct31to60: 28.11,
      pctOver60: 7.37,
    },
    exceptions: [
      {
        severity: "warning",
        title: "Small business flags incomplete",
        detail:
          "SBI outcomes not uploaded yet. Small business status may be provisional.",
      },
      {
        severity: "info",
        title: "Validation checks pending",
        detail:
          "Validate step not executed for this snapshot. Results will appear here once available.",
      },
    ],
    decision: {
      required: false,
      text: "No decision required today. Approval to submit will be requested once required declarations are complete.",
    },
  };

  const formatDateAU = (iso) => {
    if (typeof iso !== "string") return iso;
    const m = iso.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
    if (!m) return iso;
    const [, yyyy, mm, dd] = m;
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatNumber = (n, decimals = 0) => {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    if (decimals === 0) return Math.round(n).toLocaleString();
    return n.toFixed(decimals);
  };

  const readinessTone = useMemo(() => {
    const missing = mock.readiness.requiredMissingCount;
    if (!missing) return { label: "Ready", color: "success" };
    if (missing <= 3) return { label: "Needs inputs", color: "warning" };
    return { label: "Blocked", color: "error" };
  }, [mock.readiness.requiredMissingCount]);

  const [isManualBusy, setIsManualBusy] = useState(false);
  const isBusy = isManualBusy;

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (ptrsId) p.set("ptrsId", ptrsId);
    if (profileId) p.set("profileId", profileId);
    return p.toString();
  }, [ptrsId, profileId]);

  const goBackToReport = useCallback(() => {
    navigate(`/v2/ptrs/report?${qs}`);
  }, [navigate, qs]);

  const goNext = useCallback(() => {
    showAlert("Next step TBD (mock pack only).", "info");
  }, [showAlert]);

  const onPrint = useCallback(() => {
    setIsManualBusy(true);
    try {
      showAlert(
        "PDF export is coming next. This screen is a visual mock to shape the Board Pack.",
        "info",
      );
    } finally {
      setTimeout(() => setIsManualBusy(false), 250);
    }
  }, [showAlert]);

  const bucketRows = useMemo(() => {
    return [
      { label: "0–30 days", value: mock.metrics.pct0to30 },
      { label: "31–60 days", value: mock.metrics.pct31to60 },
      { label: ">60 days", value: mock.metrics.pctOver60 },
    ];
  }, [mock.metrics.pct0to30, mock.metrics.pct31to60, mock.metrics.pctOver60]);

  const severityToChip = (severity) => {
    if (severity === "error") return { label: "Issue", color: "error" };
    if (severity === "warning") return { label: "Warning", color: "warning" };
    return { label: "Note", color: "default" };
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ md: "center" }}
        spacing={1.25}
        sx={{ mb: 2 }}
      >
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" fontWeight={600}>
              Board Pack
            </Typography>
            <Chip
              size="small"
              label={readinessTone.label}
              color={readinessTone.color}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              size="small"
              variant="outlined"
              label="Mock"
              sx={{
                height: 22,
                fontSize: 11,
                borderColor: theme.palette.divider,
                color: theme.palette.text.secondary,
              }}
            />
          </Stack>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            {mock.reportingEntityName} • {formatDateAU(mock.periodStart)}–
            {formatDateAU(mock.periodEnd)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary }}
          >
            Generated: {mock.generatedAt} • Ptrs: {ptrsId || "—"}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={goBackToReport}
            disabled={isBusy}
          >
            Back: Report
          </Button>

          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={onPrint}
            disabled={isBusy}
          >
            Print
          </Button>

          <Button
            variant="contained"
            endIcon={<NavigateNextIcon />}
            onClick={goNext}
            disabled={isBusy}
          >
            Next
          </Button>

          {isBusy ? <LoadingSpinner /> : null}
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {/* Executive summary */}
        <Grid item xs={12} md={7}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="subtitle1" fontWeight={800}>
                  Executive summary
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  Snapshot based on{" "}
                  <strong>
                    {mock.metrics.basedOnRowCount.toLocaleString()}
                  </strong>{" "}
                  rows ({mock.metrics.sbRowCount.toLocaleString()} small
                  business).
                </Typography>
              </Stack>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      Payment time (days)
                    </Typography>
                    <Stack spacing={0.75} sx={{ mt: 1 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">Average</Typography>
                        <Typography variant="body2" fontWeight={800}>
                          {formatNumber(mock.metrics.averageDays, 1)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">Median</Typography>
                        <Typography variant="body2" fontWeight={800}>
                          {formatNumber(mock.metrics.medianDays, 1)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">P80</Typography>
                        <Typography variant="body2" fontWeight={800}>
                          {formatNumber(mock.metrics.p80Days, 0)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">P95</Typography>
                        <Typography variant="body2" fontWeight={800}>
                          {formatNumber(mock.metrics.p95Days, 0)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      Payment distribution
                    </Typography>
                    <Stack spacing={0.75} sx={{ mt: 1 }}>
                      {bucketRows.map((r) => (
                        <Stack
                          key={r.label}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="body2">{r.label}</Typography>
                          <Typography variant="body2" fontWeight={800}>
                            {formatNumber(r.value, 2)}%
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        display: "block",
                        mt: 1.25,
                      }}
                    >
                      Tail risk (P95): {formatNumber(mock.metrics.p95Days, 0)}{" "}
                      days
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  backgroundColor: theme.palette.action.hover,
                }}
              >
                <Typography variant="subtitle2" fontWeight={800}>
                  Decision
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
                >
                  {mock.decision.text}
                </Typography>
              </Paper>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 1.5, flex: 1 }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Invoice date range
                  </Typography>
                  <Typography variant="body2" fontWeight={800} sx={{ mt: 0.5 }}>
                    {formatDateAU(mock.metrics.invoiceDateRange.min)} –{" "}
                    {formatDateAU(mock.metrics.invoiceDateRange.max)}
                  </Typography>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 1.5, flex: 1 }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Readiness
                  </Typography>
                  <Typography variant="body2" fontWeight={800} sx={{ mt: 0.5 }}>
                    {mock.readiness.requiredMissingCount === 0
                      ? "All required inputs complete"
                      : `${mock.readiness.requiredMissingCount} required input(s) missing`}
                  </Typography>
                </Paper>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* Readiness / checklist */}
        <Grid item xs={12} md={5}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={800}>
                Compliance readiness
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Fields marked below must be completed before submission in the
                regulator portal.
              </Typography>

              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  overflow: "hidden",
                  borderRadius: 1.5,
                  borderColor: theme.palette.divider,
                }}
              >
                <Table size="small" aria-label="Required inputs">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>
                        Required input
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, width: 120 }}>
                        Owner
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mock.readiness.requiredMissing.length ? (
                      mock.readiness.requiredMissing.map((r) => (
                        <TableRow key={r.label}>
                          <TableCell>
                            <Stack spacing={0.25}>
                              <Typography variant="body2" fontWeight={700}>
                                {r.label}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: theme.palette.text.secondary }}
                              >
                                {r.help}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={r.owner}
                              variant="outlined"
                              sx={{
                                height: 22,
                                fontSize: 11,
                                borderColor: theme.palette.warning.main,
                                color: theme.palette.warning.main,
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            No required inputs missing.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider />

              <Typography variant="subtitle1" fontWeight={800}>
                Exceptions & notes
              </Typography>

              <Stack spacing={1}>
                {mock.exceptions.map((ex) => {
                  const chip = severityToChip(ex.severity);
                  return (
                    <Paper
                      key={ex.title}
                      variant="outlined"
                      sx={{ p: 1.75, borderRadius: 1.5 }}
                    >
                      <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            size="small"
                            label={chip.label}
                            color={chip.color}
                          />
                          <Typography variant="body2" fontWeight={800}>
                            {ex.title}
                          </Typography>
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          {ex.detail}
                        </Typography>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>

              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary, display: "block" }}
              >
                This is a layout mock only. Next step is wiring real snapshot +
                print-ready PDF.
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
