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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
} from "@mui/material";
import { Link } from "react-router";
import { usePulseContext } from "../../../../context/PulseContext";

// Utility: basic currency formatting (fallbacks to $)
const fmtCurrency = (n, currency = "USD") => {
  const val = Number(n || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(val);
  } catch (_e) {
    return `$${val.toFixed(2)}`;
  }
};

export default function BudgetView() {
  const { engagements = [], clients = [] } = usePulseContext();

  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  const clientById = useMemo(
    () => Object.fromEntries((clients || []).map((c) => [String(c.id), c])),
    [clients]
  );

  // Derived rows: show one row per engagement (budget container lives on engagement for now)
  const rows = useMemo(() => {
    return (engagements || []).map((e) => {
      const client = clientById[String(e.clientId)];
      const budgetHours = Number(e.budgetHours || 0);
      const budgetAmount = Number(e.budgetAmount || 0);
      const activities = Array.isArray(e.budgetItems)
        ? e.budgetItems.length
        : 0; // placeholder until builder exists
      return {
        id: String(e.id),
        budgetId: String(e.id),
        name: e.name || "Untitled engagement",
        clientId: String(e.clientId || ""),
        clientName: client?.name || "",
        budgetHours,
        budgetAmount,
        activities,
      };
    });
  }, [engagements, clientById]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQ =
        !q ||
        [r.name, r.clientName].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(q)
        );
      const matchesClient = !clientFilter || r.clientId === clientFilter;
      return matchesQ && matchesClient;
    });
  }, [rows, query, clientFilter]);

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Budgets</Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            size="small"
            placeholder="Search by engagement or client…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputProps={{ "aria-label": "Search budgets" }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="client-filter-label">Client</InputLabel>
            <Select
              labelId="client-filter-label"
              label="Client"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <MenuItem value="">
                <em>All clients</em>
              </MenuItem>
              {(clients || []).map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Placeholder manage link (we'll add the builder later) */}
          <Button
            component={Link}
            to="/pulse-solution/engagements/manage"
            variant="outlined"
          >
            Open Engagements
          </Button>
        </Stack>
      </Box>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Engagement</TableCell>
              <TableCell>Client</TableCell>
              <TableCell align="right">Budget (hrs)</TableCell>
              <TableCell align="right">Budget ($)</TableCell>
              <TableCell align="right">Activities</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box p={2}>
                    <Typography color="text.secondary">
                      No budgets found. Create or edit an engagement to set a
                      budget.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Stack spacing={0.2}>
                      <Typography fontWeight={600}>{r.name}</Typography>
                      <Stack direction="row" spacing={1}>
                        {r.budgetHours ? (
                          <Chip size="small" label={`${r.budgetHours} hrs`} />
                        ) : null}
                        {r.budgetAmount ? (
                          <Chip
                            size="small"
                            label={fmtCurrency(r.budgetAmount)}
                          />
                        ) : null}
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>{r.clientName || "—"}</TableCell>
                  <TableCell align="right">{r.budgetHours || 0}</TableCell>
                  <TableCell align="right">
                    {r.budgetAmount ? fmtCurrency(r.budgetAmount) : "—"}
                  </TableCell>
                  <TableCell align="right">{r.activities}</TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <Chip
                        size="small"
                        component={Link}
                        to={`/pulse/budgets/manage?id=${encodeURIComponent(r.budgetId)}`}
                        label="Manage"
                        clickable
                      />
                      <Chip
                        size="small"
                        component={Link}
                        to={`/pulse/engagements/manage?id=${encodeURIComponent(r.id)}`}
                        label="Engagement"
                        clickable
                        variant="outlined"
                      />
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
