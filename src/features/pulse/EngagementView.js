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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { usePulseContext, useAlert } from "../../context/";
import { pulseService } from "../../services/pulse/pulse";

const schema = yup
  .object({
    name: yup.string().trim().required("Name is required"),
    clientId: yup.string().trim().required("Client is required"),
    resourceId: yup.string().trim().required("Resource is required"),
    startDate: yup.string().trim().optional(),
    endDate: yup.string().trim().optional(),
  })
  .required();

export default function EngagementView() {
  const {
    engagements = [],
    clients = [],
    resources = [],
    upsertEngagement,
    removeEngagement,
  } = usePulseContext();
  const { showAlert } = useAlert();

  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("create"); // 'create' | 'edit'

  const clientById = useMemo(
    () => Object.fromEntries((clients || []).map((c) => [String(c.id), c])),
    [clients]
  );

  const resourceById = useMemo(
    () => Object.fromEntries((resources || []).map((r) => [String(r.id), r])),
    [resources]
  );

  const selected = useMemo(
    () => engagements.find((e) => String(e.id) === String(selectedId)) || null,
    [engagements, selectedId]
  );

  // Search & filters
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");

  const filteredEngagements = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (engagements || []).filter((e) => {
      const clientName = clientById[String(e.clientId)]?.name || "";
      const resourceName = resourceById[String(e.resourceId)]?.name || "";
      const matchesQuery =
        !q ||
        [e.name, clientName, resourceName].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(q)
        );
      const matchesClient =
        !clientFilter || String(e.clientId) === clientFilter;
      const matchesResource =
        !resourceFilter || String(e.resourceId) === resourceFilter;
      return matchesQuery && matchesClient && matchesResource;
    });
  }, [
    engagements,
    query,
    clientFilter,
    resourceFilter,
    clientById,
    resourceById,
  ]);

  useEffect(() => {
    if (
      selectedId &&
      !filteredEngagements.some((e) => String(e.id) === String(selectedId))
    ) {
      setSelectedId(null);
      setMode("create");
    }
  }, [filteredEngagements, selectedId]);

  // Form
  const { register, handleSubmit, reset, formState } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      clientId: "",
      resourceId: "",
      startDate: "",
      endDate: "",
    },
  });

  useEffect(() => {
    if (mode === "edit" && selected) {
      reset({
        name: selected.name ?? "",
        clientId: String(selected.clientId ?? ""),
        resourceId: String(selected.resourceId ?? ""),
        startDate: selected.startDate ?? "",
        endDate: selected.endDate ?? "",
      });
    } else if (mode === "create") {
      reset({
        name: "",
        clientId: "",
        resourceId: "",
        startDate: "",
        endDate: "",
      });
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
        clientId: values.clientId,
        resourceId: values.resourceId,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      };

      try {
        const saved =
          mode === "create"
            ? await pulseService.engagements.create(payload)
            : await pulseService.engagements.update(
                String(selected.id),
                payload
              );

        upsertEngagement(saved);
        showAlert(
          mode === "create" ? "Engagement created" : "Engagement updated",
          "success"
        );
        if (mode === "create") {
          setSelectedId(saved.id);
          setMode("edit");
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to save engagement", err);
        showAlert("Failed to save engagement", "error");
      }
    },
    [mode, selected, upsertEngagement, showAlert]
  );

  const onDelete = useCallback(
    async (id) => {
      try {
        await pulseService.engagements.delete(String(id));
        removeEngagement(id);
        if (String(selectedId) === String(id)) {
          startCreate();
        }
        showAlert("Engagement deleted", "success");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to delete engagement", err);
        showAlert("Failed to delete engagement", "error");
      }
    },
    [removeEngagement, selectedId, startCreate, showAlert]
  );

  const { errors, isSubmitting } = formState;

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Engagements</Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            size="small"
            placeholder="Search engagements…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputProps={{ "aria-label": "Search engagements" }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="client-filter-label">Client</InputLabel>
            <Select
              labelId="client-filter-label"
              label="Client"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <MenuItem value="">
                <em>All clients</em>
              </MenuItem>
              {(clients || []).map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="resource-filter-label">Resource</InputLabel>
            <Select
              labelId="resource-filter-label"
              label="Resource"
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
            >
              <MenuItem value="">
                <em>All resources</em>
              </MenuItem>
              {(resources || []).map((r) => (
                <MenuItem key={r.id} value={String(r.id)}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={startCreate}>
            New Engagement
          </Button>
        </Stack>
      </Box>

      {/* List */}
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEngagements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary">
                    No engagements yet. Click “New Engagement”.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredEngagements.map((e) => (
                <TableRow
                  key={e.id}
                  selected={String(e.id) === String(selectedId)}
                >
                  <TableCell>{e.name}</TableCell>
                  <TableCell>
                    {clientById[String(e.clientId)]?.name || "—"}
                  </TableCell>
                  <TableCell>
                    {resourceById[String(e.resourceId)]?.name || "—"}
                  </TableCell>
                  <TableCell>{e.startDate || "—"}</TableCell>
                  <TableCell>{e.endDate || "—"}</TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <Button size="small" onClick={() => startEdit(e.id)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => onDelete(e.id)}
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
              ? "Create Engagement"
              : `Edit Engagement${selected ? ` — ${selected.name}` : ""}`}
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
                <FormControl fullWidth size="small">
                  <InputLabel id="clientId-label">Client</InputLabel>
                  <Select
                    labelId="clientId-label"
                    label="Client"
                    value={undefined}
                    defaultValue=""
                    {...register("clientId")}
                  >
                    {(clients || []).map((c) => (
                      <MenuItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="resourceId-label">Resource</InputLabel>
                  <Select
                    labelId="resourceId-label"
                    label="Resource"
                    value={undefined}
                    defaultValue=""
                    {...register("resourceId")}
                  >
                    {(resources || []).map((r) => (
                      <MenuItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Start date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register("startDate")}
                  error={!!errors.startDate}
                  helperText={errors.startDate?.message}
                  fullWidth
                />
                <TextField
                  label="End date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register("endDate")}
                  error={!!errors.endDate}
                  helperText={errors.endDate?.message}
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
