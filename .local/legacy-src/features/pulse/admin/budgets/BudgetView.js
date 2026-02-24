import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router";
import { useAlert } from "../../../../context";
import { pulseService } from "../../../../services/pulse/pulse";

// NOTE: View-only list of budgets. Editing/creating happens in BudgetBuilder.
// Row click navigates to: /pulse-solution/admin/budgets/builder?budgetId=<id>
// "New Budget" button navigates to builder without a budgetId.

export default function BudgetView() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pulseService.budgets.list();
      setRows(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("[BudgetView] Failed to fetch budgets", err);
      showAlert("Failed to load budgets", "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const hasRows = rows && rows.length > 0;

  const onRowClick = useCallback(
    (id) => {
      if (!id) return;
      navigate(
        `/pulse-solution/admin/budgets/builder?budgetId=${encodeURIComponent(
          String(id)
        )}`
      );
    },
    [navigate]
  );

  const columns = useMemo(
    () => [
      { key: "name", label: "Name" },
      { key: "status", label: "Status" },
      { key: "version", label: "Version" },
      { key: "currency", label: "Currency" },
      { key: "notes", label: "Notes" },
      { key: "updatedAt", label: "Updated" },
    ],
    []
  );

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Budgets</Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/pulse-solution/admin/budgets/builder")}
        >
          New Budget
        </Button>
      </Stack>

      <Paper variant="outlined">
        <Box p={2}>
          {loading ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              py={6}
            >
              <CircularProgress size={24} />
            </Box>
          ) : hasRows ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map((c) => (
                    <TableCell key={c.key}>{c.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow
                    key={r.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => onRowClick(r.id)}
                  >
                    <TableCell>{r.name}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {r.status || "draft"}
                    </TableCell>
                    <TableCell>{r.version ?? 1}</TableCell>
                    <TableCell>{r.currency || "AUD"}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 360,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.notes || ""}
                    </TableCell>
                    <TableCell>
                      {r.updatedAt
                        ? new Date(r.updatedAt).toLocaleString()
                        : r.createdAt
                          ? new Date(r.createdAt).toLocaleString()
                          : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Box py={4} textAlign="center" color="text.secondary">
              <Typography variant="body2">No budgets yet.</Typography>
              <Button
                sx={{ mt: 2 }}
                variant="outlined"
                onClick={() =>
                  navigate("/pulse-solution/admin/budgets/builder")
                }
              >
                Create your first budget
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}
