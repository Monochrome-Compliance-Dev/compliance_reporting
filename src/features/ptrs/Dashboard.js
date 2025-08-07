import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { userService } from "../../services";
import { useReportContext } from "../../context"; // Adjust the path if needed

export default function Dashboard() {
  const user = userService.userValue; // Get the current user
  const navigate = useNavigate();
  const theme = useTheme(); // Access the theme
  const { reportDetails, refreshReports } = useReportContext();
  const [error, setError] = useState(null);

  // Clear tags from Xero if needed
  useEffect(() => {
    if (window.location.hash === "#_=_") {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search
      );
    }
  }, []);

  useEffect(() => {
    refreshReports().catch((err) => {
      console.error("Error refreshing reports:", err);
      setError("Failed to load reports");
    });
  }, [refreshReports]);
  // console.log("reportDetails in Dashboard:", reportDetails);

  const reportList = [
    {
      name: "Payment Times Reporting Scheme",
      code: "ptrs",
      description: "Active and submitted reports",
    },
  ];

  function createReport(report) {
    navigate(`/reports/${report.code}/create`);
  }

  async function continueReport(report) {
    try {
      // No need to fetch savedRecords or pass state; wizard loads from main route
      navigate(`/reports/ptrs/${report.id}`);
    } catch (error) {
      console.error("Error continuing report:", error);
    }
  }

  function renderTable(row) {
    if (!row) {
      return (
        <TableRow>
          <TableCell colSpan={3}>No data available</TableCell>
        </TableRow>
      );
    }
    return (
      <TableRow key={row.id}>
        <TableCell>{row.id}</TableCell>
        <TableCell>
          {new Date(row.createdAt).toISOString().split("T")[0]}
        </TableCell>
        <TableCell>
          {new Date(row.ReportingPeriodStartDate).toISOString().split("T")[0]}
        </TableCell>
        <TableCell>
          {new Date(row.ReportingPeriodEndDate).toISOString().split("T")[0]}
        </TableCell>
        <TableCell>{row.reportStatus}</TableCell>
        <TableCell>
          {row.reportStatus === "Validated" ? (
            <Button
              variant="contained"
              color="primary"
              onClick={() => continueReport(row)}
            >
              Continue Submission
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => createReport(row)}
            >
              Resume Report
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Box
      sx={{
        padding: theme.spacing(4),
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Welcome to Your Dashboard, {user?.firstName} {user?.lastName}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Manage your data and generate PTRS reports below.
      </Typography>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          We couldn’t load your reports at this time. Please try again later or
          contact support.
        </Typography>
      )}

      {/* PTRS Module Link */}
      <Card sx={{ marginTop: theme.spacing(4) }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Payment Times Reporting Scheme
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            View and manage PTRS reporting periods, prepare data, and submit
            reports.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/ptrs")}
            sx={{ mt: 2 }}
          >
            Go to PTRS Dashboard
          </Button>
        </CardContent>
      </Card>

      {/* Data Preparation Section */}
      <Card sx={{ marginTop: theme.spacing(4) }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Data Preparation
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Upload and validate your payment data before creating a report.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/data/ptrs/console")}
            sx={{ mt: 2 }}
          >
            Go to Data Import & Review
          </Button>
        </CardContent>
      </Card>

      {/* Report Management Section */}
      <Card sx={{ marginTop: theme.spacing(6) }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Report Management
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Use prepared data to create a report or select an existing report to
            continue.
          </Typography>
          <Grid container spacing={3} sx={{ marginTop: theme.spacing(2) }}>
            {reportList.map((report, index) => {
              const relevantReports = Array.isArray(reportDetails)
                ? reportDetails.filter(
                    (r) =>
                      r.code === report.code && r.reportStatus === "Validated"
                  )
                : [];

              return (
                <Grid item xs={12} key={index}>
                  <Card
                    sx={{
                      border: `1px solid ${theme.palette.primary.main}`,
                      backgroundColor: theme.palette.action.hover,
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {report.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                      >
                        {report.description}
                      </Typography>
                      {relevantReports.length > 0 ? (
                        <TableContainer component={Paper}>
                          <Table
                            size="small"
                            aria-label="dense table of reports"
                          >
                            <TableHead>
                              <TableRow>
                                <TableCell>Report ID</TableCell>
                                <TableCell>Created Date</TableCell>
                                <TableCell>
                                  Reporting Period Start Date
                                </TableCell>
                                <TableCell>Reporting Period End Date</TableCell>
                                <TableCell>Report Status</TableCell>
                                <TableCell>Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {relevantReports.map((row) => renderTable(row))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          gutterBottom
                        >
                          No records found for this report
                        </Typography>
                      )}
                      {/* {!hasCreatedReport && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => createReport(report)}
                          sx={{ marginTop: theme.spacing(2) }}
                        >
                          Create New Report
                        </Button>
                      )} */}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
