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

export default function ResourceAllocationView() {
  const { resources = [], engagements = [], clients = [] } = usePulseContext();

  const [query, setQuery] = useState("");
  const clientById = useMemo(
    () => Object.fromEntries((clients || []).map((c) => [String(c.id), c])),
    [clients]
  );

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
          clientId: String(e.clientId),
          clientName: clientById[String(e.clientId)]?.name || "",
          allocationPct: Number(a.allocationPct || 0),
          startDate: a.startDate || "",
          endDate: a.endDate || "",
          role: a.role || "",
        });
      });
    });
    // Sort each resource's list by client then engagement
    Object.values(map).forEach((arr) =>
      arr.sort(
        (x, y) =>
          (x.clientName || "").localeCompare(y.clientName || "") ||
          (x.engagementName || "").localeCompare(y.engagementName || "")
      )
    );
    return map;
  }, [engagements, clientById]);

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
        [it.engagementName, it.clientName].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(q)
        )
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
          placeholder="Search by resource, client, or engagement…"
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
                                />
                                <Typography variant="body2">
                                  <strong>{it.clientName || "Client"}</strong> —{" "}
                                  {it.engagementName || "Engagement"}
                                </Typography>
                                <Box flexGrow={1} />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {it.startDate || ""}
                                  {it.startDate || it.endDate ? " → " : ""}
                                  {it.endDate || ""}
                                </Typography>
                              </Stack>
                              <Divider sx={{ my: 1 }} />
                              <Stack direction="row" spacing={1}>
                                <Chip
                                  size="small"
                                  component={Link}
                                  to={`/pulse/engagements/manage?id=${encodeURIComponent(it.engagementId)}`}
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
