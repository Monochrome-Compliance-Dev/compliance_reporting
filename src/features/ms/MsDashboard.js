import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { msService } from "../../services/ms/ms";
import { useAlert } from "../../context/";
import { useNavigate } from "react-router";
import NewEntityDialog from "../../components/ui/NewEntityDialog";
import * as yup from "yup";

const reportingPeriodSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  startDate: yup.date().required("Start Date is required"),
  endDate: yup
    .date()
    .min(yup.ref("startDate"), "End Date cannot be before Start Date")
    .required("End Date is required"),
});

const MsDashboard = () => {
  const [reportingPeriods, setReportingPeriods] = useState([]);
  const [supplierRisks, setSupplierRisks] = useState([]);
  const [trainingStats, setTrainingStats] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState("all");
  const [chartType, setChartType] = useState("supplier");
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Replace fakeMsService with msService when available
      const periods = await msService.getReportingPeriods();
      setReportingPeriods(periods);

      const supplierRiskSummary = await msService.getSupplierRiskSummary();
      setSupplierRisks(supplierRiskSummary);
      const training = await msService.getTrainingStats();
      setTrainingStats(training);
      const grievance = await msService.getGrievanceSummary();
      setGrievances(grievance);
    } catch (error) {
      showAlert("Failed to load Modern Slavery dashboard data", "error");
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  console.log("Reporting Periods:", reportingPeriods);
  console.log("Supplier Risks:", supplierRisks);
  console.log("Training Stats:", trainingStats);
  console.log("Grievances:", grievances);

  // Overview card values
  const latestPeriodId = reportingPeriods.at(-1)?.id;
  const activePeriodId = selectedPeriodId === "all" ? null : selectedPeriodId;

  const supplierSummary = activePeriodId
    ? supplierRisks.find((r) => r.reportingPeriodId === activePeriodId)
        ?.summary || {}
    : supplierRisks.reduce((acc, r) => {
        Object.entries(r.summary).forEach(([risk, count]) => {
          acc[risk] = (acc[risk] || 0) + count;
        });
        return acc;
      }, {});

  const highRiskSupplierCount = supplierSummary["High"] || 0;

  const grievanceSummary = activePeriodId
    ? grievances.find((g) => g.reportingPeriodId === activePeriodId)?.summary ||
      {}
    : grievances.reduce((acc, g) => {
        Object.entries(g.summary).forEach(([status, count]) => {
          acc[status] = (acc[status] || 0) + count;
        });
        return acc;
      }, {});

  const openGrievanceCount = grievanceSummary["Open"] || 0;
  const totalGrievanceCount = Object.values(grievanceSummary).reduce(
    (acc, count) => acc + count,
    0
  );

  const trainingSummary = activePeriodId
    ? trainingStats.find((t) => t.reportingPeriodId === activePeriodId) || {
        completed: 0,
        total: 0,
      }
    : trainingStats.reduce(
        (acc, t) => {
          acc.completed += t.completed;
          acc.total += t.total;
          return acc;
        },
        { completed: 0, total: 0 }
      );

  const trainingCompletion =
    trainingSummary && trainingSummary.total > 0
      ? Math.round((trainingSummary.completed / trainingSummary.total) * 100)
      : 0;

  const getChartData = () => {
    if (chartType === "supplier") {
      return supplierRisks
        .map((r) => ({
          period:
            reportingPeriods.find((p) => p.id === r.reportingPeriodId)?.name ||
            r.reportingPeriodId,
          highRisk: r.summary["High"] || 0,
          mediumRisk: r.summary["Medium"] || 0,
          lowRisk: r.summary["Low"] || 0,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    } else if (chartType === "training") {
      return trainingStats
        .map((t) => ({
          period:
            reportingPeriods.find((p) => p.id === t.reportingPeriodId)?.name ||
            t.reportingPeriodId,
          completed: t.completed || 0,
          remaining: (t.total || 0) - (t.completed || 0),
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    } else if (chartType === "grievance") {
      return grievances
        .map((g) => ({
          period:
            reportingPeriods.find((p) => p.id === g.reportingPeriodId)?.name ||
            g.reportingPeriodId,
          open: g.summary["Open"] || 0,
          closed: g.summary["Closed"] || 0,
          investigating: g.summary["Investigating"] || 0,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    }
    return [];
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Modern Slavery Compliance Dashboard
      </Typography>

      {/* Overview Cards */}
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ mt: 3 }}
      >
        <Grid item>
          <Typography variant="h5" gutterBottom>
            Overview
          </Typography>
        </Grid>
        <Grid item>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Reporting Period</InputLabel>
            <Select
              value={selectedPeriodId}
              label="Reporting Period"
              onChange={(e) => setSelectedPeriodId(e.target.value)}
            >
              <MenuItem value="all">All Periods</MenuItem>
              {reportingPeriods.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Box
            onClick={() =>
              navigate(`/ms/${activePeriodId || latestPeriodId}/supplier-risks`)
            }
            sx={{ cursor: "pointer" }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6">High Risk Suppliers</Typography>
                <Typography variant="h4">{highRiskSupplierCount}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Suppliers flagged as high risk
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box
            onClick={() =>
              navigate(`/ms/${activePeriodId || latestPeriodId}/training`)
            }
            sx={{ cursor: "pointer" }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6">Training Completion</Typography>
                <Typography variant="h4">{trainingCompletion}%</Typography>
                <Typography variant="body2" color="textSecondary">
                  {trainingSummary.completed} of {trainingSummary.total}{" "}
                  completed
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box
            onClick={() =>
              navigate(`/ms/${activePeriodId || latestPeriodId}/grievances`)
            }
            sx={{ cursor: "pointer" }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6">Open Grievances</Typography>
                <Typography variant="h4">{openGrievanceCount}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {totalGrievanceCount} total grievances
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Supplier Risk Trend Chart */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        {chartType === "supplier"
          ? "Supplier Risk Over Time"
          : chartType === "training"
            ? "Training Completion Over Time"
            : "Grievances Over Time"}
      </Typography>
      <FormControl size="small" sx={{ minWidth: 180, mt: 2 }}>
        <InputLabel>Chart Type</InputLabel>
        <Select
          value={chartType}
          label="Chart Type"
          onChange={(e) => setChartType(e.target.value)}
        >
          <MenuItem value="supplier">Supplier Risk</MenuItem>
          <MenuItem value="training">Training Completion</MenuItem>
          <MenuItem value="grievance">Grievances</MenuItem>
        </Select>
      </FormControl>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={getChartData()}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Legend />
          {chartType === "supplier" && (
            <>
              <Line
                type="monotone"
                dataKey="lowRisk"
                stroke="#388e3c"
                name="Low Risk"
              />
              <Line
                type="monotone"
                dataKey="mediumRisk"
                stroke="#f9a825"
                name="Medium Risk"
              />
              <Line
                type="monotone"
                dataKey="highRisk"
                stroke="#d32f2f"
                name="High Risk"
              />
            </>
          )}
          {chartType === "training" && (
            <>
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#388e3c"
                name="Completed"
              />
              <Line
                type="monotone"
                dataKey="remaining"
                stroke="#d32f2f"
                name="Remaining"
              />
            </>
          )}
          {chartType === "grievance" && (
            <>
              <Line
                type="monotone"
                dataKey="open"
                stroke="#d32f2f"
                name="Open"
              />
              <Line
                type="monotone"
                dataKey="investigating"
                stroke="#f9a825"
                name="Investigating"
              />
              <Line
                type="monotone"
                dataKey="closed"
                stroke="#388e3c"
                name="Closed"
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Reporting Periods Table */}
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
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(reportingPeriods) && reportingPeriods.length > 0 ? (
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
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
        TODO: Data input forms for supplier risk, training, grievances, etc.
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

      {/* New Reporting Period Dialog */}
      <NewEntityDialog
        open={openNewDialog}
        onClose={() => setOpenNewDialog(false)}
        onCreated={fetchDashboardData}
        title="New Reporting Period"
        schema={reportingPeriodSchema}
        defaultValues={{ name: "", startDate: "", endDate: "" }}
        fields={[
          { name: "name", label: "Name *", type: "text" },
          { name: "startDate", label: "Start Date *", type: "date" },
          { name: "endDate", label: "End Date *", type: "date" },
        ]}
        onSubmit={async (data) => {
          await msService.createReportingPeriod(data);
          setOpenNewDialog(false);
          showAlert("New reporting period created successfully", "success");
        }}
      />
    </Container>
  );
};

export default MsDashboard;
