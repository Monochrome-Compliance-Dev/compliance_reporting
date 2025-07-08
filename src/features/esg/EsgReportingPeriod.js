import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
} from "@mui/material";
import { esgService } from "../../services/esg/esg";
import { useAlert } from "../../context/";
import NewIndicatorDialog from "./NewIndicatorDialog";

const EsgReportingPeriod = () => {
  const { reportingPeriodId } = useParams();

  const [indicators, setIndicators] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  const [openNewDialog, setOpenNewDialog] = useState(false);

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
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Indicators</Typography>
              <Typography variant="body2" color="textSecondary">
                {loading
                  ? "Loading indicators..."
                  : indicators.length > 0
                    ? indicators.map((ind) => (
                        <div key={ind.id}>{ind.name}</div>
                      ))
                    : "No indicators found."}
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => setOpenNewDialog(true)}
              >
                + Add Indicator
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Metrics</Typography>
              <Typography variant="body2" color="textSecondary">
                {loading
                  ? "Loading metrics..."
                  : metrics.length > 0
                    ? metrics.map((m) => (
                        <div key={m.id}>
                          {m.value} {m.unit}
                        </div>
                      ))
                    : "No metrics found."}
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }}>
                + Add Metric
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <NewIndicatorDialog
        open={openNewDialog}
        onClose={() => setOpenNewDialog(false)}
        onCreated={fetchIndicatorsAgain}
        reportingPeriodId={reportingPeriodId}
      />
    </Container>
  );
};

export default EsgReportingPeriod;
