import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SchemaFieldEditor from "../components/SchemaFieldEditor";
import SchemaFieldList from "../components/SchemaFieldList";
import {
  useSchemaDefinitionActions,
  useSchemaDefinitionsQuery,
} from "../hooks/useSchemaDefinitions";
import { useDataHubDatasetQuery } from "../hooks/useDataHubQueries";
import { useDataHubNavigation } from "../hooks/useDataHubNavigation";

const emptySchema = {
  schemaKey: "",
  name: "",
  datasetType: "",
  version: 1,
  status: "Draft",
  description: "",
  fields: [],
};

const emptyField = {
  name: "",
  sourceHeader: "",
  included: true,
  aliases: [],
  dataType: "string",
  required: false,
  nullable: true,
  parser: "string",
  validation: [],
  examples: [],
  modelHints: {},
  transformerHints: {},
};

function toTitleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

function toFieldName(header, index) {
  const words = String(header || `field_${index + 1}`)
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return `field${index + 1}`;

  return words
    .map((word, wordIndex) => {
      const lower = word.toLowerCase();
      if (wordIndex === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

function buildInitialFields(dataset) {
  const headers = Array.isArray(dataset?.headers) ? dataset.headers : [];

  return headers.map((header, index) => ({
    ...emptyField,
    name: toFieldName(header, index),
    sourceHeader: String(header || "").trim(),
  }));
}

function buildInitialSchema(dataset) {
  const datasetType = String(dataset?.datasetType || "")
    .trim()
    .toLowerCase();

  if (!datasetType) return emptySchema;

  return {
    ...emptySchema,
    schemaKey: datasetType,
    name: `${toTitleCase(datasetType)} Dataset`,
    datasetType,
    description: `Structural schema definition for ${toTitleCase(datasetType)} datasets.`,
    fields: buildInitialFields(dataset),
  };
}

function normaliseSchemaForSave(schema, dataset) {
  const datasetType = String(dataset?.datasetType || schema.datasetType || "")
    .trim()
    .toLowerCase();

  return {
    schemaKey: datasetType,
    name: String(schema.name || "").trim(),
    datasetType,
    version: Number(schema.version || 1),
    status: schema.status || "Draft",
    description: String(schema.description || "").trim(),
    fields: Array.isArray(schema.fields)
      ? schema.fields
          .filter((field) => field.included !== false)
          .map(({ included, ...field }) => field)
      : [],
  };
}

export default function SchemaDefinitionPanel() {
  const theme = useTheme();
  const { id: datasetId } = useParams();
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get("profileId");
  const { goTo } = useDataHubNavigation();

  const [draftSchema, setDraftSchema] = useState(emptySchema);
  const [selectedFieldName, setSelectedFieldName] = useState(null);
  const [draftField, setDraftField] = useState(null);

  const {
    data: dataset,
    isLoading: isDatasetLoading,
    isError: isDatasetError,
    error: datasetError,
  } = useDataHubDatasetQuery(datasetId, profileId);

  const {
    data: schemaDefinitionList,
    isLoading,
    isError,
    error,
  } = useSchemaDefinitionsQuery(
    { datasetType: dataset?.datasetType },
    { enabled: !!dataset?.datasetType },
  );

  const {
    selectedSchemaDefinitionId,
    setSelectedSchemaDefinitionId,
    createSchemaDefinition,
    updateSchemaDefinition,
    approveSchemaDefinition,
    createSchemaDefinitionVersion,
    isCreating,
    isUpdating,
    isApproving,
    isCreatingVersion,
  } = useSchemaDefinitionActions();

  const schemaDefinitions = schemaDefinitionList?.items || [];

  const selectedSchemaDefinition = useMemo(
    () =>
      schemaDefinitions.find(
        (schema) => schema.id === selectedSchemaDefinitionId,
      ) || null,
    [schemaDefinitions, selectedSchemaDefinitionId],
  );

  const activeSchema = selectedSchemaDefinition || draftSchema;
  const readOnly = activeSchema.status && activeSchema.status !== "Draft";
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (!dataset?.datasetType) return;

    setDraftSchema((current) => {
      if (current.id || current.datasetType) {
        return current;
      }

      return buildInitialSchema(dataset);
    });
  }, [dataset]);

  function updateSchema(patch) {
    setDraftSchema((current) => ({ ...current, ...patch }));
  }

  function handleSelectExisting(schema) {
    setSelectedSchemaDefinitionId(schema?.id || null);
    setDraftSchema(schema || buildInitialSchema(dataset));
    setSelectedFieldName(null);
    setDraftField(null);
  }

  function handleNewSchema() {
    setSelectedSchemaDefinitionId(null);
    setDraftSchema(buildInitialSchema(dataset));
    setSelectedFieldName(null);
    setDraftField(null);
  }

  function handleAddField() {
    setDraftField(emptyField);
    setSelectedFieldName(null);
  }

  function handleSelectField(field) {
    setSelectedFieldName(field?.name || null);
    setDraftField(field ? { ...emptyField, ...field } : null);
  }

  function handleSaveField(field) {
    const fields = Array.isArray(activeSchema.fields)
      ? activeSchema.fields
      : [];
    const existingIndex = fields.findIndex(
      (item) => item.name === selectedFieldName,
    );
    const nextFields = [...fields];

    if (existingIndex >= 0) {
      nextFields[existingIndex] = field;
    } else {
      nextFields.push(field);
    }

    updateSchema({ fields: nextFields });
    setSelectedFieldName(field.name);
    setDraftField(null);
  }

  function handleRemoveField(field) {
    const fieldName = field?.name;
    if (!fieldName || readOnly) return;

    updateSchema({
      fields: activeSchema.fields.filter((item) => item.name !== fieldName),
    });

    if (selectedFieldName === fieldName) {
      setSelectedFieldName(null);
      setDraftField(null);
    }
  }

  function handleToggleFieldIncluded(field, included) {
    if (readOnly) return;

    updateSchema({
      fields: (activeSchema.fields || []).map((item) =>
        item.sourceHeader === field.sourceHeader
          ? {
              ...item,
              included,
            }
          : item,
      ),
    });

    if (selectedFieldName === field.name && draftField) {
      setDraftField((current) => ({
        ...current,
        included,
      }));
    }
  }

  async function handleSaveSchema() {
    const payload = normaliseSchemaForSave(activeSchema, dataset);

    if (activeSchema.id) {
      const updated = await updateSchemaDefinition({
        id: activeSchema.id,
        definition: payload,
      });
      setSelectedSchemaDefinitionId(updated?.id || null);
      setDraftSchema(updated || buildInitialSchema(dataset));
      return;
    }

    const created = await createSchemaDefinition(payload);

    if (!created?.id) {
      throw new Error("Schema Definition was created but no id was returned.");
    }

    setDraftSchema(created);
    setSelectedSchemaDefinitionId(created.id);
  }

  async function handleApproveSchema() {
    if (!activeSchema.id) return;
    const approved = await approveSchemaDefinition(activeSchema.id);
    setSelectedSchemaDefinitionId(approved?.id || null);
    setDraftSchema(approved || buildInitialSchema(dataset));

    if (datasetId) {
      goTo(`map/${encodeURIComponent(datasetId)}`, {
        includeDatasetId: false,
        includeProfileId: true,
      });
    }
  }

  async function handleCreateVersion() {
    if (!activeSchema.id) return;
    const newVersion = await createSchemaDefinitionVersion(activeSchema.id);
    setSelectedSchemaDefinitionId(newVersion?.id || null);
    setDraftSchema(newVersion || buildInitialSchema(dataset));
  }

  if (isDatasetLoading || isLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading schema context...
        </Typography>
      </Paper>
    );
  }

  if (isDatasetError || isError) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="error">
          {datasetError?.message ||
            error?.message ||
            "Failed to load schema context."}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: theme.spacing(3) }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Define schema
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review the uploaded headers and complete the structural definition
            before mapping or downstream processing.
          </Typography>
        </Box>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Box>
                  <Typography variant="h6">Schema definition</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dataset type is inherited from the uploaded dataset and
                    cannot be changed here.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button variant="outlined" onClick={handleNewSchema}>
                    New schema
                  </Button>
                  {activeSchema.id && activeSchema.status === "Approved" ? (
                    <Button
                      variant="outlined"
                      disabled={isCreatingVersion}
                      onClick={handleCreateVersion}
                    >
                      New version
                    </Button>
                  ) : null}
                </Stack>
              </Stack>

              <Divider />

              {!!schemaDefinitions.length && (
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {schemaDefinitions.map((schema) => (
                    <Chip
                      key={schema.id}
                      clickable
                      color={
                        schema.id === activeSchema.id ? "primary" : "default"
                      }
                      variant={
                        schema.id === activeSchema.id ? "filled" : "outlined"
                      }
                      label={`${schema.name || schema.schemaKey} v${schema.version} (${schema.status})`}
                      onClick={() => handleSelectExisting(schema)}
                    />
                  ))}
                </Stack>
              )}

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Schema name"
                  size="small"
                  value={activeSchema.name || ""}
                  disabled={readOnly}
                  onChange={(event) =>
                    updateSchema({ name: event.target.value })
                  }
                  fullWidth
                />
                <TextField
                  label="Dataset type"
                  size="small"
                  value={dataset?.datasetType || activeSchema.datasetType || ""}
                  disabled
                  fullWidth
                  helperText="Inherited from the uploaded dataset."
                />
              </Stack>

              <TextField
                label="Description"
                size="small"
                value={activeSchema.description || ""}
                disabled={readOnly}
                onChange={(event) =>
                  updateSchema({ description: event.target.value })
                }
                multiline
                minRows={2}
                fullWidth
              />

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label={activeSchema.status || "Draft"} />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`v${activeSchema.version || 1}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${activeSchema.fields?.length || 0} fields`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${dataset?.headersCount || 0} uploaded headers`}
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={3}
          alignItems="flex-start"
        >
          <Card variant="outlined" sx={{ flex: 1, width: "100%" }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="h6">Fields</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fields have been initialised from the uploaded dataset
                      headers. Review and complete the missing details.
                    </Typography>
                  </Box>
                  {!readOnly ? (
                    <Button startIcon={<AddIcon />} onClick={handleAddField}>
                      Add field
                    </Button>
                  ) : null}
                </Stack>

                <SchemaFieldList
                  fields={activeSchema.fields || []}
                  selectedFieldName={selectedFieldName}
                  readOnly={readOnly}
                  onSelectField={handleSelectField}
                  onRemoveField={handleRemoveField}
                  onToggleFieldIncluded={handleToggleFieldIncluded}
                />
              </Stack>
            </CardContent>
          </Card>

          <Box sx={{ width: { xs: "100%", lg: 420 } }}>
            {draftField ? (
              <SchemaFieldEditor
                key={selectedFieldName || "new-field"}
                field={draftField}
                readOnly={readOnly}
                onChange={setDraftField}
                onSave={handleSaveField}
                onCancel={() => setDraftField(null)}
              />
            ) : (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Select a field to edit, or add a new field.
                </Typography>
              </Paper>
            )}
          </Box>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Box>
              <Typography variant="subtitle2">Schema lifecycle</Typography>
              <Typography variant="body2" color="text.secondary">
                Draft schemas can be edited. Approved schemas become read-only
                implementation references.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {!readOnly ? (
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={isSaving}
                  onClick={handleSaveSchema}
                >
                  {activeSchema.id ? "Save draft" : "Create draft"}
                </Button>
              ) : null}

              {activeSchema.id && activeSchema.status === "Draft" ? (
                <Button
                  variant="outlined"
                  startIcon={<CheckCircleIcon />}
                  disabled={isApproving}
                  onClick={handleApproveSchema}
                >
                  Approve
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
