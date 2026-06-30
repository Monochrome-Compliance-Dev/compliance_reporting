import {
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";

const DATA_TYPES = [
  "string",
  "integer",
  "decimal",
  "boolean",
  "date",
  "datetime",
  "json",
];

const DEFAULT_FIELD = {
  name: "",
  sourceHeader: "",
  aliases: [],
  dataType: "string",
  required: false,
  nullable: true,
  parser: "string",
  validation: [],
  examples: [],
  modelHints: {},
  transformerHints: {},
};

export default function SchemaFieldEditor({
  field = {},
  readOnly = false,
  onChange,
  onSave,
  onCancel,
}) {
  const theme = useTheme();

  const [draftField, setDraftField] = useState(() => ({
    ...DEFAULT_FIELD,
    ...field,
  }));

  const aliasesText = useMemo(
    () => (draftField.aliases || []).join(", "),
    [draftField.aliases],
  );

  const [aliasesInput, setAliasesInput] = useState(aliasesText);

  useEffect(() => {
    setAliasesInput(aliasesText);
  }, [aliasesText]);

  useEffect(() => {
    setDraftField({
      ...DEFAULT_FIELD,
      ...field,
    });
  }, [field]);

  const update = (patch) => {
    if (readOnly) return;

    const next = { ...draftField, ...patch };
    setDraftField(next);
    onChange?.(next);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: theme.palette.divider }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1">
          {draftField.name ? `Field: ${draftField.name}` : "New schema field"}
        </Typography>

        <TextField
          label="Field name"
          size="small"
          value={draftField.name || ""}
          disabled={readOnly}
          onChange={(e) => update({ name: e.target.value })}
        />

        <TextField
          label="Source header"
          size="small"
          value={draftField.sourceHeader || ""}
          disabled={readOnly}
          onChange={(e) => update({ sourceHeader: e.target.value })}
        />

        <TextField
          select
          label="Data type"
          size="small"
          value={draftField.dataType || "string"}
          disabled={readOnly}
          onChange={(e) =>
            update({ dataType: e.target.value, parser: e.target.value })
          }
        >
          {DATA_TYPES.map((x) => (
            <MenuItem key={x} value={x}>
              {x}
            </MenuItem>
          ))}
        </TextField>

        <Stack direction="row" spacing={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(draftField.required)}
                disabled={readOnly}
                onChange={(e) => update({ required: e.target.checked })}
              />
            }
            label="Required"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={draftField.nullable !== false}
                disabled={readOnly}
                onChange={(e) => update({ nullable: e.target.checked })}
              />
            }
            label="Nullable"
          />
        </Stack>

        <TextField
          label="Aliases"
          size="small"
          value={aliasesInput}
          disabled={readOnly}
          onChange={(e) => {
            const value = e.target.value;
            setAliasesInput(value);
            update({
              aliases: value
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            });
          }}
          helperText="Comma-separated alternative source headers."
        />

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onCancel ? <Button onClick={onCancel}>Cancel</Button> : null}
          {!readOnly && onSave ? (
            <Button variant="contained" onClick={() => onSave(draftField)}>
              Save field
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
}
