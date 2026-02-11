import { Outlet } from "react-router";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useLocation } from "react-router";

function BossLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  const handleNavClick = (path) => {
    if (currentPath !== path) {
      navigate(path);
    }
  };

  const bossBase = "/v2/boss";

  return (
    <Box sx={{ display: "flex", minHeight: "100%" }}>
      {/* Side nav */}
      <Box
        component="nav"
        sx={{
          width: 240,
          borderRight: (t) => `1px solid ${t.palette.divider}`,
          p: 2,
          boxSizing: "border-box",
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Boss admin
        </Typography>
        <List dense>
          <ListItemButton
            selected={currentPath.startsWith(`${bossBase}/customers`)}
            onClick={() => handleNavClick(`${bossBase}/customers`)}
          >
            <ListItemText primary="Customers" />
          </ListItemButton>
        </List>
      </Box>

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          p: 3,
          boxSizing: "border-box",
          backgroundColor: (t) => t.palette.background.default,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default BossLayout;
