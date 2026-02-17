import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  Box,
  Button,
  ButtonGroup,
  Grid,
  Paper,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import { useAlert } from "context";
import { userService } from "../userApi";

const schema = yup.object().shape({
  email: yup
    .string()
    .transform((v) => v?.trim())
    .email("Invalid email address")
    .required("Email is required"),
});

export default function ForgotPassword() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }) => {
    if (loading) return;

    setLoading(true);
    try {
      const res = await userService.forgotPassword(email);

      const msg =
        res?.message ||
        "If an account exists for that email, you’ll receive a password reset link shortly.";

      showAlert(msg, "success");
      navigate("/login", { replace: true });
    } catch (err) {
      const message = err?.message || "Error requesting password reset";
      setError("email", { type: "manual", message });
      showAlert(message, "error");
    } finally {
      setLoading(false);
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
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 520,
          width: "100%",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="h4" gutterBottom align="center">
          Reset Password
        </Typography>

        <form
          onSubmit={handleSubmit(onSubmit)}
          id="forgot-password-form"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Email *"
                type="email"
                autoComplete="email"
                fullWidth
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Grid>
          </Grid>

          <ButtonGroup
            variant="contained"
            aria-label="forgot password actions"
            sx={{ display: "flex", justifyContent: "center", mt: 2 }}
          >
            <Button type="submit" size="large" disabled={loading}>
              {loading ? "Sending…" : "Reset Password"}
            </Button>
            <Button
              onClick={() => navigate("/login")}
              size="large"
              disabled={loading}
            >
              Login
            </Button>
          </ButtonGroup>
        </form>
      </Paper>
    </Box>
  );
}
