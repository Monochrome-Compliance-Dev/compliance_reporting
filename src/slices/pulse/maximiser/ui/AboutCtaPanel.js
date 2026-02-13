// src/features/pulse/maximiser/ui/AboutCtaPanel.jsx
import { Box, Stack, TextField, Typography, Divider } from "@mui/material";
import { useAlert } from "../../../../context/AlertContext";

export default function AboutCtaPanel({ value, onChange }) {
  const { showAlert } = useAlert();
  const v = value || { paragraphs: [], cta: "", registrationUrl: "" };
  const set = (patch) => onChange?.({ ...v, ...patch });

  const setPara = (i, text) => {
    const next = [...(v.paragraphs || [])];
    next[i] = text;
    set({ paragraphs: next });
  };

  return (
    <Box>
      <Typography variant="h6">About & Call-to-Action</Typography>
      <Divider sx={{ my: 1 }} />
      <Stack spacing={2}>
        <TextField
          label="About paragraph 1"
          value={v.paragraphs?.[0] || ""}
          onChange={(e) => setPara(0, e.target.value)}
          multiline
          minRows={3}
          fullWidth
        />
        <TextField
          label="About paragraph 2"
          value={v.paragraphs?.[1] || ""}
          onChange={(e) => setPara(1, e.target.value)}
          multiline
          minRows={3}
          fullWidth
        />
        <TextField
          label="CTA"
          value={v.cta || ""}
          onChange={(e) => set({ cta: e.target.value })}
          multiline
          minRows={2}
          fullWidth
        />
        <TextField
          label="Registration URL"
          value={v.registrationUrl || ""}
          onChange={(e) => set({ registrationUrl: e.target.value })}
          onBlur={(e) => {
            const val = e.target.value || "";
            if (!/^https?:\/\//i.test(val))
              showAlert("Tip: include http(s):// in the URL", "info");
          }}
          fullWidth
        />
      </Stack>
    </Box>
  );
}
