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
  Button,
  Stack,
} from "@mui/material";
import { msService } from "../../services/ms/ms";

function MsGrievances() {
  const { reportingPeriodId } = useParams();
  const [grievances, setGrievances] = useState([]);

  useEffect(() => {
    msService.getGrievances(reportingPeriodId).then((data) => {
      if (Array.isArray(data)) setGrievances(data);
      else console.warn("Unexpected response:", data);
    });
  }, [reportingPeriodId]);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Grievances
      </Typography>
      <Button onClick={() => console.log("Add clicked")} sx={{ mb: 2 }}>
        Add Grievance
      </Button>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Grievance ID</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date Reported</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {grievances.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.date}</TableCell>
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
    </Paper>
  );
}

export default MsGrievances;
