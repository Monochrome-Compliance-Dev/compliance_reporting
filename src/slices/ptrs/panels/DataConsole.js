import { io } from "socket.io-client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Divider,
  Paper,
  IconButton,
  Button,
  Stack,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  Tooltip,
  Chip,
  LinearProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useQueryClient } from "@tanstack/react-query";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import TableChartIcon from "@mui/icons-material/TableChart";
import { usePtrsContext } from "../context/PtrsContext";
import { useUpdatePtrsMutation } from "../hooks/usePtrsQueries";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";
import {
  addDataset,
  importWorkbook,
  listDatasets,
  removeDataset,
  updateDatasetSettings,
} from "../services/data.ptrsApi";
import CreateRunCard from "./CreateRunCard";
import { useAlert } from "context";
import { PTRS_ADAPTER_LABELS } from "../ingestConfig";

const REFERENCE_KIND_OPTIONS = [
  { value: "vendormaster", label: "Vendor Master" },
  { value: "termschanges", label: "Payment Terms Changes" },
  { value: "entitystructure", label: "Entity Structure" },
  { value: "invoices", label: "Invoice Context" },
  { value: "other", label: "Other" },
];

const TRANSACTION_ADAPTER_OPTIONS = [
  {
    value: "sap_accounting_event",
    label: PTRS_ADAPTER_LABELS.sap_accounting_event,
  },
  {
    value: "direct_payment",
    label: PTRS_ADAPTER_LABELS.direct_payment,
  },
];

const DATE_FORMAT_OPTIONS = [
  { value: "ISO", label: "YYYY-MM-DD" },
  { value: "MDY", label: "Month/day/year" },
  { value: "DMY", label: "Day/month/year" },
];

const transactionAdapterLabel = (adapterType) =>
  TRANSACTION_ADAPTER_OPTIONS.find((option) => option.value === adapterType)
    ?.label || adapterType;

const COLUMNS = [
  {
    key: "transaction",
    label: "Transaction datasets",
    purpose: "transaction",
  },
  {
    key: "reference",
    label: "Reference datasets",
    purpose: "reference",
  },
];

export default function DataConsole() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const {
    ptrsId,
    setPtrsId,
    refreshDatasets: refreshCtxDatasets,
  } = usePtrsContext();

  const { goTo } = usePtrsNavigation();

  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  const hasPtrs = Boolean(ptrsId);

  // Collapsibles
  const [isCreateCollapsed, setIsCreateCollapsed] = useState(false);
  const [isDataCollapsed, setIsDataCollapsed] = useState(false);

  // Datasets state
  const [datasets, setDatasets] = useState([]);
  const [purpose, setPurpose] = useState("transaction");
  const [transactionAdapterType, setTransactionAdapterType] = useState(
    "sap_accounting_event",
  );
  const [referenceKind, setReferenceKind] = useState("vendormaster");
  const [file, setFile] = useState(null);
  const [workbookFile, setWorkbookFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isWorkbookUploading, setIsWorkbookUploading] = useState(false);
  const [liveUploadStatus, setLiveUploadStatus] = useState(null);
  const [directSettings, setDirectSettings] = useState({});
  const [savingDatasetId, setSavingDatasetId] = useState(null);

  const refreshDatasets = useCallback(async () => {
    if (!ptrsId) return;
    try {
      const { items } = await listDatasets(ptrsId);
      setDatasets(items || []);
      setDirectSettings(
        Object.fromEntries(
          (items || [])
            .filter((dataset) => dataset.adapterType === "direct_payment")
            .map((dataset) => [
              dataset.id,
              {
                dateFormat: dataset.dateFormat || "",
                reportingEntityName: dataset.reportingEntity?.entityName || "",
                reportingEntityAbn: dataset.reportingEntity?.abn || "",
              },
            ]),
        ),
      );
    } catch (err) {
      console.error(err);
      showAlert("Failed to load datasets", "error");
    }
  }, [ptrsId, showAlert]);

  useEffect(() => {
    if (!ptrsId) return;
    (async () => {
      try {
        await refreshDatasets();
      } catch {
        await refreshCtxDatasets?.();
      }
    })();
  }, [ptrsId, refreshCtxDatasets, refreshDatasets]);

  const uploadStatus = useMemo(() => {
    const s = liveUploadStatus?.status;
    return typeof s === "string" ? s.toUpperCase() : "";
  }, [liveUploadStatus]);

  const isUploadActive =
    uploadStatus === "UPLOADING" || uploadStatus === "PROCESSING";
  const isUploadComplete = uploadStatus === "COMPLETE";
  const isUploadFailed = uploadStatus === "FAILED";

  const rowsInserted = Number(liveUploadStatus?.rowsInserted || 0);
  const totalRows = Number(liveUploadStatus?.totalRows || 0);
  const progressPct =
    totalRows > 0
      ? Math.min(100, Math.round((rowsInserted / totalRows) * 100))
      : 0;
  const uploadError = liveUploadStatus?.error || null;
  const updatedAt = liveUploadStatus?.updatedAt || null;
  const uploadRole = liveUploadStatus?.role || null;
  const uploadSourceType = liveUploadStatus?.sourceType || null;

  useEffect(() => {
    if (!liveUploadStatus) return undefined;
    if (isUploadActive) return undefined;

    const timeoutMs = isUploadComplete ? 4000 : isUploadFailed ? 8000 : 0;
    if (!timeoutMs) return undefined;

    const timer = window.setTimeout(() => {
      setLiveUploadStatus((prev) => {
        if (!prev) return prev;
        const prevStatus = String(prev.status || "").toUpperCase();
        if (
          (isUploadComplete && prevStatus === "COMPLETE") ||
          (isUploadFailed && prevStatus === "FAILED")
        ) {
          return null;
        }
        return prev;
      });
    }, timeoutMs);

    return () => window.clearTimeout(timer);
  }, [liveUploadStatus, isUploadActive, isUploadComplete, isUploadFailed]);

  useEffect(() => {
    if (!ptrsId) return;

    const socketBaseUrl =
      process.env.REACT_APP_SOCKET_URL ||
      (process.env.REACT_APP_API_URL
        ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, "")
        : "http://localhost:4000");

    const socket = io(socketBaseUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    const onStatus = (payload) => {
      if (!payload || payload.ptrsId !== ptrsId) return;
      setLiveUploadStatus(payload);
    };

    socket.on("connect", () => {
      socket.emit("ptrs:join", { ptrsId });
    });

    socket.on("ptrs:csvUploadStatus", onStatus);

    return () => {
      try {
        socket.emit("ptrs:leave", { ptrsId });
      } catch (_) {}
      socket.off("ptrs:csvUploadStatus", onStatus);
      socket.disconnect();
    };
  }, [ptrsId]);

  const doUpload = async () => {
    if (!ptrsId) {
      showAlert("Create a PTRS first", "info");
      return;
    }
    if (!file) {
      showAlert("Choose a file to upload", "info");
      return;
    }
    const fileName = String(file?.name || "").toLowerCase();
    const isCsv =
      fileName.endsWith(".csv") || String(file?.type || "").includes("csv");
    if (!isCsv) {
      showAlert("CSV files only — please export as CSV and retry", "error");
      return;
    }
    if (!purpose) {
      showAlert("Select a dataset purpose", "info");
      return;
    }
    setIsUploading(true);
    setLiveUploadStatus(null);
    setLiveUploadStatus({
      ptrsId,
      datasetId: null,
      role: purpose === "transaction" ? "transaction" : referenceKind,
      sourceType: "csv",
      status: "uploading",
      rowsInserted: 0,
      totalRows: 0,
      error: null,
    });
    try {
      await addDataset(ptrsId, file, {
        purpose,
        referenceKind: purpose === "reference" ? referenceKind : null,
        sourceFormat: "csv",
        adapterType: purpose === "transaction" ? transactionAdapterType : null,
        adapterVersion: purpose === "transaction" ? "1" : null,
        sourceName: file.name,
      });
      setFile(null);
      await refreshDatasets();
      await refreshCtxDatasets?.();
      showAlert("Dataset uploaded", "success");
    } catch (err) {
      setLiveUploadStatus((prev) => ({
        ptrsId,
        datasetId: prev?.datasetId || null,
        role:
          prev?.role ||
          (purpose === "transaction" ? "transaction" : referenceKind),
        sourceType: prev?.sourceType || "csv",
        status: "failed",
        rowsInserted: Number(prev?.rowsInserted || 0),
        totalRows: Number(prev?.totalRows || 0),
        error: err?.message || "Upload failed",
        updatedAt: new Date().toISOString(),
      }));
      console.error(err);
      showAlert(err?.message || "Upload failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const doWorkbookUpload = async () => {
    if (!ptrsId || !workbookFile) return;
    setIsWorkbookUploading(true);
    try {
      const result = await importWorkbook(ptrsId, workbookFile);
      setWorkbookFile(null);
      await refreshDatasets();
      await refreshCtxDatasets?.();
      showAlert(
        `${result.datasets.length} workbook sheet${result.datasets.length === 1 ? "" : "s"} imported`,
        "success",
      );
    } catch (err) {
      console.error(err);
      showAlert(err?.message || "Workbook import failed", "error");
    } finally {
      setIsWorkbookUploading(false);
    }
  };

  const onDelete = async (datasetId) => {
    try {
      await removeDataset(ptrsId, datasetId);
      await refreshDatasets();
      showAlert("Dataset removed", "success");
    } catch (err) {
      console.error(err);
      showAlert("Failed to remove dataset", "error");
    }
  };

  const updateDirectSetting = (datasetId, field, value) => {
    setDirectSettings((current) => ({
      ...current,
      [datasetId]: {
        ...(current[datasetId] || {}),
        [field]: value,
      },
    }));
  };

  const saveDirectSettings = async (datasetId) => {
    const settings = directSettings[datasetId] || {};
    if (
      !settings.dateFormat ||
      !String(settings.reportingEntityName || "").trim() ||
      !String(settings.reportingEntityAbn || "").trim()
    ) {
      showAlert(
        "Select a date format and enter the reporting entity name and supplied ABN",
        "error",
      );
      return;
    }
    setSavingDatasetId(datasetId);
    try {
      const updated = await updateDatasetSettings(ptrsId, datasetId, settings);
      queryClient.setQueryData(["ptrs", "datasets", ptrsId], (current) =>
        current
          ? {
              ...current,
              items: (current.items || []).map((dataset) =>
                dataset.id === datasetId ? updated : dataset,
              ),
            }
          : current,
      );
      await refreshDatasets();
      showAlert("Direct-payment dataset settings saved", "success");
    } catch (error) {
      showAlert(error?.message || "Failed to save dataset settings", "error");
    } finally {
      setSavingDatasetId(null);
    }
  };

  const goToTables = async () => {
    if (!ptrsId) {
      showAlert("Create a PTRS first", "info");
      return;
    }

    try {
      // Mark this PTRS as having completed the data step and moving to tables
      await updatePtrsStep.mutateAsync({ currentStep: "tables" });
    } catch (err) {
      console.error(err);
      // Don't block navigation if the step update fails
      showAlert(
        "Failed to update PTRS step. Continuing to Tables & Joins.",
        "warning",
      );
    }

    goTo("tables");
  };

  return (
    <Box
      sx={{
        padding: theme.spacing(4),
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      <Typography variant="h4" gutterBottom>
        PTRS Data Console (v2)
      </Typography>
      <Typography variant="body1" gutterBottom>
        Create a PTRS, upload one or more Transactions datasets (CSV and/or
        Xero), upload supporting datasets (vendor master, terms), then proceed
        to mapping.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Create PTRS */}
      <Box sx={{ mb: 4 }}>
        <Paper elevation={3} sx={{ padding: theme.spacing(3) }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6">Create PTRS</Typography>
            <IconButton
              onClick={() => setIsCreateCollapsed(!isCreateCollapsed)}
              size="small"
            >
              {isCreateCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </IconButton>
          </Box>
          {!isCreateCollapsed && (
            <CreateRunCard
              onSuccess={(newPtrsId) => {
                if (newPtrsId) setPtrsId(newPtrsId);
              }}
            />
          )}
        </Paper>
      </Box>

      {/* Data mgmt */}
      {hasPtrs && (
        <Box sx={{ mb: 4 }}>
          <Paper elevation={3} sx={{ padding: theme.spacing(3) }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">Datasets</Typography>
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
                  color="text.secondary"
                  gutterBottom
                  sx={{ mb: 2 }}
                >
                  Upload transaction datasets independently, then add any
                  reference data such as Vendor Master or Payment Terms.
                </Typography>

                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="subtitle1">
                    Import a self-contained workbook
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Each configured worksheet becomes an ordinary transaction or
                    reference dataset. Sheet names, roles and required columns
                    come from the selected PTRS profile.
                  </Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ sm: "center" }}
                  >
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<UploadFileIcon />}
                      disabled={isWorkbookUploading}
                    >
                      Choose workbook
                      <input
                        key={workbookFile ? "selected" : "empty"}
                        hidden
                        type="file"
                        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                        onChange={(event) =>
                          setWorkbookFile(event.target.files?.[0] || null)
                        }
                      />
                    </Button>
                    <Tooltip
                      title={
                        workbookFile ? workbookFile.name : "No workbook chosen"
                      }
                    >
                      <Chip
                        label={workbookFile ? workbookFile.name : "No workbook"}
                        variant="outlined"
                      />
                    </Tooltip>
                    <Button
                      variant="contained"
                      onClick={doWorkbookUpload}
                      disabled={!workbookFile || isWorkbookUploading}
                    >
                      {isWorkbookUploading ? "Importing..." : "Import workbook"}
                    </Button>
                  </Stack>
                </Paper>

                {/* Columns */}
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={3}
                  sx={{ mb: 3 }}
                >
                  {COLUMNS.map((col) => {
                    const colDatasets = datasets.filter(
                      (dataset) => dataset.purpose === col.purpose,
                    );

                    return (
                      <Paper
                        key={col.key}
                        variant="outlined"
                        sx={{ p: 2, flex: 1 }}
                      >
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                          {col.label}
                        </Typography>

                        {col.key === "transaction" && (
                          <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="transaction-source-type-label">
                              Transaction source type
                            </InputLabel>
                            <Select
                              labelId="transaction-source-type-label"
                              label="Transaction source type"
                              value={transactionAdapterType}
                              onChange={(event) =>
                                setTransactionAdapterType(event.target.value)
                              }
                            >
                              {TRANSACTION_ADAPTER_OPTIONS.map((option) => (
                                <MenuItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}

                        {col.key === "reference" && (
                          <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="supporting-role-select-label">
                              Supporting dataset type
                            </InputLabel>
                            <Select
                              labelId="supporting-role-select-label"
                              label="Supporting dataset type"
                              value={referenceKind}
                              onChange={(e) => setReferenceKind(e.target.value)}
                            >
                              {REFERENCE_KIND_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}

                        <Stack spacing={1} sx={{ mb: 2 }}>
                          {colDatasets.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No files uploaded.
                            </Typography>
                          ) : (
                            colDatasets.map((d) => (
                              <Paper
                                key={d.id}
                                variant="outlined"
                                sx={{
                                  p: 1.5,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <Box>
                                    <Typography variant="body2">
                                      {d.sourceName || d.fileName || "Dataset"}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {d.referenceKind
                                        ? `${REFERENCE_KIND_OPTIONS.find((option) => option.value === d.referenceKind)?.label || d.referenceKind} • `
                                        : ""}
                                      {d.adapterType
                                        ? `${transactionAdapterLabel(d.adapterType)} • `
                                        : ""}
                                      {d.sourceFormat?.toUpperCase() || "CSV"} •
                                      Rows: {d.rowsCount ?? "?"} •{" "}
                                      {d.status || "unknown"}
                                    </Typography>
                                  </Box>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => onDelete(d.id)}
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                                {d.adapterType === "direct_payment" ? (
                                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Governed payer identity and source date
                                      convention for this dataset
                                    </Typography>
                                    <TextField
                                      size="small"
                                      label="Reporting entity name"
                                      value={
                                        directSettings[d.id]
                                          ?.reportingEntityName || ""
                                      }
                                      onChange={(event) =>
                                        updateDirectSetting(
                                          d.id,
                                          "reportingEntityName",
                                          event.target.value,
                                        )
                                      }
                                    />
                                    <TextField
                                      size="small"
                                      label="Reporting entity ABN"
                                      value={
                                        directSettings[d.id]
                                          ?.reportingEntityAbn || ""
                                      }
                                      onChange={(event) =>
                                        updateDirectSetting(
                                          d.id,
                                          "reportingEntityAbn",
                                          event.target.value,
                                        )
                                      }
                                    />
                                    <FormControl size="small" fullWidth>
                                      <InputLabel
                                        id={`date-format-${d.id}-label`}
                                      >
                                        Source date format
                                      </InputLabel>
                                      <Select
                                        labelId={`date-format-${d.id}-label`}
                                        label="Source date format"
                                        value={
                                          directSettings[d.id]?.dateFormat || ""
                                        }
                                        onChange={(event) =>
                                          updateDirectSetting(
                                            d.id,
                                            "dateFormat",
                                            event.target.value,
                                          )
                                        }
                                      >
                                        {DATE_FORMAT_OPTIONS.map((option) => (
                                          <MenuItem
                                            key={option.value}
                                            value={option.value}
                                          >
                                            {option.label}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      disabled={savingDatasetId === d.id}
                                      onClick={() => saveDirectSettings(d.id)}
                                    >
                                      {savingDatasetId === d.id
                                        ? "Saving..."
                                        : "Save direct-payment settings"}
                                    </Button>
                                  </Stack>
                                ) : null}
                              </Paper>
                            ))
                          )}
                        </Stack>

                        <Button
                          component="label"
                          fullWidth
                          variant="outlined"
                          startIcon={<UploadFileIcon />}
                          onClick={() => setPurpose(col.purpose)}
                        >
                          {col.key === "reference"
                            ? "Upload reference CSV"
                            : "Upload transaction CSV"}
                          <input
                            hidden
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(e) =>
                              setFile(e.target.files?.[0] || null)
                            }
                          />
                        </Button>
                      </Paper>
                    );
                  })}
                </Stack>

                {/* Uploader controls */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems="center"
                  sx={{ mb: 3 }}
                >
                  <Tooltip title={file ? file.name : "No file chosen"}>
                    <Chip
                      label={file ? file.name : "No file"}
                      variant="outlined"
                    />
                  </Tooltip>
                  <Button
                    variant="contained"
                    onClick={doUpload}
                    disabled={isUploading || !file}
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                  {liveUploadStatus ? (
                    <Box
                      sx={{
                        minWidth: { xs: "100%", md: 280 },
                        maxWidth: isUploadActive ? 420 : 320,
                        flex: isUploadActive ? 1 : 0,
                        border: "1px solid",
                        borderColor: isUploadFailed
                          ? theme.palette.error.main
                          : isUploadComplete
                            ? theme.palette.success.main
                            : "divider",
                        borderRadius: 1,
                        px: 1.5,
                        py: 1,
                        bgcolor: theme.palette.background.paper,
                      }}
                    >
                      <Stack spacing={0.75}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {isUploadFailed
                              ? uploadError || "Upload failed"
                              : isUploadComplete
                                ? "Upload complete"
                                : "Uploading CSV..."}
                          </Typography>
                          <Chip
                            size="small"
                            label={uploadStatus || "PENDING"}
                            color={
                              isUploadFailed
                                ? "error"
                                : isUploadComplete
                                  ? "success"
                                  : "info"
                            }
                            variant={isUploadActive ? "filled" : "outlined"}
                          />
                        </Box>

                        {(uploadRole || uploadSourceType) && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            {uploadRole ? `Role: ${uploadRole}` : ""}
                            {uploadRole && uploadSourceType ? " • " : ""}
                            {uploadSourceType
                              ? `Source: ${uploadSourceType}`
                              : ""}
                          </Typography>
                        )}

                        {updatedAt && !isUploadActive && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            Updated:{" "}
                            {new Date(updatedAt).toLocaleTimeString("en-AU")}
                          </Typography>
                        )}

                        {isUploadActive && (
                          <LinearProgress
                            variant={
                              totalRows > 0 ? "determinate" : "indeterminate"
                            }
                            value={totalRows > 0 ? progressPct : 0}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        )}

                        <Typography variant="caption" color="text.secondary">
                          Rows inserted: {rowsInserted.toLocaleString("en-AU")}
                          {totalRows > 0
                            ? ` / ${totalRows.toLocaleString("en-AU")}`
                            : ""}
                          {totalRows > 0 && isUploadActive
                            ? ` (${progressPct}%)`
                            : ""}
                        </Typography>
                      </Stack>
                    </Box>
                  ) : null}
                  <Button
                    variant="text"
                    startIcon={<TableChartIcon />}
                    onClick={goToTables}
                  >
                    Go to Tables & Joins
                  </Button>
                </Stack>
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
