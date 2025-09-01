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
import { usePulseContext, useAlert } from "../../../../context";
import { pulseService } from "../../../../services/pulse/pulse";

export default function EngagementView() {
  const {
    engagements = [],
    clients = [],
    resources = [],
    removeEngagement,
  } = usePulseContext();
  const { showAlert } = useAlert();

  const navigate = useNavigate();

  // Search & filters
  const [query, setQuery] = useState("");

  const clientById = useMemo(
    () => Object.fromEntries((clients || []).map((c) => [String(c.id), c])),
    [clients]
  );

  const resourceById = useMemo(
    () => Object.fromEntries((resources || []).map((r) => [String(r.id), r])),
    [resources]
  );

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
      return matchesQuery;
    });
  }, [engagements, query, clientById, resourceById]);

  const onDelete = async (id) => {
    try {
      await pulseService.engagements.delete(String(id));
      removeEngagement(id);
      showAlert("Engagement deleted", "success");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete engagement", err);
      showAlert("Failed to delete engagement", "error");
    }
  };

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
          <Button
            component={Link}
            to="/pulse-solution/admin/engagements/manage"
            variant="contained"
          >
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
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEngagements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Button
                    component={Link}
                    to="/pulse-solution/admin/engagements/manage"
                    variant="contained"
                  >
                    New Engagement
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredEngagements.map((e) => (
                <TableRow
                  key={e.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(
                      `/pulse-solution/admin/engagements/manage?id=${encodeURIComponent(e.id)}`
                    )
                  }
                  role="button"
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
