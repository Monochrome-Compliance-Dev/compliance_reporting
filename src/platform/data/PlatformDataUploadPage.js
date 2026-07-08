import { useEffect, useRef, useState } from "react";
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
import {
  acquireWorkingDatasetEditorLease,
  finaliseWorkingDataset,
  materialiseWorkingDataset,
  renewWorkingDatasetEditorLease,
} from "platform/transformation/transformationApi";

const DATASET_TYPES = [
  { value: "payment", label: "Payment" },
  { value: "invoice", label: "Invoice" },
  { value: "supplier", label: "Supplier" },
  { value: "other", label: "Other" },
];

const EDITOR_LEASE_RENEWAL_INTERVAL_MS = 25 * 60 * 1000;
const EDITOR_LEASE_WARNING_THRESHOLD_MS = 5 * 60 * 1000;

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
  const [editorSession, setEditorSession] = useState(null);
  const [materialisedWorkingDataset, setMaterialisedWorkingDataset] =
    useState(null);
  const [finalisedWorkingDataset, setFinalisedWorkingDataset] = useState(null);
  const [projectionFields, setProjectionFields] = useState([]);
  const [customFieldTarget, setCustomFieldTarget] = useState("");
  const [customFieldValue, setCustomFieldValue] = useState("");
  const [isCreatingWorkingDataset, setIsCreatingWorkingDataset] =
    useState(false);
  const [isRenewingEditorLease, setIsRenewingEditorLease] = useState(false);
  const [isMaterialisingWorkingDataset, setIsMaterialisingWorkingDataset] =
    useState(false);
  const [isFinalisingWorkingDataset, setIsFinalisingWorkingDataset] =
    useState(false);
  const editorSessionRef = useRef(null);

  const canSubmit = Boolean(file && sourceName && datasetType && profileId);

  useEffect(() => {
    editorSessionRef.current = editorSession;
  }, [editorSession]);

  useEffect(() => {
    if (!createdWorkingDataset || !editorSession) {
      return undefined;
    }

    const expiresAt = new Date(editorSession.expiresAt).getTime();
    const now = Date.now();
    const warningDelay = Math.max(
      expiresAt - now - EDITOR_LEASE_WARNING_THRESHOLD_MS,
      0,
    );
    const expiryDelay = Math.max(expiresAt - now, 0);

    const warningTimerId = window.setTimeout(() => {
      showAlert(
        "Your working dataset editor session is close to expiring.",
        "info",
      );
    }, warningDelay);

    const expiryTimerId = window.setTimeout(() => {
      if (editorSessionRef.current?.sessionId === editorSession.sessionId) {
        setEditorSession(null);
        showAlert(
          "Your working dataset editor session expired. Recreate the working dataset editor session before materialising changes.",
          "error",
        );
      }
    }, expiryDelay);

    return () => {
      window.clearTimeout(warningTimerId);
      window.clearTimeout(expiryTimerId);
    };
  }, [createdWorkingDataset, editorSession, showAlert]);

  useEffect(() => {
    if (!createdWorkingDataset || !editorSession) {
      return undefined;
    }

    const renewalIntervalId = window.setInterval(async () => {
      const currentSession = editorSessionRef.current;

      if (!currentSession) {
        return;
      }

      setIsRenewingEditorLease(true);

      try {
        const result = await renewWorkingDatasetEditorLease({
          workingDatasetId: createdWorkingDataset.workingDatasetId,
          profileId: createdWorkingDataset.profileId,
          editorSessionId: currentSession.sessionId,
        });

        setCreatedWorkingDataset(result.workingDataset);
        setEditorSession(result.editorSession);
      } catch (error) {
        setEditorSession(null);
        showAlert(
          error.message || "Working dataset editor session renewal failed.",
          "error",
        );
      } finally {
        setIsRenewingEditorLease(false);
      }
    }, EDITOR_LEASE_RENEWAL_INTERVAL_MS);

    return () => {
      window.clearInterval(renewalIntervalId);
    };
  }, [createdWorkingDataset, editorSession, showAlert]);

  async function acquireEditorLease(workingDataset) {
    const result = await acquireWorkingDatasetEditorLease({
      workingDatasetId: workingDataset.workingDatasetId,
      profileId: workingDataset.profileId,
    });

    setEditorSession(result.editorSession);
    return result.workingDataset;
  }

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
      setEditorSession(null);
      setMaterialisedWorkingDataset(null);
      setFinalisedWorkingDataset(null);
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

      const leasedWorkingDataset = await acquireEditorLease(
        result.workingDataset,
      );

      setMaterialisedWorkingDataset(null);
      setFinalisedWorkingDataset(null);
      setProjectionFields(buildInitialProjectionFields(leasedWorkingDataset));
      setCustomFieldTarget("");
      setCustomFieldValue("");
      setCreatedWorkingDataset(leasedWorkingDataset);
      showAlert(
        "Working dataset editor session acquired successfully.",
        "success",
      );
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

    if (!editorSession) {
      showAlert(
        "Acquire a working dataset editor session before materialising working data.",
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
        editorSessionId: editorSession.sessionId,
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

  async function handleFinaliseWorkingDataset() {
    if (!createdWorkingDataset) {
      showAlert(
        "Create a working dataset before finalising working data.",
        "error",
      );
      return;
    }

    if (!materialisedWorkingDataset) {
      showAlert(
        "Materialise the working dataset before finalising working data.",
        "error",
      );
      return;
    }

    if (!editorSession) {
      showAlert(
        "Acquire a working dataset editor session before finalising working data.",
        "error",
      );
      return;
    }

    setIsFinalisingWorkingDataset(true);

    try {
      const result = await finaliseWorkingDataset({
        workingDatasetId: createdWorkingDataset.workingDatasetId,
        profileId: profileId || createdDataset?.profileId,
        editorSessionId: editorSession.sessionId,
        stepNumber: 3,
      });

      setCreatedWorkingDataset(result.workingDataset);
      setMaterialisedWorkingDataset(result.workingDataset);
      setFinalisedWorkingDataset(result.workingDataset);
      setEditorSession(null);
      showAlert("Working dataset finalised successfully.", "success");
    } catch (error) {
      showAlert(
        error.message || "Working dataset finalisation failed.",
        "error",
      );
    } finally {
      setIsFinalisingWorkingDataset(false);
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
                  disabled={
                    isMaterialisingWorkingDataset ||
                    !editorSession ||
                    Boolean(finalisedWorkingDataset)
                  }
                >
                  {isMaterialisingWorkingDataset
                    ? "Materialising working dataset..."
                    : "Materialise working dataset"}
                </Button>
                {editorSession && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mt: 1 }}
                  >
                    Editor session expires at {editorSession.expiresAt}
                    {isRenewingEditorLease ? " — renewing..." : ""}
                  </Typography>
                )}
                {materialisedWorkingDataset && !finalisedWorkingDataset && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleFinaliseWorkingDataset}
                      disabled={isFinalisingWorkingDataset || !editorSession}
                    >
                      {isFinalisingWorkingDataset
                        ? "Finalising working dataset..."
                        : "Finalise working dataset"}
                    </Button>
                  </Box>
                )}
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
        {finalisedWorkingDataset && (
          <Card
            sx={{
              border: `1px solid ${theme.palette.success.main}`,
              maxWidth: 720,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Working dataset finalised
              </Typography>
              <Typography variant="body2">
                Status: {finalisedWorkingDataset.status}
              </Typography>
              <Typography variant="body2">
                Finalised at: {finalisedWorkingDataset.finalisedAt}
              </Typography>
              <Typography variant="body2">
                Finalised by: {finalisedWorkingDataset.finalisedBy}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
