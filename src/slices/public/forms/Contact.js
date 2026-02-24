import { useState, useEffect } from "react";
import {
  Box,
  Container,
  TextField,
  Typography,
  Button,
  Paper,
  useTheme,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAlert } from "context";
import { error as logError, sanitiseInput } from "shared/utils";
import { publicService } from "../publicApi";

// Yup schema moved outside the component and updated to use yup.object({ ... }) directly
const schema = yup.object({
  name: yup
    .string()
    .trim()
    .max(100, "Keep it short")
    .required("Name is required"),
  company: yup
    .string()
    .trim()
    .max(100, "Keep it short")
    .required("Company is required"),
  email: yup
    .string()
    .trim()
    .email("Invalid email")
    .required("Email is required"),
  message: yup
    .string()
    .trim()
    .min(20, "Please provide a bit more detail (20+ chars)")
    .max(4000, "Please keep it under 4,000 characters")
    .required("Message is required"),
  topic: yup
    .string()
    .oneOf(
      ["Payment Times Reporting", "Sales", "Support", "General"],
      "Select a valid topic",
    )
    .required("Topic is required"),
});

export function Contact() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      subject: "Payment Times Reporting",
      message: "",
      to: "contact@monochrome-compliance.com",
      cc: "contact@monochrome-compliance.com",
      from: "contact@monochrome-compliance.com",
      topic: "Payment Times Reporting",
      website: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const context = params.get("context");
    if (context === "pulse") {
      const current = getValues();
      reset({
        ...current,
        topic: "Sales",
        subject: "[PULSE] Contact",
      });
    }
  }, [location.search, reset, getValues]);

  const sendContactEmail = async (data) => {
    // Honeypot: if filled, abort silently
    if (data.website) {
      return; // do nothing to avoid confirming to bots
    }

    // Sanitise user inputs
    const safe = {
      name: sanitiseInput(data.name),
      email: sanitiseInput(data.email),
      company: sanitiseInput(data.company),
      message: sanitiseInput(data.message),
      topic: data.topic,
      subject: data.subject,
    };

    const topicTag = safe.topic?.toLowerCase().includes("pulse")
      ? safe.subject?.toLowerCase().includes("ea")
        ? "[PULSE EA]"
        : "[PULSE]"
      : "[CONTACT]";

    const subject = `${topicTag} ${safe.subject || safe.topic} — ${safe.company || safe.name}`;

    const contactEmail = {
      to: data.to || "contact@monochrome-compliance.com",
      subject,

      // Message content (duplicate keys for compatibility with different handlers)
      message: safe.message,
      body: safe.message,
      text: safe.message,
      messageBody: safe.message,

      name: safe.name,
      email: safe.email,
      company: safe.company,
      topic: safe.topic,

      // Optional metadata (if provided by future UI)
      date: data.date,
      time: data.time,

      // Email routing overrides
      from: data.from || safe.email,
      cc: data.cc,
      bcc: data.bcc,
    };

    try {
      setLoading(true);

      // Send the contact email
      const response = await publicService.sendSesEmailLambda(contactEmail);
      if (response?.status === 200) {
        reset();
        showAlert("Message sent successfully!", "success");
        navigate("/thankyou-contact", { replace: true });
        return;
      }
    } catch (error) {
      logError("Error sending email:", error);
      showAlert("Failed to send email.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        mt: theme.spacing(4),
        backgroundColor: theme.palette.background.default,
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: theme.spacing(3),
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Typography
          variant="body1"
          paragraph
          sx={{ color: theme.palette.text.secondary }}
        >
          Fill out the form below and we'll get back to you as soon as possible
          to see how we can help.
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit(sendContactEmail)}
          sx={{ mb: theme.spacing(2) }}
        >
          <Controller
            name="topic"
            control={control}
            render={({ field }) => (
              <TextField
                label="Topic *"
                select
                {...field}
                value={field.value ?? "Payment Times Reporting"}
                error={!!errors.topic}
                helperText={errors.topic?.message}
                fullWidth
                sx={{ mb: theme.spacing(2) }}
                InputLabelProps={{
                  style: { color: theme.palette.text.primary },
                }}
              >
                <MenuItem value="Payment Times Reporting">
                  Payment Times Reporting
                </MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
                <MenuItem value="Support">Support</MenuItem>
                <MenuItem value="General">General</MenuItem>
              </TextField>
            )}
          />
          <TextField
            label="Name *"
            type="text"
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
            autoComplete="off"
            autoFocus
            fullWidth
            sx={{ mb: theme.spacing(2) }}
            InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          />
          <TextField
            label="Company *"
            type="text"
            {...register("company")}
            error={!!errors.company}
            helperText={errors.company?.message}
            autoComplete="off"
            fullWidth
            sx={{ mb: theme.spacing(2) }}
            InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          />
          <TextField
            label="Email *"
            type="email"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            autoComplete="off"
            fullWidth
            sx={{ mb: theme.spacing(2) }}
            InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          />
          <TextField
            label="Message *"
            type="text"
            {...register("message")}
            error={!!errors.message}
            helperText={errors.message?.message}
            autoComplete="off"
            fullWidth
            multiline
            rows={4}
            InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          />
          {/* Honeypot field for bots */}
          <TextField
            label="Website"
            type="text"
            {...register("website")}
            autoComplete="off"
            fullWidth
            sx={{ display: "none" }}
            tabIndex={-1}
            aria-hidden
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              padding: theme.spacing(1.5),
              fontWeight: "bold",
              borderRadius: theme.shape.borderRadius,
            }}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
