import { useEffect, useState } from "react";
import {
  Alert,
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
import { userService } from "../../services";
import { useForm } from "react-hook-form";

export default function UserCreate() {
  const user = userService.userValue;
  const theme = useTheme();
  // const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [selectedRole, setSelectedRole] = useState("User"); // Default role
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  useEffect(() => {
    setValue("role", "User");
    setValue("firstName", "");
    setValue("lastName", "");
    setValue("email", "");
    setValue("phone", "");
    setValue("position", "");
    setValue("clientId", user.clientId);
  }, [setValue, user.clientId]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    let userDetails = { ...data, active: true, verified: new Date() };
    try {
      await userService.register(userDetails);
      // Welcome email for User-level users sent after verification
      setAlert({
        type: "success",
        message: "User created successfully.",
      });
      // Reset form fields to blank/default
      setValue("firstName", "");
      setValue("lastName", "");
      setValue("email", "");
      setValue("phone", "");
      setValue("position", "");
      setValue("role", "User");
      setSelectedRole("User");
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Error creating user.",
      });
      console.error("Error creating user:", error);
    }
    setIsLoading(false);
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
        {/* {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )} */}
        {alert && (
          <Alert severity={alert.type} sx={{ mb: 2 }}>
            {alert.message}
          </Alert>
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
                label="First Name *"
                name="firstName"
                type="string"
                fullWidth
                {...register("firstName", {
                  required: "First Name is required",
                })}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                InputLabelProps={{
                  style: { color: theme.palette.text.primary },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Last Name *"
                name="lastName"
                type="string"
                fullWidth
                {...register("lastName", {
                  required: "Last Name is required",
                })}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                InputLabelProps={{
                  style: { color: theme.palette.text.primary },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email *"
                name="email"
                type="string"
                fullWidth
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                    message: "Invalid email",
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                InputLabelProps={{
                  style: { color: theme.palette.text.primary },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Phone *"
                name="phone"
                type="string"
                fullWidth
                {...register("phone", { required: "Phone is required" })}
                error={!!errors.phone}
                helperText={errors.phone?.message}
                InputLabelProps={{
                  style: { color: theme.palette.text.primary },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Position *"
                name="position"
                type="string"
                fullWidth
                {...register("position", {
                  required: "Position is required",
                })}
                error={!!errors.position}
                helperText={errors.position?.message}
                InputLabelProps={{
                  style: { color: theme.palette.text.primary },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth error={!!errors.role}>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  name="role"
                  id="role"
                  label="List of Roles *"
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setValue("role", e.target.value, {
                      shouldValidate: true,
                    });
                  }}
                >
                  <MenuItem value="User">User</MenuItem>
                  <MenuItem value="Auditor">Auditor</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
                {errors.role && (
                  <Typography variant="caption" color="error">
                    {errors.role.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            The user will receive an email with a secure link to verify their
            email address and set their password.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            sx={{ mt: theme.spacing(2) }}
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
