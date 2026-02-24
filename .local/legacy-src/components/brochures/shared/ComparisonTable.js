import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";

const ComparisonTable = ({ comparison }) => {
  const { title, header, rows } = comparison;

  return (
    <>
      <Typography variant="h6" sx={{ mt: 6 }} gutterBottom>
        {title}
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              {header.map((col, idx) => (
                <TableCell key={idx}>
                  <strong>{col}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={cellIndex}
                    sx={cellIndex === 0 ? { fontWeight: "bold" } : {}}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default ComparisonTable;
