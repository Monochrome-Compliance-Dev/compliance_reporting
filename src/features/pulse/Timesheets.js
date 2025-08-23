import { useState, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Paper,
} from "@mui/material";
import { ArrowBack, ArrowForward, Search } from "@mui/icons-material";
import { format, startOfWeek, addDays } from "date-fns";
import { useNavigate } from "react-router";
import { usePulseContext } from "../../context/PulseContext";

function getWeekStart(date) {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
}

function getWeekKey(date) {
  return format(getWeekStart(date), "yyyy-MM-dd");
}

function weekRangeString(date) {
  const start = getWeekStart(date);
  const end = addDays(start, 6);
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

export default function Timesheets() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [query, setQuery] = useState("");

  const { resources = [] } = usePulseContext();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resources;
    return resources.filter((r) =>
      [r.name, r.email, r.id].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [resources, query]);

  const weekKey = getWeekKey(currentDate);

  const openTimesheet = (resourceId) => {
    navigate(`/pulse/timesheets/${resourceId}/${weekKey}`);
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", py: 4 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h4">Timesheets</Typography>
          <Typography color="text.secondary" variant="subtitle1">
            Week of {weekRangeString(currentDate)}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            aria-label="Previous week"
            onClick={() => setCurrentDate((d) => addDays(getWeekStart(d), -7))}
          >
            <ArrowBack />
          </IconButton>
          <IconButton
            aria-label="Next week"
            onClick={() => setCurrentDate((d) => addDays(getWeekStart(d), 7))}
          >
            <ArrowForward />
          </IconButton>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            fullWidth
            placeholder="Search resources by name, email, or ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
          />
        </Stack>
      </Paper>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Resource</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>ID</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.name || r.id}</TableCell>
                <TableCell>{r.email || "—"}</TableCell>
                <TableCell>{r.id}</TableCell>
                <TableCell align="right">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => openTimesheet(r.id)}
                  >
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="text.secondary">
                    No resources found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
