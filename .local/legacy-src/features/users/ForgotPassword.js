import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  TextField,
  useTheme,
  Paper,
  Grid,
  ButtonGroup,
  Alert,
} from "@mui/material";
import { userService } from "../../services";

export default function ForgotPassword() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAlert({ type: "error", message: "Invalid email address" });
      return;
    }

    try {
      const response = await userService.forgotPassword(email);
      setAlert({
        type: "success",
        message:
          response.message ||
          "Password reset successfully. Please check your email.",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Error resetting password",
      });
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        padding: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          maxWidth: 800,
          width: "100%",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="h4" gutterBottom align="center">
          Reset Password
        </Typography>
        {alert && (
          <Alert severity={alert.type} sx={{ mb: 2 }}>
            {alert.message}
          </Alert>
        )}
        <form
          onSubmit={handleSubmit}
          id="forgot-password-form"
          style={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Email"
                name="email"
                type="email"
                autoComplete="off"
                fullWidth
                required
                defaultValue=""
              />
            </Grid>
          </Grid>
          <ButtonGroup
            variant="contained"
            aria-label="outlined primary button group"
            sx={{ display: "flex", justifyContent: "center", mt: 2 }} // Center horizontally
          >
            <Button
              variant="contained"
              color="primary"
              type="submit"
              size="large"
            >
              Reset Password
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/user/login")}
              size="large"
            >
              Login
            </Button>
          </ButtonGroup>
        </form>
      </Paper>
    </Box>
  );
}
