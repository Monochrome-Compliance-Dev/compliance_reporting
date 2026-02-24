import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAlert } from "context/";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { customerService, userService } from "services";
import {
  canSwitchCustomers,
  getCurrentCustomer,
  setCurrentCustomer,
  clearCurrentCustomer,
  onCustomerChange,
} from "lib/utils/";

export default function LandingV2() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // --- v1 dashboard parity: user + entitlements ---
  const [user, setUser] = useState(userService.userValue);
  useEffect(() => {
    const sub = userService.user.subscribe((u) => setUser(u));
    return () => sub.unsubscribe();
  }, []);
  const hasFeature = (f) =>
    Array.isArray(user?.entitlements) && user.entitlements.includes(f);

  // --- v1 dashboard parity: acting-on-behalf switcher ---
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    getCurrentCustomer()?.id || user?.customerId || ""
  );

  // keep local state in sync with global tenant changes
  useEffect(() => {
    const unsubscribe = onCustomerChange?.((cust) => {
      setSelectedCustomerId(cust?.id || "");
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const userId = user?.id;
  const canSwitch = canSwitchCustomers(user);

  // load accessible customers for Boss users
  useEffect(() => {
    if (!canSwitch) return;
    let isActive = true;
    async function loadCustomers() {
      try {
        setLoadingCustomers(true);
        const list = await customerService.getCustomersByAccess(userId);
        if (isActive && Array.isArray(list)) setCustomers(list);
      } catch (e) {
        if (typeof showAlert === "function")
          showAlert(e?.message || "Failed to load customers", "error");
      } finally {
        if (isActive) setLoadingCustomers(false);
      }
    }
    loadCustomers();
    return () => {
      isActive = false;
    };
  }, [showAlert, userId, canSwitch]);

  // validate selection against entitlements; clear if invalid
  useEffect(() => {
    if (!canSwitchCustomers(user)) return;
    if (!Array.isArray(customers) || customers.length === 0) return;
    const ok = customers.some(
      (c) => String(c.id) === String(selectedCustomerId)
    );
    if (!ok && selectedCustomerId) {
      setSelectedCustomerId("");
      clearCurrentCustomer();
      if (typeof showAlert === "function")
        showAlert(
          "You no longer have access to that customer. Selection cleared.",
          "warning"
        );
    }
  }, [customers, selectedCustomerId, user, showAlert]);

  const handleCustomerChange = async (e) => {
    const value = e.target.value;
    setSelectedCustomerId(value);
    const selected = customers.find((c) => String(c.id) === String(value));
    if (!selected) {
      clearCurrentCustomer();
      if (typeof showAlert === "function")
        showAlert("Invalid customer selection.", "error");
      return;
    }
    // Optimistically set scoped tenant
    setCurrentCustomer({ id: selected.id, name: selected.businessName });
    try {
      await userService.reloadCustomerEntitlements(selected.id);
    } catch (err) {
      // Roll back selection on failure (especially 403)
      clearCurrentCustomer();
      setSelectedCustomerId("");
      const msg =
        err?.reason === "ACTING_FORBIDDEN"
          ? "You’re not allowed to act for that customer."
          : err?.message || "Failed to switch customer.";
      if (typeof showAlert === "function") showAlert(msg, "error");
    }
  };

  return (
    <Box sx={{ p: theme.spacing(3) }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Work hub
      </Typography>
      <Typography
        variant="body1"
        sx={{ mb: 3, color: theme.palette.text.secondary }}
      >
        Use the customer selector and tiles below to jump into PTRS or Pulse in
        the new v2 experience.
      </Typography>

      {canSwitch && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small" disabled={loadingCustomers}>
            <InputLabel id="acting-as-label">Acting as customer</InputLabel>
            <Select
              labelId="acting-as-label"
              id="acting-as"
              label="Acting as customer"
              value={
                customers.some(
                  (c) => String(c.id) === String(selectedCustomerId)
                )
                  ? selectedCustomerId
                  : ""
              }
              onChange={handleCustomerChange}
              renderValue={(val) => {
                if (!val) return "— None selected —";
                const found = customers.find(
                  (c) => String(c.id) === String(val)
                );
                return found?.businessName;
              }}
            >
              <MenuItem value={user?.customerId}>
                <em>None (use my default)</em>
              </MenuItem>
              {customers.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.businessName || c.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {loadingCustomers && (
            <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption">Loading customers…</Typography>
            </Box>
          )}
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card
            variant="outlined"
            sx={{
              cursor: hasFeature("ptrs") ? "pointer" : "default",
              opacity: hasFeature("ptrs") ? 1 : 0.6,
            }}
            aria-disabled={!hasFeature("ptrs")}
            {...(hasFeature("ptrs") && { onClick: () => navigate("/v2/ptrs") })}
          >
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6">PTRS v2</Typography>
                <Typography variant="body2" color="text.secondary">
                  Modernised PTRS workflow, aligned to regulator formulas and
                  audit logging.
                </Typography>
                <Box>
                  <Button
                    variant="contained"
                    onClick={() => navigate("/v2/ptrs")}
                    disabled={!hasFeature("ptrs")}
                  >
                    Open PTRS v2
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            variant="outlined"
            sx={{
              cursor: hasFeature("pulse") ? "pointer" : "default",
              opacity: hasFeature("pulse") ? 1 : 0.6,
            }}
            aria-disabled={!hasFeature("pulse")}
            {...(hasFeature("pulse") && {
              onClick: () => navigate("/v2/pulse"),
            })}
          >
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6">Pulse v2</Typography>
                <Typography variant="body2" color="text.secondary">
                  Engagements, budgets, and timesheets — with Maximiser
                  insights.
                </Typography>
                <Box>
                  <Button
                    variant="contained"
                    onClick={() => navigate("/v2/pulse")}
                    disabled={!hasFeature("pulse")}
                  >
                    Open Pulse v2
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {canSwitch && (
        <Box sx={{ mt: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="subtitle1">Boss tools</Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage customers, and later access and entitlements, for the
                  organisations you support.
                </Typography>
                <Box>
                  <Button
                    variant="text"
                    onClick={() => navigate("/v2/boss/customers")}
                  >
                    Open customer admin
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}
