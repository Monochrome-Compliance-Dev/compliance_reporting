import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import {
  Container,
  Typography,
  Button,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { esgService } from "../../services/esg/esg";
import { useAlert } from "../../context/";
import NewIndicatorDialog from "./NewIndicatorDialog";
import NewMetricDialog from "./NewMetricDialog";

const EsgReportingPeriod = () => {
  const { reportingPeriodId } = useParams();

  const [indicators, setIndicators] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [openNewMetricDialog, setOpenNewMetricDialog] = useState(false);

  const fetchMetricsAgain = async () => {
    try {
      const fetchedMetrics =
        await esgService.getMetricsByReportingPeriodId(reportingPeriodId);
      setMetrics(fetchedMetrics);
    } catch (error) {
      console.error("Failed to reload metrics:", error);
      showAlert("Failed to reload metrics", "error");
    }
  };

  const fetchIndicatorsAgain = async () => {
    try {
      const fetchedIndicators =
        await esgService.getIndicatorsByReportingPeriodId(reportingPeriodId);
      setIndicators(fetchedIndicators);
    } catch (error) {
      console.error("Failed to reload indicators:", error);
      showAlert("Failed to reload indicators", "error");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedIndicators, fetchedMetrics] = await Promise.all([
          esgService.getIndicatorsByReportingPeriodId(reportingPeriodId),
          esgService.getMetricsByReportingPeriodId(reportingPeriodId),
        ]);
        setIndicators(fetchedIndicators);
        setMetrics(fetchedMetrics);
      } catch (error) {
        console.error("Failed to load ESG data:", error);
        showAlert("Failed to load ESG data", "error");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [reportingPeriodId, showAlert]);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        ESG Reporting Period
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Period ID: {reportingPeriodId}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Indicators
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3}>Loading indicators...</TableCell>
                </TableRow>
              ) : indicators.length > 0 ? (
                indicators.map((ind) => (
                  <TableRow key={ind.id}>
                    <TableCell>{ind.name}</TableCell>
                    <TableCell>{ind.code}</TableCell>
                    <TableCell>{ind.category}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3}>No indicators found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => setOpenNewDialog(true)}
          >
            + Add Indicator
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Metrics
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Value</TableCell>
                <TableCell>Unit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2}>Loading metrics...</TableCell>
                </TableRow>
              ) : metrics.length > 0 ? (
                metrics.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.value}</TableCell>
                    <TableCell>{m.unit}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2}>No metrics found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => {
              if (!indicators || indicators.length === 0) {
                showAlert(
                  "You need to create an indicator before adding metrics.",
                  "warning"
                );
                return;
              }
              setOpenNewMetricDialog(true);
            }}
          >
            + Add Metric
          </Button>
        </Grid>
      </Grid>
      <NewIndicatorDialog
        open={openNewDialog}
        onClose={() => setOpenNewDialog(false)}
        onCreated={fetchIndicatorsAgain}
        reportingPeriodId={reportingPeriodId}
      />
      <NewMetricDialog
        open={openNewMetricDialog}
        onClose={() => setOpenNewMetricDialog(false)}
        onCreated={fetchMetricsAgain}
        reportingPeriodId={reportingPeriodId}
        indicators={indicators}
      />
    </Container>
  );
};

export default EsgReportingPeriod;
