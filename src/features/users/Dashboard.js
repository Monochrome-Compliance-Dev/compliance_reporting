import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router";
import { userService } from "../../services";

export default function Dashboard() {
  const user = userService.userValue; // Get the current user
  const navigate = useNavigate();
  const theme = useTheme(); // Access the theme

  return (
    <Box
      sx={{
        padding: theme.spacing(4),
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Welcome to Your Compliance Dashboard, {user?.firstName} {user?.lastName}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Select a compliance product below to get started.
      </Typography>

      <Grid container spacing={4} sx={{ marginTop: theme.spacing(2) }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ cursor: "pointer" }} onClick={() => navigate("/ptrs")}>
            <CardContent>
              <Typography variant="h6">PTRS</Typography>
              <Typography variant="body2" color="textSecondary">
                Payment Times Reporting Scheme
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ cursor: "pointer" }} onClick={() => navigate("/esg")}>
            <CardContent>
              <Typography variant="h6">ESG</Typography>
              <Typography variant="body2" color="textSecondary">
                Environmental, Social & Governance Reporting
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ cursor: "pointer" }} onClick={() => navigate("/ms")}>
            <CardContent>
              <Typography variant="h6">Modern Slavery</Typography>
              <Typography variant="body2" color="textSecondary">
                Modern Slavery Compliance Reporting
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ cursor: "pointer" }}>
            <CardContent>
              <Typography variant="h6">Coming Soon</Typography>
              <Typography variant="body2" color="textSecondary">
                Future Compliance Modules
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
