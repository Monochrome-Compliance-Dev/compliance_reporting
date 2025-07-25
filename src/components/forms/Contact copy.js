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
} from "@mui/material";
import { publicService } from "../../services";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAlert } from "../../context/AlertContext";
import { error as logError } from "../../lib/utils/logger";
import { sanitiseInput } from "../../lib/utils/sanitiseInput";

// Yup schema moved outside the component and updated to use yup.object({ ... }) directly
const schema = yup.object({
  name: yup.string().trim().required("Name is required"),
  company: yup.string().trim().required("Company is required"),
  email: yup
    .string()
    .trim()
    .email("Invalid email")
    .required("Email is required"),
  message: yup.string().trim().required("Message is required"),
});

export default function Contact() {
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
      subject: "Contact Us",
      message: "",
      to: "contact@monochrome-compliance.com",
      cc: "contact@monochrome-compliance.com",
      from: "contact@monochrome-compliance.com",
      topic: "Request for assistance",
    },
    mode: "onChange",
  });

  const sendContactEmail = async (data) => {
    const topic = sanitiseInput(data.topic);
    const contactEmail = {
      name: sanitiseInput(data.name),
      cc: sanitiseInput(data.cc),
      email: sanitiseInput(data.email),
      subject: sanitiseInput(topic),
      topic: sanitiseInput(topic),
      company: sanitiseInput(data.company),
      message: sanitiseInput(data.message),
      to: sanitiseInput(data.email),
      from: sanitiseInput(data.from),
    };

    try {
      setLoading(true);

      // Send the contact email
      const response = await publicService.sendSesEmail(contactEmail);
      if (response?.status === 200) {
        reset();
        showAlert("Message sent successfully!", "success");
        setTimeout(() => {
          navigate("/thankyou-contact");
        }, 1500);
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
          <TextField
            label="Name *"
            type="text"
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
            autoComplete="off"
            autoFocus
            fullWidth
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
