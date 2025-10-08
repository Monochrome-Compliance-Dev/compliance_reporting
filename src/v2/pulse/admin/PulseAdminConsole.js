import { useState } from "react";
import {
  Stack,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import { Link } from "react-router";
import { usePulseContext, useAlert } from "context";

export default function PulseAdminConsole() {
  const { tenantType, config, setTenantType, setConfigOverride } =
    usePulseContext();
  const { showAlert } = useAlert();
  const [jsonOverride, setJsonOverride] = useState("");

  const handleTenantChange = (e) => {
    const next = e.target.value || "default";
    setTenantType(next);
    showAlert(`Switched tenant to ${next}`, "info");
  };

  const applyOverride = () => {
    if (!jsonOverride.trim()) {
      setConfigOverride(null);
      showAlert("Cleared config override", "success");
      return;
    }
    try {
      const parsed = JSON.parse(jsonOverride);
      setConfigOverride(parsed);
      showAlert("Applied config override", "success");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Invalid JSON override", err);
      showAlert("Invalid JSON. Please fix and try again.", "error");
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Pulse Admin Console</Typography>
      <Typography variant="body2" color="text.secondary">
        Manage your clients, trackables, budgets and resources from here.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Config (Dev only)
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Switch tenant preset or apply a JSON override to test conditional
            UI.
          </Typography>

          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="tenant-select-label">Tenant preset</InputLabel>
              <Select
                labelId="tenant-select-label"
                label="Tenant preset"
                value={tenantType || "default"}
                onChange={handleTenantChange}
              >
                <MenuItem value="default">Default</MenuItem>
                <MenuItem value="internalDept">Internal Department</MenuItem>
                <MenuItem value="auditFirm">Audit Firm</MenuItem>
              </Select>
            </FormControl>

            <Divider />

            <TextField
              label="JSON override (optional)"
              placeholder='e.g. {"requiresClient": false, "showBudgets": false}'
              value={jsonOverride}
              onChange={(e) => setJsonOverride(e.target.value)}
              minRows={3}
              multiline
              fullWidth
              size="small"
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={applyOverride}>
                Apply override
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setJsonOverride("");
                  setConfigOverride(null);
                  showAlert("Cleared config override", "success");
                }}
              >
                Clear override
              </Button>
            </Stack>

            <Divider />

            <Typography variant="caption" color="text.secondary">
              Effective config:
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                bgcolor: "background.default",
                fontFamily: "monospace",
                fontSize: 12,
                whiteSpace: "pre-wrap",
              }}
            >
              {JSON.stringify(config || {}, null, 2)}
            </Paper>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Budgets
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Create, review and version budgets.
          </Typography>
          <Button
            component={Link}
            to="/v2/pulse/admin/budgets"
            variant="contained"
          >
            Open Budgets
          </Button>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Trackables
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Define work and group budgets under trackables.
          </Typography>
          <Button
            component={Link}
            to="/v2/pulse/admin/trackables"
            variant="contained"
          >
            Open Trackables
          </Button>
        </Paper>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Resources
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Add, edit, and manage staff/resources.
          </Typography>
          <Button
            component={Link}
            to="/v2/pulse/admin/resources"
            variant="contained"
          >
            Open Resources
          </Button>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Allocations
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            See who’s on what and spot over-allocation at a glance.
          </Typography>
          <Button
            component={Link}
            to="/v2/pulse/admin/allocations"
            variant="contained"
          >
            Open Allocation View
          </Button>
        </Paper>
      </Stack>
    </Stack>
  );
}
