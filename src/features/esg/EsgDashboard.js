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
  const [loading, setLoading] = useState(true);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const fetchReportingPeriods = useCallback(async () => {
    try {
      setLoading(true);
      const periods = await esgService.getReportingPeriods();
      setReportingPeriods(periods);
    } catch (error) {
      showAlert("Failed to load reporting periods", "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchReportingPeriods();
  }, [fetchReportingPeriods]);

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
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Scope 1 Emissions</Typography>
              <Typography variant="h4">1,234 tCO₂e</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Waste Recycled</Typography>
              <Typography variant="h4">68%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Women in Leadership</Typography>
              <Typography variant="h4">42%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Supplier ESG Rating</Typography>
              <Typography variant="h4">B+</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Example ESG Trends Chart */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Emissions Trend
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={[
            { year: "2021", emissions: 1600 },
            { year: "2022", emissions: 1400 },
            { year: "2023", emissions: 1250 },
            { year: "2024", emissions: 1234 },
          ]}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="emissions" stroke="#1976d2" />
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
        onCreated={fetchReportingPeriods}
      />
    </Container>
  );
};

export default EsgDashboard;
