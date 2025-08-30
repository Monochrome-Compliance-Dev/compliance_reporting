import { Stack, Paper, Typography, Button } from "@mui/material";
import { Link } from "react-router";

export default function PulseAdminConsole() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Pulse Admin Console</Typography>
      <Typography variant="body2" color="text.secondary">
        Quick links to manage Pulse data while the dashboard is being built.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Resources
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Add, edit, and manage staff/resources.
          </Typography>
          <Button
            component={Link}
            to="/pulse-solution/admin/resources"
            variant="contained"
          >
            Open Resources
          </Button>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Clients
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Add and maintain your client list.
          </Typography>
          <Button
            component={Link}
            to="/pulse-solution/admin/clients"
            variant="contained"
          >
            Open Clients
          </Button>
        </Paper>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Engagements
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Link clients and resources, define the work.
          </Typography>
          <Button
            component={Link}
            to="/pulse-solution/admin/engagements"
            variant="contained"
          >
            Open Engagements
          </Button>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Timesheets
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            View, edit, and manage timesheets.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              component={Link}
              to="/pulse-solution/timesheets"
              variant="contained"
            >
              My Timesheets
            </Button>
            <Button
              component={Link}
              to="/pulse-solution/timesheets/edit"
              variant="outlined"
            >
              Edit Current
            </Button>
            <Button
              component={Link}
              to="/pulse-solution/timesheets/manage"
              variant="outlined"
            >
              Manage
            </Button>
          </Stack>
        </Paper>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Resource Allocation
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            See who’s on what and spot over-allocation at a glance.
          </Typography>
          <Button
            component={Link}
            to="/pulse-solution/admin/resources/allocation"
            variant="contained"
          >
            Open Allocation View
          </Button>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Budgets
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Build and review budgets.
          </Typography>
          <Button
            component={Link}
            to="/pulse-solution/admin/budgets"
            variant="contained"
          >
            Open Budgets
          </Button>
        </Paper>
      </Stack>
    </Stack>
  );
}
