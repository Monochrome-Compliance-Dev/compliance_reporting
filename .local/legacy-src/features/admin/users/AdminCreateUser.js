import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Box,
  Typography,
  Button,
  TextField,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
} from "@mui/material";
import { clientService, userService } from "../../services";
import { Alert } from "@mui/material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  firstName: Yup.string().required("First Name is required"),
  lastName: Yup.string().required("Last Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone is required"),
  position: Yup.string().required("Position is required"),
  role: Yup.string().required("Role is required"),
  clientName: Yup.string().required("Client selection is required"),
});

export default function UserCreate() {
  const theme = useTheme();
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [storedClientDetails, setStoredClientDetails] = useState({});
  const [selectedRole, setSelectedRole] = useState("Admin"); // Controlled state for role
  const [selectedClient, setSelectedClient] = useState(""); // Controlled state for client
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    async function fetchClients() {
      try {
        const result = await clientService.getAll();
        setClients(result || []);
      } catch (err) {
        console.error("Failed to fetch clients:", err);
        setError("Unable to load client list.");
      }
    }
    fetchClients();
  }, []);

  useEffect(() => {
    let clientDetails = (location.state && location.state.client) || {};

    if (!Object.keys(clientDetails).length) {
      const stored = sessionStorage.getItem("clientDetails");
      if (stored) {
        clientDetails = JSON.parse(stored);
      }
    } else {
      sessionStorage.setItem("clientDetails", JSON.stringify(clientDetails));
    }

    setStoredClientDetails(clientDetails);

    const initialClient = clients.find(
      (client) => client.businessName === clientDetails.name
    );
    if (initialClient) {
      setSelectedClient(initialClient.id);
      setValue("clientId", initialClient.id);
    }

    setValue("firstName", clientDetails.contactFirst || "");
    setValue("lastName", clientDetails.contactLast || "");
    setValue("email", clientDetails.contactEmail || "");
    setValue("phone", clientDetails.contactPhone || "");
    setValue("position", clientDetails.contactPosition || "");
    setValue("role", "Admin");
    setValue("clientName", clientDetails.name || "");
  }, [clients, location.state, setValue]);

  const onSubmit = async (data) => {
    let userDetails = { ...data, active: true };

    try {
      await userService.register(userDetails);

      // Silent login using same credentials
      await userService.login({
        email: userDetails.email,
        password: userDetails.password,
      });

      navigate("/users/create", {
        state: { step: 2 },
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Error creating user.",
      });
      console.error("Error creating user:", error);
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
          Create a New User
        </Typography>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {alert && (
          <Alert severity={alert.type} sx={{ mb: 2 }}>
            {alert.message}
          </Alert>
        )}
        {location.state?.step === 2 && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="info">
              You're now logged in as Admin. Add another user or click "Finish
              Setup" to continue to your dashboard.
            </Alert>
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() =>
                  navigate("/users/create", { state: { step: 2 } })
                }
              >
                Add Another User
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  sessionStorage.removeItem("clientDetails");
                  navigate("/dashboard");
                }}
              >
                Finish Setup
              </Button>
            </Box>
          </Box>
        )}
        <form
          onSubmit={handleSubmit(onSubmit)}
          id="create-user-form"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(2),
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="First Name"
                name="firstName"
                type="string"
                fullWidth
                required
                {...register("firstName")}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Last Name"
                name="lastName"
                type="string"
                fullWidth
                required
                {...register("lastName")}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                name="email"
                type="string"
                fullWidth
                required
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Phone"
                name="phone"
                type="string"
                fullWidth
                required
                {...register("phone")}
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Position"
                name="position"
                type="string"
                fullWidth
                required
                {...register("position")}
                error={!!errors.position}
                helperText={errors.position?.message}
              />
            </Grid>
            {/* Password fields removed */}
            <Grid item xs={6}>
              <FormControl fullWidth error={!!errors.role}>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  name="role"
                  id="role"
                  label="List of Roles"
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setValue("role", e.target.value, { shouldValidate: true });
                  }}
                  required
                >
                  <MenuItem value="User">User</MenuItem>
                  <MenuItem value="Approver">Approver</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
                {errors.role && (
                  <Typography variant="caption" color="error">
                    {errors.role.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Company"
                name="clientName"
                type="string"
                {...register("clientName")}
                fullWidth
                disabled
              />
            </Grid>
          </Grid>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            You’ll receive an email with a secure link to set your password
            after verifying your email.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            sx={{ mt: theme.spacing(2) }}
          >
            Create User
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
