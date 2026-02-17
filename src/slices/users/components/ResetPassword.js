import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  Box,
  Typography,
  Button,
  TextField,
  useTheme,
  Paper,
  Grid,
  Alert,
  CircularProgress,
} from "@mui/material";

import { useAlert } from "context";
import { userService } from "../userApi";

const TokenStatus = {
  Validating: "Validating",
  Valid: "Valid",
  Invalid: "Invalid",
};

export default function ResetPassword() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [token, setToken] = useState(null);
  const [tokenStatus, setTokenStatus] = useState(TokenStatus.Validating);
  const [banner, setBanner] = useState(null);

  const schema = useMemo(
    () =>
      yup.object().shape({
        password: yup
          .string()
          .transform((v) => v?.trim())
          .min(8, "Password must be at least 8 characters long")
          .required("New password is required"),
        confirmPassword: yup
          .string()
          .transform((v) => v?.trim())
          .oneOf([yup.ref("password")], "Passwords do not match")
          .required("Please confirm your password"),
      }),
    [],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");

    // Replace the current URL without query params (prevents token leakage via copy/paste)
    navigate(window.location.pathname, { replace: true });

    if (!t) {
      setTokenStatus(TokenStatus.Invalid);
      return;
    }

    let isMounted = true;

    async function validate() {
      setTokenStatus(TokenStatus.Validating);
      try {
        await userService.validateResetToken(t);
        if (!isMounted) return;
        setToken(t);
        setTokenStatus(TokenStatus.Valid);
      } catch (err) {
        if (!isMounted) return;
        setTokenStatus(TokenStatus.Invalid);
      }
    }

    validate();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const onSubmit = async ({ password, confirmPassword }) => {
    if (tokenStatus !== TokenStatus.Valid || !token) return;

    setBanner(null);

    try {
      await userService.resetPassword({ token, password, confirmPassword });
      const message = "Password reset successfully. Redirecting you to login.";
      setBanner({ type: "success", message });
      showAlert(message, "success");
      navigate("/login", { replace: true });
    } catch (err) {
      const message = err?.message || "Error resetting your password";
      setBanner({ type: "error", message });
      setError("password", { type: "manual", message });
      showAlert(message, "error");
    }
  };

  const body = (() => {
    if (tokenStatus === TokenStatus.Validating) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Validating token…
          </Typography>
        </Box>
      );
    }

    if (tokenStatus === TokenStatus.Invalid) {
      return (
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Token validation failed. If your token has expired you can request a
          new one on the <Link to="/forgot-password">forgot password</Link>{" "}
          page.
        </Typography>
      );
    }

    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        id="reset-password-form"
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="New Password *"
              type="password"
              autoComplete="new-password"
              fullWidth
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Confirm Password *"
              type="password"
              autoComplete="new-password"
              fullWidth
              {...register("confirmPassword")}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
          <Button variant="contained" type="submit" size="large">
            Reset Password
          </Button>
        </Box>
      </form>
    );
  })();

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
          maxWidth: 800,
          width: "100%",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="h4" gutterBottom align="center">
          Reset Password
        </Typography>

        {banner ? (
          <Alert severity={banner.type} sx={{ mb: 2 }}>
            {banner.message}
          </Alert>
        ) : null}

        {body}
      </Paper>
    </Box>
  );
}
