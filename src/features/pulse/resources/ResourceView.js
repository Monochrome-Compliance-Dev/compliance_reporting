import { useState, useMemo, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Button,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { useAlert, usePulseContext } from "../../../context";
import { pulseService } from "../../../services/pulse/pulse";

const schema = yup
  .object({
    name: yup.string().trim().required("Name is required"),
    role: yup.string().trim().optional(),
    hourlyRate: yup
      .number()
      .transform((v, o) => (o === "" || Number.isNaN(v) ? undefined : v))
      .min(0, "Cannot be negative")
      .optional(),
    capacityHoursPerWeek: yup
      .number()
      .transform((v, o) => (o === "" || Number.isNaN(v) ? undefined : v))
      .min(0, "Cannot be negative")
      .max(168, "Easy there, hero")
      .optional(),
  })
  .required();

export default function ResourceView() {
  const { resources = [], upsertResource, removeResource } = usePulseContext();
  const { showAlert } = useAlert();

  // Selection + mode (single view approach)
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("create"); // 'create' | 'edit'

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const selected = useMemo(
    () => resources.find((r) => String(r.id) === String(selectedId)) || null,
    [resources, selectedId]
  );

  const roles = useMemo(() => {
    const set = new Set(
      (resources || []).map((r) => (r.role || "").trim()).filter(Boolean)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [resources]);

  const filteredResources = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (resources || []).filter((r) => {
      const matchesQuery =
        !q ||
        [r.name, r.role].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(q)
        );
      const matchesRole = !roleFilter || String(r.role || "") === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [resources, query, roleFilter]);

  useEffect(() => {
    if (
      selectedId &&
      !filteredResources.some((r) => String(r.id) === String(selectedId))
    ) {
      // If current selection is no longer visible, switch to create mode
      setSelectedId(null);
      setMode("create");
    }
  }, [filteredResources, selectedId]);

  // Form setup
  const { register, handleSubmit, reset, formState } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      role: "",
      hourlyRate: "",
      capacityHoursPerWeek: "",
    },
  });

  // Keep form in sync with selection/mode
  useEffect(() => {
    if (mode === "edit" && selected) {
      reset({
        name: selected.name ?? "",
        role: selected.role ?? "",
        hourlyRate: selected.hourlyRate ?? "",
        capacityHoursPerWeek: selected.capacityHoursPerWeek ?? "",
      });
    } else if (mode === "create") {
      reset({ name: "", role: "", hourlyRate: "", capacityHoursPerWeek: "" });
    }
  }, [mode, selected, reset]);

  const startCreate = useCallback(() => {
    setSelectedId(null);
    setMode("create");
  }, []);

  const startEdit = useCallback((id) => {
    setSelectedId(id);
    setMode("edit");
  }, []);

  const onSubmit = useCallback(
    async (values) => {
      const payload = {
        id: mode === "create" ? nanoid(10) : selected?.id,
        name: values.name,
        role: values.role,
        hourlyRate: Number(values.hourlyRate ?? 0),
        capacityHoursPerWeek: Number(values.capacityHoursPerWeek ?? 0),
      };

      try {
        const saved =
          mode === "create"
            ? await pulseService.resources.create(payload)
            : await pulseService.resources.update(String(selected.id), payload);

        upsertResource(saved);
        showAlert(
          mode === "create" ? "Resource created" : "Resource updated",
          "success"
        );
        if (mode === "create") {
          setSelectedId(saved.id);
          setMode("edit");
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to save resource", err);
        showAlert("Failed to save resource", "error");
      }
    },
    [mode, selected, upsertResource, showAlert]
  );

  const onDelete = useCallback(
    async (id) => {
      try {
        await pulseService.resources.delete(String(id));
        removeResource(id);
        if (String(selectedId) === String(id)) {
          startCreate();
        }
        showAlert("Resource deleted", "success");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to delete resource", err);
        showAlert("Failed to delete resource", "error");
      }
    },
    [removeResource, selectedId, startCreate, showAlert]
  );

  const { errors, isSubmitting } = formState;

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Resources</Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            size="small"
            placeholder="Search resources…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputProps={{ "aria-label": "Search resources" }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="role-filter-label">Role</InputLabel>
            <Select
              labelId="role-filter-label"
              label="Role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="">
                <em>All roles</em>
              </MenuItem>
              {roles.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={startCreate}>
            New Resource
          </Button>
        </Stack>
      </Box>

      {/* List */}
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Hourly rate</TableCell>
              <TableCell align="right">Capacity (hrs/wk)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">
                    No resources yet. Click “New Resource”.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredResources.map((r) => (
                <TableRow
                  key={r.id}
                  selected={String(r.id) === String(selectedId)}
                >
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.role}</TableCell>
                  <TableCell align="right">{r.hourlyRate ?? "—"}</TableCell>
                  <TableCell align="right">
                    {r.capacityHoursPerWeek ?? "—"}
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <Button size="small" onClick={() => startEdit(r.id)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => onDelete(r.id)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <Divider />

      {/* Inline form panel */}
      <Paper variant="outlined">
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            {mode === "create"
              ? "Create Resource"
              : `Edit Resource${selected ? ` — ${selected.name}` : ""}`}
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Name"
                {...register("name")}
                error={!!errors.name}
                helperText={errors.name?.message}
                fullWidth
              />

              <TextField
                label="Role"
                {...register("role")}
                error={!!errors.role}
                helperText={errors.role?.message}
                fullWidth
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Hourly rate"
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

              <Stack direction="row" spacing={2}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {mode === "create" ? "Create" : "Save changes"}
                </Button>
                {mode === "edit" && selected && (
                  <Button
                    type="button"
                    color="error"
                    variant="outlined"
                    onClick={() => onDelete(selected.id)}
                    disabled={isSubmitting}
                  >
                    Delete
                  </Button>
                )}
                <Box flexGrow={1} />
                <Button
                  type="button"
                  variant="text"
                  onClick={startCreate}
                  disabled={isSubmitting}
                >
                  Reset / New
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </Stack>
  );
}
