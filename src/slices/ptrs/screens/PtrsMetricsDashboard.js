import {
  Box,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { listDashboardReports } from "../services/dashboard.ptrsApi";
import { usePtrsMetricsSummary } from "../hooks/usePtrsQueries";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";

const StatCard = ({ label, value, helper }) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Stack spacing={0.5}>
      <Typography variant="overline" sx={{ opacity: 0.75 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ lineHeight: 1.1 }}>
        {value}
      </Typography>
      {helper ? (
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          {helper}
        </Typography>
      ) : null}
    </Stack>
  </Paper>
);

const ChartCard = ({ title, helper, children, right }) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Stack spacing={1.25}>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="flex-start"
        justifyContent="space-between"
        flexWrap="wrap"
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
          {helper ? (
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.25 }}>
              {helper}
            </Typography>
          ) : null}
        </Box>
        {right ? <Box>{right}</Box> : null}
      </Stack>
      {children}
    </Stack>
  </Paper>
);

const InsightCard = ({ title, type = "note", body }) => {
  const tone =
    type === "opportunity"
      ? { label: "Opportunity", color: "success" }
      : type === "risk"
        ? { label: "Risk", color: "error" }
        : { label: "Note", color: "default" };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Chip size="small" label={tone.label} color={tone.color} />
        </Stack>
        <Typography
          variant="body2"
          sx={{ whiteSpace: "pre-wrap", opacity: 0.9 }}
        >
          {body}
        </Typography>
      </Stack>
    </Paper>
  );
};

export default function PtrsMetricsDashboard() {
  const theme = useTheme();

  const location = useLocation();
  const { goHome } = usePtrsNavigation();

  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const urlPtrsId = params.get("ptrsId") || "";
  const [ptrsId, setPtrsId] = useState(urlPtrsId);

  // If the URL provides a ptrsId (e.g. deep link), adopt it.
  // IMPORTANT: do NOT clear local selection just because something upstream strips query params.
  useEffect(() => {
    if (!urlPtrsId) return;
    if (String(urlPtrsId) === String(ptrsId)) return;
    setPtrsId(urlPtrsId);
  }, [urlPtrsId, ptrsId]);

  const onChangePtrs = (nextId) => {
    setPtrsId(nextId || "");
    goHome({ replace: true, includeId: false });
  };

  const fmtPct = (v) => {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return "—";
    const pct = n <= 1 ? n * 100 : n;
    return `${Math.round(pct * 10) / 10}%`;
  };

  const fmtDays = (v) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? `${Math.round(n)} days` : "—";
  };

  const toNum = (v) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const clampPct = (v) => {
    const n = toNum(v);
    if (n === null) return null;
    const pct = n <= 1 ? n * 100 : n;
    return Math.max(0, Math.min(100, pct));
  };

  // ---- Demo mode (synthetic figures for marketing / screenshots) ----
  // Toggle to true when preparing public-facing screenshots.
  const DEMO_MODE = true;

  const [reportOptions, setReportOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingOptions(true);

      try {
        const opts = await listDashboardReports();
        if (!cancelled) setReportOptions(Array.isArray(opts) ? opts : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    status: loadStatus,
    data,
    error,
  } = usePtrsMetricsSummary(ptrsId || "");

  const computed = useMemo(() => {
    const DEMO_COMPUTED = {
      percentageOfSbInvoicesPaidWithinPaymentTerm: 43.2,
      payments30DaysOrLessPct: 66.8,
      payments31To60DaysPct: 18.9,
      paymentsMoreThan60DaysPct: 14.3,
      medianPaymentTimeDays: 24,
      averagePaymentTimeDays: 33,
      commonPaymentTermsDays: 30,
      commonPaymentTermMinimum: 7,
      commonPaymentTermMaximum: 90,
      percentageOfSmallBusinessTradeCreditPayments: 27.5,
      percentagePeppolEnabledSmallBusinessProcurement: null,
    };
    if (DEMO_MODE) return DEMO_COMPUTED;
    return data?.computed || {};
  }, [data?.computed, DEMO_MODE]);

  const pct30 = clampPct(computed?.payments30DaysOrLessPct);
  const pct31to60 = clampPct(computed?.payments31To60DaysPct);
  const pct60p = clampPct(computed?.paymentsMoreThan60DaysPct);

  const medDays = toNum(computed?.medianPaymentTimeDays);
  const avgDays = toNum(computed?.averagePaymentTimeDays);

  const termMode = toNum(computed?.commonPaymentTermsDays);
  const termMin = toNum(computed?.commonPaymentTermMinimum);
  const termMax = toNum(computed?.commonPaymentTermMaximum);

  // NOTE: This dashboard is intentionally CFO-friendly and curated.
  // The regulator-facing results live in the final report.

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2.5}>
        <Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                PTRS Dashboard
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 900 }}>
                A review-friendly summary of outcomes and key drivers.
                Regulator-facing figures are provided in the final report for
                each submission.
              </Typography>

              {DEMO_MODE ? (
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  Dashboard shown with synthetic data for illustrative purposes.
                </Typography>
              ) : null}
            </Box>

            <FormControl
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 320 } }}
            >
              <InputLabel id="ptrs-dashboard-report-label">Report</InputLabel>
              <Select
                labelId="ptrs-dashboard-report-label"
                label="Report"
                value={ptrsId}
                onChange={(e) => onChangePtrs(e.target.value)}
              >
                {loadingOptions ? (
                  <MenuItem value="" disabled>
                    Loading reports…
                  </MenuItem>
                ) : reportOptions.length === 0 ? (
                  <MenuItem value="" disabled>
                    No reports available
                  </MenuItem>
                ) : (
                  [
                    <MenuItem key="__none" value="">
                      Select a report…
                    </MenuItem>,
                    ...reportOptions.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.label}
                      </MenuItem>
                    )),
                  ]
                )}
              </Select>
            </FormControl>
          </Stack>

          {!ptrsId ? (
            <Typography variant="body2" sx={{ mt: 1.5, opacity: 0.75 }}>
              {loadingOptions
                ? "Loading reports…"
                : "Select a report to view metrics. You will only see reports available to your account."}
            </Typography>
          ) : loadStatus === "loading" ? (
            <Typography variant="body2" sx={{ mt: 1.5, opacity: 0.75 }}>
              Loading dashboard…
            </Typography>
          ) : loadStatus === "error" ? (
            <Typography variant="body2" sx={{ mt: 1.5, opacity: 0.75 }}>
              {error || "Unable to load dashboard data."}
            </Typography>
          ) : null}
        </Box>

        <Divider />

        {/* A — Outcomes (sign-off layer) */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Outcomes
          </Typography>
          <Typography
            variant="body2"
            sx={{ opacity: 0.85, mb: 2, maxWidth: 900 }}
          >
            The few numbers a reviewer needs to understand and be comfortable
            signing off.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                lg: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            <StatCard
              label="Small business invoices paid on time"
              value={fmtPct(
                computed?.percentageOfSbInvoicesPaidWithinPaymentTerm,
              )}
              helper="Headline outcome"
            />
            <StatCard
              label="Paid within 30 days"
              value={fmtPct(computed?.payments30DaysOrLessPct)}
              helper="Regulator-aligned"
            />
            <StatCard
              label="Median payment time"
              value={fmtDays(computed?.medianPaymentTimeDays)}
              helper="Typical payment time"
            />
            <StatCard
              label="Average payment time"
              value={fmtDays(computed?.averagePaymentTimeDays)}
              helper="Influenced by outliers"
            />
          </Box>
        </Box>

        {/* B — Drivers */}
        <Stack spacing={2}>
          <ChartCard
            title="Payment-time distribution"
            helper="A calm banded view aligned to how payment time is reported."
            right={
              <Stack direction="row" spacing={0.75} flexWrap="wrap">
                <Chip
                  size="small"
                  label="0–30"
                  sx={{
                    bgcolor: theme.palette.success.light,
                    color: theme.palette.success.contrastText,
                  }}
                />
                <Chip
                  size="small"
                  label="31–60"
                  sx={{
                    bgcolor: theme.palette.warning.light,
                    color: theme.palette.warning.contrastText,
                  }}
                />
                <Chip
                  size="small"
                  label="60+"
                  sx={{
                    bgcolor: theme.palette.error.light,
                    color: theme.palette.error.contrastText,
                  }}
                />
              </Stack>
            }
          >
            {pct30 === null && pct31to60 === null && pct60p === null ? (
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                No distribution data available for this report.
              </Typography>
            ) : (
              <Box>
                <Box
                  sx={{
                    height: 14,
                    borderRadius: 99,
                    overflow: "hidden",
                    display: "flex",
                    bgcolor: theme.palette.action.hover,
                  }}
                  aria-label="Payment time distribution"
                >
                  <Box
                    sx={{
                      width: `${pct30 || 0}%`,
                      bgcolor: theme.palette.success.main,
                    }}
                  />
                  <Box
                    sx={{
                      width: `${pct31to60 || 0}%`,
                      bgcolor: theme.palette.warning.main,
                    }}
                  />
                  <Box
                    sx={{
                      width: `${pct60p || 0}%`,
                      bgcolor: theme.palette.error.main,
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                    gap: 1,
                    mt: 1.25,
                  }}
                >
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.75 }}>
                      0–30 days
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {fmtPct(pct30)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.75 }}>
                      31–60 days
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {fmtPct(pct31to60)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.75 }}>
                      60+ days
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {fmtPct(pct60p)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </ChartCard>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <ChartCard
              title="Typical vs average"
              helper="Median shows typical behaviour; average reflects outliers."
            >
              {medDays === null && avgDays === null ? (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  No median/average data available for this report.
                </Typography>
              ) : (
                (() => {
                  const max = Math.max(medDays || 0, avgDays || 0, 1);
                  const scaleMax = Math.ceil(max * 1.25);
                  const medPct =
                    medDays === null ? null : (medDays / scaleMax) * 100;
                  const avgPct =
                    avgDays === null ? null : (avgDays / scaleMax) * 100;

                  return (
                    <Box>
                      <Box
                        sx={{
                          position: "relative",
                          height: 26,
                          borderRadius: 1,
                          bgcolor: theme.palette.action.hover,
                          overflow: "hidden",
                        }}
                      >
                        {medPct !== null ? (
                          <Box
                            sx={{
                              position: "absolute",
                              left: 0,
                              top: "50%",
                              transform: "translateY(-50%)",
                              height: 6,
                              width: `${medPct}%`,
                              bgcolor: theme.palette.primary.main,
                              borderRadius: 99,
                            }}
                          />
                        ) : null}
                        {avgPct !== null ? (
                          <Box
                            sx={{
                              position: "absolute",
                              left: 0,
                              top: "50%",
                              transform: "translateY(-50%)",
                              height: 2,
                              width: `${avgPct}%`,
                              bgcolor: theme.palette.text.secondary,
                              borderRadius: 99,
                            }}
                          />
                        ) : null}
                        {medPct !== null ? (
                          <Box
                            sx={{
                              position: "absolute",
                              left: `calc(${medPct}% - 6px)`,
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              bgcolor: theme.palette.primary.main,
                              border: `2px solid ${theme.palette.background.paper}`,
                            }}
                          />
                        ) : null}
                        {avgPct !== null ? (
                          <Box
                            sx={{
                              position: "absolute",
                              left: `calc(${avgPct}% - 6px)`,
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              bgcolor: theme.palette.background.paper,
                              border: `2px solid ${theme.palette.text.secondary}`,
                            }}
                          />
                        ) : null}
                      </Box>

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 1,
                          mt: 1.25,
                        }}
                      >
                        <Box>
                          <Typography variant="overline" sx={{ opacity: 0.75 }}>
                            Median
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 800 }}
                          >
                            {fmtDays(medDays)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="overline" sx={{ opacity: 0.75 }}>
                            Average
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 800 }}
                          >
                            {fmtDays(avgDays)}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.7, display: "block", mt: 0.75 }}
                      >
                        Scale: 0–{scaleMax} days
                      </Typography>
                    </Box>
                  );
                })()
              )}
            </ChartCard>

            <ChartCard
              title="Payment terms summary"
              helper="Common (mode) term and observed range for this reporting period."
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                  gap: 1,
                }}
              >
                <Box>
                  <Typography variant="overline" sx={{ opacity: 0.75 }}>
                    Most common term
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {termMode === null ? "—" : `${Math.round(termMode)} days`}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ opacity: 0.75 }}>
                    Minimum
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {termMin === null ? "—" : `${Math.round(termMin)} days`}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ opacity: 0.75 }}>
                    Maximum
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {termMax === null ? "—" : `${Math.round(termMax)} days`}
                  </Typography>
                </Box>
              </Box>
            </ChartCard>
          </Box>
        </Stack>

        {/* C — Key levers & observations (curated insights) */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Key levers and observations
          </Typography>
          <Typography
            variant="body2"
            sx={{ opacity: 0.85, mb: 2, maxWidth: 900 }}
          >
            Curated insights for this entity and reporting period. These may be
            scenario-based or qualitative (for example process, term policy,
            vendor behaviour, or data quality). Insights are indicative and
            based on the current dataset and review notes.
          </Typography>

          <Stack spacing={2}>
            <InsightCard
              type="opportunity"
              title="Example: A change that materially shifts the outcome"
              body={
                "This section is curated per report. It can be scenario-based (timing, terms) or qualitative (process, vendor behaviour, data quality).\n\nOnce the report is finalised, replace these examples with the insights you want reviewers to focus on."
              }
            />
            <InsightCard
              type="risk"
              title="Example: A small set of items driving the tail"
              body={
                "If a small number of suppliers or document types dominate the 60+ day band, call it out here and note whether it is expected (contractual) or operational (approvals, batching)."
              }
            />
            <InsightCard
              type="note"
              title="Example: Data quality / mapping note"
              body={
                "Document any manual classification or mapping assumptions that materially affect interpretation. Keep it short and review-friendly."
              }
            />
          </Stack>
        </Box>

        {/* D — Context (quiet) */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Context
          </Typography>
          <Typography
            variant="body2"
            sx={{ opacity: 0.85, mb: 2, maxWidth: 900 }}
          >
            Supporting context that helps interpretation, without competing with
            the outcomes.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <StatCard
              label="Small business spend (% of total)"
              value={fmtPct(
                computed?.percentageOfSmallBusinessTradeCreditPayments,
              )}
            />
            <StatCard
              label="Peppol-enabled procurement (% SB)"
              value={fmtPct(
                computed?.percentagePeppolEnabledSmallBusinessProcurement,
              )}
            />
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 2,
              opacity: 0.7,
              color: theme.palette.text.secondary,
            }}
          >
            This dashboard is intended for internal review and sign-off
            confidence. Regulator-facing results are produced in the final
            report export.
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
