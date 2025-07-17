import { useState, useEffect } from "react";
import { useParams } from "react-router";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { msService } from "../../services/ms/ms";

function MsTraining() {
  const { reportingPeriodId } = useParams();
  const [trainingData, setTrainingData] = useState([]);

  useEffect(() => {
    msService.getTrainingRecords(reportingPeriodId).then((data) => {
      if (Array.isArray(data)) setTrainingData(data);
      else console.warn("Unexpected response:", data);
    });
  }, [reportingPeriodId]);

  return (
    <>
      <Button onClick={() => console.log("Add clicked")} sx={{ mb: 2 }}>
        Add Training Record
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Training Completed</TableCell>
              <TableCell>Date Completed</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trainingData.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.department}</TableCell>
                <TableCell>{row.completed}</TableCell>
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
    </>
  );
}

export default MsTraining;
