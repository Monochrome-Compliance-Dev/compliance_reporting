import { Box, Paper, Typography } from "@mui/material";

const HowSection = ({ how }) => {
  const { steps } = how;
  return (
    <>
      <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
        How It Works
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {steps.map((step, idx) => (
          <Paper key={idx} sx={{ p: 2 }}>
            <Typography variant="subtitle2">{step.step}</Typography>
            <Typography variant="body2">{step.description}</Typography>
          </Paper>
        ))}
      </Box>
    </>
  );
};

export default HowSection;
