import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { createDataDataset, createWorkingDataset } from "platform/data/dataApi";
import { materialiseWorkingDataset } from "platform/transformation/transformationApi";

const DATASET_TYPES = [
  { value: "payment", label: "Payment" },
  { value: "invoice", label: "Invoice" },
  { value: "supplier", label: "Supplier" },
  { value: "other", label: "Other" },
];

const DEFAULT_EDITOR_SESSION_ID = "manual-stage-4-session";

function getFileFromChange(event) {
  return event.target.files?.[0] || null;
}

function buildInitialProjectionFields(workingDataset) {
  return (workingDataset.headers || []).map((header) => ({
    sourceField: header,
    targetField: "",
  }));
}

function buildMaterialisationFields(projectionFields) {
  return projectionFields
    .filter((field) => field.targetField.trim())
    .map((field) => ({
      sourceField: field.sourceField,
      targetField: field.targetField.trim(),
    }));
}

function buildMaterialisationCustomFields({
  customFieldTarget,
  customFieldValue,
}) {
  if (!customFieldTarget.trim()) {
    return [];
  }

  return [
    {
      targetField: customFieldTarget.trim(),
      value: customFieldValue,
    },
  ];
}

export default function PlatformDataUploadPage() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const [file, setFile] = useState(null);
  const [sourceName, setSourceName] = useState("");
  const [datasetType, setDatasetType] = useState("payment");
  const [profileId, setProfileId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [createdDataset, setCreatedDataset] = useState(null);
  const [createdWorkingDataset, setCreatedWorkingDataset] = useState(null);
  const [materialisedWorkingDataset, setMaterialisedWorkingDataset] =
    useState(null);
  const [projectionFields, setProjectionFields] = useState([]);
  const [customFieldTarget, setCustomFieldTarget] = useState("");
  const [customFieldValue, setCustomFieldValue] = useState("");
  const [isCreatingWorkingDataset, setIsCreatingWorkingDataset] =
    useState(false);
  const [isMaterialisingWorkingDataset, setIsMaterialisingWorkingDataset] =
    useState(false);

  const canSubmit = Boolean(file && sourceName && datasetType && profileId);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) {
      showAlert(
        "Complete all dataset upload fields before continuing.",
        "error",
      );
      return;
    }

    setIsUploading(true);

    try {
      const result = await createDataDataset({
        file,
        sourceName,
        datasetType,
        profileId,
      });

      setCreatedWorkingDataset(null);
      setMaterialisedWorkingDataset(null);
      setProjectionFields([]);
      setCustomFieldTarget("");
      setCustomFieldValue("");
      setCreatedDataset(result.dataset);
      showAlert("Dataset uploaded successfully.", "success");
    } catch (error) {
      showAlert(error.message || "Dataset upload failed.", "error");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleCreateWorkingDataset() {
    if (!createdDataset) {
      showAlert(
        "Create an immutable dataset before creating working data.",
        "error",
      );
      return;
    }

    setIsCreatingWorkingDataset(true);

    try {
      const result = await createWorkingDataset({
        sourceDatasetId: createdDataset.datasetId,
        profileId: createdDataset.profileId,
        workingName: `${createdDataset.sourceName} working data`,
      });

      setMaterialisedWorkingDataset(null);
      setProjectionFields(buildInitialProjectionFields(result.workingDataset));
      setCustomFieldTarget("");
      setCustomFieldValue("");
      setCreatedWorkingDataset(result.workingDataset);
      showAlert("Working dataset created successfully.", "success");
    } catch (error) {
      showAlert(error.message || "Working dataset creation failed.", "error");
    } finally {
      setIsCreatingWorkingDataset(false);
    }
  }

  function handleProjectionTargetChange(sourceField, targetField) {
    setProjectionFields((currentFields) =>
      currentFields.map((field) =>
        field.sourceField === sourceField ? { ...field, targetField } : field,
      ),
    );
  }

  async function handleMaterialiseWorkingDataset() {
    if (!createdWorkingDataset) {
      showAlert(
        "Create a working dataset before materialising working data.",
        "error",
      );
      return;
    }

    const fields = buildMaterialisationFields(projectionFields);

    if (fields.length === 0) {
      showAlert(
        "Add at least one projection field before materialising working data.",
        "error",
      );
      return;
    }

    const customFields = buildMaterialisationCustomFields({
      customFieldTarget,
      customFieldValue,
    });

    setIsMaterialisingWorkingDataset(true);

    try {
      const result = await materialiseWorkingDataset({
        workingDatasetId: createdWorkingDataset.workingDatasetId,
        profileId: profileId || createdDataset?.profileId,
        editorSessionId: DEFAULT_EDITOR_SESSION_ID,
        stepNumber: 2,
        fields,
        customFields,
      });

      setCreatedWorkingDataset(result.workingDataset);
      setMaterialisedWorkingDataset(result.workingDataset);
      showAlert("Working dataset materialised successfully.", "success");
    } catch (error) {
      showAlert(
        error.message || "Working dataset materialisation failed.",
        "error",
      );
    } finally {
      setIsMaterialisingWorkingDataset(false);
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Platform Data
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload a CSV file to create an immutable Data-owned dataset.
          </Typography>
        </Box>

        <Card
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            maxWidth: 720,
          }}
        >
          <CardContent>
            <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
              <TextField
                label="Source name"
                value={sourceName}
                onChange={(event) => setSourceName(event.target.value)}
                required
                fullWidth
              />

              <TextField
                label="Dataset type"
                value={datasetType}
                onChange={(event) => setDatasetType(event.target.value)}
                select
                required
                fullWidth
              >
                {DATASET_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Profile ID"
                value={profileId}
                onChange={(event) => setProfileId(event.target.value)}
                required
                fullWidth
              />

              <Button variant="outlined" component="label">
                {file ? file.name : "Choose CSV file"}
                <input
                  aria-label="CSV file"
                  hidden
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => setFile(getFileFromChange(event))}
                />
              </Button>

              <Button type="submit" variant="contained" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Create dataset"}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {createdDataset && (
          <Card
            sx={{
              border: `1px solid ${theme.palette.success.main}`,
              maxWidth: 720,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dataset created
              </Typography>
              <Typography variant="body2">
                Dataset ID: {createdDataset.datasetId}
              </Typography>
              <Typography variant="body2">
                Rows: {createdDataset.rowsCount}
              </Typography>
              <Typography variant="body2">
                Headers: {createdDataset.headersCount}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleCreateWorkingDataset}
                  disabled={isCreatingWorkingDataset}
                >
                  {isCreatingWorkingDataset
                    ? "Creating working dataset..."
                    : "Create working dataset"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {createdWorkingDataset && (
          <Card
            sx={{
              border: `1px solid ${theme.palette.success.main}`,
              maxWidth: 720,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Working dataset created
              </Typography>
              <Typography variant="body2">
                Working Dataset ID: {createdWorkingDataset.workingDatasetId}
              </Typography>
              <Typography variant="body2">
                Source Dataset ID: {createdWorkingDataset.sourceDatasetId}
              </Typography>
              <Typography variant="body2">
                Rows: {createdWorkingDataset.rowsCount}
              </Typography>
              <Typography variant="body2">
                Headers: {createdWorkingDataset.headersCount}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Projection fields
                </Typography>
                <Stack spacing={2}>
                  {projectionFields.map((field) => (
                    <TextField
                      key={field.sourceField}
                      label={`Target field for ${field.sourceField}`}
                      value={field.targetField}
                      onChange={(event) =>
                        handleProjectionTargetChange(
                          field.sourceField,
                          event.target.value,
                        )
                      }
                      fullWidth
                    />
                  ))}
                </Stack>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Optional custom field
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Custom field target"
                    value={customFieldTarget}
                    onChange={(event) =>
                      setCustomFieldTarget(event.target.value)
                    }
                    fullWidth
                  />
                  <TextField
                    label="Custom field value"
                    value={customFieldValue}
                    onChange={(event) =>
                      setCustomFieldValue(event.target.value)
                    }
                    fullWidth
                  />
                </Stack>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleMaterialiseWorkingDataset}
                  disabled={isMaterialisingWorkingDataset}
                >
                  {isMaterialisingWorkingDataset
                    ? "Materialising working dataset..."
                    : "Materialise working dataset"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {materialisedWorkingDataset && (
          <Card
            sx={{
              border: `1px solid ${theme.palette.success.main}`,
              maxWidth: 720,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Working dataset materialised
              </Typography>
              <Typography variant="body2">
                Rows: {materialisedWorkingDataset.rowsCount}
              </Typography>
              <Typography variant="body2">
                Headers: {materialisedWorkingDataset.headersCount}
              </Typography>
              <Typography variant="body2">
                Headers: {materialisedWorkingDataset.headers.join(", ")}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
