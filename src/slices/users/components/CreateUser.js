import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import { useAlert } from "context";
import { userService } from "../userApi";

export default function CreateUser() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [banner, setBanner] = useState(null);
  const [saving, setSaving] = useState(false);

  const schema = useMemo(
    () =>
      yup.object().shape({
        firstName: yup
          .string()
          .transform((v) => v?.trim())
          .required("First name is required"),
        lastName: yup
          .string()
          .transform((v) => v?.trim())
          .required("Last name is required"),
        email: yup
          .string()
          .transform((v) => v?.trim())
          .email("Invalid email")
          .required("Email is required"),
        phone: yup.string().transform((v) => v?.trim() || ""),
        position: yup.string().transform((v) => v?.trim() || ""),
        role: yup
          .string()
          .oneOf(["User", "Auditor", "Admin", "Boss"], "Invalid role")
          .required("Role is required"),
      }),
    [],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setError,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      role: "User",
    },
  });

  const onSubmit = async (data) => {
    if (saving) return;

    setSaving(true);
    setBanner(null);

    try {
      // v2: Create a user via protected endpoint (/api/v2/users).
      // Customer scoping is handled by the server via effectiveCustomerId.
      await userService.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        position: data.position || null,
        role: data.role,
      });

      const message = "User created successfully.";
      setBanner({ type: "success", message });
      showAlert(message, "success");

      reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        position: "",
        role: "User",
      });
    } catch (err) {
      const message = err?.message || "Error creating user.";
      setBanner({ type: "error", message });
      setError("email", { type: "manual", message });
      showAlert(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
        backgroundColor: theme.palette.background.default,
        minHeight: "100%",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          maxWidth: 900,
          mx: "auto",
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="h4" sx={{ lineHeight: 1.1 }}>
              Create a new user
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              The user will receive an email with a secure link to verify their
              email address and set their password.
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            justifyContent={{ xs: "flex-start", sm: "flex-end" }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate("..")}
              disabled={saving}
            >
              Back
            </Button>
            <Button
              variant="contained"
              type="submit"
              form="create-user-form"
              disabled={saving}
            >
              {saving ? "Creating…" : "Create user"}
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {banner ? (
          <Alert severity={banner.type} sx={{ mb: 2 }}>
            {banner.message}
          </Alert>
        ) : null}

        <form
          onSubmit={handleSubmit(onSubmit)}
          id="create-user-form"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="First name *"
                fullWidth
                {...register("firstName")}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Last name *"
                fullWidth
                {...register("lastName")}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Email *"
                type="email"
                autoComplete="email"
                fullWidth
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Phone"
                fullWidth
                {...register("phone")}
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Position"
                fullWidth
                {...register("position")}
                error={!!errors.position}
                helperText={errors.position?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Role *"
                    fullWidth
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={!!errors.role}
                    helperText={errors.role?.message}
                  >
                    <MenuItem value="User">User</MenuItem>
                    <MenuItem value="Auditor">Auditor</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
          </Grid>

          <Typography variant="body2" sx={{ opacity: 0.85, mt: 1 }}>
            Tip: Admin users can manage users for their customer. Auditor users
            are read-only.
          </Typography>
        </form>
      </Paper>
    </Box>
  );
}
