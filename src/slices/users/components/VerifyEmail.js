import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import { useAlert } from "context";
import PageMeta from "shared/ui/PageMeta";
import { userService } from "../userApi";

const EmailStatus = {
  Verifying: "Verifying",
  Failed: "Failed",
  Valid: "Valid",
};

export default function VerifyEmail() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [status, setStatus] = useState(EmailStatus.Verifying);
  const [banner, setBanner] = useState(null);
  const [token, setToken] = useState(null);

  const schema = useMemo(
    () =>
      yup.object().shape({
        password: yup
          .string()
          .transform((v) => v?.trim())
          .min(8, "Password must be at least 8 characters long")
          .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
            "Password must contain at least one lowercase letter, one uppercase letter, and one number",
          )
          .required("Password is required"),
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
    // Read the token from query string then remove it from the URL.
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");

    // Remove token from the URL to avoid leakage via copy/paste or screenshots.
    navigate(window.location.pathname, { replace: true });

    if (!t) {
      setStatus(EmailStatus.Failed);
      setBanner({
        type: "error",
        message: "Missing token. Please request a new link.",
      });
      return;
    }

    let isMounted = true;

    async function verify() {
      setStatus(EmailStatus.Verifying);
      setBanner(null);

      try {
        await userService.verifyToken(t);
        if (!isMounted) return;
        setToken(t);
        setStatus(EmailStatus.Valid);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err?.message ||
          "Invalid or expired token. Please request a new verification link.";
        setBanner({ type: "error", message });
        setStatus(EmailStatus.Failed);
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const onSubmit = async ({ password, confirmPassword }) => {
    if (status !== EmailStatus.Valid || !token) return;

    setBanner(null);

    try {
      const user = await userService.verifyEmail({
        token,
        password,
        confirmPassword,
      });

      // Auto-login with newly set credentials.
      if (user?.email) {
        await userService.login({ email: user.email, password });
      }

      const message = "Email verified and password set. Redirecting you now.";
      setBanner({ type: "success", message });
      showAlert(message, "success");

      // Prefer app root. If the platform later decides a more specific landing,
      // the router can handle it.
      navigate("/app", { replace: true });
    } catch (err) {
      const message = err?.message || "Error setting your password";
      setBanner({ type: "error", message });
      setError("password", { type: "manual", message });
      showAlert(message, "error");
    }
  };

  const title =
    status === EmailStatus.Valid ? "Set your password" : "Verify your email";

  const body = (() => {
    if (status === EmailStatus.Verifying) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Verifying token…
          </Typography>
        </Box>
      );
    }

    if (status === EmailStatus.Failed) {
      return (
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Verification failed. You can set your password using the{" "}
          <Link to="/forgot-password">forgot password</Link> page.
        </Typography>
      );
    }

    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        id="verify-email-form"
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
            Set Password
          </Button>
        </Box>
      </form>
    );
  })();

  return (
    <>
      <PageMeta
        title="Verify Email"
        description="Verify your Monochrome Compliance account email."
        path="/verify"
        noIndex
      />

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
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 2 }}>
          {title}
        </Typography>

        {banner ? (
          <Alert severity={banner.type} sx={{ mb: 2 }}>
            {banner.message}
          </Alert>
        ) : null}

        {body}
      </Paper>
      </Box>
    </>
  );
}
