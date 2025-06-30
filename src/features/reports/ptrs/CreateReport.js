import {
  Box,
  TextField,
  Button,
  Grid,
  useTheme,
  Typography,
} from "@mui/material";
import { useParams } from "react-router";
import { reportService, userService } from "../../../services";
import { useAlert } from "../../../context/";

export default function CreateReport({
  onSuccess,
  onDelete,
  onUpdate,
  reportDetails,
}) {
  const hasReport = Array.isArray(reportDetails) && reportDetails.length > 0;
  const theme = useTheme();
  const { code } = useParams();
  const { showAlert } = useAlert();
  console.log("reportDetails in CreateReport:", reportDetails);

  // Utility for formatting date as YYYY-MM-DD
  const formatDate = (value) => {
    try {
      return new Date(value).toISOString().split("T")[0];
    } catch {
      return "N/A";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    let newReportDetails = Object.fromEntries(formData);

    newReportDetails = {
      ...newReportDetails,
      code: code,
      reportName: "Payment Times Reporting Scheme",
      reportStatus: "Created",
      currentStep: 0,
      createdBy: userService.userValue.id,
      clientId: userService.userValue.clientId,
    };

    try {
      const report = await reportService.create(newReportDetails);
      if (!report) {
        showAlert("Report not created", "error");
        return;
      }

      showAlert("Report created successfully", "success");
      if (onSuccess) onSuccess(report);
    } catch (error) {
      showAlert(error.message || "Error creating report", "error");
      console.error("Error creating report:", error);
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await reportService.delete(reportId);
      showAlert("Report deleted successfully", "success");
      if (onDelete) onDelete(); // Triggers refreshReports in the parent
    } catch (error) {
      showAlert(error.message || "Error deleting report", "error");
      console.error("Error deleting report:", error);
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={6} display="flex" alignItems="center">
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            maxWidth: 400,
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                label="Reporting Period"
                fullWidth
                defaultValue="1 July 2024 - 31 December 2024"
                SelectProps={{ native: true }}
              >
                <option value="1 July 2024 - 31 December 2024">
                  1 July 2024 - 31 December 2024
                </option>
              </TextField>
              <input
                type="hidden"
                name="ReportingPeriodStartDate"
                value="2024-07-01"
              />
              <input
                type="hidden"
                name="ReportingPeriodEndDate"
                value="2024-12-31"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={hasReport}
              >
                Create Report
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Grid>

      <Grid item xs={12} md={6} display="flex" alignItems="center">
        {!hasReport && (
          <Box
            sx={{
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
              padding: 3,
              boxShadow: 3,
              width: "100%",
            }}
          >
            No report created yet.
          </Box>
        )}
        {hasReport && (
          <Box
            sx={{
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
              padding: 3,
              boxShadow: 3,
              width: "100%",
            }}
          >
            <Typography variant="h6" gutterBottom>
              ✅ Report Created
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Report ID:</strong> {reportDetails[0]?.id}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Start Date:</strong>{" "}
              {formatDate(reportDetails[0]?.ReportingPeriodStartDate)}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>End Date:</strong>{" "}
              {formatDate(reportDetails[0]?.ReportingPeriodEndDate)}
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleDeleteReport(reportDetails[0]?.id)}
            >
              Delete Report
            </Button>
          </Box>
        )}
      </Grid>
    </Grid>
  );
}
