import { usePtrsContext } from "../../context";
import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Divider, Paper, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CreatePtrs from "../ptrs/CreatePtrs";
import ConnectExternalSystems from "../ptrs/ConnectExternalSystems";
import DataUploadReview from "../ptrs/DataUploadReview";
import { tcpService } from "../../services/";

export default function DataConsole() {
  const theme = useTheme();
  const { ptrsDetails, refreshPtrs } = usePtrsContext();
  console.log("DataConsole ptrsDetails:", ptrsDetails);

  const latestPtrs = Array.isArray(ptrsDetails)
    ? ptrsDetails.find((r) => r.code === "ptrs")
    : null;
  const ptrsId = latestPtrs?.id;

  const hasPtrs = Array.isArray(ptrsDetails) && ptrsDetails.length > 0;

  // --- Add state for records ---
  const [errorRecords, setErrorRecords] = useState([]);
  const [validPreview, setValidPreview] = useState([]);

  // --- Add state for collapsible sections ---
  const [isCreateCollapsed, setIsCreateCollapsed] = useState(false);
  const [isDataCollapsed, setIsDataCollapsed] = useState(false);

  const updateCachedRecords = (errors, valid) => {
    setErrorRecords(errors);
    setValidPreview(valid);
    const cacheKey = `tcp_records_${ptrsId}`;
    sessionStorage.setItem(cacheKey, JSON.stringify({ errors, valid }));
  };

  const refreshUploadedData = useCallback(() => {
    console.log("Refreshing uploaded data for ptrsId:", ptrsId);
    if (!ptrsId) return;
    const cacheKey = `tcp_records_${ptrsId}`;

    Promise.all([
      tcpService.getTcpByReportId(ptrsId),
      tcpService.getErrorsByReportId(ptrsId),
    ])
      .then(([valid, errors]) => {
        console.log("Fetched valid records:", valid);
        setValidPreview(valid);
        setErrorRecords(errors);
        sessionStorage.setItem(cacheKey, JSON.stringify({ errors, valid }));
      })
      .catch((err) => {
        console.error("Error refreshing records:", err);
      });
  }, [ptrsId]);

  // --- Load records for ptrsId ---
  useEffect(() => {
    const cacheKey = `tcp_records_${ptrsId}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached);
      setErrorRecords(parsed.errors || []);
      setValidPreview(parsed.valid || []);
      return;
    }

    refreshUploadedData();
  }, [refreshUploadedData, ptrsId]);

  return (
    <Box
      sx={{
        padding: theme.spacing(4),
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      <Typography variant="h4" gutterBottom>
        PTRS Data Console
      </Typography>
      <Typography variant="body1" gutterBottom>
        Start by creating a report container, then prepare your dataset for
        import.
      </Typography>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ mb: 4 }}>
        <Paper elevation={3} sx={{ padding: theme.spacing(3) }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6">Create Report Container</Typography>
            <IconButton
              onClick={() => setIsCreateCollapsed(!isCreateCollapsed)}
              size="small"
            >
              {isCreateCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </IconButton>
          </Box>
          {!isCreateCollapsed && (
            <CreatePtrs
              ptrsDetails={ptrsDetails}
              onSuccess={refreshPtrs}
              onDelete={refreshPtrs}
            />
          )}
        </Paper>
      </Box>

      {hasPtrs && (
        <Box sx={{ mb: 4 }}>
          <Paper elevation={3} sx={{ padding: theme.spacing(3) }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">Data Management</Typography>
              <IconButton
                onClick={() => setIsDataCollapsed(!isDataCollapsed)}
                size="small"
              >
                {isDataCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
            </Box>
            {!isDataCollapsed && (
              <Box>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  gutterBottom
                  sx={{ mb: 2 }}
                >
                  Ingest, validate and enrich datasets linked to your created
                  report.
                </Typography>

                <Typography variant="subtitle1" sx={{ mt: 2, mb: 2 }}>
                  Connect to External Data Source
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <ConnectExternalSystems
                    onUploadComplete={refreshUploadedData}
                  />
                </Box>

                <Divider sx={{ my: 4 }} />

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Imported Datasets
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 2 }}
                  >
                    Below is a placeholder for datasets you’ve uploaded or
                    fetched.
                  </Typography>
                  <DataUploadReview
                    errors={errorRecords}
                    validRecordsPreview={validPreview}
                    onErrorsUpdated={(updatedErrors) =>
                      updateCachedRecords(updatedErrors, validPreview)
                    }
                    onRecordsUpdated={updateCachedRecords}
                    onRefreshClick={refreshUploadedData}
                  />
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
