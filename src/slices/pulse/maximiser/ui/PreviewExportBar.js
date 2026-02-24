// src/features/pulse/maximiser/ui/PreviewExportBar.jsx
import { Box, Stack, Button } from "@mui/material";

export default function PreviewExportBar({ onExport, disabled }) {
  return (
    <Box sx={{ position: "sticky", bottom: 0, py: 1 }}>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="flex-end"
      >
        <Button variant="contained" onClick={onExport} disabled={disabled}>
          Export PDF
        </Button>
      </Stack>
    </Box>
  );
}
