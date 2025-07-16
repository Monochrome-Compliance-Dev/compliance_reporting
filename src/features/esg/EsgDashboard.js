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
import { esgService } from "../../services/esg/esg";
import { useAlert } from "../../context/";
import NewReportingPeriodDialog from "./NewReportingPeriodDialog";
import { useNavigate } from "react-router";

const EsgDashboard = () => {
  const [reportingPeriods, setReportingPeriods] = useState([]);
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [indicatorTotals, setIndicatorTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const periods = await esgService.getReportingPeriods();
      setReportingPeriods(periods);

      if (periods.length > 0) {
        const currentPeriodId = periods[0].id;
        const categoryData =
          await esgService.getCategoryTotals(currentPeriodId);
        const indicatorData =
          await esgService.getTotalsByIndicator(currentPeriodId);

        setCategoryTotals(categoryData);
        setIndicatorTotals(indicatorData);
      }
    } catch (error) {
      showAlert("Failed to load ESG dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  console.log("ESG Dashboard data fetched", categoryTotals, indicatorTotals);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        ESG Reporting Dashboard
      </Typography>

      {/* ESG Overview */}
      <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
        ESG Overview
      </Typography>
      <Grid container spacing={3}>
        {categoryTotals && categoryTotals.length > 0 ? (
          categoryTotals.map((cat) => (
            <Grid item xs={12} sm={6} md={3} key={cat.category}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{cat.category}</Typography>
                  <Typography variant="h4">
                    {Number(cat.totalValue).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Sum of all metric values
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography>No category data available.</Typography>
        )}
      </Grid>

      {/* Example ESG Trends Chart */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Emissions Trend
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={indicatorTotals}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ESGIndicator.name" />
          <YAxis />
          <Tooltip
            formatter={(value, name, props) => {
              const unit = props.payload.Unit ? props.payload.Unit.name : "";
              return [`${value} ${unit}`, "Total"];
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="totalValue" stroke="#1976d2" />
        </LineChart>
      </ResponsiveContainer>

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
                  onClick={() => navigate(`/esg/${period.id}`)}
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
                          await esgService.cloneTemplatesForReportingPeriod(
                            period.id
                          );
                          showAlert(
                            "Templates generated successfully",
                            "success"
                          );
                          fetchDashboardData();
                        } catch (err) {
                          showAlert("Failed to generate templates", "error");
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
      <div>TODO: Data input forms for Emissions, Workforce, Waste, etc.</div>

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
    </Container>
  );
};

export default EsgDashboard;
