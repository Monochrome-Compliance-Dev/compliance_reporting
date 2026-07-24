import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useTheme } from "@mui/material/styles";

export default function SchemaFieldList({
  fields = [],
  selectedFieldName,
  readOnly = false,
  onSelectField,
  onRemoveField,
  onToggleFieldIncluded,
}) {
  const theme = useTheme();

  if (!fields.length) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No schema fields have been defined yet.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={1}>
      {fields.map((field) => {
        const fieldName = String(field?.name || "");
        const isSelected = fieldName && fieldName === selectedFieldName;

        return (
          <Paper
            key={fieldName || field?.sourceHeader}
            variant="outlined"
            onClick={() => onSelectField?.(field)}
            sx={{
              p: 1.5,
              cursor: onSelectField ? "pointer" : "default",
              borderColor: isSelected ? theme.palette.primary.main : "divider",
              bgcolor: isSelected
                ? theme.palette.action.selected
                : "background.paper",
              "&:hover": onSelectField
                ? { bgcolor: theme.palette.action.hover }
                : undefined,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ sm: "center" }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  {!readOnly ? (
                    <Checkbox
                      size="small"
                      checked={field?.included !== false}
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                      onChange={(event) => {
                        event.stopPropagation();

                        const checked = event.target.checked;

                        onToggleFieldIncluded?.(
                          {
                            ...field,
                            included: checked,
                          },
                          checked,
                        );
                      }}
                    />
                  ) : null}
                  <Typography variant="subtitle2" noWrap>
                    {fieldName || "Unnamed field"}
                  </Typography>
                  <Chip size="small" label={field?.dataType || "string"} />
                  {field?.required ? (
                    <Chip size="small" color="primary" label="Required" />
                  ) : (
                    <Chip size="small" variant="outlined" label="Optional" />
                  )}
                  {field?.nullable ? (
                    <Chip size="small" variant="outlined" label="Nullable" />
                  ) : null}
                </Stack>

                <Typography variant="body2" color="text.secondary" noWrap>
                  Source header: {field?.sourceHeader || "Not set"}
                </Typography>

                {Array.isArray(field?.aliases) && field.aliases.length ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Aliases: {field.aliases.join(", ")}
                  </Typography>
                ) : null}
              </Box>

              <Stack direction="row" spacing={0.5}>
                {onSelectField ? (
                  <Tooltip title="Edit field">
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectField(field);
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}

                {!readOnly && onRemoveField ? (
                  <Tooltip title="Remove field">
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveField(field);
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
