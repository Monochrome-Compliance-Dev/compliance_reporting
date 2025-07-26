import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

const ComparisonTable = ({ columns, rows }) => {
  const theme = useTheme();

  if (!columns || columns.length === 0 || !rows || rows.length === 0) {
    return null;
  }

  return (
    <Box mt={4}>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column, idx) => (
                <TableCell
                  key={idx}
                  sx={{
                    ...theme.typography.subtitle1,
                    backgroundColor: theme.palette.background.navbar,
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                {columns.map((col, idx) => (
                  <TableCell key={idx} sx={{ ...theme.typography.body2 }}>
                    {row[col]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ComparisonTable;
