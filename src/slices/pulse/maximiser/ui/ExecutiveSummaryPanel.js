import {
  Box,
  Stack,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Divider,
} from "@mui/material";

/**
 * ExecutiveSummaryPanel
 * Props:
 *  - value: { auto?: boolean, bulletsByGroup?: { positive?: string[], risks?: string[], critical?: string[] } }
 *  - onChange: (val) => void
 */
export default function ExecutiveSummaryPanel({ value, onChange }) {
  const v = value || {};
  const bullets = v.bulletsByGroup || {};
  const set = (patch) => onChange?.({ ...v, ...patch });

  const toText = (arr) => (Array.isArray(arr) ? arr.join("\n") : "");
  const fromText = (txt) =>
    (txt || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  return (
    <Box>
      <Stack spacing={2}>
        <Typography variant="h6">Executive Summary</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(v.auto)}
              onChange={(e) => set({ auto: e.target.checked })}
            />
          }
          label="Auto-generate from analysis"
        />
        <Typography variant="body2" color="text.secondary">
          When auto is on, the PDF builder will derive three groups — Positive
          momentum, Emerging risks, Critical concerns — from the uploaded file’s
          metrics. You can still override below.
        </Typography>

        <Divider />

        <Typography variant="subtitle2">Positive momentum</Typography>
        <TextField
          placeholder="One insight per line"
          value={toText(bullets.positive)}
          onChange={(e) =>
            set({
              bulletsByGroup: {
                ...bullets,
                positive: fromText(e.target.value),
              },
            })
          }
          fullWidth
          multiline
          minRows={3}
        />

        <Typography variant="subtitle2" sx={{ mt: 2 }}>
          Emerging risks
        </Typography>
        <TextField
          placeholder="One risk per line"
          value={toText(bullets.risks)}
          onChange={(e) =>
            set({
              bulletsByGroup: { ...bullets, risks: fromText(e.target.value) },
            })
          }
          fullWidth
          multiline
          minRows={3}
        />

        <Typography variant="subtitle2" sx={{ mt: 2 }}>
          Critical concerns
        </Typography>
        <TextField
          placeholder="One concern per line"
          value={toText(bullets.critical)}
          onChange={(e) =>
            set({
              bulletsByGroup: {
                ...bullets,
                critical: fromText(e.target.value),
              },
            })
          }
          fullWidth
          multiline
          minRows={3}
        />
      </Stack>
    </Box>
  );
}
