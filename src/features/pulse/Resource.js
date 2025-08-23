import { useParams, useNavigate } from "react-router";
import {
  Box,
  TextField,
  Select,
  MenuItem,
  Button,
  InputLabel,
  FormControl,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import mockData from "./mockData.json";
import { usePulseContext } from "../../context/PulseContext";

// Helper to get ISO string for Monday of current week
function getMondayISO() {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when Sunday
  const monday = new Date(now.setDate(diff));
  // Format as YYYY-MM-DD
  return monday.toISOString().slice(0, 10);
}

const Resource = () => {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const isNew = resourceId === "new";

  const { resources = [], engagements = [], saveResource } = usePulseContext();

  // Find existing resource if editing
  const existing =
    !isNew && resources
      ? resources.find((r) => String(r.id) === String(resourceId))
      : undefined;

  // Build unique role options from resources
  let roleOptions =
    resources && resources.length > 0
      ? Array.from(
          new Set(
            resources
              .map((r) => r.role)
              .filter((role) => !!role && typeof role === "string")
          )
        )
      : [];
  if (roleOptions.length === 0) {
    roleOptions = ["Partner", "Manager", "Senior", "Junior", "Associate"];
  }

  // Form schema
  const schema = yup.object().shape({
    name: yup.string().required("Name is required"),
    role: yup.string().required("Role is required"),
    hourlyRate: yup
      .number()
      .typeError("Hourly Rate must be a number")
      .min(0, "Hourly Rate must be at least 0")
      .required("Hourly Rate is required"),
    capacityHoursPerWeek: yup
      .number()
      .typeError("Weekly Capacity must be a number")
      .min(0, "Weekly Capacity must be at least 0")
      .required("Weekly Capacity is required"),
  });

  // Default values for form
  const defaultValues = {
    name: existing?.name || "",
    role: existing?.role || "",
    hourlyRate:
      typeof existing?.hourlyRate === "number" ? existing.hourlyRate : "",
    capacityHoursPerWeek:
      typeof existing?.capacityHoursPerWeek === "number"
        ? existing.capacityHoursPerWeek
        : "",
  };

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
  });

  // Allocations for this resource
  let allocations = [];
  if (!isNew && mockData.allocations && existing) {
    allocations = mockData.allocations.filter(
      (a) => String(a.resourceId) === String(existing.id)
    );
  }
  // Helper: engagementId -> name
  const engagementMap =
    engagements?.reduce((map, eng) => {
      map[String(eng.id)] = eng.name;
      return map;
    }, {}) || {};

  // Handlers
  const onSave = async () => {
    await saveResource({
      id: isNew ? undefined : existing?.id,
      name: getValues ? getValues("name") : defaultValues.name,
      role: getValues ? getValues("role") : defaultValues.role,
      hourlyRate: Number(
        (getValues && getValues("hourlyRate")) ?? defaultValues.hourlyRate ?? 0
      ),
      capacityHoursPerWeek: Number(
        (getValues && getValues("capacityHoursPerWeek")) ??
          defaultValues.capacityHoursPerWeek ??
          0
      ),
    });
    navigate("/pulse");
  };
  const onCancel = () => {
    navigate("/pulse");
  };
  const onTimesheet = () => {
    const mondayISO = getMondayISO();
    navigate(`/pulse/timesheets/${resourceId}/${mondayISO}`);
  };

  return (
    <Box
      component="form"
      sx={{
        maxWidth: 400,
        mx: "auto",
        mt: 4,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
      onSubmit={handleSubmit(onSave)}
      autoComplete="off"
    >
      <Typography variant="h5" mb={2}>
        {isNew ? "Create Resource" : "Edit Resource"}
      </Typography>
      <TextField
        label="Name"
        fullWidth
        {...register("name")}
        error={!!errors.name}
        helperText={errors.name?.message}
      />
      <FormControl fullWidth required error={!!errors.role}>
        <InputLabel id="role-label">Role</InputLabel>
        <Select
          labelId="role-label"
          label="Role"
          {...register("role")}
          defaultValue={defaultValues.role}
        >
          {roleOptions.map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </Select>
        {errors.role && (
          <Typography variant="caption" color="error">
            {errors.role.message}
          </Typography>
        )}
      </FormControl>
      <TextField
        label="Hourly Rate"
        type="number"
        fullWidth
        {...register("hourlyRate")}
        error={!!errors.hourlyRate}
        helperText={errors.hourlyRate?.message}
        inputProps={{ min: 0 }}
      />
      <TextField
        label="Weekly Capacity"
        type="number"
        fullWidth
        {...register("capacityHoursPerWeek")}
        error={!!errors.capacityHoursPerWeek}
        helperText={errors.capacityHoursPerWeek?.message}
        inputProps={{ min: 0 }}
      />
      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <Button type="submit" variant="contained" color="primary">
          Save
        </Button>
        <Button variant="outlined" color="secondary" onClick={onCancel}>
          Cancel
        </Button>
        {!isNew && (
          <Button
            variant="outlined"
            color="primary"
            onClick={onTimesheet}
            sx={{ ml: "auto" }}
          >
            Open Timesheet
          </Button>
        )}
      </Box>
      {!isNew && allocations.length > 0 && (
        <Box mt={4}>
          <Typography variant="subtitle1" mb={1}>
            Current Allocations
          </Typography>
          <TableContainer component={Paper} sx={{ maxWidth: 400 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Engagement</TableCell>
                  <TableCell align="right">Allocated Hours</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allocations.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {engagementMap[String(a.engagementId)] || a.engagementId}
                    </TableCell>
                    <TableCell align="right">{a.allocatedHours}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default Resource;
