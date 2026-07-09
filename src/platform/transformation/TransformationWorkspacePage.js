import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import { listWorkingDatasets } from "platform/data/dataApi";

function formatWorkingDatasetStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isFinalWorkingDataset(workingDataset) {
  return workingDataset.status === "final";
}

export default function TransformationWorkspacePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [profileId, setProfileId] = useState("");
  const [workingDatasets, setWorkingDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  async function handleLoadWorkingDatasets(event) {
    event.preventDefault();

    if (!profileId.trim()) {
      showAlert("Enter a profile ID before loading working datasets.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const result = await listWorkingDatasets({
        profileId: profileId.trim(),
      });

      setWorkingDatasets(result.workingDatasets);
      setHasLoaded(true);
      showAlert("Working datasets loaded successfully.", "success");
    } catch (error) {
      showAlert(error.message || "Working dataset listing failed.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenWorkingDataset(workingDataset) {
    const trimmedProfileId = profileId.trim();

    if (!trimmedProfileId) {
      showAlert(
        "Enter a profile ID before opening a working dataset.",
        "error",
      );
      return;
    }

    navigate(
      `working-datasets/${workingDataset.workingDatasetId}?profileId=${encodeURIComponent(trimmedProfileId)}`,
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Transformation Workspace
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Open existing Data-owned working datasets for transformation and
            lifecycle review.
          </Typography>
        </Box>

        <Card
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            maxWidth: 720,
          }}
        >
          <CardContent>
            <Stack
              component="form"
              spacing={2}
              onSubmit={handleLoadWorkingDatasets}
            >
              <TextField
                label="Profile ID"
                value={profileId}
                onChange={(event) => setProfileId(event.target.value)}
                required
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={isLoading}>
                {isLoading
                  ? "Loading working datasets..."
                  : "Load working datasets"}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {hasLoaded && workingDatasets.length === 0 && (
          <Card
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              maxWidth: 720,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                No working datasets found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create a working dataset from Platform Data before opening it in
                the Transformation Workspace.
              </Typography>
            </CardContent>
          </Card>
        )}

        {workingDatasets.length > 0 && (
          <Stack spacing={2}>
            <Typography variant="h6" component="h2">
              Working Dataset Hub
            </Typography>
            {workingDatasets.map((workingDataset) => (
              <Card
                key={workingDataset.workingDatasetId}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  maxWidth: 720,
                }}
              >
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography variant="h6">
                        {workingDataset.workingName}
                      </Typography>
                      <Chip
                        label={formatWorkingDatasetStatus(
                          workingDataset.status,
                        )}
                        color={
                          isFinalWorkingDataset(workingDataset)
                            ? "success"
                            : "default"
                        }
                        size="small"
                      />
                    </Stack>

                    <Typography variant="body2">
                      Working Dataset ID: {workingDataset.workingDatasetId}
                    </Typography>
                    <Typography variant="body2">
                      Source Dataset ID: {workingDataset.sourceDatasetId}
                    </Typography>
                    <Typography variant="body2">
                      Dataset type: {workingDataset.datasetType}
                    </Typography>
                    <Typography variant="body2">
                      Rows: {workingDataset.rowsCount}
                    </Typography>
                    <Typography variant="body2">
                      Headers: {workingDataset.headersCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Updated: {workingDataset.updatedAt}
                    </Typography>

                    {isFinalWorkingDataset(workingDataset) && (
                      <Typography variant="body2" color="text.secondary">
                        This working dataset is final and read-only.
                      </Typography>
                    )}

                    <Box>
                      <Button
                        variant="outlined"
                        onClick={() => handleOpenWorkingDataset(workingDataset)}
                      >
                        Open working dataset
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
