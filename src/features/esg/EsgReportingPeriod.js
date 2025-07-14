import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
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
  const navigate = useNavigate();

  const [indicators, setIndicators] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [openNewMetricDialog, setOpenNewMetricDialog] = useState(false);
  const [indicatorToDelete, setIndicatorToDelete] = useState(null);
  const [period, setPeriod] = useState(null);

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
    if (!window.confirm("Are you sure you want to delete this metric?")) {
      return;
    }
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
        const [fetchedIndicators, fetchedMetrics, fetchedPeriod] =
          await Promise.all([
            esgService.getIndicatorsByReportingPeriodId(reportingPeriodId),
            esgService.getMetricsByReportingPeriodId(reportingPeriodId),
            esgService.getReportingPeriodById(reportingPeriodId),
          ]);
        setIndicators(fetchedIndicators);
        setMetrics(fetchedMetrics);
        setPeriod(fetchedPeriod);
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
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" gutterBottom>
          ESG Reporting Period
        </Typography>
        <Button variant="outlined" onClick={() => navigate("/esg")}>
          ← Back to ESG Dashboard
        </Button>
      </Grid>
      <Typography variant="subtitle1" gutterBottom>
        Period ID: {reportingPeriodId}
      </Typography>
      <Typography variant="subtitle2">Status: {period?.status}</Typography>

      {/* Approval workflow buttons */}
      {period && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {period.status === "Draft" && (
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={async () => {
                  try {
                    await esgService.submitReportingPeriod(reportingPeriodId);
                    showAlert("Submitted for approval.", "success");
                    // Reload all data including period
                    setLoading(true);
                    const [fetchedIndicators, fetchedMetrics, fetchedPeriod] =
                      await Promise.all([
                        esgService.getIndicatorsByReportingPeriodId(
                          reportingPeriodId
                        ),
                        esgService.getMetricsByReportingPeriodId(
                          reportingPeriodId
                        ),
                        esgService.getReportingPeriodById(reportingPeriodId),
                      ]);
                    setIndicators(fetchedIndicators);
                    setMetrics(fetchedMetrics);
                    setPeriod(fetchedPeriod);
                  } catch (err) {
                    console.error(err);
                    showAlert("Failed to submit for approval.", "error");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Submit for Approval
              </Button>
            </Grid>
          )}
          {period.status === "PendingApproval" && (
            <>
              <Grid item>
                <Button
                  variant="contained"
                  color="success"
                  onClick={async () => {
                    try {
                      await esgService.approveReportingPeriod(
                        reportingPeriodId
                      );
                      showAlert("Period approved and locked.", "success");
                      setLoading(true);
                      const [fetchedIndicators, fetchedMetrics, fetchedPeriod] =
                        await Promise.all([
                          esgService.getIndicatorsByReportingPeriodId(
                            reportingPeriodId
                          ),
                          esgService.getMetricsByReportingPeriodId(
                            reportingPeriodId
                          ),
                          esgService.getReportingPeriodById(reportingPeriodId),
                        ]);
                      setIndicators(fetchedIndicators);
                      setMetrics(fetchedMetrics);
                      setPeriod(fetchedPeriod);
                    } catch (err) {
                      console.error(err);
                      showAlert("Failed to approve.", "error");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Approve & Lock
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  onClick={async () => {
                    try {
                      await esgService.rollbackReportingPeriod(
                        reportingPeriodId
                      );
                      showAlert("Rolled back to Draft.", "info");
                      setLoading(true);
                      const [fetchedIndicators, fetchedMetrics, fetchedPeriod] =
                        await Promise.all([
                          esgService.getIndicatorsByReportingPeriodId(
                            reportingPeriodId
                          ),
                          esgService.getMetricsByReportingPeriodId(
                            reportingPeriodId
                          ),
                          esgService.getReportingPeriodById(reportingPeriodId),
                        ]);
                      setIndicators(fetchedIndicators);
                      setMetrics(fetchedMetrics);
                      setPeriod(fetchedPeriod);
                    } catch (err) {
                      console.error(err);
                      showAlert("Failed to rollback.", "error");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Rollback to Draft
                </Button>
              </Grid>
            </>
          )}
          {period.status === "Approved" && (
            <Grid item>
              <Typography color="textSecondary">
                This period is approved and locked.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      <EsgSummary indicators={indicators} metrics={metrics} />

      <Grid container spacing={3} sx={{ mt: (theme) => theme.spacing(2) }}>
        <Grid item xs={12}>
          <div
            style={
              period?.status === "Approved"
                ? { opacity: 0.6, pointerEvents: "none" }
                : {}
            }
          >
            <EsgDataTable
              title="Indicators"
              columns={["Name", "Code", "Category"]}
              data={indicators}
              loading={loading}
              renderRow={(ind) => [ind.name, ind.code, ind.category]}
              isLocked={period?.status === "Approved"}
              onAdd={() => setOpenNewDialog(true)}
              onDelete={(indicatorId) => {
                const indicator = indicators.find((i) => i.id === indicatorId);
                handleDeleteIndicator(indicator);
              }}
              addLabel="+ Add Indicator"
            />
          </div>
        </Grid>

        <Grid item xs={12}>
          <div
            style={
              period?.status === "Approved"
                ? { opacity: 0.6, pointerEvents: "none" }
                : {}
            }
          >
            <EsgDataTable
              title="Metrics"
              columns={["Value", "Unit"]}
              data={metrics}
              loading={loading}
              renderRow={(m) => [m.value, m.unit]}
              isLocked={period?.status === "Approved"}
              onAdd={() => setOpenNewMetricDialog(true)}
              onDelete={handleDeleteMetric}
              addLabel="+ Add Metric"
              onRowClick={(m) => navigate(`/metrics/${m.id}`)}
            />
          </div>
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
