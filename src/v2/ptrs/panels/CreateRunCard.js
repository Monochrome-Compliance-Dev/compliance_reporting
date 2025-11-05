import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  MenuItem,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { createRun, uploadCsv } from "v2/ptrs/services/ptrsApi";

// Fixed five reporting periods starting 2025, half-yearly
const PERIODS = [
  {
    label: "1 January 2025 - 30 June 2025",
    start: "2025-01-01",
    end: "2025-06-30",
  },
  {
    label: "1 July 2025 - 31 December 2025",
    start: "2025-07-01",
    end: "2025-12-31",
  },
  {
    label: "1 January 2026 - 30 June 2026",
    start: "2026-01-01",
    end: "2026-06-30",
  },
  {
    label: "1 July 2026 - 31 December 2026",
    start: "2026-07-01",
    end: "2026-12-31",
  },
  {
    label: "1 January 2027 - 30 June 2027",
    start: "2027-01-01",
    end: "2027-06-30",
  },
];

export default function CreateRunCard({ onSuccess }) {
  const { showAlert } = useAlert();
  const [label, setLabel] = useState("");
  const [periodIdx, setPeriodIdx] = useState(0);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const p = PERIODS[periodIdx];
    setSubmitting(true);
    if (!file) {
      showAlert("Choose a CSV file to create a run.", "info");
      setSubmitting(false);
      return;
    }
    try {
      // Send both field aliases for maximum BE compatibility
      const payload = {
        label: label || null,
        reportingPeriodStartDate: p.start,
        reportingPeriodEndDate: p.end,
        periodStart: p.start,
        periodEnd: p.end,
      };
      // If a file is provided, include optional metadata (some BEs require fileName)
      if (file) {
        payload.fileName = file.name || (label ? `${label}.csv` : "upload.csv");
        payload.fileSize = file.size ?? null;
        payload.mimeType = file.type || "text/csv";
      }

      const res = await createRun(payload);
      // Prefer an id from common shapes
      const runId = res?.data?.id || res?.id || res?.runId;
      if (!runId) {
        showAlert("Run created but no id returned — refresh the list.", "info");
        if (onSuccess) onSuccess(res);
        return;
      }

      // If a file was provided, immediately upload it as the primary transactions CSV
      if (file) {
        try {
          const ingest = await uploadCsv(runId, file);
          const inserted = ingest.rowsInserted;
          showAlert(`Run created and ${inserted} rows ingested`, "success");
        } catch (e2) {
          // eslint-disable-next-line no-console
          console.error(e2);
          showAlert("Run created but file upload failed", "error");
        }

        if (onSuccess) onSuccess(runId);
      }

      if (onSuccess) onSuccess(res);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      // If the BE still requires a filename, guide the user without blocking the flow
      const msg =
        (err && (err.message || err.error || err.statusText)) ||
        "Failed to create run";
      if (String(msg).toLowerCase().includes("filename")) {
        showAlert(
          "This environment requires a CSV when creating a run. Please choose a file and try again.",
          "info"
        );
      } else {
        showAlert(msg, "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: "100%", maxWidth: 560 }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Create a new PTRS run
          </Typography>
          <TextField
            label="Optional label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />
          <TextField
            select
            label="Reporting period"
            fullWidth
            size="small"
            value={periodIdx}
            onChange={(e) => setPeriodIdx(Number(e.target.value))}
          >
            {PERIODS.map((p, idx) => (
              <MenuItem key={p.start} value={idx}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <Stack spacing={1}>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={submitting || !file}
          >
            {submitting ? "Creating..." : "Create run & upload"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
