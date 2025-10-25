import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router";
import { PtrsProvider, PulseProvider, useAlert } from "context";
import { Box, Typography } from "@mui/material";
import RequireFeature from "routes/RequireFeature";

import PtrsV2 from "../ptrs/PtrsV2";
import ComplianceDashboardLayout from "components/layouts/ComplianceDashboardLayout";
import DashboardV2 from "../dashboard/DashboardV2";
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
          <Route index element={<DashboardV2 />} />

          <Route
            path="ptrs/*"
            element={
              <PtrsProvider>
                <RequireFeature feature="ptrs">
                  <ComplianceDashboardLayout title="PTRS v2" module="ptrs">
                    <PtrsV2 />
                  </ComplianceDashboardLayout>
                </RequireFeature>
              </PtrsProvider>
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

          <Route path="*" element={<Navigate to="." replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
