import { Box, Grid, Paper, Typography, Stack } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeIcon from "@mui/icons-material/Badge";
import { Link } from "react-router";
import { userService } from "slices/users/userApi";

// Tile-based landing for Pulse entry point.
// Routes are configurable via the tiles array if your paths differ.

function Tile({ icon, title, description, to }) {
  return (
    <Paper
      component={Link}
      to={to}
      elevation={3}
      sx={{
        p: { xs: 2, sm: 3 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        outline: "none",
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
        transition: "transform 120ms ease, box-shadow 120ms ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
        "&:focus-visible": { boxShadow: 6 },
      }}
      role="link"
      tabIndex={0}
      aria-label={`${title} – navigate`}
    >
      <Stack spacing={2}>
        <Box aria-hidden sx={{ display: "inline-flex" }}>
          {icon}
        </Box>
        <Typography variant="h5" component="h2">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </Paper>
  );
}

export default function PulseSolutionLanding() {
  const user = userService.userValue; // Get the current user

  const workspaceDescription =
    user?.role === "Admin" || user?.role === "Boss"
      ? "Update your contribution, review history, and manage your team’s contributions."
      : "Update your contribution and review your submission history.";

  // All tiles defined in one place for easier updates
  const tiles = [
    {
      key: "dashboard",
      title: "Dashboard",
      description: "Monitor trackables, utilisation and status at a glance.",
      icon: <DashboardIcon fontSize="large" aria-hidden />,
      to: "dashboard",
      roles: ["Admin", "Boss"],
    },
    {
      key: "admin",
      title: "Admin Console",
      description: "Manage clients, trackables, budgets and resources.",
      icon: <AdminPanelSettingsIcon fontSize="large" aria-hidden />,
      to: "admin",
      roles: ["Admin", "Boss"],
    },
    {
      key: "maximiser",
      title: "Maximiser",
      description: "AI-assisted insights for contributions and trackables.",
      icon: <DashboardIcon fontSize="large" aria-hidden />,
      to: "maximiser",
      roles: ["User", "Admin", "Boss"],
    },
    {
      key: "workplace",
      title: "Workspace",
      description: workspaceDescription,
      icon: <BadgeIcon fontSize="large" aria-hidden />,
      to: "workplace",
      roles: ["User", "Admin", "Boss"],
    },
  ];

  const displayedTiles = tiles.filter((t) => t.roles?.includes(user?.role));

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 4 },
        py: { xs: 2, sm: 3 },
        maxWidth: 1400,
        mx: "auto",
      }}
    >
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Pulse, {user?.firstName} {user?.lastName}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {displayedTiles.map(({ key, ...tile }) => (
          <Grid key={key} size={{ xs: 12, sm: 6 }}>
            <Tile {...tile} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
