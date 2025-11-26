import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useAlert } from "context";
import {
  addDataset,
  listDatasets,
  removeDataset,
} from "v2/ptrs/services/ptrsApi";

const ROLES = [
  { value: "vendorMaster", label: "Vendor Master", required: false },
  { value: "termsChanges", label: "Payment Terms Changes", required: false },
  {
    value: "entityStructure",
    label: "Entity Structure / Holdings",
    required: false,
  },
  { value: "other", label: "Other", required: false },
];

export default function SupportingDatasetsSection({ runId, onChanged }) {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const [items, setItems] = useState([]);
  const [busyRole, setBusyRole] = useState(null);
  const fileInputs = useRef({});

  const refresh = async () => {
    if (!runId) return;
    try {
      const { items } = await listDatasets(runId);
      setItems(items || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      showAlert("Failed to load datasets", "error");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const byRole = useMemo(() => {
    const map = new Map();
    for (const r of ROLES) map.set(r.value, []);
    for (const it of items) {
      const arr = map.get(it.role) || [];
      arr.push(it);
      map.set(it.role, arr);
    }
    return map;
  }, [items]);

  const statusChips = (
    <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
      {ROLES.map((r) => {
        const hasAny = (byRole.get(r.value) || []).length > 0;
        return (
          <Chip
            key={r.value}
            size="small"
            color={hasAny ? "success" : "default"}
            variant={hasAny ? "filled" : "outlined"}
            label={`${r.label}: ${hasAny ? "✓" : "—"}`}
          />
        );
      })}
    </Stack>
  );

  const chooseFile = (role) => {
    if (!fileInputs.current[role]) return;
    fileInputs.current[role].click();
  };

  const handlePick = (role, e) => {
    const file = e.target.files?.[0] || null;
    e.target.value = ""; // reset input
    if (!file) return;

    const isCsv =
      (file.type && file.type.toLowerCase().includes("csv")) ||
      /\.csv$/i.test(file.name);
    const isXlsx =
      (file.type && file.type.includes("spreadsheetml")) ||
      /\.xlsx?$/i.test(file.name);

    if (!isCsv && !isXlsx) {
      showAlert(
        "Unsupported file type. Please upload a CSV or Excel (.xlsx) file.",
        "error"
      );
      return;
    }

    if (isCsv) {
      upload(role, file);
      return;
    }

    // Convert XLSX to CSV using SheetJS
    try {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: "," });

        // Convert the CSV string to a Blob so we can upload it the same way as CSV
        const csvBlob = new Blob([csv], { type: "text/csv" });
        const csvFile = new File(
          [csvBlob],
          file.name.replace(/\.xlsx?$/i, ".csv"),
          {
            type: "text/csv",
          }
        );
        upload(role, csvFile);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      showAlert("Failed to read Excel file", "error");
    }
  };

  const upload = async (role, file) => {
    if (!runId) return showAlert("Missing runId", "error");
    setBusyRole(role);
    try {
      await addDataset(runId, file, { role, sourceName: file.name });
      await refresh();
      showAlert(`${rLabel(role)} uploaded`, "success");
      if (onChanged) onChanged();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      showAlert("Upload failed", "error");
    } finally {
      setBusyRole(null);
    }
  };

  const rLabel = (val) => ROLES.find((r) => r.value === val)?.label || val;

  const onDelete = async (id) => {
    try {
      await removeDataset(runId, id);
      await refresh();
      showAlert("Dataset removed", "success");
      if (onChanged) onChanged();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      showAlert("Failed to remove dataset", "error");
    }
  };

  return (
    <Box>
      {statusChips}
      <Divider sx={{ mb: 1 }} />
      <Stack spacing={1}>
        {ROLES.map((r) => {
          const list = byRole.get(r.value) || [];
          const hasAny = list.length > 0;
          return (
            <Paper key={r.value} variant="outlined" sx={{ p: 1.5 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
              >
                <Stack spacing={0.25}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {r.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.required ? "Required" : "Optional"} •{" "}
                    {hasAny ? "Uploaded" : "Not uploaded"}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title="Refresh">
                    <IconButton size="small" onClick={refresh}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<UploadFileIcon />}
                    onClick={() => chooseFile(r.value)}
                    disabled={busyRole === r.value}
                  >
                    {busyRole === r.value ? "Uploading…" : "Upload file"}
                  </Button>
                  <input
                    type="file"
                    hidden
                    accept=".csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    ref={(el) => (fileInputs.current[r.value] = el)}
                    onChange={(e) => handlePick(r.value, e)}
                  />
                </Stack>
              </Stack>

              <Typography variant="caption" color="text.secondary">
                CSV or Excel (.xlsx) supported.
              </Typography>

              {hasAny && (
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {list.map((d) => (
                    <Stack
                      key={d.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        p: 1,
                        border: (t) => `1px dashed ${t.palette.divider}`,
                        borderRadius: 1,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" label={d.sourceName || d.fileName} />
                        <Typography variant="caption" color="text.secondary">
                          Rows: {d.meta?.rowsCount ?? "?"} • Headers:{" "}
                          {d.meta?.headers?.length ?? 0}
                        </Typography>
                      </Stack>
                      <Tooltip title="Remove">
                        <IconButton
                          color="error"
                          onClick={() => onDelete(d.id)}
                          size="small"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
