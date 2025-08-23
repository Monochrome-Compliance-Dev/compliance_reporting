import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import data from "./mockData.json";

function getMondayISO() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

const Engagements = () => {
  const { engagementId } = useParams();
  const navigate = useNavigate();

  const { clients, resources, engagements, allocations, timeEntries } = data;
  const engagement = engagements.find(
    (e) => String(e.id) === String(engagementId)
  );
  const clientName = engagement
    ? clients.find((c) => c.id === engagement.clientId)?.name || "-"
    : "-";
  const entriesForThis = timeEntries.filter(
    (t) => t.engagementId === engagementId
  );
  const actualHours = entriesForThis.reduce(
    (s, t) => s + Number(t.hours || 0),
    0
  );
  const teamAllocations = allocations.filter(
    (a) => a.engagementId === engagementId
  );
  const teamMembers = teamAllocations.map((a) => {
    const person = resources.find((r) => r.id === a.resourceId);
    return {
      id: a.resourceId,
      name: person?.name || a.resourceId,
      role: person?.role || "-",
      allocatedHours: a.allocatedHours,
    };
  });
  const timeRows = entriesForThis.map((te) => {
    const person = resources.find((r) => r.id === te.resourceId);
    return {
      date: te.date,
      staff: person?.name || te.resourceId,
      hours: te.hours,
      note: te.note,
    };
  });

  const [logAsResourceId, setLogAsResourceId] = useState(
    teamMembers[0]?.id || ""
  );
  const mondayISO = getMondayISO();

  if (!engagement) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Engagement not found.
        </Typography>
        <Button variant="contained" onClick={() => navigate("/pulse")}>
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {engagement.name}
      </Typography>
      <Paper sx={{ mb: 4, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1" color="text.secondary">
              Client
            </Typography>
            <Typography>{clientName}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1" color="text.secondary">
              Budgeted Hours
            </Typography>
            <Typography>{engagement?.budgetHours ?? "-"}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1" color="text.secondary">
              Actual Hours
            </Typography>
            <Typography>{actualHours}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1" color="text.secondary">
              Status
            </Typography>
            <Typography>{engagement?.status || "-"}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {teamMembers.length > 0 ? (
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel id="logas-label">Log time as</InputLabel>
            <Select
              labelId="logas-label"
              label="Log time as"
              value={logAsResourceId}
              onChange={(e) => setLogAsResourceId(e.target.value)}
            >
              {teamMembers.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name} — {m.role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            disabled={!logAsResourceId}
            onClick={() =>
              navigate(`/pulse/timesheets/${logAsResourceId}/${mondayISO}`)
            }
          >
            Log Time (Timesheet)
          </Button>
        </Box>
      ) : (
        <Box sx={{ mb: 3 }}>
          <Button variant="contained" disabled>
            Log Time (Timesheet)
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No team members available to log time.
          </Typography>
        </Box>
      )}

      <Typography variant="h6" gutterBottom>
        Team Members
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Allocated Hours</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teamMembers.map((member, idx) => (
              <TableRow key={idx}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell>{member.allocatedHours}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" gutterBottom>
        Time Entries
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Staff</TableCell>
              <TableCell>Hours</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timeRows.map((entry, idx) => (
              <TableRow key={idx}>
                <TableCell>{entry.date}</TableCell>
                <TableCell>{entry.staff}</TableCell>
                <TableCell>{entry.hours}</TableCell>
                <TableCell>{entry.note}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Engagements;
