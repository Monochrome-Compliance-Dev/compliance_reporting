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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import { msService } from "../../services/";
import { useAlert } from "../../context/";
import { useNavigate } from "react-router";
import NewEntityDialog from "../../components/ui/NewEntityDialog";
import * as yup from "yup";
import {
  DashboardCards,
  DashboardChart,
} from "../../components/shared/compliance/";
import { sortByPeriodName } from "../../lib/utils/periodUtils";
import { chartConfigs } from "../../lib/utils/chartConfig";
import { findOrReduceSummary } from "../../lib/utils/summaryUtils";

const reportingPeriodSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  startDate: yup.date().required("Start Date is required"),
  endDate: yup
    .date()
    .min(yup.ref("startDate"), "End Date cannot be before Start Date")
    .required("End Date is required"),
});

const MsDashboard = ({ selectedPeriod, reportingPeriods }) => {
  const [supplierRisks, setSupplierRisks] = useState([]);
  const [trainingStats, setTrainingStats] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [chartType, setChartType] = useState("supplier");
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Replace fakeMsService with msService when available
      // Removed fetching reportingPeriods here as it comes from props

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

  // Overview card values
  const activePeriodId = selectedPeriod === "all" ? null : selectedPeriod;

  const supplierSummary = findOrReduceSummary(
    supplierRisks,
    activePeriodId,
    (r) => r?.summary || {},
    (r) => r?.reportingPeriodId
  );

  const grievanceSummary = findOrReduceSummary(
    grievances,
    activePeriodId,
    (g) => g?.summary || {},
    (g) => g?.reportingPeriodId
  );

  const trainingSummary = findOrReduceSummary(
    trainingStats,
    activePeriodId,
    (t) =>
      t
        ? { completed: t?.completed || 0, total: t?.total || 0 }
        : { completed: 0, total: 0 },
    (t) => t?.reportingPeriodId
  );

  const highRiskSupplierCount = supplierSummary["High"] || 0;

  const openGrievanceCount = grievanceSummary["Open"] || 0;
  const totalGrievanceCount = Object.values(grievanceSummary).reduce(
    (acc, count) => acc + count,
    0
  );

  const trainingCompletion =
    trainingSummary && trainingSummary.total > 0
      ? Math.round((trainingSummary.completed / trainingSummary.total) * 100)
      : 0;

  // TODO: Align dates used for charts with selected period
  // (reportedAt vs. createdAt and grouping by reportingPeriodId changed to report period start and end date)
  const getChartData = () => {
    const config = chartConfigs(reportingPeriods)[chartType];
    const dataSource =
      chartType === "supplier"
        ? supplierRisks
        : chartType === "training"
          ? trainingStats
          : grievances;

    return config ? dataSource.map(config.mapFn).sort(sortByPeriodName) : [];
  };

  return (
    <Container>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={3}
        mb={2}
      >
        <Typography variant="h5" gutterBottom>
          Overview
        </Typography>
      </Box>
      <DashboardCards
        raisedOnHover
        cards={[
          {
            title: "High Risk Suppliers",
            value: highRiskSupplierCount,
            subtitle: "Suppliers flagged as high risk",
            href: "/ms/supplier-risks",
            period: selectedPeriod,
          },
          {
            title: "Training Completion",
            value: `${trainingCompletion}%`,
            subtitle: `${trainingSummary.completed} of ${trainingSummary.total} completed`,
            href: "/ms/training",
            period: selectedPeriod,
          },
          {
            title: "Open Grievances",
            value: openGrievanceCount,
            subtitle: `${totalGrievanceCount} total grievances`,
            href: "/ms/grievances",
            period: selectedPeriod,
          },
        ]}
      />

      {/* Supplier Risk Trend Chart */}
      <Box display="flex" justifyContent="flex-end" mt={3}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
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
      </Box>
      <DashboardChart
        title={
          chartType === "supplier"
            ? "Supplier Risk Over Time"
            : chartType === "training"
              ? "Training Completion Over Time"
              : "Grievances Over Time"
        }
        data={getChartData()}
        xKey="period"
        lines={chartConfigs(reportingPeriods)[chartType].lineKeys}
      />

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
