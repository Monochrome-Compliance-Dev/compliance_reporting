// PTRS v2 module shell: nested routes under /v2/ptrs/*
// Uses react-router (not react-router-dom). MUI for theme-consistent UI.

import { useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router";
import { useAlert } from "../../context/";
import {
  Box,
  Typography,
  Stack,
  Button,
  Card,
  CardContent,
  Grid,
  Link,
} from "@mui/material";

// --- Pages (themed stubs you can swap out later) ---

function PtrsOverviewPage() {
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof showAlert === "function")
      showAlert("PTRS v2 ready to configure", "info");
  }, [showAlert]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">PTRS v2</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate("metrics")}>
            Metrics
          </Button>
          <Button variant="outlined" onClick={() => navigate("settings")}>
            Settings
          </Button>
          <Button variant="contained" onClick={() => navigate("upload")}>
            Upload data
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Get started
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload your TCP dataset, review exclusions, and confirm
                reporting period details.
              </Typography>
              <Button variant="contained" onClick={() => navigate("upload")}>
                Start upload
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                View metrics
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                See average payment time, on‑time % and invoices‑within buckets.
                Fully aligned to the regulator’s formulas.
              </Typography>
              <Button variant="outlined" onClick={() => navigate("metrics")}>
                Open metrics
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Need help?{" "}
          <Link href="/resources/submission-checklist" underline="hover">
            Read the submission checklist
          </Link>
          .
        </Typography>
      </Box>
    </Box>
  );
}

function PtrsUploadPage() {
  const { showAlert } = useAlert();
  useEffect(() => {
    if (typeof showAlert === "function")
      showAlert("Upload your TCP CSV to begin", "info");
  }, [showAlert]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Upload
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        This is a placeholder. Drop in your v2 DataUploadReview when ready.
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Coming soon: drag‑and‑drop CSV, live ingest progress, exclusion
            wizard.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

function PtrsMetricsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Metrics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Placeholder charts. Wire the v2 metrics components here.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1">Average payment time</Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                —
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1">% paid within terms</Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                —
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function PtrsSettingsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Placeholder for entity mappings, reporting period settings, and
        regulator alignment toggles.
      </Typography>
    </Box>
  );
}

// --- Layout for the module ---

function PtrsV2Layout() {
  return (
    <Box sx={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          px: 2,
          py: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          PTRS v2
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

// --- Router for /v2/ptrs/* ---

export default function PtrsV2() {
  return (
    <Routes>
      <Route element={<PtrsV2Layout />}>
        <Route index element={<PtrsOverviewPage />} />
        <Route path="upload" element={<PtrsUploadPage />} />
        <Route path="metrics" element={<PtrsMetricsPage />} />
        <Route path="settings" element={<PtrsSettingsPage />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
