import { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
} from "@mui/material";
import { Add, Search } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { usePulseContext } from "../../context/PulseContext";

export default function Clients() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { clients = [] } = usePulseContext();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, c.abn, c.email, c.id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [clients, query]);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", py: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4">Clients</Typography>
          <Typography color="text.secondary" variant="subtitle1">
            View, search, and manage client organisations.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/pulse/clients/new")}
        >
          New Client
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name, ABN, email, or ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
        />
      </Paper>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>ABN</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>ID</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>{c.name || "—"}</TableCell>
                <TableCell>{c.abn || "—"}</TableCell>
                <TableCell>{c.email || "—"}</TableCell>
                <TableCell>{c.id}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/pulse/clients/${c.id}`)}
                  >
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">
                    No clients found.
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
