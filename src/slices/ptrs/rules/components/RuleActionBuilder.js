import {
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

export default function RuleActionBuilder({ rule, index, headers, onUpdate }) {
  const action = rule.action || {
    op: "add",
    field: "",
    valueFieldFromCurrent: "",
    round: 2,
  };
  const isConcatFields = action.op === "concat_fields";
  const safeOperationValue = [
    "add",
    "sub",
    "mul",
    "div",
    "assign",
    "concat_fields",
  ].includes(action.op)
    ? action.op
    : "add";
  const safeHeaderValue = (v) =>
    typeof v === "string" && headers.includes(v) ? v : "";

  return (
    <Stack spacing={1}>
      <InputLabel>Action</InputLabel>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl fullWidth size="small">
          <InputLabel id={`act-op-${index}`}>Operation</InputLabel>
          <Select
            labelId={`act-op-${index}`}
            label="Operation"
            value={safeOperationValue}
            onChange={(e) =>
              onUpdate(index, { action: { ...action, op: e.target.value } })
            }
          >
            {["add", "sub", "mul", "div", "assign", "concat_fields"].map(
              (op) => (
                <MenuItem key={op} value={op}>
                  {op}
                </MenuItem>
              ),
            )}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel id={`act-field-${index}`}>Target field</InputLabel>
          <Select
            labelId={`act-field-${index}`}
            label="Target field"
            value={safeHeaderValue(action.field)}
            disabled={isConcatFields}
            onChange={(e) =>
              onUpdate(index, { action: { ...action, field: e.target.value } })
            }
          >
            {headers.map((h) => (
              <MenuItem key={h} value={h}>
                {h}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel id={`act-src-${index}`}>Value from</InputLabel>
          <Select
            labelId={`act-src-${index}`}
            label="Value from"
            value={safeHeaderValue(action.valueFieldFromCurrent)}
            disabled={isConcatFields}
            onChange={(e) =>
              onUpdate(index, {
                action: { ...action, valueFieldFromCurrent: e.target.value },
              })
            }
          >
            {headers.map((h) => (
              <MenuItem key={h} value={h}>
                {h}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Round (dp)"
          type="number"
          value={action.round}
          disabled={isConcatFields}
          onChange={(e) =>
            onUpdate(index, {
              action: { ...action, round: Number(e.target.value || 0) },
            })
          }
          sx={{ width: 300 }}
        />
      </Stack>
      {isConcatFields && (
        <Typography variant="caption" color="text.secondary">
          Helper-field rule. Edit segments in the Helper fields section rather
          than here.
        </Typography>
      )}
    </Stack>
  );
}
