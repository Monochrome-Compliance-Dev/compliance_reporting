import { useState, useMemo, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Button,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from "@mui/material";
import { usePulseContext, useAlert } from "../../context/";
import { pulseService } from "../../services/pulse/pulse";

// ---- date helpers ----
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const toISO = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  // normalise to local date (AEST) by zeroing time
  dt.setHours(0, 0, 0, 0);
  return dt;
};
const mondayOf = (dateISO) => {
  const d = dateISO ? fromISO(dateISO) : new Date();
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  const mon = new Date(d);
  mon.setDate(d.getDate() - diff);
  return toISO(mon);
};
const weekDays = (weekKeyISO) => {
  const mon = fromISO(weekKeyISO);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return toISO(d);
  });
};

// ---- validation ----
const rowSchema = yup.object({
  id: yup.string().optional(),
  date: yup.string().required("Date required"),
  engagementId: yup.string().required("Engagement required"),
  hours: yup
    .number()
    .typeError("Hours must be a number")
    .min(0, "Min 0")
    .max(24, "Max 24")
    .required("Hours required"),
  notes: yup.string().trim().optional(),
  billable: yup.boolean().optional(),
});

const sheetSchema = yup.object({
  resourceId: yup.string().required("Choose a resource"),
  weekKey: yup.string().required("Choose a week"),
  rows: yup.array().of(rowSchema).default([]),
});

export default function TimesheetView() {
  const {
    resources = [],
    engagements = [],
    setTimesheet,
    getTimesheet,
  } = usePulseContext();
  const { showAlert } = useAlert();

  // top controls
  const [resourceId, setResourceId] = useState("");
  const [weekKey, setWeekKey] = useState(mondayOf());

  // derive engagement options (MVP: all engagements; later filter by resource)
  const engagementOptions = useMemo(() => engagements || [], [engagements]);

  // RHF setup
  const { control, handleSubmit, reset, watch, formState } = useForm({
    resolver: yupResolver(sheetSchema),
    defaultValues: { resourceId: "", weekKey: mondayOf(), rows: [] },
    mode: "onBlur",
  });
  const { errors, isSubmitting } = formState;
  const { fields, append, remove, replace } = useFieldArray({
    name: "rows",
    control,
  });

  // Keep RHF state in sync with selectors
  useEffect(() => {
    reset((prev) => ({ ...prev, resourceId, weekKey }));
  }, [resourceId, weekKey, reset]);

  // Load existing timesheet (from context or service) when selectors change
  useEffect(() => {
    if (!resourceId || !weekKey) return;
    // Try context map first
    const fromCtx = getTimesheet?.(resourceId, weekKey);
    if (fromCtx) {
      replace(Array.isArray(fromCtx) ? fromCtx : []);
      return;
    }
    // Fallback to service store (mock)
    (async () => {
      try {
        const all = await pulseService.timesheets.list();
        const existing = (all || []).find(
          (t) =>
            String(t.resourceId) === String(resourceId) &&
            String(t.weekKey) === String(weekKey)
        );
        replace(existing?.rows || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("TimesheetView: failed to load from service", e);
        replace([]);
      }
    })();
  }, [resourceId, weekKey, getTimesheet, replace]);

  // Totals
  const totalsByDay = useMemo(() => {
    const days = weekDays(weekKey);
    const t = Object.fromEntries(days.map((d) => [d, 0]));
    fields.forEach((r) => {
      t[r.date] = (t[r.date] || 0) + Number(r.hours || 0);
    });
    return t;
  }, [fields, weekKey]);
  const weeklyTotal = useMemo(
    () => fields.reduce((sum, r) => sum + Number(r.hours || 0), 0),
    [fields]
  );

  const onAddRow = useCallback(() => {
    const days = weekDays(weekKey);
    append({
      id: nanoid(10),
      date: days[0],
      engagementId: engagementOptions[0]?.id
        ? String(engagementOptions[0].id)
        : "",
      hours: 0,
      notes: "",
      billable: true,
    });
  }, [append, weekKey, engagementOptions]);

  const copyLastWeek = useCallback(async () => {
    if (!resourceId) return;
    try {
      const all = await pulseService.timesheets.list();
      // find the latest sheet before current week
      const prev = (all || [])
        .filter(
          (t) =>
            String(t.resourceId) === String(resourceId) && t.weekKey < weekKey
        )
        .sort((a, b) => (a.weekKey < b.weekKey ? 1 : -1))[0];
      if (!prev) {
        showAlert("No previous week found", "info");
        return;
      }
      const days = weekDays(weekKey);
      const prevDays = weekDays(prev.weekKey);
      const mapDay = new Map(prevDays.map((d, i) => [d, days[i]]));
      const copied = (prev.rows || []).map((r) => ({
        ...r,
        id: nanoid(10),
        date: mapDay.get(r.date) || days[0],
      }));
      replace(copied);
      showAlert("Copied last week", "success");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      showAlert("Failed to copy last week", "error");
    }
  }, [resourceId, weekKey, replace, showAlert]);

  const onSubmit = useCallback(
    async (values) => {
      const payload = {
        id: nanoid(10),
        resourceId: values.resourceId,
        weekKey: values.weekKey,
        status: "draft",
        rows: values.rows.map((r) => ({
          ...r,
          hours: Number(r.hours || 0),
          id: r.id || nanoid(10),
        })),
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      try {
        // check if existing
        const all = await pulseService.timesheets.list();
        const existing = (all || []).find(
          (t) =>
            String(t.resourceId) === String(payload.resourceId) &&
            String(t.weekKey) === String(payload.weekKey)
        );
        let saved;
        if (existing) {
          payload.id = existing.id;
          saved = await pulseService.timesheets.update(
            String(existing.id),
            payload
          );
        } else {
          saved = await pulseService.timesheets.create(payload);
        }
        // sync to context map for quick reads elsewhere
        setTimesheet?.(payload.resourceId, payload.weekKey, payload.rows);
        showAlert("Timesheet saved", "success");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to save timesheet", err);
        showAlert("Failed to save timesheet", "error");
      }
    },
    [setTimesheet, showAlert]
  );

  // UI helpers
  const days = useMemo(() => weekDays(weekKey), [weekKey]);

  return (
    <Stack spacing={2}>
      {/* Controls */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Timesheets</Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="resource-select-label">Resource</InputLabel>
            <Select
              labelId="resource-select-label"
              label="Resource"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
            >
              {resources.map((r) => (
                <MenuItem key={r.id} value={String(r.id)}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Week (Monday)"
            type="date"
            value={weekKey}
            onChange={(e) => setWeekKey(mondayOf(e.target.value))}
            InputLabelProps={{ shrink: true }}
          />

          <Button
            variant="outlined"
            onClick={copyLastWeek}
            disabled={!resourceId}
          >
            Copy last week
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={!resourceId}
          >
            Save
          </Button>
        </Stack>
      </Box>

      <Paper variant="outlined">
        <Box p={2}>
          <Typography variant="subtitle1" gutterBottom>
            Week starting {weekKey} • Total hours: {weeklyTotal}
          </Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Engagement</TableCell>
                <TableCell align="right">Hours</TableCell>
                <TableCell>Billable</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary">
                      No rows yet. Click “Add Row”.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((field, idx) => (
                  <TableRow key={field.id}>
                    <TableCell width={160}>
                      <Controller
                        name={`rows.${idx}.date`}
                        control={control}
                        render={({ field: f }) => (
                          <TextField
                            type="date"
                            size="small"
                            value={f.value || days[0]}
                            onChange={(e) => f.onChange(e.target.value)}
                            inputProps={{ min: days[0], max: days[6] }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell width={260}>
                      <Controller
                        name={`rows.${idx}.engagementId`}
                        control={control}
                        render={({ field: f }) => (
                          <FormControl fullWidth size="small">
                            <Select
                              value={f.value || ""}
                              onChange={(e) => f.onChange(e.target.value)}
                            >
                              {engagementOptions.map((e) => (
                                <MenuItem key={e.id} value={String(e.id)}>
                                  {e.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </TableCell>
                    <TableCell align="right" width={140}>
                      <Controller
                        name={`rows.${idx}.hours`}
                        control={control}
                        render={({ field: f }) => (
                          <TextField
                            type="number"
                            size="small"
                            inputProps={{ step: 0.25, min: 0, max: 24 }}
                            value={f.value ?? 0}
                            onChange={(e) => f.onChange(e.target.value)}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell width={100}>
                      <Controller
                        name={`rows.${idx}.billable`}
                        control={control}
                        render={({ field: f }) => (
                          <Checkbox
                            checked={!!f.value}
                            onChange={(e) => f.onChange(e.target.checked)}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`rows.${idx}.notes`}
                        control={control}
                        render={({ field: f }) => (
                          <TextField
                            size="small"
                            value={f.value || ""}
                            onChange={(e) => f.onChange(e.target.value)}
                            fullWidth
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell align="right" width={120}>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => remove(idx)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {/* Totals row */}
              {fields.length > 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="caption" color="text.secondary">
                      Daily totals:{" "}
                      {days
                        .map((d, i) => `${d}: ${totalsByDay[d] || 0}`)
                        .join("  ·  ")}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Box mt={2} display="flex" gap={1}>
            <Button
              variant="outlined"
              onClick={onAddRow}
              disabled={!resourceId}
            >
              Add Row
            </Button>
          </Box>
        </Box>
      </Paper>
    </Stack>
  );
}
