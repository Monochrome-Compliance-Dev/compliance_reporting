import React from "react";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { useNavigate } from "react-router";

export default function BookingThankyou() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: 4,
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Your booking is confirmed!
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        We've emailed you the details. We look forward to speaking with you.
      </Typography>
      <Button
        variant="outlined"
        onClick={() => navigate("/")}
        sx={{ mt: 2 }}
        color="secondary"
      >
        Back to Home
      </Button>
    </Box>
  );
}
