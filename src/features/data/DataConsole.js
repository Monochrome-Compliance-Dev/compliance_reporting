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

const MAX_IN_MEMORY_ERRORS = 500; // protect browser memory
const MAX_IN_MEMORY_VALID = 1000; // small preview of valid rows
const DEFAULT_PAGE_SIZE = 100; // what we ask the BE for

export default function DataConsole() {
  const theme = useTheme();
  const { ptrsDetails, refreshPtrs, activePtrsId } = usePtrsContext();
  const [errPage, setErrPage] = useState(1);
  const [errPageSize, setErrPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [errTotal, setErrTotal] = useState(0);
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

  const normalizeResult = (res) => {
    if (!res) return { rows: [], total: 0 };
    if (Array.isArray(res)) return { rows: res, total: res.length };
    const rows = Array.isArray(res.data) ? res.data : [];
    const total = Number(res.total ?? rows.length) || 0;
    return { rows, total };
  };

  const refreshUploadedData = useCallback(async () => {
    if (!ptrsId) return;
    try {
      const [validRes, errorsRes] = await Promise.all([
        tcpService.getTcpByPtrsId(ptrsId),
        tcpService.getErrorsByPtrsId(ptrsId, {
          page: errPage,
          pageSize: errPageSize,
        }),
      ]);

      // valid preview – cap
      const validNorm = Array.isArray(validRes)
        ? validRes
        : validRes?.data || [];
      setValidPreview(validNorm.slice(0, MAX_IN_MEMORY_VALID));

      // errors – honor server page if supported, else slice client-side
      const { rows: errRows, total } = normalizeResult(errorsRes);
      const limited = errRows.slice(
        0,
        Math.min(errPageSize, MAX_IN_MEMORY_ERRORS)
      );
      if (errRows.length > MAX_IN_MEMORY_ERRORS) {
        // eslint-disable-next-line no-console
        console.warn(
          `[DataConsole] Received ${errRows.length} error rows, capping in-memory to ${MAX_IN_MEMORY_ERRORS}.`
        );
      }
      setErrorRecords(limited);
      setErrTotal(Number(total) || limited.length);
    } catch (err) {
      console.error("Error refreshing records:", err);
    }
  }, [ptrsId, errPage, errPageSize]);

  useEffect(() => {
    if (!ptrsId) return;
    let cancelled = false;
    const doFetch = async () => {
      if (document.visibilityState !== "visible") return;
      if (!cancelled) await refreshUploadedData();
    };
    doFetch();
    const onVis = () => {
      if (document.visibilityState === "visible") doFetch();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ptrsId, refreshUploadedData]);

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
                    /* NEW: paging info so the child can request pages instead of everything */
                    errorsPage={errPage}
                    errorsPageSize={errPageSize}
                    errorsTotal={errTotal}
                    onErrorsPageChange={(page) => setErrPage(page)}
                    onErrorsPageSizeChange={(size) => setErrPageSize(size)}
                    /* REPLACED: no more updateCachedRecords; keep memory usage capped */
                    onErrorsUpdated={(updatedErrors) => {
                      setErrorRecords(
                        Array.isArray(updatedErrors)
                          ? updatedErrors.slice(0, MAX_IN_MEMORY_ERRORS)
                          : []
                      );
                    }}
                    onRecordsUpdated={(errors, valid) => {
                      setErrorRecords(
                        Array.isArray(errors)
                          ? errors.slice(0, MAX_IN_MEMORY_ERRORS)
                          : []
                      );
                      setValidPreview(
                        Array.isArray(valid)
                          ? valid.slice(0, MAX_IN_MEMORY_VALID)
                          : []
                      );
                    }}
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
