import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router";
import { PulseProvider, useAlert } from "context";
import { Box, Typography } from "@mui/material";
import RequireFeature from "routes/RequireFeature";

import DashboardV2 from "../landing/LandingV2";
import BossLayout from "../layouts/BossLayout";
import { getBossRoutes } from "../routes/bossRoutes";
import PtrsV2 from "../ptrs/PtrsV2";
import { PtrsV2Provider } from "../ptrs/context/PtrsV2Context";
import ComplianceDashboardLayout from "components/layouts/ComplianceDashboardLayout";
const PulseV2 = lazy(() => import("../pulse/PulseV2"));

function V2Layout() {
  const { showAlert } = useAlert();
  useEffect(() => {
    if (typeof showAlert === "function") {
      showAlert("Welcome to v2", "info");
    }
  }, [showAlert]);
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

export default function AppV2() {
  return (
    <Suspense fallback={<Box sx={{ p: 3 }}>Loading…</Box>}>
      <Routes>
        <Route element={<V2Layout />}>
          {/* /v2 */}
          <Route index element={<DashboardV2 />} />

          {/* /v2/dashboard – explicit alias */}
          <Route path="dashboard" element={<DashboardV2 />} />

          <Route
            path="ptrs/*"
            element={
              <PtrsV2Provider>
                <RequireFeature feature="ptrs">
                  <ComplianceDashboardLayout title="PTRS v2" module="ptrs">
                    <PtrsV2 />
                  </ComplianceDashboardLayout>
                </RequireFeature>
              </PtrsV2Provider>
            }
          />

          <Route
            path="pulse/*"
            element={
              <PulseProvider>
                <RequireFeature feature="pulse">
                  <PulseV2 />
                </RequireFeature>
              </PulseProvider>
            }
          />

          <Route path="boss" element={<BossLayout />}>
            {getBossRoutes()}
          </Route>

          {/* Catch-all under /v2 → send back to /v2 */}
          <Route path="*" element={<Navigate to="/v2" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
