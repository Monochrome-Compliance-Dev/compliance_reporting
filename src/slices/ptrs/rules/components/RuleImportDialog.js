import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

const formatRuleType = (scope) => (scope === "crossRow" ? "Cross-row" : "Row");

const formatDate = (value) => {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatCondition = (condition) => {
  if (!condition || typeof condition !== "object") return "";

  return [condition.field, condition.op, condition.value]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .join(" ");
};

export default function RuleImportDialog({
  open,
  onClose,
  ruleSources,
  selected,
  onSelect,
  onCopy,
}) {
  const theme = useTheme();
  const options = Array.isArray(ruleSources) ? ruleSources : [];
  const selectedRules = Array.isArray(selected?.rules) ? selected.rules : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Import / Copy rules</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {!options.length ? (
            <Typography variant="body2" color="text.secondary">
              No existing rule sets were found for this profile.
            </Typography>
          ) : (
            <Autocomplete
              size="small"
              options={options}
              value={selected}
              isOptionEqualToValue={(option, value) =>
                option?.ptrsId === value?.ptrsId
              }
              getOptionLabel={(option) => option?.label || option?.ptrsId || ""}
              onChange={(_event, value) => onSelect(value)}
              renderInput={(params) => (
                <TextField {...params} label="Copy rules from…" />
              )}
              renderOption={(props, option) => {
                const { key, ...optionProps } = props;

                return (
                  <Box
                    component="li"
                    key={key}
                    {...optionProps}
                    sx={{ alignItems: "flex-start" }}
                  >
                    <Stack spacing={0.25}>
                      <Typography variant="body2">
                        PTRS {option.ptrsId}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {option.ruleCount} rule
                        {option.ruleCount === 1 ? "" : "s"}
                        {" · "}
                        Updated {formatDate(option.updatedAt)}
                      </Typography>
                    </Stack>
                  </Box>
                );
              }}
            />
          )}

          {selected ? (
            <>
              <Divider />

              <Box>
                <Typography variant="subtitle2">Rules to be copied</Typography>

                <Typography variant="body2" color="text.secondary">
                  Importing this source will replace the rules currently shown
                  with all rules from PTRS {selected.ptrsId}.
                </Typography>
              </Box>

              <Stack spacing={1.5}>
                {selectedRules.map((rule) => {
                  const definition = rule?.definition || {};
                  const conditions = Array.isArray(definition?.when)
                    ? definition.when
                    : [];

                  return (
                    <Box
                      key={rule.id}
                      sx={{
                        p: 1.5,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                      }}
                    >
                      <Stack spacing={0.75}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Box>
                            <Typography variant="subtitle2">
                              {rule.name}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {rule.groupName || "No group"}
                              {" · "}
                              {formatRuleType(rule.scope)}
                            </Typography>
                          </Box>

                          <Typography variant="caption" color="text.secondary">
                            Updated {formatDate(rule.updatedAt)}
                          </Typography>
                        </Stack>

                        {rule.description ? (
                          <Typography variant="body2" color="text.secondary">
                            {rule.description}
                          </Typography>
                        ) : null}

                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Conditions
                          </Typography>

                          {conditions.length ? (
                            conditions.map((condition, index) => (
                              <Typography
                                key={`${rule.id}-condition-${index}`}
                                variant="body2"
                              >
                                {formatCondition(condition)}
                              </Typography>
                            ))
                          ) : (
                            <Typography variant="body2">None</Typography>
                          )}
                        </Box>

                        {rule.scope === "crossRow" ? (
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Match
                            </Typography>

                            {(definition?.target?.match || []).length ? (
                              definition.target.match.map((match, index) => (
                                <Typography
                                  key={`${rule.id}-match-${index}`}
                                  variant="body2"
                                >
                                  {match.currentField || "Unknown"}
                                  {" → "}
                                  {match.targetField || "Unknown"}
                                </Typography>
                              ))
                            ) : (
                              <Typography variant="body2">None</Typography>
                            )}
                          </Box>
                        ) : null}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>

        <Button onClick={onCopy} disabled={!selected}>
          Copy {selectedRules.length || ""} rule
          {selectedRules.length === 1 ? "" : "s"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
