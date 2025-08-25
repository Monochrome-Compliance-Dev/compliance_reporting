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
import { usePulseContext, useAlert } from "../../context/";
import { pulseService } from "../../services/pulse/pulse";
import { userService } from "../../services";

const schema = yup
  .object({
    name: yup.string().trim().required("Name is required"),
    email: yup.string().trim().email("Invalid email").optional(),
    phone: yup.string().trim().optional(),
    // Add additional fields as needed later (ABN, address, notes, etc.)
  })
  .required();

export default function ClientView() {
  const { clients = [], upsertClient, removeClient } = usePulseContext();
  const { showAlert } = useAlert();

  // Selection + mode
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("create"); // 'create' | 'edit'

  const selected = useMemo(
    () => clients.find((c) => String(c.id) === String(selectedId)) || null,
    [clients, selectedId]
  );

  // Search & filter (by role-like tag later; for now just name/email)
  const [query, setQuery] = useState("");
  const [emailFilter, setEmailFilter] = useState("");

  const knownEmails = useMemo(() => {
    const set = new Set(
      (clients || []).map((c) => (c.email || "").trim()).filter(Boolean)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [clients]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (clients || []).filter((c) => {
      const matchesQuery =
        !q ||
        [c.name, c.email, c.phone].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(q)
        );
      const matchesEmail =
        !emailFilter || String(c.email || "") === emailFilter;
      return matchesQuery && matchesEmail;
    });
  }, [clients, query, emailFilter]);

  useEffect(() => {
    if (
      selectedId &&
      !filteredClients.some((c) => String(c.id) === String(selectedId))
    ) {
      setSelectedId(null);
      setMode("create");
    }
  }, [filteredClients, selectedId]);

  // Form
  const { register, handleSubmit, reset, formState } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  useEffect(() => {
    if (mode === "edit" && selected) {
      reset({
        name: selected.name ?? "",
        email: selected.email ?? "",
        phone: selected.phone ?? "",
      });
    } else if (mode === "create") {
      reset({ name: "", email: "", phone: "" });
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
      let payload = {
        id: mode === "create" ? nanoid(10) : selected?.id,
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        customerId: userService.userValue.customerId,
      };

      if (mode === "create") {
        payload = { ...payload, createdBy: userService.userValue.id };
      } else if (mode === "edit") {
        payload = { ...payload, updatedBy: userService.userValue.id };
      }

      try {
        const saved =
          mode === "create"
            ? await pulseService.clients.create(payload)
            : await pulseService.clients.update(String(selected.id), payload);

        upsertClient(saved);
        showAlert(
          mode === "create" ? "Client created" : "Client updated",
          "success"
        );
        if (mode === "create") {
          setSelectedId(saved.id);
          setMode("edit");
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to save client", err);
        showAlert("Failed to save client", "error");
      }
    },
    [mode, selected, upsertClient, showAlert]
  );

  const onDelete = useCallback(
    async (id) => {
      try {
        await pulseService.clients.delete(String(id));
        removeClient(id);
        if (String(selectedId) === String(id)) {
          startCreate();
        }
        showAlert("Client deleted", "success");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to delete client", err);
        showAlert("Failed to delete client", "error");
      }
    },
    [removeClient, selectedId, startCreate, showAlert]
  );

  const { errors, isSubmitting } = formState;

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Clients</Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            size="small"
            placeholder="Search clients…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputProps={{ "aria-label": "Search clients" }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="email-filter-label">Email</InputLabel>
            <Select
              labelId="email-filter-label"
              label="Email"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
            >
              <MenuItem value="">
                <em>All emails</em>
              </MenuItem>
              {knownEmails.map((em) => (
                <MenuItem key={em} value={em}>
                  {em}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={startCreate}>
            New Client
          </Button>
        </Stack>
      </Box>

      {/* List */}
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary">
                    No clients yet. Click “New Client”.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((c) => (
                <TableRow
                  key={c.id}
                  selected={String(c.id) === String(selectedId)}
                >
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.email || "—"}</TableCell>
                  <TableCell>{c.phone || "—"}</TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <Button size="small" onClick={() => startEdit(c.id)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => onDelete(c.id)}
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
              ? "Create Client"
              : `Edit Client${selected ? ` — ${selected.name}` : ""}`}
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

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Email"
                  type="email"
                  {...register("email")}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  fullWidth
                />
                <TextField
                  label="Phone"
                  {...register("phone")}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
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
