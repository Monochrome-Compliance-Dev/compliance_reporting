import { useEffect, useState } from "react";
import { Form, Link } from "react-router";
import * as Yup from "yup";
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
import { publicService, userService } from "../../services";
import { useNavigate, useSearchParams } from "react-router";

const validationSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, "Password must be at least 8 characters long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    )
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords do not match")
    .required("Please confirm your password"),
});

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const navigate = useNavigate();

  const EmailStatus = {
    Verifying: "Verifying",
    Failed: "Failed",
    Valid: "Valid",
  };

  const [emailStatus, setEmailStatus] = useState(EmailStatus.Verifying);
  const [pageTitle, setPageTitle] = useState("Verify Your Email Address");

  const token = searchParams.get("token");

  const [formValues, setFormValues] = useState({
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Remove the token query param from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete("token");
    window.history.replaceState({}, document.title, url.toString());
  }, []);

  useEffect(() => {
    if (!token) {
      setEmailStatus(EmailStatus.Failed);
      return;
    }

    userService
      .verifyToken(token)
      .then(() => {
        setEmailStatus(EmailStatus.Valid);
      })
      .catch((error) => {
        setAlert({
          type: "error",
          message:
            typeof error === "string"
              ? error
              : error?.message ||
                JSON.stringify(error) ||
                "Invalid or expired token",
        });
        setEmailStatus(EmailStatus.Failed);
      });
  }, [EmailStatus.Failed, EmailStatus.Valid, token]);

  useEffect(() => {
    if (emailStatus === EmailStatus.Valid) {
      setPageTitle("Enter Your Password");
    }
  }, [EmailStatus.Valid, emailStatus]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: null,
    }));
  };

  const validateForm = async () => {
    try {
      await validationSchema.validate(formValues, { abortEarly: false });
      setFormErrors({});
      return true;
    } catch (validationErrors) {
      const errors = {};
      validationErrors.inner.forEach((error) => {
        errors[error.path] = error.message;
      });
      setFormErrors(errors);
      return false;
    }
  };

  async function onSubmit(e) {
    e.preventDefault();
    setAlert(null);
    setIsSubmitting(true);

    try {
      const isValid = await validateForm();
      if (!isValid) {
        return;
      }

      const user = await userService.verifyEmail({
        token,
        password: formValues.password,
        confirmPassword: formValues.confirmPassword,
      });

      const userData = {
        topic: "User Created",
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        subject: "User Created",
        company: user.customerId,
        message: "New user created",
        to: user.email,
        from: "contact@monochrome-compliance.com",
      };

      await publicService.sendSesEmail(userData);
      // Login the user with their new credentials
      await userService.login({
        email: user.email,
        password: formValues.password,
        customerId: user.customerId,
      });
      setAlert({
        type: "success",
        message:
          "Password set successfully - redirecting you to your dashboard",
      });
      navigate("/dashboard");
    } catch (error) {
      setAlert({
        type: "error",
        message:
          typeof error === "string"
            ? error
            : error?.message ||
              JSON.stringify(error) ||
              "Error setting your password",
      });
    } finally {
      setIsSubmitting(false);
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
              value={formValues.password}
              onChange={handleChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
              InputLabelProps={{ style: { color: theme.palette.text.primary } }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              fullWidth
              required
              value={formValues.confirmPassword}
              onChange={handleChange}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              InputLabelProps={{ style: { color: theme.palette.text.primary } }}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            size="large"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Setting Password..." : "Set Your Password"}
          </Button>
        </Box>
      </Form>
    );
  }

  function getBody() {
    switch (emailStatus) {
      case EmailStatus.Verifying:
        return <div>Verifying...</div>;
      case EmailStatus.Failed:
        return (
          <div>
            Verification failed. You can also verify your account using the{" "}
            <Link to="/user/forgot-password">forgot password</Link> page.
          </div>
        );
      case EmailStatus.Valid:
        return getForm();

      default:
        return <div>Something went wrong. Please try again later.</div>;
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
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 2 }}>
          {pageTitle}
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
