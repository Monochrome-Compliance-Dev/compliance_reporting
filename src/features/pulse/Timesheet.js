import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Stack,
  Link,
} from "@mui/material";
import { ArrowBack, ArrowForward, Delete } from "@mui/icons-material";
import { format, addDays, startOfWeek } from "date-fns";
import { useParams } from "react-router";
import mockData from "./mockData.json";
import { usePulseContext } from "../../context/PulseContext";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function getWeekRangeString(dates) {
  return `${format(dates[0], "MMM d, yyyy")} – ${format(dates[6], "MMM d, yyyy")}`;
}

function makeWeekKey(date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return format(start, "yyyy-MM-dd");
}

const Timesheet = () => {
  const { resourceId, week } = useParams();
  const parsedDate = week ? new Date(week) : null;
  const isValidDate = parsedDate instanceof Date && !isNaN(parsedDate);
  const [currentDate, setCurrentDate] = useState(
    isValidDate ? parsedDate : new Date()
  );

  const {
    engagements = [],
    resources = [],
    saveTimesheet,
    getTimesheet,
  } = usePulseContext();

  const getResourceNameById = (id) => {
    const found = resources.find((r) => r.id === id);
    return found ? found.name : id || "";
  };

  const [rows, setRows] = useState(() => {
    const firstEng = engagements[0]?.id;
    return [
      {
        engagementId: firstEng || "",
        hours: [0, 0, 0, 0, 0, 0, 0],
      },
    ];
  });

  // Load rows from overrides first, then mock data based on resource + week key
  useEffect(() => {
    const weekKey = makeWeekKey(currentDate);
    const fromOverrides = getTimesheet(resourceId, weekKey);
    if (Array.isArray(fromOverrides) && fromOverrides.length > 0) {
      setRows(
        fromOverrides.map((r) => ({
          engagementId: r.engagementId || engagements[0]?.id || "",
          hours:
            Array.isArray(r.hours) && r.hours.length === 7
              ? r.hours.map((h) => Number(h) || 0)
              : [0, 0, 0, 0, 0, 0, 0],
        }))
      );
      return;
    }
    const tsByResource = mockData?.timesheets?.[resourceId];
    const rowsFromMock = tsByResource?.[weekKey];
    if (Array.isArray(rowsFromMock) && rowsFromMock.length > 0) {
      // Validate/normalise each row
      const normalised = rowsFromMock.map((r) => ({
        engagementId: r.engagementId || engagements[0]?.id || "",
        hours:
          Array.isArray(r.hours) && r.hours.length === 7
            ? r.hours.map((h) => Number(h) || 0)
            : [0, 0, 0, 0, 0, 0, 0],
      }));
      setRows(normalised);
    } else {
      // Default to one empty row using first engagement
      setRows([
        {
          engagementId: engagements[0]?.id || "",
          hours: [0, 0, 0, 0, 0, 0, 0],
        },
      ]);
    }
  }, [currentDate, resourceId, engagements, getTimesheet]);

  // Add Row
  const handleAddRow = () => {
    const usedIds = rows.map((r) => r.engagementId);
    const available = engagements.find((e) => !usedIds.includes(e.id)) ||
      engagements[0] || { id: "" };
    setRows((prev) => [
      ...prev,
      { engagementId: available.id, hours: [0, 0, 0, 0, 0, 0, 0] },
    ]);
  };

  // Remove Row
  const handleRemoveRow = (idx) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  // Change engagement select
  const handleEngagementChange = (rowIdx, engagementId) => {
    setRows(
      rows.map((row, i) => (i === rowIdx ? { ...row, engagementId } : row))
    );
  };

  // Change hours
  const handleHoursChange = (rowIdx, dayIdx, value) => {
    setRows(
      rows.map((row, i) =>
        i === rowIdx
          ? {
              ...row,
              hours: row.hours.map((h, j) =>
                j === dayIdx ? Math.max(0, Number(value) || 0) : h
              ),
            }
          : row
      )
    );
  };

  // Row total
  const rowTotal = (row) => row.hours.reduce((a, b) => a + b, 0);

  // Totals per day
  const dayTotals = DAYS.map((_, dayIdx) =>
    rows.reduce((sum, row) => sum + (row.hours[dayIdx] || 0), 0)
  );
  const grandTotal = dayTotals.reduce((a, b) => a + b, 0);

  // Week navigation
  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  const weekKey = makeWeekKey(currentDate);
  const persistRows = async () => {
    await saveTimesheet(resourceId, weekKey, rows);
  };
  const handleSave = () => {
    persistRows();
  };
  const handleSubmit = () => {
    persistRows();
  };

  const weekDates = getWeekDates(currentDate);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", py: 4 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            Timesheet
          </Typography>
          <Typography color="text.secondary" variant="subtitle1">
            Week of {getWeekRangeString(weekDates)}
            {resourceId
              ? ` - Resource: ${getResourceNameById(resourceId)}`
              : ""}
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
            <Link href="/help/timesheet" underline="hover">
              Timesheet help
            </Link>
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={handlePrevWeek} aria-label="Previous week">
            <ArrowBack />
          </IconButton>
          <IconButton onClick={handleNextWeek} aria-label="Next week">
            <ArrowForward />
          </IconButton>
        </Stack>
      </Stack>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 170 }}>Engagement</TableCell>
              {DAYS.map((d, i) => (
                <TableCell key={d} align="center">
                  {d}
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    {format(weekDates[i], "MM/dd")}
                  </Typography>
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Row Total
              </TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                <TableCell sx={{ minWidth: 170 }}>
                  <Select
                    value={row.engagementId}
                    onChange={(e) =>
                      handleEngagementChange(rowIdx, e.target.value)
                    }
                    size="small"
                  >
                    {engagements.map((e) => (
                      <MenuItem key={e.id} value={e.id}>
                        {e.name}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                {DAYS.map((_, dayIdx) => (
                  <TableCell key={dayIdx} align="center">
                    <TextField
                      type="number"
                      inputProps={{
                        min: 0,
                        style: { width: 50, textAlign: "center" },
                      }}
                      value={row.hours[dayIdx]}
                      size="small"
                      onChange={(e) =>
                        handleHoursChange(rowIdx, dayIdx, e.target.value)
                      }
                    />
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  {rowTotal(row)}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    onClick={() => handleRemoveRow(rowIdx)}
                    aria-label="Delete row"
                    disabled={rows.length <= 1}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Total</TableCell>
              {dayTotals.map((total, i) => (
                <TableCell key={i} align="center" sx={{ fontWeight: "bold" }}>
                  {total}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                {grandTotal}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
        <Button variant="outlined" onClick={handleAddRow}>
          Add Row
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save
        </Button>
        <Button variant="contained" color="success" onClick={handleSubmit}>
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default Timesheet;
