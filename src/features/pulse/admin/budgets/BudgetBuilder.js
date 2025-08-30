import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAlert } from "../../../../context";
import { pulseService } from "../../../../services/pulse/pulse";
import { userService } from "../../../../services";

const unwrap = (res) =>
  res && typeof res === "object" && "data" in res ? res.data : res;

// --- helpers ---
const toCurrency = (n, currency = "AUD") => {
  const val = Number(n || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(val);
  } catch {
    return `$${val.toFixed(2)}`;
  }
};

const ACTIVITY_OPTIONS = [
  "Planning",
  "Risk assessment",
  "Walkthroughs",
  "Control testing",
  "Substantive testing",
  "Capex review",
  "Fixed asset verification",
  "Inventory observation",
  "Revenue testing",
  "Payroll testing",
  "Compliance testing",
  "Analytics",
  "Fieldwork",
  "Client meetings",
  "Reporting (draft)",
  "Partner/Manager review",
  "Follow-up & remediation",
  "Travel/Admin (non-billable)",
  "Other — specify",
];

const defaultItem = () => ({
  activity: "",
  billingType: "hourly", // 'hourly' | 'fixed'
  hours: 0, // used if hourly
  rate: 0, // used if hourly (per hour)
  amount: 0, // used if fixed (flat amount)
  notes: "",
  billable: true,
});

const normaliseItem = (it = {}) => ({
  ...defaultItem(),
  ...it,
  id: it.id,
  budgetId: it.budgetId,
  sectionId: it.sectionId ?? null,
  activity: it.activity ?? "",
  billingType: it.billingType === "fixed" ? "fixed" : "hourly",
  hours: it.billingType === "hourly" ? Number(it.hours ?? 0) : 0,
  rate: it.billingType === "hourly" ? Number(it.rate ?? 0) : 0,
  amount: it.billingType === "fixed" ? Number(it.amount ?? 0) : 0,
  notes: it.notes ?? "",
  billable: it.billable ?? true,
});

export default function BudgetBuilder({ onSaved }) {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // Query params
  const [searchParams] = useSearchParams();
  const budgetIdFromQuery =
    searchParams.get("budgetId") || searchParams.get("id") || "";

  // Budget meta
  const [budgetId, setBudgetId] = useState(budgetIdFromQuery);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("draft"); // draft | final | archived
  const [version, setVersion] = useState(1);
  const [currency, setCurrency] = useState("AUD");
  const [notes, setNotes] = useState("");

  // Items
  const [items, setItems] = useState([]);
  const itemsSectionRef = useRef(null);
  const itemsEndRef = useRef(null);
  const prevBudgetIdRef = useRef(budgetId);

  // Totals
  const totals = useMemo(() => {
    const budgetHours = items
      .filter((it) => it.billingType === "hourly")
      .reduce((s, it) => s + Number(it.hours || 0), 0);
    const budgetAmount = items.reduce((s, it) => {
      if (it.billingType === "hourly")
        return s + Number(it.hours || 0) * Number(it.rate || 0);
      return s + Number(it.amount || 0);
    }, 0);
    return { budgetHours, budgetAmount };
  }, [items]);

  // --- Service wrappers (use budgets CRUD and budgetItems.listByBudget) ---
  const svc = {
    getBudget: async (id) => {
      return unwrap(await pulseService.budgets.getById(String(id)));
    },
    createBudget: async (payload) => {
      return unwrap(await pulseService.budgets.create(payload));
    },
    updateBudget: async (id, payload) => {
      return unwrap(await pulseService.budgets.update(String(id), payload));
    },
    listItemsByBudget: async (id) => {
      return (
        unwrap(await pulseService.budgetItems.listByBudget(String(id))) || []
      );
    },
    createItem: async (row) =>
      unwrap(await pulseService.budgetItems.create(row)),
    updateItem: async (id, row) =>
      unwrap(await pulseService.budgetItems.update(String(id), row)),
    deleteItem: async (id) =>
      unwrap(await pulseService.budgetItems.delete(String(id))),
  };

  // Load budget + items
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (budgetId) {
          // Load meta
          const b = await svc.getBudget(budgetId);
          if (mounted && b) {
            setName(b.name || "");
            setStatus(b.status || "draft");
            setVersion(Number(b.version || 1));
            setCurrency(b.currency || "AUD");
            setNotes(b.notes || "");
          }
          // Load items
          const rows = await svc.listItemsByBudget(budgetId);
          if (mounted)
            setItems(Array.isArray(rows) ? rows.map(normaliseItem) : []);
        } else {
          // Fresh builder
          setItems([]);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load budget/budget items", e);
        showAlert("Failed to load budget", "error");
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [budgetId, showAlert]); // keep deps accurate

  // Item editing utils
  const addItem = useCallback(() => {
    setItems((prev) => [...prev, defaultItem()]);
    // Scroll after React commits the new row
    setTimeout(() => {
      if (itemsEndRef.current) {
        itemsEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    }, 0);
  }, []);
  // Auto-scroll to items section when a fresh budget is created/loaded
  useEffect(() => {
    const prev = prevBudgetIdRef.current;
    if (!prev && budgetId && itemsSectionRef.current) {
      // We just created/loaded a budget for the first time in this session
      itemsSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    prevBudgetIdRef.current = budgetId;
  }, [budgetId]);
  const removeItem = useCallback(
    (index) => setItems((prev) => prev.filter((_, i) => i !== index)),
    []
  );
  const updateItem = useCallback(
    (index, patch) =>
      setItems((prev) =>
        prev.map((x, i) => (i === index ? { ...x, ...patch } : x))
      ),
    []
  );

  // Save
  const handleSave = useCallback(async () => {
    // Basic client validation
    const trimmedName = String(name || "").trim();
    if (!trimmedName) {
      showAlert("Budget name is required", "warning");
      return;
    }

    // Normalise local rows; new rows have no id (server will assign)
    const cleaned = items.map((it) => ({
      id: it.id,
      budgetId: budgetId || undefined,
      sectionId: it.sectionId || null,
      activity: String(it.activity || "").trim(),
      billingType: it.billingType === "fixed" ? "fixed" : "hourly",
      hours: Number(it.billingType === "hourly" ? it.hours || 0 : 0),
      rate: Number(it.billingType === "hourly" ? it.rate || 0 : 0),
      amount: Number(it.billingType === "fixed" ? it.amount || 0 : 0),
      notes: String(it.notes || "").trim() || undefined,
      billable: !!it.billable,
      order: Number(it.order || 0),
      customerId: userService.userValue.customerId,
    }));

    try {
      let bId = budgetId;

      // Create/Update budget meta
      if (!bId) {
        const created = await svc.createBudget({
          name: trimmedName,
          status,
          version,
          currency,
          notes,
          customerId: userService.userValue.customerId,
          createdBy: userService.userValue.id,
        });
        if (!created?.id) throw new Error("Budget creation failed");
        bId = String(created.id);
        setBudgetId(bId);
      } else {
        await svc.updateBudget(bId, {
          name: trimmedName,
          status,
          version,
          currency,
          notes,
          customerId: userService.userValue.customerId,
          updatedBy: userService.userValue.id,
        });
      }

      // Fetch current server items to diff (by budget)
      const existing = await svc.listItemsByBudget(bId);
      const byId = (arr) =>
        Object.fromEntries(
          arr.filter((x) => x?.id).map((x) => [String(x.id), x])
        );
      const existingById = byId(existing || []);

      const toCreate = cleaned.filter((x) => !x.id);
      const toUpdate = cleaned.filter(
        (x) => x.id && existingById[String(x.id)]
      );
      const toDelete = (existing || []).filter(
        (x) => !cleaned.some((y) => String(y.id || "") === String(x.id))
      );

      // Create
      const createdResults = await Promise.allSettled(
        toCreate.map((row) =>
          svc.createItem({
            ...row,
            budgetId: bId,
            createdBy: userService.userValue.id,
          })
        )
      );
      const createdErrors = createdResults.filter(
        (r) => r.status === "rejected"
      );
      if (createdErrors.length)
        throw (
          createdErrors[0].reason ||
          new Error("Failed to create one or more items")
        );

      // Update
      const updatedResults = await Promise.allSettled(
        toUpdate.map((row) =>
          svc.updateItem(String(row.id), {
            ...row,
            budgetId: bId,
            updatedBy: userService.userValue.id,
          })
        )
      );
      const updateErrors = updatedResults.filter(
        (r) => r.status === "rejected"
      );
      if (updateErrors.length)
        throw (
          updateErrors[0].reason ||
          new Error("Failed to update one or more items")
        );

      // Delete
      const deletedResults = await Promise.allSettled(
        toDelete.map((row) => svc.deleteItem(String(row.id)))
      );
      const deleteErrors = deletedResults.filter(
        (r) => r.status === "rejected"
      );
      if (deleteErrors.length)
        throw (
          deleteErrors[0].reason ||
          new Error("Failed to delete one or more items")
        );

      // Reload items to reflect canonical server state
      const fresh = await svc.listItemsByBudget(bId);
      setItems(Array.isArray(fresh) ? fresh.map(normaliseItem) : []);

      showAlert("Budget saved", "success");
      onSaved?.();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to save budget", e);
      showAlert("Failed to save budget", "error");
    }
  }, [
    budgetId,
    name,
    status,
    version,
    currency,
    notes,
    items,
    showAlert,
    onSaved,
  ]);

  const title = budgetId ? `Edit Budget` : "New Budget";

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Budget Builder</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            to="/pulse-solution/admin/budgets"
            variant="outlined"
          >
            Back to Budgets
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Save budget
          </Button>
        </Stack>
      </Box>

      {/* Budget meta */}
      <Paper variant="outlined">
        <Box p={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Budget name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="final">Final</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Version"
              type="number"
              inputProps={{ min: 1, step: 1 }}
              value={version}
              onChange={(e) => setVersion(Number(e.target.value || 1))}
              sx={{ width: 120 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="currency-label">Currency</InputLabel>
              <Select
                labelId="currency-label"
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <MenuItem value="AUD">AUD</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Box mt={2}>
            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Box>
          <Box mt={2} display="flex" gap={1} flexWrap="wrap">
            <Chip size="small" label={`Items: ${items.length}`} />
            <Chip size="small" label={`Hours: ${totals.budgetHours}`} />
            <Chip
              size="small"
              label={`Amount: ${toCurrency(totals.budgetAmount, currency)}`}
            />
            {budgetId ? (
              <Chip size="small" label={`Budget ID: ${budgetId}`} />
            ) : null}
          </Box>
        </Box>
      </Paper>

      {/* Items */}
      {budgetId ? (
        <Paper variant="outlined" ref={itemsSectionRef}>
          <Box p={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="subtitle1">Budget items</Typography>
              <Button variant="outlined" onClick={addItem}>
                Add item
              </Button>
            </Stack>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 280 }}>Activity</TableCell>
                  <TableCell sx={{ width: 140 }}>Billing</TableCell>
                  <TableCell align="right" sx={{ width: 110 }}>
                    Hours
                  </TableCell>
                  <TableCell align="right" sx={{ width: 110 }}>
                    Rate
                  </TableCell>
                  <TableCell align="right" sx={{ width: 140 }}>
                    Fixed amount
                  </TableCell>
                  <TableCell sx={{ width: 320 }}>Notes</TableCell>
                  <TableCell align="right" sx={{ width: 140 }}>
                    Row total
                  </TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!items || items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Button variant="outlined" onClick={addItem}>
                        Add item
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((it, idx) => {
                    const rowTotal =
                      it.billingType === "hourly"
                        ? Number(it.hours || 0) * Number(it.rate || 0)
                        : Number(it.amount || 0);
                    return (
                      <TableRow key={it.id || `${it.activity || "row"}-${idx}`}>
                        <TableCell sx={{ width: 280, verticalAlign: "middle" }}>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={it.activity || ""}
                            onChange={(e) =>
                              updateItem(idx, { activity: e.target.value })
                            }
                            SelectProps={{
                              displayEmpty: true,
                              renderValue: (val) =>
                                val ? val : "Select activity",
                            }}
                          >
                            <MenuItem value="">
                              <em>Select activity</em>
                            </MenuItem>
                            {ACTIVITY_OPTIONS.map((opt) => (
                              <MenuItem key={opt} value={opt}>
                                {opt}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell sx={{ width: 140, verticalAlign: "middle" }}>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={it.billingType}
                            onChange={(e) =>
                              updateItem(idx, { billingType: e.target.value })
                            }
                          >
                            <MenuItem value="hourly">Hourly</MenuItem>
                            <MenuItem value="fixed">Fixed</MenuItem>
                          </TextField>
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ width: 110, verticalAlign: "middle" }}
                        >
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0, step: 0.25 }}
                            InputProps={{ sx: { textAlign: "right" } }}
                            value={it.hours}
                            onChange={(e) =>
                              updateItem(idx, {
                                hours: Number(e.target.value || 0),
                              })
                            }
                            disabled={it.billingType !== "hourly"}
                          />
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ width: 110, verticalAlign: "middle" }}
                        >
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            InputProps={{ sx: { textAlign: "right" } }}
                            value={it.rate}
                            onChange={(e) =>
                              updateItem(idx, {
                                rate: Number(e.target.value || 0),
                              })
                            }
                            disabled={it.billingType !== "hourly"}
                          />
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ width: 140, verticalAlign: "middle" }}
                        >
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            InputProps={{ sx: { textAlign: "right" } }}
                            value={it.amount}
                            onChange={(e) =>
                              updateItem(idx, {
                                amount: Number(e.target.value || 0),
                              })
                            }
                            disabled={it.billingType !== "fixed"}
                          />
                        </TableCell>
                        <TableCell sx={{ width: 320, verticalAlign: "middle" }}>
                          <TextField
                            size="small"
                            value={it.notes}
                            onChange={(e) =>
                              updateItem(idx, { notes: e.target.value })
                            }
                            fullWidth
                          />
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ width: 140, verticalAlign: "middle" }}
                        >
                          {toCurrency(rowTotal, currency)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ width: 120, verticalAlign: "middle" }}
                        >
                          <Button
                            size="small"
                            color="error"
                            onClick={() => removeItem(idx)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                {items.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="right">
                      <strong>Totals</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>
                        {toCurrency(totals.budgetAmount, currency)}
                      </strong>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}
                {items.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="right">
                      <strong>Totals</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>
                        {toCurrency(totals.budgetAmount, currency)}
                      </strong>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}
                <TableRow>
                  <TableCell colSpan={8}>
                    <span ref={itemsEndRef} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Box mt={2} display="flex" gap={1}>
              <Button variant="contained" onClick={handleSave}>
                Save budget
              </Button>
              <Button variant="text" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </Box>
          </Box>
        </Paper>
      ) : (
        <Paper variant="outlined">
          <Box p={2}>
            <Typography color="text.secondary">
              Create and save the budget first. Once saved, you can add budget
              items.
            </Typography>
          </Box>
        </Paper>
      )}
    </Stack>
  );
}
