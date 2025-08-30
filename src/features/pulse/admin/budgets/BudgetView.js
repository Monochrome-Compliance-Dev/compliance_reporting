import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
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
  Button,
  Drawer,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Link } from "react-router";
import { usePulseContext } from "../../../../context/PulseContext";
import { useAlert } from "../../../../context";
import { pulseService } from "../../../../services/pulse/pulse";
import { userService } from "../../../../services";

// Utility: basic currency formatting (fallbacks to $)
const fmtCurrency = (n, currency = "AUD") => {
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

const budgetSchema = yup
  .object({
    budgetHours: yup
      .number()
      .typeError("Hours must be a number")
      .min(0, "Must be 0 or more")
      .optional(),
    budgetAmount: yup
      .number()
      .typeError("Amount must be a number")
      .min(0, "Must be 0 or more")
      .optional(),
  })
  .required();

export default function BudgetView() {
  const {
    engagements = [],
    clients = [],
    upsertEngagement,
    removeEngagement,
  } = usePulseContext();
  const { showAlert } = useAlert();

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("edit"); // budgets attach to engagements; we only edit here
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null, name: "" });

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
      return matchesQ;
    });
  }, [rows, query]);

  const selected = useMemo(
    () =>
      (engagements || []).find((e) => String(e.id) === String(selectedId)) ||
      null,
    [engagements, selectedId]
  );

  const startEdit = (id) => {
    setSelectedId(id);
    setMode("edit");
    setDrawerOpen(true);
  };

  const openConfirmDelete = (id, name) =>
    setConfirm({ open: true, id, name: name || "" });
  const closeConfirm = () => setConfirm({ open: false, id: null, name: "" });

  const { register, handleSubmit, reset, formState } = useForm({
    resolver: yupResolver(budgetSchema),
    defaultValues: { budgetHours: "", budgetAmount: "" },
  });
  const { errors, isSubmitting } = formState;

  useMemo(() => {
    if (selected) {
      reset({
        budgetHours: selected.budgetHours ?? "",
        budgetAmount: selected.budgetAmount ?? "",
      });
    }
  }, [selected, reset]);

  const onSubmit = async (values) => {
    try {
      const payload = {
        budgetHours:
          values.budgetHours === "" ? null : Number(values.budgetHours),
        budgetAmount:
          values.budgetAmount === "" ? null : Number(values.budgetAmount),
        updatedBy: userService.userValue.id,
      };
      const saved = await pulseService.engagements.update(
        String(selected.id),
        payload
      );
      upsertEngagement(saved);
      showAlert("Budget updated", "success");
      setDrawerOpen(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to save budget", err);
      showAlert("Failed to save budget", "error");
    }
  };

  const onDelete = async (id) => {
    try {
      await pulseService.engagements.delete(String(id));
      removeEngagement(id);
      if (String(selectedId) === String(id)) {
        setSelectedId(null);
        setDrawerOpen(false);
      }
      showAlert("Engagement deleted", "success");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete engagement", err);
      showAlert("Failed to delete engagement", "error");
    }
  };

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
          {/* Removed client filter */}
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
                <TableRow
                  key={r.id}
                  hover
                  onClick={() => startEdit(r.id)}
                  sx={{ cursor: "pointer" }}
                >
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
                    <Button
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        openConfirmDelete(r.id, r.name);
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 520 } } }}
      >
        <Box
          p={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">
            {selected ? `Edit Budget — ${selected.name}` : "Edit Budget"}
          </Typography>
          <IconButton aria-label="Close" onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          p={2}
        >
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Budget (hours)"
                type="number"
                inputProps={{ min: 0, step: 1 }}
                {...register("budgetHours")}
                error={!!errors.budgetHours}
                helperText={errors.budgetHours?.message}
                fullWidth
              />
              <TextField
                label="Budget (amount)"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                {...register("budgetAmount")}
                error={!!errors.budgetAmount}
                helperText={errors.budgetAmount?.message}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                Save changes
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => setDrawerOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {selected && (
                <Button
                  type="button"
                  color="error"
                  variant="outlined"
                  onClick={() => openConfirmDelete(selected.id, selected.name)}
                  disabled={isSubmitting}
                >
                  Delete
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      </Drawer>

      <Dialog
        open={confirm.open}
        onClose={closeConfirm}
        aria-labelledby="confirm-delete-budget-title"
      >
        <DialogTitle id="confirm-delete-budget-title">
          Delete engagement?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently remove{" "}
            <strong>{confirm.name || "this engagement"}</strong> and its budget.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} variant="text">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await onDelete(confirm.id);
              closeConfirm();
            }}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
