import { Box, Button, Card, Typography } from "@mui/material";
import { useNavigate } from "react-router";

export default function PtrsDashboard() {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        PTRS Reporting Periods
      </Typography>

      {/* Replace this with a mapped list of real reports if needed */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="body1">Jul–Dec 2024</Typography>
        <Button variant="contained" onClick={() => navigate("/ptrs/abc123")}>
          Resume Report
        </Button>
      </Card>

      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="body1">Data Preparation</Typography>
        <Button
          variant="outlined"
          onClick={() => navigate("/data/ptrs/console")}
        >
          Go to Data Console
        </Button>
      </Card>

      <Card sx={{ p: 2 }}>
        <Typography variant="body1">Board Insights</Typography>
        <Button variant="outlined" onClick={() => navigate("/ptrs/metrics")}>
          View Dashboard
        </Button>
      </Card>
    </Box>
  );
}
