import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useAlert } from "context";
import { useTheme } from "@mui/material/styles";
import { createRun, uploadCsv } from "v2/ptrs/services/ptrsApi";

export default function CreateRunPanel() {
  const theme = useTheme();
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [period, setPeriod] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const periods = [
    {
      label: "1 Jan 2025 to 30 June 2025",
      start: "2025-01-01",
      end: "2025-06-30",
    },
    {
      label: "1 July 2025 to 31 Dec 2025",
      start: "2025-07-01",
      end: "2025-12-31",
    },
    {
      label: "1 Jan 2026 to 30 June 2026",
      start: "2026-01-01",
      end: "2026-06-30",
    },
    {
      label: "1 July 2026 to 31 Dec 2026",
      start: "2026-07-01",
      end: "2026-12-31",
    },
    {
      label: "1 Jan 2027 to 30 June 2027",
      start: "2027-01-01",
      end: "2027-06-30",
    },
  ];

  const selectedPeriod = periods.find((p) => p.label === period);
  const periodStart = selectedPeriod?.start || "";
  const periodEnd = selectedPeriod?.end || "";

  const onCreateAndUpload = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!periodStart || !periodEnd) {
        showAlert("Please select a reporting period.", "info");
        setBusy(false);
        return;
      }
      if (!file) {
        showAlert("Please select a CSV file to upload.", "info");
        setBusy(false);
        return;
      }
      const fileName =
        file?.name || (name?.trim() ? `${name.trim()}.csv` : "untitled.csv");
      const fileSize = file?.size ?? null;
      const mimeType = file?.type || "text/csv";
      const res = await createRun({
        fileName,
        fileSize,
        mimeType,
        periodStart,
        periodEnd,
      });
      const runId = res?.data?.id || res?.id;
      if (!runId) {
        showAlert("Failed to create run", "error");
        return;
      }
      const ingest = await uploadCsv(runId, file);
      const inserted = ingest?.data?.rowsInserted ?? 0;
      showAlert(`Run created and ${inserted} rows ingested`, "success");
      navigate(`/v2/ptrs/map?runId=${runId}`);
    } catch (e) {
      showAlert(e?.message || "Error creating or uploading run", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Create and Upload PTRS Run
      </Typography>
      <Stack spacing={2} sx={{ maxWidth: 720 }}>
        <TextField
          label="Optional label (used for default file name)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
        <FormControl fullWidth>
          <InputLabel id="period-label">Reporting period</InputLabel>
          <Select
            labelId="period-label"
            value={period}
            label="Reporting period"
            onChange={(e) => setPeriod(e.target.value)}
          >
            {periods.map((p) => (
              <MenuItem key={p.label} value={p.label}>
                {p.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Select your PTRS CSV file. It will be uploaded immediately after the
            run is created.
          </Typography>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </Stack>
        <Button variant="contained" onClick={onCreateAndUpload} disabled={busy}>
          {busy ? "Working…" : "Create and Upload"}
        </Button>
      </Stack>
    </Box>
  );
}
