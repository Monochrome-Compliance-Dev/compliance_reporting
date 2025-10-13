import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Grid,
  useMediaQuery,
} from "@mui/material";

import { useTheme } from "@mui/material/styles";
import { userService } from "services";
import { nanoid } from "nanoid";
import { useAlert } from "context";
import {
  updateAssignment,
  createAssignment,
  getActiveBudgetByTrackable,
  listBudgetLines,
} from "../../services/pulseApi";

export default function TrackableAssignmentsEditor({
  trackableId,
  resources = [],
  initialAssignments = [],
  onSave,
  onSummaryChange, // optional: report assigned totals
  onRowsChange, // optional: stream live rows up
}) {
  const resourceById = useMemo(
    () => Object.fromEntries(resources.map((r) => [String(r.id), r])),
    [resources]
  );

  const { showAlert } = useAlert();

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const [budgetLines, setBudgetLines] = useState([]);
  const [loadingBudgetLines, setLoadingBudgetLines] = useState(false);

  const [rows, setRows] = useState(() =>
    (initialAssignments || []).map((a) => ({
      key: nanoid(8),
      resourceId: String(a.resourceId),
      budgetLineId: a.budgetLineId || "",
      assignmentPct: a.assignmentPct ?? 0,
      assignedHoursPerWeek: a.assignedHoursPerWeek ?? "",
      startDate: a.startDate || "",
      endDate: a.endDate || "",
      dueDate: a.dueDate || "",
      role: a.role || "",
      rateOverride: a.rateOverride ?? "",
      notes: a.notes || "",
      assignmentId: a.id || undefined,
    }))
  );
  const [errorsByKey, setErrorsByKey] = useState({});

  const [overlapKeys, setOverlapKeys] = useState([]);

  // Derived totals for parent chips
  const assignedHoursTotal = useMemo(
    () =>
      (rows || []).reduce(
        (sum, r) => sum + (Number(r.assignedHoursPerWeek) || 0),
        0
      ),
    [rows]
  );
  const assignedCount = useMemo(() => (rows || []).length, [rows]);

  const datesOverlap = (aStart, aEnd, bStart, bEnd) => {
    if (!aStart || !aEnd || !bStart || !bEnd) return true; // open ranges considered overlapping
    return !(aEnd < bStart || bEnd < aStart);
  };

  const computeOverlapKeys = useCallback((list) => {
    const byRes = list.reduce((acc, r) => {
      (acc[r.resourceId] ||= []).push(r);
      return acc;
    }, {});
    const offending = new Set();
    for (const rid of Object.keys(byRes)) {
      const entries = byRes[rid];
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const a = entries[i];
          const b = entries[j];
          // only evaluate when both ranges are fully specified
          if (
            a.startDate &&
            a.endDate &&
            b.startDate &&
            b.endDate &&
            datesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)
          ) {
            offending.add(a.key);
            offending.add(b.key);
          }
        }
      }
    }
    return Array.from(offending);
  }, []);

  const isISODate = (s) =>
    typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const nextDay = (s) => {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  // Clear a specific field error for a row
  const clearErr = (key, field) =>
    setErrorsByKey((prev) => {
      if (!prev[key]?.[field]) return prev;
      const next = { ...prev, [key]: { ...(prev[key] || {}), [field]: false } };
      return next;
    });

  const addResource = (rid) => {
    setRows((prev) => {
      const sameRes = prev.filter((r) => String(r.resourceId) === String(rid));
      const lastEnd = sameRes
        .map((r) => r.endDate)
        .filter((d) => isISODate(d))
        .sort()
        .at(-1);
      const suggestedStart = lastEnd ? nextDay(lastEnd) : "";

      const newRow = {
        key: nanoid(8),
        resourceId: String(rid),
        budgetLineId: budgetLines.length === 1 ? String(budgetLines[0].id) : "",
        assignmentPct: 0,
        assignedHoursPerWeek: "",
        startDate: suggestedStart,
        endDate: "",
        dueDate: "",
        role: "",
        rateOverride: "",
        notes: "",
        assignmentId: undefined,
      };
      return [...prev, newRow];
    });
  };

  const removeRow = (key) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.key !== key);
      setOverlapKeys(computeOverlapKeys(next));
      return next;
    });
  };

  // --- Normalisation helpers and baseline map for diffing ---
  const toNullIfEmpty = (v) => (v === "" || v == null ? null : v);
  const toNumberOrNull = (v) => (v === "" || v == null ? null : Number(v));
  // Remove null/undefined/empty-string values from an object
  const compactPayload = (obj) => {
    const out = {};
    Object.entries(obj || {}).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      if (typeof v === "string" && v.trim() === "") return;
      out[k] = v;
    });
    return out;
  };

  const normaliseRow = useCallback(
    (r) => ({
      resourceId: String(r.resourceId),
      budgetLineId: r.budgetLineId ? String(r.budgetLineId) : "",
      assignmentPct: Number(r.assignmentPct || 0),
      assignedHoursPerWeek: toNumberOrNull(r.assignedHoursPerWeek),
      startDate: toNullIfEmpty(r.startDate),
      endDate: toNullIfEmpty(r.endDate),
      dueDate: toNullIfEmpty(r.dueDate),
      role: toNullIfEmpty(r.role),
      rateOverride: toNumberOrNull(r.rateOverride),
      notes: toNullIfEmpty(r.notes),
    }),
    []
  );

  const baselineById = useMemo(() => {
    const list = initialAssignments || [];
    return Object.fromEntries(list.map((a) => [String(a.id), normaliseRow(a)]));
  }, [initialAssignments, normaliseRow]);

  // Local baseline override for per-row save
  const [baselineOverride, setBaselineOverride] = useState({});

  // Re-hydrate rows when initialAssignments changes (e.g., after async fetch)
  useEffect(() => {
    const next = (initialAssignments || []).map((a) => ({
      key: nanoid(8),
      resourceId: String(a.resourceId),
      budgetLineId: a.budgetLineId || "",
      assignmentPct: a.assignmentPct ?? 0,
      assignedHoursPerWeek: a.assignedHoursPerWeek ?? "",
      startDate: a.startDate || "",
      endDate: a.endDate || "",
      dueDate: a.dueDate || "",
      role: a.role || "",
      rateOverride: a.rateOverride ?? "",
      notes: a.notes || "",
      assignmentId: a.id || undefined,
    }));
    setRows(next);
    setBaselineOverride({});
    setOverlapKeys(computeOverlapKeys(next));
  }, [computeOverlapKeys, initialAssignments]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!trackableId) {
        setBudgetLines([]);
        return;
      }
      try {
        setLoadingBudgetLines(true);
        const b = await getActiveBudgetByTrackable(String(trackableId));
        if (!b?.id) {
          if (!ignore) setBudgetLines([]);
          return;
        }
        const lines = await listBudgetLines(String(b.id));
        if (!ignore) setBudgetLines(Array.isArray(lines) ? lines : []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load budget lines", e);
        if (!ignore) setBudgetLines([]);
      } finally {
        if (!ignore) setLoadingBudgetLines(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [trackableId]);

  // Notify parent when totals change (keeps chips in sync in real time)
  useEffect(() => {
    if (typeof onSummaryChange === "function") {
      onSummaryChange({ assignedHours: assignedHoursTotal, assignedCount });
    }
  }, [assignedHoursTotal, assignedCount, onSummaryChange]);

  // Stream full rows up (so parent can recompute planned/remaining against budget)
  useEffect(() => {
    if (typeof onRowsChange === "function") {
      onRowsChange(rows);
    }
  }, [rows, onRowsChange]);

  // Helper to get effective baseline for a given row id (assignmentId)
  const getBaselineForId = useCallback(
    (id) => baselineOverride[String(id)] ?? baselineById[String(id)] ?? {},
    [baselineOverride, baselineById]
  );

  const handleSave = async () => {
    // validate: required fields per row
    const byRes = rows.reduce((acc, r) => {
      (acc[r.resourceId] ||= []).push(r);
      return acc;
    }, {});

    // required fields: startDate, endDate, dueDate
    const missingMap = {};
    let hasMissing = false;
    for (const r of rows) {
      const miss = {
        budgetLineId: !r.budgetLineId,
        startDate: !r.startDate,
        endDate: !r.endDate,
        dueDate: !r.dueDate,
      };
      if (miss.startDate || miss.endDate || miss.dueDate) {
        missingMap[r.key] = miss;
        hasMissing = true;
      }
    }
    if (hasMissing) {
      setErrorsByKey(missingMap);
      showAlert(
        "Please select a Budget line and complete Start, End and Due dates for all assignments.",
        "warning"
      );
      return; // abort save
    }
    setErrorsByKey({});

    // validate: no overlapping date ranges per resource
    const offending = new Set();
    for (const rid of Object.keys(byRes)) {
      const entries = byRes[rid];
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const a = entries[i];
          const b = entries[j];
          if (datesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)) {
            offending.add(a.key);
            offending.add(b.key);
          }
        }
      }
    }

    if (offending.size > 0) {
      setOverlapKeys(Array.from(offending));
      showAlert(
        "Overlapping assignments for the same resource. Set non-overlapping dates.",
        "warning"
      );
      return; // abort save
    } else {
      setOverlapKeys([]);
    }

    // Build assignments: create = full, edit = diff only
    const assignments = rows.map((r) => {
      const norm = normaliseRow(r);

      if (!r.assignmentId) {
        // CREATE: send full payload (nulls where blank), but omit optional nulls/empties
        const base = {
          resourceId: norm.resourceId,
          budgetLineId: norm.budgetLineId,
          trackableId,
          assignmentPct: norm.assignmentPct,
          assignedHoursPerWeek: norm.assignedHoursPerWeek,
          startDate: norm.startDate,
          endDate: norm.endDate,
          dueDate: norm.dueDate,
          customerId: userService.userValue.customerId,
          createdBy: userService.userValue.id,
        };
        const optional = compactPayload({
          role: norm.role,
          rateOverride: norm.rateOverride,
          notes: norm.notes,
        });
        return { ...base, ...optional };
      }

      // EDIT: only send changed fields (PATCH semantics)
      const base = baselineById[String(r.assignmentId)] || {};
      const diff = {};
      "resourceId,assignmentPct,assignedHoursPerWeek,startDate,endDate,dueDate,role,rateOverride,notes"
        .split(",")
        .forEach((k) => {
          const a = norm[k];
          const b = base[k];
          // compare primitives and nulls directly
          if (a !== b) diff[k] = a;
        });

      // Compact diff and skip if nothing remains
      const cleaned = compactPayload(diff);
      if (Object.keys(cleaned).length === 0) {
        return null; // skip no-op
      }
      return {
        id: String(r.assignmentId),
        ...cleaned,
        customerId: userService.userValue.customerId,
        updatedBy: userService.userValue.id,
      };
    });

    // Filter out any nulls (no-op edits) before sending to onSave
    const filtered = assignments.filter(Boolean);
    await onSave?.(filtered);
  };

  // Per-row save handler (PATCHes only changed fields, updates local baseline)
  const saveRow = async (rowKey) => {
    const row = rows.find((r) => r.key === rowKey);
    if (!row) return;
    if (!row.assignmentId) {
      showAlert("Use 'Save assignments' to create new rows first.", "info");
      return;
    }
    if (!row.assignmentId) {
      // create new assignment for this row
      const norm = normaliseRow(row);
      const miss = {
        budgetLineId: !norm.budgetLineId,
        startDate: !row.startDate,
        endDate: !row.endDate,
        dueDate: !row.dueDate,
      };
      if (miss.budgetLineId || miss.startDate || miss.endDate || miss.dueDate) {
        setErrorsByKey((prev) => ({ ...prev, [row.key]: miss }));
        showAlert(
          "Select a Budget line and complete Start, End and Due date before saving this row.",
          "warning"
        );
        return;
      }
      try {
        const created = await createAssignment({
          resourceId: norm.resourceId,
          budgetLineId: norm.budgetLineId,
          trackableId,
          assignmentPct: norm.assignmentPct,
          assignedHoursPerWeek: norm.assignedHoursPerWeek,
          startDate: norm.startDate,
          endDate: norm.endDate,
          dueDate: norm.dueDate,
          role: norm.role,
          rateOverride: norm.rateOverride,
          notes: norm.notes,
          customerId: userService.userValue.customerId,
          createdBy: userService.userValue.id,
        });
        const newId =
          created?.id || created?.assignment?.id || created?.data?.id;
        setRows((prev) =>
          prev.map((r) =>
            r.key === row.key ? { ...r, assignmentId: newId } : r
          )
        );
        setBaselineOverride((prev) => ({ ...prev, [String(newId)]: norm }));
        showAlert("Row created.", "success");
        return;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to create row", e);
        showAlert("Failed to create row.", "error");
        return;
      }
    }

    // required field guard (single row)
    const miss = {
      startDate: !row.startDate,
      endDate: !row.endDate,
      dueDate: !row.dueDate,
    };
    if (miss.startDate || miss.endDate || miss.dueDate) {
      setErrorsByKey((prev) => ({ ...prev, [row.key]: miss }));
      showAlert(
        "Complete Start, End and Due date before saving this row.",
        "warning"
      );
      return;
    }

    const norm = normaliseRow(row);
    const base = getBaselineForId(row.assignmentId);
    const diff = {};
    "resourceId,budgetLineId,assignmentPct,assignedHoursPerWeek,startDate,endDate,dueDate,role,rateOverride,notes"
      .split(",")
      .forEach((k) => {
        if (norm[k] !== base[k]) diff[k] = norm[k];
      });

    const cleaned = compactPayload(diff);
    if (Object.keys(cleaned).length === 0) {
      showAlert("No changes to save.", "info");
      return;
    }

    try {
      await updateAssignment(String(row.assignmentId), {
        ...cleaned,
        customerId: userService.userValue.customerId,
        updatedBy: userService.userValue.id,
      });
      // Update local baseline so subsequent diffs are accurate
      setBaselineOverride((prev) => ({
        ...prev,
        [String(row.assignmentId)]: norm,
      }));
      showAlert("Row saved.", "success");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to save row", e);
      showAlert("Failed to save row.", "error");
    }
  };

  return (
    <Paper variant="outlined">
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Assignments
        </Typography>
        {!trackableId ? (
          <Typography color="text.secondary">
            Save the trackable first to assign resources.
          </Typography>
        ) : (
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="resource-add-label">Add resource</InputLabel>
                <Select
                  labelId="resource-add-label"
                  label="Add resource"
                  value=""
                  onChange={(e) => {
                    const rid = String(e.target.value);
                    if (!rid) return;
                    addResource(rid);
                  }}
                >
                  <MenuItem value="">
                    <em>Select…</em>
                  </MenuItem>
                  {resources.map((r) => (
                    <MenuItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!trackableId || rows.length === 0}
              >
                Save assignments
              </Button>
            </Stack>
            {isXs ? (
              // Mobile / small screens: card layout
              <Stack spacing={1}>
                {rows.length === 0 ? (
                  <Typography color="text.secondary">
                    No resources assigned.
                  </Typography>
                ) : (
                  rows.map((row) => (
                    <Paper
                      key={row.key}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        bgcolor: overlapKeys.includes(row.key)
                          ? (theme) => theme.palette.error.light + "33"
                          : undefined,
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mb: 1 }}
                      >
                        <Typography variant="subtitle2">
                          {resourceById[row.resourceId]?.name || row.resourceId}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => saveRow(row.key)}
                          >
                            Save
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => removeRow(row.key)}
                          >
                            Remove
                          </Button>
                        </Stack>
                      </Stack>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Assignment %"
                            size="small"
                            type="number"
                            inputProps={{ min: 0, max: 100, step: 5 }}
                            value={row.assignmentPct}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.key === row.key
                                    ? {
                                        ...r,
                                        assignmentPct: Number(
                                          e.target.value || 0
                                        ),
                                      }
                                    : r
                                )
                              )
                            }
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Hours/week"
                            size="small"
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            value={row.assignedHoursPerWeek}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.key === row.key
                                    ? {
                                        ...r,
                                        assignedHoursPerWeek: e.target.value,
                                      }
                                    : r
                                )
                              )
                            }
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <FormControl
                            fullWidth
                            size="small"
                            required
                            disabled={loadingBudgetLines}
                          >
                            <InputLabel id={`bl-${row.key}`}>
                              Budget line
                            </InputLabel>
                            <Select
                              labelId={`bl-${row.key}`}
                              label="Budget line"
                              value={row.budgetLineId}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.key === row.key
                                      ? {
                                          ...r,
                                          budgetLineId: String(e.target.value),
                                        }
                                      : r
                                  )
                                )
                              }
                              error={!!errorsByKey[row.key]?.budgetLineId}
                            >
                              <MenuItem value="">
                                <em>Select…</em>
                              </MenuItem>
                              {budgetLines.map((bl) => (
                                <MenuItem key={bl.id} value={String(bl.id)}>
                                  {bl.name ||
                                    bl.title ||
                                    bl.description ||
                                    bl.code ||
                                    bl.id}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Start"
                            size="small"
                            type="date"
                            value={row.startDate}
                            required
                            onChange={(e) => {
                              clearErr(row.key, "startDate");
                              setRows((prev) => {
                                const next = prev.map((r) =>
                                  r.key === row.key
                                    ? { ...r, startDate: e.target.value }
                                    : r
                                );
                                setOverlapKeys(computeOverlapKeys(next));
                                return next;
                              });
                            }}
                            error={
                              !!errorsByKey[row.key]?.startDate ||
                              overlapKeys.includes(row.key)
                            }
                            helperText={
                              errorsByKey[row.key]?.startDate
                                ? "Required"
                                : overlapKeys.includes(row.key)
                                  ? "Overlaps another assignment"
                                  : undefined
                            }
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="End"
                            size="small"
                            type="date"
                            value={row.endDate}
                            required
                            onChange={(e) => {
                              clearErr(row.key, "endDate");
                              setRows((prev) => {
                                const next = prev.map((r) =>
                                  r.key === row.key
                                    ? { ...r, endDate: e.target.value }
                                    : r
                                );
                                setOverlapKeys(computeOverlapKeys(next));
                                return next;
                              });
                            }}
                            error={
                              !!errorsByKey[row.key]?.endDate ||
                              overlapKeys.includes(row.key)
                            }
                            helperText={
                              errorsByKey[row.key]?.endDate
                                ? "Required"
                                : overlapKeys.includes(row.key)
                                  ? "Overlaps another assignment"
                                  : undefined
                            }
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Due date"
                            size="small"
                            type="date"
                            value={row.dueDate}
                            required
                            onChange={(e) => {
                              clearErr(row.key, "dueDate");
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.key === row.key
                                    ? { ...r, dueDate: e.target.value }
                                    : r
                                )
                              );
                            }}
                            error={!!errorsByKey[row.key]?.dueDate}
                            helperText={
                              errorsByKey[row.key]?.dueDate
                                ? "Required"
                                : undefined
                            }
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Role"
                            size="small"
                            value={row.role}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.key === row.key
                                    ? { ...r, role: e.target.value }
                                    : r
                                )
                              )
                            }
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Rate override"
                            size="small"
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            value={row.rateOverride}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.key === row.key
                                    ? { ...r, rateOverride: e.target.value }
                                    : r
                                )
                              )
                            }
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Notes"
                            size="small"
                            value={row.notes}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.key === row.key
                                    ? { ...r, notes: e.target.value }
                                    : r
                                )
                              )
                            }
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))
                )}
              </Stack>
            ) : (
              // Desktop and up: keep table layout
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ tableLayout: "auto", minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Resource</TableCell>
                      <TableCell>Budget line</TableCell>
                      <TableCell width={100}>Assignment %</TableCell>
                      <TableCell width={100}>Hours/week</TableCell>
                      <TableCell width={140}>Start</TableCell>
                      <TableCell width={140}>End</TableCell>
                      <TableCell width={140}>Due date</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell width={120}>Rate override</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11}>
                          <Typography color="text.secondary">
                            No resources assigned.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
                        <TableRow
                          key={row.key}
                          sx={{
                            bgcolor: overlapKeys.includes(row.key)
                              ? (theme) => theme.palette.error.light + "33"
                              : undefined,
                          }}
                        >
                          {/* existing desktop cells (unchanged) */}
                          <TableCell>
                            {resourceById[row.resourceId]?.name ||
                              row.resourceId}
                          </TableCell>
                          <TableCell>
                            <FormControl
                              size="small"
                              required
                              sx={{ minWidth: 200 }}
                              disabled={loadingBudgetLines}
                            >
                              <Select
                                value={row.budgetLineId}
                                displayEmpty
                                onChange={(e) =>
                                  setRows((prev) =>
                                    prev.map((r) =>
                                      r.key === row.key
                                        ? {
                                            ...r,
                                            budgetLineId: String(
                                              e.target.value
                                            ),
                                          }
                                        : r
                                    )
                                  )
                                }
                                error={!!errorsByKey[row.key]?.budgetLineId}
                              >
                                <MenuItem value="">
                                  <em>Select…</em>
                                </MenuItem>
                                {budgetLines.map((bl) => (
                                  <MenuItem key={bl.id} value={String(bl.id)}>
                                    {bl.name ||
                                      bl.title ||
                                      bl.description ||
                                      bl.code ||
                                      bl.id}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              inputProps={{ min: 0, max: 100, step: 5 }}
                              value={row.assignmentPct}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.key === row.key
                                      ? {
                                          ...r,
                                          assignmentPct: Number(
                                            e.target.value || 0
                                          ),
                                        }
                                      : r
                                  )
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              inputProps={{ min: 0, step: 1 }}
                              value={row.assignedHoursPerWeek}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.key === row.key
                                      ? {
                                          ...r,
                                          assignedHoursPerWeek: e.target.value,
                                        }
                                      : r
                                  )
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="date"
                              value={row.startDate}
                              required
                              onChange={(e) => {
                                clearErr(row.key, "startDate");
                                setRows((prev) => {
                                  const next = prev.map((r) =>
                                    r.key === row.key
                                      ? { ...r, startDate: e.target.value }
                                      : r
                                  );
                                  setOverlapKeys(computeOverlapKeys(next));
                                  return next;
                                });
                              }}
                              error={
                                !!errorsByKey[row.key]?.startDate ||
                                overlapKeys.includes(row.key)
                              }
                              helperText={
                                errorsByKey[row.key]?.startDate
                                  ? "Required"
                                  : overlapKeys.includes(row.key)
                                    ? "Overlaps another assignment"
                                    : undefined
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="date"
                              value={row.endDate}
                              required
                              onChange={(e) => {
                                clearErr(row.key, "endDate");
                                setRows((prev) => {
                                  const next = prev.map((r) =>
                                    r.key === row.key
                                      ? { ...r, endDate: e.target.value }
                                      : r
                                  );
                                  setOverlapKeys(computeOverlapKeys(next));
                                  return next;
                                });
                              }}
                              error={
                                !!errorsByKey[row.key]?.endDate ||
                                overlapKeys.includes(row.key)
                              }
                              helperText={
                                errorsByKey[row.key]?.endDate
                                  ? "Required"
                                  : overlapKeys.includes(row.key)
                                    ? "Overlaps another assignment"
                                    : undefined
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="date"
                              value={row.dueDate}
                              required
                              onChange={(e) => {
                                clearErr(row.key, "dueDate");
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.key === row.key
                                      ? { ...r, dueDate: e.target.value }
                                      : r
                                  )
                                );
                              }}
                              error={!!errorsByKey[row.key]?.dueDate}
                              helperText={
                                errorsByKey[row.key]?.dueDate
                                  ? "Required"
                                  : undefined
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.role}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.key === row.key
                                      ? { ...r, role: e.target.value }
                                      : r
                                  )
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              inputProps={{ min: 0, step: 1 }}
                              value={row.rateOverride}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.key === row.key
                                      ? { ...r, rateOverride: e.target.value }
                                      : r
                                  )
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.notes}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.key === row.key
                                      ? { ...r, notes: e.target.value }
                                      : r
                                  )
                                )
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="flex-end"
                            >
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => saveRow(row.key)}
                              >
                                Save
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => removeRow(row.key)}
                              >
                                Remove
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
