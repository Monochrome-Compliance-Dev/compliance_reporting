import { ComplianceForm } from "./ComplianceForm";
import { IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatIsoDate } from "../../../lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import { FormDialogWrapper } from "./FormDialogWrapper";

export const StandardTable = ({
  fields,
  rows,
  actions,
  dense = false,
  emptyMessage = "No records to display.",
  onAdd,
  onEdit,
  onDelete,
  editingRowId,
  setEditingRowId,
  showDefaultActions = true,
  validationSchema,
  defaultValues,
}) => {
  const hasData = rows.length > 0;

  const isEditMode = editingRowId && editingRowId !== "__NEW__";
  const editingRow = isEditMode
    ? rows.find((r) => r.id === editingRowId)
    : null;

  return (
    <Box>
      <TableContainer component={Paper} elevation={0}>
        <Table size={dense ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              {fields.map((field) => (
                <TableCell key={field.key} align={field.align || "left"}>
                  {field.label}
                </TableCell>
              ))}
              {(actions || showDefaultActions) && (
                <TableCell align="center">Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {hasData ? (
              rows.map((row) => {
                const isEditing = row.id === editingRowId;
                return (
                  <TableRow key={row.id || JSON.stringify(row)}>
                    <>
                      {fields.map((field) => (
                        <TableCell
                          key={field.key}
                          align={field.align || "left"}
                        >
                          {row[field.key] != null
                            ? field.inputType === "date"
                              ? formatIsoDate(row[field.key])
                              : row[field.key].toString()
                            : ""}
                        </TableCell>
                      ))}
                      {(actions || showDefaultActions) && (
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => setEditingRowId(row.id)}
                              size="small"
                            >
                              <EditIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => onDelete(row)}
                              size="small"
                            >
                              <DeleteIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={fields.length + 1}>
                  <Typography variant="body2" align="center">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {editingRowId && (
        <FormDialogWrapper
          open={Boolean(editingRowId)}
          title={isEditMode ? "Edit Record" : "Add Record"}
          onClose={() => setEditingRowId(null)}
        >
          <ComplianceForm
            key={editingRowId}
            formKey={editingRowId}
            row={isEditMode ? editingRow : {}}
            fields={fields}
            onSubmit={isEditMode ? onEdit : onAdd}
            onCancel={() => setEditingRowId(null)}
            validationSchema={validationSchema}
            defaultValues={isEditMode ? editingRow : defaultValues}
          />
        </FormDialogWrapper>
      )}
    </Box>
  );
};
