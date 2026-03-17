import { useState, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { previewRulesSandbox } from "../services/rules.ptrsApi";

const DEFAULT_LIMIT = 50;

const normaliseHeaders = (headers) => {
  if (!headers) return [];

  const toSafeString = (value) => {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value
        .map((item) =>
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean"
            ? String(item)
            : "",
        )
        .filter(Boolean)
        .join(", ");
    }
    if (typeof value === "object") {
      return (
        value.label ||
        value.value ||
        value.name ||
        value.field ||
        value.header ||
        ""
      );
    }
    return "";
  };

  if (Array.isArray(headers)) {
    return headers
      .map((h) => {
        if (typeof h === "string") {
          return { value: h, label: h };
        }

        if (h && typeof h === "object") {
          const value = toSafeString(h.value || h.field || h.header || h.name);
          const label = toSafeString(
            h.label || h.value || h.field || h.header || h.name,
          );
          if (!value) return null;
          return { value, label: label || value };
        }

        return null;
      })
      .filter(Boolean);
  }

  if (typeof headers === "object") {
    return Object.keys(headers).map((key) => ({
      value: key,
      label: toSafeString(headers[key]) || key,
    }));
  }

  return [];
};

const operatorOptions = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equal" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
  { value: "in", label: "in list" },
  { value: "nin", label: "not in list" },
  { value: "is_null", label: "is empty / null" },
  { value: "not_null", label: "is not empty / null" },
];

const renderCellValue = (value) => {
  if (value == null) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => renderCellValue(item))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    if (typeof value.display === "string") return value.display;
    if (typeof value.label === "string") return value.label;
    if (typeof value.value === "string") return value.value;
    return JSON.stringify(value);
  }
  return String(value);
};

export default function RulesSandbox({ ptrsId, headers, onSeedRule }) {
  const theme = useTheme();
  const { showAlert } = useAlert();

  const fieldOptions = useMemo(() => normaliseHeaders(headers), [headers]);

  const [filters, setFilters] = useState([{ field: "", op: "eq", value: "" }]);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [previewHeaders, setPreviewHeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  const hasFilter = useMemo(
    () => filters.some((f) => f.field && f.op),
    [filters],
  );

  const updateFilter = (index, patch) => {
    setFilters((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  };

  const addFilterRow = () => {
    setFilters((prev) => [...prev, { field: "", op: "eq", value: "" }]);
  };

  const removeFilterRow = (index) => {
    setFilters((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  const handleRunPreview = async () => {
    if (!ptrsId) {
      showAlert("You need a PTRS run before previewing data.", "info");
      return;
    }
    if (!hasFilter) {
      showAlert("Add at least one condition before previewing.", "info");
      return;
    }

    const effectiveLimit = Number(limit) || DEFAULT_LIMIT;

    const payloadFilters = filters.filter((f) => {
      const hasFieldAndOp = f.field && f.op;
      const rawVal = f.value ?? "";
      const trimmed = String(rawVal).trim();
      const isNullOp = f.op === "is_null" || f.op === "not_null";
      return hasFieldAndOp && (trimmed || isNullOp);
    });

    setLoading(true);
    try {
      const prev = await previewRulesSandbox(ptrsId, {
        filters: payloadFilters,
        limit: effectiveLimit,
      });

      const allRows = prev?.rows || [];
      const total = prev?.stats?.totalMatching ?? allRows.length;
      const shown = allRows.length;

      setRows(allRows);
      setTotalCount(total);
      setPreviewHeaders(normaliseHeaders(prev?.headers || headers));

      showAlert(
        `Previewing ${shown} of ${total} matching row(s) for this filter.`,
        "info",
      );
    } catch (err) {
      console.error("[RulesSandbox] preview failed", err);
      showAlert(err?.message || "Failed to preview dataset slice.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUseAsRule = (kind = "row") => {
    if (!hasFilter) {
      showAlert(
        "Define at least one condition before creating a rule.",
        "info",
      );
      return;
    }
    if (typeof onSeedRule !== "function") {
      showAlert("Cannot create a rule from this filter right now.", "error");
      return;
    }

    const primary = filters.find((f) => f.field && f.op);

    if (!primary) {
      showAlert(
        "Define at least one condition before creating a rule.",
        "info",
      );
      return;
    }

    onSeedRule({
      kind,
      condition: {
        field: primary.field,
        op: primary.op,
        value: primary.value,
      },
    });

    if (kind === "crossRow") {
      showAlert(
        "Added a new cross-row adjustment. You can wire the matching fields and amounts in the rule editor.",
        "success",
      );
    } else {
      showAlert(
        "Added a new rule based on the first condition. You can refine it in the rule editor.",
        "success",
      );
    }
  };

  const handleClear = () => {
    setFilters([{ field: "", op: "eq", value: "" }]);
    setRows([]);
    setTotalCount(0);
    setPreviewHeaders([]);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={600}>
          Explore your dataset
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          Start by filtering a slice of your staged PTRS data. When you find a
          useful filter, you can turn it into a rule and then define what should
          happen to the matching rows.
        </Typography>

        {filters.map((f, idx) => (
          <Stack
            key={idx}
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "flex-end" }}
            sx={{ mt: idx > 0 ? 1 : 0, flexWrap: "wrap" }}
          >
            <Box sx={{ minWidth: 260, maxWidth: 360, flex: "0 1 320px" }}>
              <FormControl fullWidth size="small">
                <InputLabel id={`sandbox-field-label-${idx}`}>Field</InputLabel>
                <Select
                  labelId={`sandbox-field-label-${idx}`}
                  label="Field"
                  value={f.field || ""}
                  onChange={(e) => updateFilter(idx, { field: e.target.value })}
                >
                  {fieldOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ minWidth: 200, maxWidth: 260, flex: "0 1 220px" }}>
              <FormControl fullWidth size="small">
                <InputLabel id={`sandbox-op-label-${idx}`}>Operator</InputLabel>
                <Select
                  labelId={`sandbox-op-label-${idx}`}
                  label="Operator"
                  value={f.op}
                  onChange={(e) => updateFilter(idx, { op: e.target.value })}
                >
                  {operatorOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ minWidth: 260, maxWidth: 520, flex: "1 1 420px" }}>
              <TextField
                fullWidth
                size="small"
                label="Value"
                value={f.value}
                onChange={(e) => updateFilter(idx, { value: e.target.value })}
                placeholder={
                  f.op === "in" || f.op === "nin"
                    ? "comma-separated values"
                    : ""
                }
              />
              {idx === 0 && (f.op === "in" || f.op === "nin") ? (
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    mt: 0.5,
                    display: "block",
                  }}
                >
                  IN/NOT IN supports comma-separated values.
                </Typography>
              ) : null}
            </Box>

            {idx === 0 ? (
              <Box sx={{ minWidth: 140, maxWidth: 180, flex: "0 0 160px" }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Limit"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  inputProps={{ min: 1, step: 1 }}
                />
              </Box>
            ) : (
              <Box sx={{ minWidth: 140, maxWidth: 180, flex: "0 0 160px" }}>
                <Button
                  variant="text"
                  color="inherit"
                  onClick={() => removeFilterRow(idx)}
                  sx={{ mt: { xs: 0, md: 0.5 } }}
                >
                  Remove
                </Button>
              </Box>
            )}
          </Stack>
        ))}

        <Box sx={{ mt: 1 }}>
          <Button variant="text" size="small" onClick={addFilterRow}>
            + Add condition
          </Button>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ mt: 1, flexWrap: "wrap" }}
        >
          <Button
            variant="contained"
            onClick={handleRunPreview}
            disabled={loading}
          >
            {loading ? "Previewing…" : "Run preview"}
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleUseAsRule("row")}
            disabled={!hasFilter}
          >
            Use as new rule
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleUseAsRule("crossRow")}
            disabled={!hasFilter}
            sx={{ ml: 0 }}
          >
            Use as cross-row adjustment
          </Button>
          <Button variant="text" onClick={handleClear}>
            Clear
          </Button>
        </Stack>

        {rows.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              {totalCount
                ? `Showing ${rows.length} of ${totalCount} row(s) matching this filter.`
                : `Showing ${rows.length} row(s) matching this filter.`}
            </Typography>
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ mt: 1, maxHeight: 340, overflow: "auto" }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {(previewHeaders.length
                      ? previewHeaders
                      : fieldOptions
                    ).map((h) => (
                      <TableCell key={h.value}>{h.label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={row.row_no ?? idx}>
                      {(previewHeaders.length
                        ? previewHeaders
                        : fieldOptions
                      ).map((h) => (
                        <TableCell
                          key={h.value}
                          sx={{
                            fontFamily: "monospace",
                            whiteSpace: "nowrap",
                            maxWidth: 220,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {renderCellValue(row[h.value])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
