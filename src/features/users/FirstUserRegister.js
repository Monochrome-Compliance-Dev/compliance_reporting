import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { userService, billingService } from "../../services";
import { useAlert } from "../../context/";

// 👋 MVP default seat count for new customers.
// Stripe’s subscription quantity will be updated by webhook post-checkout.
const DEFAULT_SEATS = 20;

const schema = Yup.object().shape({
  firstName: Yup.string()
    .trim()
    .min(3, "First name must be at least 3 characters")
    .required("First name is required"),
  lastName: Yup.string()
    .trim()
    .min(3, "Last name must be at least 3 characters")
    .required("Last name is required"),
  email: Yup.string()
    .trim()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string()
    .trim()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/\d/, "Password must contain at least one number")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .trim()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password is required"),
  phone: Yup.string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .required("Phone number is required"),
  position: Yup.string()
    .trim()
    .min(2, "Position must be at least 2 characters")
    .required("Position is required"),
});

export default function FirstUserRegister() {
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      company: "",
      email: "",
      password: "Der5rdcfdk",
      confirmPassword: "Der5rdcfdk",
      phone: "",
      position: "",
    },
  });
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = methods;
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const customerDetails = JSON.parse(
      sessionStorage.getItem("customerDetails")
    );
    if (!customerDetails) {
      showAlert(
        "No company information found. Please register your company first.",
        "error"
      );
      navigate("/customers/register");
      return;
    }

    setValue("firstName", customerDetails.firstName || "");
    setValue("lastName", customerDetails.lastName || "");
    setValue(
      "company",
      customerDetails.company ||
        customerDetails.customerName ||
        customerDetails.businessName ||
        ""
    );
    setValue("email", customerDetails.email || "");
    setValue("phone", customerDetails.phone || "");
    setValue("position", customerDetails.position || "");
  }, [setValue, showAlert, navigate]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const customer =
        JSON.parse(sessionStorage.getItem("customerDetails")) || {};
      const userDetails = {
        ...data,
        role: "Admin",
        customerId: customer.id,
        active: true,
        verified: new Date(),
        createdBy: userService.userValue?.id || "onlineform",
      };

      const created = await userService.registerFirstUser(userDetails);
      const createdUserId =
        created?.data?.id ?? created?.id ?? userService.userValue?.id;

      const planCode = customer.planCode ?? "launch";
      const seats = DEFAULT_SEATS;
      const { data: billingData } = await billingService.createCheckoutSession({
        customerId: customer.id,
        userId: createdUserId,
        planCode,
        seats,
      });
      showAlert(
        "Admin user created. Taking you to secure checkout…",
        "success"
      );
      window.location.href = billingData.url;
    } catch (error) {
      showAlert(
        error.message || "Error creating user. Please try again.",
        "error"
      );
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
        padding: theme.spacing(2),
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: theme.spacing(4),
          maxWidth: 800,
          width: "100%",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="h4" gutterBottom align="center">
          Create First User
        </Typography>
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            id="create-first-user-form"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: theme.spacing(2),
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  {...register("firstName")}
                  label="First Name *"
                  fullWidth
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  InputLabelProps={{
                    style: { color: theme.palette.text.primary },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...register("lastName")}
                  label="Last Name *"
                  fullWidth
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  InputLabelProps={{
                    style: { color: theme.palette.text.primary },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  {...register("email")}
                  label="Email *"
                  type="email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputLabelProps={{
                    style: { color: theme.palette.text.primary },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...register("password")}
                  label="Password *"
                  type="password"
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputLabelProps={{
                    style: { color: theme.palette.text.primary },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...register("confirmPassword")}
                  label="Confirm Password *"
                  type="password"
                  fullWidth
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputLabelProps={{
                    style: { color: theme.palette.text.primary },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...register("phone")}
                  label="Phone *"
                  fullWidth
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  InputLabelProps={{
                    style: { color: theme.palette.text.primary },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...register("position")}
                  label="Position *"
                  fullWidth
                  error={!!errors.position}
                  helperText={errors.position?.message}
                  InputLabelProps={{
                    style: { color: theme.palette.text.primary },
                  }}
                />
              </Grid>
            </Grid>
            <Box mt={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || methods.formState.isSubmitting}
              >
                {loading || methods.formState.isSubmitting
                  ? "Creating..."
                  : "Create Admin User"}
              </Button>
            </Box>
          </form>
        </FormProvider>
      </Paper>
    </Box>
  );
}
