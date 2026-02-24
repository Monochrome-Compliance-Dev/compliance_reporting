import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  TextField,
  Button,
  Box,
  useTheme,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import { sanitiseInput } from "../../lib/utils/sanitiseInput";
import { useState } from "react";
import { publicService } from "../../services";
import { useAlert } from "../../context";
import { useLocation, useNavigate } from "react-router";
import { error as logError } from "../../lib/utils/logger";

const schema = yup.object({
  contactName: yup
    .string()
    .trim()
    .min(5, "Please provide at least five characters")
    .required("Name is required"),
  email: yup
    .string()
    .trim()
    .email("Please enter a valid email address")
    .matches(
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      "Please enter a valid email address"
    )
    .required("Email is required"),
  entityName: yup
    .string()
    .trim()
    .min(5, "Please provide at least five characters")
    .required("Entity name is required"),
  contactNumber: yup
    .string()
    .trim()
    .test(
      "is-valid-contact-number",
      "Contact number must be 10 digits",
      function (value) {
        return /^\d{10}$/.test(value);
      }
    ),
  numOrgs: yup
    .number()
    .typeError("Must be a number")
    .positive("Must be positive")
    .integer("Must be an integer")
    .required("Number of organisations is required"),
  tier: yup.string().required(),
});

const SignUp = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const location = useLocation();
  const tier = location?.state?.tier || "Plus"; // Default to "Plus" if not provided

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      contactName: "",
      entityName: "",
      email: "",
      contactNumber: "",
      numOrgs: "",
      tier,
      to: "contact@monochrome-compliance.com",
      cc: "contact@monochrome-compliance.com",
      from: "contact@monochrome-compliance.com",
    },
  });

  const sendSignUpEmail = async (data) => {
    const topic = "PTRS Sign Up";
    // Exclude tier and numOrgs from cleanData
    const cleanData = {
      name: sanitiseInput(data.contactName),
      cc: sanitiseInput(data.cc),
      from: sanitiseInput(data.from),
      to: sanitiseInput(data.to),
      subject: sanitiseInput(topic),
      topic: sanitiseInput(topic),
      company: sanitiseInput(data.entityName),
      message:
        "Tier: " +
        data.tier +
        "| Number of orgs: " +
        data.numOrgs +
        "| Contact number: " +
        data.contactNumber,
      email: sanitiseInput(data.email),
    };

    try {
      setLoading(true);

      // Send the sign-up email
      const response = await publicService.sendSesEmailLambda(cleanData);
      // const response = await publicService.sendSesEmail(cleanData);
      if (response?.status === 200) {
        reset();
        showAlert("PTRS sign-up email sent successfully!", "success");
        setTimeout(() => {
          navigate("/thankyou-signup");
        }, 1500);
        return;
      }
    } catch (error) {
      logError("Error sending PTRS sign-up email:", error);
      showAlert("Failed to send PTRS sign-up email.", "error");
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
          variant="h4"
          gutterBottom
          sx={{ color: theme.palette.text.primary }}
        >
          Welcome to Monochrome Compliance
        </Typography>
        <Typography
          variant="body1"
          paragraph
          sx={{ color: theme.palette.text.secondary }}
        >
          Thank you for entrusting us with your PTRS requirement. Please fill
          out the form below and we'll get back to you as soon as possible.
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit(sendSignUpEmail)}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
          }}
        >
          <TextField
            label="Contact Name *"
            type="text"
            {...register("contactName")}
            error={!!errors.contactName}
            helperText={errors.contactName?.message}
            fullWidth
            InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          />
          <TextField
            label="Entity Name *"
            type="text"
            {...register("entityName")}
            error={!!errors.entityName}
            helperText={errors.entityName?.message}
            fullWidth
            InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          />
          <TextField
            label="Email Address *"
            type="email"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
            InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          />
          <TextField
            label="Contact Number *"
            type="text"
            {...register("contactNumber")}
            error={!!errors.contactNumber}
            helperText={errors.contactNumber?.message}
            fullWidth
            InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          />
          <TextField
            label="Number of Organisations *"
            type="number"
            {...register("numOrgs")}
            error={!!errors.numOrgs}
            helperText={errors.numOrgs?.message}
            fullWidth
            InputLabelProps={{ style: { color: theme.palette.text.primary } }}
          />
          <input type="hidden" {...register("tier")} value={tier} />
          <Button
            type="submit"
            variant="contained"
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
};

export default SignUp;
