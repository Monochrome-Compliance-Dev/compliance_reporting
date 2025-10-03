// v2 application shell: nested routes module (no BrowserRouter here).
// Uses react-router (not react-router-dom). MUI components so globalTheme drives fonts/colors/spacing.

import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router";
import { useAlert } from "../../context/";
import { Box, Typography } from "@mui/material";
import RequireFeature from "../../routes/RequireFeature";

// If/when real screens exist, swap these out for actual imports, e.g.:
// const DashboardV2 = lazy(() => import('../dashboard/DashboardV2'));
import PtrsV2 from "../ptrs/PtrsV2";
import ComplianceDashboardLayout from "../../components/layouts/ComplianceDashboardLayout";
import DashboardV2 from "../dashboard/DashboardV2";
// const PulseV2 = lazy(() => import('../pulse/PulseV2'));

// Temporary themed placeholders to keep routing functional without breaking imports.
// They use MUI + theme so the globalTheme controls typography and colors immediately.

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
                <ComplianceDashboardLayout title="PTRS v2" module="ptrs">
                  <PtrsV2 />
                </ComplianceDashboardLayout>
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
