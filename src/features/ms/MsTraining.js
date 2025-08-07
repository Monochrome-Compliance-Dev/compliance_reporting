import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControlLabel,
  TableContainer,
  Select,
  MenuItem,
} from "@mui/material";
import { useAlert } from "../../context";
import { msService } from "../../services";
import * as Yup from "yup";
import { formatIsoDate } from "../../lib/utils/formatters";
import {
  diffObjects,
  payloadSanitiser,
} from "../../lib/utils/payloadSanitiser";
import { trainingFields } from "./msTableConfigs";
import { IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function MsTraining() {
  const [records, setRecords] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    employeeName: "",
    department: "",
    completed: false,
    completedAt: "",
  });
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [initialFormValues, setInitialFormValues] = useState(null);
  const { showAlert } = useAlert();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Filtering and sorting state (CollapsibleTable style)
  const [filtersFuzzy, setFiltersFuzzy] = useState({});
  const [filtersExact, setFiltersExact] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const passesFuzzy = Object.entries(filtersFuzzy).every(([key, value]) => {
        let targetValue = record[key] ?? "";
        if (key === "completed") {
          targetValue = record.completed ? "Yes" : "No";
        }
        return String(targetValue).toLowerCase().includes(value.toLowerCase());
      });
      const passesExact = Object.entries(filtersExact).every(([key, value]) => {
        if (value === "") return true;
        let recordVal = record[key] ?? "";
        if (key === "completed") {
          recordVal = record.completed ? "Yes" : "No";
        }
        return String(recordVal) === value;
      });
      return passesFuzzy && passesExact;
    });
  }, [records, filtersFuzzy, filtersExact]);

  const sortedRecords = useMemo(() => {
    if (!sortConfig.key) return filteredRecords;
    return [...filteredRecords].sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredRecords, sortConfig]);

  const validationSchema = Yup.object().shape({
    employeeName: Yup.string()
      .trim()
      .min(3)
      .required("Employee Name is required"),
    department: Yup.string().trim().min(3).required("Department is required"),
    completed: Yup.boolean(),
    completedAt: Yup.string()
      .nullable()
      .when("completed", {
        is: true,
        then: (schema) =>
          schema.required("Completed Date is required if completed"),
        otherwise: (schema) =>
          schema.test(
            "empty-if-not-completed",
            "Completed Date must be empty if not marked as completed",
            (value) => {
              return !value;
            }
          ),
      }),
  });

  const fetchRecords = async () => {
    const data = await msService.getTraining();
    if (Array.isArray(data)) {
      setRecords(data);
    } else {
      console.warn("Unexpected data format:", data);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const hasChanged = useMemo(() => {
    if (!editingId || !initialFormValues) return false;
    const cleanedInitial = payloadSanitiser(initialFormValues, trainingFields);
    const cleanedCurrent = payloadSanitiser(formValues, trainingFields);
    const diff = diffObjects(cleanedCurrent, cleanedInitial);
    return Object.keys(diff).length > 0;
  }, [formValues, initialFormValues, editingId]);

  const handleSubmit = async () => {
    try {
      const cleanedForm = payloadSanitiser(formValues, trainingFields);
      const cleanedInitial = editingId
        ? payloadSanitiser(initialFormValues, trainingFields)
        : null;
      await validationSchema.validate(cleanedForm, { abortEarly: false });

      if (editingId) {
        const payload = diffObjects(cleanedForm, cleanedInitial);
        if (Object.keys(payload).length === 0) {
          showAlert("No changes detected", "info");
          closeDialog();
          return;
        }
        const updated = await msService.updateTraining(editingId, payload);
        setRecords((prev) =>
          prev.map((rec) => (rec.id === editingId ? updated : rec))
        );
        showAlert("Record updated", "success");
      } else {
        const payload = cleanedForm;
        const created = await msService.createTraining(payload);
        setRecords((prev) => [created, ...prev]);
        showAlert("Record added", "success");
      }
      closeDialog();
    } catch (err) {
      if (err.inner) {
        const errMap = {};
        err.inner.forEach((e) => (errMap[e.path] = e.message));
        setErrors(errMap);
      } else {
        console.error(err);
        showAlert("Failed to save record", "error");
      }
    }
  };

  const handleEdit = (record) => {
    setFormValues(record);
    setInitialFormValues(record);
    setEditingId(record.id);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      await msService.deleteTraining(recordToDelete.id);
      setRecords((prev) => prev.filter((r) => r.id !== recordToDelete.id));
      showAlert("Record deleted", "success");
    } catch (err) {
      console.error(err);
      showAlert("Failed to delete record", "error");
    } finally {
      setConfirmDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  const confirmDelete = (record) => {
    setRecordToDelete(record);
    setConfirmDialogOpen(true);
  };

  const openDialogForNew = () => {
    setFormValues({
      employeeName: "",
      department: "",
      completed: false,
      completedAt: "",
    });
    setInitialFormValues(null);
    setEditingId(null);
    setErrors({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setFormValues({
      employeeName: "",
      department: "",
      completed: false,
      completedAt: "",
    });
    setInitialFormValues(null);
    setEditingId(null);
    setErrors({});
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <h2>Training Records</h2>
        <Button variant="contained" onClick={openDialogForNew}>
          Add Training Record
        </Button>
      </Box>
      {/* Remove global search bar, since filtering is now per-column */}
      <Paper>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {/* Employee Name */}
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    verticalAlign: "bottom",
                    py: 0.25,
                    pl: 0.5,
                    pr: 0.5,
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    flexWrap="nowrap"
                  >
                    <span style={{ flex: 1 }}>Employee Name</span>
                    <IconButton
                      size="small"
                      sx={{ p: 0, ml: 0.5, flexShrink: 0 }}
                      onClick={() =>
                        setSortConfig((prev) => ({
                          ...prev,
                          key: "employeeName",
                          direction:
                            prev.key === "employeeName" &&
                            prev.direction === "asc"
                              ? "desc"
                              : "asc",
                        }))
                      }
                    >
                      {sortConfig.key === "employeeName"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : "↕️"}
                    </IconButton>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <TextField
                      size="small"
                      variant="standard"
                      placeholder="Contains..."
                      value={filtersFuzzy.employeeName ?? ""}
                      onChange={(e) =>
                        setFiltersFuzzy((prev) => ({
                          ...prev,
                          employeeName: e.target.value,
                        }))
                      }
                      sx={{
                        mb: 0.2,
                        maxWidth: 80,
                        fontSize: "0.75rem",
                        minWidth: 0,
                      }}
                      InputProps={{ style: { fontSize: "0.75rem" } }}
                    />
                    <Select
                      size="small"
                      variant="standard"
                      displayEmpty
                      value={filtersExact.employeeName ?? ""}
                      onChange={(e) =>
                        setFiltersExact((prev) => ({
                          ...prev,
                          employeeName: e.target.value,
                        }))
                      }
                      sx={{
                        mb: 0.2,
                        maxWidth: 80,
                        fontSize: "0.75rem",
                        minWidth: 0,
                      }}
                      inputProps={{ style: { fontSize: "0.75rem" } }}
                    >
                      <MenuItem value="">(All)</MenuItem>
                      {[...new Set(records.map((r) => r.employeeName || ""))]
                        .filter((v) => v)
                        .sort((a, b) => a.localeCompare(b))
                        .map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                    </Select>
                  </Box>
                </TableCell>
                {/* Department */}
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    verticalAlign: "bottom",
                    py: 0.25,
                    pl: 0.5,
                    pr: 0.5,
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    flexWrap="nowrap"
                  >
                    <span style={{ flex: 1 }}>Department</span>
                    <IconButton
                      size="small"
                      sx={{ p: 0, ml: 0.5, flexShrink: 0 }}
                      onClick={() =>
                        setSortConfig((prev) => ({
                          ...prev,
                          key: "department",
                          direction:
                            prev.key === "department" &&
                            prev.direction === "asc"
                              ? "desc"
                              : "asc",
                        }))
                      }
                    >
                      {sortConfig.key === "department"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : "↕️"}
                    </IconButton>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <TextField
                      size="small"
                      variant="standard"
                      placeholder="Contains..."
                      value={filtersFuzzy.department ?? ""}
                      onChange={(e) =>
                        setFiltersFuzzy((prev) => ({
                          ...prev,
                          department: e.target.value,
                        }))
                      }
                      sx={{
                        mb: 0.2,
                        maxWidth: 80,
                        fontSize: "0.75rem",
                        minWidth: 0,
                      }}
                      InputProps={{ style: { fontSize: "0.75rem" } }}
                    />
                    <Select
                      size="small"
                      variant="standard"
                      displayEmpty
                      value={filtersExact.department ?? ""}
                      onChange={(e) =>
                        setFiltersExact((prev) => ({
                          ...prev,
                          department: e.target.value,
                        }))
                      }
                      sx={{
                        mb: 0.2,
                        maxWidth: 80,
                        fontSize: "0.75rem",
                        minWidth: 0,
                      }}
                      inputProps={{ style: { fontSize: "0.75rem" } }}
                    >
                      <MenuItem value="">(All)</MenuItem>
                      {[...new Set(records.map((r) => r.department || ""))]
                        .filter((v) => v)
                        .sort((a, b) => a.localeCompare(b))
                        .map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                    </Select>
                  </Box>
                </TableCell>
                {/* Completed */}
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    verticalAlign: "bottom",
                    py: 0.25,
                    pl: 0.5,
                    pr: 0.5,
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    flexWrap="nowrap"
                  >
                    <span style={{ flex: 1 }}>Completed</span>
                    <IconButton
                      size="small"
                      sx={{ p: 0, ml: 0.5, flexShrink: 0 }}
                      onClick={() =>
                        setSortConfig((prev) => ({
                          ...prev,
                          key: "completed",
                          direction:
                            prev.key === "completed" && prev.direction === "asc"
                              ? "desc"
                              : "asc",
                        }))
                      }
                    >
                      {sortConfig.key === "completed"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : "↕️"}
                    </IconButton>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <TextField
                      size="small"
                      variant="standard"
                      placeholder="Contains..."
                      value={filtersFuzzy.completed ?? ""}
                      onChange={(e) =>
                        setFiltersFuzzy((prev) => ({
                          ...prev,
                          completed: e.target.value,
                        }))
                      }
                      sx={{
                        mb: 0.2,
                        maxWidth: 80,
                        fontSize: "0.75rem",
                        minWidth: 0,
                      }}
                      InputProps={{ style: { fontSize: "0.75rem" } }}
                    />
                    <Select
                      size="small"
                      variant="standard"
                      displayEmpty
                      value={filtersExact.completed ?? ""}
                      onChange={(e) =>
                        setFiltersExact((prev) => ({
                          ...prev,
                          completed: e.target.value,
                        }))
                      }
                      sx={{
                        mb: 0.2,
                        maxWidth: 80,
                        fontSize: "0.75rem",
                        minWidth: 0,
                      }}
                      inputProps={{ style: { fontSize: "0.75rem" } }}
                    >
                      <MenuItem value="">(All)</MenuItem>
                      <MenuItem value="Yes">Yes</MenuItem>
                      <MenuItem value="No">No</MenuItem>
                    </Select>
                  </Box>
                </TableCell>
                {/* Completed Date */}
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    verticalAlign: "bottom",
                    py: 0.25,
                    pl: 0.5,
                    pr: 0.5,
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    flexWrap="nowrap"
                  >
                    <span style={{ flex: 1 }}>Completed Date</span>
                    <IconButton
                      size="small"
                      sx={{ p: 0, ml: 0.5, flexShrink: 0 }}
                      onClick={() =>
                        setSortConfig((prev) => ({
                          ...prev,
                          key: "completedAt",
                          direction:
                            prev.key === "completedAt" &&
                            prev.direction === "asc"
                              ? "desc"
                              : "asc",
                        }))
                      }
                    >
                      {sortConfig.key === "completedAt"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : "↕️"}
                    </IconButton>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <TextField
                      size="small"
                      variant="standard"
                      placeholder="Contains..."
                      value={filtersFuzzy.completedAt ?? ""}
                      onChange={(e) =>
                        setFiltersFuzzy((prev) => ({
                          ...prev,
                          completedAt: e.target.value,
                        }))
                      }
                      sx={{
                        mb: 0.2,
                        maxWidth: 80,
                        fontSize: "0.75rem",
                        minWidth: 0,
                      }}
                      InputProps={{ style: { fontSize: "0.75rem" } }}
                    />
                    <Select
                      size="small"
                      variant="standard"
                      displayEmpty
                      value={filtersExact.completedAt ?? ""}
                      onChange={(e) =>
                        setFiltersExact((prev) => ({
                          ...prev,
                          completedAt: e.target.value,
                        }))
                      }
                      sx={{
                        mb: 0.2,
                        maxWidth: 80,
                        fontSize: "0.75rem",
                        minWidth: 0,
                      }}
                      inputProps={{ style: { fontSize: "0.75rem" } }}
                    >
                      <MenuItem value="">(All)</MenuItem>
                      {[
                        ...new Set(
                          records.map((r) =>
                            r.completedAt ? formatIsoDate(r.completedAt) : ""
                          )
                        ),
                      ]
                        .filter((v) => v)
                        .sort((a, b) => a.localeCompare(b))
                        .map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                    </Select>
                  </Box>
                </TableCell>
                {/* Actions */}
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    verticalAlign: "top",
                    py: 0.25,
                    pl: 3,
                    pr: 0.5,
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.employeeName}</TableCell>
                  <TableCell>{record.department}</TableCell>
                  <TableCell>{record.completed ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {formatIsoDate(record.completedAt) || ""}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleEdit(record)}>
                        <EditIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        onClick={() => confirmDelete(record)}
                      >
                        <DeleteIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth>
        <DialogTitle>
          {editingId ? "Edit Training Record" : "Add Training Record"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Employee Name"
            name="employeeName"
            value={formValues.employeeName || ""}
            onChange={handleChange}
            error={!!errors.employeeName}
            helperText={errors.employeeName}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Department"
            name="department"
            value={formValues.department || ""}
            onChange={handleChange}
            error={!!errors.department}
            helperText={errors.department}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formValues.completed}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    completed: e.target.checked,
                  }))
                }
                name="completed"
              />
            }
            label="Completed"
          />
          <TextField
            fullWidth
            margin="normal"
            label="Completed Date"
            name="completedAt"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={
              formValues.completedAt ? formValues.completedAt.slice(0, 10) : ""
            }
            onChange={handleChange}
            error={!!errors.completedAt}
            helperText={errors.completedAt}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={editingId && !hasChanged}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this training record?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MsTraining;
