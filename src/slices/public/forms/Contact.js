import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAlert } from "context";
import PublicPageLayout, {
  PublicSurface,
} from "shared/layouts/PublicPageLayout";
import PageMeta from "shared/ui/PageMeta";
import { PublicPageHero, PublicPageSection } from "shared/ui";
import { error as logError, sanitiseInput } from "shared/utils";
import { publicService } from "../publicApi";

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
  }, [getValues, location.search, reset]);

  const sendContactEmail = async (data) => {
    if (data.website) {
      return;
    }

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
      message: safe.message,
      body: safe.message,
      text: safe.message,
      messageBody: safe.message,
      name: safe.name,
      email: safe.email,
      company: safe.company,
      topic: safe.topic,
      date: data.date,
      time: data.time,
      from: data.from || safe.email,
      cc: data.cc,
      bcc: data.bcc,
    };

    try {
      setLoading(true);

      const response = await publicService.sendSesEmailLambda(contactEmail);
      if (response?.status === 200) {
        reset();
        showAlert("Message sent successfully!", "success");
        navigate("/thankyou-contact", { replace: true });
      }
    } catch (error) {
      logError("Error sending email:", error);
      showAlert("Failed to send email.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Contact"
        description="Contact Monochrome Compliance to discuss Payment Times Reporting, payment data review and compliance support."
        path="/contact"
      />

      <PublicPageLayout
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <PublicPageHero
          eyebrow="Contact"
          title="Tell us what you need help with"
          description="Fill out the form below and we'll get back to you as soon as possible to see how we can help."
          sx={{
            pt: { xs: 3, md: 4 },
            pb: { xs: 2, md: 3 },
          }}
        />

        <PublicPageSection
          contentMaxWidth={theme.layout.public.textWidth}
          sx={{ pt: 0, pb: { xs: 4, md: 6 } }}
        >
          <PublicSurface
            sx={{
              width: "100%",
              maxWidth: theme.layout.public.textWidth,
            }}
          >
            <Box
              component="form"
              onSubmit={handleSubmit(sendContactEmail)}
              aria-busy={loading}
              noValidate
            >
              <Stack spacing={2.5}>
                <Typography component="h2" variant="h5">
                  Contact Monochrome Compliance
                </Typography>

                <Controller
                  name="topic"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Topic"
                      select
                      required
                      {...field}
                      value={field.value ?? "Payment Times Reporting"}
                      error={!!errors.topic}
                      helperText={errors.topic?.message}
                      fullWidth
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
                  label="Name"
                  required
                  {...register("name")}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  autoComplete="name"
                  autoFocus
                  fullWidth
                />

                <TextField
                  label="Company"
                  required
                  {...register("company")}
                  error={!!errors.company}
                  helperText={errors.company?.message}
                  autoComplete="organization"
                  fullWidth
                />

                <TextField
                  label="Email"
                  type="email"
                  required
                  {...register("email")}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  autoComplete="email"
                  fullWidth
                />

                <TextField
                  label="Message"
                  required
                  {...register("message")}
                  error={!!errors.message}
                  helperText={errors.message?.message}
                  fullWidth
                  multiline
                  minRows={5}
                />

                <TextField
                  label="Website"
                  {...register("website")}
                  autoComplete="off"
                  sx={{ display: "none" }}
                  slotProps={{
                    htmlInput: {
                      tabIndex: -1,
                      "aria-hidden": true,
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : null
                  }
                >
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              </Stack>
            </Box>
          </PublicSurface>
        </PublicPageSection>
      </PublicPageLayout>
    </>
  );
}
