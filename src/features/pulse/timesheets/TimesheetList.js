import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { usePulseContext, useAlert } from "../../../context";
import { userService } from "../../../services";
import { pulseService } from "../../../services/pulse/pulse";

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
const plusDays = (iso, days) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
};

export default function TimesheetList() {
  const navigate = useNavigate();
  const { resources = [] } = usePulseContext();
  const { showAlert } = useAlert();

  const currentUser = userService.userValue;
  const customerId = currentUser?.customerId;

  // Try to infer the user's resource
  const resourceById = useMemo(
    () => Object.fromEntries((resources || []).map((r) => [String(r.id), r])),
    [resources]
  );

  const inferResourceId = useCallback(() => {
    if (!currentUser) return "";
    // Prefer explicit mapping if present
    const byUserId = (resources || []).find(
      (r) => String(r.userId) === String(currentUser.id)
    );
    if (byUserId) return String(byUserId.id);
    // Fallback: email match
    const byEmail = (resources || []).find(
      (r) =>
        String(r.email || "").toLowerCase() ===
        String(currentUser.email || "").toLowerCase()
    );
    if (byEmail) return String(byEmail.id);
    // Last resort: first resource
    return resources && resources[0] ? String(resources[0].id) : "";
  }, [resources, currentUser]);

  const [resourceId, setResourceId] = useState("");
  const [week, setWeek] = useState(mondayOf());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initial selection
  useEffect(() => {
    if (!resourceId) {
      const inferred = inferResourceId();
      setResourceId(inferred);
    }
  }, [inferResourceId, resourceId]);

  const load = useCallback(async () => {
    if (!resourceId) return;
    setLoading(true);
    try {
      const all = await pulseService.timesheets.list();
      const mine = (all || []).filter(
        (t) => String(t.resourceId) === String(resourceId)
      );
      // Sort newest first (by weekKey desc)
      mine.sort((a, b) =>
        a.weekKey < b.weekKey ? 1 : a.weekKey > b.weekKey ? -1 : 0
      );
      setRows(mine);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("TimesheetList: load failed", e);
      showAlert("Failed to load timesheets", "error");
    } finally {
      setLoading(false);
    }
  }, [resourceId, showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  const openReadOnly = (id) => navigate(`/pulse/timesheets/${id}`);
  const openEditor = () => navigate(`/pulse/timesheets/edit`);

  const ensureThisWeek = useCallback(async () => {
    if (!customerId || !resourceId) {
      showAlert("Missing user or customer context", "error");
      return;
    }
    try {
      const all = await pulseService.timesheets.list();
      const exists = (all || []).find(
        (t) =>
          String(t.resourceId) === String(resourceId) &&
          String(t.weekKey) === String(week)
      );
      if (exists) {
        showAlert("This week's timesheet already exists", "info");
        return String(exists.id);
      }
      const created = await pulseService.timesheets.create({
        resourceId,
        weekKey: week,
        status: "draft",
        customerId,
        createdBy: currentUser?.id,
      });
      showAlert("Created this week's timesheet", "success");
      await load();
      return String(created?.id);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("TimesheetList: ensureThisWeek failed", e);
      showAlert("Failed to create timesheet", "error");
      return "";
    }
  }, [customerId, resourceId, week, currentUser, load, showAlert]);

  const copyLastWeek = useCallback(async () => {
    if (!customerId || !resourceId) {
      showAlert("Missing user or customer context", "error");
      return;
    }
    try {
      const all = await pulseService.timesheets.list();
      const mine = (all || []).filter(
        (t) => String(t.resourceId) === String(resourceId)
      );
      if (mine.length === 0) {
        showAlert("No prior timesheets to copy from", "info");
        return;
      }
      // find latest prior week < current week
      const prior = [...mine]
        .filter((t) => String(t.weekKey) < String(week))
        .sort((a, b) => (a.weekKey < b.weekKey ? 1 : -1))[0];
      if (!prior) {
        showAlert("No prior week to copy", "info");
        return;
      }
      // Ensure target exists
      const targetId = await ensureThisWeek();
      if (!targetId) return;
      // Fetch rows from prior, shift dates +7 days, create in target
      const priorRows = await pulseService.timesheets.rows.list(
        String(prior.id)
      );
      for (const r of priorRows || []) {
        await pulseService.timesheets.rows.create(String(targetId), {
          date: plusDays(r.date, 7),
          hours: Number(r.hours || 0),
          billable: !!r.billable,
          engagementId: r.engagementId || undefined,
          budgetItemId: r.budgetItemId || undefined,
          notes: r.notes || undefined,
          customerId,
          createdBy: currentUser?.id,
        });
      }
      showAlert("Copied last week into this week", "success");
      await load();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("TimesheetList: copyLastWeek failed", e);
      showAlert("Failed to copy last week", "error");
    }
  }, [
    customerId,
    resourceId,
    week,
    currentUser,
    ensureThisWeek,
    load,
    showAlert,
  ]);

  const submit = useCallback(
    async (id) => {
      if (!customerId || !currentUser?.id) {
        showAlert("Missing user or customer context", "error");
        return;
      }
      try {
        const payload = {
          status: "submitted",
          updatedBy: currentUser.id,
          customerId,
          submittedBy: currentUser.id,
          submittedAt: new Date().toISOString(),
        };

        if (typeof pulseService.timesheets.patch === "function") {
          await pulseService.timesheets.patch(String(id), payload);
        } else {
          await pulseService.timesheets.update(String(id), payload);
        }
        showAlert("Submitted for approval", "success");
        await load();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("TimesheetList: submit failed", e);
        showAlert("Failed to submit timesheet", "error");
      }
    },
    [customerId, currentUser, load, showAlert]
  );

  const thisWeekId = useMemo(
    () => rows.find((t) => String(t.weekKey) === String(week))?.id,
    [rows, week]
  );

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">My Timesheets</Typography>
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
              {(resources || []).map((r) => (
                <MenuItem key={r.id} value={String(r.id)}>
                  {r.name || r.email || r.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Week (Monday)"
            type="date"
            value={week}
            onChange={(e) => setWeek(mondayOf(e.target.value))}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="outlined"
            onClick={copyLastWeek}
            disabled={!resourceId || loading}
          >
            Copy last week
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              const id = await ensureThisWeek();
              if (id) openEditor();
            }}
            disabled={!resourceId || loading}
          >
            Create this week
          </Button>
        </Stack>
      </Box>

      <Paper variant="outlined">
        <Box p={2}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Week</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography color="text.secondary">
                      No timesheets yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((t) => (
                  <TableRow
                    key={t.id}
                    selected={String(t.weekKey) === String(week)}
                  >
                    <TableCell>{t.weekKey}</TableCell>
                    <TableCell>
                      <Chip size="small" label={t.status || "draft"} />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Button size="small" onClick={() => openReadOnly(t.id)}>
                          Open
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={openEditor}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={t.status !== "draft"}
                          onClick={() => submit(t.id)}
                        >
                          Submit
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {thisWeekId ? (
        <Typography variant="body2" color="text.secondary">
          This week's timesheet exists. Use <strong>Edit</strong> to capture
          time, or <strong>Open</strong> to view.
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No timesheet for this week. Click <strong>Create this week</strong> to
          start.
        </Typography>
      )}
    </Stack>
  );
}
