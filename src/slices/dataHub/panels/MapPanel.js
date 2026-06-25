import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useTheme } from "@mui/material/styles";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ClearIcon from "@mui/icons-material/Clear";
import ContentPasteGoIcon from "@mui/icons-material/ContentPasteGo";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import SearchIcon from "@mui/icons-material/Search";
import SaveIcon from "@mui/icons-material/Save";
import { useAlert } from "context";
import { LoadingSpinner } from "shared/ui";
import { useDataHubContext } from "../context/DataHubContext";
import {
  useDataHubDatasetMapQuery,
  useDataHubDatasetQuery,
  useDataHubDatasetsQuery,
  useDatasetSampleQuery,
  useUpdateDataHubDatasetMapMutation,
} from "../hooks/useDataHubQueries";
import { useDataHubNavigation } from "../hooks/useDataHubNavigation";
import {
  buildInitialFieldMapping,
  getAnalysisReadiness,
  getFieldLabel,
  getRecommendedFields,
} from "../ingestConfig";

function normalise(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function sourceRefKey(source) {
  return String(source?.header || "").trim();
}

function normaliseSourceRef(source) {
  if (!source) return null;

  if (typeof source === "string") {
    const header = source.trim();
    return header ? { header } : null;
  }

  const header = String(source?.header || source?.sourceHeader || "").trim();
  if (!header) return null;

  return {
    header,
    example: source?.example || "",
  };
}

function firstExample(rows, header, colIdx) {
  const h = String(header || "");

  for (const row of rows || []) {
    let value;

    if (row && typeof row === "object" && !Array.isArray(row)) {
      if (row.data && typeof row.data === "object" && h in row.data) {
        value = row.data[h];
      } else if (h in row) {
        value = row[h];
      }
    } else if (Array.isArray(row)) {
      value = row[colIdx];
    }

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }

  return "";
}

export default function MapPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const { id } = useParams();
  const { selectedProfileId } = useDataHubContext();
  const { goHome, goTo } = useDataHubNavigation();
  const updateDatasetMapMutation = useUpdateDataHubDatasetMapMutation();

  const [search, setSearch] = useState("");
  const [assign, setAssign] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [savingMap, setSavingMap] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedImportDatasetId, setSelectedImportDatasetId] = useState("");

  const {
    data: dataset,
    isLoading: datasetLoading,
    isError: datasetError,
    error: datasetErrorDetails,
  } = useDataHubDatasetQuery(id, selectedProfileId);

  const {
    data: sample,
    isLoading: sampleLoading,
    isError: sampleError,
    error: sampleErrorDetails,
  } = useDatasetSampleQuery(id, selectedProfileId, {
    enabled: Boolean(id && selectedProfileId),
  });

  const {
    data: datasetMap,
    isLoading: datasetMapLoading,
    isError: datasetMapError,
    error: datasetMapErrorDetails,
  } = useDataHubDatasetMapQuery(id, selectedProfileId, {
    enabled: Boolean(id && selectedProfileId),
  });

  const datasetsQ = useDataHubDatasetsQuery(selectedProfileId, {
    enabled: Boolean(selectedProfileId),
  });

  const headers = useMemo(() => {
    if (Array.isArray(sample?.headers) && sample.headers.length) {
      return sample.headers.map(String);
    }

    if (Array.isArray(dataset?.headers) && dataset.headers.length) {
      return dataset.headers.map(String);
    }

    return [];
  }, [dataset?.headers, sample?.headers]);

  const rows = useMemo(
    () => (Array.isArray(sample?.rows) ? sample.rows : []),
    [sample?.rows],
  );

  const examples = useMemo(() => {
    const next = {};

    headers.forEach((header, index) => {
      const value = firstExample(rows, header, index);
      if (value) next[header] = value;
    });

    return next;
  }, [headers, rows]);

  const recommendedFields = useMemo(
    () => getRecommendedFields(dataset?.datasetType),
    [dataset?.datasetType],
  );

  const suggestedMapping = useMemo(
    () => buildInitialFieldMapping(dataset?.datasetType, headers),
    [dataset?.datasetType, headers],
  );

  const sourceOptions = useMemo(
    () =>
      headers.map((header) => ({
        header,
        example: examples[header] || "",
      })),
    [examples, headers],
  );

  useEffect(() => {
    const fieldMapping =
      datasetMap?.fieldMapping && typeof datasetMap.fieldMapping === "object"
        ? datasetMap.fieldMapping
        : {};

    const next = {};

    for (const [field, source] of Object.entries(fieldMapping)) {
      const sourceRef = normaliseSourceRef(source);
      const header = sourceRef?.header || String(source || "").trim();
      if (!field || !header) continue;

      const matchingSource = sourceOptions.find(
        (option) => normalise(option.header) === normalise(header),
      );

      next[field] = matchingSource || { header };
    }

    setAssign(next);
    setIsDirty(false);
  }, [datasetMap?.fieldMapping, sourceOptions]);

  const importCandidates = useMemo(() => {
    const items = Array.isArray(datasetsQ.data?.items)
      ? datasetsQ.data.items
      : [];

    return items.filter((item) => {
      if (!item?.id || String(item.id) === String(id)) return false;
      if (item.datasetType !== dataset?.datasetType) return false;

      const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
      const fieldMapping =
        meta.fieldMapping && typeof meta.fieldMapping === "object"
          ? meta.fieldMapping
          : null;

      return Boolean(fieldMapping && Object.keys(fieldMapping).length);
    });
  }, [dataset?.datasetType, datasetsQ.data?.items, id]);

  const usedSources = useMemo(
    () =>
      new Set(
        Object.values(assign || {})
          .map((src) => sourceRefKey(src))
          .filter(Boolean),
      ),
    [assign],
  );

  const filteredSources = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return sourceOptions;

    return sourceOptions.filter((source) =>
      [source.header, source.example].join(" ").toLowerCase().includes(needle),
    );
  }, [search, sourceOptions]);

  const mappedCount = recommendedFields.filter((field) => assign[field]).length;

  const fieldMappingForReadiness = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(assign || {}).map(([field, source]) => [
          field,
          source?.header || null,
        ]),
      ),
    [assign],
  );

  const analysisReadiness = useMemo(
    () => getAnalysisReadiness(dataset?.datasetType, fieldMappingForReadiness),
    [dataset?.datasetType, fieldMappingForReadiness],
  );

  const assignSourceToTarget = useCallback((source, targetField) => {
    const sourceRef = normaliseSourceRef(source);
    if (!targetField) return;

    setAssign((current) => ({
      ...current,
      [targetField]: sourceRef || undefined,
    }));
    setIsDirty(true);
  }, []);

  const clearTarget = useCallback((targetField) => {
    setAssign((current) => {
      const next = { ...current };
      delete next[targetField];
      return next;
    });
    setIsDirty(true);
  }, []);

  const clearAll = useCallback(() => {
    setAssign({});
    setIsDirty(true);
  }, []);

  const autoSuggest = useCallback(() => {
    const next = {};

    for (const field of recommendedFields) {
      const suggestedHeader = suggestedMapping[field];
      if (!suggestedHeader) continue;

      const source = sourceOptions.find(
        (option) => normalise(option.header) === normalise(suggestedHeader),
      );

      if (source) next[field] = source;
    }

    const count = Object.keys(next).length;
    setAssign(next);
    setIsDirty(count > 0);

    if (count) {
      showAlert(
        `Auto-suggest mapped ${count} field${count === 1 ? "" : "s"}`,
        "success",
      );
    } else {
      showAlert("No mapping suggestions found.", "info");
    }
  }, [recommendedFields, showAlert, sourceOptions, suggestedMapping]);

  const importMap = useCallback(() => {
    const sourceDataset = importCandidates.find(
      (candidate) => String(candidate.id) === String(selectedImportDatasetId),
    );

    if (!sourceDataset) {
      showAlert("Choose a map to import.", "info");
      return;
    }

    const meta =
      sourceDataset.meta && typeof sourceDataset.meta === "object"
        ? sourceDataset.meta
        : {};
    const fieldMapping =
      meta.fieldMapping && typeof meta.fieldMapping === "object"
        ? meta.fieldMapping
        : {};

    const next = {};

    for (const [field, source] of Object.entries(fieldMapping)) {
      const sourceRef = normaliseSourceRef(source);
      const header = sourceRef?.header || String(source || "").trim();
      if (!field || !header) continue;

      const matchingSource = sourceOptions.find(
        (option) => normalise(option.header) === normalise(header),
      );

      next[field] = matchingSource || { header };
    }

    const count = Object.keys(next).length;
    if (!count) {
      showAlert("The selected map did not contain usable fields.", "info");
      return;
    }

    setAssign(next);
    setIsDirty(true);
    setImportOpen(false);
    setSelectedImportDatasetId("");
    showAlert(
      `Imported ${count} mapped field${count === 1 ? "" : "s"}`,
      "success",
    );
  }, [importCandidates, selectedImportDatasetId, showAlert, sourceOptions]);

  const onDragStart = (event, source) => {
    try {
      event.dataTransfer.setData("text/plain", JSON.stringify(source));
    } catch {}
  };

  const allowDrop = (event) => event.preventDefault();

  const handleDrop = (event, field) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData("text/plain");
    if (!raw) return;

    try {
      assignSourceToTarget(JSON.parse(raw), field);
    } catch {
      assignSourceToTarget(raw, field);
    }
  };

  async function saveMap() {
    if (!id) {
      showAlert("Missing dataset id", "error");
      return;
    }

    if (!selectedProfileId) {
      showAlert("Missing profile id", "error");
      return;
    }

    if (!mappedCount) {
      showAlert("Map at least one field before saving.", "info");
      return;
    }

    setSavingMap(true);

    try {
      const fieldMapping = fieldMappingForReadiness;

      await updateDatasetMapMutation.mutateAsync({
        id,
        profileId: selectedProfileId,
        fieldMapping,
        recommendedCount: recommendedFields.length,
        mappingStatus: analysisReadiness.some((item) => item.ready)
          ? "ready"
          : "mapped",
        meta: {
          analysisReadiness,
        },
      });

      setIsDirty(false);

      showAlert("Mapping saved successfully.", "success");
    } catch (error) {
      showAlert(error?.message || "Failed to save mapping.", "error");
    } finally {
      setSavingMap(false);
    }
  }

  function continueToPublish() {
    if (isDirty) {
      showAlert("Save the mapping before continuing.", "info");
      return;
    }

    goTo(`publish/${encodeURIComponent(id)}`, {
      includeDatasetId: false,
      includeProfileId: true,
    });
  }

  function TargetBin({ field }) {
    const assigned = assign[field] || null;
    const assignedExample = assigned?.example ? `e.g. ${assigned.example}` : "";

    return (
      <Paper
        onDragOver={allowDrop}
        onDrop={(event) => handleDrop(event, field)}
        variant="outlined"
        sx={{
          p: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderStyle: "dashed",
          bgcolor: assigned ? theme.palette.action.hover : "transparent",
        }}
      >
        <Typography sx={{ fontWeight: 600, pr: 2, minWidth: 240 }}>
          {getFieldLabel(field)}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ flex: 1, minWidth: 0 }}
        >
          {assigned ? (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}
            >
              <Tooltip
                title={assignedExample || "No sample value available"}
                arrow
              >
                <Typography
                  variant="body2"
                  sx={{
                    minWidth: 0,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 500,
                    cursor: "help",
                  }}
                >
                  {assigned.header}
                </Typography>
              </Tooltip>
              <Chip
                label="Mapped"
                size="small"
                color="success"
                variant="outlined"
                onDelete={() => clearTarget(field)}
                deleteIcon={<ClearIcon />}
                sx={{ flexShrink: 0 }}
              />
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Drag a source column here
            </Typography>
          )}

          <Autocomplete
            disablePortal
            fullWidth
            size="small"
            sx={{ minWidth: 220, maxWidth: 360, flexShrink: 0 }}
            options={sourceOptions}
            value={assigned}
            onChange={(event, value) =>
              assignSourceToTarget(value || null, field)
            }
            getOptionLabel={(source) => source?.header || ""}
            isOptionEqualToValue={(option, value) =>
              sourceRefKey(option) === sourceRefKey(value)
            }
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <Box component="li" key={key} {...optionProps}>
                  <Stack spacing={0.25}>
                    <Typography variant="body2">{option.header}</Typography>
                    {option.example && (
                      <Typography variant="caption" color="text.secondary">
                        e.g. {option.example}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assign"
                placeholder="Type to search…"
              />
            )}
          />
        </Stack>
      </Paper>
    );
  }

  function SourceToken({ source }) {
    const used = usedSources.has(sourceRefKey(source));

    return (
      <Paper
        draggable
        onDragStart={(event) => onDragStart(event, source)}
        variant="outlined"
        sx={{
          p: 1,
          mb: 1,
          opacity: used ? 0.4 : 1,
          cursor: "grab",
        }}
      >
        <Typography variant="body2">{source.header}</Typography>
        {source.example && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block" }}
          >
            e.g. {source.example}
          </Typography>
        )}
      </Paper>
    );
  }

  if (!selectedProfileId) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Choose a profile from Work Hub before mapping this dataset.
        </Typography>
      </Paper>
    );
  }

  if (datasetLoading || sampleLoading || datasetMapLoading) {
    return <LoadingSpinner message="Loading mapping workspace..." />;
  }

  if (datasetError || sampleError || datasetMapError) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="error">
          {datasetErrorDetails?.message ||
            sampleErrorDetails?.message ||
            datasetMapErrorDetails?.message ||
            "Failed to load mapping workspace."}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "2.1fr 0.9fr" },
        gap: 2,
      }}
    >
      <Box>
        <Stack spacing={0.75} sx={{ mb: 2 }}>
          <Typography variant="h5">Map dataset columns</Typography>
          <Typography variant="body2" color="text.secondary">
            Map recommended Data Hub fields to the detected source columns for{" "}
            {dataset?.sourceName || dataset?.fileName || dataset?.id}.
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={dataset?.datasetType || "Dataset"} />
            <Chip
              size="small"
              label={`${mappedCount}/${recommendedFields.length} mapped`}
            />
            <Chip size="small" label={`${headers.length} source columns`} />
            {analysisReadiness.map((item) => (
              <Chip
                key={item.id}
                size="small"
                color={item.ready ? "success" : "default"}
                variant={item.ready ? "filled" : "outlined"}
                label={`${item.label}: ${item.ready ? "Ready" : `${item.requiredMapped}/${item.requiredTotal} required`}`}
              />
            ))}
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography variant="subtitle2">Recommended fields</Typography>
            <Chip
              size="small"
              label={`${mappedCount}/${recommendedFields.length} mapped`}
            />
          </Stack>

          {!recommendedFields.length ? (
            <Typography variant="body2" color="text.secondary">
              No recommended fields are configured for this dataset type.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {recommendedFields.map((field) => (
                <TargetBin key={field} field={field} />
              ))}
            </Stack>
          )}
        </Paper>

        {!!analysisReadiness.length && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="subtitle2">Analysis readiness</Typography>
                <Typography variant="body2" color="text.secondary">
                  Shows whether this mapping contains enough fields for each
                  analysis module.
                </Typography>
              </Box>

              {analysisReadiness.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack spacing={1}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
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
          </Paper>
        )}

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            py: 1,
            bgcolor: theme.palette.background.paper,
            zIndex: 10,
            borderTop: (t) => `1px solid ${t.palette.divider}`,
            boxShadow: (t) => t.shadows[2],
          }}
        >
          {savingMap && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <LoadingSpinner size={20} />
              <Typography variant="body2">Saving map…</Typography>
            </Box>
          )}

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<DeleteSweepIcon />}
                onClick={clearAll}
                disabled={!Object.keys(assign).length}
              >
                Clear all
              </Button>
              <Button
                size="small"
                startIcon={<ContentPasteGoIcon />}
                onClick={() => setImportOpen(true)}
                disabled={!importCandidates.length}
              >
                Import map
              </Button>
              <Button
                size="small"
                startIcon={<AutoFixHighIcon />}
                onClick={autoSuggest}
                disabled={!recommendedFields.length || !headers.length}
              >
                Auto-suggest
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={() =>
                  goHome({ includeDatasetId: false, includeProfileId: true })
                }
              >
                Back to Data Hub
              </Button>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveMap}
                disabled={savingMap || mappedCount === 0 || !isDirty}
              >
                Save map
              </Button>
              <Button
                variant="contained"
                endIcon={<NavigateNextIcon />}
                onClick={continueToPublish}
                disabled={savingMap || isDirty || mappedCount === 0}
              >
                Next: Publish
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          position: { lg: "sticky" },
          top: { lg: theme.spacing(2) },
          height: "fit-content",
        }}
      >
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <SearchIcon fontSize="small" />
            <TextField
              size="small"
              placeholder="Search source columns"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              fullWidth
            />
            <Tooltip title="Import map">
              <span>
                <IconButton
                  onClick={() => setImportOpen(true)}
                  size="small"
                  disabled={!importCandidates.length}
                >
                  <ContentPasteGoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Auto-suggest">
              <IconButton onClick={autoSuggest} size="small">
                <AutoFixHighIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Divider sx={{ mb: 1 }} />

          {!!analysisReadiness.length && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Readiness
              </Typography>
              <Stack
                direction="row"
                spacing={0.75}
                flexWrap="wrap"
                useFlexGap
                sx={{ mt: 0.5 }}
              >
                {analysisReadiness.map((item) => (
                  <Chip
                    key={item.id}
                    size="small"
                    color={item.ready ? "success" : "default"}
                    variant={item.ready ? "filled" : "outlined"}
                    label={`${item.label}: ${item.score}%`}
                  />
                ))}
              </Stack>
              <Divider sx={{ mt: 1 }} />
            </Box>
          )}

          <Box sx={{ maxHeight: 560, overflowY: "auto" }}>
            {filteredSources.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No headers match your search.
              </Typography>
            ) : (
              filteredSources.map((source) => (
                <SourceToken key={sourceRefKey(source)} source={source} />
              ))
            )}
          </Box>
        </Paper>
      </Box>
      <Dialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Import existing map</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Import a saved map from another dataset in this profile with the
              same dataset type. The imported map will replace the current
              working selections.
            </Typography>

            {!importCandidates.length && (
              <Typography variant="body2" color="text.secondary">
                No saved maps are available to import yet.
              </Typography>
            )}

            {!!importCandidates.length && (
              <Autocomplete
                disablePortal
                options={importCandidates}
                value={
                  importCandidates.find(
                    (candidate) =>
                      String(candidate.id) === String(selectedImportDatasetId),
                  ) || null
                }
                onChange={(event, value) =>
                  setSelectedImportDatasetId(value?.id || "")
                }
                getOptionLabel={(option) => {
                  const meta =
                    option?.meta && typeof option.meta === "object"
                      ? option.meta
                      : {};
                  const mappedCount = meta.fieldMapping
                    ? Object.keys(meta.fieldMapping).length
                    : 0;
                  return `${option.sourceName || option.fileName || option.id} (${mappedCount} mapped)`;
                }}
                isOptionEqualToValue={(option, value) =>
                  String(option.id) === String(value.id)
                }
                renderInput={(params) => (
                  <TextField {...params} label="Saved map" />
                )}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={importMap}
            disabled={!selectedImportDatasetId}
          >
            Import map
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
