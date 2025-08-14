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
import { usePtrsContext } from "../../context"; // Adjust the path if needed

export default function PtrsDashboard() {
  const user = userService.userValue; // Get the current user
  const navigate = useNavigate();
  const theme = useTheme(); // Access the theme
  const { ptrsDetails, refreshPtrs, setActivePtrsId } = usePtrsContext();
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
    refreshPtrs().catch((err) => {
      console.error("Error refreshing ptrs:", err);
      setError("Failed to load ptrs");
    });
  }, [refreshPtrs]);
  console.log("ptrsDetails in Dashboard:", ptrsDetails);

  const ptrsList = [
    {
      name: "Payment Times Reporting Scheme",
      code: "ptrs",
      description: "Active and submitted ptrs",
    },
  ];

  function createPtrs(ptrs) {
    // If called with a PTRS row, resume that report; otherwise create a new one
    if (ptrs?.id) {
      setActivePtrsId(ptrs.id);
      navigate(`/ptrs/${ptrs.id}`);
      return;
    }
    const code = ptrs?.code || "ptrs";
    navigate(`/ptrs/${code}/create`);
  }

  async function continuePtrs(ptrs) {
    try {
      setActivePtrsId(ptrs.id);
      navigate(`/ptrs/${ptrs.id}`);
    } catch (error) {
      console.error("Error continuing ptrs:", error);
    }
  }

  function renderEmptyRows() {
    return (
      <>
        <TableRow key="no-report-message">
          <TableCell colSpan={6}>
            You haven’t started a report yet. Once your payment data is uploaded
            and validated, you can create one here.
          </TableCell>
        </TableRow>
        <TableRow key="upload-button-row">
          <TableCell colSpan={6}>
            <Button
              variant="outlined"
              onClick={() => navigate("/data/ptrs/console")}
            >
              Upload Payment Data
            </Button>
          </TableCell>
        </TableRow>
      </>
    );
  }

  function renderTable(row) {
    return (
      <TableRow key={row.id}>
        <TableCell>{row.id}</TableCell>
        <TableCell>
          {new Date(row.createdAt).toISOString().split("T")[0]}
        </TableCell>
        <TableCell>
          {new Date(row.reportingPeriodStartDate).toISOString().split("T")[0]}
        </TableCell>
        <TableCell>
          {new Date(row.reportingPeriodEndDate).toISOString().split("T")[0]}
        </TableCell>
        <TableCell>{row.ptrsStatus}</TableCell>
        <TableCell>
          {row.ptrsStatus === "Validated" ? (
            <Button
              variant="contained"
              color="primary"
              onClick={() => continuePtrs(row)}
            >
              Continue Submission
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => createPtrs(row)}
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
            {ptrsList.map((ptrs) => {
              const relevantPtrs = Array.isArray(ptrsDetails)
                ? ptrsDetails
                : [];

              return (
                <Grid item xs={12} key={ptrs.code}>
                  <Card
                    sx={{
                      border: `1px solid ${theme.palette.primary.main}`,
                      backgroundColor: theme.palette.action.hover,
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {ptrs.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                      >
                        {ptrs.description}
                      </Typography>
                      <TableContainer component={Paper}>
                        <Table
                          size="small"
                          aria-label="dense table of ptrs reports"
                        >
                          <TableHead>
                            <TableRow>
                              <TableCell>Report ID</TableCell>
                              <TableCell>Created Date</TableCell>
                              <TableCell>Reporting Period Start Date</TableCell>
                              <TableCell>Reporting Period End Date</TableCell>
                              <TableCell>Report Status</TableCell>
                              <TableCell>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {relevantPtrs.length > 0
                              ? relevantPtrs.map((row) => renderTable(row))
                              : renderEmptyRows()}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {/* {!hasCreatedPtrs && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => createPtrs(ptrs)}
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
