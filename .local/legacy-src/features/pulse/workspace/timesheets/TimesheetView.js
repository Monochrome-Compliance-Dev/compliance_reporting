import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
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
} from "@mui/material";
import { usePulseContext } from "../../../../context/PulseContext";
import { useAlert } from "../../../../context";
import { pulseService } from "../../../../services/pulse/pulse";
import { userService } from "../../../../services";

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
  const day = d.getDay(); // 0..6 (Sun..Sat)
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

export default function TimesheetView() {
  const { resources = [], engagements = [] } = usePulseContext();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  // Params come as /pulse/timesheets/:timesheetId only
  const { timesheetId: idFromPath } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState(null);

  const resourceById = useMemo(
    () => Object.fromEntries((resources || []).map((r) => [String(r.id), r])),
    [resources]
  );
  const engagementById = useMemo(
    () => Object.fromEntries((engagements || []).map((e) => [String(e.id), e])),
    [engagements]
  );

  const currentUser = userService.userValue;
  const canRecall =
    sheet && (sheet.status === "submitted" || sheet.status === "rejected");

  const handleRecall = async () => {
    try {
      await pulseService.timesheets.update(String(sheet.id), {
        status: "draft",
        customerId: currentUser?.customerId,
        updatedBy: currentUser?.id,
      });
      showAlert("Timesheet recalled to draft", "success");
      navigate(`/pulse-solution/timesheets/${sheet.id}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to recall timesheet", e);
      showAlert("Failed to recall timesheet", "error");
    }
  };

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        let found = null;
        // Preferred lookup by explicit timesheet id
        const timesheetId = idFromPath;
        if (timesheetId) {
          found = await pulseService.timesheets.getById(String(timesheetId));
        }

        if (!mounted) return;

        if (!found) {
          setError("Timesheet not found");
          setSheet(null);
        } else {
          setSheet(found);
        }
      } catch (e) {
        if (!mounted) return;
        // eslint-disable-next-line no-console
        console.error(e);
        setError("Failed to load timesheet");
        setSheet(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [idFromPath]);

  // Derived UI bits
  const resource = sheet ? resourceById[String(sheet.resourceId)] : null;
  const days = useMemo(() => (sheet ? weekDays(sheet.weekKey) : []), [sheet]);
  const totalsByDay = useMemo(() => {
    const t = Object.fromEntries(days.map((d) => [d, 0]));
    (sheet?.rows || []).forEach((r) => {
      t[r.date] = (t[r.date] || 0) + Number(r.hours || 0);
    });
    return t;
  }, [days, sheet]);
  const weeklyTotal = useMemo(
    () => (sheet?.rows || []).reduce((sum, r) => sum + Number(r.hours || 0), 0),
    [sheet]
  );

  useEffect(() => {
    if (error) showAlert(error, "error");
  }, [error, showAlert]);

  if (loading) {
    return (
      <Paper variant="outlined">
        <Box p={2}>
          <Typography>Loading timesheet…</Typography>
        </Box>
      </Paper>
    );
  }

  if (!sheet) {
    return (
      <Paper variant="outlined">
        <Box p={2}>
          <Typography variant="h6">Timesheet</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Not found. Double‑check the link or go back to Timesheets.
          </Typography>
          <Box mt={2}>
            <Button onClick={() => navigate(-1)}>Go back</Button>
          </Box>
        </Box>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined">
        <Box
          p={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h6">Timesheet</Typography>
            <Typography variant="body2" color="text.secondary">
              Resource: {resource?.name || sheet.resourceId} • Week starting{" "}
              {sheet.weekKey}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={sheet.status || "draft"} size="small" />
            <Typography variant="body2" color="text.secondary">
              Total: {weeklyTotal} hrs
            </Typography>
            {canRecall && (
              <Button size="small" variant="outlined" onClick={handleRecall}>
                Recall to Draft
              </Button>
            )}
          </Stack>
        </Box>
      </Paper>

      <Paper variant="outlined">
        <Box p={2}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Engagement</TableCell>
                <TableCell>Budget item</TableCell>
                <TableCell align="right">Hours</TableCell>
                <TableCell>Billable</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(sheet.rows || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary">No entries.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (sheet.rows || []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{String(r.engagementId || "")} </TableCell>
                    <TableCell>
                      {(() => {
                        const eng = engagementById[String(r.engagementId)];
                        const items = Array.isArray(eng?.budgetItems)
                          ? eng.budgetItems
                          : [];
                        const found = items.find(
                          (it) => String(it.id) === String(r.budgetItemId)
                        );
                        return (
                          <Typography
                            variant="body2"
                            color={found ? "inherit" : "text.secondary"}
                          >
                            {found
                              ? found.activity || found.code || String(found.id)
                              : "Unassigned"}
                          </Typography>
                        );
                      })()}
                    </TableCell>
                    <TableCell align="right">{Number(r.hours || 0)}</TableCell>
                    <TableCell>{r.billable ? "Yes" : "No"}</TableCell>
                    <TableCell>{r.notes || ""}</TableCell>
                  </TableRow>
                ))
              )}
              {days.length > 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="caption" color="text.secondary">
                      Daily totals:{" "}
                      {days
                        .map((d) => `${d}: ${totalsByDay[d] || 0}`)
                        .join("  ·  ")}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  );
}
