import { useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SaveIcon from "@mui/icons-material/Save";
import { useAlert } from "context";
import { LoadingSpinner } from "shared/ui";
import { useDataHubContext } from "../context/DataHubContext";
import {
  useDataHubDatasetMapQuery,
  useDataHubDatasetQuery,
  usePublishDataHubDatasetMutation,
} from "../hooks/useDataHubQueries";
import { useDataHubNavigation } from "../hooks/useDataHubNavigation";
import { getAnalysisReadiness, getFieldLabel } from "../ingestConfig";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function hasMappedValue(value) {
  if (!value) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "object") {
    return String(value.header || value.sourceHeader || "").trim().length > 0;
  }
  return false;
}

export default function PublishPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const { id } = useParams();
  const { selectedProfileId } = useDataHubContext();
  const { goHome, goTo } = useDataHubNavigation();
  const [publishing, setPublishing] = useState(false);

  const {
    data: dataset,
    isLoading: datasetLoading,
    isError: datasetError,
    error: datasetErrorDetails,
  } = useDataHubDatasetQuery(id, selectedProfileId);

  const {
    data: datasetMap,
    isLoading: mapLoading,
    isError: mapError,
    error: mapErrorDetails,
  } = useDataHubDatasetMapQuery(id, selectedProfileId, {
    enabled: Boolean(id && selectedProfileId),
  });

  const publishMutation = usePublishDataHubDatasetMutation(
    id,
    selectedProfileId,
  );

  const fieldMapping = useMemo(() => {
    if (
      datasetMap?.fieldMapping &&
      typeof datasetMap.fieldMapping === "object"
    ) {
      return datasetMap.fieldMapping;
    }
    return {};
  }, [datasetMap?.fieldMapping]);

  const mappedCount = useMemo(
    () => Object.values(fieldMapping).filter(hasMappedValue).length,
    [fieldMapping],
  );

  const analysisReadiness = useMemo(
    () => getAnalysisReadiness(dataset?.datasetType, fieldMapping),
    [dataset?.datasetType, fieldMapping],
  );

  const hasReadyAnalysis = analysisReadiness.some((item) => item.ready);
  const canPublish = Boolean(id && selectedProfileId && mappedCount > 0);
  const isPublished = dataset?.status === "published";

  async function handlePublish() {
    if (isPublished) {
      showAlert("Published datasets are read-only.", "info");
      return;
    }
    if (!canPublish) {
      showAlert("Map at least one field before publishing.", "info");
      return;
    }

    setPublishing(true);

    try {
      const result = await publishMutation.mutateAsync({
        id,
        profileId: selectedProfileId,
      });

      showAlert(
        `Published ${Number(result?.publishedCount || 0).toLocaleString()} records successfully.`,
        "success",
      );

      goHome({
        includeDatasetId: false,
        includeProfileId: true,
      });
    } catch (error) {
      showAlert(error?.message || "Failed to publish dataset.", "error");
    } finally {
      setPublishing(false);
    }
  }

  if (!selectedProfileId) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Choose a profile from Work Hub before publishing this dataset.
        </Typography>
      </Paper>
    );
  }

  if (datasetLoading || mapLoading) {
    return <LoadingSpinner message="Loading publish review..." />;
  }

  if (datasetError || mapError) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="error">
          {datasetErrorDetails?.message ||
            mapErrorDetails?.message ||
            "Failed to load publish review."}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: theme.spacing(3) }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Publish dataset
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review the uploaded dataset and saved mapping before making it
            available for analysis modules.
          </Typography>
        </Box>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Box>
                  <Typography variant="h6">
                    {dataset?.sourceName || dataset?.fileName || dataset?.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dataset?.originalFileName ||
                      dataset?.fileName ||
                      "CSV dataset"}
                  </Typography>
                </Box>
                <Chip
                  label={dataset?.status || "uploaded"}
                  size="small"
                  color={isPublished ? "success" : "default"}
                />
              </Stack>

              <Divider />

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                useFlexGap
                flexWrap="wrap"
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Dataset type
                  </Typography>
                  <Typography variant="body2">
                    {dataset?.datasetType || "—"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Rows
                  </Typography>
                  <Typography variant="body2">
                    {Number(dataset?.rowsCount || 0).toLocaleString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Headers
                  </Typography>
                  <Typography variant="body2">
                    {Number(dataset?.headersCount || 0).toLocaleString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Uploaded
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(dataset?.createdAt)}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Box>
                  <Typography variant="h6">Mapping summary</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Saved field mapping that will be published with this asset.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip
                    size="small"
                    label={`${mappedCount} mapped`}
                    color={mappedCount ? "success" : "warning"}
                  />
                  <Chip
                    size="small"
                    label={datasetMap?.mappingStatus || "draft"}
                    variant="outlined"
                  />
                </Stack>
              </Stack>

              <Divider />

              {!mappedCount && (
                <Typography variant="body2" color="error">
                  No saved mapping was found. Return to mapping before
                  publishing.
                </Typography>
              )}

              {!!mappedCount && (
                <Stack spacing={1}>
                  {Object.entries(fieldMapping).map(([fieldId, source]) => (
                    <Stack
                      key={fieldId}
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      sx={{
                        borderBottom: (t) => `1px solid ${t.palette.divider}`,
                        pb: 1,
                      }}
                    >
                      <Typography variant="body2" fontWeight={700}>
                        {getFieldLabel(fieldId)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {typeof source === "string"
                          ? source
                          : source?.header || "—"}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        {!!analysisReadiness.length && (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6">Analysis readiness</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Shows which analysis modules can use this dataset once it is
                    published.
                  </Typography>
                </Box>

                {analysisReadiness.map((item) => (
                  <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack spacing={1}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {item.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.description}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            size="small"
                            color={item.ready ? "success" : "warning"}
                            icon={
                              item.ready ? (
                                <CheckCircleIcon />
                              ) : (
                                <ErrorOutlineIcon />
                              )
                            }
                            label={item.ready ? "Ready" : "Not ready"}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`${item.score}%`}
                          />
                        </Stack>
                      </Stack>

                      <Typography variant="caption" color="text.secondary">
                        Required: {item.requiredMapped}/{item.requiredTotal}.
                        Useful: {item.usefulMapped}/{item.usefulTotal}.
                      </Typography>

                      {!!item.missingRequired.length && (
                        <Typography variant="caption" color="error">
                          Missing required:{" "}
                          {item.missingRequired.map(getFieldLabel).join(", ")}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Box>
              <Typography variant="subtitle2">Publication decision</Typography>
              <Typography variant="body2" color="text.secondary">
                {hasReadyAnalysis
                  ? "At least one analysis module is ready to use this dataset."
                  : "This dataset can be published, but no analysis module is fully ready yet."}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {!isPublished && (
                <Button
                  variant="outlined"
                  onClick={() =>
                    goTo(`map/${encodeURIComponent(id)}`, {
                      includeDatasetId: false,
                      includeProfileId: true,
                    })
                  }
                >
                  Back to mapping
                </Button>
              )}
              <Button
                variant="text"
                onClick={() =>
                  goHome({ includeDatasetId: false, includeProfileId: true })
                }
              >
                Back to Data Hub
              </Button>
              {!isPublished && (
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={
                    !canPublish || publishing || publishMutation.isPending
                  }
                  onClick={handlePublish}
                >
                  {publishing ? "Publishing..." : "Publish dataset"}
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
