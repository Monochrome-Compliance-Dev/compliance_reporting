import { Stack, TextField, FormControlLabel, Checkbox } from "@mui/material";

export default function RuleMetaSection({ rule, index, onUpdate }) {
  return (
    <Stack spacing={1}>
      <TextField
        label="Label"
        size="small"
        value={rule.label || ""}
        onChange={(e) => onUpdate(index, { label: e.target.value })}
      />
      <TextField
        label="Description"
        size="small"
        multiline
        minRows={2}
        value={rule.description || ""}
        onChange={(e) => onUpdate(index, { description: e.target.value })}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={rule.enabled !== false}
            onChange={(e) => onUpdate(index, { enabled: e.target.checked })}
          />
        }
        label="Enabled"
      />
    </Stack>
  );
}
