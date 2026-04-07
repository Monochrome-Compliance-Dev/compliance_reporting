import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Typography,
  useTheme,
} from "@mui/material";
import { useParams } from "react-router";
import ptrsReportDataSets from "./data/ptrsReportDataSets";

function formatDays(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(2)}d`;
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(2)}%`;
}

function formatWholeNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Math.round(Number(value))}%`;
}

function formatSignedDays(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";

  const numericValue = Number(value);
  const prefix = numericValue > 0 ? "+" : "";
  return `${prefix}${numericValue.toFixed(2)}d`;
}

function StatCard({ title, value, subtitle }) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: "100%",
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[1],
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 1,
          minHeight: 132,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: "0.75rem",
            lineHeight: 1.4,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 600,
            lineHeight: 1.1,
          }}
        >
          {value}
        </Typography>
        {subtitle ? (
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SectionHeading({ children }) {
  const theme = useTheme();

  return (
    <Typography
      variant="subtitle1"
      sx={{
        color: theme.palette.primary.main,
        fontWeight: 600,
        mb: 2,
      }}
    >
      {children}
    </Typography>
  );
}

function DistributionBar({ bands }) {
  const theme = useTheme();

  return (
    <Box>
      <Box
        sx={{
          width: "100%",
          height: 20,
          borderRadius: 999,
          overflow: "hidden",
          display: "flex",
          boxShadow: theme.shadows[1],
          backgroundColor: theme.palette.grey[300],
        }}
      >
        {bands.map((band, index) => (
          <Box
            key={band.label}
            sx={{
              width: `${band.value}%`,
              backgroundColor:
                index === 0
                  ? theme.palette.primary.light
                  : index === 1
                    ? theme.palette.primary.main
                    : theme.palette.secondary.main,
            }}
          />
        ))}
      </Box>

      <Grid container spacing={1} sx={{ mt: 1 }}>
        {bands.map((band) => (
          <Grid key={band.label} item xs={4}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  display: "block",
                }}
              >
                {band.label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatPercent(band.value)}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function DonutMetric({ label, value, color }) {
  const theme = useTheme();
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <Card
      sx={{
        height: "100%",
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[1],
      }}
    >
      <CardContent
        sx={{
          minHeight: 220,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, textAlign: "center" }}
        >
          {label}
        </Typography>

        <Box
          sx={{
            width: 112,
            height: 112,
            borderRadius: "50%",
            background: `conic-gradient(${color} 0 ${safeValue}%, ${theme.palette.grey[300]} ${safeValue}% 100%)`,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              backgroundColor: theme.palette.background.paper,
            }}
          />
          <Typography
            variant="h6"
            sx={{
              position: "absolute",
              fontWeight: 700,
              color: theme.palette.text.primary,
            }}
          >
            {formatWholeNumber(safeValue)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function P95RiskCard({ currentValue, previousValue }) {
  const theme = useTheme();
  const hasCurrentValue =
    currentValue != null && !Number.isNaN(Number(currentValue));
  const safeCurrentValue = hasCurrentValue
    ? Math.max(0, Math.min(120, Number(currentValue)))
    : 0;
  const markerPosition = `${(safeCurrentValue / 120) * 100}%`;
  const delta =
    hasCurrentValue &&
    previousValue != null &&
    !Number.isNaN(Number(previousValue))
      ? Number(currentValue) - Number(previousValue)
      : null;

  return (
    <Card
      sx={{
        height: "100%",
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[1],
      }}
    >
      <CardContent sx={{ minHeight: 240 }}>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, mb: 1 }}
        >
          95th percentile payment time
        </Typography>

        <Typography
          variant="h3"
          sx={{
            color: theme.palette.error.main,
            fontWeight: 700,
            lineHeight: 1,
            mb: 1,
          }}
        >
          {formatDays(currentValue)}
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, mb: 3 }}
        >
          This is the measure most likely to attract regulator attention when
          payment performance deteriorates at the tail.
        </Typography>

        <Box
          sx={{
            position: "relative",
            height: 18,
            borderRadius: 999,
            overflow: "hidden",
            display: "flex",
            backgroundColor: theme.palette.grey[300],
            mb: 1.5,
          }}
        >
          <Box
            sx={{ width: "25%", backgroundColor: theme.palette.success.main }}
          />
          <Box
            sx={{ width: "25%", backgroundColor: theme.palette.warning.light }}
          />
          <Box
            sx={{ width: "25%", backgroundColor: theme.palette.warning.main }}
          />
          <Box
            sx={{ width: "25%", backgroundColor: theme.palette.error.main }}
          />

          {hasCurrentValue ? (
            <Box
              sx={{
                position: "absolute",
                left: markerPosition,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: theme.palette.common.white,
                border: `3px solid ${theme.palette.text.primary}`,
                zIndex: 1,
              }}
            />
          ) : null}
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary }}
          >
            0d
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary }}
          >
            30d
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary }}
          >
            60d
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary }}
          >
            90d+
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          Previous cycle: {formatDays(previousValue)}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color:
              delta == null
                ? theme.palette.text.secondary
                : delta > 0
                  ? theme.palette.error.main
                  : theme.palette.success.main,
            fontWeight: 600,
            mt: 0.5,
          }}
        >
          Change: {formatSignedDays(delta)}
        </Typography>
      </CardContent>
    </Card>
  );
}

function RelativePositionCard({ currentValue, previousValue, note }) {
  const theme = useTheme();
  const hasComparison =
    currentValue != null &&
    previousValue != null &&
    !Number.isNaN(Number(currentValue)) &&
    !Number.isNaN(Number(previousValue));
  const directionText = !hasComparison
    ? "Comparison pending"
    : Number(currentValue) > Number(previousValue)
      ? "Worse than previous cycle"
      : Number(currentValue) < Number(previousValue)
        ? "Improved from previous cycle"
        : "Unchanged from previous cycle";

  return (
    <Card
      sx={{
        height: "100%",
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[1],
      }}
    >
      <CardContent
        sx={{
          minHeight: 240,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mb: 1 }}
          >
            Relative position from previous reporting cycle
          </Typography>
          <Typography
            variant="h5"
            sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 1 }}
          >
            {directionText}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            {note ||
              "Use this space to explain Veolia’s position relative to the previous cycle and the regulator’s current scrutiny settings."}
          </Typography>
        </Box>

        <Box>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            Current 95th percentile: {formatDays(currentValue)}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            Previous 95th percentile: {formatDays(previousValue)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function PtrsMetricsDashboard() {
  const theme = useTheme();
  const { reportKey } = useParams();
  const reportData =
    ptrsReportDataSets[reportKey] || ptrsReportDataSets.veolia2;
  const { header, computed, supplierSignals, quality } = reportData;
  const previousCycle = reportData.previousCycle || {};

  const paymentDistributionBands = [
    {
      label: "0–30 days",
      value: computed.payments30DaysOrLessPct,
    },
    {
      label: "31–60 days",
      value: computed.payments31To60DaysPct,
    },
    {
      label: "61+ days",
      value: computed.paymentsMoreThan60DaysPct,
    },
  ];

  const averageMedianGap =
    computed.averagePaymentTimeDays != null &&
    computed.medianPaymentTimeDays != null
      ? Number(computed.averagePaymentTimeDays) -
        Number(computed.medianPaymentTimeDays)
      : null;

  const previousCycleP95PaymentTimeDays =
    previousCycle.p95PaymentTimeDays ?? previousCycle.percentile95 ?? null;

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ color: theme.palette.primary.main, fontWeight: 700 }}
          >
            {header.businessName}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
          >
            {header.reportingPeriodLabel}: {header.reportingPeriodStartDate} to{" "}
            {header.reportingPeriodEndDate}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mt: 0.25 }}
          >
            Source: {header.datasetLabel}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<DownloadOutlinedIcon />}
          disabled
        >
          Export Board Pack
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average payment time"
            value={formatDays(computed.averagePaymentTimeDays)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Median payment time"
            value={formatDays(computed.medianPaymentTimeDays)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="80th percentile"
            value={formatDays(computed.p80PaymentTimeDays)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="95th percentile"
            value={formatDays(computed.p95PaymentTimeDays)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Small business invoices paid within payment terms"
            value={formatPercent(
              computed.percentageOfSbInvoicesPaidWithinPaymentTerm,
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Small business trade credit payment share"
            value={formatPercent(
              computed.percentageOfSmallBusinessTradeCreditPayments,
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Average vs median gap"
            value={
              averageMedianGap == null ? "—" : `${averageMedianGap.toFixed(2)}d`
            }
            subtitle="A larger gap can indicate a long-tail payment pattern"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4, borderColor: theme.palette.divider }} />

      <SectionHeading>Regulator risk signal</SectionHeading>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <P95RiskCard
            currentValue={computed.p95PaymentTimeDays}
            previousValue={previousCycleP95PaymentTimeDays}
          />
        </Grid>
        <Grid item xs={12} md={5}>
          <RelativePositionCard
            currentValue={computed.p95PaymentTimeDays}
            previousValue={previousCycleP95PaymentTimeDays}
            note={previousCycle.relativePositionNote}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4, borderColor: theme.palette.divider }} />

      <SectionHeading>Payment distribution</SectionHeading>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              height: "100%",
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[1],
            }}
          >
            <CardContent sx={{ minHeight: 220 }}>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mb: 2 }}
              >
                Share of payment times across the reporting population
              </Typography>
              <DistributionBar bands={paymentDistributionBands} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <DonutMetric
            label="Late payment rate (small business only)"
            value={Number(supplierSignals.lateSbRate || 0) * 100}
            color={theme.palette.error.main}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4, borderColor: theme.palette.divider }} />

      <SectionHeading>Supplier signals</SectionHeading>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Card
            sx={{
              height: "100%",
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[1],
            }}
          >
            <CardContent sx={{ minHeight: 260 }}>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mb: 2 }}
              >
                Top slowest-paid suppliers
              </Typography>

              {supplierSignals.slowestPaidSuppliers.length ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {supplierSignals.slowestPaidSuppliers.map(
                    (supplier, index) => (
                      <Box
                        key={`${supplier.name}-${index}`}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          py: 1,
                          borderBottom: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {supplier.name}
                          </Typography>
                          {supplier.abn ? (
                            <Typography
                              variant="caption"
                              sx={{ color: theme.palette.text.secondary }}
                            >
                              ABN: {supplier.abn}
                            </Typography>
                          ) : null}
                        </Box>
                        <Chip
                          label={formatDays(supplier.avgDays)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    ),
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    minHeight: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    No supplier signals added yet.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card
            sx={{
              height: "100%",
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[1],
            }}
          >
            <CardContent sx={{ minHeight: 260 }}>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mb: 2 }}
              >
                Report quality and notes
              </Typography>

              <Chip
                label={
                  quality.blocked ? "Blocked" : "Ready for report drafting"
                }
                color={quality.blocked ? "error" : "success"}
                sx={{ mb: 2, fontWeight: 600 }}
              />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {quality.notes.map((note, index) => (
                  <Typography
                    key={`quality-note-${index}`}
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    • {note}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
