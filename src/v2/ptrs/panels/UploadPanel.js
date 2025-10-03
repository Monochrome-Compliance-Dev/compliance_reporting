import { useState } from "react";
import { Box, Stack, Typography, Button } from "@mui/material";
import { useSearchParams } from "react-router";
import { useAlert } from "context";
import {
  useUploadStatus,
  useUploadCsvMutation,
  useColumnMapStatus,
  useSelectMapMutation,
} from "../hooks/usePtrsQueries";

export default function UploadPanel() {
  const [params] = useSearchParams();
  const runId = params.get("runId");
  const { showAlert } = useAlert();

  const status = useUploadStatus(runId);
  const mapStatus = useColumnMapStatus(runId);

  const uploadCsv = useUploadCsvMutation(runId);
  const selectMap = useSelectMapMutation(runId);

  const [file, setFile] = useState(null);

  const onFileChange = (e) => setFile(e.target.files?.[0] || null);

  const onUpload = async () => {
    if (!file) return showAlert("Choose a CSV first", "info");
    try {
      await uploadCsv.mutateAsync({ file, columnMapId: mapStatus?.mapId });
      showAlert("Upload started", "info");
    } catch (e) {
      showAlert(e?.message || "Upload failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Upload CSV
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: 720 }}>
        {/* Map selector placeholder */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2">
            Column map:{" "}
            {mapStatus?.selected
              ? `#${mapStatus?.mapId} (v${mapStatus?.version})`
              : "None selected"}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => selectMap.mutateAsync("latest")}
          >
            Use latest saved map
          </Button>
        </Stack>

        {/* File picker */}
        <input type="file" accept=".csv,text/csv" onChange={onFileChange} />
        <Button
          variant="contained"
          onClick={onUpload}
          disabled={!runId || uploadCsv.isLoading}
        >
          {uploadCsv.isLoading ? "Uploading…" : "Start ingest"}
        </Button>

        {/* Status */}
        <Typography variant="body2">
          Status: {status?.status} · Rows ingested:{" "}
          {status?.rowCounts?.ingested ?? 0}
        </Typography>
      </Stack>
    </Box>
  );
}
