import { usePtrsContext } from "../../context";
import { useState, useEffect, useCallback, useMemo } from "react";
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
  const { ptrsDetails, refreshPtrs, activePtrsId } = usePtrsContext();
  // console.log("ptrsDetails:", ptrsDetails);

  // Prefer the active PTRS id from context; fall back to the first item
  const ptrsId = useMemo(
    () => activePtrsId || ptrsDetails?.[0]?.id || null,
    [activePtrsId, ptrsDetails]
  );

  const hasPtrs = Boolean(ptrsId);

  // --- Add state for records ---
  const [errorRecords, setErrorRecords] = useState([]);
  const [validPreview, setValidPreview] = useState([]);

  // --- Add state for collapsible sections ---
  const [isCreateCollapsed, setIsCreateCollapsed] = useState(false);
  const [isDataCollapsed, setIsDataCollapsed] = useState(false);

  const updateCachedRecords = (errors, valid) => {
    setErrorRecords(errors);
    setValidPreview(valid);
    if (!ptrsId) return;
    const cacheKey = `tcp_records_${ptrsId}`;
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ errors, valid }));
    } catch (_) {
      /* ignore quota errors */
    }
  };

  const normalizeResult = (res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  };

  const refreshUploadedData = useCallback(async () => {
    if (!ptrsId) return;
    // console.log("Refreshing uploaded data for ptrsId:", ptrsId);
    const cacheKey = `tcp_records_${ptrsId}`;
    try {
      const [validRes, errorsRes] = await Promise.all([
        tcpService.getTcpByPtrsId(ptrsId),
        tcpService.getErrorsByPtrsId(ptrsId),
      ]);
      const valid = normalizeResult(validRes);
      const errors = normalizeResult(errorsRes);
      setValidPreview(valid);
      setErrorRecords(errors);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ errors, valid }));
      } catch (_) {
        /* ignore quota */
      }
    } catch (err) {
      console.error("Error refreshing records:", err);
    }
  }, [ptrsId]);

  // --- Load records for ptrsId ---
  useEffect(() => {
    if (!ptrsId) return; // wait until we have a concrete id
    const cacheKey = `tcp_records_${ptrsId}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const cachedErrors = Array.isArray(parsed?.errors) ? parsed.errors : [];
        const cachedValid = Array.isArray(parsed?.valid) ? parsed.valid : [];
        if (cachedErrors.length > 0 || cachedValid.length > 0) {
          setErrorRecords(cachedErrors);
          setValidPreview(cachedValid);
          return; // only short-circuit if cache has data
        }
      }
    } catch (_) {
      /* ignore */
    }

    // No usable cache → fetch from backend
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
        Start by creating a ptrs container, then prepare your dataset for
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
            <Typography variant="h6">Create Ptrs Container</Typography>
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
                  ptrs.
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
