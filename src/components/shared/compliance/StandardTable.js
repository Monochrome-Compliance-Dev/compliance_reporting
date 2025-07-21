import { EditableRow } from "./EditableRow";
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

export const StandardTable = ({
  columns,
  rows,
  actions,
  dense = false,
  emptyMessage = "No records to display.",
  onEdit,
  onDelete,
  editingRowId,
  setEditingRowId,
  showDefaultActions = true,
}) => {
  const hasData = rows.length > 0;

  return (
    <Box>
      <TableContainer component={Paper} elevation={0}>
        <Table size={dense ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align || "left"}>
                  {col.label}
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
                return isEditing ? (
                  <EditableRow
                    key={row.id}
                    row={row}
                    columns={columns}
                    onCancel={() => setEditingRowId(null)}
                    onSave={(updatedRow) => {
                      onEdit(updatedRow);
                      setEditingRowId(null);
                    }}
                  />
                ) : (
                  <TableRow key={row.id || JSON.stringify(row)}>
                    {columns.map((col) => (
                      <TableCell key={col.key} align={col.align || "left"}>
                        {row[col.key] != null
                          ? col.inputType === "date"
                            ? formatIsoDate(row[col.key])
                            : row[col.key].toString()
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
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1}>
                  <Typography variant="body2" align="center">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
