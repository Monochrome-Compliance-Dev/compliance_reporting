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
import { userService } from "../../../services";
import { pulseService } from "../../../services/pulse/pulse";
import { nanoid } from "nanoid";
import { useAlert } from "../../../context";

export default function EngagementAssignmentsEditor({
  engagementId,
  resources = [],
  initialAssignments = [],
  onSave,
}) {
  const resourceById = useMemo(
    () => Object.fromEntries(resources.map((r) => [String(r.id), r])),
    [resources]
  );

  const { showAlert } = useAlert();

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [rows, setRows] = useState(() =>
    (initialAssignments || []).map((a) => ({
      key: nanoid(8),
      resourceId: String(a.resourceId),
      allocationPct: a.allocationPct ?? 0,
      allocatedHoursPerWeek: a.allocatedHoursPerWeek ?? "",
      startDate: a.startDate || "",
      endDate: a.endDate || "",
      dueDate: a.dueDate || "",
      completedAt: a.completedAt || "",
      role: a.role || "",
      rateOverride: a.rateOverride ?? "",
      notes: a.notes || "",
      assignmentId: a.id || undefined,
    }))
  );

  const [overlapKeys, setOverlapKeys] = useState([]);

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
        allocationPct: 0,
        allocatedHoursPerWeek: "",
        startDate: suggestedStart,
        endDate: "",
        dueDate: "",
        completedAt: "",
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

  const normaliseRow = useCallback(
    (r) => ({
      resourceId: String(r.resourceId),
      allocationPct: Number(r.allocationPct || 0),
      allocatedHoursPerWeek: toNumberOrNull(r.allocatedHoursPerWeek),
      startDate: toNullIfEmpty(r.startDate),
      endDate: toNullIfEmpty(r.endDate),
      dueDate: toNullIfEmpty(r.dueDate),
      completedAt: toNullIfEmpty(r.completedAt),
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
      allocationPct: a.allocationPct ?? 0,
      allocatedHoursPerWeek: a.allocatedHoursPerWeek ?? "",
      startDate: a.startDate || "",
      endDate: a.endDate || "",
      dueDate: a.dueDate || "",
      completedAt: a.completedAt || "",
      role: a.role || "",
      rateOverride: a.rateOverride ?? "",
      notes: a.notes || "",
      assignmentId: a.id || undefined,
    }));
    setRows(next);
    setBaselineOverride({});
    setOverlapKeys(computeOverlapKeys(next));
  }, [computeOverlapKeys, initialAssignments]);

  // Helper to get effective baseline for a given row id (assignmentId)
  const getBaselineForId = useCallback(
    (id) => baselineOverride[String(id)] ?? baselineById[String(id)] ?? {},
    [baselineOverride, baselineById]
  );

  const handleSave = async () => {
    // validate: no overlapping date ranges per resource
    const byRes = rows.reduce((acc, r) => {
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
        // CREATE: send full payload (nulls where blank)
        return {
          resourceId: norm.resourceId,
          engagementId,
          allocationPct: norm.allocationPct,
          allocatedHoursPerWeek: norm.allocatedHoursPerWeek,
          startDate: norm.startDate,
          endDate: norm.endDate,
          dueDate: norm.dueDate,
          completedAt: norm.completedAt,
          role: norm.role,
          rateOverride: norm.rateOverride,
          notes: norm.notes,
          customerId: userService.userValue.customerId,
          createdBy: userService.userValue.id,
        };
      }

      // EDIT: only send changed fields (PATCH semantics)
      const base = baselineById[String(r.assignmentId)] || {};
      const diff = {};
      "resourceId,allocationPct,allocatedHoursPerWeek,startDate,endDate,dueDate,completedAt,role,rateOverride,notes"
        .split(",")
        .forEach((k) => {
          const a = norm[k];
          const b = base[k];
          // compare primitives and nulls directly
          if (a !== b) diff[k] = a;
        });

      // If nothing changed, skip this assignment (do not send a no-op {id} object)
      if (Object.keys(diff).length === 0) {
        return null; // skip no-op
      }

      return {
        id: String(r.assignmentId),
        ...diff,
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

    const norm = normaliseRow(row);
    const base = getBaselineForId(row.assignmentId);
    const diff = {};
    "resourceId,allocationPct,allocatedHoursPerWeek,startDate,endDate,dueDate,completedAt,role,rateOverride,notes"
      .split(",")
      .forEach((k) => {
        if (norm[k] !== base[k]) diff[k] = norm[k];
      });

    if (Object.keys(diff).length === 0) {
      showAlert("No changes to save.", "info");
      return;
    }

    try {
      await pulseService.assignments.patch(String(row.assignmentId), {
        ...diff,
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
        {!engagementId ? (
          <Typography color="text.secondary">
            Save the engagement first to assign resources.
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
                disabled={!engagementId || rows.length === 0}
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
                            label="Allocation %"
                            size="small"
                            type="number"
                            inputProps={{ min: 0, max: 100, step: 5 }}
                            value={row.allocationPct}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.key === row.key
                                    ? {
                                        ...r,
                                        allocationPct: Number(
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
                            value={row.allocatedHoursPerWeek}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.key === row.key
                                    ? {
                                        ...r,
                                        allocatedHoursPerWeek: e.target.value,
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
                            label="Start"
                            size="small"
                            type="date"
                            value={row.startDate}
                            onChange={(e) => {
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
                            error={overlapKeys.includes(row.key)}
                            helperText={
                              overlapKeys.includes(row.key)
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
                            onChange={(e) => {
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
                            error={overlapKeys.includes(row.key)}
                            helperText={
                              overlapKeys.includes(row.key)
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
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.key === row.key
                                    ? { ...r, dueDate: e.target.value }
                                    : r
                                )
                              )
                            }
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Completed at"
                            size="small"
                            type="datetime-local"
                            value={row.completedAt}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.key === row.key
                                    ? { ...r, completedAt: e.target.value }
                                    : r
                                )
                              )
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
                      <TableCell width={100}>Allocation %</TableCell>
                      <TableCell width={100}>Hours/week</TableCell>
                      <TableCell width={140}>Start</TableCell>
                      <TableCell width={140}>End</TableCell>
                      <TableCell width={140}>Due date</TableCell>
                      <TableCell width={160}>Completed at</TableCell>
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
                            <TextField
                              size="small"
                              type="number"
                              inputProps={{ min: 0, max: 100, step: 5 }}
                              value={row.allocationPct}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.key === row.key
                                      ? {
                                          ...r,
                                          allocationPct: Number(
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
                              value={row.allocatedHoursPerWeek}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.key === row.key
                                      ? {
                                          ...r,
                                          allocatedHoursPerWeek: e.target.value,
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
                              onChange={(e) => {
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
                              error={overlapKeys.includes(row.key)}
                              helperText={
                                overlapKeys.includes(row.key)
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
                              onChange={(e) => {
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
                              error={overlapKeys.includes(row.key)}
                              helperText={
                                overlapKeys.includes(row.key)
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
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.key === row.key
                                      ? { ...r, dueDate: e.target.value }
                                      : r
                                  )
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="datetime-local"
                              value={row.completedAt}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.key === row.key
                                      ? { ...r, completedAt: e.target.value }
                                      : r
                                  )
                                )
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
