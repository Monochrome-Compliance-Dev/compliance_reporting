import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useAlert } from "context";
import {
  addDataset,
  listDatasets,
  removeDataset,
} from "../services/data.ptrsApi";

const REFERENCE_KINDS = [
  { value: "vendormaster", label: "Vendor Master", required: false },
  { value: "termschanges", label: "Payment Terms Changes", required: false },
  {
    value: "entitystructure",
    label: "Entity Structure / Holdings",
    required: false,
  },
  { value: "invoices", label: "Invoice Context", required: false },
  { value: "other", label: "Other", required: false },
];

export default function SupportingDatasetsSection({
  ptrsId,
  onChanged,
  onTotalChange,
}) {
  const { showAlert } = useAlert();
  const [items, setItems] = useState([]);
  const [busyRole, setBusyRole] = useState(null);
  const fileInputs = useRef({});

  const refresh = useCallback(async () => {
    if (!ptrsId) return;
    try {
      const { items } = await listDatasets(ptrsId);
      setItems(items || []);
    } catch (e) {
      console.error(e);
      showAlert("Failed to load datasets", "error");
    }
  }, [ptrsId, showAlert]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const byReferenceKind = useMemo(() => {
    const map = new Map();
    for (const kind of REFERENCE_KINDS) map.set(kind.value, []);
    for (const it of items.filter((item) => item.purpose === "reference")) {
      const arr = map.get(it.referenceKind) || [];
      arr.push(it);
      map.set(it.referenceKind, arr);
    }
    return map;
  }, [items]);

  const totalDatasets = items.filter(
    (item) => item.purpose === "reference",
  ).length;

  useEffect(() => {
    if (typeof onTotalChange === "function") {
      onTotalChange(totalDatasets);
    }
  }, [onTotalChange, totalDatasets]);

  const statusChips = (
    <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
      {REFERENCE_KINDS.map((r) => {
        const hasAny = (byReferenceKind.get(r.value) || []).length > 0;
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

    if (!isCsv) {
      showAlert("Unsupported file type. Please upload a CSV file.", "error");
      return;
    }

    upload(role, file);
  };

  const upload = async (role, file) => {
    if (!ptrsId) return showAlert("Missing ptrsId", "error");
    setBusyRole(role);
    try {
      await addDataset(ptrsId, file, {
        purpose: "reference",
        referenceKind: role,
        sourceFormat: "csv",
        sourceName: file.name,
      });
      await refresh();
      showAlert(`${rLabel(role)} uploaded`, "success");
      if (onChanged) onChanged();
    } catch (e) {
      console.error(e);
      showAlert("Upload failed", "error");
    } finally {
      setBusyRole(null);
    }
  };

  const rLabel = (val) =>
    REFERENCE_KINDS.find((kind) => kind.value === val)?.label || val;

  const onDelete = async (id) => {
    try {
      await removeDataset(ptrsId, id);
      await refresh();
      showAlert("Dataset removed", "success");
      if (onChanged) onChanged();
    } catch (e) {
      console.error(e);
      showAlert("Failed to remove dataset", "error");
    }
  };

  return (
    <Box>
      {statusChips}
      <Divider sx={{ mb: 1 }} />
      <Stack spacing={1}>
        {REFERENCE_KINDS.map((r) => {
          const list = byReferenceKind.get(r.value) || [];
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
                    accept=".csv,text/csv"
                    ref={(el) => (fileInputs.current[r.value] = el)}
                    onChange={(e) => handlePick(r.value, e)}
                  />
                </Stack>
              </Stack>

              <Typography variant="caption" color="text.secondary">
                CSV only.
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
