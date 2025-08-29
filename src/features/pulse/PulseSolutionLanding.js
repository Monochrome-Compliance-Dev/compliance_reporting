import { Box, Grid, Paper, Typography, Stack } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { Link } from "react-router";

// Tile-based landing for Pulse entry point.
// Routes are configurable via the tiles array if your paths differ.
const tiles = [
  {
    key: "dashboard",
    title: "Dashboard",
    description: "Monitor engagements, utilisation and status at a glance.",
    icon: <DashboardIcon fontSize="large" aria-hidden />,
    to: "/pulse/dashboard",
  },
  {
    key: "admin",
    title: "Admin Console",
    description: "Manage customers, resources, roles, and data settings.",
    icon: <AdminPanelSettingsIcon fontSize="large" aria-hidden />,
    to: "/pulse/admin",
  },
];

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
          Welcome to Pulse
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {tiles.map(({ key, ...tile }) => (
          <Grid key={key} item xs={12} sm={6}>
            <Tile {...tile} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
