// Pulse v2 module shell: nested routes under /v2/pulse/*
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
} from "@mui/material";
import { PulseDemoProvider, usePulseDemo } from "./PulseDemoContext";

// --- Pages (themed stubs you can swap out later) ---

function PulseOverviewPage() {
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof showAlert === "function")
      showAlert("Pulse v2 ready for demo", "info");
  }, [showAlert]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Pulse v2</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate("dashboard")}>
            Dashboard
          </Button>
          <Button variant="outlined" onClick={() => navigate("admin")}>
            Admin
          </Button>
          <Button variant="contained" onClick={() => navigate("workplace")}>
            Open Workspace
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Quick view of utilisation, billable %, capacity and budget burn.
              </Typography>
              <Button variant="outlined" onClick={() => navigate("dashboard")}>
                View dashboard
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Admin
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage resources, engagements and budgets.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("admin/resources")}
                >
                  Resources
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("admin/engagements")}
                >
                  Engagements
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("admin/budgets")}
                >
                  Budgets
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Workspace
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Timesheets with Maximiser hooks and approvals flow.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={() => navigate("workplace")}
                >
                  Open
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("workplace/timesheets/current")}
                >
                  This week
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function StatCard({ title, value, helper }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1">{title}</Typography>
        <Typography variant="h4" sx={{ mt: 1 }}>
          {value}
        </Typography>
        {helper ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.5 }}
          >
            {helper}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PulseDashboardPage() {
  const { metrics } = usePulseDemo();

  const utilText = `${metrics.utilisation.toFixed(0)}%`;
  const billableText = `${metrics.billablePct.toFixed(0)}%`;
  const burnText = `${metrics.budgetBurn.toFixed(0)}%`;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Pulse Dashboard
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Utilisation"
            value={utilText}
            helper={`${metrics.summary.workedHours}/${metrics.summary.capacity} hrs`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Billable %"
            value={billableText}
            helper={`${metrics.summary.billableHours} billable`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Budget burn"
            value={burnText}
            helper={`${metrics.summary.totalBudgetHours} budget hrs`}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

function PulseAdminIndex() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Pulse Admin
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Choose a section: Resources, Engagements, Budgets.
      </Typography>
    </Box>
  );
}
function PulseResourcesPage() {
  const { state } = usePulseDemo();
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Resources
      </Typography>
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent sx={{ p: 0 }}>
              <Box
                component="table"
                sx={{ width: "100%", borderCollapse: "collapse" }}
              >
                <Box
                  component="thead"
                  sx={{ bgcolor: (t) => t.palette.action.hover }}
                >
                  <Box component="tr">
                    <Box component="th" sx={{ textAlign: "left", p: 1.5 }}>
                      Name
                    </Box>
                    <Box component="th" sx={{ textAlign: "left", p: 1.5 }}>
                      Role
                    </Box>
                    <Box component="th" sx={{ textAlign: "right", p: 1.5 }}>
                      Rate
                    </Box>
                    <Box component="th" sx={{ textAlign: "right", p: 1.5 }}>
                      Capacity
                    </Box>
                  </Box>
                </Box>
                <Box component="tbody">
                  {state.resources.map((r) => (
                    <Box
                      key={r.id}
                      component="tr"
                      sx={{
                        borderTop: (t) => `1px solid ${t.palette.divider}`,
                      }}
                    >
                      <Box component="td" sx={{ p: 1.5 }}>
                        {r.name}
                      </Box>
                      <Box component="td" sx={{ p: 1.5 }}>
                        {r.role}
                      </Box>
                      <Box component="td" sx={{ p: 1.5, textAlign: "right" }}>
                        ${r.billableRate}/hr
                      </Box>
                      <Box component="td" sx={{ p: 1.5, textAlign: "right" }}>
                        {r.capacityPerWeek} hrs/wk
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
function PulseEngagementsPage() {
  const { state } = usePulseDemo();
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Trackables
      </Typography>
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent sx={{ p: 0 }}>
              <Box
                component="table"
                sx={{ width: "100%", borderCollapse: "collapse" }}
              >
                <Box
                  component="thead"
                  sx={{ bgcolor: (t) => t.palette.action.hover }}
                >
                  <Box component="tr">
                    <Box component="th" sx={{ textAlign: "left", p: 1.5 }}>
                      Customer
                    </Box>
                    <Box component="th" sx={{ textAlign: "left", p: 1.5 }}>
                      Name
                    </Box>
                    <Box component="th" sx={{ textAlign: "left", p: 1.5 }}>
                      Status
                    </Box>
                    <Box component="th" sx={{ textAlign: "right", p: 1.5 }}>
                      Budget (hrs)
                    </Box>
                  </Box>
                </Box>
                <Box component="tbody">
                  {state.trackables.map((t) => (
                    <Box
                      key={t.id}
                      component="tr"
                      sx={{
                        borderTop: (th) => `1px solid ${th.palette.divider}`,
                      }}
                    >
                      <Box component="td" sx={{ p: 1.5 }}>
                        {t.customer}
                      </Box>
                      <Box component="td" sx={{ p: 1.5 }}>
                        {t.name}
                      </Box>
                      <Box component="td" sx={{ p: 1.5 }}>
                        {t.status}
                      </Box>
                      <Box component="td" sx={{ p: 1.5, textAlign: "right" }}>
                        {t.budgetHours ?? "—"}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
function PulseBudgetsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Budgets
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Placeholder for budget builder and summary.
      </Typography>
    </Box>
  );
}

function PulseWorkspaceIndex() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Workspace
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Timesheets and approvals, with Maximiser insights.
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button variant="contained">Start timesheet</Button>
        <Button variant="outlined">View submitted</Button>
      </Stack>
    </Box>
  );
}
function TimesheetCurrentPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        This week’s timesheet
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Placeholder editor (hours grid, notes, submit).
      </Typography>
    </Box>
  );
}
function TimesheetManagePage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Manage timesheets
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Approvals, bulk actions, filters.
      </Typography>
    </Box>
  );
}
function TimesheetViewPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        View timesheet
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Read-only view with audit trail.
      </Typography>
    </Box>
  );
}

// --- Layout for the module ---

function PulseV2Layout() {
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
          Pulse v2
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        <PulseDemoProvider>
          <Outlet />
        </PulseDemoProvider>
      </Box>
    </Box>
  );
}

// --- Router for /v2/pulse/* ---

export default function PulseV2() {
  return (
    <Routes>
      <Route element={<PulseV2Layout />}>
        <Route index element={<PulseOverviewPage />} />
        <Route path="dashboard" element={<PulseDashboardPage />} />
        <Route path="admin" element={<PulseAdminIndex />} />
        <Route path="admin/resources" element={<PulseResourcesPage />} />
        <Route path="admin/engagements" element={<PulseEngagementsPage />} />
        <Route path="admin/budgets" element={<PulseBudgetsPage />} />
        <Route path="workplace" element={<PulseWorkspaceIndex />} />
        <Route
          path="workplace/timesheets/current"
          element={<TimesheetCurrentPage />}
        />
        <Route
          path="workplace/timesheets/manage"
          element={<TimesheetManagePage />}
        />
        <Route
          path="workplace/timesheets/view/:id"
          element={<TimesheetViewPage />}
        />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
