import { useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Chip,
  Divider,
  LinearProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSearchParams } from "react-router";
import { useAlert } from "context";
import { useDataHubContext } from "../context/DataHubContext";
import { useUploadDataHubDatasetMutation } from "../hooks/useDataHubQueries";
import { useDataHubNavigation } from "../hooks/useDataHubNavigation";
import { useSchemaDefinitionsQuery } from "../hooks/useSchemaDefinitions";

const LEGACY_DATASET_TYPE_OPTIONS = ["payment", "invoice"];

function getInitialDatasetType(searchParams) {
  return searchParams.get("datasetType") || "";
}

function formatDatasetType(datasetType) {
  if (!datasetType) return "—";

  return String(datasetType)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

function getNextAction(dataset) {
  if (!dataset?.nextRoute || !dataset?.nextLabel) {
    throw new Error("Uploaded dataset did not return nextRoute and nextLabel");
  }

  return {
    route: dataset.nextRoute,
    label: dataset.nextLabel,
  };
}

export default function UploadPanel() {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const { showAlert } = useAlert();
  const { profiles, profileId, setProfileId } = useDataHubContext();
  const { goHome, goTo } = useDataHubNavigation();
  const uploadDatasetMutation = useUploadDataHubDatasetMutation(profileId);
  const { data: schemaDefinitionList } = useSchemaDefinitionsQuery();

  const defaultLabel = "";
  const safeProfileId = profiles.some((profile) => profile.id === profileId)
    ? profileId
    : "";

  const [label, setLabel] = useState(defaultLabel);
  const [description, setDescription] = useState("");
  const [datasetType, setDatasetType] = useState(() =>
    getInitialDatasetType(searchParams),
  );
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadedDataset, setUploadedDataset] = useState(null);

  const datasetTypeOptions = useMemo(() => {
    const schemaTypes = (schemaDefinitionList?.items || [])
      .map((schema) => schema.datasetType)
      .filter(Boolean);

    return [
      ...new Set([...LEGACY_DATASET_TYPE_OPTIONS, ...schemaTypes]),
    ].sort();
  }, [schemaDefinitionList?.items]);

  async function handleUpload() {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      showAlert("Dataset name is required", "info");
      return;
    }
    if (!profileId) {
      showAlert("Choose a profile before creating a Data Hub dataset.", "info");
      return;
    }
    if (!datasetType) {
      showAlert("Dataset type is required", "info");
      return;
    }
    if (!file) {
      showAlert("Choose a CSV file before creating the dataset.", "info");
      return;
    }

    try {
      setSaving(true);
      setUploadedDataset(null);
      const dataset = await uploadDatasetMutation.mutateAsync({
        profileId,
        name: trimmedLabel,
        label: trimmedLabel,
        sourceName: trimmedLabel,
        description: description.trim() || null,
        datasetType: datasetType.trim().toLowerCase(),
        file,
      });

      const id = dataset?.id;
      if (!id) throw new Error("Uploaded dataset did not return an id");
      getNextAction(dataset);

      setUploadedDataset(dataset);
      showAlert("Data Hub dataset uploaded", "success");
    } catch (err) {
      console.error(err);
      showAlert(err?.message || "Failed to upload Data Hub dataset", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Upload Data Hub dataset
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload a payment or invoice dataset so it can be reused by future
            analysis modules.
          </Typography>
        </Box>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <TextField
                label="Dataset name"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                fullWidth
                required
              />

              <TextField
                select
                label="Data Hub profile"
                value={safeProfileId}
                onChange={(e) => setProfileId(e.target.value)}
                fullWidth
                required
                disabled={!profiles.length || saving}
                helperText={
                  profiles.length
                    ? "Choose which profile this Data Hub dataset belongs to."
                    : "No profiles found for this customer."
                }
              >
                {profiles.map((profile) => (
                  <MenuItem key={profile.id} value={profile.id}>
                    {profile.name || profile.code || profile.id}
                  </MenuItem>
                ))}
              </TextField>

              <Autocomplete
                freeSolo
                options={datasetTypeOptions}
                value={datasetType || ""}
                inputValue={datasetType || ""}
                disabled={saving}
                onChange={(_, value) => setDatasetType(value || "")}
                onInputChange={(_, value) => setDatasetType(value || "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Dataset type"
                    fullWidth
                    required
                    helperText="Choose a known dataset type or enter a new one to define its schema."
                  />
                )}
              />

              <Button variant="outlined" component="label" disabled={saving}>
                {file ? file.name : "Choose CSV file"}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Button>
              {saving && (
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Uploading and inspecting dataset...
                  </Typography>
                  <LinearProgress />
                </Box>
              )}

              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                placeholder="Optional notes about the purpose of this dataset"
              />

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="text"
                  onClick={() =>
                    goHome({ includeDatasetId: false, includeProfileId: true })
                  }
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={
                    saving ||
                    !!uploadedDataset ||
                    !profileId ||
                    !datasetType ||
                    !file
                  }
                  sx={{ minWidth: theme.spacing(18) }}
                >
                  {saving
                    ? "Uploading..."
                    : datasetType
                      ? `Upload ${datasetType} dataset`
                      : "Upload dataset"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
      {uploadedDataset && (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">Upload complete</Typography>
                <Typography variant="body2" color="text.secondary">
                  The backend created the dataset and inspected the uploaded
                  CSV.
                </Typography>
              </Box>

              <Divider />

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                useFlexGap
                flexWrap="wrap"
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Dataset
                  </Typography>
                  <Typography variant="body2">
                    {uploadedDataset.sourceName ||
                      uploadedDataset.fileName ||
                      uploadedDataset.id}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body2">
                    {formatDatasetType(uploadedDataset.datasetType)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Rows
                  </Typography>
                  <Typography variant="body2">
                    {Number(uploadedDataset.rowsCount || 0).toLocaleString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Headers
                  </Typography>
                  <Typography variant="body2">
                    {Number(uploadedDataset.headersCount || 0).toLocaleString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={uploadedDataset.status || "uploaded"}
                      size="small"
                    />
                  </Box>
                </Box>
              </Stack>

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() =>
                    goHome({ includeDatasetId: false, includeProfileId: true })
                  }
                >
                  Back to Data Hub
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    const nextAction = getNextAction(uploadedDataset);
                    goTo(nextAction.route, {
                      includeDatasetId: false,
                      includeProfileId: true,
                    });
                  }}
                >
                  {getNextAction(uploadedDataset).label}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
