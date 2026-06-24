import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAlert } from "context/";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Stack,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  canSwitchCustomers,
  getCurrentCustomer,
  setCurrentCustomer,
  clearCurrentCustomer,
  onCustomerChange,
} from "shared/utils";
import { userService } from "slices/users/userApi";
import { customersApi } from "slices/customers/customersApi";
import { listProfiles } from "slices/dataHub/services/dhApi";

export default function Landing() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // --- User + entitlements ---
  const [user, setUser] = useState(userService.userValue);
  useEffect(() => {
    const sub = userService.user.subscribe((u) => setUser(u));
    return () => sub.unsubscribe();
  }, []);
  const hasFeature = (f) =>
    Array.isArray(user?.entitlements) && user.entitlements.includes(f);
  const hasDataHubAccess = hasFeature("dataHub") || hasFeature("ptrs");

  // --- Acting-on-behalf switcher ---
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    getCurrentCustomer()?.id || user?.customerId || "",
  );
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(
    getCurrentCustomer()?.profileId || "",
  );

  // keep local state in sync with global tenant changes
  useEffect(() => {
    const unsubscribe = onCustomerChange?.((cust) => {
      setSelectedCustomerId(cust?.id || "");
      setSelectedProfileId(cust?.profileId || "");
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
        const list = await customersApi.getCustomersByAccess(userId);
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

  useEffect(() => {
    const currentCustomerId = selectedCustomerId || getCurrentCustomer()?.id;

    if (!currentCustomerId) {
      setProfiles([]);
      setSelectedProfileId("");
      return;
    }

    let isActive = true;

    async function loadProfiles() {
      try {
        setLoadingProfiles(true);
        const result = await listProfiles(currentCustomerId);
        const items = Array.isArray(result?.items) ? result.items : [];
        if (!isActive) return;

        setProfiles(items);

        const current = getCurrentCustomer();
        const existingProfileId = current?.profileId || "";
        const stillValid = items.some(
          (profile) => String(profile.id) === String(existingProfileId),
        );

        if (stillValid) {
          setSelectedProfileId(existingProfileId);
          return;
        }

        if (items.length === 1) {
          const onlyProfile = items[0];
          setSelectedProfileId(onlyProfile.id);
          if (current?.id) {
            setCurrentCustomer({
              ...current,
              profileId: onlyProfile.id,
              profileName:
                onlyProfile.name || onlyProfile.profileName || onlyProfile.id,
            });
          }
          return;
        }

        setSelectedProfileId("");
        if (current?.id && current.profileId) {
          const { profileId, profileName, ...rest } = current;
          setCurrentCustomer(rest);
        }
      } catch (e) {
        if (!isActive) return;
        setProfiles([]);
        setSelectedProfileId("");
        if (typeof showAlert === "function") {
          showAlert(e?.message || "Failed to load profiles", "error");
        }
      } finally {
        if (isActive) setLoadingProfiles(false);
      }
    }

    loadProfiles();

    return () => {
      isActive = false;
    };
  }, [selectedCustomerId, showAlert]);

  // validate selection against entitlements; clear if invalid
  useEffect(() => {
    if (!canSwitchCustomers(user)) return;
    if (!Array.isArray(customers) || customers.length === 0) return;
    const ok = customers.some(
      (c) => String(c.id) === String(selectedCustomerId),
    );
    if (!ok && selectedCustomerId) {
      setSelectedCustomerId("");
      clearCurrentCustomer();
      if (typeof showAlert === "function")
        showAlert(
          "You no longer have access to that customer. Selection cleared.",
          "warning",
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
    setSelectedProfileId("");
    setProfiles([]);
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

  const handleProfileChange = (e) => {
    const value = e.target.value;
    setSelectedProfileId(value);

    const selectedProfile = profiles.find(
      (profile) => String(profile.id) === String(value),
    );

    const current = getCurrentCustomer();
    if (!current?.id || !selectedProfile) return;

    setCurrentCustomer({
      ...current,
      profileId: selectedProfile.id,
      profileName:
        selectedProfile.name ||
        selectedProfile.profileName ||
        selectedProfile.id,
    });
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
        Use the customer selector and tiles below to manage trusted datasets,
        run analysis workflows or review Pulse activity.
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
                  (c) => String(c.id) === String(selectedCustomerId),
                )
                  ? selectedCustomerId
                  : ""
              }
              onChange={handleCustomerChange}
              renderValue={(val) => {
                if (!val) return "— None selected —";
                const found = customers.find(
                  (c) => String(c.id) === String(val),
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

          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth size="small" disabled={loadingProfiles}>
              <InputLabel id="acting-profile-label">Profile</InputLabel>
              <Select
                labelId="acting-profile-label"
                id="acting-profile"
                label="Profile"
                value={
                  profiles.some(
                    (profile) =>
                      String(profile.id) === String(selectedProfileId),
                  )
                    ? selectedProfileId
                    : ""
                }
                onChange={handleProfileChange}
                renderValue={(val) => {
                  if (!val) return "— Select profile —";
                  const found = profiles.find(
                    (profile) => String(profile.id) === String(val),
                  );
                  return found?.name || found?.profileName || found?.id;
                }}
              >
                {profiles.map((profile) => (
                  <MenuItem key={profile.id} value={profile.id}>
                    {profile.name || profile.profileName || profile.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {loadingProfiles && (
              <Box
                sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}
              >
                <CircularProgress size={16} />
                <Typography variant="caption">Loading profiles…</Typography>
              </Box>
            )}
            {!loadingProfiles && selectedCustomerId && !profiles.length && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                No profiles found for this customer.
              </Typography>
            )}
          </Box>
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            variant="outlined"
            sx={{
              cursor:
                hasDataHubAccess && selectedProfileId ? "pointer" : "default",
              opacity: hasDataHubAccess && selectedProfileId ? 1 : 0.6,
            }}
            aria-disabled={!hasDataHubAccess || !selectedProfileId}
            {...(hasDataHubAccess &&
              selectedProfileId && {
                onClick: () => navigate("data-hub"),
              })}
          >
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6">Data Hub</Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload and manage customer datasets for use across future
                  analysis modules.
                </Typography>
                <Box>
                  <Button
                    variant="contained"
                    disabled={!hasDataHubAccess || !selectedProfileId}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("data-hub");
                    }}
                  >
                    Manage datasets
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            variant="outlined"
            sx={{
              cursor: hasFeature("ptrs") ? "pointer" : "default",
              opacity: hasFeature("ptrs") ? 1 : 0.6,
            }}
            aria-disabled={!hasFeature("ptrs")}
            {...(hasFeature("ptrs") && { onClick: () => navigate("ptrs") })}
          >
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6">PTRS</Typography>
                <Typography variant="body2" color="text.secondary">
                  Modernised PTRS workflow, aligned to regulator formulas and
                  audit logging.
                </Typography>
                <Box>
                  <Button
                    variant="contained"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("ptrs");
                    }}
                    disabled={!hasFeature("ptrs")}
                  >
                    Open PTRS
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            variant="outlined"
            sx={{
              cursor: hasFeature("pulse") ? "pointer" : "default",
              opacity: hasFeature("pulse") ? 1 : 0.6,
            }}
            aria-disabled={!hasFeature("pulse")}
            {...(hasFeature("pulse") && {
              onClick: () => navigate("pulse"),
            })}
          >
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6">Pulse</Typography>
                <Typography variant="body2" color="text.secondary">
                  Engagements, budgets, and timesheets — with Maximiser
                  insights.
                </Typography>
                <Box>
                  <Button
                    variant="contained"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("pulse");
                    }}
                    disabled={!hasFeature("pulse")}
                  >
                    Open Pulse
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
                    onClick={() => navigate("boss/customers")}
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
