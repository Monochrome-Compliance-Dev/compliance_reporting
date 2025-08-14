import {
  Box,
  TextField,
  Button,
  Grid,
  useTheme,
  Typography,
} from "@mui/material";
import { useParams } from "react-router";
import { ptrsService, userService } from "../../services";
import { useAlert } from "../../context";

export default function CreatePtrs({
  onSuccess,
  onDelete,
  onUpdate,
  ptrsDetails,
}) {
  const hasPtrs = Array.isArray(ptrsDetails) && ptrsDetails.length > 0;
  const theme = useTheme();
  const { code } = useParams();
  const { showAlert } = useAlert();
  // console.log("ptrsDetails in CreatePtrs:", ptrsDetails);

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
    let newPtrsDetails = Object.fromEntries(formData);

    newPtrsDetails = {
      ...newPtrsDetails,
      status: "Created",
      currentStep: 0,
      createdBy: userService.userValue.id,
      clientId: userService.userValue.clientId,
    };

    try {
      const ptrs = await ptrsService.create(newPtrsDetails);
      if (!ptrs) {
        showAlert("PTRS not created", "error");
        return;
      }

      showAlert("PTRS created successfully", "success");
      if (onSuccess) onSuccess(ptrs);
    } catch (error) {
      showAlert(error.message || "Error creating PTRS", "error");
      console.error("Error creating PTRS:", error);
    }
  };

  const handleDeletePtrs = async (ptrsId) => {
    try {
      await ptrsService.delete(ptrsId);
      showAlert("PTRS deleted successfully", "success");
      if (onDelete) onDelete(); // Triggers refreshPtrs in the parent
    } catch (error) {
      showAlert(error.message || "Error deleting PTRS", "error");
      console.error("Error deleting PTRS:", error);
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
                defaultValue="1 January 2025 - 30 June 2025"
                SelectProps={{ native: true }}
              >
                <option value="1 July 2024 - 31 December 2024">
                  1 July 2024 - 31 December 2024
                </option>
                <option value="1 January 2025 - 30 June 2025">
                  1 January 2025 - 30 June 2025
                </option>
              </TextField>
              <input
                type="hidden"
                name="reportingPeriodStartDate"
                value="2025-01-01"
              />
              <input
                type="hidden"
                name="reportingPeriodEndDate"
                value="2025-06-30"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={hasPtrs}
              >
                Create PTRS
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Grid>

      <Grid item xs={12} md={6} display="flex" alignItems="center">
        {!hasPtrs && (
          <Box
            sx={{
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
              padding: 3,
              boxShadow: 3,
              width: "100%",
            }}
          >
            No PTRS report created yet.
          </Box>
        )}
        {hasPtrs && (
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
              ✅ PTRS Report Created
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>PTRS ID:</strong> {ptrsDetails[0]?.id}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Start Date:</strong>{" "}
              {formatDate(ptrsDetails[0]?.reportingPeriodStartDate)}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>End Date:</strong>{" "}
              {formatDate(ptrsDetails[0]?.reportingPeriodEndDate)}
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleDeletePtrs(ptrsDetails[0]?.id)}
            >
              Delete PTRS
            </Button>
          </Box>
        )}
      </Grid>
    </Grid>
  );
}
