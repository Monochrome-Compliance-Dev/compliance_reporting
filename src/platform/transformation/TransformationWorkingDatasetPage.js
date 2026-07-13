import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAlert } from "context";
import {
  getWorkingDataset,
  listWorkingDatasetActivity,
} from "platform/data/dataApi";
import useWorkingDatasetEditorLease from "platform/transformation/hooks/useWorkingDatasetEditorLease";
import { formatDateTime } from "shared/utils/formatters";

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
  return workingDataset?.status === "final";
}

function getActivityLabel(activity) {
  return activity.activityType || activity.type || "Activity";
}

function getActivityDescription(activity) {
  return (
    activity.message || activity.description || "No activity detail recorded."
  );
}

export default function TransformationWorkingDatasetPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { workingDatasetId } = useParams();
  const [searchParams] = useSearchParams();
  const { showAlert } = useAlert();
  const profileId = searchParams.get("profileId") || "";
  const [workingDataset, setWorkingDataset] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    editorLeaseLabel,
    handleAcquireEditorLease,
    handleCloseEditorLeaseExpiredDialog,
    handleCloseEditorLeaseExpiryWarning,
    handleContinueEditing,
    hasActiveEditorLease,
    isEditorLeaseExpiredDialogOpen,
    isEditorLeaseExpiryWarningOpen,
  } = useWorkingDatasetEditorLease({
    profileId,
    showAlert,
    setWorkingDataset,
    workingDataset,
    workingDatasetId,
  });

  useEffect(() => {
    async function loadWorkingDataset() {
      if (!profileId) {
        showAlert("Profile ID is required to open a working dataset.", "error");
        return;
      }

      setIsLoading(true);

      try {
        const [detailResult, activityResult] = await Promise.all([
          getWorkingDataset({ workingDatasetId, profileId }),
          listWorkingDatasetActivity({ workingDatasetId, profileId }),
        ]);

        setWorkingDataset(detailResult.workingDataset);
        setActivities(activityResult.activities);
      } catch (error) {
        showAlert(error.message || "Working dataset load failed.", "error");
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkingDataset();
  }, [profileId, showAlert, workingDatasetId]);

  function handleBackToHub() {
    navigate("..");
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Button variant="text" onClick={handleBackToHub}>
            Back to working dataset hub
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            Working Dataset Detail
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review the selected Data-owned working dataset and its lifecycle
            activity before entering editable workspace actions.
          </Typography>
        </Box>

        {isLoading && (
          <Typography variant="body2" color="text.secondary">
            Loading working dataset...
          </Typography>
        )}

        {workingDataset && (
          <Card
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              maxWidth: 840,
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
                  <Typography variant="h5">
                    {workingDataset.workingName}
                  </Typography>
                  <Chip
                    label={formatWorkingDatasetStatus(workingDataset.status)}
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
                  Updated: {formatDateTime(workingDataset.updatedAt)}
                </Typography>

                {isFinalWorkingDataset(workingDataset) && (
                  <Typography variant="body2" color="text.secondary">
                    This working dataset is final and read-only.
                  </Typography>
                )}

                <Typography variant="body2" color="text.secondary">
                  {editorLeaseLabel}
                </Typography>

                {!isFinalWorkingDataset(workingDataset) && (
                  <Box>
                    <Button
                      variant="outlined"
                      onClick={handleAcquireEditorLease}
                      disabled={hasActiveEditorLease}
                    >
                      {hasActiveEditorLease
                        ? "Editor lease active"
                        : "Acquire edit lease"}
                    </Button>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        <Card
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            maxWidth: 840,
          }}
        >
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="h6" component="h2">
                Activity History
              </Typography>

              {activities.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No activity history found for this working dataset.
                </Typography>
              )}

              {activities.map((activity) => (
                <Card
                  key={activity.activityId}
                  variant="outlined"
                  sx={{ borderColor: theme.palette.divider }}
                >
                  <CardContent>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2">
                        {getActivityLabel(activity)}
                      </Typography>
                      <Typography variant="body2">
                        {getActivityDescription(activity)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(activity.createdAt)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Dialog
        open={isEditorLeaseExpiryWarningOpen}
        onClose={handleCloseEditorLeaseExpiryWarning}
        aria-labelledby="editor-lease-expiry-warning-title"
      >
        <DialogTitle id="editor-lease-expiry-warning-title">
          Editor lease expiring soon
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your editor lease is close to expiring. Continue editing to renew
            your lease and keep control of this working dataset.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditorLeaseExpiryWarning}>Dismiss</Button>
          <Button variant="contained" onClick={handleContinueEditing}>
            Continue editing
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isEditorLeaseExpiredDialogOpen}
        onClose={handleCloseEditorLeaseExpiredDialog}
        aria-labelledby="editor-lease-expired-title"
      >
        <DialogTitle id="editor-lease-expired-title">
          Editor lease expired
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your editor lease has expired. Acquire a new edit lease to continue
            editing this working dataset.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditorLeaseExpiredDialog}>Dismiss</Button>
          <Button variant="contained" onClick={handleAcquireEditorLease}>
            Acquire edit lease
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
