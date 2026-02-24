import { useTheme } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePtrsContext } from "../../context";
import { dashboardService } from "../../services";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tooltip,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

const StatCard = ({ title, value }) => {
  const theme = useTheme();
  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Card
        sx={{
          width: "100%",
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          p: 1.25,
          boxShadow: theme.shadows[1],
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="h5"
          color={theme.palette.primary.main}
          sx={{ fontSize: "1rem", fontWeight: 500 }}
        >
          {value}
        </Typography>
      </Card>
      <Typography
        variant="body2"
        color={theme.palette.text.secondary}
        sx={{
          mt: 0.75,
          fontSize: "0.7rem",
          lineHeight: 1.25,
          textAlign: "center",
          maxWidth: "100%",
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export default function PtrsMetricsDashboard() {
  const theme = useTheme();
  const { getDashboardSignals, getDashboardExtendedMetrics } = dashboardService;
  const { ptrsDetails } = usePtrsContext();
  const ptrsId = ptrsDetails?.[0]?.id;

  // derive defaults from context
  const ptrsStart = ptrsDetails?.[0]?.reportingPeriodStartDate || null;
  const ptrsEnd = ptrsDetails?.[0]?.reportingPeriodEndDate || null;

  const [selectedPeriod, setSelectedPeriod] = useState(() =>
    ptrsStart && ptrsEnd
      ? { key: "ptrs", start: ptrsStart, end: ptrsEnd }
      : { key: "all", start: null, end: null }
  );

  const periodOptions = useMemo(
    () => [
      {
        key: "ptrs",
        label: "PTRS reporting period",
        start: ptrsStart,
        end: ptrsEnd,
      },
      {
        key: "all",
        label: "All data",
        start: null,
        end: null,
      },
      {
        key: "jan-jun-2025",
        label: "Jan–Jun 2025",
        start: "2025-01-01",
        end: "2025-06-30",
      },
      {
        key: "jul-dec-2024",
        label: "Jul–Dec 2024",
        start: "2024-07-01",
        end: "2024-12-31",
      },
      {
        key: "jan-jun-2024",
        label: "Jan–Jun 2024",
        start: "2024-01-01",
        end: "2024-06-30",
      },
      {
        key: "jul-dec-2023",
        label: "Jul–Dec 2023",
        start: "2023-07-01",
        end: "2023-12-31",
      },
    ],
    [ptrsStart, ptrsEnd]
  );

  const setPeriodByKey = useCallback(
    (key) => {
      const p = periodOptions.find((x) => x.key === key);
      if (p) setSelectedPeriod({ key: p.key, start: p.start, end: p.end });
    },
    [periodOptions]
  );

  // Read period from query string on first load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("period");
      if (q) setPeriodByKey(q);
    } catch (e) {
      /* no-op */
    }
  }, [setPeriodByKey]);

  // Keep URL in sync when period changes
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if ((selectedPeriod?.key || "all") !== params.get("period")) {
        params.set("period", selectedPeriod?.key || "all");
        const url = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, "", url);
      }
    } catch (e) {
      /* no-op */
    }
  }, [selectedPeriod]);

  const normalizeDate = (d) => {
    if (!d) return null;
    // Accept Date or string; return YYYY-MM-DD
    if (typeof d === "string") return d.slice(0, 10);
    try {
      return new Date(d).toISOString().slice(0, 10);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!ptrsId) return;

    const currentKey = `tcp_records_${ptrsId}`;
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("tcp_records_") && key !== currentKey) {
        sessionStorage.removeItem(key);
      }
    });
  }, [ptrsId]);
  //   console.log("Ptrs ID:", ptrsId);

  const [signals, setSignals] = useState(null);

  useEffect(() => {
    const loadSignals = async () => {
      try {
        const start = normalizeDate(selectedPeriod?.start);
        const end = normalizeDate(selectedPeriod?.end);
        const params = start && end ? { start, end } : undefined;
        console.log("[PTRS Metrics] fetching with:", { ptrsId, params });
        const [core, extended] = await Promise.all([
          getDashboardSignals(ptrsId, params),
          getDashboardExtendedMetrics(ptrsId, params),
        ]);
        setSignals({ ...core, ...extended });
      } catch (err) {
        console.error("Failed to fetch dashboard signals:", err);
      }
    };
    if (ptrsId) loadSignals();
  }, [
    ptrsId,
    selectedPeriod,
    getDashboardSignals,
    getDashboardExtendedMetrics,
  ]);

  if (!signals) {
    console.log("No signals found.");
    return null;
  }

  // Build metrics with fallback to null, and log missing/undefined/null fields
  const metrics = {
    invoicesPaidWithin30Days: signals?.invoicesPaidWithin30Days ?? null,
    valuePaidWithin30Days: signals?.valuePaidWithin30Days ?? null,
    avgPaymentTime: signals?.avgDays ?? null,
    medianPaymentTime: signals?.medianDays ?? null,
    percentile80: signals?.percentile80 ?? null,
    percentile95: signals?.percentile95 ?? null,
    sbNumPayments: signals?.sbNumPayments ?? null,
    sbValuePayments: signals?.sbValuePayments ?? null,
    sbPeppolNum: signals?.sbPeppolNum ?? null,
    sbPeppolValue: signals?.sbPeppolValue ?? null,
    invoiceBands: Array.isArray(signals?.invoiceBands)
      ? signals.invoiceBands
      : [],
    slowestPaidSuppliers: Array.isArray(signals?.slowestPaidSuppliers)
      ? signals.slowestPaidSuppliers
      : [],
    lateSbRate: signals?.lateSbRate ?? 0,
    // Terms + new percentages
    modeTerm: signals?.modeTerm ?? null,
    termMin: signals?.termMin ?? null,
    termMax: signals?.termMax ?? null,
    withinTermsPct:
      signals?.withinTermsPct ?? signals?.pct_within_terms ?? null,
    sbValuePctOfTotal: signals?.sbValuePctOfTotal ?? null,
    sbPeppolPct: signals?.sbPeppolPct ?? null,
    // what-if fields
    whatIfOnTimePct: signals?.whatIfOnTimePct ?? null,
    whatIfDaysEarlier: signals?.whatIfDaysEarlier ?? null,
    whatIfDeltaPp: signals?.whatIfDeltaPp ?? null,
    // average lateness + derived what-if
    avgDaysLate: signals?.avgDaysLate ?? null,
    avgDaysLateCeil: signals?.avgDaysLateCeil ?? null,
    whatIfAvgOnTimePct: signals?.whatIfAvgOnTimePct ?? null,
    whatIfAvgOnTimeCount: signals?.whatIfAvgOnTimeCount ?? null,
    whatIfAvgDeltaPp: signals?.whatIfAvgDeltaPp ?? null,
  };

  // Debug: verify band inputs driving the bar heights
  if (process.env.NODE_ENV !== "production") {
    try {
      const bandDebug = (metrics.invoiceBands || []).map((b) => ({
        label: b?.label,
        pct: b?.pct,
        count: b?.count,
      }));
      console.info("[PTRS Dashboard] Band inputs:", bandDebug);
    } catch (e) {
      console.warn("[PTRS Dashboard] Failed to log band inputs:", e);
    }
  }

  const nf = new Intl.NumberFormat("en-US", { useGrouping: true });
  const n2 = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });
  const n0 = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  });
  const formatWithSpace = (str) => str.replace(/,/g, " ");
  const fmt = (v) =>
    v == null || Number.isNaN(Number(v))
      ? "—"
      : formatWithSpace(nf.format(Number(v)));
  const fmt2 = (v) =>
    v == null || Number.isNaN(Number(v))
      ? "—"
      : formatWithSpace(n2.format(Number(v)));
  const fmtPct = (v) =>
    v == null || Number.isNaN(Number(v))
      ? "—"
      : `${formatWithSpace(n2.format(Number(v)))}%`;
  const fmtMoney = (v) =>
    v == null || Number.isNaN(Number(v))
      ? "—"
      : `$${formatWithSpace(n0.format(Number(v)))}`;

  // Report-aligned band percentages derived from invoiceBands
  const bandBy = (label) => metrics.invoiceBands.find((b) => b.label === label);
  const within30Pct = (() => {
    const b = bandBy("0–30");
    return b && b.pct != null ? Number(b.pct) * 100 : null;
  })();
  const in31to60Pct = (() => {
    const b = bandBy("31–60");
    return b && b.pct != null ? Number(b.pct) * 100 : null;
  })();
  const over60Pct = (() => {
    const b1 = bandBy("61–90");
    const b2 = bandBy("90+");
    const v1 = b1 && b1.pct != null ? Number(b1.pct) : 0;
    const v2 = b2 && b2.pct != null ? Number(b2.pct) : 0;
    const sum = (v1 + v2) * 100;
    return sum > 0 ? sum : b1 || b2 ? 0 : null;
  })();

  // Log missing fields with reason and metrics values (dev only)
  if (process.env.NODE_ENV !== "production") {
    [
      "invoicesPaidWithin30Days",
      "valuePaidWithin30Days",
      "avgDays",
      "medianDays",
      "percentile80",
      "percentile95",
      "sbNumPayments",
      "sbValuePayments",
      "sbPeppolNum",
      "sbPeppolValue",
      "invoiceBands",
      "slowestPaidSuppliers",
      "lateSbRate",
    ].forEach((field) => {
      if (!(field in signals)) {
        console.warn(
          `[PTRS Dashboard] signals is missing field '${field}' (not present in object)`
        );
      } else if (signals[field] === undefined) {
        console.warn(
          `[PTRS Dashboard] signals field '${field}' is present but undefined`
        );
      } else if (signals[field] === null) {
        console.warn(
          `[PTRS Dashboard] signals field '${field}' is present but null`
        );
      }
    });

    Object.entries(metrics).forEach(([key, val]) => {
      console.log(`Metric '${key}' value:`, val);
    });
  }

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ color: theme.palette.primary.main }}>
          PTRS Dashboard
        </Typography>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="ptrs-period-select-label">
            Reporting Period
          </InputLabel>
          <Select
            labelId="ptrs-period-select-label"
            id="ptrs-period-select"
            value={selectedPeriod?.key || "all"}
            label="Reporting Period"
            onChange={(e) => setPeriodByKey(e.target.value)}
          >
            {periodOptions.map((p) => (
              <MenuItem
                key={p.key}
                value={p.key}
                disabled={p.key !== "all" && (!p.start || !p.end)}
              >
                {p.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<DownloadOutlinedIcon />}
          sx={{ mr: 2 }}
        >
          Export Board Pack
        </Button>
      </Box>
      {/* Report metrics */}
      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ color: theme.palette.primary.main, mb: 1.5 }}
      >
        Report metrics
      </Typography>

      {/* Payment terms */}
      <Typography
        variant="body2"
        sx={{ mb: 1, color: theme.palette.text.secondary }}
      >
        Payment terms
      </Typography>
      <Grid
        container
        spacing={1.5}
        mb={3}
        alignItems="stretch"
        sx={{ height: "100%" }}
      >
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            title="Most common payment term (statistical mode)"
            value={fmt(metrics.modeTerm)}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            title="Range of most common payment terms – minimum"
            value={fmt(metrics.termMin)}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            title="Range of most common payment terms – maximum"
            value={fmt(metrics.termMax)}
          />
        </Grid>
      </Grid>

      {/* Payment times */}
      <Typography
        variant="body2"
        sx={{ mb: 1, color: theme.palette.text.secondary }}
      >
        Payment times
      </Typography>
      <Grid
        container
        spacing={1.5}
        mb={4}
        alignItems="stretch"
        sx={{ height: "100%" }}
      >
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            title="Average payment time"
            value={fmt2(metrics.avgPaymentTime)}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            title="Median payment time"
            value={fmt(metrics.medianPaymentTime)}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            title="80th percentile payment time"
            value={fmt(metrics.percentile80)}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            title="95th percentile payment time"
            value={fmt(metrics.percentile95)}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            title="Percentage paid within payment terms (SB)"
            value={fmtPct(metrics.withinTermsPct)}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            title="Invoices paid within 30 days (%)"
            value={fmtPct(within30Pct)}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            title="Invoices paid in 31–60 days (%)"
            value={fmtPct(in31to60Pct)}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            title="Invoices paid over 60 days (%)"
            value={fmtPct(over60Pct)}
          />
        </Grid>
      </Grid>

      {/* Misc. */}
      <Typography
        variant="body2"
        sx={{ mb: 1, color: theme.palette.text.secondary }}
      >
        Misc.
      </Typography>
      <Grid
        container
        spacing={1.5}
        mb={4}
        alignItems="stretch"
        sx={{ height: "100%" }}
      >
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Small business trade credit payments as a % of total trade credit payments"
            value={fmtPct(metrics.sbValuePctOfTotal)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="% of Peppol enabled small business procurement"
            value={fmtPct(metrics.sbPeppolPct)}
          />
        </Grid>
      </Grid>

      {/* Additional metrics */}
      <Typography
        variant="body2"
        sx={{ mb: 1, color: theme.palette.text.secondary }}
      >
        Additional metrics
      </Typography>
      <Grid
        container
        spacing={1.5}
        mb={4}
        alignItems="stretch"
        sx={{ height: "100%" }}
      >
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            title="Invoices paid within 30 days (count)"
            value={fmt(metrics.invoicesPaidWithin30Days)}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            title="Invoices paid within 30 days (value)"
            value={fmtMoney(metrics.valuePaidWithin30Days)}
          />
        </Grid>
      </Grid>

      {/* Supplier Risk & Opportunity Signals Section */}
      <Divider sx={{ my: 4, borderColor: theme.palette.divider }} />

      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ color: theme.palette.primary.main, mb: 2 }}
      >
        Supplier Risk &amp; Opportunity Signals
      </Typography>
      <Grid container spacing={1.5} alignItems="stretch">
        {/* 1. Median vs Avg Gap */}
        <Grid item xs={12} md={12}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              p: 1,
              boxShadow: theme.shadows[1],
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CardContent sx={{ width: "100%", height: "100%", p: 0 }}>
              <Grid container columns={20} spacing={1.5} sx={{ px: 1 }}>
                {/* Left: visual */}
                <Grid item xs={12} md={13}>
                  <Box
                    sx={{
                      width: "100%",
                      minHeight: 130,
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "flex-start",
                      gap: 1.25,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ color: theme.palette.text.primary, mb: 1 }}
                    >
                      Median vs average payment time gap
                    </Typography>
                    {/* Horizontal bar with two markers */}
                    <Box
                      sx={{
                        width: "100%",
                        height: 14,
                        backgroundColor: theme.palette.grey[300],
                        borderRadius: 7,
                        position: "relative",
                        mt: 3.5,
                        mb: 1.5,
                      }}
                    >
                      {/* Median marker (blue) at 25% */}
                      <Box
                        sx={{
                          position: "absolute",
                          left: "25%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          border: `2px solid ${theme.palette.primary.main}`,
                          backgroundColor: "#fff",
                          zIndex: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: theme.palette.primary.main,
                          }}
                        />
                      </Box>
                      {/* Avg marker (red) at 45% */}
                      <Box
                        sx={{
                          position: "absolute",
                          left: "45%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          border: `2px solid ${theme.palette.error.main}`,
                          backgroundColor: "#fff",
                          zIndex: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: theme.palette.error.main,
                          }}
                        />
                      </Box>
                      {/* Labels above markers */}
                      <Typography
                        variant="caption"
                        sx={{
                          position: "absolute",
                          left: "25%",
                          top: -18,
                          transform: "translateX(-50%)",
                          color: theme.palette.text.secondary,
                          fontSize: "0.7rem",
                        }}
                      >
                        {signals.medianDays != null
                          ? `Median: ${Math.ceil(Number(signals.medianDays))} days`
                          : "Median: —"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          position: "absolute",
                          left: "45%",
                          top: -18,
                          transform: "translateX(-50%)",
                          color: theme.palette.text.secondary,
                          fontSize: "0.7rem",
                        }}
                      >
                        {signals.avgDays != null
                          ? `Average: ${Math.ceil(Number(signals.avgDays))} days`
                          : "Average: —"}
                      </Typography>
                    </Box>
                    {/* Gap label */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5,
                        width: "70%",
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          mt: 1,
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                          fontSize: "1.05rem",
                        }}
                      >
                        {signals.avgDays != null && signals.medianDays != null
                          ? `+${Math.ceil(parseFloat(signals.avgDays) - parseFloat(signals.medianDays))} days`
                          : "—"}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                {/* Spacer for 65/5/30 layout */}
                <Grid
                  item
                  md={1}
                  sx={{ display: { xs: "none", md: "block" } }}
                />
                {/* Right: explanation */}
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 0.5, color: theme.palette.text.secondary }}
                  >
                    How to read this
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.primary,
                      mb: 0.75,
                      fontSize: "0.85rem",
                    }}
                  >
                    Shows how far the average sits above the typical result. A
                    large positive gap usually means a small number of very late
                    invoices are dragging the average up while the median stays
                    lower.
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Definition: <b>gap</b> = average days − median days.
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        {/* 2+3. SB late rate + Top 5 slowest-paid SBs (combined) */}
        {/* 2. SB invoices paid on time (with scenarios) */}
        <Grid item xs={12} md={12}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              p: 1,
              boxShadow: theme.shadows[1],
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CardContent sx={{ width: "100%", height: "100%", p: 0 }}>
              <Grid container columns={20} spacing={1.5} sx={{ px: 1 }}>
                {/* Left: three-line on-time chart */}
                <Grid item xs={12} md={13}>
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.25,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ color: theme.palette.text.primary, mb: 1 }}
                    >
                      Small business invoices paid on time
                    </Typography>
                    {(() => {
                      const onTimeNow = Math.max(
                        0,
                        Math.min(
                          100,
                          (1 - Number(metrics.lateSbRate || 0)) * 100
                        )
                      );
                      const onTime6d =
                        metrics.whatIfOnTimePct != null
                          ? Number(metrics.whatIfOnTimePct)
                          : null;
                      const onTimeAvg =
                        metrics.whatIfAvgOnTimePct != null
                          ? Number(metrics.whatIfAvgOnTimePct)
                          : null;
                      const rows = [
                        { label: "Current", value: onTimeNow },
                        {
                          label: `If paid ${Number(metrics.whatIfDaysEarlier ?? 6)} days earlier`,
                          value: onTime6d,
                        },
                      ];
                      if (
                        metrics.avgDaysLateCeil != null &&
                        onTimeAvg != null
                      ) {
                        rows.push({
                          label: `If paid within average days late (${Number(metrics.avgDaysLateCeil)} days)`,
                          value: onTimeAvg,
                        });
                      }
                      return (
                        <>
                          {rows.map((r, idx) => (
                            <Box
                              key={`ontime-row-${idx}`}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Box
                                aria-label={`${r.label}: ${r.value != null ? Math.max(0, Math.min(100, r.value)).toFixed(0) + "%" : "no data"}`}
                                sx={{
                                  flex: 1,
                                  height: 20,
                                  borderRadius: 6,
                                  backgroundColor: theme.palette.grey[300],
                                  position: "relative",
                                  mb: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: `${r.value != null ? Math.max(0, Math.min(100, r.value)).toFixed(0) : 0}%`,
                                    borderRadius: 6,
                                    backgroundColor:
                                      idx === 0
                                        ? theme.palette.primary.main
                                        : idx === 1
                                          ? theme.palette.success.main
                                          : theme.palette.info.main,
                                    transition: "width 280ms ease",
                                  }}
                                />
                                <Typography
                                  aria-hidden
                                  variant="caption"
                                  sx={{
                                    position: "absolute",
                                    right: 6,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: theme.palette.grey[600],
                                    fontWeight: 600,
                                  }}
                                >
                                  {r.value != null
                                    ? `${Math.max(0, Math.min(100, r.value)).toFixed(0)}%`
                                    : ""}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              mt: 1,
                              justifyContent: "center",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  backgroundColor: theme.palette.primary.main,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ color: theme.palette.text.secondary }}
                              >
                                Current
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  backgroundColor: theme.palette.success.main,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ color: theme.palette.text.secondary }}
                              >
                                If paid {Number(metrics.whatIfDaysEarlier ?? 6)}{" "}
                                days earlier
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  backgroundColor: theme.palette.info.main,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ color: theme.palette.text.secondary }}
                              >
                                If paid within average days late (
                                {Number(metrics.avgDaysLateCeil)} days across
                                all entities)
                              </Typography>
                            </Box>
                          </Box>
                        </>
                      );
                    })()}
                  </Box>
                </Grid>
                {/* Spacer for 65/5/30 layout */}
                <Grid
                  item
                  md={1}
                  sx={{ display: { xs: "none", md: "block" } }}
                />
                {/* Right: explanation */}
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 0.5, color: theme.palette.text.secondary }}
                  >
                    How to read this
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.primary,
                      mb: 0.75,
                      fontSize: "0.85rem",
                    }}
                  >
                    We track the share of <b>small‑business</b> invoices paid{" "}
                    <b>on time</b> (within the agreed term). The two scenarios
                    estimate how that on‑time rate would change if processing
                    improved.
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      display: "block",
                      mb: 0.25,
                    }}
                  >
                    • Current on‑time = 100% − late rate.
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      display: "block",
                      mb: 0.25,
                    }}
                  >
                    •{" "}
                    <b>
                      If paid {Number(metrics.whatIfDaysEarlier ?? 6)} days
                      earlier
                    </b>{" "}
                    simulates bringing each payment forward by that many days
                    (no other changes).
                  </Typography>
                  {metrics.avgDaysLateCeil != null && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        display: "block",
                      }}
                    >
                      •{" "}
                      <b>
                        If paid within {Number(metrics.avgDaysLateCeil)} days of
                        term
                      </b>{" "}
                      assumes late payments are capped at the rounded average
                      days late.
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 4. SB Spend by Invoice Band */}
        <Grid item xs={12} md={12}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              p: 1,
              boxShadow: theme.shadows[1],
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CardContent sx={{ width: "100%", height: "100%", p: 0 }}>
              <Grid container columns={20} spacing={1.5} sx={{ px: 1 }}>
                {/* Left: chart */}
                <Grid item xs={12} md={13}>
                  <Box
                    sx={{
                      width: "100%",
                      minHeight: 140,
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      px: 2,
                      py: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: theme.palette.text.primary,
                        mb: 1,
                        alignSelf: "flex-start",
                      }}
                    >
                      SB invoices by payment‑time band (count)
                    </Typography>
                    {/* Discrete vertical bars per band with fixed-height track */}
                    {/* Only show three bands: 0–30, 31–60, 60+ (combining 61–90 and 90+) */}
                    <Box
                      sx={{
                        width: "100%",
                        height: 200,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        gap: 2.5,
                        mb: 0,
                      }}
                    >
                      {(() => {
                        // Prepare three bands: 0–30, 31–60, 60+
                        const bandsRaw = Array.isArray(metrics.invoiceBands)
                          ? metrics.invoiceBands
                          : [];
                        // Find the bands by label
                        const band0_30 = bandsRaw.find(
                          (b) => b.label === "0–30"
                        ) || { label: "0–30", count: 0, pct: 0 };
                        const band31_60 = bandsRaw.find(
                          (b) => b.label === "31–60"
                        ) || { label: "31–60", count: 0, pct: 0 };
                        // Combine 61–90 and 90+ into 60+
                        const band61_90 = bandsRaw.find(
                          (b) => b.label === "61–90"
                        ) || { count: 0, pct: 0 };
                        const band90p = bandsRaw.find(
                          (b) => b.label === "90+"
                        ) || { count: 0, pct: 0 };
                        const band60p = {
                          label: "60+",
                          count:
                            (Number(band61_90.count) || 0) +
                            (Number(band90p.count) || 0),
                          pct:
                            (Number(band61_90.pct) || 0) +
                            (Number(band90p.pct) || 0),
                        };
                        const bands = [band0_30, band31_60, band60p];
                        return bands.map((band, idx) => {
                          const raw = Number(band.pct) || 0;
                          const pct = raw > 1 ? raw : raw * 100;
                          const h = Math.max(2, Math.min(100, Math.round(pct)));
                          return (
                            <Box
                              key={`band-vbar-${band.label}-${idx}`}
                              sx={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}
                            >
                              {/* Count badge above */}
                              <Typography
                                variant="caption"
                                sx={{
                                  px: 0.75,
                                  py: 0.25,
                                  mb: 0.75,
                                  borderRadius: 10,
                                  backgroundColor:
                                    theme.palette.background.paper,
                                  boxShadow: 1,
                                  color: theme.palette.text.secondary,
                                  fontWeight: 600,
                                }}
                              >
                                {band.count != null
                                  ? nf.format(Number(band.count))
                                  : "—"}
                              </Typography>
                              {/* Capsule track with gradient fill and in-bar % label */}
                              <Tooltip
                                title={`${band.label}: ${band.count != null ? nf.format(Number(band.count)) : "—"} (${pct.toFixed(1)}%)`}
                                arrow
                              >
                                <Box
                                  aria-label={`${band.label}: ${band.count != null ? nf.format(Number(band.count)) : "—"} (${pct.toFixed(1)}%)`}
                                  sx={{
                                    width: 72,
                                    height: 110,
                                    position: "relative",
                                    backgroundColor: theme.palette.grey[200],
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    boxShadow: 1,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      position: "absolute",
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      height: `${h}%`,
                                      transition: "height 320ms ease",
                                      background:
                                        idx === 0
                                          ? `linear-gradient(180deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`
                                          : idx === 1
                                            ? `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark || theme.palette.primary.main})`
                                            : `linear-gradient(180deg, ${theme.palette.grey[600]}, ${theme.palette.grey[700] || theme.palette.grey[600]})`,
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      position: "absolute",
                                      top: "50%",
                                      left: "50%",
                                      transform: "translate(-50%, -50%)",
                                      color: theme.palette.text.primary,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {`${pct.toFixed(1)}%`}
                                  </Typography>
                                </Box>
                              </Tooltip>
                              {/* Label under bar */}
                              <Typography
                                variant="body2"
                                sx={{
                                  color: theme.palette.text.primary,
                                  mt: 1,
                                  mb: 0.25,
                                  fontSize: "0.9rem",
                                  fontWeight: 600,
                                }}
                              >
                                {band.label}
                              </Typography>
                            </Box>
                          );
                        });
                      })()}
                    </Box>
                    {/* Legend: Only three entries */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        mt: 1,
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: theme.palette.primary.light,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          0–30 days
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: theme.palette.primary.main,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          31–60 days
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: theme.palette.grey[600],
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          60+ days
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Spacer for 65/5/30 layout */}
                <Grid
                  item
                  md={1}
                  sx={{ display: { xs: "none", md: "block" } }}
                />
                {/* Right: explanation */}
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 0.5, color: theme.palette.text.secondary }}
                  >
                    What this shows
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.primary,
                      mb: 0.75,
                      fontSize: "0.85rem",
                    }}
                  >
                    Counts of <b>small‑business</b> invoices grouped by how long
                    they took to be paid, using three bands:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      display: "block",
                      mb: 0.25,
                    }}
                  >
                    • 0–30 = paid within 30 days (on‑time for a 30‑day term).
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      display: "block",
                      mb: 0.25,
                    }}
                  >
                    • 31–60 = paid in the second month.
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      display: "block",
                    }}
                  >
                    • 60+ = paid more than 60 days after issue (late).
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      display: "block",
                    }}
                  >
                    • Percentages are the share of SB invoices in each band.
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
