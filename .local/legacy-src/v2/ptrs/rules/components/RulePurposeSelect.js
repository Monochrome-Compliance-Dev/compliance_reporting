import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

export default function RulePurposeSelect({ rule, index, onUpdate }) {
  return (
    <FormControl fullWidth size="small">
      <InputLabel id={`purpose-${index}`}>Rule type</InputLabel>
      <Select
        labelId={`purpose-${index}`}
        label="Rule type"
        value={rule.type || "row"}
        onChange={(e) => onUpdate(index, { type: e.target.value })}
      >
        <MenuItem value="row">Row rule</MenuItem>
        <MenuItem value="crossRow">Match related rows</MenuItem>
      </Select>
    </FormControl>
  );
}
