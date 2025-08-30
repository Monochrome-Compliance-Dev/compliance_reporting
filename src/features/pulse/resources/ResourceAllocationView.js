import { useMemo, useState } from "react";
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
  Divider,
} from "@mui/material";
import { Link } from "react-router";
import { usePulseContext } from "../../../context/PulseContext";

function pct(n) {
  const v = Number(n || 0);
  if (Number.isNaN(v)) return 0;
  return Math.round(v);
}

function formatDate(d) {
  if (!d) return "";
  // accept YYYY-MM-DD or ISO and normalise to YYYY-MM-DD
  return String(d).slice(0, 10);
}

function formatDateTime(dt) {
  if (!dt) return "";
  const s = String(dt);
  // Trim seconds/ms and normalise 'T' to space for readability
  const base = s.replace("T", " ");
  const idx = base.indexOf(".");
  return idx > -1 ? base.slice(0, idx) : base;
}

function formatMoney(n) {
  if (n === null || n === undefined || n === "") return "";
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return `$${num.toFixed(2)}`;
}

export default function ResourceAllocationView() {
  const { resources = [], engagements = [] } = usePulseContext();

  const [query, setQuery] = useState("");

  // Build assignment index by resourceId
  const assignmentsByResource = useMemo(() => {
    const map = {};
    (engagements || []).forEach((e) => {
      const list = e.assignments || [];
      list.forEach((a) => {
        const rid = String(a.resourceId);
        if (!map[rid]) map[rid] = [];
        map[rid].push({
          engagementId: String(e.id),
          engagementName: e.name,
          allocationPct: Number(a.allocationPct || 0),
          allocatedHoursPerWeek: Number(a.allocatedHoursPerWeek || 0),
          rateOverride: a.rateOverride ?? null,
          startDate: a.startDate || "",
          endDate: a.endDate || "",
          dueDate: a.dueDate || "",
          completedAt: a.completedAt || "",
          role: a.role || "",
          notes: a.notes || "",
        });
      });
    });
    // Sort each resource's list by engagement
    Object.values(map).forEach((arr) =>
      arr.sort((x, y) =>
        (x.engagementName || "").localeCompare(y.engagementName || "")
      )
    );
    return map;
  }, [engagements]);

  const rows = useMemo(() => {
    return (resources || []).map((r) => {
      const rid = String(r.id);
      const items = assignmentsByResource[rid] || [];
      const total = items.reduce(
        (s, it) => s + Number(it.allocationPct || 0),
        0
      );
      return { resource: r, items, totalPct: total };
    });
  }, [resources, assignmentsByResource]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ resource, items }) => {
      const base = [resource.name, resource.role].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q)
      );
      const anyAssign = items.some((it) =>
        String(it.engagementName || "")
          .toLowerCase()
          .includes(q)
      );
      return base || anyAssign;
    });
  }, [rows, query]);

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Resource Allocation</Typography>
        <TextField
          size="small"
          placeholder="Search by resource or engagement…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          inputProps={{ "aria-label": "Search resource allocation" }}
        />
      </Box>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Resource</TableCell>
              <TableCell>Assignments</TableCell>
              <TableCell align="right">Total allocation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Box p={2}>
                    <Typography color="text.secondary">
                      No resources or assignments found.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(({ resource, items, totalPct }) => {
                const over = totalPct > 100;
                return (
                  <TableRow key={resource.id}>
                    <TableCell width={220}>
                      <Stack spacing={0.3}>
                        <Typography fontWeight={600}>
                          {resource.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {resource.role || ""}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      {items.length === 0 ? (
                        <Typography color="text.secondary">
                          Unassigned
                        </Typography>
                      ) : (
                        <Stack spacing={1}>
                          {items.map((it, idx) => (
                            <Paper
                              key={`${resource.id}:${it.engagementId}:${idx}`}
                              variant="outlined"
                              sx={{ p: 1 }}
                            >
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                              >
                                <Chip
                                  size="small"
                                  label={pct(it.allocationPct) + "%"}
                                  color={
                                    pct(it.allocationPct) >= 100
                                      ? "error"
                                      : "default"
                                  }
                                  aria-label={`Allocation ${pct(it.allocationPct)} percent`}
                                />
                                {Number(it.allocatedHoursPerWeek) > 0 && (
                                  <Chip
                                    size="small"
                                    label={`${it.allocatedHoursPerWeek} hrs/wk`}
                                    variant="outlined"
                                    aria-label={`Hours per week ${it.allocatedHoursPerWeek}`}
                                  />
                                )}
                                {it.rateOverride != null &&
                                  it.rateOverride !== "" && (
                                    <Chip
                                      size="small"
                                      label={`${formatMoney(it.rateOverride)} /hr override`}
                                      variant="outlined"
                                      aria-label={`Rate override ${formatMoney(it.rateOverride)} per hour`}
                                    />
                                  )}
                                {it.dueDate && (
                                  <Chip
                                    size="small"
                                    label={`Due ${formatDate(it.dueDate)}`}
                                    aria-label={`Due date ${formatDate(it.dueDate)}`}
                                  />
                                )}
                                {it.completedAt && (
                                  <Chip
                                    size="small"
                                    color="success"
                                    label={`Completed ${formatDateTime(it.completedAt)}`}
                                    aria-label={`Completed at ${formatDateTime(it.completedAt)}`}
                                  />
                                )}
                                <Typography variant="body2">
                                  <strong>
                                    {it.engagementName || "Engagement"}
                                  </strong>
                                </Typography>
                                <Box flexGrow={1} />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {formatDate(it.startDate)}
                                  {it.startDate || it.endDate ? " → " : ""}
                                  {formatDate(it.endDate)}
                                </Typography>
                              </Stack>
                              <Divider sx={{ my: 1 }} />
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                flexWrap="wrap"
                              >
                                <Chip
                                  size="small"
                                  component={Link}
                                  to={`/pulse-solution/engagements/manage?id=${encodeURIComponent(it.engagementId)}`}
                                  label="Manage"
                                  clickable
                                />
                                {it.role ? (
                                  <Chip
                                    size="small"
                                    label={it.role}
                                    variant="outlined"
                                  />
                                ) : null}
                                {it.notes ? (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ ml: 1 }}
                                  >
                                    {it.notes}
                                  </Typography>
                                ) : null}
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      )}
                    </TableCell>

                    <TableCell align="right" width={160}>
                      <Stack alignItems="flex-end" spacing={0.5}>
                        <Typography
                          fontWeight={700}
                          color={over ? "error.main" : undefined}
                        >
                          {pct(totalPct)}%
                        </Typography>
                        {over && (
                          <Typography variant="caption" color="error.main">
                            Over-allocated
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
