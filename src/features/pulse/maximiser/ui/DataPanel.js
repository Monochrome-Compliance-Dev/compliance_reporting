// src/features/pulse/maximiser/ui/DataPanel.jsx
import { Box, Stack, Typography, Divider, Button } from "@mui/material";
import { useRef } from "react";
import { useAlert } from "../../../../context/";

export default function DataPanel({ onUpload }) {
  const { showAlert } = useAlert();
  const inputRef = useRef(null);

  const pick = () => inputRef.current?.click();
  const handle = async (file) => {
    if (!file) return;
    if (!/(\.csv|\.CSV|\.txt|\.TXT)$/.test(file.name)) {
      showAlert("Please provide a CSV export for now.", "warning");
    }
    await onUpload?.(file);
  };

  return (
    <Box>
      <Typography variant="h6">Data (Local Ingest)</Typography>
      <Divider sx={{ my: 1 }} />
      <Stack spacing={1} direction="row" alignItems="center">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt"
          style={{ display: "none" }}
          onChange={(e) => handle(e.target.files?.[0])}
        />
        <Button variant="contained" onClick={pick}>
          Upload Timesheets (CSV)
        </Button>
        <Typography variant="body2" color="text.secondary">
          Files stay on your device (processed in-browser).
        </Typography>
      </Stack>
    </Box>
  );
}
