import { useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useReportContext } from "../../../context";
import { dashboardService } from "../../../services/";
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

export default function PtrsDashboard() {
  const theme = useTheme();
  const { getDashboardSignals, getDashboardExtendedMetrics } = dashboardService;
  const { reportDetails } = useReportContext();
  const reportId = reportDetails?.[0]?.id;

  useEffect(() => {
    if (!reportId) return;

    const currentKey = `tcp_records_${reportId}`;
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("tcp_records_") && key !== currentKey) {
        sessionStorage.removeItem(key);
      }
    });
  }, [reportId]);
  //   console.log("Report ID:", reportId);

  const [signals, setSignals] = useState(null);

  useEffect(() => {
    const loadSignals = async () => {
      try {
        const [core, extended] = await Promise.all([
          getDashboardSignals(reportId),
          getDashboardExtendedMetrics(reportId),
        ]);
        const merged = { ...core, ...extended };
        console.log("Fetched dashboard signals:", merged);
        setSignals(merged);
      } catch (err) {
        console.error("Failed to fetch dashboard signals:", err);
      }
    };
    if (reportId) loadSignals();
  }, [reportId, getDashboardSignals, getDashboardExtendedMetrics]);

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
  };

  // Log missing fields with reason
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
          <InputLabel id="report-period-select-label">
            Reporting Period
          </InputLabel>
          <Select
            labelId="report-period-select-label"
            id="report-period-select"
            value=""
            label="Reporting Period"
          >
            <MenuItem value="jul-dec-2024">Jul–Dec 2024</MenuItem>
            <MenuItem value="jan-jun-2024">Jan–Jun 2024</MenuItem>
            <MenuItem value="jul-dec-2023">Jul–Dec 2023</MenuItem>
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
      <Grid
        container
        spacing={1.5}
        mb={4}
        alignItems="stretch"
        sx={{ height: "100%" }}
      >
        <Grid item xs={6} sm={4} md={2}>
          {console.log(
            "invoicesPaidWithin30Days",
            metrics.invoicesPaidWithin30Days
          )}
          <StatCard
            title="Invoices paid within 30 days"
            value={metrics.invoicesPaidWithin30Days}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          {console.log("valuePaidWithin30Days", metrics.valuePaidWithin30Days)}
          <StatCard
            title="Value of invoices paid within 30 days"
            value={metrics.valuePaidWithin30Days}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          {console.log("avgPaymentTime", metrics.avgPaymentTime)}
          <StatCard
            title="Average payment time"
            value={metrics.avgPaymentTime}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          {console.log("medianPaymentTime", metrics.medianPaymentTime)}
          <StatCard
            title="Median payment time"
            value={metrics.medianPaymentTime}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          {console.log("percentile80", metrics.percentile80)}
          <StatCard title="80th" value={metrics.percentile80} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          {console.log("percentile95", metrics.percentile95)}
          <StatCard title="95th" value={metrics.percentile95} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3, borderColor: theme.palette.divider }} />

      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ color: theme.palette.primary.main, mb: 2 }}
      >
        Proportion of Small Business Spend
      </Typography>
      <Grid
        container
        spacing={1.5}
        alignItems="stretch"
        sx={{ height: "100%" }}
      >
        <Grid item xs={6} sm={4} md={3}>
          {console.log("sbNumPayments", metrics.sbNumPayments)}
          <StatCard
            title="# Small Business Payments"
            value={metrics.sbNumPayments}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          {console.log("sbValuePayments", metrics.sbValuePayments)}
          <StatCard
            title="Value of SB Payments"
            value={metrics.sbValuePayments}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          {console.log("sbPeppolNum", metrics.sbPeppolNum)}
          <StatCard
            title="Peppol-enabled SB (Num)"
            value={metrics.sbPeppolNum}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          {console.log("sbPeppolValue", metrics.sbPeppolValue)}
          <StatCard
            title="Peppol-enabled SB (Value)"
            value={metrics.sbPeppolValue}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4, borderColor: theme.palette.divider }} />

      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ color: theme.palette.primary.main, mb: 2 }}
      >
        Visual Trends & Analysis
      </Typography>

      <Grid
        container
        spacing={1.5}
        alignItems="stretch"
        sx={{ height: "100%" }}
      >
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              p: 1,
              boxShadow: theme.shadows[1],
              minHeight: 160,
              maxHeight: 160,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent>
              {/* Mock bar chart */}
              <Box
                sx={{
                  height: 100,
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "flex-end",
                  pb: 0,
                }}
              >
                {[45, 20, 35].map((value, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      width: "15%",
                      height: `${value}%`,
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: 1,
                    }}
                  />
                ))}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-around",
                  mt: 1,
                }}
              >
                {["0–30", "31–60", "61+"].map((label, idx) => (
                  <Typography
                    key={idx}
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
          <Typography
            variant="body2"
            sx={{ mt: 1, fontSize: "0.75rem", textAlign: "center" }}
          >
            Payment Distribution
          </Typography>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              p: 1,
              boxShadow: theme.shadows[1],
              height: "100%",
              minHeight: 160,
              maxHeight: 160,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <CardContent>
              {/* Mock pie chart */}
              <Box
                sx={{
                  height: 140,
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    background: `conic-gradient(${theme.palette.primary.main} 35%, ${theme.palette.grey[300]} 0)`,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    position: "absolute",
                    color: "#000000",
                    fontSize: "0.875rem",
                  }}
                >
                  35%
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              fontSize: "0.75rem",
              textAlign: "center",
              color: theme.palette.text.secondary,
            }}
          >
            SB Spend Breakdown
          </Typography>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              p: 1,
              boxShadow: theme.shadows[1],
              height: "100%",
              minHeight: 160,
              maxHeight: 160,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <CardContent>
              {/* Mock donut chart for Late Payment Rate (SB Only) */}
              <Box
                sx={{
                  height: 140,
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    background: `conic-gradient(${theme.palette.error.main} 47%, ${theme.palette.grey[300]} 0)`,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    position: "absolute",
                    color: theme.palette.error.main,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  47%
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              fontSize: "0.75rem",
              textAlign: "center",
              color: theme.palette.error.main,
              fontWeight: 500,
            }}
          >
            Late Payment Rate (SB Only)
          </Typography>
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
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              p: 1,
              boxShadow: theme.shadows[1],
              minHeight: 160,
              maxHeight: 160,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CardContent sx={{ width: "100%", height: "100%", p: 0 }}>
              <Box
                sx={{
                  width: "100%",
                  height: 120,
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, color: theme.palette.text.secondary }}
                >
                  Median vs Avg Gap
                </Typography>
                {/* Horizontal bar with two markers */}
                <Box
                  sx={{
                    width: "90%",
                    height: 14,
                    backgroundColor: theme.palette.grey[300],
                    borderRadius: 7,
                    position: "relative",
                    mt: 1,
                    mb: 1,
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
                  {/* Median label */}
                  <Typography
                    variant="caption"
                    sx={{
                      position: "absolute",
                      left: "25%",
                      top: "110%",
                      transform: "translate(-50%, 0)",
                      color: theme.palette.text.primary,
                      fontSize: "0.7rem",
                    }}
                  >
                    Median
                  </Typography>
                  {/* Avg label */}
                  <Typography
                    variant="caption"
                    sx={{
                      position: "absolute",
                      left: "45%",
                      top: "110%",
                      transform: "translate(-50%, 0)",
                      color: theme.palette.text.secondary,
                      fontSize: "0.7rem",
                    }}
                  >
                    Avg
                  </Typography>
                </Box>
                {/* Gap label */}
                <Typography
                  variant="h6"
                  sx={{
                    mt: 2,
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    fontSize: "1.1rem",
                  }}
                >
                  {signals.avgDays != null && signals.medianDays != null
                    ? `+${(parseFloat(signals.avgDays) - parseFloat(signals.medianDays)).toFixed(1)}d`
                    : "—"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.7rem",
                    color: theme.palette.text.secondary,
                  }}
                >
                  {`(Avg: ${signals.avgDays ?? "—"}d, Median: ${signals.medianDays ?? "—"}d)`}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* 2. % of SB invoices paid late */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              p: 1,
              boxShadow: theme.shadows[1],
              minHeight: 160,
              maxHeight: 160,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CardContent sx={{ width: "100%", height: "100%", p: 0 }}>
              <Box
                sx={{
                  width: "100%",
                  height: 120,
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, color: theme.palette.text.secondary }}
                >
                  % of SB invoices paid late
                </Typography>
                {/* Donut chart */}
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    // Use error.main for late, and text.secondary for remainder for contrast in dark mode
                    background: `conic-gradient(${theme.palette.error.main} 0 ${(parseFloat(metrics.lateSbRate ?? 0) * 100).toFixed(0)}%, ${theme.palette.text.secondary} 0 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    mt: 1,
                  }}
                >
                  {/* Center circle */}
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      backgroundColor: theme.palette.background.paper,
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                  {/* Center label */}
                  <Typography
                    variant="h6"
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      fontSize: "1.1rem",
                    }}
                  >
                    {`${(parseFloat(metrics.lateSbRate ?? 0) * 100).toFixed(0)}%`}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* 3. Top 10 slowest-paid SBs */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              p: 1,
              boxShadow: theme.shadows[1],
              minHeight: 160,
              maxHeight: 160,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CardContent sx={{ width: "100%", height: "100%", p: 0 }}>
              <Box
                sx={{
                  width: "100%",
                  minHeight: 120,
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  px: 2,
                  py: 1.5,
                  maxHeight: 110,
                  overflowY: "auto",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, color: theme.palette.text.secondary }}
                >
                  Top 10 slowest-paid SBs
                </Typography>
                {/* List of Top 10 slowest-paid SBs */}
                {metrics.slowestPaidSuppliers.map((s, idx) => (
                  <Box
                    key={`slowest-paid-${s.payeeEntityAbn}-${idx}`}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      alignItems: "center",
                      py: 0.3,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.75rem",
                        color: theme.palette.text.primary,
                        fontWeight: 500,
                      }}
                    >
                      {s.payeeEntityAbn}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.75rem",
                        color: theme.palette.text.secondary,
                        fontWeight: 400,
                        ml: 2,
                      }}
                    >
                      {s.avgDays}d
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* 4. SB Spend by Invoice Band */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              p: 1,
              boxShadow: theme.shadows[1],
              minHeight: 160,
              maxHeight: 160,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CardContent sx={{ width: "100%", height: "100%", p: 0 }}>
              <Box
                sx={{
                  width: "100%",
                  minHeight: 120,
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
                  color={theme.palette.text.primary}
                  sx={{ mb: 1 }}
                >
                  SB Spend by Invoice Band
                </Typography>
                {/* Horizontal bar split by size band */}
                <Box
                  sx={{
                    width: "90%",
                    height: 18,
                    display: "flex",
                    flexDirection: "row",
                    borderRadius: 9,
                    overflow: "hidden",
                    boxShadow: 1,
                    mb: 1.5,
                  }}
                >
                  {metrics.invoiceBands.map((band, idx) =>
                    band.pct != null ? (
                      <Box
                        key={`band-${band.label}-${idx}`}
                        sx={{
                          flex: `0 0 ${band.pct}%`,
                          backgroundColor:
                            idx === 0
                              ? theme.palette.primary.light
                              : idx === 1
                                ? theme.palette.primary.main
                                : idx === 2
                                  ? theme.palette.secondary.main
                                  : theme.palette.grey[500],
                          height: "100%",
                        }}
                      />
                    ) : null
                  )}
                </Box>
                {/* Bands labels */}
                <Box
                  sx={{
                    width: "90%",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  {signals.invoiceBands.map((band, idx) => (
                    <Typography
                      key={`band-${band.label}-${idx}`}
                      variant="caption"
                      sx={{
                        fontSize: "0.7rem",
                        color: theme.palette.text.secondary,
                        width: `${band.pct}%`,
                        textAlign:
                          idx === 0
                            ? "left"
                            : idx === signals.invoiceBands.length - 1
                              ? "right"
                              : "center",
                      }}
                    >
                      {band.label}
                    </Typography>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
