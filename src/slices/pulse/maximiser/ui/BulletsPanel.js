// src/features/pulse/maximiser/ui/BulletsPanel.jsx
import {
  Box,
  Stack,
  TextField,
  Typography,
  Divider,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function BulletsPanel({ title, value, onChange, colorHint }) {
  const v = value || { enabled: true, bullets: [] };
  const bullets = Array.isArray(v.bullets) ? v.bullets : [];
  const set = (patch) => onChange?.({ ...v, ...patch });

  const add = () => set({ bullets: [...bullets, ""] });
  const update = (i, text) =>
    set({ bullets: bullets.map((b, idx) => (idx === i ? text : b)) });
  const remove = (i) => set({ bullets: bullets.filter((_, idx) => idx !== i) });

  return (
    <Box>
      <Typography
        variant="h6"
        sx={colorHint ? { color: colorHint } : undefined}
      >
        {title}
      </Typography>
      <Divider sx={{ my: 1 }} />
      <Stack spacing={1}>
        {bullets.map((b, i) => (
          <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
            <TextField
              label={`Bullet ${i + 1}`}
              value={b}
              onChange={(e) => update(i, e.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
            <IconButton aria-label="delete" onClick={() => remove(i)}>
              <DeleteOutlineIcon />
            </IconButton>
          </Stack>
        ))}
        <IconButton aria-label="add" onClick={add}>
          <AddIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
