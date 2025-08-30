import { useEffect, useMemo, useState, useCallback } from "react";
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
  Checkbox,
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

export default function TimesheetManage() {
  const { resources = [] } = usePulseContext();
  const { showAlert } = useAlert();
  const currentUserId = userService.userValue?.id;
  const customerId = userService.userValue?.customerId;

  const [week, setWeek] = useState(mondayOf());
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());

  const resourceById = useMemo(
    () => Object.fromEntries((resources || []).map((r) => [String(r.id), r])),
    [resources]
  );

  const load = useCallback(async () => {
    try {
      const all = await pulseService.timesheets.list();
      // TODO: later restrict to only resources where resource.managerUserId === currentUserId
      const filtered = (all || []).filter((t) => {
        const wk = String(t.weekKey) === String(week);
        const st =
          status === "all" ? true : String(t.status || "draft") === status;
        return wk && st;
      });
      setRows(filtered);
      setSelected(new Set());
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("TimesheetManage: load failed", e);
      showAlert("Failed to load timesheets", "error");
    }
  }, [week, status, showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkUpdate = async (nextStatus) => {
    if (!currentUserId || !customerId) {
      showAlert("Missing user or customer context", "error");
      return;
    }
    try {
      for (const id of selected) {
        const base = { updatedBy: currentUserId, customerId };
        let extra = {};
        if (nextStatus === "approved") {
          extra = {
            approvedBy: currentUserId,
            approvedAt: new Date().toISOString(),
          };
        } else if (nextStatus === "rejected") {
          extra = {
            rejectedBy: currentUserId,
            rejectedAt: new Date().toISOString(),
          };
        } else if (nextStatus === "submitted") {
          extra = {
            submittedBy: currentUserId,
            submittedAt: new Date().toISOString(),
          };
        }
        const body = { status: nextStatus, ...base, ...extra };

        if (typeof pulseService.timesheets.patch === "function") {
          await pulseService.timesheets.patch(String(id), body);
        } else {
          await pulseService.timesheets.update(String(id), body);
        }
      }
      showAlert(`Updated ${selected.size} timesheet(s)`, "success");
      await load();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("TimesheetManage: bulkUpdate failed", e);
      showAlert("Failed to update selection", "error");
    }
  };

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">
          Manage Timesheets
          <Typography variant="body2" color="text.secondary">
            Showing all timesheets for this customer (tenant-wide)
          </Typography>
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            size="small"
            label="Week (Monday)"
            type="date"
            value={week}
            onChange={(e) => setWeek(mondayOf(e.target.value))}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={() => bulkUpdate("approved")}
            disabled={selected.size === 0}
          >
            Approve
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={() => bulkUpdate("rejected")}
            disabled={selected.size === 0}
          >
            Reject
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => bulkUpdate("draft")}
            disabled={selected.size === 0}
          >
            Revert to Draft
          </Button>
        </Stack>
      </Box>

      <Paper variant="outlined">
        <Box p={2}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={40}></TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Week</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary">
                      No timesheets found for the selected filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(String(t.id))}
                        onChange={() => toggle(String(t.id))}
                      />
                    </TableCell>
                    <TableCell>
                      {resourceById[String(t.resourceId)]?.name || t.resourceId}
                    </TableCell>
                    <TableCell>{t.weekKey}</TableCell>
                    <TableCell>
                      <Chip size="small" label={t.status || "draft"} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  );
}
