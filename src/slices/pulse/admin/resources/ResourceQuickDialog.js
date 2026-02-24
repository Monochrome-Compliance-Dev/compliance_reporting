import { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  MenuItem,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAlert } from "context";
import { userService } from "services";
import { createResource } from "../../services/pulseApi";

export const RESOURCE_OPTIONS = [
  "Auditor (1st year)",
  "Auditor (2nd year)",
  "Auditor (3rd year)",
  "Senior",
  "Manager",
  "Senior Manager",
  "Director",
  "Partner",
];

export const resourceSchema = yup
  .object({
    firstName: yup.string().trim().required("First name is required"),
    lastName: yup.string().trim().required("Last name is required"),
    role: yup
      .string()
      .oneOf(["User", "Admin"], "Role is required")
      .required("Role is required"),
    position: yup
      .string()
      .oneOf(RESOURCE_OPTIONS, "Invalid position")
      .required("Position is required"),
    hourlyRate: yup
      .number()
      .transform((v, o) => (o === "" || Number.isNaN(v) ? undefined : v))
      .min(0, "Cannot be negative")
      .required("Hourly charge-out rate is required"),
    capacityHoursPerWeek: yup
      .number()
      .transform((v, o) => (o === "" || Number.isNaN(v) ? undefined : v))
      .min(0, "Cannot be negative")
      .max(168, "Easy there, hero")
      .required("Capacity is required"),
    email: yup
      .string()
      .email("Invalid email")
      .trim()
      .required("Email is required"),
    userId: yup
      .string()
      .trim()
      .transform((v) => (v === "" ? null : v))
      .nullable()
      .optional(),
  })
  .required();

export default function ResourceQuickDialog({
  open,
  defaults,
  onClose,
  onCreated,
}) {
  const { showAlert } = useAlert();

  const { register, handleSubmit, reset, control, formState } = useForm({
    resolver: yupResolver(resourceSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      role: "User",
      position: defaults?.role || "",
      hourlyRate: "",
      capacityHoursPerWeek: "",
      email: "",
      userId: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        firstName: "",
        lastName: "",
        role: "User",
        position: defaults?.role || "",
        hourlyRate: "",
        capacityHoursPerWeek: "",
        email: "",
        userId: "",
      });
    }
  }, [open, defaults, reset]);

  const onSubmit = async (values) => {
    try {
      // Invite flow: create user + resource in one go if no userId provided
      if (!values.userId) {
        const payload = {
          user: {
            email: String(values.email || "").trim(),
            role: values.role || "User",
            firstName: String(values.firstName || "").trim(),
            lastName: String(values.lastName || "").trim(),
            customerId: userService.userValue.customerId,
            phone: "",
            active: false,
          },
          resource: {
            name: `${String(values.firstName || "").trim()} ${String(values.lastName || "").trim()}`.trim(),
            position: String(values.position || "").trim(),
            hourlyRate: Number(values.hourlyRate ?? 0),
            capacityHoursPerWeek: Number(values.capacityHoursPerWeek ?? 0),
            customerId: userService.userValue.customerId,
          },
          createdBy: userService.userValue.id,
        };

        const result = await userService.inviteWithResource(payload);
        const invitedResource =
          result?.data?.resource ?? result?.resource ?? null;
        if (!invitedResource || !invitedResource.id) {
          throw new Error("Invitation failed: no resource returned");
        }
        showAlert("Invitation sent and resource created", "success");
        onCreated?.(invitedResource);
        onClose?.();
        return;
      }

      // Direct resource create (linked to an existing user)
      const payload = {
        name: `${String(values.firstName || "").trim()} ${String(values.lastName || "").trim()}`.trim(),
        position: String(values.position || "").trim(),
        hourlyRate: Number(values.hourlyRate ?? 0),
        capacityHoursPerWeek: Number(values.capacityHoursPerWeek ?? 0),
        customerId: userService.userValue.customerId,
        userId: values.userId ? String(values.userId) : undefined,
        email: values.email || undefined,
        role: values.role || undefined,
      };

      const created = await createResource(payload);
      if (!created?.id) throw new Error("Create failed");
      showAlert("Resource created", "success");
      onCreated?.(created);
      onClose?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      showAlert(err?.message || "Failed to save resource", "error");
    }
  };

  const { errors, isSubmitting } = formState;

  return (
    <Dialog open={!!open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Resource</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="First name"
              {...register("firstName")}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
              fullWidth
            />
            <TextField
              label="Last name"
              {...register("lastName")}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
              fullWidth
            />
          </Stack>

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="Role"
                {...field}
                error={!!errors.role}
                helperText={errors.role?.message}
                fullWidth
              >
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </TextField>
            )}
          />

          <Controller
            name="position"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="Position"
                {...field}
                error={!!errors.position}
                helperText={errors.position?.message}
                fullWidth
              >
                <MenuItem value="">
                  <em>Select a position…</em>
                </MenuItem>
                {RESOURCE_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Hourly charge-out rate"
              type="number"
              inputProps={{ step: 1, min: 0 }}
              {...register("hourlyRate")}
              error={!!errors.hourlyRate}
              helperText={errors.hourlyRate?.message}
              fullWidth
            />
            <TextField
              label="Capacity (hrs/wk)"
              type="number"
              inputProps={{ step: 1, min: 0, max: 168 }}
              {...register("capacityHoursPerWeek")}
              error={!!errors.capacityHoursPerWeek}
              helperText={errors.capacityHoursPerWeek?.message}
              fullWidth
            />
          </Stack>

          <TextField
            label="Email (invite)"
            placeholder="name@company.com"
            {...register("email")}
            error={!!errors.email}
            helperText={
              errors.email?.message ||
              "We’ll invite this person to set a password"
            }
            fullWidth
          />

          <TextField
            label="Linked User ID (optional)"
            placeholder="Paste the user's ID to link the user to the resource"
            {...register("userId")}
            error={!!errors.userId}
            helperText={
              errors.userId?.message ||
              "Used to map this resource to a system user"
            }
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isSubmitting}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
