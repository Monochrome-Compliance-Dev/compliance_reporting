// CreateRunPanel.js
import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { usePtrsV2Context } from "v2/ptrs/hooks/usePtrsQueries";
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
import { createRun, uploadCsv } from "v2/ptrs/services/ptrsApi";
import { useStepStatuses } from "v2/ptrs/hooks/useStepStatuses";

export default function CreateRunPanel() {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [period, setPeriod] = useState("");
  const [dataSource, setDataSource] = useState("csv");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { profileId } = usePtrsV2Context();
  const [searchParams] = useSearchParams();

  // read runId from URL; after we create a run we’ll write it here too
  const runId = searchParams.get("runId") || "";

  // wire the status hook (only cares once we have a runId)
  const { runUpload, gates } = useStepStatuses(runId || undefined, "upload");

  const ingested = useMemo(
    () => runUpload?.rowCounts?.ingested ?? 0,
    [runUpload]
  );

  const periods = [
    {
      label: "1 Jan 2024 to 30 June 2024",
      start: "2024-01-01",
      end: "2024-06-30",
    },
    {
      label: "1 July 2024 to 31 Dec 2024",
      start: "2024-07-01",
      end: "2024-12-31",
    },
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

  const requiresCsv = useMemo(() => dataSource === "csv", [dataSource]);

  const onCreateAndUpload = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!periodStart || !periodEnd) {
        showAlert("Please select a reporting period.", "info");
        return;
      }
      if (requiresCsv && !file) {
        showAlert(
          "Please select a CSV file, or switch to Xero import.",
          "info"
        );
        return;
      }

      const fileName =
        requiresCsv && file
          ? file?.name || (name?.trim() ? `${name.trim()}.csv` : "untitled.csv")
          : "xero_import";
      const fileSize = requiresCsv && file ? (file?.size ?? null) : null;
      const mimeType = requiresCsv && file ? file?.type || "text/csv" : null;

      const res = await createRun({
        fileName,
        fileSize,
        mimeType,
        periodStart,
        periodEnd,
        profileId: profileId || undefined,
      });
      const newRunId = res?.data?.id || res?.id;
      if (!newRunId) {
        showAlert("Failed to create run", "error");
        return;
      }

      if (requiresCsv && file) {
        // Upload now
        const ingest = await uploadCsv(newRunId, file);
        const inserted = ingest.rowsInserted;
        showAlert(`Run created and ${inserted} rows ingested`, "success");
      } else {
        showAlert("Run created. Continue to import from Xero.", "success");
      }

      const qs = new URLSearchParams();
      qs.set("runId", newRunId);
      if (profileId) qs.set("profileId", profileId);
      navigate(`/v2/ptrs/data?${qs.toString()}`, { replace: true });

      if (!requiresCsv) {
        navigate(`/v2/ptrs/xero?ptrsId=${encodeURIComponent(newRunId)}`);
      }
    } catch (e) {
      showAlert(e?.message || "Error creating or uploading run", "error");
    } finally {
      setBusy(false);
    }
  };

  const goNext = () => {
    if (!runId) return;
    const qs = new URLSearchParams();
    qs.set("runId", runId);
    if (profileId) qs.set("profileId", profileId);
    navigate(`/v2/ptrs/tables?${qs.toString()}`);
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

        <FormControl fullWidth>
          <InputLabel id="data-source-label">Main dataset source</InputLabel>
          <Select
            labelId="data-source-label"
            value={dataSource}
            label="Main dataset source"
            onChange={(e) => setDataSource(e.target.value)}
          >
            <MenuItem value="csv">Upload CSV</MenuItem>
            <MenuItem value="xero">Import from Xero</MenuItem>
          </Select>
        </FormControl>

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Select your PTRS CSV file. It will be uploaded immediately after the
            run is created.
          </Typography>
          {requiresCsv ? (
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              You’ll import Transactions from Xero after creating the run.
            </Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={onCreateAndUpload}
            disabled={busy}
          >
            {busy ? "Working…" : runId ? "Re-upload" : "Create and Upload"}
          </Button>

          <Button
            variant="outlined"
            onClick={goNext}
            disabled={!runId || !gates.upload}
          >
            Next: Link Tables
          </Button>
        </Stack>

        {/* Tiny inline status to guide the user */}
        {runId ? (
          <Typography
            variant="caption"
            color={gates.upload ? "success.main" : "text.secondary"}
          >
            {gates.upload
              ? `Upload complete · ${ingested} rows`
              : "Waiting for upload to complete…"}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
