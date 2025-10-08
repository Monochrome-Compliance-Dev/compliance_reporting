import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
} from "@mui/material";
import { useAlert, usePulseContext } from "context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listTrackables,
  deleteTrackable,
  listClients,
  listResources,
} from "../../services/pulseApi";

export default function TrackableView() {
  const { showAlert } = useAlert();
  const { config } = usePulseContext();
  const showClient = config?.requiresClient !== false; // default true
  const columnCount = 6 + (showClient ? 1 : 0); // Name, [Client], Resource, Start, End, Status, Actions

  const navigate = useNavigate();

  const qc = useQueryClient();

  const {
    data: rawTrackables,
    isLoading: isLoadingTrackables,
    isError: isErrorTrackables,
    error: trackablesError,
  } = useQuery({
    queryKey: ["pulse", "trackables"],
    queryFn: listTrackables,
  });
  const trackables = useMemo(
    () => (Array.isArray(rawTrackables) ? rawTrackables : []),
    [rawTrackables]
  );

  const { data: rawClients } = useQuery({
    queryKey: ["pulse", "clients"],
    queryFn: listClients,
  });
  const clients = useMemo(
    () => (Array.isArray(rawClients) ? rawClients : []),
    [rawClients]
  );

  const { data: rawResources } = useQuery({
    queryKey: ["pulse", "resources"],
    queryFn: listResources,
  });
  const resources = useMemo(
    () => (Array.isArray(rawResources) ? rawResources : []),
    [rawResources]
  );

  if (isErrorTrackables && trackablesError) {
    // eslint-disable-next-line no-console
    console.error("Failed to load trackables", trackablesError);
  }

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTrackable(String(id)),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["pulse", "trackables"] }),
  });

  // Search & filters
  const [query, setQuery] = useState("");

  const clientById = useMemo(
    () => Object.fromEntries(clients.map((c) => [String(c.id), c])),
    [clients]
  );

  const resourceById = useMemo(
    () => Object.fromEntries(resources.map((r) => [String(r.id), r])),
    [resources]
  );

  const filteredTrackables = useMemo(() => {
    const q = query.trim().toLowerCase();
    return trackables.filter((e) => {
      const clientName = clientById[String(e.clientId)]?.name || "";
      const resourceName = resourceById[String(e.resourceId)]?.name || "";
      const haystack = [e.name, resourceName];
      if (showClient) haystack.push(clientName);
      const matchesQuery =
        !q ||
        haystack.some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(q)
        );
      return matchesQuery;
    });
  }, [trackables, query, clientById, resourceById, showClient]);

  const onDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(String(id));
      showAlert("Trackable deleted", "success");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete trackable", err);
      showAlert("Failed to delete trackable", "error");
    }
  };

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Trackables</Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            size="small"
            placeholder="Search trackables…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputProps={{ "aria-label": "Search trackables" }}
          />
          <Button
            component={Link}
            to="/v2/pulse/admin/trackables/new"
            variant="contained"
          >
            New Trackable
          </Button>
        </Stack>
      </Box>

      {/* List */}
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              {showClient && <TableCell>Client</TableCell>}
              <TableCell>Resource</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoadingTrackables ? (
              <TableRow>
                <TableCell colSpan={columnCount}>
                  <Typography variant="body2">Loading trackables…</Typography>
                </TableCell>
              </TableRow>
            ) : filteredTrackables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount}>
                  <Button
                    component={Link}
                    to="/v2/pulse/admin/trackables/new"
                    variant="contained"
                  >
                    New Trackable
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredTrackables.map((e) => (
                <TableRow
                  key={e.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(
                      `/v2/pulse/admin/trackables/${encodeURIComponent(e.id)}`
                    )
                  }
                  role="button"
                >
                  <TableCell>{e.name}</TableCell>
                  {showClient && (
                    <TableCell>
                      {clientById[String(e.clientId)]?.name || "—"}
                    </TableCell>
                  )}
                  <TableCell>
                    {resourceById[String(e.resourceId)]?.name || "—"}
                  </TableCell>
                  <TableCell>{e.startDate || "—"}</TableCell>
                  <TableCell>{e.endDate || "—"}</TableCell>
                  <TableCell>{e.status || "—"}</TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <Button
                        size="small"
                        color="error"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(e.id);
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
    </Stack>
  );
}
