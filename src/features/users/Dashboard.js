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
import { useEffect, useState, useMemo, useRef } from "react";
import {
  canSwitchCustomers,
  getCurrentCustomer,
  setCurrentCustomer,
  clearCurrentCustomer,
} from "../../lib/utils/";
import { useAlert } from "../../context";

export default function Dashboard() {
  const user = userService.userValue;
  const navigate = useNavigate();
  const theme = useTheme();
  const { showAlert } = useAlert();

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const currentScoped = useMemo(() => getCurrentCustomer(), []);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    currentScoped?.id || ""
  );
  const prevValidCustomerIdRef = useRef(currentScoped?.id || "");
  const isBoss = useMemo(() => canSwitchCustomers(user), [user]);

  useEffect(() => {
    if (!isBoss) return;
    let isActive = true;
    async function loadCustomers() {
      try {
        setLoadingCustomers(true);
        const list = await customerService.getAll();
        // const list = await customerService.getCustomersByAccess(user.id);
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
  }, [isBoss, showAlert, user.id]);

  const refreshEntitlements = async (customerId) => {
    const id = customerId ?? selectedCustomerId;
    try {
      await userService.reloadCustomerEntitlements(id);
      // Commit this id as the last known-good selection
      prevValidCustomerIdRef.current = id;
    } catch (e) {
      showAlert(
        e?.message ||
          "Failed to refresh customerEntitlements for the selected customer",
        "error"
      );
      // Roll back selection & scope so the UI reflects the last valid tenant
      const prevId = prevValidCustomerIdRef.current || "";
      setSelectedCustomerId(prevId);
      if (prevId) {
        const prevCustomer = customers.find(
          (c) => String(c.id) === String(prevId)
        );
        if (prevCustomer) {
          setCurrentCustomer({
            id: prevCustomer.id,
            name: prevCustomer.businessName,
          });
        }
      } else {
        clearCurrentCustomer();
      }
    }
  };

  const handleCustomerChange = (e) => {
    const value = e.target.value;
    setSelectedCustomerId(value);
    const selected = customers.find((c) => String(c.id) === String(value));
    if (selected) {
      setCurrentCustomer({
        id: selected.id,
        name: selected.businessName,
      });
      // Trigger refresh using the newly selected id (avoid stale state)
      refreshEntitlements(selected.id);
    } else {
      clearCurrentCustomer();
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

      {isBoss && (
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
              <MenuItem value="">
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
            sx={{ cursor: "pointer" }}
            {...(userService.hasFeature("pulse") && {
              onClick: () => navigate("/pulse-solution"),
            })}
          >
            <CardContent>
              <Typography variant="h6">Pulse</Typography>
              <Typography variant="body2" color="textSecondary">
                Resource & Engagement Management
              </Typography>
              {!userService.hasFeature("pulse") && (
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
            sx={{ cursor: "pointer" }}
            {...(userService.hasFeature("ptrs") && {
              onClick: () => navigate("/ptrs"),
            })}
          >
            <CardContent>
              <Typography variant="h6">PTRS</Typography>
              <Typography variant="body2" color="textSecondary">
                Payment Times Reporting Scheme
              </Typography>
              {!userService.hasFeature("ptrs") && (
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
