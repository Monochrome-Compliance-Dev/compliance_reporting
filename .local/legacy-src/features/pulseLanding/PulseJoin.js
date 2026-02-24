import { useState } from "react";
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
  Chip,
  Stack,
} from "@mui/material";
import { publicService } from "../../services";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAlert } from "../../context/AlertContext";
import { error as logError } from "../../lib/utils/logger";
import { sanitiseInput } from "../../lib/utils/sanitiseInput";

// Validation schema mirrors Contact.js with a few extras
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
  role: yup
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .trim()
    .max(100)
    .notRequired(),
  firmSize: yup
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .oneOf(
      ["1-10", "11-50", "51-200", "200+", "Prefer not to say"],
      "Select a valid option"
    )
    .notRequired(),
  preferredStart: yup
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .notRequired(),
  referralSource: yup
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .oneOf(
      ["Conference / Event", "Referral", "LinkedIn", "Search", "Other"],
      "Select a valid option"
    )
    .notRequired(),
  topic: yup
    .string()
    .oneOf(["Pulse Early Adopter"], "Select a valid topic")
    .required(),
  website: yup.string().optional(), // Honeypot
});

export default function PulseJoin() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      subject: "Join the Founders Circle",
      message: "",
      to: "contact@monochrome-compliance.com",
      cc: "contact@monochrome-compliance.com",
      bcc: "darryll.robinson@monochrome-compliance.com",
      from: "contact@monochrome-compliance.com",
      topic: "Pulse Early Adopter",
      website: "",
      role: "",
      firmSize: "",
      preferredStart: "",
      referralSource: "",
    },
    mode: "onChange",
  });

  const sendJoinEmail = async (data) => {
    // Honeypot: if filled, abort silently
    if (data.website) return;

    const safe = {
      name: sanitiseInput(data.name),
      email: sanitiseInput(data.email),
      company: sanitiseInput(data.company),
      message: sanitiseInput(data.message),
      role: sanitiseInput(data.role || ""),
      firmSize: sanitiseInput(data.firmSize || ""),
      preferredStart: sanitiseInput(data.preferredStart || ""),
      referralSource: sanitiseInput(data.referralSource || ""),
      topic: data.topic,
      subject: data.subject,
    };

    const topicTag = "[PULSE EA]"; // Always EA for this page
    const subject = `${topicTag} ${safe.subject || safe.topic} — ${safe.company || safe.name}`;

    // Craft a slightly richer message body for the email
    const bodyLines = [
      safe.message,
      "",
      "—",
      "Context:",
      safe.role ? `Role: ${safe.role}` : null,
      safe.firmSize ? `Firm size: ${safe.firmSize}` : null,
      safe.preferredStart ? `Preferred start: ${safe.preferredStart}` : null,
      safe.referralSource
        ? `How they heard of us: ${safe.referralSource}`
        : null,
    ].filter(Boolean);

    const payload = {
      to: "contact@monochrome-compliance.com",
      subject,
      message: bodyLines.join("\n"),
      name: safe.name,
      email: safe.email,
      company: safe.company,
      from: "contact@monochrome-compliance.com",
      replyTo: safe.email,
      cc: data.cc,
      bcc: data.bcc,
      topic: safe.topic,
    };

    try {
      setLoading(true);
      const response = await publicService.sendSesEmailLambda(payload);
      if (response?.status === 200) {
        reset();
        showAlert("You're in! We'll be in touch shortly.", "success");
        setTimeout(() => {
          // Reuse existing thank-you route to avoid breaking navigation
          navigate("/thankyou-contact");
        }, 1200);
      }
    } catch (error) {
      logError("Error sending Pulse join email:", error);
      showAlert("Failed to submit your request.", "error");
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
        elevation={4}
        sx={{
          overflow: "hidden",
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        {/* Hero / Pizzazz Bar */}
        <Box
          sx={{
            px: 3,
            py: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label="Founders Circle"
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: "rgba(255,255,255,0.25)",
                color: "#fff",
              }}
            />
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800 }}>
              🚀 Join Pulse early — help shape the product
            </Typography>
          </Stack>
          <Typography
            variant="body2"
            sx={{ mt: 1, color: "#fff", opacity: 0.95 }}
          >
            Limited early seats. Share a few details and we’ll get you
            onboarded.
          </Typography>
        </Box>

        {/* Body */}
        <Box
          component="form"
          onSubmit={handleSubmit(sendJoinEmail)}
          sx={{ p: 3 }}
        >
          {/* Hidden topic field to keep consistent tagging */}
          <input
            type="hidden"
            value="Pulse Early Adopter"
            {...register("topic")}
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
            sx={{ mb: 2 }}
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
            sx={{ mb: 2 }}
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
            sx={{ mb: 2 }}
            InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          />

          {/* Optional sales-context fields */}
          <TextField
            label="Your role (optional)"
            type="text"
            {...register("role")}
            error={!!errors.role}
            helperText={errors.role?.message}
            autoComplete="off"
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <TextField
              label="Firm size (optional)"
              select
              fullWidth
              {...register("firmSize")}
              error={!!errors.firmSize}
              helperText={errors.firmSize?.message}
              InputLabelProps={{ style: { color: theme.palette.text.primary } }}
            >
              <MenuItem value="1-10">1-10</MenuItem>
              <MenuItem value="11-50">11-50</MenuItem>
              <MenuItem value="51-200">51-200</MenuItem>
              <MenuItem value="200+">200+</MenuItem>
              <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
            </TextField>

            <TextField
              label="Preferred start (optional)"
              type="month"
              fullWidth
              {...register("preferredStart")}
              error={!!errors.preferredStart}
              helperText={errors.preferredStart?.message}
              InputLabelProps={{
                shrink: true,
                style: { color: theme.palette.text.primary },
              }}
            />
          </Stack>

          <TextField
            label="How did you hear about Pulse? (optional)"
            select
            fullWidth
            {...register("referralSource")}
            error={!!errors.referralSource}
            helperText={errors.referralSource?.message}
            sx={{ mb: 2 }}
            InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          >
            <MenuItem value="Conference / Event">Conference / Event</MenuItem>
            <MenuItem value="Referral">Referral</MenuItem>
            <MenuItem value="LinkedIn">LinkedIn</MenuItem>
            <MenuItem value="Search">Search</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>

          <TextField
            label="Why are you keen to join? *"
            type="text"
            {...register("message")}
            error={!!errors.message}
            helperText={errors.message?.message}
            autoComplete="off"
            fullWidth
            multiline
            rows={4}
            sx={{ mb: 2 }}
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
              py: 1.5,
              fontWeight: "bold",
              borderRadius: theme.shape.borderRadius,
            }}
          >
            {loading ? "Submitting..." : "Request early access"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
