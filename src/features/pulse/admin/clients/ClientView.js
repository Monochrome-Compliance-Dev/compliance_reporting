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
  Drawer,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { usePulseContext, useAlert } from "../../../../context/";
import { pulseService } from "../../../../services/pulse/pulse";
import { userService } from "../../../../services";

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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, id: null, name: "" });
  const openConfirmDelete = useCallback((id, name) => {
    setConfirm({ open: true, id, name: name || "" });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirm({ open: false, id: null, name: "" });
  }, []);

  const selected = useMemo(
    () => clients.find((c) => String(c.id) === String(selectedId)) || null,
    [clients, selectedId]
  );

  // Search & filter (by role-like tag later; for now just name/email)
  const [query, setQuery] = useState("");

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
      return matchesQuery;
    });
  }, [clients, query]);

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
    setDrawerOpen(true);
  }, []);

  const startEdit = useCallback((id) => {
    setSelectedId(id);
    setMode("edit");
    setDrawerOpen(true);
  }, []);

  const onSubmit = useCallback(
    async (values) => {
      const basePayload = {
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        customerId: userService.userValue.customerId,
      };

      const payload =
        mode === "create"
          ? { ...basePayload, createdBy: userService.userValue.id }
          : { ...basePayload, updatedBy: userService.userValue.id };

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
        setDrawerOpen(false);
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
                  hover
                  onClick={() => startEdit(c.id)}
                  sx={{ cursor: "pointer" }}
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
                      <Button
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          openConfirmDelete(c.id, c.name);
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

      {/* Drawer for form */}
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
              ? "Create Client"
              : `Edit Client${selected ? ` — ${selected.name}` : ""}`}
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
        <DialogTitle id="confirm-delete-title">Delete client?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently remove{" "}
            <strong>{confirm.name || "this client"}</strong>. This action cannot
            be undone.
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
