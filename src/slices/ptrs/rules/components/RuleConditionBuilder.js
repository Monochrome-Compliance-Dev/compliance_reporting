import {
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";

const OPS = [
  { label: "=", value: "eq" },
  { label: "≠", value: "neq" },
  { label: ">", value: "gt" },
  { label: "≥", value: "gte" },
  { label: "<", value: "lt" },
  { label: "≤", value: "lte" },
  { label: "is blank", value: "is_null" },
  { label: "not blank", value: "not_null" },
];

export default function RuleConditionBuilder({
  rule,
  index,
  headers,
  onUpdate,
}) {
  const cond = rule.when?.[0] || { field: "", op: "eq", value: "" };
  const safeHeaderValue = (v) => (headers.includes(v) ? v : "");

  return (
    <Stack spacing={1}>
      <InputLabel>When this rule applies</InputLabel>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl fullWidth size="small">
          <InputLabel id={`when-field-${index}`}>Field</InputLabel>
          <Select
            labelId={`when-field-${index}`}
            label="Field"
            value={safeHeaderValue(cond.field || "")}
            onChange={(e) =>
              onUpdate(index, { when: [{ ...cond, field: e.target.value }] })
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
          <InputLabel id={`when-op-${index}`}>Operator</InputLabel>
          <Select
            labelId={`when-op-${index}`}
            label="Operator"
            value={cond.op || "eq"}
            onChange={(e) =>
              onUpdate(index, { when: [{ ...cond, op: e.target.value }] })
            }
          >
            {OPS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          size="small"
          label="Value"
          value={cond.value || ""}
          onChange={(e) =>
            onUpdate(index, { when: [{ ...cond, value: e.target.value }] })
          }
          disabled={["is_null", "not_null"].includes(cond.op)}
        />
      </Stack>
    </Stack>
  );
}
