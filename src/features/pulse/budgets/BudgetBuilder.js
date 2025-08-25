import { useEffect, useMemo, useState, useCallback } from "react";
import { nanoid } from "nanoid";
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
  id: nanoid(10),
  activity: "",
  billingType: "hourly", // 'hourly' | 'fixed'
  hours: 0, // used if hourly
  rate: 0, // used if hourly (per hour)
  amount: 0, // used if fixed (flat amount)
  notes: "",
  billable: true,
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
  }, [engagementIdProp]);

  const engagement = engagementById[String(engagementId)] || null;

  const [items, setItems] = useState(() =>
    engagement?.budgetItems
      ? engagement.budgetItems.map((it) => ({ ...defaultItem(), ...it }))
      : []
  );

  // keep items in sync if user switches engagement
  useEffect(() => {
    const fresh = engagementById[String(engagementId)]?.budgetItems || [];
    setItems(
      Array.isArray(fresh)
        ? fresh.map((it) => ({ ...defaultItem(), ...it }))
        : []
    );
  }, [engagementId, engagementById]);

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
    (id) => setItems((prev) => prev.filter((x) => String(x.id) !== String(id))),
    []
  );
  const updateItem = useCallback(
    (id, patch) =>
      setItems((prev) =>
        prev.map((x) => (String(x.id) === String(id) ? { ...x, ...patch } : x))
      ),
    []
  );

  const handleSave = useCallback(async () => {
    if (!engagementId) {
      showAlert("Choose an engagement first", "warning");
      return;
    }
    // Normalise items
    const cleaned = items.map((it) => ({
      id: it.id || nanoid(10),
      activity: String(it.activity || "").trim(),
      billingType: it.billingType === "fixed" ? "fixed" : "hourly",
      hours: Number(it.billingType === "hourly" ? it.hours || 0 : 0),
      rate: Number(it.billingType === "hourly" ? it.rate || 0 : 0),
      amount: Number(it.billingType === "fixed" ? it.amount || 0 : 0),
      notes: String(it.notes || "").trim() || undefined,
      billable: !!it.billable,
    }));

    // Recalculate rollups
    const payload = {
      ...engagement,
      budgetItems: cleaned,
      budgetHours: totals.budgetHours,
      budgetAmount: totals.budgetAmount,
    };

    try {
      const saved = await pulseService.engagements.update(
        String(engagementId),
        payload
      );
      upsertEngagement(saved);
      showAlert("Budget saved", "success");
      onSaved?.({
        budgetHours: totals.budgetHours,
        budgetAmount: totals.budgetAmount,
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
    totals,
    upsertEngagement,
    showAlert,
    onSaved,
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
                items.map((it) => {
                  const rowTotal =
                    it.billingType === "hourly"
                      ? Number(it.hours || 0) * Number(it.rate || 0)
                      : Number(it.amount || 0);
                  return (
                    <TableRow key={it.id}>
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
                                  updateItem(it.id, {
                                    _customActivity:
                                      it._customActivity ||
                                      (ACTIVITY_OPTIONS.includes(it.activity)
                                        ? ""
                                        : it.activity || ""),
                                  });
                                } else {
                                  // pick a standard activity and clear custom
                                  updateItem(it.id, {
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
                                updateItem(it.id, {
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
                              updateItem(it.id, { billingType: e.target.value })
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
                            updateItem(it.id, {
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
                            updateItem(it.id, {
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
                            updateItem(it.id, {
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
                            updateItem(it.id, { notes: e.target.value })
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
                          onClick={() => removeItem(it.id)}
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
