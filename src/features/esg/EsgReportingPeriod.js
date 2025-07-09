import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Container, Typography, Button, Grid } from "@mui/material";
import { esgService } from "../../services/esg/esg";
import { useAlert } from "../../context/";
import NewIndicatorDialog from "./NewIndicatorDialog";
import NewMetricDialog from "./NewMetricDialog";
import EsgSummary from "./EsgSummary";
import EsgDataTable from "./EsgDataTable";
import ConfirmDeleteIndicatorDialog from "./ConfirmDeleteIndicatorDialog";

const EsgReportingPeriod = () => {
  const { reportingPeriodId } = useParams();

  const [indicators, setIndicators] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [openNewMetricDialog, setOpenNewMetricDialog] = useState(false);
  const [indicatorToDelete, setIndicatorToDelete] = useState(null);

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

  const handleDeleteIndicator = (indicator) => {
    setIndicatorToDelete(indicator);
  };

  const confirmDeleteIndicator = async (indicatorId, associatedMetrics) => {
    try {
      for (const metric of associatedMetrics) {
        await esgService.deleteMetric(metric.id);
      }
      await esgService.deleteIndicator(indicatorId);
      showAlert("Indicator and associated metrics deleted.", "success");
      fetchIndicatorsAgain();
      fetchMetricsAgain();
    } catch (error) {
      console.error("Failed to delete indicator or metrics:", error);
      showAlert("Failed to delete indicator and its metrics.", "error");
    } finally {
      setIndicatorToDelete(null);
    }
  };

  const handleDeleteMetric = async (metricId) => {
    try {
      await esgService.deleteMetric(metricId);
      showAlert("Metric deleted.", "success");
      fetchMetricsAgain();
    } catch (error) {
      console.error("Failed to delete metric:", error);
      showAlert("Failed to delete metric.", "error");
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
    <Container sx={{ mt: (theme) => theme.spacing(4) }}>
      <Typography variant="h4" gutterBottom>
        ESG Reporting Period
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Period ID: {reportingPeriodId}
      </Typography>

      <EsgSummary indicators={indicators} metrics={metrics} />

      <Grid container spacing={3} sx={{ mt: (theme) => theme.spacing(2) }}>
        <Grid item xs={12}>
          <EsgDataTable
            title="Indicators"
            columns={["Name", "Code", "Category"]}
            data={indicators}
            loading={loading}
            renderRow={(ind) => [ind.name, ind.code, ind.category]}
            onAdd={() => setOpenNewDialog(true)}
            addLabel="+ Add Indicator"
            onDelete={(indicatorId) => {
              const indicator = indicators.find((i) => i.id === indicatorId);
              handleDeleteIndicator(indicator);
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <EsgDataTable
            title="Metrics"
            columns={["Value", "Unit"]}
            data={metrics}
            loading={loading}
            renderRow={(m) => [m.value, m.unit]}
            onAdd={() => {
              if (!indicators || indicators.length === 0) {
                showAlert(
                  "You need to create an indicator before adding metrics.",
                  "warning"
                );
                return;
              }
              setOpenNewMetricDialog(true);
            }}
            addLabel="+ Add Metric"
            onDelete={handleDeleteMetric}
          />
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
        metrics={metrics}
      />
      <ConfirmDeleteIndicatorDialog
        open={!!indicatorToDelete}
        onClose={() => setIndicatorToDelete(null)}
        onConfirm={confirmDeleteIndicator}
        indicator={indicatorToDelete}
        metrics={metrics}
      />
    </Container>
  );
};

export default EsgReportingPeriod;
