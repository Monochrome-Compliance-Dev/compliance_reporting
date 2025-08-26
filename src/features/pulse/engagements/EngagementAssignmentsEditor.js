import { useMemo, useState } from "react";
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
} from "@mui/material";
import { userService } from "../../../services";
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

  const [rows, setRows] = useState(() =>
    (initialAssignments || []).map((a) => ({
      key: nanoid(8),
      resourceId: String(a.resourceId),
      allocationPct: a.allocationPct ?? 0,
      startDate: a.startDate || "",
      endDate: a.endDate || "",
      role: a.role || "",
      rateOverride: a.rateOverride ?? "",
      notes: a.notes || "",
    }))
  );

  const [overlapKeys, setOverlapKeys] = useState([]);

  const datesOverlap = (aStart, aEnd, bStart, bEnd) => {
    if (!aStart || !aEnd || !bStart || !bEnd) return true; // open ranges considered overlapping
    return !(aEnd < bStart || bEnd < aStart);
  };

  const computeOverlapKeys = (list) => {
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
  };

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
        startDate: suggestedStart,
        endDate: "",
        role: "",
        rateOverride: "",
        notes: "",
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

    const assignments = rows.map((r) => ({
      resourceId: r.resourceId,
      engagementId,
      allocationPct: Number(r.allocationPct || 0),
      startDate: r.startDate || undefined,
      endDate: r.endDate || undefined,
      role: r.role || undefined,
      rateOverride: r.rateOverride ? Number(r.rateOverride) : undefined,
      notes: r.notes || undefined,
      customerId: userService.userValue.customerId,
      createdBy: userService.userValue.id,
    }));

    await onSave?.(assignments);
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

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Resource</TableCell>
                  <TableCell width={120}>Allocation %</TableCell>
                  <TableCell width={160}>Start</TableCell>
                  <TableCell width={160}>End</TableCell>
                  <TableCell>Role (on engagement)</TableCell>
                  <TableCell width={140}>Rate override</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
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
                      <TableCell>
                        {resourceById[row.resourceId]?.name || row.resourceId}
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
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removeRow(row.key)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
