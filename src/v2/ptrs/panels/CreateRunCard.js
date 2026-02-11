import { useMemo, useState } from "react";
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
import { createPtrs, uploadCsv } from "v2/ptrs/services/ptrsApi";
import { usePtrsV2Context } from "../context/PtrsV2Context";
import { useNavigate } from "react-router";

// Fixed five reporting periods starting 2025, half-yearly
const PERIODS = [
  {
    label: "1 January 2024 - 30 June 2024",
    start: "2024-01-01",
    end: "2024-06-30",
  },
  {
    label: "1 July 2024 - 31 December 2024",
    start: "2024-07-01",
    end: "2024-12-31",
  },
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

export default function CreatePtrsCard({ onSuccess }) {
  const theme = useTheme();
  const { showAlert } = useAlert();

  const { profiles, profileId, setProfileId } = usePtrsV2Context();

  const safeProfileId = profiles.some((p) => p.id === profileId)
    ? profileId
    : "";

  const [label, setLabel] = useState("");
  const [periodIdx, setPeriodIdx] = useState(0);
  const [dataSource, setDataSource] = useState("csv");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const requiresFile = useMemo(
    () => dataSource === "csv" || dataSource === "both",
    [dataSource],
  );

  const isBoth = useMemo(() => dataSource === "both", [dataSource]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const p = PERIODS[periodIdx];

    if (requiresFile && !file) {
      showAlert("Choose a file to upload, or switch to Xero import.", "info");
      return;
    }

    if (!profileId) {
      showAlert("Choose a PTRS profile before creating a PTRS report.", "info");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        label: label || null,
        reportingPeriodStartDate: p.start,
        reportingPeriodEndDate: p.end,
        periodStart: p.start,
        periodEnd: p.end,
        profileId, // <- required for BE to link to the right profile
      };

      // Include optional metadata about the initial upload (file-based sources)
      if (requiresFile && file) {
        payload.originalName =
          file.name || (label ? `${label}.csv` : "upload.csv");
        payload.sizeBytes = file.size ?? null;
        payload.mimeType = file.type || "text/csv";
      }

      const res = await createPtrs(payload);

      // Prefer an id from common shapes
      const ptrsId = res?.data?.id || res?.id || res?.ptrsId;
      if (!ptrsId) {
        showAlert(
          "PTRS created but no id returned — refresh the list.",
          "info",
        );
        if (onSuccess) onSuccess(res);
        return;
      }

      // Seed the main dataset
      // - csv: uses existing CSV ingest endpoint
      // - both: upload csv first, then send user to Xero import to add main_xero
      if ((dataSource === "csv" || isBoth) && file) {
        try {
          const ingest = await uploadCsv(ptrsId, file);
          const inserted = ingest.rowsInserted;
          showAlert(
            `PTRS created for profile and ${inserted} rows ingested`,
            "success",
          );
        } catch (e2) {
          console.error(e2);
          showAlert("PTRS created but file upload failed", "error");
          if (onSuccess) onSuccess(ptrsId);
          return;
        }

        if (isBoth) {
          showAlert("CSV uploaded. Continue to import from Xero.", "success");
          if (onSuccess) onSuccess(ptrsId);
          navigate(`/v2/ptrs/xero?ptrsId=${encodeURIComponent(ptrsId)}`);
          return;
        }

        if (onSuccess) onSuccess(ptrsId);
        return;
      }

      // Xero-only
      showAlert("PTRS created. Continue to import from Xero.", "success");
      if (onSuccess) onSuccess(ptrsId);
      navigate(`/v2/ptrs/xero?ptrsId=${encodeURIComponent(ptrsId)}`);
      return;

      if (onSuccess) onSuccess(res);
    } catch (err) {
      console.error(err);
      const msg =
        (err && (err.message || err.error || err.statusText)) ||
        "Failed to create PTRS report";
      showAlert(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(
    profileId && !submitting && (requiresFile ? Boolean(file) : true),
  );

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: "100%", maxWidth: 560, mt: theme.spacing(2) }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Create a new PTRS report
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
            sx={{ mb: 2 }}
          >
            {PERIODS.map((p, idx) => (
              <MenuItem key={p.start} value={idx}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="PTRS profile"
            fullWidth
            size="small"
            value={safeProfileId}
            onChange={(e) => setProfileId(e.target.value)}
            disabled={!profiles.length}
            helperText={
              profiles.length
                ? "Choose which profile this PTRS report belongs to."
                : "No profiles found for this customer."
            }
          >
            {profiles.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name || p.code || p.id}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Main dataset source"
            fullWidth
            size="small"
            value={dataSource}
            onChange={(e) => setDataSource(e.target.value)}
            sx={{ mt: 2 }}
            helperText="Choose how to seed the main Transactions dataset for Step 1."
          >
            <MenuItem value="csv">Upload CSV</MenuItem>
            <MenuItem value="both">CSV + Xero (roll-up)</MenuItem>
            <MenuItem value="xero">Import from Xero</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <Stack spacing={1}>
            {requiresFile ? (
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                You’ll import Transactions from Xero after creating the PTRS
                report.
              </Typography>
            )}
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={!canSubmit}
          >
            {submitting
              ? "Creating..."
              : requiresFile
                ? "Create PTRS report & upload"
                : "Create PTRS report & continue"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
