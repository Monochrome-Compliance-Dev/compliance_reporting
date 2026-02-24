import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Stack,
} from "@mui/material";
import { Link as RouterLink } from "react-router";
import { userService } from "../../../services/";

// Simple role guard using plain strings to avoid tight coupling to enums
const isManager = () => {
  const role = userService?.userValue?.role;
  if (!role) return false;
  // Treat Admin/Boss as managers; adjust if you add more elevated roles later
  return (
    role === "Admin" ||
    role === "Boss" ||
    role === "Role.Admin" ||
    role === "Role.Boss"
  );
};

export default function Workspace() {
  const manager = isManager();

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            My Workplace
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your hub for day‑to‑day work. Start here to update your current
            timesheet, review your past entries, and—if you manage a team—handle
            their timesheets too.
          </Typography>
        </Box>

        <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="overline" component="div" sx={{ mb: 1 }}>
            Timesheets
          </Typography>
          <List disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/pulse-solution/workplace/timesheets/current"
            >
              <ListItemText
                primary="Update current timesheet"
                secondary="Jump straight to this period’s timesheet"
              />
            </ListItemButton>

            <ListItemButton
              component={RouterLink}
              to="/pulse-solution/workplace/timesheets"
            >
              <ListItemText
                primary="My timesheets"
                secondary="See and open your previous submissions"
              />
            </ListItemButton>

            {manager && (
              <ListItemButton
                component={RouterLink}
                to="/pulse-solution/workplace/timesheets/manage"
              >
                <ListItemText
                  primary="Manage team timesheets"
                  secondary="View, approve, or follow up on your team’s entries"
                />
              </ListItemButton>
            )}
          </List>
        </Paper>
      </Stack>
    </Box>
  );
}
