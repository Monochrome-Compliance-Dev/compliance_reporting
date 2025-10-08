import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Chip,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Link } from "react-router";
import { useAlert } from "context";
import { useQuery } from "@tanstack/react-query";

import { listResourceUtilisation } from "../../services/pulseApi";

export default function ResourceAllocationView() {
  const { showAlert } = useAlert();

  const today = new Date();
  const day = today.getDay();
  // Make Monday the start of week; JS Sunday=0
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  function toYMD(d) {
    return new Date(d).toISOString().slice(0, 10);
  }

  const [fromDate, setFromDate] = useState(toYMD(startOfWeek));
  const [toDate, setToDate] = useState(toYMD(endOfWeek));
  const [includeNonBillable, setIncludeNonBillable] = useState(false);
  const [query, setQuery] = useState("");

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "pulse",
      "resource-utilisation",
      { fromDate, toDate, includeNonBillable },
    ],
    queryFn: () =>
      listResourceUtilisation({
        from: fromDate,
        to: toDate,
        includeNonBillable,
      }),
  });

  useEffect(() => {
    if (isError && error) {
      showAlert(`Failed to load utilisation: ${error.message}`, "error");
    }
  }, [isError, error, showAlert]);

  const filtered = useMemo(() => {
    const data = Array.isArray(rows) ? rows : [];
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((r) => {
      const base = [r.resourceName, r.role].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q)
      );
      const anyEng = (r.byEngagement || []).some((e) =>
        String(e.engagementName || "")
          .toLowerCase()
          .includes(q)
      );
      return base || anyEng;
    });
  }, [rows, query]);

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Resource Utilisation</Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems="center"
        >
          <TextField
            size="small"
            type="date"
            label="From"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={includeNonBillable}
                onChange={(e) => setIncludeNonBillable(e.target.checked)}
              />
            }
            label="Include non-billable"
          />
          <TextField
            size="small"
            placeholder="Search by resource or engagement…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputProps={{ "aria-label": "Search resource utilisation" }}
          />
        </Stack>
      </Box>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Resource</TableCell>
              <TableCell>Engagement hours (selected range)</TableCell>
              <TableCell align="right">Utilisation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Box p={2}>
                    <Typography color="text.secondary">
                      Loading utilisation…
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Box p={2}>
                    <Typography color="text.secondary">
                      No utilisation data found.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => {
                const over = Number(row.utilPct || 0) > 100;
                const logged = Number(row.loggedHours || 0);
                const capacity = Number(row.capacityHours || 0);
                return (
                  <TableRow key={row.resourceId}>
                    <TableCell width={240}>
                      <Stack spacing={0.3}>
                        <Typography fontWeight={600}>
                          {row.resourceName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.role || ""}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      {!row.byEngagement || row.byEngagement.length === 0 ? (
                        <Typography color="text.secondary">
                          No hours logged
                        </Typography>
                      ) : (
                        <Stack spacing={1}>
                          {row.byEngagement
                            .sort((a, b) =>
                              String(a.engagementName || "").localeCompare(
                                String(b.engagementName || "")
                              )
                            )
                            .map((it, idx) => (
                              <Paper
                                key={`${row.resourceId}:${it.engagementId}:${idx}`}
                                variant="outlined"
                                sx={{ p: 1 }}
                              >
                                <Stack
                                  direction={{ xs: "column", sm: "row" }}
                                  spacing={1}
                                  alignItems={{
                                    xs: "flex-start",
                                    sm: "center",
                                  }}
                                >
                                  <Chip
                                    size="small"
                                    label={`${Number(it.hours || 0)} h`}
                                    aria-label={`Hours ${Number(it.hours || 0)}`}
                                  />
                                  <Typography variant="body2">
                                    <strong>
                                      {it.engagementName || "Engagement"}
                                    </strong>
                                  </Typography>
                                  <Box flexGrow={1} />
                                  <Chip
                                    size="small"
                                    component={Link}
                                    to={`/pulse-solution/admin/engagements/manage?id=${encodeURIComponent(it.engagementId)}`}
                                    label="Manage"
                                    clickable
                                  />
                                </Stack>
                              </Paper>
                            ))}
                        </Stack>
                      )}
                    </TableCell>

                    <TableCell align="right" width={200}>
                      <Stack alignItems="flex-end" spacing={0.5}>
                        <Typography
                          fontWeight={700}
                          color={over ? "error.main" : undefined}
                        >
                          {Number(row.utilPct || 0).toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {logged.toFixed(1)}h / {capacity.toFixed(1)}h
                        </Typography>
                        {over && (
                          <Typography variant="caption" color="error.main">
                            Over-allocated
                          </Typography>
                        )}
                        {!over && capacity > 0 && logged < 0.6 * capacity && (
                          <Typography variant="caption" color="warning.main">
                            Under 60% (bench risk)
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
