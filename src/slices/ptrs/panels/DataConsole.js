import { useAlert } from "context";
import { useState, useEffect, useCallback } from "react";
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
  Tooltip,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import TableChartIcon from "@mui/icons-material/TableChart";
import LinkIcon from "@mui/icons-material/Link";
import { usePtrsContext } from "../context/PtrsContext";
import { useUpdatePtrsMutation } from "../hooks/usePtrsQueries";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";
import {
  addDataset,
  listDatasets,
  removeDataset,
} from "../services/data.ptrsApi";
import CreateRunCard from "./CreateRunCard";

const ROLE_OPTIONS = [
  { value: "main_xero", label: "Transactions — Xero" },
  { value: "main_csv", label: "Transactions — Excel (MYOB export)" },
  // Legacy single-main role (keep for now)
  { value: "transactions", label: "Transactions (legacy)" },
  { value: "vendormaster", label: "Vendor Master" },
  { value: "termschanges", label: "Payment Terms Changes" },
  { value: "entitystructure", label: "Entity Structure" },
  { value: "other", label: "Other" },
];

const isMainRole = (r) => {
  const v = String(r || "").toLowerCase();
  return v === "main" || v === "transactions" || v.startsWith("main_");
};

const isXeroMainRole = (r) => {
  const v = String(r || "").toLowerCase();
  return v === "main_xero" || v === "transactions";
};

export default function DataConsole() {
  const theme = useTheme();
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
  const [role, setRole] = useState("main_xero");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const refreshDatasets = useCallback(async () => {
    if (!ptrsId) return;
    try {
      const { items } = await listDatasets(ptrsId);
      setDatasets(items || []);
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

  const doUpload = async () => {
    if (!ptrsId) {
      showAlert("Create a PTRS first", "info");
      return;
    }
    if (!file) {
      showAlert("Choose a file to upload", "info");
      return;
    }
    if (!role) {
      showAlert("Select a role for the file", "info");
      return;
    }
    setIsUploading(true);
    try {
      await addDataset(ptrsId, file, {
        role: String(role || "").toLowerCase(),
        sourceName: file.name,
      });
      setFile(null);
      await refreshDatasets();
      await refreshCtxDatasets?.();
      showAlert("Dataset uploaded", "success");
      if (isMainRole(role)) {
        goToTables();
        return;
      }
    } catch (err) {
      console.error(err);
      showAlert(err?.message || "Upload failed", "error");
    } finally {
      setIsUploading(false);
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

  const goToXero = async () => {
    if (!ptrsId) {
      showAlert("Create a PTRS first", "info");
      return;
    }

    try {
      // Treat Xero import as part of the data step (Step 1)
      await updatePtrsStep.mutateAsync({ currentStep: "data" });
    } catch (err) {
      console.error(err);
      // Don't block navigation if the step update fails
      showAlert(
        "Failed to update PTRS step. Continuing to Xero import.",
        "warning",
      );
    }

    goTo("xero");
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
                  Upload additional files (e.g., Vendor Master, Payment Terms).
                  Map core roles on the Transactions dataset.
                </Typography>

                {/* Uploader */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems="center"
                  sx={{ mb: 3 }}
                >
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel id="role-select">Role</InputLabel>
                    <Select
                      labelId="role-select"
                      label="Role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<UploadFileIcon />}
                  >
                    Choose file
                    <input
                      hidden
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LinkIcon />}
                    onClick={goToXero}
                    disabled={isUploading || !isXeroMainRole(role)}
                  >
                    Import from Xero
                  </Button>
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
                  <Button
                    variant="text"
                    startIcon={<TableChartIcon />}
                    onClick={goToTables}
                  >
                    Go to Tables & Joins
                  </Button>
                </Stack>

                {/* List */}
                <Box>
                  {datasets.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No datasets uploaded yet.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {datasets.map((d) => (
                        <Paper
                          key={d.id}
                          variant="outlined"
                          sx={{
                            p: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box>
                            <Typography variant="subtitle2">
                              {d.sourceName || d.fileName || "Dataset"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Role: <b>{d.role}</b> • Rows: {d.rowsCount ?? "?"}{" "}
                              • Headers: {d.headersCount ?? 0}
                            </Typography>
                          </Box>
                          <IconButton
                            color="error"
                            onClick={() => onDelete(d.id)}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
