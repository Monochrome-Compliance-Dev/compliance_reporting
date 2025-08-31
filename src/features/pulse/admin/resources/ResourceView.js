import { useState, useMemo, useEffect, useCallback } from "react";
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
  Drawer,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAlert, usePulseContext } from "../../../../context";
import { pulseService } from "../../../../services/pulse/pulse";
import { userService } from "../../../../services";

const RESOURCE_OPTIONS = [
  "Auditor (1st year)",
  "Auditor (2nd year)",
  "Auditor (3rd year)",
  "Senior",
  "Manager",
  "Senior Manager",
  "Director",
  "Partner",
];

const schema = yup
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

export default function ResourceView() {
  const { resources = [], upsertResource, removeResource } = usePulseContext();
  const { showAlert } = useAlert();

  // Selection + mode (single view approach)
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("create"); // 'create' | 'edit'
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [query, setQuery] = useState("");

  const [confirm, setConfirm] = useState({ open: false, id: null, name: "" });
  const openConfirmDelete = useCallback((id, name) => {
    setConfirm({ open: true, id, name: name || "" });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirm({ open: false, id: null, name: "" });
  }, []);

  const selected = useMemo(
    () => resources.find((r) => String(r.id) === String(selectedId)) || null,
    [resources, selectedId]
  );

  const filteredResources = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (resources || []).filter((r) => {
      const matchesQuery =
        !q ||
        [r.name, r.position].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(q)
        );
      return matchesQuery;
    });
  }, [resources, query]);

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
      firstName: "",
      lastName: "",
      role: "",
      position: "",
      hourlyRate: "",
      capacityHoursPerWeek: "",
      email: "",
      userId: "",
    },
  });

  // Keep form in sync with selection/mode
  useEffect(() => {
    if (mode === "edit" && selected) {
      // Split selected.name into firstName and lastName
      let firstName = "";
      let lastName = "";
      if (selected.name) {
        const parts = String(selected.name).trim().split(" ");
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }
      reset({
        firstName,
        lastName,
        role: selected.role ?? "",
        position: selected.position ?? "",
        hourlyRate: selected.hourlyRate ?? "",
        capacityHoursPerWeek: selected.capacityHoursPerWeek ?? "",
        email: selected.email ?? "",
        userId: selected.userId ?? "",
      });
    } else if (mode === "create") {
      reset({
        firstName: "",
        lastName: "",
        role: "",
        position: "",
        hourlyRate: "",
        capacityHoursPerWeek: "",
        email: "",
        userId: "",
      });
    }
  }, [mode, selected, reset]);

  const startCreate = useCallback(() => {
    setSelectedId(null);
    setMode("create");
    setDrawerOpen(true);
  }, []);

  const startEdit = useCallback((id) => {
    setSelectedId(id);
    setMode("edit");
    setDrawerOpen(true);
  }, []);

  const onSubmit = useCallback(
    async (values) => {
      try {
        if (mode === "create" && !values.userId) {
          // Composite: invite user + create linked resource atomically
          if (!values.email) {
            showAlert("Email is required to invite the user", "warning");
            return;
          }

          const payload = {
            user: {
              email: values.email,
              role: values.role || "User",
              firstName: values.firstName,
              lastName: values.lastName,
              customerId: userService.userValue.customerId,
              phone: "",
              active: false,
            },
            resource: {
              name: `${values.firstName} ${values.lastName}`.trim(),
              position: values.position || "",
              hourlyRate: Number(values.hourlyRate ?? 0),
              capacityHoursPerWeek: Number(values.capacityHoursPerWeek ?? 0),
            },
            createdBy: userService.userValue.id,
          };

          const { resource } = await userService.inviteWithResource(payload);
          upsertResource(resource);
          showAlert("Invitation sent and resource created", "success");
          setSelectedId(resource.id);
          setMode("edit");
          setDrawerOpen(false);
          return;
        }

        const normalizedUserId =
          (values.userId && String(values.userId).trim()) || null;

        // Fallback: manual link via userId, or editing existing resource
        const basePayload = {
          name: `${values.firstName} ${values.lastName}`.trim(),
          position: values.position,
          hourlyRate: Number(values.hourlyRate ?? 0),
          capacityHoursPerWeek: Number(values.capacityHoursPerWeek ?? 0),
          customerId: userService.userValue.customerId,
          userId: normalizedUserId,
        };

        const payload =
          mode === "create"
            ? { ...basePayload, createdBy: userService.userValue.id }
            : { ...basePayload, updatedBy: userService.userValue.id };

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
          setDrawerOpen(false);
        }
        setDrawerOpen(false);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to save resource", err);
        showAlert(err?.message || "Failed to save resource", "error");
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
              <TableCell>Position</TableCell>
              <TableCell align="right">Hourly charge-out rate</TableCell>
              <TableCell align="right">Capacity (hrs/wk)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Button variant="contained" onClick={startCreate}>
                    New Resource
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredResources.map((r) => (
                <TableRow
                  key={r.id}
                  hover
                  onClick={() => startEdit(r.id)}
                  sx={{ cursor: "pointer" }}
                  selected={String(r.id) === String(selectedId)}
                >
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.position}</TableCell>
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
                      <Button
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          openConfirmDelete(r.id, r.name);
                        }}
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

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 520 } } }}
      >
        <Box
          p={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">
            {mode === "create"
              ? "Create Resource"
              : `Edit Resource${selected ? ` — ${selected.name}` : ""}`}
          </Typography>
          <IconButton aria-label="Close" onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        {mode === "edit" && selected && (
          <Box px={2} pb={1}>
            <Typography variant="caption" color="text.secondary">
              ID: {selected.id}
            </Typography>
          </Box>
        )}
        <Divider />
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          p={2}
        >
          <Stack spacing={2}>
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

            <TextField
              select
              label="Role"
              {...register("role")}
              error={!!errors.role}
              helperText={errors.role?.message}
              fullWidth
            >
              <MenuItem value="User">User</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </TextField>
            <TextField
              select
              label="Position"
              {...register("position")}
              error={!!errors.position}
              helperText={errors.position?.message}
              fullWidth
            >
              {RESOURCE_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>

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

            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {mode === "create" ? "Create" : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => setDrawerOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {mode === "edit" && selected && (
                <Button
                  type="button"
                  color="error"
                  variant="outlined"
                  onClick={() => openConfirmDelete(selected.id, selected.name)}
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
      </Drawer>
      <Dialog
        open={confirm.open}
        onClose={closeConfirm}
        aria-labelledby="confirm-delete-title"
      >
        <DialogTitle id="confirm-delete-title">Delete resource?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently remove{" "}
            <strong>{confirm.name || "this resource"}</strong>. This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} variant="text">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await onDelete(confirm.id);
              closeConfirm();
            }}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
