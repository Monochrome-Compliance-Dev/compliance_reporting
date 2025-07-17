import { useState, useEffect } from "react";
import { useParams } from "react-router";
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
  Button,
  Stack,
} from "@mui/material";
import { msService } from "../../services/ms/ms";

function MsSupplierRisks() {
  const { reportingPeriodId } = useParams();
  const [supplierRisks, setSupplierRisks] = useState([]);

  useEffect(() => {
    msService.getSupplierRisks(reportingPeriodId).then((data) => {
      if (Array.isArray(data)) setSupplierRisks(data);
      else console.warn("Unexpected response:", data);
    });
  }, [reportingPeriodId]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Supplier Risks
      </Typography>
      <Button onClick={() => console.log("Add clicked")} sx={{ mb: 2 }}>
        Add Supplier Risk
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Supplier Name</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Risk Level</TableCell>
              <TableCell>Last Reviewed</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {supplierRisks.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.country}</TableCell>
                <TableCell>{row.risk}</TableCell>
                <TableCell>{row.reviewed}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      onClick={() => console.log("Edit", row)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      onClick={() => console.log("Delete", row)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default MsSupplierRisks;
