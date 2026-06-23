import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LinkIcon from "@mui/icons-material/Link";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useNavigate, useSearchParams } from "react-router";
import { useAlert } from "context";
import { useDataHubContext } from "../context/DataHubContext";
import {
  listDatasets,
  removeDataset,
  uploadDataset,
} from "../services/data.dhApi";

const ROLE_OPTIONS = [
  { value: "payments", label: "Payments / Transactions (CSV)" },
  { value: "invoices", label: "Invoices (CSV)" },
  { value: "vendormaster", label: "Vendor Master" },
  { value: "termschanges", label: "Payment Terms Changes" },
  { value: "entitystructure", label: "Entity Structure" },
  { value: "other", label: "Other" },
];

const COLUMNS = [
  { key: "payments", label: "Payments / Transactions", roles: ["payments"] },
  { key: "invoices", label: "Invoices", roles: ["invoices"] },
  {
    key: "supporting",
    label: "Supporting datasets",
    roles: ["vendormaster", "termschanges", "entitystructure", "other"],
  },
];

export default function UploadPanel() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const runId = params.get("runId");
  const { showAlert } = useAlert();
  const { selectedRun, selectRun } = useDataHubContext();

  const [datasets, setDatasets] = useState([]);
  const [role, setRole] = useState("payments");
  const [supportingRole, setSupportingRole] = useState("vendormaster");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [liveUploadStatus, setLiveUploadStatus] = useState(null);

  useEffect(() => {
    if (!runId) return;
    selectRun(runId).catch((err) => {
      console.error("[DataHubUpload] failed to select run:", err);
      showAlert("Failed to load Data Hub run", "error");
    });
  }, [runId, selectRun, showAlert]);

  const refreshDatasets = useCallback(async () => {
    if (!runId) return;
    try {
      const { items } = await listDatasets(runId);
      setDatasets(items || []);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load datasets", "error");
    }
  }, [runId, showAlert]);

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  const uploadStatus = useMemo(() => {
    const s = liveUploadStatus?.status;
    return typeof s === "string" ? s.toUpperCase() : "";
  }, [liveUploadStatus]);

  const isUploadActive =
    uploadStatus === "UPLOADING" || uploadStatus === "PROCESSING";
  const isUploadComplete =
    uploadStatus === "COMPLETE" || uploadStatus === "UPLOADED";
  const isUploadFailed = uploadStatus === "FAILED";

  const rowsInserted = Number(liveUploadStatus?.rowsInserted || 0);
  const totalRows = Number(liveUploadStatus?.totalRows || 0);
  const progressPct =
    totalRows > 0
      ? Math.min(100, Math.round((rowsInserted / totalRows) * 100))
      : 0;
  const uploadError = liveUploadStatus?.error || null;
  const updatedAt =
    liveUploadStatus?.updatedAt || liveUploadStatus?.uploadedAt || null;
  const uploadRole =
    liveUploadStatus?.role || liveUploadStatus?.datasetType || null;

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
          (isUploadComplete && ["COMPLETE", "UPLOADED"].includes(prevStatus)) ||
          (isUploadFailed && prevStatus === "FAILED")
        ) {
          return null;
        }
        return prev;
      });
    }, timeoutMs);

    return () => window.clearTimeout(timer);
  }, [liveUploadStatus, isUploadActive, isUploadComplete, isUploadFailed]);

  async function doUpload() {
    if (!runId)
      return showAlert("Select or create a Data Hub run first", "info");
    if (!file) return showAlert("Choose a file to upload", "info");

    const fileName = String(file?.name || "").toLowerCase();
    const isCsv =
      fileName.endsWith(".csv") || String(file?.type || "").includes("csv");
    if (!isCsv)
      return showAlert(
        "CSV files only — please export as CSV and retry",
        "error",
      );
    if (!role) return showAlert("Select a role for the file", "info");

    try {
      setIsUploading(true);
      setLiveUploadStatus({
        runId,
        datasetId: null,
        role,
        datasetType: role,
        sourceType: "csv",
        status: "uploading",
        rowsInserted: 0,
        totalRows: 0,
        error: null,
        updatedAt: new Date().toISOString(),
      });

      const result = await uploadDataset(runId, role, file);
      setLiveUploadStatus({
        ...result,
        role,
        sourceType: "csv",
        status: "complete",
        totalRows: result.rowsInserted,
        updatedAt: result.uploadedAt || new Date().toISOString(),
      });
      setFile(null);
      await refreshDatasets();
      showAlert("Dataset uploaded", "success");
    } catch (err) {
      console.error(err);
      setLiveUploadStatus((prev) => ({
        runId,
        datasetId: prev?.datasetId || null,
        role: prev?.role || role,
        datasetType: prev?.datasetType || role,
        sourceType: prev?.sourceType || "csv",
        status: "failed",
        rowsInserted: Number(prev?.rowsInserted || 0),
        totalRows: Number(prev?.totalRows || 0),
        error: err?.message || "Upload failed",
        updatedAt: new Date().toISOString(),
      }));
      showAlert(err?.message || "Upload failed", "error");
    } finally {
      setIsUploading(false);
    }
  }

  async function onDelete(datasetId) {
    try {
      await removeDataset(runId, datasetId);
      await refreshDatasets();
      showAlert("Dataset removed", "success");
    } catch (err) {
      console.error(err);
      showAlert("Failed to remove dataset", "error");
    }
  }

  function goToLink() {
    if (!runId) {
      showAlert("Select or create a Data Hub run first", "info");
      return;
    }
    navigate(`/app/data-hub/link?runId=${encodeURIComponent(runId)}`);
  }

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Upload data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Run: {selectedRun?.name || runId || <em>none</em>}
          </Typography>
        </Box>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6">Datasets</Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                {COLUMNS.map((col) => {
                  const colDatasets = datasets.filter((d) =>
                    col.roles.includes(d.role || d.datasetType),
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

                      {col.key === "supporting" && (
                        <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                          <InputLabel id="supporting-role-select-label">
                            Supporting dataset type
                          </InputLabel>
                          <Select
                            labelId="supporting-role-select-label"
                            label="Supporting dataset type"
                            value={supportingRole}
                            onChange={(e) => setSupportingRole(e.target.value)}
                          >
                            {ROLE_OPTIONS.filter((opt) =>
                              [
                                "vendormaster",
                                "termschanges",
                                "entitystructure",
                                "other",
                              ].includes(opt.value),
                            ).map((opt) => (
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
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1,
                              }}
                            >
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" noWrap>
                                  {d.sourceName || d.fileName || "Dataset"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Rows:{" "}
                                  {(
                                    d.rowsCount ??
                                    d.rowsInserted ??
                                    0
                                  ).toLocaleString("en-AU")}
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => onDelete(d.id)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Paper>
                          ))
                        )}
                      </Stack>

                      <Button
                        component="label"
                        fullWidth
                        variant="outlined"
                        startIcon={<UploadFileIcon />}
                        onClick={() =>
                          setRole(
                            col.key === "supporting"
                              ? supportingRole
                              : col.roles[0],
                          )
                        }
                      >
                        {col.key === "supporting"
                          ? "Choose supporting CSV"
                          : "Choose CSV"}
                        <input
                          hidden
                          type="file"
                          accept=".csv,text/csv"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                      </Button>
                    </Paper>
                  );
                })}
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
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

                {liveUploadStatus && (
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
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
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
                      </Stack>

                      {uploadRole && (
                        <Typography variant="caption" color="text.secondary">
                          Role: {uploadRole}
                        </Typography>
                      )}

                      {updatedAt && !isUploadActive && (
                        <Typography variant="caption" color="text.secondary">
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
                )}

                <Button
                  variant="text"
                  startIcon={<LinkIcon />}
                  onClick={goToLink}
                >
                  Continue to Link
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
