import { Typography, Box } from "@mui/material";

const EsgSummary = ({ indicators = [], metrics = [] }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        ESG Reporting Summary
      </Typography>
      <Typography variant="body2">
        Total Indicators: {indicators.length}
      </Typography>
      <Typography variant="body2">Total Metrics: {metrics.length}</Typography>
    </Box>
  );
};

export default EsgSummary;
