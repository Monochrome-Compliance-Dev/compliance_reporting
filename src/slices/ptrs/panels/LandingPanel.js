import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useNavigate } from "react-router";

// TEMP: replace with real API later
const fakeFetchRuns = async () => {
  return [
    {
      id: "run_1",
      fileName: "Veolia RP10",
      currentStep: "stage",
      status: "Draft",
      createdAt: new Date().toISOString(),
    },
  ];
};

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleString();
}

export default function LandingPanel() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [runs, setRuns] = useState([]);
  const [q, setQ] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchRuns = async () => {
    setIsLoading(true);
    try {
      const data = await fakeFetchRuns();
      setRuns(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const goNew = () => navigate("/app/ptrs/create");
  const goResume = (run) => navigate(`/app/ptrs/create/${run.id}`);
  const goTo = (path) => navigate(`/app/ptrs/${path}`);

  const filtered = runs.filter(
    (r) =>
      r.fileName?.toLowerCase().includes(q.toLowerCase()) ||
      r.id.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Box
      sx={{
        padding: theme.spacing(4),
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4">PTRS Workspace</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={fetchRuns} disabled={isLoading}>
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

      {/* Data Prep */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">Data Preparation</Typography>
          <Chip label={`${filtered.length} runs`} />
        </Stack>

        <TextField
          size="small"
          placeholder="Search runs"
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
          sx={{ mb: 2 }}
        />

        {filtered.map((r) => (
          <Paper key={r.id} sx={{ p: 2, mb: 1 }}>
            <Stack direction="row" justifyContent="space-between">
              <Box>
                <Typography variant="subtitle2">{r.fileName}</Typography>
                <Typography variant="caption">
                  Step: {r.currentStep} • {formatDate(r.createdAt)}
                </Typography>
              </Box>
              <Button
                onClick={() => goResume(r)}
                endIcon={<ArrowForwardIcon />}
              >
                Resume
              </Button>
            </Stack>
          </Paper>
        ))}
      </Paper>

      {/* Review */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Processing & Review</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Chip label="Groups: 24" />
          <Chip label="Records: 12,480" />
        </Stack>
        <Button
          sx={{ mt: 2 }}
          onClick={() => goTo("learning")}
          variant="contained"
        >
          Open review queue
        </Button>
      </Paper>

      {/* Snapshot */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Customer Snapshot</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Chip label="Payments: 18,240" />
          <Chip label="P95: 64 days" color="error" />
        </Stack>
      </Paper>
    </Box>
  );
}
