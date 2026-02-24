import React, { useEffect, useState } from "react";
import { Form, Link } from "react-router";
import queryString from "query-string";
import {
  Box,
  Typography,
  Button,
  TextField,
  useTheme,
  Paper,
  Grid,
  Alert,
} from "@mui/material";
import { userService } from "services";
import { useNavigate } from "react-router";

export default function ResetPassword() {
  const theme = useTheme();
  const navigate = useNavigate(); // Use react-router's navigate hook
  const TokenStatus = {
    Validating: "Validating",
    Valid: "Valid",
    Invalid: "Invalid",
  };

  const [token, setToken] = useState(null);
  const [tokenStatus, setTokenStatus] = useState(TokenStatus.Validating);
  const [password, setPassword] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const { token } = queryString.parse(window.location.search);

    // Replace the current URL without reloading the page
    navigate(window.location.pathname, { replace: true });

    userService
      .validateResetToken(token)
      .then(() => {
        setToken(token);
        setTokenStatus(TokenStatus.Valid);
      })
      .catch(() => {
        setTokenStatus(TokenStatus.Invalid);
      });
  }, [navigate, TokenStatus.Invalid, TokenStatus.Valid]);

  const handlePassword = (e) => {
    const value = e.target.value;
    setPassword(value);
  };

  const handleConfirmPassword = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
  };

  const clearErrorMessages = () => {
    setPasswordError(null);
    setConfirmPasswordError(null);
  };

  const checkFields = () => {
    let cont = true;

    if (!password || password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      cont = false;
    }

    if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match");
      cont = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      cont = false;
    }

    return cont;
  };

  function onSubmit(e) {
    e.preventDefault();
    clearErrorMessages();

    if (checkFields()) {
      userService
        .resetPassword({ token, password, confirmPassword })
        .then(() => {
          setAlert({
            type: "success",
            message:
              "Password reset successfully - redirecting you to the login page",
          });
          navigate("/login"); // Use navigate instead of redirect
        })
        .catch((error) => {
          setAlert({
            type: "error",
            message: error || "Error resetting your password",
          });
        });
    }
  }

  function getForm() {
    return (
      <Form
        method="post"
        id="reset-password-form"
        style={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="New Password"
              name="password"
              type="password"
              fullWidth
              required
              onChange={handlePassword}
              error={!!passwordError}
              helperText={passwordError}
              InputLabelProps={{ style: { color: theme.palette.text.primary } }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Confirm Password"
              name="password"
              type="password"
              fullWidth
              required
              onChange={handleConfirmPassword}
              error={!!confirmPasswordError}
              helperText={confirmPasswordError}
              InputLabelProps={{ style: { color: theme.palette.text.primary } }}
            />
          </Grid>
        </Grid>
        <Box
          sx={{ display: "flex", justifyContent: "center", mt: 2 }} // Center horizontally
        >
          <Button
            variant="contained"
            color="primary"
            type="submit"
            size="large"
            onClick={onSubmit}
          >
            Reset Password
          </Button>
        </Box>
      </Form>
    );
  }

  function getBody() {
    switch (tokenStatus) {
      case TokenStatus.Valid:
        return getForm();
      case TokenStatus.Invalid:
        return (
          <Box>
            Token validation failed, if the token has expired you can get a new
            one at the <Link to="/forgot-password">forgot password</Link> page.
          </Box>
        );
      case TokenStatus.Validating:
        return <Box>Validating token...</Box>;
      default:
        return (
          <Box>
            Token validation failed, if the token has expired you can get a new
            one at the <Link to="/forgot-password">forgot password</Link> page.
          </Box>
        );
    }
  }

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
        {getBody()}
      </Paper>
    </Box>
  );
}
