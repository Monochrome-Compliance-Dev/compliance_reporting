// PTRS v2 Landing — pick up an existing run or jump into the Data Console

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { usePtrsV2Context } from "v2/ptrs/context/PtrsV2Context";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useAlert } from "context";
import { listPtrs } from "../services/ptrsApi";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function LandingPanel() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { profileId, setPtrsId } = usePtrsV2Context();
  const { showAlert } = useAlert();

  const [runs, setRuns] = useState([]);
  const [q, setQ] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchRuns = async () => {
    setIsLoading(true);
    try {
      const { items } = await listPtrs();
      setRuns(items || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      showAlert("Failed to load PTRS runs", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return runs;
    return runs.filter((r) =>
      [r?.id, r?.fileName, r?.status, r?.customerId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle))
    );
  }, [q, runs]);

  const goResume = (ptrsId) => {
    // Set the active PTRS in context so downstream panels don’t
    // depend solely on the URL.
    setPtrsId(ptrsId);

    const qs = new URLSearchParams();
    qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    navigate(`/v2/ptrs/map?${qs.toString()}`);
  };

  const goNew = () => {
    const qs = new URLSearchParams();
    if (profileId) qs.set("profileId", profileId);
    navigate(`/v2/ptrs/data?${qs.toString()}`);
  };

  return (
    <Box
      sx={{
        padding: theme.spacing(4),
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4">PTRS v2</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={fetchRuns} title="Refresh" disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={goNew}
          >
            New run
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Welcome
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create a run and upload datasets in the Data Console, or resume an
          existing run. If you’re acting on behalf of another customer (Boss),
          switch customer in Workspace first — runs here are tenant-scoped.
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <TextField
            size="small"
            placeholder="Search runs (id, name, status)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            fullWidth
          />
          <Chip
            label={`${filtered.length} run${filtered.length === 1 ? "" : "s"}`}
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {isLoading
              ? "Loading..."
              : "No runs yet. Click “New run” to get started."}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {filtered.map((r) => (
              <Paper
                key={r.id}
                variant="outlined"
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ mr: 2, minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    noWrap
                    title={r.fileName || r.id}
                  >
                    {r.fileName || r.id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Run ID: {r.id} • Status: {r.status || "New"} • Created:{" "}
                    {formatDate(r.createdAt)}
                  </Typography>
                </Box>
                <Button
                  variant="text"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => goResume(r.id)}
                >
                  Resume
                </Button>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
