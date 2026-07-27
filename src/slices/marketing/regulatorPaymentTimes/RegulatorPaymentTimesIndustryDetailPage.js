import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
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

const INDUSTRY_DATA_BASE_URL = "/data/regulator-payment-times/industries";
const REGULATOR_REGISTER_URL =
  "https://register.paymenttimes.gov.au/index.html";

function createUtcDate(dateValue) {
  const match = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;

  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
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

function formatReportingCycle(cycle) {
  if (cycle.reportingCycleName) {
    return cycle.reportingCycleName;
  }

  if (cycle.reportingCycleStartDate && cycle.reportingCycleEndDate) {
    return `${formatMonthYear(
      cycle.reportingCycleStartDate,
    )} to ${formatMonthYear(cycle.reportingCycleEndDate)}`;
  }

  return cycle.reportingCycleId || "Reporting cycle";
}

function formatDays(value) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "Not reported";
  }

  return `${Number(value).toFixed(1)} days`;
}

function formatWholeDays(value) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "Not reported";
  }

  return `${Number(value).toLocaleString("en-AU")} days`;
}

function formatInteger(value) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "Not reported";
  }

  return Number(value).toLocaleString("en-AU");
}

function normaliseIndustry(data) {
  return {
    slug: data.slug,
    industryDivision: data.industryDivision,
    latestReportingCycleId: data.latestReportingCycleId,
    cycles: [...data.cycles]
      .map((cycle) => ({
        reportingCycleId: cycle.reportingCycleId,
        reportingCycleName: cycle.reportingCycleName,
        reportingCycleStartDate: cycle.reportingCycleStartDate,
        reportingCycleEndDate: cycle.reportingCycleEndDate,
        reportingEntityCount: Number(cycle.reportingEntityCount),
        averageP95PaymentTimeDays: Number(cycle.averageP95PaymentTimeDays),
        medianP95PaymentTimeDays: Number(cycle.medianP95PaymentTimeDays),
        minimumP95PaymentTimeDays: Number(cycle.minimumP95PaymentTimeDays),
        maximumP95PaymentTimeDays: Number(cycle.maximumP95PaymentTimeDays),
      }))
      .sort((firstCycle, secondCycle) =>
        firstCycle.reportingCycleId.localeCompare(secondCycle.reportingCycleId),
      ),
  };
}

function getHeadlineCycle(cycles) {
  if (cycles.length === 0) {
    return null;
  }

  if (cycles.length === 1) {
    return cycles[0];
  }

  const latestCycle = cycles[cycles.length - 1];
  const previousCycle = cycles[cycles.length - 2];

  const latestCount = Number(latestCycle.reportingEntityCount);
  const previousCount = Number(previousCycle.reportingEntityCount);

  const latestAppearsIncomplete =
    Number.isFinite(latestCount) &&
    Number.isFinite(previousCount) &&
    previousCount > 0 &&
    latestCount < previousCount * 0.6;

  return latestAppearsIncomplete ? previousCycle : latestCycle;
}

function getIncompleteCycleNotice(cycles) {
  if (cycles.length < 2) {
    return null;
  }

  const latestCycle = cycles[cycles.length - 1];
  const previousCycle = cycles[cycles.length - 2];

  const latestCount = Number(latestCycle.reportingEntityCount);
  const previousCount = Number(previousCycle.reportingEntityCount);

  if (
    !Number.isFinite(latestCount) ||
    !Number.isFinite(previousCount) ||
    previousCount <= 0 ||
    latestCount >= previousCount * 0.6
  ) {
    return null;
  }

  return {
    latestCycle,
    previousCycle,
  };
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

function P95TrendChart({ cycles }) {
  const theme = useTheme();

  const chartData = cycles.filter(
    (cycle) =>
      Number.isFinite(cycle.medianP95PaymentTimeDays) &&
      Number.isFinite(cycle.averageP95PaymentTimeDays),
  );

  if (chartData.length < 2) {
    return null;
  }

  const p95Values = chartData.flatMap((cycle) => [
    cycle.medianP95PaymentTimeDays,
    cycle.averageP95PaymentTimeDays,
  ]);

  const lowestP95Value = Math.min(...p95Values);
  const highestP95Value = Math.max(...p95Values);
  const p95Range = Math.max(highestP95Value - lowestP95Value, 10);

  const yAxisMinimum = Math.max(
    0,
    Math.floor(lowestP95Value - p95Range * 0.15),
  );

  const yAxisMaximum = Math.ceil(highestP95Value + p95Range * 0.15);

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
            P95 payment times over time
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              maxWidth: 850,
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
            }}
          >
            The median shows the middle industry result. The average can be more
            heavily affected by unusually high or low reported results.
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            overflowX: "auto",
          }}
        >
          <Box
            sx={{
              minWidth: 650,
              height: 380,
              "& .MuiChartsAxis-tickLabel": {
                fill: theme.palette.text.secondary,
              },
              "& .MuiChartsAxis-line": {
                stroke: theme.palette.divider,
              },
              "& .MuiChartsAxis-tick": {
                stroke: theme.palette.divider,
              },
              "& .MuiChartsGrid-line": {
                stroke: alpha(theme.palette.divider, 0.65),
              },
            }}
          >
            <LineChart
              height={380}
              margin={{
                top: 30,
                right: 65,
                bottom: 50,
                left: 50,
              }}
              xAxis={[
                {
                  scaleType: "point",
                  data: chartData.map((cycle) => formatReportingCycle(cycle)),
                },
              ]}
              yAxis={[
                {
                  width: 70,
                  min: yAxisMinimum,
                  max: yAxisMaximum,
                  valueFormatter: (value) => `${value} days`,
                },
              ]}
              series={[
                {
                  id: "median-p95",
                  label: "Median P95",
                  data: chartData.map(
                    (cycle) => cycle.medianP95PaymentTimeDays,
                  ),
                  valueFormatter: (value) => formatDays(value),
                  color: theme.palette.primary.main,
                  curve: "linear",
                  showMark: true,
                },
                {
                  id: "average-p95",
                  label: "Average P95",
                  data: chartData.map(
                    (cycle) => cycle.averageP95PaymentTimeDays,
                  ),
                  valueFormatter: (value) => formatDays(value),
                  color: theme.palette.secondary.main,
                  curve: "linear",
                  showMark: true,
                },
              ]}
              grid={{
                horizontal: true,
              }}
            />
          </Box>
        </Box>
      </Stack>
    </PublicSurface>
  );
}

function EntityCountChart({ cycles }) {
  const theme = useTheme();

  const chartData = cycles.filter((cycle) =>
    Number.isFinite(cycle.reportingEntityCount),
  );

  if (chartData.length === 0) {
    return null;
  }

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
            Reporting entities over time
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              maxWidth: 850,
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
            }}
          >
            The number of published Standard reports represented in each
            industry reporting cycle.
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            overflowX: "auto",
          }}
        >
          <Box
            sx={{
              minWidth: 650,
              height: 350,
              "& .MuiChartsAxis-tickLabel": {
                fill: theme.palette.text.secondary,
              },
              "& .MuiChartsAxis-line": {
                stroke: theme.palette.divider,
              },
              "& .MuiChartsAxis-tick": {
                stroke: theme.palette.divider,
              },
              "& .MuiChartsGrid-line": {
                stroke: alpha(theme.palette.divider, 0.65),
              },
            }}
          >
            <BarChart
              height={350}
              margin={{
                top: 25,
                right: 25,
                bottom: 50,
                left: 65,
              }}
              xAxis={[
                {
                  scaleType: "band",
                  data: chartData.map((cycle) => formatReportingCycle(cycle)),
                },
              ]}
              yAxis={[
                {
                  min: 0,
                  valueFormatter: (value) =>
                    Number(value).toLocaleString("en-AU"),
                },
              ]}
              series={[
                {
                  id: "reporting-entities",
                  label: "Reporting entities",
                  data: chartData.map((cycle) => cycle.reportingEntityCount),
                  valueFormatter: (value) =>
                    `${formatInteger(value)} reporting entities`,
                  color: theme.palette.primary.main,
                },
              ]}
              grid={{
                horizontal: true,
              }}
              borderRadius={6}
            />
          </Box>
        </Box>
      </Stack>
    </PublicSurface>
  );
}

function HistoricalSummary({ cycles }) {
  const theme = useTheme();

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
            Historical summary
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
            }}
          >
            Published industry-level payment time statistics for each available
            reporting cycle.
          </Typography>
        </Box>

        <Stack divider={<Divider flexItem />}>
          {[...cycles].reverse().map((cycle) => (
            <Grid
              key={cycle.reportingCycleId}
              container
              spacing={2}
              alignItems="center"
              sx={{ py: 2 }}
            >
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 700,
                  }}
                >
                  {formatReportingCycle(cycle)}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                  }}
                >
                  {formatInteger(cycle.reportingEntityCount)} reporting entities
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Minimum P95
                </Typography>

                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {formatWholeDays(cycle.minimumP95PaymentTimeDays)}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Median P95
                </Typography>

                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {formatDays(cycle.medianP95PaymentTimeDays)}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Average P95
                </Typography>

                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {formatDays(cycle.averageP95PaymentTimeDays)}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 3, md: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Maximum P95
                </Typography>

                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {formatWholeDays(cycle.maximumP95PaymentTimeDays)}
                </Typography>
              </Grid>
            </Grid>
          ))}
        </Stack>
      </Stack>
    </PublicSurface>
  );
}

function RegulatorPaymentTimesIndustryDetailPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { industrySlug } = useParams();
  const { showAlert } = useAlert();

  const [industry, setIndustry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadIndustry() {
      try {
        setIsLoading(true);

        const response = await fetch(
          `${INDUSTRY_DATA_BASE_URL}/${industrySlug}.json`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Industry request failed with status ${response.status}`,
          );
        }

        const data = await response.json();

        if (
          !data ||
          typeof data !== "object" ||
          !data.slug ||
          !data.industryDivision ||
          !Array.isArray(data.cycles) ||
          data.cycles.length === 0
        ) {
          throw new Error(
            "The regulator payment times industry data is invalid",
          );
        }

        setIndustry(normaliseIndustry(data));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);

          showAlert(
            "The regulator payment times industry data could not be loaded.",
            "error",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadIndustry();

    return () => {
      controller.abort();
    };
  }, [industrySlug, showAlert]);

  const headlineCycle = useMemo(
    () => getHeadlineCycle(industry?.cycles || []),
    [industry],
  );

  const incompleteCycleNotice = useMemo(
    () => getIncompleteCycleNotice(industry?.cycles || []),
    [industry],
  );

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
              Loading industry payment times…
            </Typography>
          </Stack>
        </PublicPageSection>
      </PublicPageLayout>
    );
  }

  if (!industry || !headlineCycle) {
    return (
      <PublicPageLayout>
        <PublicPageSection>
          <PublicContent maxWidth={760}>
            <Stack spacing={3} alignItems="flex-start">
              <Typography component="h1" variant="h3">
                Industry not found
              </Typography>

              <Typography color="text.secondary">
                No regulator payment times data could be found for this
                industry.
              </Typography>

              <Button
                variant="contained"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate("/regulator-payment-times/industries")}
              >
                Back to Industry Insights
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
                onClick={() => navigate("/regulator-payment-times/industries")}
                sx={{ mb: 3 }}
              >
                Industry Insights
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
                  {industry.industryDivision} Payment Times
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    maxWidth: 900,
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                  }}
                >
                  Explore how reported small business payment times have
                  developed across the {industry.industryDivision} ANZSIC
                  Industry Division under the Payment Times Reporting Scheme.
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                  }}
                >
                  Headline figures use {formatReportingCycle(headlineCycle)},
                  the latest cycle with a broadly established reporting cohort.
                </Typography>
              </Stack>
            </Box>

            {incompleteCycleNotice && (
              <Alert severity="info">
                {formatReportingCycle(incompleteCycleNotice.latestCycle)}{" "}
                currently contains{" "}
                {formatInteger(
                  incompleteCycleNotice.latestCycle.reportingEntityCount,
                )}{" "}
                published reporting entities, compared with{" "}
                {formatInteger(
                  incompleteCycleNotice.previousCycle.reportingEntityCount,
                )}{" "}
                in the previous cycle. The latest result may therefore change as
                further reports are published.
              </Alert>
            )}

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex" }}>
                <MetricCard
                  label="Reporting entities"
                  value={formatInteger(headlineCycle.reportingEntityCount)}
                  description="Published Standard reports represented in the headline cycle."
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex" }}>
                <MetricCard
                  label="Median P95"
                  value={formatDays(headlineCycle.medianP95PaymentTimeDays)}
                  description="The middle P95 result across reporting entities in the industry."
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex" }}>
                <MetricCard
                  label="Average P95"
                  value={formatDays(headlineCycle.averageP95PaymentTimeDays)}
                  description="The average P95 result across reporting entities in the industry."
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex" }}>
                <MetricCard
                  label="Reported P95 range"
                  value={`${formatWholeDays(
                    headlineCycle.minimumP95PaymentTimeDays,
                  )} – ${formatWholeDays(
                    headlineCycle.maximumP95PaymentTimeDays,
                  )}`}
                  description="The lowest and highest published P95 results in the headline cycle."
                />
              </Grid>
            </Grid>

            <P95TrendChart cycles={industry.cycles} />

            <EntityCountChart cycles={industry.cycles} />

            <HistoricalSummary cycles={industry.cycles} />

            <PublicSurface
              sx={{
                backgroundColor: alpha(theme.palette.info.main, 0.08),
                borderColor: alpha(theme.palette.info.main, 0.22),
              }}
            >
              <Stack spacing={2}>
                <Typography
                  component="h2"
                  variant="h5"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 700,
                  }}
                >
                  Understanding these figures
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                  }}
                >
                  These figures are calculated by Monochrome Compliance from
                  publicly available Standard reports. They describe reported
                  payment outcomes across entities assigned to this ANZSIC
                  Industry Division.
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                  }}
                >
                  Changes between reporting cycles may reflect payment
                  performance, changes in the reporting cohort, revised reports
                  or the timing of publication. Industry results should not be
                  treated as an assessment of legal compliance, financial health
                  or business quality.
                </Typography>
              </Stack>
            </PublicSurface>

            <PublicSurface
              sx={{
                backgroundColor: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    component="h2"
                    variant="h5"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                    }}
                  >
                    Explore payment times information
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      mt: 0.5,
                      maxWidth: 650,
                      color: theme.palette.text.primary,
                      lineHeight: 1.6,
                    }}
                  >
                    Search for an individual reporting entity on Monochrome
                    Compliance or visit the official Payment Times Reports
                    Register for source reports and further information.
                  </Typography>
                </Box>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  flexShrink={0}
                  width={{ xs: "100%", md: "auto" }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<SearchRoundedIcon />}
                    endIcon={<ArrowForwardRoundedIcon />}
                    onClick={() => navigate("/regulator-payment-times")}
                    sx={{
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
                    Search companies
                  </Button>

                  <Button
                    component="a"
                    href={REGULATOR_REGISTER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    endIcon={<LaunchRoundedIcon />}
                    sx={{
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
                    Visit official register
                  </Button>
                </Stack>
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

export default RegulatorPaymentTimesIndustryDetailPage;
