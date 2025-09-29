// v2 application shell: nested routes module (no BrowserRouter here).
// Uses react-router (not react-router-dom). MUI components so globalTheme drives fonts/colors/spacing.

import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router";
import { useAlert } from "../../context/";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RequireFeature from "../../routes/RequireFeature";

// If/when real screens exist, swap these out for actual imports, e.g.:
// const DashboardV2 = lazy(() => import('../dashboard/DashboardV2'));
// const PTRSV2 = lazy(() => import('../ptrs/PtrsV2'));
// const PulseV2 = lazy(() => import('../pulse/PulseV2'));

// Temporary themed placeholders to keep routing functional without breaking imports.
// They use MUI + theme so the globalTheme controls typography and colors immediately.
const DashboardV2 = lazy(async () => ({
  default: function DashboardV2() {
    const theme = useTheme();
    const navigate = useNavigate();

    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          v2 Dashboard
        </Typography>
        <Typography
          variant="body1"
          sx={{ mb: 3, color: theme.palette.text.secondary }}
        >
          Choose a module to explore. These are wired and ready for real screens
          to be swapped in.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
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
                    >
                      Open PTRS v2
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
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
                    >
                      Open Pulse v2
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  },
}));

const PTRSV2 = lazy(async () => ({
  default: function PTRSV2() {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          PTRS v2
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Placeholder screen. Hook real PTRS v2 routes/components under{" "}
          <code>/v2/ptrs/*</code>.
        </Typography>
      </Box>
    );
  },
}));

const PulseV2 = lazy(async () => ({
  default: function PulseV2() {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Pulse v2
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Placeholder screen. Hook real Pulse v2 routes/components under{" "}
          <code>/v2/pulse/*</code>.
        </Typography>
      </Box>
    );
  },
}));

function V2Layout() {
  // Respect existing AlertContext instead of inventing new alert plumbing.
  const { showAlert } = useAlert();

  // Example: fire a one-off info alert when v2 area mounts (safe deps, no disabled warnings).
  useEffect(() => {
    if (typeof showAlert === "function") {
      showAlert("Welcome to v2", "info");
    }
  }, [showAlert]);

  // Keep layout minimal – app already has a global AppBar. This is the content area.
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Monochrome Compliance · v2
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

/**
 * AppV2
 * Mount this component at "/v2/*" from your main app.
 * Example:
 *   <Route path="/v2/*" element={<AppV2 />} />
 */
export default function AppV2() {
  return (
    <Suspense fallback={<Box sx={{ p: 3 }}>Loading…</Box>}>
      <Routes>
        <Route element={<V2Layout />}>
          <Route index element={<DashboardV2 />} />
          <Route
            path="ptrs/*"
            element={
              <RequireFeature feature="ptrs">
                <PTRSV2 />
              </RequireFeature>
            }
          />
          <Route
            path="pulse/*"
            element={
              <RequireFeature feature="pulse">
                <PulseV2 />
              </RequireFeature>
            }
          />
          {/* Unknown v2 paths → v2 index */}
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
