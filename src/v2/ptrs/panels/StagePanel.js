import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useSearchParams, useNavigate } from "react-router";
import { useAlert } from "context";
import { stageRun } from "v2/ptrs/services/ptrsApi";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function StagePanel() {
  const { showAlert } = useAlert();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const runId = params.get("runId");
  const profileId = params.get("profileId");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // robust mounted guard (don’t mutate a local var inside effects)
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleStage = async () => {
    if (!runId) {
      showAlert("Missing runId", "error");
      return;
    }
    if (mountedRef.current) setLoading(true);
    try {
      const res = await stageRun(runId, { profileId });
      if (mountedRef.current) setResult(res);
      if (mountedRef.current)
        showAlert(`Staged ${res.rowsOut || 0} rows`, "success");
    } catch (err) {
      if (mountedRef.current)
        showAlert(err?.message || "Failed to stage data", "error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // IMPORTANT: do NOT auto-run staging on mount — only when user clicks the button.

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Stage data
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Combining uploaded datasets and applying your mapping to prepare the
        data for rule processing.
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        {loading ? (
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography>Preparing staged dataset...</Typography>
          </Stack>
        ) : result ? (
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CheckCircleIcon color="success" />
              <Typography variant="subtitle1">Staging complete</Typography>
            </Stack>
            <Typography variant="body2">
              {result.rowsIn || 0} source rows processed into{" "}
              {result.rowsOut || 0} staged rows.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Duration: {result.tookMs ? `${result.tookMs} ms` : "N/A"}
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Nothing staged yet. Click below to run staging.
            </Typography>
          </Stack>
        )}
      </Paper>

      <Stack direction="row" spacing={2}>
        <Button variant="outlined" disabled={loading} onClick={handleStage}>
          {result ? "Run again" : "Run staging"}
        </Button>
        <Button
          variant="contained"
          endIcon={<NavigateNextIcon />}
          disabled={loading || !result}
          onClick={() =>
            navigate(`/v2/ptrs/apply?runId=${runId}&profileId=${profileId}`)
          }
        >
          Next: Apply rules
        </Button>
      </Stack>
    </Box>
  );
}
