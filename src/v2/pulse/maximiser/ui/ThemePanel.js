// src/features/pulse/maximiser/ui/ThemePanel.js
import {
  Box,
  Stack,
  TextField,
  Typography,
  Divider,
  Chip,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

const isHex = (s) => /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(s || "");

function Swatch({ label, color }) {
  return (
    <Chip
      label={`${label}: ${color}`}
      sx={{
        bgcolor: color,
        color: "#000",
        border: "1px solid rgba(0,0,0,0.1)",
        "& .MuiChip-label": { fontFamily: "monospace" },
      }}
    />
  );
}

/**
 * value: optional overrides { brandBand?, legendGrey?, grid? }
 * onChange: (overrides) => void
 */
export default function ThemePanel({ value, onChange }) {
  const t = useTheme();
  const v = value || {};

  // Derived tokens from MUI theme (read-only)
  const derived = {
    mode: t.palette.mode,
    primary: t.palette.primary.main,
    secondary: t.palette.secondary.main,
    textPrimary: t.palette.text.primary,
    textSecondary: t.palette.text.secondary,
    bgPaper: t.palette.background.paper,
  };

  // PDF tokens (overridable in this panel)
  const defaults = {
    brandBand: t.palette.primary.main,
    legendGrey: t.palette.mode === "light" ? "#666666" : "#bbbbbb",
    grid: t.palette.mode === "light" ? "#e6e8eb" : "#3a3a4d",
  };

  const current = {
    brandBand: v.brandBand ?? defaults.brandBand,
    legendGrey: v.legendGrey ?? defaults.legendGrey,
    grid: v.grid ?? defaults.grid,
  };

  const set = (patch) => onChange?.({ ...v, ...patch });
  const reset = () => onChange?.({});

  return (
    <Box>
      <Typography variant="h6">Theme</Typography>
      <Divider sx={{ my: 1 }} />

      {/* Read-only snapshot from MUI */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Using MUI theme
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
        <Swatch label="primary" color={derived.primary} />
        <Swatch label="secondary" color={derived.secondary} />
        <Swatch label="textPrimary" color={derived.textPrimary} />
        <Swatch label="textSecondary" color={derived.textSecondary} />
        <Swatch label="bgPaper" color={derived.bgPaper} />
        <Chip label={`mode: ${derived.mode}`} />
      </Stack>

      {/* PDF-specific overrides */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        PDF overrides (optional)
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="Brand band (#hex)"
          value={current.brandBand}
          onChange={(e) => set({ brandBand: e.target.value })}
          error={!isHex(current.brandBand)}
          helperText={
            !isHex(current.brandBand)
              ? "Use #RRGGBB or #RGB"
              : "Top banner + accents"
          }
          fullWidth
        />
        <TextField
          label="Legend grey (#hex)"
          value={current.legendGrey}
          onChange={(e) => set({ legendGrey: e.target.value })}
          error={!isHex(current.legendGrey)}
          helperText={
            !isHex(current.legendGrey)
              ? "Use #RRGGBB or #RGB"
              : "Axis/legend labels"
          }
          fullWidth
        />
        <TextField
          label="Grid lines (#hex)"
          value={current.grid}
          onChange={(e) => set({ grid: e.target.value })}
          error={!isHex(current.grid)}
          helperText={
            !isHex(current.grid) ? "Use #RRGGBB or #RGB" : "Chart grid strokes"
          }
          fullWidth
        />
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
          <Button onClick={reset}>Reset to defaults</Button>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Swatch label="brandBand" color={current.brandBand} />
            <Swatch label="legendGrey" color={current.legendGrey} />
            <Swatch label="grid" color={current.grid} />
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
