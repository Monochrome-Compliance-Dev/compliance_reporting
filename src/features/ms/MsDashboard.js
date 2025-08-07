import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router";
import { msService } from "../../services";
import { useAlert } from "../../context";
import {
  DashboardCards,
  DashboardChart,
} from "../../components/shared/compliance";
import { chartConfigs } from "./chartConfig";
import { isWithinRange } from "../../lib/utils/periodUtils";
import NewReportingPeriodDialog from "./NewReportingPeriodDialog";

// Reset: basic one-panel dashboard using real backend data

const MsDashboard = ({ selectedPeriod }) => {
  const navigate = useNavigate();
  const [reportingPeriods, setReportingPeriods] = useState([]);
  const [supplierRisks, setSupplierRisks] = useState([]);
  const [trainingStats, setTrainingStats] = useState([]);
  const [grievanceStats, setGrievanceStats] = useState([]);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all data once
      const [periods, risks, training, grievances] = await Promise.all([
        msService.getReportingPeriods(),
        msService.getSupplierRisks(),
        msService.getTraining(),
        msService.getGrievances(),
      ]);
      setReportingPeriods(periods);
      setSupplierRisks(risks);
      setTrainingStats(training);
      setGrievanceStats(grievances);
    } catch (e) {
      showAlert("Failed to load dashboard data", "error");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Determine active period range
  const activePeriod =
    selectedPeriod !== "all"
      ? reportingPeriods.find((p) => p.id === selectedPeriod)
      : null;

  const filteredRisks = useMemo(() => {
    if (!activePeriod) return supplierRisks;
    return supplierRisks.filter((r) =>
      isWithinRange(r.createdAt, activePeriod.startDate, activePeriod.endDate)
    );
  }, [supplierRisks, activePeriod]);

  const filteredTrainingStats = useMemo(() => {
    if (!activePeriod) return trainingStats;
    return trainingStats.filter((t) =>
      isWithinRange(t.createdAt, activePeriod.startDate, activePeriod.endDate)
    );
  }, [trainingStats, activePeriod]);

  const filteredGrievanceStats = useMemo(() => {
    if (!activePeriod) return grievanceStats;
    return grievanceStats.filter((g) =>
      isWithinRange(g.reportedAt, activePeriod.startDate, activePeriod.endDate)
    );
  }, [grievanceStats, activePeriod]);

  const summary = useMemo(() => {
    return filteredRisks.reduce((acc, r) => {
      const risk = r.risk || "Unknown";
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {});
  }, [filteredRisks]);

  const trainingSummary = useMemo(() => {
    return filteredTrainingStats.reduce(
      (acc, t) => {
        acc.completed += t.completed ? 1 : 0;
        acc.total += 1;
        return acc;
      },
      { completed: 0, total: 0 }
    );
  }, [filteredTrainingStats]);
  const trainingChartData = useMemo(() => {
    if (!reportingPeriods.length || !trainingStats.length) return [];

    return reportingPeriods.map((p) => {
      const records = trainingStats.filter((t) =>
        isWithinRange(t.createdAt, p.startDate, p.endDate)
      );
      const completed = records.filter((t) => t.completed).length;
      return {
        period: p.name,
        completed,
        remaining: records.length - completed,
      };
    });
  }, [trainingStats, reportingPeriods]);

  const grievanceSummary = useMemo(() => {
    return filteredGrievanceStats.reduce((acc, g) => {
      const status = g.status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [filteredGrievanceStats]);
  const grievanceChartData = useMemo(() => {
    if (!reportingPeriods.length || !grievanceStats.length) return [];

    return reportingPeriods.map((p) => {
      const periodGrievances = grievanceStats.filter((g) =>
        isWithinRange(g.reportedAt, p.startDate, p.endDate)
      );
      const counts = periodGrievances.reduce((acc, g) => {
        const status = g.status || "Unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      return {
        period: p.name,
        open: counts["Open"] || 0,
        investigating: counts["Investigating"] || 0,
        closed: counts["Closed"] || 0,
      };
    });
  }, [grievanceStats, reportingPeriods]);

  const chartData = useMemo(() => {
    if (!reportingPeriods.length || !supplierRisks.length) return [];

    return reportingPeriods.map((p) => {
      const periodRisks = supplierRisks.filter((r) =>
        isWithinRange(r.createdAt, p.startDate, p.endDate)
      );
      const counts = periodRisks.reduce((acc, r) => {
        const risk = (r.risk || "").trim().toLowerCase();
        if (["low", "medium", "high"].includes(risk)) {
          acc[risk] = (acc[risk] || 0) + 1;
        }
        return acc;
      }, {});
      return {
        period: p.name,
        lowRisk: counts.low || 0,
        mediumRisk: counts.medium || 0,
        highRisk: counts.high || 0,
      };
    });
  }, [supplierRisks, reportingPeriods]);

  // Chart selection state
  const [chartType, setChartType] = useState("supplier");

  return (
    <Container>
      <Typography variant="h5" gutterBottom mt={4}>
        Modern Slavery Dashboard
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <DashboardCards
            cards={[
              {
                title: "High Risk Suppliers",
                value: summary["High"] || 0,
                subtitle: `${filteredRisks.length} total in period`,
                href: "/ms/supplier-risks",
                period: selectedPeriod,
              },
              {
                title: "Training Completed",
                value: trainingSummary.completed,
                subtitle: `${trainingSummary.total} total staff`,
                href: "/ms/training",
                period: selectedPeriod,
              },
              {
                title: "Open Grievances",
                value: grievanceSummary["Open"] || 0,
                subtitle: `${
                  (grievanceSummary["Open"] || 0) +
                  (grievanceSummary["Investigating"] || 0) +
                  (grievanceSummary["Closed"] || 0)
                } total recorded`,
                href: "/ms/grievances",
                period: selectedPeriod,
              },
            ]}
          />

          <Box mt={4}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">Dashboard Chart</Typography>
              <FormControl size="small">
                <InputLabel id="chart-type-label">Chart</InputLabel>
                <Select
                  labelId="chart-type-label"
                  id="chart-type"
                  value={chartType}
                  label="Chart"
                  onChange={(e) => setChartType(e.target.value)}
                >
                  <MenuItem value="supplier">Supplier Risk</MenuItem>
                  <MenuItem value="training">Training Completion</MenuItem>
                  <MenuItem value="grievance">Grievance Status</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <DashboardChart
              title={
                chartType === "supplier"
                  ? "Supplier Risk Over Time"
                  : chartType === "training"
                    ? "Training Completion Over Time"
                    : "Grievance Status Over Time"
              }
              data={
                chartType === "supplier"
                  ? chartData
                  : chartType === "training"
                    ? trainingChartData
                    : grievanceChartData
              }
              xKey="period"
              lines={chartConfigs(reportingPeriods)[chartType]?.lineKeys || []}
            />

            {/* Reporting Periods */}
            <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
              Reporting Periods
            </Typography>

            <Button
              variant="contained"
              color="primary"
              sx={{ mb: 2 }}
              onClick={() => setOpenNewDialog(true)}
            >
              + New Reporting Period
            </Button>

            {loading ? (
              <CircularProgress />
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportingPeriods.length > 0 ? (
                    reportingPeriods.map((period) => (
                      <TableRow
                        key={period.id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => navigate(`/ms/${period.id}`)}
                      >
                        <TableCell>{period.name}</TableCell>
                        <TableCell>{period.startDate}</TableCell>
                        <TableCell>{period.endDate}</TableCell>
                        <TableCell>{period.status || "Draft"}</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await msService.cloneTemplatesForReportingPeriod(
                                  period.id
                                );
                                showAlert(
                                  "Templates generated successfully",
                                  "success"
                                );
                                fetchDashboardData();
                              } catch (err) {
                                showAlert(
                                  "Failed to generate templates",
                                  "error"
                                );
                              }
                            }}
                          >
                            Generate Templates
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No reporting periods found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {/* Data Input */}
            <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
              Data Input
            </Typography>
            <div>
              TODO: Data input forms for Emissions, Workforce, Waste, etc.
            </div>

            {/* Approvals */}
            <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
              Approvals
            </Typography>
            <div>TODO: Approval workflow, status indicators</div>

            {/* Reports */}
            <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
              Reports
            </Typography>
            <div>TODO: Report generation & download options</div>

            {/* Audit Log */}
            <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
              Audit Log
            </Typography>
            <div>TODO: Show audit trail of data changes & approvals</div>

            <NewReportingPeriodDialog
              open={openNewDialog}
              onClose={() => setOpenNewDialog(false)}
              onCreated={fetchDashboardData}
            />
          </Box>
        </>
      )}
    </Container>
  );
};

export default MsDashboard;
