import {
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { safeSelectValue } from "shared/utils/";

export default function RuleRelationshipBuilder({
  rule,
  index,
  headers,
  onUpdate,
}) {
  const matches =
    Array.isArray(rule.target?.match) && rule.target.match.length
      ? rule.target.match
      : [{ targetField: "", currentField: "" }];
  const whereClauses =
    Array.isArray(rule.target?.where) && rule.target.where.length
      ? rule.target.where
      : [{ field: "", op: "eq", value: "" }];

  const targetSelection = rule.target?.selection || "first_match";
  const requireTargetMatch = rule.target?.requireMatch !== false;

  const selectHeaders = Array.from(
    new Set(
      [
        ...(Array.isArray(headers) ? headers : []),
        ...matches.flatMap((match) => [
          match?.targetField,
          match?.currentField,
        ]),
        ...whereClauses.map((where) => where?.field),
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );

  const safeHeaderValue = (value) => safeSelectValue(selectHeaders, value);

  const updateMatches = (nextMatch) => {
    onUpdate(index, {
      target: {
        ...rule.target,
        match: nextMatch,
      },
    });
  };

  const updateWhereClauses = (nextWhere) => {
    onUpdate(index, {
      target: {
        ...rule.target,
        where: nextWhere,
      },
    });
  };

  const updateTargetConfig = (patch) => {
    onUpdate(index, {
      target: {
        ...rule.target,
        ...patch,
      },
    });
  };

  const updateMatchAt = (matchIndex, patch) => {
    updateMatches(
      matches.map((item, i) =>
        i === matchIndex ? { ...item, ...patch } : item,
      ),
    );
  };

  const updateWhereAt = (whereIndex, patch) => {
    updateWhereClauses(
      whereClauses.map((item, i) =>
        i === whereIndex ? { ...item, ...patch } : item,
      ),
    );
  };

  const addMatch = () => {
    updateMatches([...matches, { targetField: "", currentField: "" }]);
  };

  const removeMatch = (matchIndex) => {
    const next = matches.filter((_, i) => i !== matchIndex);
    updateMatches(next.length ? next : [{ targetField: "", currentField: "" }]);
  };

  const addWhereClause = () => {
    updateWhereClauses([...whereClauses, { field: "", op: "eq", value: "" }]);
  };

  const removeWhereClause = (whereIndex) => {
    const next = whereClauses.filter((_, i) => i !== whereIndex);
    updateWhereClauses(
      next.length ? next : [{ field: "", op: "eq", value: "" }],
    );
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={1}
      >
        <InputLabel sx={{ m: 0 }}>Related rows</InputLabel>
        <Button size="small" variant="outlined" onClick={addMatch}>
          Add match
        </Button>
      </Stack>

      {matches.map((match, matchIndex) => (
        <Stack key={`match-${matchIndex}`} spacing={1}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              {`Match ${matchIndex + 1}`}
            </Typography>
            <IconButton
              size="small"
              onClick={() => removeMatch(matchIndex)}
              aria-label={`Remove match ${matchIndex + 1}`}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id={`rel-target-${index}-${matchIndex}`}>
                Target field
              </InputLabel>
              <Select
                labelId={`rel-target-${index}-${matchIndex}`}
                label="Target field"
                value={safeHeaderValue(match.targetField)}
                onChange={(e) =>
                  updateMatchAt(matchIndex, { targetField: e.target.value })
                }
              >
                {selectHeaders.map((h) => (
                  <MenuItem key={h} value={h}>
                    {h}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id={`rel-current-${index}-${matchIndex}`}>
                Current field
              </InputLabel>
              <Select
                labelId={`rel-current-${index}-${matchIndex}`}
                label="Current field"
                value={safeHeaderValue(match.currentField)}
                onChange={(e) =>
                  updateMatchAt(matchIndex, { currentField: e.target.value })
                }
              >
                {selectHeaders.map((h) => (
                  <MenuItem key={h} value={h}>
                    {h}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      ))}

      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
          spacing={1}
        >
          <InputLabel sx={{ m: 0 }}>Target matching</InputLabel>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id={`rel-target-selection-${index}`}>
              Target selection
            </InputLabel>
            <Select
              labelId={`rel-target-selection-${index}`}
              label="Target selection"
              value={targetSelection}
              onChange={(e) => {
                const nextSelection = e.target.value;
                updateTargetConfig({
                  selection: nextSelection,
                  requireMatch:
                    nextSelection === "single_per_key"
                      ? requireTargetMatch
                      : false,
                });
              }}
            >
              <MenuItem value="first_match">First matching target</MenuItem>
              <MenuItem value="single_per_key">Single target per key</MenuItem>
              <MenuItem value="best_match_pairing">Best match pairing</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {targetSelection === "single_per_key" ? (
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(requireTargetMatch)}
                  onChange={(e) =>
                    updateTargetConfig({ requireMatch: e.target.checked })
                  }
                />
              }
              label="Require exactly one eligible target row per key"
            />
          </Box>
        ) : null}

        {targetSelection === "best_match_pairing" ? (
          <Stack spacing={1.5}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(rule.target?.excludeUnmatchedCurrent)}
                  onChange={(e) =>
                    updateTargetConfig({
                      excludeUnmatchedCurrent: e.target.checked,
                    })
                  }
                />
              }
              label="Exclude unmatched current rows"
            />

            <TextField
              fullWidth
              size="small"
              label="Unmatched comment"
              value={rule.target?.unmatchedComment || ""}
              onChange={(e) =>
                updateTargetConfig({ unmatchedComment: e.target.value })
              }
              placeholder="Excluded by cross-row rule — no matching invoice found for credit pairing"
            />
          </Stack>
        ) : null}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
          spacing={1}
        >
          <InputLabel sx={{ m: 0 }}>Filter related rows (optional)</InputLabel>
          <Button size="small" variant="outlined" onClick={addWhereClause}>
            Add condition
          </Button>
        </Stack>
      </Stack>

      {whereClauses.map((where, whereIndex) => (
        <Stack key={`where-${whereIndex}`} spacing={1}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              {`Condition ${whereIndex + 1}`}
            </Typography>
            <IconButton
              size="small"
              onClick={() => removeWhereClause(whereIndex)}
              aria-label={`Remove condition ${whereIndex + 1}`}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id={`rel-where-field-${index}-${whereIndex}`}>
                Field
              </InputLabel>
              <Select
                labelId={`rel-where-field-${index}-${whereIndex}`}
                label="Field"
                value={safeHeaderValue(where.field)}
                onChange={(e) =>
                  updateWhereAt(whereIndex, { field: e.target.value })
                }
              >
                {selectHeaders.map((h) => (
                  <MenuItem key={h} value={h}>
                    {h}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id={`rel-where-op-${index}-${whereIndex}`}>
                Operator
              </InputLabel>
              <Select
                labelId={`rel-where-op-${index}-${whereIndex}`}
                label="Operator"
                value={where.op || "eq"}
                onChange={(e) =>
                  updateWhereAt(whereIndex, { op: e.target.value })
                }
              >
                <MenuItem value="eq">=</MenuItem>
                <MenuItem value="neq">≠</MenuItem>
                <MenuItem value="gt">{">"}</MenuItem>
                <MenuItem value="gte">≥</MenuItem>
                <MenuItem value="lt">{"<"}</MenuItem>
                <MenuItem value="lte">≤</MenuItem>
                <MenuItem value="starts_with">starts with</MenuItem>
                <MenuItem value="is_null">is blank</MenuItem>
                <MenuItem value="not_null">not blank</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Value"
              value={where.value || ""}
              onChange={(e) =>
                updateWhereAt(whereIndex, { value: e.target.value })
              }
              disabled={["is_null", "not_null"].includes(where.op)}
            />
          </Stack>
        </Stack>
      ))}

      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(rule.alsoExcludeCurrent)}
            onChange={(e) =>
              onUpdate(index, {
                alsoExcludeCurrent: e.target.checked,
              })
            }
          />
        }
        label="Exclude current rows after applying the related-row adjustment"
      />
    </Stack>
  );
}
