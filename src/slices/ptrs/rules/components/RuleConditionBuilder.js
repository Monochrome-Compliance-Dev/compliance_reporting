import {
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const OPS = [
  { label: "=", value: "eq" },
  { label: "≠", value: "neq" },
  { label: ">", value: "gt" },
  { label: "≥", value: "gte" },
  { label: "<", value: "lt" },
  { label: "≤", value: "lte" },
  { label: "starts with", value: "starts_with" },
  { label: "is blank", value: "is_null" },
  { label: "not blank", value: "not_null" },
];

export default function RuleConditionBuilder({
  rule,
  index,
  headers,
  onUpdate,
}) {
  const conditions =
    Array.isArray(rule.when) && rule.when.length
      ? rule.when
      : [{ field: "", op: "eq", value: "" }];

  const safeHeaderValue = (v) => (headers.includes(v) ? v : "");

  const updateConditions = (next) => {
    onUpdate(index, { when: next });
  };

  const updateConditionAt = (condIndex, patch) => {
    updateConditions(
      conditions.map((c, i) => (i === condIndex ? { ...c, ...patch } : c)),
    );
  };

  const addCondition = () => {
    updateConditions([...conditions, { field: "", op: "eq", value: "" }]);
  };

  const removeCondition = (condIndex) => {
    const next = conditions.filter((_, i) => i !== condIndex);
    updateConditions(next.length ? next : [{ field: "", op: "eq", value: "" }]);
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={1}
      >
        <InputLabel sx={{ m: 0 }}>When this rule applies</InputLabel>
        <Button size="small" variant="outlined" onClick={addCondition}>
          Add condition
        </Button>
      </Stack>

      {conditions.map((cond, condIndex) => (
        <Stack key={`cond-${condIndex}`} spacing={1}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              {`Condition ${condIndex + 1}`}
            </Typography>
            <IconButton
              size="small"
              onClick={() => removeCondition(condIndex)}
              aria-label={`Remove condition ${condIndex + 1}`}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id={`when-field-${index}-${condIndex}`}>
                Field
              </InputLabel>
              <Select
                labelId={`when-field-${index}-${condIndex}`}
                label="Field"
                value={safeHeaderValue(cond.field || "")}
                onChange={(e) =>
                  updateConditionAt(condIndex, { field: e.target.value })
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
              <InputLabel id={`when-op-${index}-${condIndex}`}>
                Operator
              </InputLabel>
              <Select
                labelId={`when-op-${index}-${condIndex}`}
                label="Operator"
                value={cond.op || "eq"}
                onChange={(e) =>
                  updateConditionAt(condIndex, { op: e.target.value })
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
                updateConditionAt(condIndex, { value: e.target.value })
              }
              disabled={["is_null", "not_null"].includes(cond.op)}
            />
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
