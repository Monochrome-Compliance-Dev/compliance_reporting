import { useState } from "react";
import { useNavigate } from "react-router";
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
import { useDataHubContext } from "../context/DataHubContext";
import { createRun } from "../services/dhApi";

export default function CreatePanel() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { profiles, profileId, setProfileId, selectRun, upsertRun } =
    useDataHubContext();

  const defaultLabel = "Data Hub Run";
  const safeProfileId = profiles.some((profile) => profile.id === profileId)
    ? profileId
    : "";

  const [label, setLabel] = useState(defaultLabel);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      showAlert("Run name is required", "info");
      return;
    }
    if (!profileId) {
      showAlert("Choose a profile before creating a Data Hub run.", "info");
      return;
    }

    try {
      setSaving(true);
      const run = await createRun({
        profileId,
        label: trimmedLabel,
        description: description.trim() || null,
      });
      upsertRun(run);
      await selectRun(run.runId || run.id);
      showAlert("Data Hub run created", "success");
      navigate(
        `/app/data-hub/upload?runId=${encodeURIComponent(run.runId || run.id)}`,
      );
    } catch (err) {
      console.error(err);
      showAlert(err?.message || "Failed to create Data Hub run", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Create Data Hub run
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create the processing container that will hold uploaded datasets,
            links, maps, staging, exclusions, rules, SBI and validation work.
          </Typography>
        </Box>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <TextField
                label="Run name"
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
                    ? "Choose which profile this Data Hub run belongs to."
                    : "No profiles found for this customer."
                }
              >
                {profiles.map((profile) => (
                  <MenuItem key={profile.id} value={profile.id}>
                    {profile.name || profile.code || profile.id}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                placeholder="Optional notes about the purpose of this run"
              />

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="text"
                  onClick={() => navigate("/app/data-hub")}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCreate}
                  disabled={saving || !profileId}
                  sx={{ minWidth: theme.spacing(18) }}
                >
                  {saving ? "Creating..." : "Create run"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
