import { Stack, Paper, Typography, Button } from "@mui/material";
import { Link } from "react-router";

export default function PulseAdminConsole() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Pulse Admin Console</Typography>
      <Typography variant="body2" color="text.secondary">
        Manage your clients, trackables, budgets and resources from here.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        {/* Clients not needed for now */}
        {/* <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Clients
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Add and maintain your client list.
          </Typography>
          <Button
            component={Link}
            to="/v2/pulse/admin/clients"
            variant="contained"
          >
            Open Clients
          </Button>
        </Paper> */}

        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Budgets
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Create, review and version budgets.
          </Typography>
          <Button
            component={Link}
            to="/v2/pulse/admin/budgets"
            variant="contained"
          >
            Open Budgets
          </Button>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Trackables
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Define work and group budgets under trackables.
          </Typography>
          <Button
            component={Link}
            to="/v2/pulse/admin/trackables"
            variant="contained"
          >
            Open Trackables
          </Button>
        </Paper>
      </Stack>

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
            to="/v2/pulse/admin/resources"
            variant="contained"
          >
            Open Resources
          </Button>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Allocations
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            See who’s on what and spot over-allocation at a glance.
          </Typography>
          <Button
            component={Link}
            to="/v2/pulse/admin/allocations"
            variant="contained"
          >
            Open Allocation View
          </Button>
        </Paper>
      </Stack>
    </Stack>
  );
}
