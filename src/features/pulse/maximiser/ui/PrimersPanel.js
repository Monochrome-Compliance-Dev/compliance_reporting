// src/features/pulse/maximiser/ui/PrimersPanel.jsx
import { Box, Stack, TextField, Typography, Divider } from "@mui/material";
import { useEffect, useState } from "react";

const listToStr = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");
const strToList = (s) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export default function PrimersPanel({ value, onChange }) {
  const v = value || {};
  const set = (patch) => onChange?.({ ...v, ...patch });

  // Local text buffers so users can type spaces naturally; commit parsed arrays onBlur
  const [prioritiesText, setPrioritiesText] = useState(listToStr(v.priorities));
  const [successText, setSuccessText] = useState(listToStr(v.successMetrics));
  const [constraintsText, setConstraintsText] = useState(
    listToStr(v.constraints)
  );

  // Keep local buffers in sync when parent value changes externally
  useEffect(() => setPrioritiesText(listToStr(v.priorities)), [v.priorities]);
  useEffect(
    () => setSuccessText(listToStr(v.successMetrics)),
    [v.successMetrics]
  );
  useEffect(
    () => setConstraintsText(listToStr(v.constraints)),
    [v.constraints]
  );

  return (
    <Box>
      <Typography variant="h6">Primers</Typography>
      <Divider sx={{ my: 1 }} />
      <Stack spacing={2}>
        <TextField
          label="Sector"
          value={v.sector || ""}
          onChange={(e) => set({ sector: e.target.value })}
          fullWidth
        />
        <TextField
          label="Audience"
          value={v.audience || ""}
          onChange={(e) => set({ audience: e.target.value })}
          fullWidth
        />
        <TextField
          label="Primers purpose / explanation"
          value={v.purpose || ""}
          onChange={(e) => set({ purpose: e.target.value })}
          placeholder="Explain why these primers exist and how to read the snapshot."
          helperText="Shown under the Primers heading to give readers context."
          multiline
          minRows={3}
          fullWidth
        />
        <TextField
          label="Priorities (comma-separated)"
          value={prioritiesText}
          onChange={(e) => setPrioritiesText(e.target.value)}
          onBlur={() => set({ priorities: strToList(prioritiesText) })}
          placeholder="e.g., Planning accuracy, Reduce rework, Faster QA triage"
          fullWidth
        />
        <TextField
          label="Success Metrics (comma-separated)"
          value={successText}
          onChange={(e) => setSuccessText(e.target.value)}
          onBlur={() => set({ successMetrics: strToList(successText) })}
          placeholder="e.g., On-time delivery %, Estimation variance %, Mean time to unblock (hrs)"
          fullWidth
        />
        <TextField
          label="Constraints (comma-separated)"
          value={constraintsText}
          onChange={(e) => setConstraintsText(e.target.value)}
          onBlur={() => set({ constraints: strToList(constraintsText) })}
          placeholder="e.g., Hiring freeze, Training backlog"
          fullWidth
        />
        <TextField
          label="Time Horizon"
          value={v.timeHorizon || ""}
          onChange={(e) => set({ timeHorizon: e.target.value })}
          fullWidth
        />
        <TextField
          label="Notes"
          value={v.notes || ""}
          onChange={(e) => set({ notes: e.target.value })}
          multiline
          minRows={3}
          fullWidth
        />
      </Stack>
    </Box>
  );
}
