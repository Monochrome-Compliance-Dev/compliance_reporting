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
import { usePulseContext, useAlert } from "../../../context";
import { userService } from "../../../services";
import { pulseService } from "../../../services/pulse/pulse";

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
  budgetItemId: yup.string().required("Budget item required"),
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

export default function TimesheetEditor() {
  const {
    resources = [],
    engagements = [],
    setTimesheet,
    getTimesheet,
  } = usePulseContext();
  const { showAlert } = useAlert();
  const currentUserId = userService.userValue?.id;
  const customerId = userService.userValue?.customerId;

  // top controls
  const [resourceId, setResourceId] = useState("");
  const [weekKey, setWeekKey] = useState(mondayOf());
  const [status, setStatus] = useState("draft");
  const [headerId, setHeaderId] = useState("");
  const isLocked = status !== "draft";

  // derive engagement options (MVP: all engagements; later filter by resource)
  const engagementOptions = useMemo(() => engagements || [], [engagements]);

  const [budgetOptionsByEng, setBudgetOptionsByEng] = useState(new Map());
  const loadBudgetItems = useCallback(
    async (engagementId) => {
      if (!engagementId) return [];
      if (budgetOptionsByEng.has(engagementId))
        return budgetOptionsByEng.get(engagementId);
      const items =
        await pulseService.budgetItems.listByEngagement(engagementId);
      setBudgetOptionsByEng((prev) => {
        const next = new Map(prev);
        next.set(engagementId, Array.isArray(items) ? items : []);
        return next;
      });
      return Array.isArray(items) ? items : [];
    },
    [budgetOptionsByEng]
  );

  // RHF setup
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState,
  } = useForm({
    resolver: yupResolver(sheetSchema),
    defaultValues: { resourceId: "", weekKey: mondayOf(), rows: [] },
    mode: "onBlur",
  });
  const { fields, append, remove, replace } = useFieldArray({
    name: "rows",
    control,
    keyName: "key", // prevent collision with our business `id`
  });
  const { errors, isSubmitting, dirtyFields } = formState;
  const isRowDirty = useCallback(
    (idx) => {
      const d = dirtyFields?.rows?.[idx];
      if (!d) return false;
      return Object.values(d).some(Boolean);
    },
    [dirtyFields]
  );

  const onSaveRow = useCallback(
    async (idx) => {
      if (!currentUserId || !customerId) {
        showAlert("Missing user or customer context", "error");
        return;
      }

      // Ensure header exists and get its id
      const all = await pulseService.timesheets.list();
      const existing = (all || []).find(
        (t) =>
          String(t.resourceId) === String(resourceId) &&
          String(t.weekKey) === String(weekKey)
      );
      if (!existing) {
        showAlert("Save the timesheet first", "warning");
        return;
      }
      const headerId = String(existing.id);

      const row = getValues(`rows.${idx}`);
      if (!row?.id) {
        showAlert(
          "This row hasn't been created yet. Use Save to create the timesheet first.",
          "warning"
        );
        return;
      }

      const d = dirtyFields?.rows?.[idx] || {};
      const payload = { customerId, updatedBy: currentUserId }; // always include updatedBy
      if (d.date) payload.date = row.date;
      if (d.engagementId) payload.engagementId = row.engagementId;
      if (d.budgetItemId) payload.budgetItemId = row.budgetItemId;
      if (d.hours) payload.hours = Number(row.hours || 0);
      if (d.billable) payload.billable = !!row.billable;
      if (d.notes && typeof row.notes === "string" && row.notes.trim()) {
        payload.notes = row.notes.trim();
      }

      // No-op guard: only updatedBy/customerId present means nothing else changed
      if (Object.keys(payload).length <= 2) {
        showAlert("No changes to save", "info");
        return;
      }

      try {
        await pulseService.timesheets.rows.patch(String(row.id), payload);
        const freshRows = await pulseService.timesheets.rows.list(headerId);
        const newRows = Array.isArray(freshRows) ? freshRows : [];
        replace(newRows);
        setTimesheet?.(resourceId, weekKey, newRows);
        // Reset form defaults to the freshly saved values so dirty state clears
        const current = getValues();
        reset({ ...current, rows: newRows });
        showAlert("Row saved", "success");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to save row", err);
        showAlert("Failed to save row", "error");
      }
    },
    [
      currentUserId,
      customerId,
      resourceId,
      weekKey,
      getValues,
      dirtyFields,
      replace,
      setTimesheet,
      showAlert,
      reset,
    ]
  );

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
      setHeaderId("");
      setStatus("draft");
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
        if (existing) {
          setHeaderId(String(existing.id));
          setStatus(existing.status || "draft");
          const rows = await pulseService.timesheets.rows.list(
            String(existing.id)
          );
          replace(Array.isArray(rows) ? rows : []);
          // Preload budget items and sanitise budgetItemId values against available options
          const toSanitize = Array.isArray(rows) ? rows : [];
          Promise.all(
            toSanitize.map(async (r, i) => {
              if (!r?.engagementId) return null;
              const opts = await loadBudgetItems(String(r.engagementId));
              const has = (opts || []).some(
                (bi) => String(bi.id) === String(r.budgetItemId)
              );
              if (!has) {
                setValue(`rows.${i}.budgetItemId`, "", {
                  shouldValidate: false,
                  shouldDirty: false,
                });
              }
              return null;
            })
          ).catch(() => {});
        } else {
          setHeaderId("");
          setStatus("draft");
          replace([]);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("TimesheetEditor: failed to load from service", e);
        setHeaderId("");
        setStatus("draft");
        replace([]);
      }
    })();
  }, [resourceId, weekKey, getTimesheet, replace, loadBudgetItems, setValue]);

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
      budgetItemId: "",
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
      // Ensure we have the identifiers required by the server-side validator
      if (!currentUserId || !customerId) {
        showAlert("Missing user or customer context", "error");
        return;
      }

      // Shape the body per Joi schemas:
      const base = {
        resourceId: values.resourceId, // string(10)
        weekKey: values.weekKey, // DATE-only compatible
        status: "draft", // required by schema
        customerId, // required by schema
        rows: values.rows.map((r) => ({
          ...r,
          hours: Number(r.hours || 0),
          id: r.id || nanoid(10),
        })),
      };

      try {
        // check if existing sheet for this resource+week
        const all = await pulseService.timesheets.list();
        const existing = (all || []).find(
          (t) =>
            String(t.resourceId) === String(values.resourceId) &&
            String(t.weekKey) === String(values.weekKey)
        );

        // Save header (create or update) and capture the header id
        let headerId;
        let savedHeader;
        if (existing) {
          const updateBody = { ...base, updatedBy: currentUserId };
          savedHeader = await pulseService.timesheets.update(
            String(existing.id),
            updateBody
          );
          headerId = String(savedHeader?.id || existing.id);
          setHeaderId(headerId);
          setStatus(savedHeader?.status || existing.status || "draft");
        } else {
          const createBody = {
            ...base,
            createdBy: currentUserId,
          };
          savedHeader = await pulseService.timesheets.create(createBody);
          headerId = String(savedHeader?.id);
          setHeaderId(headerId);
          setStatus(savedHeader?.status || "draft");
        }

        // --- Synchronise rows with backend ---
        // Fetch current server rows for this header
        const serverRows = await pulseService.timesheets.rows.list(headerId);
        const serverById = new Map(
          (serverRows || []).map((r) => [String(r.id), r])
        );
        const clientRows = base.rows || [];
        const clientIds = new Set(clientRows.map((r) => String(r.id || "")));

        // Upsert current client rows
        for (const r of clientRows) {
          const rowPayload = {
            date: r.date,
            hours: Number(r.hours || 0),
            billable: !!r.billable,
            customerId,
          };
          if (r.engagementId) rowPayload.engagementId = r.engagementId;
          if (r.budgetItemId) rowPayload.budgetItemId = r.budgetItemId;
          if (typeof r.notes === "string" && r.notes.trim().length > 0) {
            rowPayload.notes = r.notes.trim();
          }
          if (r.id && serverById.has(String(r.id))) {
            // Update existing row
            await pulseService.timesheets.rows.update(String(r.id), {
              ...rowPayload,
              updatedBy: currentUserId,
            });
          } else {
            // Create new row (server will assign id)
            await pulseService.timesheets.rows.create(headerId, {
              ...rowPayload,
              createdBy: currentUserId,
            });
          }
        }

        // Delete server rows that the client removed
        for (const [rowId] of serverById) {
          if (!clientIds.has(String(rowId))) {
            await pulseService.timesheets.rows.delete(String(rowId));
          }
        }

        // Pull fresh rows from server to sync local state with canonical ids
        const freshRows = await pulseService.timesheets.rows.list(headerId);
        replace(Array.isArray(freshRows) ? freshRows : []);
        setTimesheet?.(
          values.resourceId,
          values.weekKey,
          Array.isArray(freshRows) ? freshRows : []
        );
        showAlert("Timesheet saved", "success");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to save timesheet", err);
        showAlert("Failed to save timesheet", "error");
      }
    },
    [setTimesheet, showAlert, currentUserId, customerId, replace]
  );

  const submitForApproval = useCallback(async () => {
    if (!currentUserId || !customerId) {
      showAlert("Missing user or customer context", "error");
      return;
    }
    try {
      let id = headerId;
      if (!id) {
        const all = await pulseService.timesheets.list();
        const existing = (all || []).find(
          (t) =>
            String(t.resourceId) === String(resourceId) &&
            String(t.weekKey) === String(weekKey)
        );
        if (!existing) {
          showAlert("Save the timesheet before submitting", "warning");
          return;
        }
        id = String(existing.id);
        setHeaderId(id);
      }
      let saved;
      const payload = {
        status: "submitted",
        updatedBy: currentUserId,
        customerId,
        submittedBy: currentUserId,
        submittedAt: new Date().toISOString(),
      };

      if (typeof pulseService.timesheets.patch === "function") {
        saved = await pulseService.timesheets.patch(String(id), payload);
      } else {
        saved = await pulseService.timesheets.update(String(id), payload);
      }
      setStatus(saved?.status || "submitted");
      showAlert("Submitted for approval", "success");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to submit timesheet", e);
      showAlert("Failed to submit timesheet", "error");
    }
  }, [currentUserId, customerId, headerId, resourceId, weekKey, showAlert]);

  // UI helpers
  const days = useMemo(() => weekDays(weekKey), [weekKey]);

  // Disable Submit for approval if any row is invalid
  const hasInvalidRow = fields.some((r, i) => {
    const v = getValues(`rows.${i}`);
    return (
      !v?.engagementId || !v?.budgetItemId || Number.isNaN(Number(v?.hours))
    );
  });

  return (
    <Stack spacing={2}>
      {/* Controls */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h5">Timesheet Editor</Typography>
          <Typography variant="body2" color="text.secondary">
            Status: {status}
          </Typography>
        </Box>
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
            disabled={!resourceId || isLocked}
          >
            Copy last week
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={!resourceId || isLocked}
          >
            Save
          </Button>
          <Button
            variant="contained"
            onClick={submitForApproval}
            disabled={
              !resourceId || isLocked || fields.length === 0 || hasInvalidRow
            }
          >
            Submit for approval
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
                <TableCell>Budget Item</TableCell>
                <TableCell align="right">Hours</TableCell>
                <TableCell>Billable</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary">
                      No rows yet. Click “Add Row”.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((field, idx) => (
                  <TableRow key={field.key}>
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
                            disabled={isLocked}
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
                              onChange={async (e) => {
                                const newEngId = e.target.value;
                                f.onChange(newEngId);
                                const items = await loadBudgetItems(newEngId);
                                const first =
                                  items && items[0] ? String(items[0].id) : "";
                                const existingBudget = String(
                                  getValues(`rows.${idx}.budgetItemId`) || ""
                                );
                                const nextBudgetId = (items || []).some(
                                  (it) => String(it.id) === existingBudget
                                )
                                  ? existingBudget
                                  : first;
                                setValue(
                                  `rows.${idx}.budgetItemId`,
                                  nextBudgetId,
                                  { shouldDirty: true, shouldValidate: true }
                                );
                              }}
                              disabled={isLocked}
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
                    <TableCell width={260}>
                      {(() => {
                        const engId = watch(`rows.${idx}.engagementId`);
                        const options = budgetOptionsByEng.get(engId) || [];
                        return (
                          <Controller
                            name={`rows.${idx}.budgetItemId`}
                            control={control}
                            render={({ field: f }) => {
                              const current = String(f.value || "");
                              const valid = (options || []).some(
                                (bi) => String(bi.id) === current
                              );
                              const safeValue = valid ? current : "";
                              return (
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={safeValue}
                                    onOpen={() => loadBudgetItems(engId)}
                                    onChange={(e) => f.onChange(e.target.value)}
                                    displayEmpty
                                    disabled={
                                      isLocked || (options || []).length === 0
                                    }
                                    renderValue={(val) =>
                                      val ? undefined : "Select budget item"
                                    }
                                  >
                                    <MenuItem value="" disabled>
                                      Select budget item
                                    </MenuItem>
                                    {(options || []).map((bi) => (
                                      <MenuItem
                                        key={bi.id}
                                        value={String(bi.id)}
                                      >
                                        {bi.activity ||
                                          bi.code ||
                                          String(bi.id)}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              );
                            }}
                          />
                        );
                      })()}
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
                            disabled={isLocked}
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
                            disabled={isLocked}
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
                            disabled={isLocked}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell align="right" width={160}>
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onSaveRow(idx)}
                          disabled={!isRowDirty(idx) || isLocked}
                        >
                          Save
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => remove(idx)}
                          disabled={isLocked}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {/* Totals row */}
              {fields.length > 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
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
              disabled={!resourceId || isLocked}
            >
              Add Row
            </Button>
          </Box>
        </Box>
      </Paper>
    </Stack>
  );
}
