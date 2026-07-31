import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import PageMeta from "shared/ui/PageMeta";

const INDUSTRY_DATA_BASE_URL = "/data/regulator-payment-times/industries";
const INDUSTRY_INDEX_URL = "/data/regulator-payment-times/industry-index.json";
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

function formatReportingPeriod(startDate, endDate) {
  if (!startDate || !endDate) {
    return "Latest available reporting cycle";
  }

  return `${formatMonthYear(startDate)} to ${formatMonthYear(endDate)}`;
}

function formatDays(value) {
  if (value === null || value === undefined) {
    return "Not reported";
  }

  return `${Number(value).toFixed(1)} days`;
}

function formatInteger(value) {
  if (value === null || value === undefined) {
    return "Not reported";
  }

  return Number(value).toLocaleString("en-AU");
}

function formatAbn(abn) {
  if (!abn || String(abn).length !== 11) {
    return abn;
  }

  const value = String(abn);

  return [
    value.slice(0, 2),
    value.slice(2, 5),
    value.slice(5, 8),
    value.slice(8),
  ].join(" ");
}

function getIndustryIndexData(data) {
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray(data.reportingCycles) ||
    !Array.isArray(data.industries)
  ) {
    return {
      reportingCycles: [],
      industries: [],
    };
  }

  return {
    reportingCycles: data.reportingCycles.map((cycle) => ({
      id: cycle.id,
      name: cycle.name,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
    })),
    industries: data.industries.map((industry) => ({
      industrySlug: industry.slug,
      industryName: industry.industryDivision,
      cycles: Array.isArray(industry.cycles)
        ? industry.cycles.map((cycle) => ({
            reportingCycleId: cycle.reportingCycleId,
            reportingCycleName: cycle.reportingCycleName,
            reportingCycleStartDate: cycle.reportingCycleStartDate,
            reportingCycleEndDate: cycle.reportingCycleEndDate,
            reportingEntityCount: cycle.reportingEntityCount,
            averageP95PaymentTimeDays: cycle.averageP95PaymentTimeDays,
            medianP95PaymentTimeDays: cycle.medianP95PaymentTimeDays,
            minimumP95PaymentTimeDays: cycle.minimumP95PaymentTimeDays,
            maximumP95PaymentTimeDays: cycle.maximumP95PaymentTimeDays,
          }))
        : [],
    })),
  };
}

function getCycleMetrics(industry, reportingCycleId) {
  if (!industry || !Array.isArray(industry.cycles)) {
    return null;
  }

  return (
    industry.cycles.find(
      (cycle) => cycle.reportingCycleId === reportingCycleId,
    ) || null
  );
}

function buildLineChartPoints(values, width, height, padding) {
  const numericValues = values.map((value) => Number(value));

  if (
    numericValues.length < 2 ||
    numericValues.some((value) => !Number.isFinite(value))
  ) {
    return [];
  }

  const minimum = Math.min(...numericValues);
  const maximum = Math.max(...numericValues);
  const range = maximum - minimum || 1;
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;

  return numericValues.map((value, index) => ({
    value,
    x:
      padding.left +
      (index * usableWidth) / Math.max(numericValues.length - 1, 1),
    y: padding.top + ((maximum - value) / range) * usableHeight,
  }));
}

function MetricCard({ label, value, description }) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: 3,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        background: `linear-gradient(
          145deg,
          ${alpha(theme.palette.primary.main, 0.1)},
          ${theme.palette.background.paper} 60%
        )`,
      }}
    >
      <Stack spacing={1}>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>

        <Typography
          variant="h4"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 700,
          }}
        >
          {value}
        </Typography>

        {description && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.5,
            }}
          >
            {description}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

function P95BarLabel(props) {
  const theme = useTheme();
  const [p95Value, entityCount] = String(props.children).split("|");

  const centreX = props.x + props.width / 2;
  const centreY = props.y + props.height / 2;

  return (
    <g>
      <circle
        cx={centreX}
        cy={centreY}
        r={15}
        fill={theme.palette.primary.dark}
        stroke={theme.palette.background.paper}
        strokeWidth={2}
      />

      <text
        x={centreX}
        y={centreY}
        fill={theme.palette.primary.contrastText}
        fontSize="10"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {p95Value}
      </text>

      <text
        x={props.x + props.width + 8}
        y={centreY}
        fill={theme.palette.text.primary}
        fontSize="11"
        fontWeight="700"
        textAnchor="start"
        dominantBaseline="central"
      >
        {entityCount}
      </text>
    </g>
  );
}

function IndustryOverviewChart({
  industries,
  reportingCycles,
  selectedReportingCycleId,
  onReportingCycleChange,
  onSelectIndustry,
}) {
  const theme = useTheme();

  const selectedReportingCycle = reportingCycles.find(
    (cycle) => cycle.id === selectedReportingCycleId,
  );

  const chartItems = useMemo(
    () =>
      industries
        .map((industry) => ({
          ...industry,
          selectedCycle: getCycleMetrics(industry, selectedReportingCycleId),
        }))
        .filter(
          (industry) =>
            Number.isFinite(
              Number(industry.selectedCycle?.reportingEntityCount),
            ) &&
            Number.isFinite(
              Number(industry.selectedCycle?.medianP95PaymentTimeDays),
            ),
        )
        .sort((firstIndustry, secondIndustry) =>
          firstIndustry.industryName.localeCompare(
            secondIndustry.industryName,
            "en-AU",
          ),
        ),
    [industries, selectedReportingCycleId],
  );

  const industryNames = chartItems.map((industry) => industry.industryName);

  const reportingEntityCounts = chartItems.map((industry) =>
    Number(industry.selectedCycle.reportingEntityCount),
  );

  const maximumReportingEntityCount = Math.max(...reportingEntityCounts, 1);
  const entityAxisMaximum = Math.ceil(maximumReportingEntityCount * 1.15);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "flex-start" }}
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
              Payment times by industry
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                maxWidth: 750,
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
              }}
            >
              Bar length shows the number of reporting entities in each ANZSIC
              Industry Division. The label inside each bar shows the median P95
              payment time for the selected reporting cycle. Select a bar to
              explore that industry.
            </Typography>
          </Box>

          <FormControl
            size="small"
            sx={{
              width: { xs: "100%", md: 280 },
              flexShrink: 0,
            }}
          >
            <InputLabel id="reporting-cycle-label">Reporting cycle</InputLabel>

            <Select
              labelId="reporting-cycle-label"
              id="reporting-cycle"
              value={selectedReportingCycleId}
              label="Reporting cycle"
              onChange={(event) => onReportingCycleChange(event.target.value)}
            >
              {reportingCycles.map((cycle) => (
                <MenuItem key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {selectedReportingCycle && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 600,
            }}
          >
            Showing reporting cycle: {selectedReportingCycle.name}
          </Typography>
        )}

        {chartItems.length > 0 ? (
          <>
            <Box sx={{ width: "100%" }}>
              <Box
                sx={{
                  height: 920,
                  "& .MuiChartsLegend-root": {
                    display: "none",
                  },
                  "& .MuiBarElement-root": {
                    cursor: "pointer",
                  },
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
                    stroke: alpha(theme.palette.divider, 0.6),
                  },
                  "& .MuiChartsAxis-label": {
                    fill: theme.palette.text.secondary,
                  },
                }}
              >
                <BarChart
                  layout="horizontal"
                  height={920}
                  margin={{
                    top: 20,
                    right: 65,
                    bottom: 50,
                    left: 0,
                  }}
                  slots={{
                    barLabel: P95BarLabel,
                  }}
                  xAxis={[
                    {
                      id: "entity-count",
                      min: 0,
                      max: entityAxisMaximum,
                      valueFormatter: (value) =>
                        Number(value).toLocaleString("en-AU"),
                    },
                  ]}
                  yAxis={[
                    {
                      id: "industries",
                      scaleType: "band",
                      data: industryNames,
                      width: 220,
                      categoryGapRatio: 0.28,
                      tickLabelInterval: () => true,
                      tickLabelStyle: {
                        fontSize: 11,
                      },
                    },
                  ]}
                  series={[
                    {
                      id: "reporting-entities",
                      label: "Reporting entities",
                      data: reportingEntityCounts,
                      color: theme.palette.primary.main,
                      xAxisId: "entity-count",
                      yAxisId: "industries",
                      valueFormatter: (value, context) => {
                        const industry = chartItems[context.dataIndex];

                        return [
                          `${Number(value).toLocaleString(
                            "en-AU",
                          )} reporting entities`,
                          `${Number(
                            industry.selectedCycle.medianP95PaymentTimeDays,
                          ).toFixed(1)} median P95 days`,
                        ].join(" • ");
                      },
                      barLabel: (item) => {
                        const industry = chartItems[item.dataIndex];

                        if (!industry) {
                          return null;
                        }

                        const medianP95 = Number(
                          industry.selectedCycle.medianP95PaymentTimeDays,
                        ).toFixed(1);

                        const entityCount = Number(
                          industry.selectedCycle.reportingEntityCount,
                        ).toLocaleString("en-AU");

                        return `${medianP95}|${entityCount}`;
                      },
                      barLabelPlacement: "center",
                      highlightScope: {
                        highlight: "item",
                        fade: "global",
                      },
                    },
                  ]}
                  grid={{
                    vertical: true,
                  }}
                  borderRadius={6}
                  onItemClick={(_, params) => {
                    const selectedIndustry = chartItems[params.dataIndex];

                    if (selectedIndustry) {
                      onSelectIndustry(selectedIndustry.industrySlug);
                    }
                  }}
                  slotProps={{
                    legend: {
                      hidden: true,
                    },
                  }}
                />
              </Box>
            </Box>

            <Stack
              direction="row"
              spacing={2.5}
              alignItems="center"
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ width: "100%" }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 10,
                  borderRadius: 1,
                  backgroundColor: theme.palette.primary.main,
                }}
              />

              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary }}
              >
                Reporting entity count
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  width: 24,
                  height: 24,
                  border: `2px solid ${theme.palette.background.paper}`,
                  borderRadius: "50%",
                  backgroundColor: theme.palette.primary.dark,
                  color: theme.palette.primary.contrastText,
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 8,
                  fontWeight: 700,
                }}
              >
                P95
              </Box>

              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary }}
              >
                Median P95 payment days
              </Typography>
            </Stack>
          </>
        ) : (
          <Typography color="text.secondary">
            No industry data is available for this reporting cycle.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

function IndustryHistoryChart({ cycles }) {
  const theme = useTheme();
  const width = 760;
  const height = 280;
  const padding = {
    top: 42,
    right: 40,
    bottom: 48,
    left: 52,
  };

  const chronologicalCycles = useMemo(
    () =>
      [...cycles].sort((firstCycle, secondCycle) =>
        firstCycle.reportingCycleId.localeCompare(secondCycle.reportingCycleId),
      ),
    [cycles],
  );

  const points = buildLineChartPoints(
    chronologicalCycles.map((cycle) => cycle.medianP95PaymentTimeDays),
    width,
    height,
    padding,
  );

  if (points.length < 2) {
    return null;
  }

  const polylinePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        backgroundColor: theme.palette.background.paper,
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
            Industry history
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
            }}
          >
            Historical median P95 payment times calculated from reporting
            entities in this industry.
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
            aria-label="Industry median P95 payment time history"
            sx={{
              display: "block",
              width: "100%",
              minWidth: 620,
            }}
          >
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
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
              const cycle = chronologicalCycles[index];

              return (
                <g key={cycle.reportingCycleId}>
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
                    fontSize="14"
                    fontWeight="700"
                  >
                    {point.value.toFixed(1)}
                  </text>

                  <text
                    x={point.x}
                    y={height - 16}
                    textAnchor="middle"
                    fill={theme.palette.text.secondary}
                    fontSize="12"
                  >
                    {cycle.reportingCycleId}
                  </text>
                </g>
              );
            })}
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}

function IndustryOverview({
  industries,
  reportingCycles,
  selectedReportingCycleId,
  onReportingCycleChange,
  onSelectIndustry,
}) {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Stack spacing={{ xs: 4, md: 6 }}>
      <Stack spacing={2}>
        <Box>
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate("/")}
          >
            Back to home
          </Button>
        </Box>
        <Typography
          component="h1"
          variant="h2"
          sx={{
            color: theme.palette.text.primary,
            fontSize: "clamp(2.25rem, 4vw, 3.4rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          Industry Insights
        </Typography>

        <Typography
          variant="body1"
          sx={{
            maxWidth: 900,
            color: theme.palette.text.secondary,
            lineHeight: 1.7,
          }}
        >
          Explore payment performance across the regulator&apos;s 19 ANZSIC
          Industry Divisions. Select an industry to view its history and
          reporting entities.
        </Typography>
      </Stack>

      <IndustryOverviewChart
        industries={industries}
        reportingCycles={reportingCycles}
        selectedReportingCycleId={selectedReportingCycleId}
        onReportingCycleChange={onReportingCycleChange}
        onSelectIndustry={onSelectIndustry}
      />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          backgroundColor: alpha(theme.palette.info.main, 0.08),
        }}
      >
        <Stack spacing={1.5}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
            About these industry insights
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.7,
            }}
          >
            These figures are calculated by Monochrome Compliance from the
            Payment Times Reporting Regulator&apos;s publicly available Standard
            report dataset. They describe payment-time information reported by
            entities within each industry.
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.7,
            }}
          >
            Industry structures, supplier arrangements and payment practices
            differ substantially. The figures should not be treated as a ranking
            of industries or as an assessment of legal compliance, financial
            health or business quality.
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  );
}

function IndustryDetail({
  industry,
  industryIndex,
  reportingCycles,
  selectedReportingCycleId,
  onReportingCycleChange,
  onBack,
  onSelectCompany,
  onSelectIndustry,
}) {
  const theme = useTheme();

  const selectedCycle =
    getCycleMetrics(industry, selectedReportingCycleId) ||
    industry.cycles[industry.cycles.length - 1] ||
    null;

  const companies = industry.companies || [];
  const cycles = industry.cycles || [];

  const indexIndustry = industryIndex.find(
    (item) => item.industrySlug === industry.industrySlug,
  );

  const indexCycle = getCycleMetrics(indexIndustry, selectedReportingCycleId);

  return (
    <Stack spacing={{ xs: 4, md: 6 }}>
      <Box>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={onBack}
          sx={{ mb: 3 }}
        >
          Back to Industry Insights
        </Button>

        <Stack spacing={2}>
          <Typography
            component="h1"
            variant="h2"
            sx={{
              color: theme.palette.text.primary,
              fontSize: "clamp(2.25rem, 4vw, 3.4rem)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            {industry.industryName}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              maxWidth: 850,
              color: theme.palette.text.secondary,
              lineHeight: 1.7,
            }}
          >
            Payment performance reported by entities in the{" "}
            {industry.industryName} ANZSIC Industry Division.
          </Typography>

          {selectedCycle && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 600,
              }}
            >
              Selected reporting cycle:{" "}
              {selectedCycle.reportingCycleName ||
                formatReportingPeriod(
                  selectedCycle.reportingCycleStartDate,
                  selectedCycle.reportingCycleEndDate,
                )}
            </Typography>
          )}
        </Stack>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard
            label="Reporting entities"
            value={formatInteger(
              selectedCycle?.reportingEntityCount ??
                indexCycle?.reportingEntityCount,
            )}
            description="Entities represented in the selected reporting cycle."
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard
            label="Median industry P95"
            value={formatDays(
              selectedCycle?.medianP95PaymentTimeDays ??
                indexCycle?.medianP95PaymentTimeDays,
            )}
            description="The median P95 result across reporting entities in this industry."
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard
            label="Average industry P95"
            value={formatDays(
              selectedCycle?.averageP95PaymentTimeDays ??
                indexCycle?.averageP95PaymentTimeDays,
            )}
            description="The average P95 result across reporting entities in this industry."
          />
        </Grid>
      </Grid>

      <IndustryOverviewChart
        industries={industryIndex}
        reportingCycles={reportingCycles}
        selectedReportingCycleId={selectedReportingCycleId}
        onReportingCycleChange={onReportingCycleChange}
        onSelectIndustry={onSelectIndustry}
      />

      <IndustryHistoryChart cycles={cycles} />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
              Reporting entities
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                color: theme.palette.text.secondary,
              }}
            >
              Companies represented in the latest available data for this
              industry.
            </Typography>
          </Box>

          <Stack divider={<Divider flexItem />}>
            {companies.map((company) => (
              <Grid
                key={company.companySlug}
                container
                spacing={2}
                alignItems="center"
                sx={{
                  py: 2,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
                onClick={() => onSelectCompany(company.companySlug)}
              >
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                    }}
                  >
                    {company.businessName}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.25,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    ABN {formatAbn(company.abn)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, md: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    P95
                  </Typography>

                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {formatDays(company.p95PaymentTimeDays)}
                  </Typography>
                </Grid>

                <Grid
                  size={{ xs: 12, md: 4 }}
                  sx={{
                    display: "flex",
                    justifyContent: { xs: "flex-start", md: "flex-end" },
                  }}
                >
                  <Button
                    endIcon={<ArrowForwardRoundedIcon />}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectCompany(company.companySlug);
                    }}
                  >
                    View company
                  </Button>
                </Grid>
              </Grid>
            ))}
          </Stack>

          {companies.length === 0 && (
            <Typography color="text.secondary">
              No reporting entities are available for this industry.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

function normaliseIndustryDetail(data) {
  return {
    industrySlug: data.slug,
    industryName: data.industryDivision,
    latestReportingCycleId: data.latestReportingCycleId,
    cycles: Array.isArray(data.cycles) ? data.cycles : [],
    companies: Array.isArray(data.companies)
      ? data.companies.map((company) => ({
          companySlug: company.slug,
          businessName: company.businessName,
          abn: company.abn,
          p95PaymentTimeDays: company.p95PaymentTimeDays,
          industryP95Position: company.industryP95Position,
        }))
      : [],
  };
}

function RegulatorPaymentTimesIndustryPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { industrySlug } = useParams();
  const { showAlert } = useAlert();

  const [industryIndex, setIndustryIndex] = useState([]);
  const [reportingCycles, setReportingCycles] = useState([]);
  const [selectedReportingCycleId, setSelectedReportingCycleId] = useState("");
  const [industry, setIndustry] = useState(null);
  const [isIndexLoading, setIsIndexLoading] = useState(true);
  const [isIndustryLoading, setIsIndustryLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadIndustryIndex() {
      try {
        setIsIndexLoading(true);

        const response = await fetch(INDUSTRY_INDEX_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Industry index request failed with status ${response.status}`,
          );
        }

        const data = await response.json();
        const indexData = getIndustryIndexData(data);

        if (
          indexData.industries.length !== 19 ||
          indexData.reportingCycles.length === 0
        ) {
          throw new Error(
            "The regulator payment times industry index is invalid",
          );
        }

        setIndustryIndex(indexData.industries);
        setReportingCycles(indexData.reportingCycles);
        setSelectedReportingCycleId(
          indexData.reportingCycles[indexData.reportingCycles.length - 1].id,
        );
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
          setIsIndexLoading(false);
        }
      }
    }

    loadIndustryIndex();

    return () => {
      controller.abort();
    };
  }, [showAlert]);

  useEffect(() => {
    if (!industrySlug) {
      setIndustry(null);
      setIsIndustryLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    async function loadIndustry() {
      try {
        setIsIndustryLoading(true);

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
          !data.industryDivision ||
          !data.slug ||
          !Array.isArray(data.cycles) ||
          !Array.isArray(data.companies)
        ) {
          throw new Error(
            "The regulator payment times industry data is invalid",
          );
        }

        setIndustry(normaliseIndustryDetail(data));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setIndustry(null);

          showAlert(
            "The selected regulator payment times industry could not be loaded.",
            "error",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsIndustryLoading(false);
        }
      }
    }

    loadIndustry();

    return () => {
      controller.abort();
    };
  }, [industrySlug, showAlert]);

  const isLoading = isIndexLoading || isIndustryLoading;
  const pageMeta = (
    <PageMeta
      title="Payment Times by Industry"
      description="Compare published Australian Payment Times Reporting data across industries and reporting cycles."
      path="/regulator-payment-times/industries"
    />
  );

  if (isLoading) {
    return (
      <>
        {pageMeta}
        <Box
          component="main"
          sx={{
            minHeight: "100vh",
            backgroundColor: theme.palette.background.default,
            py: { xs: 8, md: 12 },
          }}
        >
          <Container maxWidth="lg">
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="center"
            >
              <CircularProgress size={26} />

              <Typography color="text.secondary">
                Loading industry payment times…
              </Typography>
            </Stack>
          </Container>
        </Box>
      </>
    );
  }

  if (industrySlug && !industry) {
    return (
      <>
        <PageMeta
          title="Payment Times Industry Not Found"
          description="The requested Payment Times Explorer industry could not be found."
          noIndex
        />
        <Box
          component="main"
          sx={{
            minHeight: "100vh",
            backgroundColor: theme.palette.background.default,
            py: { xs: 8, md: 12 },
          }}
        >
          <Container maxWidth="md">
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
          </Container>
        </Box>
      </>
    );
  }

  return (
    <>
      {pageMeta}
      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          backgroundColor: theme.palette.background.default,
          py: { xs: 6, md: 10 },
        }}
      >
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 4, md: 6 }}>
          {industry ? (
            <IndustryDetail
              industry={industry}
              industryIndex={industryIndex}
              reportingCycles={reportingCycles}
              selectedReportingCycleId={selectedReportingCycleId}
              onReportingCycleChange={setSelectedReportingCycleId}
              onBack={() => navigate("/regulator-payment-times/industries")}
              onSelectIndustry={(selectedIndustrySlug) =>
                navigate(
                  `/regulator-payment-times/industry/${selectedIndustrySlug}`,
                )
              }
              onSelectCompany={(companySlug) => {
                if (!companySlug) {
                  navigate("/contact");
                  return;
                }

                navigate(`/regulator-payment-times/${companySlug}`);
              }}
            />
          ) : (
            <IndustryOverview
              industries={industryIndex}
              reportingCycles={reportingCycles}
              selectedReportingCycleId={selectedReportingCycleId}
              onReportingCycleChange={setSelectedReportingCycleId}
              onSelectIndustry={(selectedIndustrySlug) =>
                navigate(
                  `/regulator-payment-times/industry/${selectedIndustrySlug}`,
                )
              }
            />
          )}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
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
                  variant="body2"
                  sx={{
                    mt: 0.5,
                    maxWidth: 650,
                    color: theme.palette.text.secondary,
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
              >
                <Button
                  variant="outlined"
                  startIcon={<SearchRoundedIcon />}
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={() => navigate("/regulator-payment-times")}
                >
                  Search companies
                </Button>

                <Button
                  component="a"
                  href={REGULATOR_REGISTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  endIcon={<LaunchRoundedIcon />}
                >
                  Visit official register
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 6,
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
      </Container>
      </Box>
    </>
  );
}

export default RegulatorPaymentTimesIndustryPage;
