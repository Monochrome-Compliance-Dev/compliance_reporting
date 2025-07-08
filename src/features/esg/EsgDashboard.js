import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import { esgService } from "../../services/esg/esg";
import { useAlert } from "../../context/";
import NewReportingPeriodDialog from "./NewReportingPeriodDialog";

const EsgDashboard = () => {
  const [reportingPeriods, setReportingPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const { showAlert } = useAlert();

  const fetchReportingPeriods = useCallback(async () => {
    try {
      setLoading(true);
      const periods = await esgService.getReportingPeriods();
      setReportingPeriods(periods);
    } catch (error) {
      showAlert("Failed to load reporting periods", "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchReportingPeriods();
  }, [fetchReportingPeriods]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        ESG Reporting Dashboard
      </Typography>

      <Button
        variant="contained"
        color="primary"
        sx={{ mb: 2 }}
        onClick={() => setOpenNewDialog(true)}
      >
        + New Reporting Period
      </Button>

      {loading ? (
        <CircularProgress />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportingPeriods.length > 0 ? (
              reportingPeriods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell>{period.name}</TableCell>
                  <TableCell>{period.startDate}</TableCell>
                  <TableCell>{period.endDate}</TableCell>
                  <TableCell>{period.status || "Draft"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No reporting periods found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <NewReportingPeriodDialog
        open={openNewDialog}
        onClose={() => setOpenNewDialog(false)}
        onCreated={fetchReportingPeriods}
      />
    </Container>
  );
};

export default EsgDashboard;
