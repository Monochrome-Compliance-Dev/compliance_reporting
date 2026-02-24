import { useState } from "react";
import { Box, Stack, TextField, Button, Typography } from "@mui/material";
import { useAlert } from "context";
import { useTheme } from "@mui/material/styles";
import { usePtrsNavigation } from "../hooks/usePtrsNavigation";
import { createRun } from "../services/ptrsApi";

export default function CreateRunPanel() {
  const theme = useTheme();
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const { goTo } = usePtrsNavigation();
  const { showAlert } = useAlert();

  const onCreate = async () => {
    try {
      // Prefer real file metadata if provided; fall back to a sensible default name.
      const fileName =
        file?.name || (name?.trim() ? `${name.trim()}.csv` : "untitled.csv");
      const fileSize = file?.size ?? null;
      const mimeType = file?.type || "text/csv";

      const res = await createRun({ fileName, fileSize, mimeType });
      const runId = res?.data?.id || res?.id;
      if (!runId) {
        showAlert("Failed to create upload", "error");
        return;
      }
      showAlert("Upload created", "success");
      // Navigate to the upload step using runId
      goTo(`upload?runId=${runId}`, { includeId: false });
    } catch (e) {
      showAlert(e?.message || "Error creating upload", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Start a new PTRS upload
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: 720 }}>
        <TextField
          label="Optional label (used for default file name)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            (Optional) Select the CSV now — you can also pick it on the next
            step.
          </Typography>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </Stack>

        <Button variant="contained" onClick={onCreate}>
          Create upload
        </Button>
      </Stack>
    </Box>
  );
}
