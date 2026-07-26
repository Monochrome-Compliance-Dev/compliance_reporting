import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import PublicPageLayout, {
  PublicContent,
  PublicPageSection,
  PublicSurface,
} from "shared/layouts/PublicPageLayout";

const COMPANY_DATA_BASE_URL = "/data/regulator-payment-times/companies";

function formatAbn(abn) {
  if (!abn || abn.length !== 11) {
    return abn;
  }

  return [abn.slice(0, 2), abn.slice(2, 5), abn.slice(5, 8), abn.slice(8)].join(
    " ",
  );
}

function createUtcDate(dateValue) {
  const match = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;

  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not reported";
  }

  const date = createUtcDate(dateValue);

  if (!date) {
    return "Not reported";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatMonthYear(dateValue) {
  if (!dateValue) {
    return "Not reported";
  }

  const date = createUtcDate(dateValue);

  if (!date) {
    return "Not reported";
  }

  return new Intl.DateTimeFormat("en-AU", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDays(value) {
  if (value === null || value === undefined) {
    return "Not reported";
  }

  return `${Number(value).toFixed(1)} days`;
}

function formatPercent(value) {
  if (value === null || value === undefined) {
    return "Not reported";
  }

  return `${Number(value).toFixed(1)}%`;
}

function formatRank(rank, total) {
  if (!rank || !total) {
    return "Not available";
  }

  return `${Number(rank).toLocaleString("en-AU")} of ${Number(
    total,
  ).toLocaleString("en-AU")}`;
}

function calculateIndustryPosition(rank, count) {
  const numericRank = Number(rank);
  const numericCount = Number(count);

  if (
    !Number.isFinite(numericRank) ||
    !Number.isFinite(numericCount) ||
    numericCount <= 1
  ) {
    return null;
  }

  return Math.min(
    Math.max(((numericRank - 1) / (numericCount - 1)) * 100, 0),
    100,
  );
}

function buildTrendPoints(
  reports,
  width,
  height,
  horizontalPadding,
  verticalPadding,
) {
  const values = reports.map((report) => Number(report.p95PaymentTimeDays));

  if (values.length < 2 || values.some((value) => !Number.isFinite(value))) {
    return [];
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;
  const usableWidth = width - horizontalPadding * 2;
  const usableHeight = height - verticalPadding * 2;

  return values.map((value, index) => ({
    value,
    x:
      horizontalPadding +
      (index * usableWidth) / Math.max(values.length - 1, 1),
    y: verticalPadding + ((maximum - value) / range) * usableHeight,
  }));
}

function MetricCard({ label, value, description }) {
  const theme = useTheme();

  return (
    <PublicSurface
      sx={{
        width: "100%",
        height: "100%",
      }}
    >
      <Stack spacing={1}>
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 800,
            letterSpacing: 1.2,
          }}
        >
          {label}
        </Typography>

        <Typography
          variant="h5"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 800,
          }}
        >
          {value}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            lineHeight: 1.7,
          }}
        >
          {description}
        </Typography>
      </Stack>
    </PublicSurface>
  );
}

function PaymentBucketRow({ label, value }) {
  const theme = useTheme();
  const numericValue = Number(value) || 0;

  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 500,
          }}
        >
          {label}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 700,
          }}
        >
          {formatPercent(value)}
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={Math.min(Math.max(numericValue, 0), 100)}
        sx={{
          height: 8,
          borderRadius: 999,
          backgroundColor: alpha(theme.palette.primary.main, 0.16),
          "& .MuiLinearProgress-bar": {
            borderRadius: 999,
            backgroundColor: theme.palette.primary.main,
          },
        }}
      />
    </Stack>
  );
}

function IndustryPositionCard({ company, latestReport }) {
  const theme = useTheme();

  const industryPosition = calculateIndustryPosition(
    latestReport.industryP95Position?.rank,
    latestReport.industryP95Position?.count,
  );

  return (
    <PublicSurface
      sx={{
        height: "100%",
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography
            component="h2"
            variant="h5"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 700,
            }}
          >
            Industry position
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: theme.palette.text.secondary,
            }}
          >
            {company.industryDivision}
          </Typography>
        </Box>

        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 1.25 }}
          >
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              Faster-paying
            </Typography>

            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              Slower-paying
            </Typography>
          </Stack>

          <Box
            sx={{
              position: "relative",
              height: 18,
              borderRadius: 999,
              backgroundColor: alpha(
                theme.palette.primary.main,
                theme.palette.mode === "dark" ? 0.28 : 0.12,
              ),
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                right: "80%",
                borderRadius: "999px 0 0 999px",
                backgroundColor: alpha(
                  theme.palette.success.main,
                  theme.palette.mode === "dark" ? 0.55 : 0.28,
                ),
              }}
            />

            <Box
              sx={{
                position: "absolute",
                inset: 0,
                left: "80%",
                borderRadius: "0 999px 999px 0",
                backgroundColor: alpha(
                  theme.palette.error.main,
                  theme.palette.mode === "dark" ? 0.5 : 0.24,
                ),
              }}
            />

            <Box
              sx={{
                position: "absolute",
                top: -6,
                bottom: -6,
                left: "20%",
                width: 2,
                borderRadius: 999,
                backgroundColor: theme.palette.text.secondary,
                opacity: theme.palette.mode === "dark" ? 0.9 : 0.65,
                transform: "translateX(-50%)",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                top: -6,
                bottom: -6,
                left: "80%",
                width: 2,
                borderRadius: 999,
                backgroundColor: theme.palette.text.secondary,
                opacity: theme.palette.mode === "dark" ? 0.9 : 0.65,
                transform: "translateX(-50%)",
              }}
            />

            {industryPosition !== null && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: `${industryPosition}%`,
                  width: 18,
                  height: 18,
                  border: `3px solid ${theme.palette.background.paper}`,
                  borderRadius: "50%",
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? theme.palette.primary.light
                      : theme.palette.primary.main,
                  boxShadow: theme.shadows[2],
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}
          </Box>

          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={2}
            sx={{ mt: 1.25 }}
          >
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              Top 20%
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {formatRank(
                latestReport.industryP95Position?.rank,
                latestReport.industryP95Position?.count,
              )}
            </Typography>

            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              Bottom 20%
            </Typography>
          </Stack>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            lineHeight: 1.6,
          }}
        >
          The dot shows the company&apos;s P95 position within its industry
          cohort. The shaded areas represent the fastest-paying and
          slowest-paying 20% of entities.
        </Typography>
      </Stack>
    </PublicSurface>
  );
}

function P95TrendChart({ reports }) {
  const theme = useTheme();
  const chronologicalReports = [...reports].reverse();
  const width = 720;
  const height = 230;
  const horizontalPadding = 44;
  const verticalPadding = 38;

  const points = buildTrendPoints(
    chronologicalReports,
    width,
    height,
    horizontalPadding,
    verticalPadding,
  );

  if (points.length < 2) {
    return null;
  }

  const polylinePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <PublicSurface>
      <Stack spacing={3}>
        <Box>
          <Typography
            component="h2"
            variant="h5"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 700,
            }}
          >
            P95 payment time trend
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: theme.palette.text.secondary,
            }}
          >
            95% of small business invoices were paid within this number of days.
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            overflowX: "auto",
          }}
        >
          <Box
            component="svg"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="P95 payment time trend"
            sx={{
              display: "block",
              width: "100%",
            }}
          >
            <line
              x1={horizontalPadding}
              y1={height - verticalPadding}
              x2={width - horizontalPadding}
              y2={height - verticalPadding}
              stroke={theme.palette.divider}
              strokeWidth="1"
            />

            <polyline
              points={polylinePoints}
              fill="none"
              stroke={theme.palette.primary.main}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point, index) => {
              const report = chronologicalReports[index];

              return (
                <g key={report.reportId}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="7"
                    fill={theme.palette.background.paper}
                    stroke={theme.palette.primary.main}
                    strokeWidth="4"
                  />

                  <text
                    x={point.x}
                    y={point.y - 16}
                    textAnchor="middle"
                    fill={theme.palette.text.primary}
                    fontSize="10"
                    fontWeight="700"
                  >
                    {point.value.toFixed(1)} days
                  </text>

                  <text
                    x={point.x}
                    y={height - 10}
                    textAnchor="middle"
                    fill={theme.palette.text.secondary}
                    fontSize="10"
                  >
                    {formatMonthYear(report.reportingPeriodEndDate)}
                  </text>
                </g>
              );
            })}
          </Box>
        </Box>
      </Stack>
    </PublicSurface>
  );
}

function RegulatorPaymentTimesCompanyPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { companySlug } = useParams();
  const { showAlert } = useAlert();

  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCompany() {
      try {
        setIsLoading(true);

        const response = await fetch(
          `${COMPANY_DATA_BASE_URL}/${companySlug}.json`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Company request failed with status ${response.status}`,
          );
        }

        const data = await response.json();

        if (
          !data ||
          typeof data !== "object" ||
          !data.businessName ||
          !Array.isArray(data.reports)
        ) {
          throw new Error("The Payment Times Explorer company data is invalid");
        }

        setCompany(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);

          showAlert(
            "The Payment Times Explorer company data could not be loaded.",
            "error",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadCompany();

    return () => {
      controller.abort();
    };
  }, [companySlug, showAlert]);

  const sortedReports = useMemo(() => {
    if (!company) {
      return [];
    }

    return [...company.reports].sort(
      (firstReport, secondReport) =>
        new Date(secondReport.reportingPeriodEndDate) -
        new Date(firstReport.reportingPeriodEndDate),
    );
  }, [company]);

  const latestReport = sortedReports[0];

  if (isLoading) {
    return (
      <PublicPageLayout>
        <PublicPageSection
          sx={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={26} />

            <Typography color="text.secondary">
              Loading Payment Times Explorer…
            </Typography>
          </Stack>
        </PublicPageSection>
      </PublicPageLayout>
    );
  }

  if (!company || !latestReport) {
    return (
      <PublicPageLayout>
        <PublicPageSection>
          <PublicContent maxWidth={760}>
            <Stack spacing={3} alignItems="flex-start">
              <Typography component="h1" variant="h3">
                Company not found
              </Typography>

              <Typography color="text.secondary">
                No Payment Times Explorer data could be found for this company.
              </Typography>

              <Button
                variant="contained"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate("/regulator-payment-times")}
              >
                Back to Payment Times Explorer
              </Button>
            </Stack>
          </PublicContent>
        </PublicPageSection>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout>
      <PublicPageSection
        sx={{
          pt: {
            xs: 4,
            md: 5,
          },
        }}
      >
        <PublicContent>
          <Stack spacing={{ xs: 4, md: 5 }}>
            <Box>
              <Button
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate("/regulator-payment-times")}
                sx={{ mb: 3 }}
              >
                Payment Times Explorer
              </Button>

              <Stack spacing={2}>
                <Typography
                  component="h1"
                  variant="h3"
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: {
                      xs: "1.8rem",
                      sm: "2.2rem",
                      md: "2.6rem",
                    },
                    fontWeight: 800,
                    lineHeight: 1.15,
                    overflowWrap: "anywhere",
                  }}
                >
                  {company.businessName}
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={{ xs: 1, sm: 3 }}
                  useFlexGap
                  flexWrap="wrap"
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                    }}
                  >
                    ABN {formatAbn(company.abn)}
                  </Typography>

                  {company.acnArbn && (
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.secondary,
                      }}
                    >
                      ACN/ARBN {company.acnArbn}
                    </Typography>
                  )}
                </Stack>

                {company.industryDivision && (
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                    }}
                  >
                    ANZSIC Industry Division: {company.industryDivision}
                  </Typography>
                )}

                <Typography
                  variant="body1"
                  sx={{
                    maxWidth: 800,
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                  }}
                >
                  Published payment performance for the reporting period ending{" "}
                  {formatMonthYear(latestReport.reportingPeriodEndDate)}.
                </Typography>

                {latestReport.revisedReport && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 600,
                    }}
                  >
                    This is the revised report published for the period.
                  </Typography>
                )}
              </Stack>
            </Box>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex" }}>
                <MetricCard
                  label="Average"
                  value={formatDays(latestReport.averagePaymentTimeDays)}
                  description="Average time taken to pay small business invoices."
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex" }}>
                <MetricCard
                  label="Median"
                  value={formatDays(latestReport.medianPaymentTimeDays)}
                  description="Half of small business invoices were paid within this time."
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex" }}>
                <MetricCard
                  label="P80"
                  value={formatDays(latestReport.p80PaymentTimeDays)}
                  description="80% of small business invoices were paid within this time."
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex" }}>
                <MetricCard
                  label="P95"
                  value={formatDays(latestReport.p95PaymentTimeDays)}
                  description="95% of small business invoices were paid within this time."
                />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 7 }}>
                <PublicSurface sx={{ height: "100%" }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography
                        component="h2"
                        variant="h5"
                        sx={{ fontWeight: 700 }}
                      >
                        Payment distribution
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        The proportion of small business invoices paid within
                        each timeframe.
                      </Typography>
                    </Box>

                    <PaymentBucketRow
                      label="Paid within 30 days"
                      value={latestReport.payments30DaysOrLess}
                    />

                    <PaymentBucketRow
                      label="Paid between 31 and 60 days"
                      value={latestReport.payments31To60Days}
                    />

                    <PaymentBucketRow
                      label="Paid after 60 days"
                      value={latestReport.paymentsMoreThan60Days}
                    />
                  </Stack>
                </PublicSurface>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <IndustryPositionCard
                  company={company}
                  latestReport={latestReport}
                />
              </Grid>
            </Grid>

            {sortedReports.length > 1 && (
              <P95TrendChart reports={sortedReports} />
            )}

            <PublicSurface>
              <Stack spacing={3}>
                <Box>
                  <Typography
                    component="h2"
                    variant="h5"
                    sx={{ fontWeight: 700 }}
                  >
                    Reporting history
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    Published results across each available reporting period.
                  </Typography>
                </Box>

                <Stack divider={<Divider flexItem />}>
                  {sortedReports.map((report) => (
                    <Grid
                      key={report.reportId}
                      container
                      spacing={2}
                      alignItems="center"
                      sx={{ py: 2 }}
                    >
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {formatMonthYear(report.reportingPeriodStartDate)} to{" "}
                          {formatMonthYear(report.reportingPeriodEndDate)}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            mt: 0.5,
                            color: theme.palette.text.secondary,
                          }}
                        >
                          Submitted {formatDate(report.submittedDate)}
                        </Typography>

                        {report.revisedReport && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              mt: 0.5,
                              color: theme.palette.text.secondary,
                            }}
                          >
                            Revised report
                          </Typography>
                        )}
                      </Grid>

                      <Grid size={{ xs: 4, md: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Average
                        </Typography>

                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {formatDays(report.averagePaymentTimeDays)}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 4, md: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Median
                        </Typography>

                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {formatDays(report.medianPaymentTimeDays)}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 4, md: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          P95
                        </Typography>

                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {formatDays(report.p95PaymentTimeDays)}
                        </Typography>
                      </Grid>
                    </Grid>
                  ))}
                </Stack>
              </Stack>
            </PublicSurface>

            <PublicSurface
              sx={{
                px: {
                  xs: 3,
                  sm: 4,
                  md: 5,
                },
                py: {
                  xs: 3.5,
                  md: 4,
                },
                backgroundColor: theme.palette.primary.main, //alpha(theme.palette.secondary.main, 0.06),
                borderColor: theme.palette.primary.main,
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
              >
                <Stack spacing={1}>
                  <Typography
                    component="h2"
                    variant="h5"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                    }}
                  >
                    Understand what is driving these results
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      maxWidth: 700,
                      color: theme.palette.text.primary,
                      lineHeight: 1.6,
                    }}
                  >
                    Monochrome Compliance helps businesses identify the
                    operational causes behind poor payment performance and
                    prepare their Payment Times Reporting Scheme submissions.
                  </Typography>
                </Stack>

                <Button
                  variant="outlined"
                  onClick={() => navigate("/contact")}
                  sx={{
                    flexShrink: 0,
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    "&:hover": {
                      backgroundColor: alpha(
                        theme.palette.background.paper,
                        0.9,
                      ),
                    },
                  }}
                >
                  Talk to us
                </Button>
              </Stack>
            </PublicSurface>

            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
              }}
            >
              Source: Australian Government Payment Times Reports Register
              Standard report data. Monochrome Compliance is not affiliated with
              or endorsed by the Australian Government or the Payment Times
              Reporting Regulator.
            </Typography>
          </Stack>
        </PublicContent>
      </PublicPageSection>
    </PublicPageLayout>
  );
}

export default RegulatorPaymentTimesCompanyPage;
