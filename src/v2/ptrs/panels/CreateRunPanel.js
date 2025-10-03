import { useState } from "react";
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router";
import { useAlert } from "../../../context";
import {
  useCreateRunMutation,
  useRunsSearch,
  useRunsByPeriod,
} from "../hooks/usePtrsQueries";
import { userService } from "../../../services";

export default function CreateRunPanel() {
  const [name, setName] = useState("");
  const [periodKey, setPeriodKey] = useState("");
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const createRun = useCreateRunMutation();

  // Existing runs for the chosen period (selection UI)
  const runsForPeriod = useRunsByPeriod(periodKey);

  const normalise = (s) => (s || "").trim().replace(/\s+/g, " ").toLowerCase();
  const hasNameCollision =
    Boolean(periodKey) &&
    Boolean(name) &&
    Array.isArray(runsForPeriod) &&
    runsForPeriod.some((r) => normalise(r.runName) === normalise(name));

  const reportingCycles = [
    { value: "2024-07", label: "Reporting cycle 8, 1 Jul 2024 - 31 Dec 2024" },
    { value: "2025-01", label: "Reporting cycle 9, 1 Jan 2025 - 30 Jun 2025" },
    { value: "2025-07", label: "Reporting cycle 10, 1 Jul 2025 - 31 Dec 2025" },
    { value: "2026-01", label: "Reporting cycle 11, 1 Jan 2026 - 30 Jun 2026" },
    { value: "2026-07", label: "Reporting cycle 12, 1 Jul 2026 - 31 Dec 2026" },
    { value: "2027-01", label: "Reporting cycle 13, 1 Jan 2027 - 30 Jun 2027" },
    { value: "2027-07", label: "Reporting cycle 14, 1 Jul 2027 - 31 Dec 2027" },
  ];

  function getPeriodDates(pk) {
    if (!pk || typeof pk !== "string" || pk.length < 7) return null;
    const [yyyy, mm] = pk.split("-");
    if (mm === "07") {
      return {
        reportingPeriodStartDate: `${yyyy}-07-01`,
        reportingPeriodEndDate: `${yyyy}-12-31`,
      };
    }
    if (mm === "01") {
      return {
        reportingPeriodStartDate: `${yyyy}-01-01`,
        reportingPeriodEndDate: `${yyyy}-06-30`,
      };
    }
    return null;
  }

  const onCreate = async () => {
    const dates = getPeriodDates(periodKey);
    if (!dates) {
      return showAlert("Pick a valid reporting period", "info");
    }

    const createdBy = userService?.userValue?.id;
    if (!createdBy) {
      return showAlert("No current user — cannot create PTRS run.", "error");
    }

    const payload = {
      runName: name,
      periodKey: periodKey,
      ...dates,
      currentStep: 0,
      status: "Created",
      createdBy,
      // customerId intentionally omitted; BE controller inserts effective customer
    };

    try {
      const res = await createRun.mutateAsync(payload);
      console.log("Create PTRS run response", res);
      const runId = res?.id;
      if (runId) {
        showAlert("PTRS run created", "success");
        navigate(`/v2/ptrs/upload?runId=${runId}`);
      } else {
        showAlert("Failed to create run", "error");
      }
    } catch (e) {
      showAlert(e?.message || "Error creating run", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Create or select PTRS run
      </Typography>

      {/* Period selector only */}
      <Stack direction="row" spacing={2} sx={{ maxWidth: 720 }}>
        <FormControl fullWidth>
          <InputLabel id="period-key-label">Reporting period</InputLabel>
          <Select
            labelId="period-key-label"
            id="period-key"
            label="Reporting period"
            value={periodKey}
            onChange={(e) => setPeriodKey(e.target.value)}
          >
            {reportingCycles.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* If period selected and runs exist, show list */}
      {periodKey &&
        Array.isArray(runsForPeriod) &&
        runsForPeriod.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Existing PTRS runs for this period
            </Typography>
            <Stack spacing={1}>
              {runsForPeriod.map((r) => (
                <Stack
                  key={r.id}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    p: 1.25,
                    border: (t) => `1px solid ${t.palette.divider}`,
                    borderRadius: 1,
                  }}
                >
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {r.runName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.periodKey} • created{" "}
                      {new Date(r.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/v2/ptrs/upload?runId=${r.id}`)}
                  >
                    Open
                  </Button>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

      {/* Create form: shown when a period is selected (always), so users can add another run. */}
      {periodKey && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {runsForPeriod?.length > 0
              ? "Create another PTRS run for this period"
              : "Create the first PTRS run for this period"}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ maxWidth: 720 }}>
            <TextField
              label="Run name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              error={hasNameCollision}
              helperText={
                hasNameCollision
                  ? "A run with this name already exists for the selected period"
                  : ""
              }
            />
            <Button
              variant="contained"
              onClick={onCreate}
              disabled={
                !name || !periodKey || createRun.isLoading || hasNameCollision
              }
            >
              {createRun.isLoading ? "Creating…" : "Create"}
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
