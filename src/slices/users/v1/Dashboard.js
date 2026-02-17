import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router";
import { customerService, userService } from "../../services";
import { useEffect, useState } from "react";
import {
  canSwitchCustomers,
  getCurrentCustomer,
  setCurrentCustomer,
  clearCurrentCustomer,
  onCustomerChange,
} from "../../lib/utils/";
import { useAlert } from "../../context";

export default function Dashboard() {
  const [user, setUser] = useState(userService.userValue);
  useEffect(() => {
    const sub = userService.user.subscribe((u) => setUser(u));
    return () => sub.unsubscribe();
  }, []);
  const navigate = useNavigate();
  const theme = useTheme();
  const { showAlert } = useAlert();

  const hasFeature = (f) =>
    Array.isArray(user?.entitlements) && user.entitlements.includes(f);

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    getCurrentCustomer()?.id || user?.customerId || ""
  );

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

  useEffect(() => {
    if (!canSwitch) return;
    let isActive = true;
    async function loadCustomers() {
      try {
        setLoadingCustomers(true);
        const list = await customerService.getCustomersByAccess(userId);
        if (isActive && Array.isArray(list)) {
          setCustomers(list);
        }
      } catch (e) {
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

  useEffect(() => {
    if (!canSwitchCustomers(user)) return;
    if (!Array.isArray(customers) || customers.length === 0) return;

    const ok = customers.some(
      (c) => String(c.id) === String(selectedCustomerId)
    );
    if (!ok && selectedCustomerId) {
      setSelectedCustomerId("");
      clearCurrentCustomer();
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
      showAlert(msg, "error");
    }
  };

  const productLinks = {
    pulse: {
      seeMore: "https://example.com/pulse",
      signUp: "https://example.com/pulse/signup",
    },
    ptrs: {
      seeMore: "https://example.com/ptrs",
      signUp: "https://example.com/ptrs/signup",
    },
  };

  return (
    <Box
      sx={{
        padding: theme.spacing(4),
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Welcome to Your Solution Dashboard, {user?.firstName} {user?.lastName}
      </Typography>

      {canSwitchCustomers(user) && (
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
      <Typography variant="body1" gutterBottom>
        Select a solution below to get started.
      </Typography>

      <Grid container spacing={4} sx={{ marginTop: theme.spacing(2) }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              cursor: hasFeature("pulse") ? "pointer" : "default",
              opacity: hasFeature("pulse") ? 1 : 0.6,
            }}
            aria-disabled={!hasFeature("pulse")}
            {...(hasFeature("pulse") && {
              onClick: () => navigate("/pulse-solution"),
            })}
          >
            <CardContent>
              <Typography variant="h6">Pulse</Typography>
              <Typography variant="body2" color="textSecondary">
                Resource & Engagement Management
              </Typography>
              {!hasFeature("pulse") && (
                <Box sx={{ mt: 1 }}>
                  <Link
                    href={productLinks.pulse.seeMore}
                    target="_blank"
                    rel="noopener"
                  >
                    See more
                  </Link>
                  {user?.role === "Admin" && (
                    <>
                      {" | "}
                      <Link
                        href={productLinks.pulse.signUp}
                        target="_blank"
                        rel="noopener"
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              cursor: hasFeature("ptrs") ? "pointer" : "default",
              opacity: hasFeature("ptrs") ? 1 : 0.6,
            }}
            aria-disabled={!hasFeature("ptrs")}
            {...(hasFeature("ptrs") && {
              onClick: () => navigate("/ptrs"),
            })}
          >
            <CardContent>
              <Typography variant="h6">PTRS</Typography>
              <Typography variant="body2" color="textSecondary">
                Payment Times Reporting Scheme
              </Typography>
              {!hasFeature("ptrs") && (
                <Box sx={{ mt: 1 }}>
                  <Link
                    href={productLinks.ptrs.seeMore}
                    target="_blank"
                    rel="noopener"
                  >
                    See more
                  </Link>
                  {user?.role === "Admin" && (
                    <>
                      {" | "}
                      <Link
                        href={productLinks.ptrs.signUp}
                        target="_blank"
                        rel="noopener"
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
