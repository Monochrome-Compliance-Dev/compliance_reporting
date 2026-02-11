import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import { nanoid } from "nanoid";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
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
  Checkbox,
} from "@mui/material";
import { usePulseContext, useAlert } from "context";
import { userService } from "services";
import { pulseService } from "../../../../services/pulse/pulse";

// ---- date helpers ----
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const toISO = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
};
const mondayOf = (dateISO) => {
  const d = dateISO ? fromISO(dateISO) : new Date();
  const day = d.getDay();
  const diff = (day + 6) % 7;
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

// --- Row Editor (isolated to avoid cross-row races) ---
function TimesheetRowEditor({
  idx,
  control,
  isLocked,
  days,
  engagementOptions,
  resourceLabel,
  onSaveRow,
}) {
  const hasEngOptions = (engagementOptions || []).length > 0;
  const engId = useWatch({ control, name: `rows.${idx}.engagementId` }) || "";
  const [options, setOptions] = useState([]);

  // Watch the full row for validity
  const rowValue = useWatch({ control, name: `rows.${idx}` }) || {};
  const hoursNum = Number(rowValue?.hours ?? 0);
  const hoursOk = !Number.isNaN(hoursNum) && hoursNum >= 0 && hoursNum <= 24;
  const rowValid =
    hasEngOptions &&
    !!rowValue?.engagementId &&
    !!rowValue?.budgetItemId &&
    hoursOk;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!engId) {
        if (!cancelled) setOptions([]);
        return;
      }
      try {
        let rows = [];

        // Try a query that includes resourceLabel (position) so the server filters for us
        if (pulseService?.budgetItems?.list) {
          const resQ = await pulseService.budgetItems.list({
            engagementId: String(engId),
            resourceLabel: resourceLabel ? String(resourceLabel) : undefined,
          });
          rows = Array.isArray(resQ)
            ? resQ
            : Array.isArray(resQ?.items)
              ? resQ.items
              : Array.isArray(resQ?.data)
                ? resQ.data
                : Array.isArray(resQ?.rows)
                  ? resQ.rows
                  : [];
        }

        // Fallback to listByEngagement if needed
        if (
          (!rows || rows.length === 0) &&
          pulseService?.budgetItems?.listByEngagement
        ) {
          const res1 = await pulseService.budgetItems.listByEngagement(
            String(engId)
          );
          const r1 = Array.isArray(res1)
            ? res1
            : Array.isArray(res1?.items)
              ? res1.items
              : Array.isArray(res1?.data)
                ? res1.data
                : Array.isArray(res1?.rows)
                  ? res1.rows
                  : [];
          if (r1.length) rows = r1;
        }

        // Last resort: find budget by engagement, then list items by budget
        if (
          (!rows || rows.length === 0) &&
          pulseService?.budgets?.list &&
          pulseService?.budgetItems?.list
        ) {
          const resB = await pulseService.budgets.list({
            engagementId: String(engId),
          });
          const budgets = Array.isArray(resB)
            ? resB
            : Array.isArray(resB?.items)
              ? resB.items
              : Array.isArray(resB?.data)
                ? resB.data
                : Array.isArray(resB?.rows)
                  ? resB.rows
                  : [];
          const b0 = budgets[0];
          if (b0?.id) {
            const res3 = await pulseService.budgetItems.list({
              budgetId: String(b0.id),
            });
            const r3 = Array.isArray(res3)
              ? res3
              : Array.isArray(res3?.items)
                ? res3.items
                : Array.isArray(res3?.data)
                  ? res3.data
                  : Array.isArray(res3?.rows)
                    ? res3.rows
                    : [];
            if (r3.length) rows = r3;
          }
        }

        // Client-side filter by resourceLabel (position), then de-duplicate by display label
        const filtered = (rows || []).filter((bi) => {
          if (!resourceLabel) return true; // if we don't know the position, show all
          if (!bi?.resourceLabel) return true; // allow items not tied to a specific label
          return String(bi.resourceLabel) === String(resourceLabel);
        });

        const toLabel = (bi) =>
          bi?.activity ||
          bi?.name ||
          bi?.sectionName ||
          bi?.resourceLabel ||
          bi?.code ||
          String(bi?.id || "");
        const seen = new Set();
        const deduped = [];
        for (const bi of filtered) {
          const label = toLabel(bi);
          const key = `${label}::${bi?.resourceLabel || "*"}`; // distinguish by label+resource
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(bi);
          }
        }

        if (!cancelled) setOptions(deduped);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Failed to load budget items for engagement", engId, e);
        if (!cancelled) setOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [engId, resourceLabel]);

  return (
    <TableRow>
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
              disabled={isLocked || !hasEngOptions}
            />
          )}
        />
      </TableCell>
      <TableCell width={260}>
        <Controller
          name={`rows.${idx}.engagementId`}
          control={control}
          render={({ field: f }) => (
            <TextField
              select
              SelectProps={{ native: true }}
              fullWidth
              size="small"
              value={f.value || ""}
              onChange={(e) => f.onChange(String(e.target.value))}
              disabled={isLocked || !hasEngOptions}
              error={!f.value}
              helperText={!f.value ? "Required" : ""}
            >
              <option value="" disabled>
                {hasEngOptions
                  ? "Select engagement"
                  : "No engagements assigned"}
              </option>
              {/** Engagement options are provided via form context defaults (see parent) */}
              {(engagementOptions || []).map((e) => (
                <option key={e.id} value={String(e.id)}>
                  {e.name}
                </option>
              ))}
            </TextField>
          )}
        />
      </TableCell>
      <TableCell width={260}>
        <Controller
          name={`rows.${idx}.budgetItemId`}
          control={control}
          render={({ field: f }) => {
            const current = String(f.value || "");
            const valid = (options || []).some(
              (bi) => String(bi.id) === current
            );
            const safeValue = valid ? current : "";
            const hasOptions = (options || []).length > 0;
            return (
              <>
                <TextField
                  select
                  SelectProps={{ native: true }}
                  fullWidth
                  size="small"
                  value={safeValue}
                  onChange={(e) => f.onChange(String(e.target.value))}
                  disabled={isLocked || !hasOptions}
                  key={engId}
                  error={hasOptions && !safeValue}
                  helperText={hasOptions ? (!safeValue ? "Required" : "") : ""}
                >
                  <option value="">
                    {hasOptions ? "Select budget item" : "No items"}
                  </option>
                  {(options || []).map((bi) => (
                    <option key={bi.id} value={String(bi.id)}>
                      {bi.activity ||
                        bi.name ||
                        bi.sectionName ||
                        bi.resourceLabel ||
                        bi.code ||
                        String(bi.id)}
                    </option>
                  ))}
                </TextField>
                {!hasOptions && engId ? (
                  <Box mt={0.5}>
                    <Button
                      component={Link}
                      to={`/pulse-solution/engagements/manage?id=${encodeURIComponent(engId)}`}
                      size="small"
                      variant="text"
                    >
                      + New budget item
                    </Button>
                  </Box>
                ) : null}
              </>
            );
          }}
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
              disabled={isLocked || !hasEngOptions}
              error={Number(f.value ?? 0) < 0 || Number(f.value ?? 0) > 24}
              helperText={
                Number(f.value ?? 0) < 0 || Number(f.value ?? 0) > 24
                  ? "0–24 only"
                  : ""
              }
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
              disabled={isLocked || !hasEngOptions}
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
              disabled={isLocked || !hasEngOptions}
            />
          )}
        />
      </TableCell>
      <TableCell align="right" width={160}>
        <Button
          size="small"
          variant="outlined"
          onClick={onSaveRow}
          disabled={isLocked || !rowValid}
        >
          Save row
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function TimesheetEditor() {
  const navigate = useNavigate();
  const { resources = [], engagements = [], setTimesheet } = usePulseContext();
  const { showAlert } = useAlert();
  const currentUser = userService.userValue;
  const currentUserId = currentUser?.id;
  const customerId = currentUser?.customerId;
  const currentRole = currentUser?.role;

  // infer resource from user
  const inferResourceId = useCallback(() => {
    if (!currentUser) return "";
    const byUserId = (resources || []).find(
      (r) => String(r.userId) === String(currentUser.id)
    );
    if (byUserId) return String(byUserId.id);
    const byEmail = (resources || []).find(
      (r) =>
        String(r.email || "").toLowerCase() ===
        String(currentUser.email || "").toLowerCase()
    );
    return byEmail ? String(byEmail.id) : "";
  }, [resources, currentUser]);

  const [resourceId, setResourceId] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (resourceId) return; // already resolved

      // 1) Try context inference first
      const inferred = inferResourceId();
      if (inferred) {
        if (alive) setResourceId(inferred);
        return;
      }

      // 2) Server fallback: find resource by current user
      try {
        if (currentUser?.id && pulseService?.resources?.list) {
          const res = await pulseService.resources.list({
            userId: currentUser.id,
            email: currentUser.email,
          });
          const rows = Array.isArray(res)
            ? res
            : Array.isArray(res?.items)
              ? res.items
              : Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res?.rows)
                  ? res.rows
                  : [];
          const r = rows[0];
          if (alive && r?.id) setResourceId(String(r.id));
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(
          "TimesheetEditor: failed to resolve resourceId from server",
          e
        );
      }
    })();
    return () => {
      alive = false;
    };
  }, [inferResourceId, resourceId, currentUser]);

  // Compute current resource and its position
  const currentResource = useMemo(
    () => (resources || []).find((r) => String(r.id) === String(resourceId)),
    [resources, resourceId]
  );
  const resourcePosition =
    currentResource?.position || currentResource?.role || "";

  const [weekKey, setWeekKey] = useState(mondayOf());
  const [status, setStatus] = useState("draft");
  const [headerId, setHeaderId] = useState("");
  const isLocked = status !== "draft";

  // RHF
  const { control, handleSubmit, reset, getValues } = useForm({
    resolver: yupResolver(sheetSchema),
    defaultValues: { resourceId: "", weekKey: mondayOf(), rows: [] },
    mode: "onBlur",
  });
  const { fields, append, replace } = useFieldArray({
    name: "rows",
    control,
    keyName: "key",
  });
  const rowsWatch = useWatch({ control, name: "rows" });
  const hasInvalidRow = useMemo(() => {
    const rows = Array.isArray(rowsWatch) ? rowsWatch : [];
    return rows.some((r) => {
      const hoursNum = Number(r?.hours);
      const hoursBad = Number.isNaN(hoursNum) || hoursNum < 0 || hoursNum > 24;
      return !r?.engagementId || !r?.budgetItemId || hoursBad;
    });
  }, [rowsWatch]);

  // keep form selectors synced
  useEffect(() => {
    reset((p) => ({ ...p, resourceId, weekKey }));
  }, [resourceId, weekKey, reset]);

  // load header + rows
  useEffect(() => {
    if (!resourceId || !weekKey) return;
    (async () => {
      try {
        const prevFirst = getValues("rows.0") || {};
        const prevEng = prevFirst.engagementId || "";
        const prevBudget = prevFirst.budgetItemId || "";
        const all = await pulseService.timesheets.list();
        const existing = (all || []).find(
          (t) =>
            String(t.resourceId) === String(resourceId) &&
            String(t.weekKey) === String(weekKey)
        );
        if (existing) {
          if (existing.status && String(existing.status) !== "draft") {
            navigate(`/pulse-solution/timesheets/view/${existing.id}`);
            return;
          }
          setHeaderId(String(existing.id));
          setStatus(existing.status || "draft");
          const rows = await pulseService.timesheets.rows.list(
            String(existing.id)
          );
          replace(Array.isArray(rows) ? rows : []);
          if (!rows || rows.length === 0) {
            append({
              id: nanoid(10),
              date: weekDays(weekKey)[0],
              engagementId: prevEng || "",
              budgetItemId: prevBudget || "",
              hours: 0,
              notes: "",
              billable: true,
            });
          }
        } else {
          setHeaderId("");
          setStatus("draft");
          replace([]);
          append({
            id: nanoid(10),
            date: weekDays(weekKey)[0],
            engagementId: prevEng || "",
            budgetItemId: prevBudget || "",
            hours: 0,
            notes: "",
            billable: true,
          });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("TimesheetEditor: load failed", e);
        setHeaderId("");
        setStatus("draft");
        replace([]);
      }
    })();
  }, [resourceId, weekKey, replace, append, navigate, getValues]);

  // compute totals
  const days = useMemo(() => weekDays(weekKey), [weekKey]);
  const weeklyTotal = useMemo(
    () => fields.reduce((sum, r) => sum + Number(r.hours || 0), 0),
    [fields]
  );

  // save whole sheet (idempotent)
  const onSubmit = useCallback(
    async (values) => {
      if (!currentUserId || !customerId) {
        showAlert("Missing user or customer context", "error");
        return;
      }
      try {
        // header
        const all = await pulseService.timesheets.list();
        const existing = (all || []).find(
          (t) =>
            String(t.resourceId) === String(values.resourceId) &&
            String(t.weekKey) === String(values.weekKey)
        );
        let id;
        if (existing) {
          const saved = await pulseService.timesheets.update(
            String(existing.id),
            {
              resourceId: values.resourceId,
              weekKey: values.weekKey,
              status: "draft",
              customerId,
              updatedBy: currentUserId,
            }
          );
          id = String(saved?.id || existing.id);
          setHeaderId(id);
          setStatus(saved?.status || existing.status || "draft");
        } else {
          const saved = await pulseService.timesheets.create({
            resourceId: values.resourceId,
            weekKey: values.weekKey,
            status: "draft",
            customerId,
            createdBy: currentUserId,
          });
          id = String(saved.id);
          setHeaderId(id);
          setStatus(saved.status || "draft");
        }

        // rows (clear + re-upsert for simplicity and consistency)
        const serverRows = await pulseService.timesheets.rows.list(id);
        for (const r of serverRows || []) {
          await pulseService.timesheets.rows.delete(String(r.id));
        }
        for (const r of values.rows || []) {
          await pulseService.timesheets.rows.create(id, {
            date: r.date,
            hours: Number(r.hours || 0),
            billable: !!r.billable,
            engagementId: r.engagementId,
            budgetItemId: r.budgetItemId,
            notes: (r.notes || "").trim() || undefined,
            customerId,
            createdBy: currentUserId,
          });
        }
        const fresh = await pulseService.timesheets.rows.list(id);
        replace(Array.isArray(fresh) ? fresh : []);
        setTimesheet?.(
          values.resourceId,
          values.weekKey,
          Array.isArray(fresh) ? fresh : []
        );
        showAlert("Timesheet saved", "success");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to save timesheet", e);
        showAlert("Failed to save timesheet", "error");
      }
    },
    [currentUserId, customerId, replace, setTimesheet, showAlert]
  );

  const engagementOptions = useMemo(() => {
    const all = engagements || [];
    if (!resourceId) return currentRole === "User" ? [] : all;

    if (currentRole === "User") {
      // 1) Direct field on engagement (simple model)
      const byDirect = all.filter(
        (e) => String(e.resourceId) === String(resourceId)
      );

      // 2) Nested assignments array on engagement (richer model)
      const byAssignment = all.filter(
        (e) =>
          Array.isArray(e.assignments) &&
          e.assignments.some((a) => String(a.resourceId) === String(resourceId))
      );

      // De-duplicate by id
      const merged = [...byDirect, ...byAssignment].filter(
        (e, i, arr) => arr.findIndex((x) => String(x.id) === String(e.id)) === i
      );

      // MVP guard: if nothing matched, fall back to all engagements so the UI isn't disabled
      return merged.length ? merged : all;
    }

    // Admin/Boss: see all
    return all;
  }, [engagements, resourceId, currentRole]);

  return (
    <Stack spacing={2}>
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
          <Typography variant="body2" color="text.secondary">
            Resource:{" "}
            {(() => {
              const r = (resources || []).find(
                (x) => String(x.id) === String(resourceId)
              );
              return r?.name || r?.email || resourceId || "(not linked)";
            })()}
          </Typography>
          <TextField
            size="small"
            label="Week (Monday)"
            type="date"
            value={weekKey}
            onChange={(e) => setWeekKey(mondayOf(e.target.value))}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={!resourceId || isLocked}
          >
            Save
          </Button>
          <Button
            variant="contained"
            disabled={
              !resourceId || isLocked || fields.length === 0 || hasInvalidRow
            }
            onClick={async () => {
              await handleSubmit(onSubmit)();
              if (!headerId) return;
              try {
                const saved = (await pulseService.timesheets.patch)
                  ? await pulseService.timesheets.patch(String(headerId), {
                      status: "submitted",
                      updatedBy: currentUserId,
                      customerId,
                      submittedBy: currentUserId,
                      submittedAt: new Date().toISOString(),
                    })
                  : await pulseService.timesheets.update(String(headerId), {
                      status: "submitted",
                      updatedBy: currentUserId,
                      customerId,
                      submittedBy: currentUserId,
                      submittedAt: new Date().toISOString(),
                    });
                setStatus(saved?.status || "submitted");
                showAlert("Submitted for approval", "success");
              } catch (e) {
                // eslint-disable-next-line no-console
                console.error("Failed to submit", e);
                showAlert("Failed to submit timesheet", "error");
              }
            }}
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
                fields.map((_, idx) => (
                  <TimesheetRowEditor
                    key={_.key}
                    idx={idx}
                    control={control}
                    isLocked={isLocked}
                    days={weekDays(weekKey)}
                    engagementOptions={engagementOptions}
                    resourceLabel={resourcePosition}
                    onSaveRow={() => handleSubmit(onSubmit)()}
                  />
                ))
              )}
              {fields.length > 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="caption" color="text.secondary">
                      Daily totals:{" "}
                      {weekDays(weekKey)
                        .map(
                          (d) =>
                            `${d}: ${fields.filter((r) => r.date === d).reduce((s, r) => s + Number(r.hours || 0), 0)}`
                        )
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
              onClick={() =>
                append({
                  id: nanoid(10),
                  date: weekDays(weekKey)[0],
                  engagementId: "",
                  budgetItemId: "",
                  hours: 0,
                  notes: "",
                  billable: true,
                })
              }
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
