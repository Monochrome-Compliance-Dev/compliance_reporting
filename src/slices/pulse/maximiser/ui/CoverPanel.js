// src/features/pulse/maximiser/ui/CoverPanel.jsx
import {
  Box,
  Stack,
  Switch,
  FormControlLabel,
  Typography,
  Divider,
} from "@mui/material";

export default function CoverPanel({ value, onChange }) {
  const v = value || {};
  const set = (patch) => onChange?.({ ...v, ...patch });

  return (
    <Box>
      <Typography variant="h6">Cover</Typography>
      <Divider sx={{ my: 1 }} />
      <Stack spacing={2}>
        {/* <TextField
          label="Title"
          value={v.title || ""}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Pulse Team Performance Insights"
          fullWidth
        />
        <TextField
          label="Subtitle / Tagline"
          value={v.subtitle || ""}
          onChange={(e) => set({ subtitle: e.target.value })}
          placeholder="From spreadsheets to clarity. AI-driven analysis of team timesheets for executive insight. (Sample)"
          fullWidth
        /> */}
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(v.watermarkSample)}
              onChange={(e) => set({ watermarkSample: e.target.checked })}
            />
          }
          label="Show SAMPLE watermark"
        />
      </Stack>
    </Box>
  );
}
