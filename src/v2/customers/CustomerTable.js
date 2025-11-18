import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";

function CustomerTable({ rows, loading, onEdit, onDelete, onEntitlements }) {
  const theme = useTheme();

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Business name</TableCell>
            <TableCell>ABN</TableCell>
            <TableCell>Seats</TableCell>
            <TableCell>Billing type</TableCell>
            <TableCell>Active</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading && rows && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>No customers found.</TableCell>
            </TableRow>
          )}
          {rows &&
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.businessName}</TableCell>
                <TableCell>{row.abn}</TableCell>
                <TableCell>{row.seats}</TableCell>
                <TableCell>{row.billingType}</TableCell>
                <TableCell>{row.active ? "Yes" : "No"}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit customer">
                    <IconButton
                      size="small"
                      onClick={() => onEdit && onEdit(row)}
                      sx={{ marginRight: theme.spacing(1) }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Manage entitlements">
                    <IconButton
                      size="small"
                      onClick={() => onEntitlements && onEntitlements(row)}
                      sx={{ marginRight: theme.spacing(1) }}
                    >
                      <SettingsIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete customer">
                    <IconButton
                      size="small"
                      onClick={() => onDelete && onDelete(row)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default CustomerTable;
