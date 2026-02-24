import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Box, Typography } from "@mui/material";
import { esgService } from "../../services/esg/esg";
import { useAlert } from "../../context/";
import FileAttachments from "../files/FileAttachments";
import { LoadingSpinner } from "../../components/ui/";

export default function MetricDetail() {
  const { metricId } = useParams();
  const { showAlert } = useAlert();
  const [metric, setMetric] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetric = async () => {
      try {
        const data = await esgService.getMetricById(metricId);
        setMetric(data);
      } catch (err) {
        console.error("Failed to load metric:", err);
        showAlert("Failed to load metric", "error");
      } finally {
        setLoading(false);
      }
    };
    loadMetric();
  }, [metricId, showAlert]);

  if (loading) return <LoadingSpinner />;
  if (!metric) return <Typography>Metric not found</Typography>;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        {metric.name}
      </Typography>
      <Typography variant="subtitle1">
        Value: {metric.value} {metric.unit}
      </Typography>

      <Box sx={{ mt: 4 }}>
        <FileAttachments
          indicatorId={metric.indicatorId}
          metricId={metric.id}
          isLocked={metric.isLocked}
          basePath="esg"
        />
      </Box>
    </Box>
  );
}
