import {
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Box,
} from "@mui/material";

const EsgDataTable = ({
  title,
  columns = [],
  data = [],
  loading = false,
  renderRow,
  onAdd,
  addLabel = "+ Add",
  onDelete,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((col, idx) => (
              <TableCell key={idx}>{col}</TableCell>
            ))}
            {onDelete && <TableCell>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length + (onDelete ? 1 : 0)}>
                Loading...
              </TableCell>
            </TableRow>
          ) : data.length > 0 ? (
            data.map((row, index) => (
              <TableRow key={row.id || index}>
                {renderRow(row).map((cell, i) => (
                  <TableCell key={i}>{cell}</TableCell>
                ))}
                {onDelete && (
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onDelete(row.id)}
                      sx={{ color: "error.main" }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length + (onDelete ? 1 : 0)}>
                No {title.toLowerCase()} found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Button variant="contained" sx={{ mt: 2 }} onClick={onAdd}>
        {addLabel}
      </Button>
    </Box>
  );
};

export default EsgDataTable;
