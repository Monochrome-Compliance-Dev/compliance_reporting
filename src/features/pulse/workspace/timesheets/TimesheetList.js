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
} from "@mui/material";
import { usePulseContext, useAlert } from "../../../../context";
import { userService } from "../../../../services";
import { pulseService } from "../../../../services/pulse/pulse";

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

export default function TimesheetList() {
  const navigate = useNavigate();
  const { resources = [] } = usePulseContext();
  const { showAlert } = useAlert();

  const currentUser = userService.userValue;
  const customerId = currentUser?.customerId;

  const [loading, setLoading] = useState(false);
  const [timesheets, setTimesheets] = useState([]);
  const [totals, setTotals] = useState({}); // id -> total hours

  const resourceByUserId = useMemo(
    () =>
      Object.fromEntries((resources || []).map((r) => [String(r.userId), r])),
    [resources]
  );

  const myResourceId = useMemo(() => {
    if (!currentUser) return "";
    const byId = (resources || []).find(
      (r) => String(r.userId) === String(currentUser.id)
    );
    if (byId) return String(byId.id);
    const byEmail = (resources || []).find(
      (r) =>
        String(r.email || "").toLowerCase() ===
        String(currentUser.email || "").toLowerCase()
    );
    return byEmail ? String(byEmail.id) : "";
  }, [resources, currentUser]);

  const load = useCallback(async () => {
    if (!customerId || !myResourceId) return;
    setLoading(true);
    try {
      const all = await pulseService.timesheets.list();
      const mine = (all || []).filter(
        (t) => String(t.resourceId) === String(myResourceId)
      );
      // Sort by weekKey desc
      mine.sort((a, b) => (String(a.weekKey) < String(b.weekKey) ? 1 : -1));
      setTimesheets(mine);

      // Fetch totals for each sheet (sum hours)
      const entries = await Promise.all(
        mine.map(async (t) => {
          const rows = await pulseService.timesheets.rows.list(String(t.id));
          const total = (rows || []).reduce(
            (acc, r) => acc + Number(r.hours || 0),
            0
          );
          return [String(t.id), total];
        })
      );
      setTotals(Object.fromEntries(entries));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("TimesheetList: load failed", e);
      showAlert("Failed to load timesheets", "error");
    } finally {
      setLoading(false);
    }
  }, [customerId, myResourceId, showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  const openCurrentWeek = useCallback(async () => {
    if (!customerId || !myResourceId) return;
    const thisWeek = mondayOf();
    try {
      // Check for existing sheet
      const existing = (timesheets || []).find(
        (t) => String(t.weekKey) === String(thisWeek)
      );
      if (existing) {
        navigate(`/pulse-solution/timesheets/${existing.id}`);
        return;
      }
      // Create and navigate to editor
      const created = await pulseService.timesheets.create({
        resourceId: myResourceId,
        weekKey: thisWeek,
        status: "draft",
        customerId,
        createdBy: currentUser?.id,
      });
      showAlert("Created this week's timesheet", "success");
      navigate(`/pulse-solution/timesheets/${created.id}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("openCurrentWeek failed", e);
      showAlert("Could not open current week", "error");
    }
  }, [customerId, myResourceId, currentUser, timesheets, navigate, showAlert]);

  const recall = useCallback(
    async (t) => {
      try {
        await pulseService.timesheets.update(String(t.id), {
          status: "draft",
          customerId,
          updatedBy: currentUser?.id,
        });
        showAlert("Timesheet recalled to draft", "success");
        navigate(`/pulse-solution/timesheets/${t.id}`);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Recall failed", e);
        showAlert("Failed to recall timesheet", "error");
      }
    },
    [customerId, currentUser, navigate, showAlert]
  );

  const statusColor = (s) => {
    switch (s) {
      case "approved":
        return "success";
      case "submitted":
        return "warning";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const resourceLabel = useMemo(() => {
    const r = resourceByUserId[String(currentUser?.id)] || null;
    return r?.name || r?.email || "";
  }, [resourceByUserId, currentUser]);

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h6">My Timesheets</Typography>
          <Typography variant="body2" color="text.secondary">
            Resource: {resourceLabel || "(not linked)"}
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            size="small"
            type="date"
            label="Week (Monday)"
            value={mondayOf()}
            InputLabelProps={{ shrink: true }}
            disabled
          />
          <Button
            variant="contained"
            onClick={openCurrentWeek}
            disabled={loading || !myResourceId}
          >
            Open current week
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
                <TableCell align="right">Total Hours</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(timesheets || []).map((t) => {
                const total = totals[String(t.id)] ?? 0;
                const canRecall =
                  t.status === "submitted" || t.status === "rejected";
                return (
                  <TableRow key={t.id} hover>
                    <TableCell>{t.weekKey}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t.status}
                        color={statusColor(t.status)}
                      />
                    </TableCell>
                    <TableCell align="right">{total.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      {t.status === "draft" ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            navigate(`/pulse-solution/timesheets/${t.id}`)
                          }
                        >
                          Edit
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            navigate(`/pulse-solution/timesheets/view/${t.id}`)
                          }
                        >
                          View
                        </Button>
                      )}
                      {canRecall && (
                        <Button
                          size="small"
                          sx={{ ml: 1 }}
                          onClick={() => recall(t)}
                        >
                          Recall
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  );
}
