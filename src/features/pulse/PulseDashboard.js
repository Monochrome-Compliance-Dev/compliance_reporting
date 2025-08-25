import {
  Container,
  Box,
  Stack,
  Paper,
  Typography,
  Button,
} from "@mui/material";
import { Link } from "react-router";

const PulseDashboard = () => {
  return (
    <Container>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mt={2}
        mb={2}
      >
        <Typography variant="h4">Pulse Dashboard</Typography>
        <Button component={Link} to="/pulse/admin" variant="outlined">
          Open Admin Console
        </Button>
      </Box>

      {/* KPI Overview / Charts placeholder */}
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 3, minHeight: 240 }}>
          <Typography variant="h6" gutterBottom>
            KPI Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Charts and insights coming soon…
          </Typography>
        </Paper>

        {/* Additional dashboard cards can go here as you build them out */}
        <Paper variant="outlined" sx={{ p: 3, minHeight: 180 }}>
          <Typography variant="h6" gutterBottom>
            Utilisation & Capacity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Placeholder for utilisation and capacity trends.
          </Typography>
        </Paper>
      </Stack>
    </Container>
  );
};

export default PulseDashboard;
