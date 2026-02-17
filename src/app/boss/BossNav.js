import { AppBar, Box, Button, Toolbar } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router";

export default function BossNav() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        backgroundImage: "none",
        boxShadow: "none",
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Button variant="text" onClick={() => navigate("/app/boss/customers")}>
          Customers
        </Button>

        <Button variant="text" onClick={() => navigate("/app/boss/users")}>
          Users
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate("/app")}
        >
          Exit Boss Mode
        </Button>
      </Toolbar>
    </AppBar>
  );
}
