import {
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";

export default function RuleRelationshipBuilder({
  rule,
  index,
  headers,
  onUpdate,
}) {
  const match = rule.target?.match?.[0] || {
    targetField: "",
    currentField: "",
  };
  const where = rule.target?.where?.[0] || { field: "", op: "eq", value: "" };

  return (
    <Stack spacing={2}>
      <InputLabel>Related rows</InputLabel>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl fullWidth size="small">
          <InputLabel id={`rel-target-${index}`}>Target field</InputLabel>
          <Select
            labelId={`rel-target-${index}`}
            label="Target field"
            value={match.targetField}
            onChange={(e) =>
              onUpdate(index, {
                target: {
                  ...rule.target,
                  match: [{ ...match, targetField: e.target.value }],
                },
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

        <FormControl fullWidth size="small">
          <InputLabel id={`rel-current-${index}`}>Current field</InputLabel>
          <Select
            labelId={`rel-current-${index}`}
            label="Current field"
            value={match.currentField}
            onChange={(e) =>
              onUpdate(index, {
                target: {
                  ...rule.target,
                  match: [{ ...match, currentField: e.target.value }],
                },
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
      </Stack>

      <InputLabel>Filter related rows (optional)</InputLabel>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl fullWidth size="small">
          <InputLabel id={`rel-where-field-${index}`}>Field</InputLabel>
          <Select
            labelId={`rel-where-field-${index}`}
            label="Field"
            value={where.field}
            onChange={(e) =>
              onUpdate(index, {
                target: {
                  ...rule.target,
                  where: [{ ...where, field: e.target.value }],
                },
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

        <FormControl fullWidth size="small">
          <InputLabel id={`rel-where-op-${index}`}>Operator</InputLabel>
          <Select
            labelId={`rel-where-op-${index}`}
            label="Operator"
            value={where.op}
            onChange={(e) =>
              onUpdate(index, {
                target: {
                  ...rule.target,
                  where: [{ ...where, op: e.target.value }],
                },
              })
            }
          >
            <MenuItem value="eq">=</MenuItem>
            <MenuItem value="neq">≠</MenuItem>
            <MenuItem value="gt">{">"}</MenuItem>
            <MenuItem value="lt">{"<"}</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          size="small"
          label="Value"
          value={where.value}
          onChange={(e) =>
            onUpdate(index, {
              target: {
                ...rule.target,
                where: [{ ...where, value: e.target.value }],
              },
            })
          }
        />
      </Stack>
    </Stack>
  );
}
