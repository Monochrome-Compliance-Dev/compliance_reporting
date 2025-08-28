import { useEffect, useMemo, useState, useCallback } from "react";
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
import { usePulseContext } from "../../../context/PulseContext";
import { useAlert } from "../../../context";

import { pulseService } from "../../../services/pulse/pulse";
import { userService } from "../../../services";

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

// Common audit engagement activities (curated MVP list)
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
  engagementId: it.engagementId,
  activity: it.activity ?? "",
  billingType: it.billingType === "fixed" ? "fixed" : "hourly",
  hours: it.billingType === "hourly" ? Number(it.hours ?? 0) : 0,
  rate: it.billingType === "hourly" ? Number(it.rate ?? 0) : 0,
  amount: it.billingType === "fixed" ? Number(it.amount ?? 0) : 0,
  notes: it.notes ?? "",
  billable: it.billable ?? true,
});

export default function BudgetBuilder({
  engagementId: engagementIdProp,
  onSaved,
}) {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const {
    engagements = [],
    clients = [],
    upsertEngagement,
  } = usePulseContext();

  const [searchParams] = useSearchParams();
  const engagementIdFromQuery =
    searchParams.get("id") || searchParams.get("engagementId");

  const clientById = useMemo(
    () => Object.fromEntries((clients || []).map((c) => [String(c.id), c])),
    [clients]
  );
  const engagementById = useMemo(
    () => Object.fromEntries((engagements || []).map((e) => [String(e.id), e])),
    [engagements]
  );

  const [engagementId, setEngagementId] = useState(
    engagementIdProp || engagementIdFromQuery || ""
  );

  // keep controlled when embedded
  useEffect(() => {
    if (engagementIdProp && String(engagementIdProp) !== String(engagementId)) {
      setEngagementId(String(engagementIdProp));
    }
  }, [engagementId, engagementIdProp]);

  const engagement = engagementById[String(engagementId)] || null;

  const [items, setItems] = useState(() =>
    engagement?.budgetItems ? engagement.budgetItems.map(normaliseItem) : []
  );

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

  const addItem = useCallback(
    () => setItems((prev) => [...prev, defaultItem()]),
    []
  );
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

  // Load items from server by engagement
  const loadItems = useCallback(
    async (id) => {
      try {
        if (!id) return;
        const res = await pulseService.budgetItems.listByEngagement(String(id));
        const rows = unwrap(res) || [];
        setItems(Array.isArray(rows) ? rows.map(normaliseItem) : []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load budget items", e);
        showAlert("Failed to load budget items", "error");
      }
    },
    [showAlert]
  );

  // keep items in sync if user switches engagement (load from server)
  useEffect(() => {
    if (engagementId) {
      loadItems(engagementId);
    } else {
      setItems([]);
    }
  }, [engagementId, loadItems]);

  const handleSave = useCallback(async () => {
    if (!engagementId) {
      showAlert("Choose an engagement first", "warning");
      return;
    }

    // Server state (if present on engagement)
    const existing = Array.isArray(engagement?.budgetItems)
      ? engagement.budgetItems
      : [];

    // Normalise local rows; new rows have no id (server will assign)
    const cleaned = items.map((it) => ({
      id: it.id,
      engagementId: String(engagementId),
      activity: String(it.activity || "").trim(),
      billingType: it.billingType === "fixed" ? "fixed" : "hourly",
      hours: Number(it.billingType === "hourly" ? it.hours || 0 : 0),
      rate: Number(it.billingType === "hourly" ? it.rate || 0 : 0),
      amount: Number(it.billingType === "fixed" ? it.amount || 0 : 0),
      notes: String(it.notes || "").trim() || undefined,
      billable: !!it.billable,
      customerId: userService.userValue.customerId,
    }));

    const byId = (arr) =>
      Object.fromEntries(
        arr.filter((x) => x?.id).map((x) => [String(x.id), x])
      );

    const existingById = byId(existing);

    const toCreate = cleaned.filter((x) => !x.id);
    const toUpdate = cleaned.filter((x) => x.id && existingById[String(x.id)]);
    const toDelete = existing.filter(
      (x) => !cleaned.some((y) => String(y.id || "") === String(x.id))
    );

    try {
      // Create
      const createdResults = await Promise.allSettled(
        toCreate.map((row) =>
          pulseService.budgetItems.create({
            ...row,
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
          new Error("Failed to create one or more budget items")
        );

      // Update
      const updatedResults = await Promise.allSettled(
        toUpdate.map((row) =>
          pulseService.budgetItems.update(String(row.id), {
            engagementId: String(engagementId),
            activity: row.activity,
            billingType: row.billingType,
            hours: row.hours,
            rate: row.rate,
            amount: row.amount,
            notes: row.notes,
            billable: row.billable,
            customerId: row.customerId,
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
          new Error("Failed to update one or more budget items")
        );

      // Delete
      const deletedResults = await Promise.allSettled(
        toDelete.map((row) => pulseService.budgetItems.delete(String(row.id)))
      );
      const deleteErrors = deletedResults.filter(
        (r) => r.status === "rejected"
      );
      if (deleteErrors.length)
        throw (
          deleteErrors[0].reason ||
          new Error("Failed to delete one or more budget items")
        );

      // Patch engagement rollups only (no id/createdAt/updatedAt)
      const saved = await pulseService.engagements.patch(String(engagementId), {
        budgetHours: cleaned
          .filter((r) => r.billingType === "hourly")
          .reduce((s, r) => s + (r.hours || 0), 0),
        budgetAmount: cleaned.reduce(
          (s, r) =>
            s +
            (r.billingType === "hourly"
              ? (r.hours || 0) * (r.rate || 0)
              : r.amount || 0),
          0
        ),
        updatedBy: userService.userValue.id,
        customerId: userService.userValue.customerId,
      });

      const entity = unwrap(saved);
      if (!entity || !entity.id) {
        throw new Error("Engagement update failed – no entity returned");
      }
      upsertEngagement(entity);
      await loadItems(engagementId);
      showAlert("Budget saved", "success");
      onSaved?.({
        budgetHours: entity.budgetHours,
        budgetAmount: entity.budgetAmount,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to save budget", e);
      showAlert("Failed to save budget", "error");
    }
  }, [
    engagementId,
    engagement,
    items,
    upsertEngagement,
    showAlert,
    onSaved,
    loadItems,
  ]);

  const title = engagement
    ? `${engagement.name} — ${clientById[String(engagement.clientId)]?.name || "Client"}`
    : "Select an engagement";

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Budget Builder</Typography>
        <Stack direction="row" spacing={1}>
          <Button component={Link} to="/pulse/budgets" variant="outlined">
            Back to Budgets
          </Button>
          {engagementId ? (
            <Button
              component={Link}
              to={`/pulse/engagements/manage?id=${encodeURIComponent(engagementId)}`}
              variant="text"
            >
              Open Engagement
            </Button>
          ) : null}
        </Stack>
      </Box>

      <Paper variant="outlined">
        <Box p={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel id="engagement-select-label">Engagement</InputLabel>
              <Select
                labelId="engagement-select-label"
                label="Engagement"
                value={engagementId}
                onChange={(e) => setEngagementId(e.target.value)}
                disabled={!!engagementIdProp}
              >
                {(engagements || []).map((e) => (
                  <MenuItem key={e.id} value={String(e.id)}>
                    {e.name} —{" "}
                    {clientById[String(e.clientId)]?.name || "Client"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {engagement && (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Chip
                  size="small"
                  label={`Current budget: ${totals.budgetHours} hrs`}
                />
                <Chip
                  size="small"
                  label={`Amount: ${toCurrency(totals.budgetAmount)}`}
                />
              </Stack>
            )}
          </Stack>
        </Box>
      </Paper>

      <Paper variant="outlined">
        <Box p={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="subtitle1">
              Budget items {engagement ? `for ${title}` : ""}
            </Typography>
            <Button
              variant="outlined"
              onClick={addItem}
              disabled={!engagementId}
            >
              Add item
            </Button>
          </Stack>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Activity</TableCell>
                <TableCell>Billing</TableCell>
                <TableCell align="right">Hours</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Fixed amount</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Row total</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!items || items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography color="text.secondary">
                      No budget items yet. Click “Add item”.
                    </Typography>
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
                      <TableCell width={260}>
                        <Stack spacing={0.75}>
                          <FormControl size="small" fullWidth>
                            <Select
                              displayEmpty
                              value={
                                ACTIVITY_OPTIONS.includes(it.activity)
                                  ? it.activity
                                  : it._customActivity
                                    ? "Other — specify"
                                    : it.activity || ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "Other — specify") {
                                  // enable custom input; keep existing custom text if present or use current activity
                                  updateItem(idx, {
                                    _customActivity:
                                      it._customActivity ||
                                      (ACTIVITY_OPTIONS.includes(it.activity)
                                        ? ""
                                        : it.activity || ""),
                                  });
                                } else {
                                  // pick a standard activity and clear custom
                                  updateItem(idx, {
                                    activity: val,
                                    _customActivity: undefined,
                                  });
                                }
                              }}
                              renderValue={(val) =>
                                val ? val : "Select activity"
                              }
                            >
                              <MenuItem value="">
                                <em>Select activity</em>
                              </MenuItem>
                              {ACTIVITY_OPTIONS.map((opt) => (
                                <MenuItem key={opt} value={opt}>
                                  {opt}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {it._customActivity !== undefined && (
                            <TextField
                              size="small"
                              placeholder="Describe the activity"
                              value={it._customActivity}
                              onChange={(e) =>
                                updateItem(idx, {
                                  _customActivity: e.target.value,
                                  activity: e.target.value,
                                })
                              }
                              fullWidth
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell width={140}>
                        <FormControl fullWidth size="small">
                          <Select
                            value={it.billingType}
                            onChange={(e) =>
                              updateItem(idx, { billingType: e.target.value })
                            }
                          >
                            <MenuItem value="hourly">Hourly</MenuItem>
                            <MenuItem value="fixed">Fixed</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="right" width={120}>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: 0.25 }}
                          value={it.hours}
                          onChange={(e) =>
                            updateItem(idx, {
                              hours: Number(e.target.value || 0),
                            })
                          }
                          disabled={it.billingType !== "hourly"}
                        />
                      </TableCell>
                      <TableCell align="right" width={120}>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: 1 }}
                          value={it.rate}
                          onChange={(e) =>
                            updateItem(idx, {
                              rate: Number(e.target.value || 0),
                            })
                          }
                          disabled={it.billingType !== "hourly"}
                        />
                      </TableCell>
                      <TableCell align="right" width={160}>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: 1 }}
                          value={it.amount}
                          onChange={(e) =>
                            updateItem(idx, {
                              amount: Number(e.target.value || 0),
                            })
                          }
                          disabled={it.billingType !== "fixed"}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={it.notes}
                          onChange={(e) =>
                            updateItem(idx, { notes: e.target.value })
                          }
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right" width={140}>
                        {toCurrency(rowTotal)}
                      </TableCell>
                      <TableCell align="right" width={120}>
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
                    <strong>{toCurrency(totals.budgetAmount)}</strong>
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Box mt={2} display="flex" gap={1}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!engagementId}
            >
              Save budget
            </Button>
            <Button variant="text" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Stack>
  );
}
