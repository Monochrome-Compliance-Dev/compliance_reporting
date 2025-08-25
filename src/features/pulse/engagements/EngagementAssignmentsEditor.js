import { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
} from "@mui/material";

export default function EngagementAssignmentsEditor({
  engagementId,
  resources = [],
  initialAssignments = [],
  onSave,
}) {
  const resourceById = useMemo(
    () => Object.fromEntries(resources.map((r) => [String(r.id), r])),
    [resources]
  );

  const [selectedResourceIds, setSelectedResourceIds] = useState(
    initialAssignments.map((a) => String(a.resourceId))
  );

  const [details, setDetails] = useState(() => {
    const map = {};
    initialAssignments.forEach((a) => {
      map[String(a.resourceId)] = {
        allocationPct: a.allocationPct ?? 0,
        startDate: a.startDate || "",
        endDate: a.endDate || "",
        role: a.role || "",
        rateOverride: a.rateOverride ?? "",
        notes: a.notes || "",
      };
    });
    return map;
  });

  const addResource = (rid) => {
    setSelectedResourceIds((prev) =>
      prev.includes(rid) ? prev : [...prev, rid]
    );
  };
  const removeResource = (rid) => {
    setSelectedResourceIds((prev) => prev.filter((x) => x !== rid));
    setDetails((prev) => {
      const next = { ...prev };
      delete next[rid];
      return next;
    });
  };

  const handleSave = async () => {
    const assignments = selectedResourceIds.map((rid) => ({
      resourceId: rid,
      engagementId,
      allocationPct: Number(details[rid]?.allocationPct || 0),
      startDate: details[rid]?.startDate || undefined,
      endDate: details[rid]?.endDate || undefined,
      role: details[rid]?.role || undefined,
      rateOverride: details[rid]?.rateOverride
        ? Number(details[rid].rateOverride)
        : undefined,
      notes: details[rid]?.notes || undefined,
    }));
    await onSave?.(assignments);
  };

  return (
    <Paper variant="outlined">
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Assignments
        </Typography>
        {!engagementId ? (
          <Typography color="text.secondary">
            Save the engagement first to assign resources.
          </Typography>
        ) : (
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="resource-add-label">Add resource</InputLabel>
                <Select
                  labelId="resource-add-label"
                  label="Add resource"
                  value=""
                  onChange={(e) => {
                    const rid = String(e.target.value);
                    if (!rid) return;
                    addResource(rid);
                  }}
                >
                  <MenuItem value="">
                    <em>Select…</em>
                  </MenuItem>
                  {resources.map((r) => (
                    <MenuItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!engagementId || selectedResourceIds.length === 0}
              >
                Save assignments
              </Button>
            </Stack>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Resource</TableCell>
                  <TableCell width={120}>Allocation %</TableCell>
                  <TableCell width={160}>Start</TableCell>
                  <TableCell width={160}>End</TableCell>
                  <TableCell>Role (on engagement)</TableCell>
                  <TableCell width={140}>Rate override</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedResourceIds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="text.secondary">
                        No resources assigned.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedResourceIds.map((rid) => (
                    <TableRow key={rid}>
                      <TableCell>{resourceById[rid]?.name || rid}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, max: 100, step: 5 }}
                          value={details[rid]?.allocationPct ?? ""}
                          onChange={(e) =>
                            setDetails((prev) => ({
                              ...prev,
                              [rid]: {
                                ...(prev[rid] || {}),
                                allocationPct: Number(e.target.value || 0),
                              },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="date"
                          value={details[rid]?.startDate || ""}
                          onChange={(e) =>
                            setDetails((prev) => ({
                              ...prev,
                              [rid]: {
                                ...(prev[rid] || {}),
                                startDate: e.target.value,
                              },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="date"
                          value={details[rid]?.endDate || ""}
                          onChange={(e) =>
                            setDetails((prev) => ({
                              ...prev,
                              [rid]: {
                                ...(prev[rid] || {}),
                                endDate: e.target.value,
                              },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={details[rid]?.role || ""}
                          onChange={(e) =>
                            setDetails((prev) => ({
                              ...prev,
                              [rid]: {
                                ...(prev[rid] || {}),
                                role: e.target.value,
                              },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: 1 }}
                          value={details[rid]?.rateOverride ?? ""}
                          onChange={(e) =>
                            setDetails((prev) => ({
                              ...prev,
                              [rid]: {
                                ...(prev[rid] || {}),
                                rateOverride: e.target.value,
                              },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={details[rid]?.notes || ""}
                          onChange={(e) =>
                            setDetails((prev) => ({
                              ...prev,
                              [rid]: {
                                ...(prev[rid] || {}),
                                notes: e.target.value,
                              },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removeResource(rid)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
