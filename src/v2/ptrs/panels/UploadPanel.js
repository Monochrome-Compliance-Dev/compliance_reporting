import { useState } from "react";
import { Box, Stack, Typography, Button } from "@mui/material";
import { useSearchParams } from "react-router";
import { useAlert } from "context";
import { useTheme } from "@mui/material/styles";
import { uploadCsv, getRunSample } from "v2/ptrs/services/ptrsApi";

export default function UploadPanel() {
  const theme = useTheme();
  const [params] = useSearchParams();
  const runId = params.get("runId");
  const { showAlert } = useAlert();

  const [file, setFile] = useState(null);
  const [lastSample, setLastSample] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const onFileChange = (e) => setFile(e.target.files?.[0] || null);

  const onUpload = async () => {
    if (!runId) return showAlert("Missing runId in URL", "error");
    if (!file) return showAlert("Choose a CSV first", "info");
    try {
      setIsUploading(true);
      const res = await uploadCsv(runId, file);
      const inserted = res?.data?.rowsInserted ?? 0;
      showAlert(`Ingested ${inserted} rows`, "success");
      // Fetch a small sample to confirm rows landed
      const sampleRes = await getRunSample(runId, { limit: 10, offset: 0 });
      setLastSample(sampleRes?.data || null);
    } catch (e) {
      showAlert(e?.message || "Upload failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Upload CSV
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: 720 }}>
        <Typography variant="body2" color="text.secondary">
          Run ID: {runId || <em>none</em>}
        </Typography>

        <input type="file" accept=".csv,text/csv" onChange={onFileChange} />
        <Button
          variant="contained"
          onClick={onUpload}
          disabled={!runId || isUploading}
        >
          {isUploading ? "Uploading…" : "Start ingest"}
        </Button>

        {lastSample && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Sample rows received: {lastSample?.rows?.length || 0} • total
              staged ~ {lastSample?.total ?? 0}
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 1,
                bgcolor: theme.palette.action.hover,
                overflowX: "auto",
              }}
            >
              {JSON.stringify(lastSample, null, 2)}
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
