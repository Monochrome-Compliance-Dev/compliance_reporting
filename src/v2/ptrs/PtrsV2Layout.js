// PTRS v2 Layout: stepper + chrome only (no Create/Switch header button)
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import { useAlert } from "context";
import {
  Chip,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
} from "@mui/material";
import { listProfiles as listPtrsProfiles } from "v2/ptrs/services/ptrsApi";
import { getCurrentCustomer, setCurrentCustomer } from "lib/utils";
import {
  Box,
  Typography,
  Stack,
  Button,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from "@mui/material";
import PageMeta from "components/ui/PageMeta";
import { STEPS } from "./steps";
import { useStepStatuses } from "./hooks/useStepStatuses";

export default function PtrsV2Layout() {
  const { showAlert } = useAlert();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // --- Profiles state (kept in v2 Layout, PtrsContext remains v1-only) ---
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(
    () => getCurrentCustomer()?.profileId || null
  );
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const currentCustomerId = getCurrentCustomer()?.id || null;

  const loadProfilesForCustomer = useCallback(
    async (customerId) => {
      if (!customerId) return;
      setLoadingProfiles(true);
      try {
        const { items: list = [] } = await listPtrsProfiles(customerId);
        setProfiles(Array.isArray(list) ? list : []);
        // keep existing selection if still present; else fallback to default or first
        const existing = getCurrentCustomer()?.profileId || selectedProfileId;
        // console.log("[Profiles]", {
        //   fetched: list.map((p) => String(p.id)),
        //   stored: String(getCurrentCustomer()?.profileId ?? ""),
        //   localState: String(selectedProfileId ?? ""),
        // });

        const exists = list.find((p) => String(p.id) === String(existing));
        const fallback = list.find((p) => p.isDefault) || list[0] || null;
        const nextId = exists ? exists.id : fallback?.id || null;
        setSelectedProfileId(nextId);
        const cur = getCurrentCustomer() || {};
        setCurrentCustomer({
          id: cur.id || customerId,
          name: cur.name,
          profileId: nextId,
        });
      } catch (e) {
        // non-fatal; user can proceed without a profile
      } finally {
        setLoadingProfiles(false);
      }
    },
    [selectedProfileId]
  );

  const isLanding = /\/v2\/ptrs\/landing(?:\/|$)/.test(location.pathname);

  const runId = params.get("runId") || null;

  useEffect(() => {
    if (typeof showAlert === "function")
      showAlert("PTRS v2 workspace loaded", "info");
  }, [showAlert]);

  useEffect(() => {
    // Load profiles whenever tenant (customer) changes
    if (currentCustomerId) {
      loadProfilesForCustomer(currentCustomerId);
    }
  }, [currentCustomerId, loadProfilesForCustomer]);

  const currentStepId = useMemo(() => {
    if (isLanding) return "landing";
    const parts = location.pathname.split("/").filter(Boolean);
    const maybe = parts[parts.length - 1];
    return STEPS.some((s) => s.id === maybe) ? maybe : "create";
  }, [location.pathname, isLanding]);

  const { gates } = useStepStatuses(runId, currentStepId);

  const currentIndex = useMemo(
    () =>
      Math.max(
        0,
        STEPS.findIndex((s) => s.id === currentStepId)
      ),
    [currentStepId]
  );

  function goToStep(index) {
    const target = STEPS[index]?.id || "landing";
    const qs = new URLSearchParams(params);
    // ensure runId is preserved but do not stuff profileId into the URL anymore
    const allowed = new URLSearchParams();
    const run = qs.get("runId");
    if (run) allowed.set("runId", run);
    const tail = allowed.toString();
    navigate(`/v2/ptrs/${target}${tail ? `?${tail}` : ""}`);
  }

  const stepDisabled = (id) => {
    if (id === "create") return false;
    if (!runId) return true;
    const order = STEPS.map((s) => s.id);
    const targetIdx = order.indexOf(id);
    for (let i = 0; i < targetIdx; i++) {
      if (!gates[order[i]]) return true;
    }
    return false;
  };

  return (
    <Box sx={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <PageMeta title="PTRS v2" />

      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6" fontWeight={700}>
            PTRS v2
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label={
                loadingProfiles
                  ? "Profile: loading…"
                  : `Profile: ${profiles.find((p) => String(p.id) === String(selectedProfileId))?.name || "None"}`
              }
            />
            <Link
              component="button"
              type="button"
              underline="hover"
              sx={{ fontSize: 12 }}
              onClick={() => setProfileDialogOpen(true)}
            >
              {profiles.length ? "Change" : "Choose"}
            </Link>
          </Stack>
        </Stack>
      </Box>

      {!isLanding && (
        <Box sx={{ px: 3, py: 2 }}>
          <Stepper activeStep={currentIndex} alternativeLabel>
            {STEPS.map((s, idx) => (
              <Step
                key={s.id}
                completed={Boolean(gates[s.id])}
                disabled={stepDisabled(s.id)}
              >
                <StepLabel
                  onClick={() => !stepDisabled(s.id) && goToStep(idx)}
                  sx={{
                    cursor: stepDisabled(s.id) ? "not-allowed" : "pointer",
                  }}
                >
                  {s.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}

      <Divider />

      <Box sx={{ flex: 1, p: 3 }}>
        <Outlet
          context={{
            profileId: selectedProfileId,
            profiles,
            setProfileId: setSelectedProfileId,
          }}
        />
      </Box>

      {!isLanding && (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          <Stack direction="row" justifyContent="space-between">
            <Button
              variant="text"
              disabled={currentIndex === 0}
              onClick={() => goToStep(currentIndex - 1)}
            >
              Back
            </Button>
            <Button
              variant="contained"
              disabled={
                currentIndex >= STEPS.length - 1 ||
                stepDisabled(STEPS[currentIndex + 1].id)
              }
              onClick={() => goToStep(currentIndex + 1)}
            >
              Next
            </Button>
          </Stack>
        </Box>
      )}

      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Select PTRS profile</DialogTitle>
        <DialogContent>
          {loadingProfiles ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Loading profiles…</Typography>
            </Box>
          ) : profiles.length ? (
            <RadioGroup
              name="profileChoice"
              value={selectedProfileId || ""}
              onChange={(e) => setSelectedProfileId(e.target.value || null)}
            >
              {profiles.map((p) => (
                <FormControlLabel
                  key={p.id}
                  value={p.id}
                  control={<Radio />}
                  label={p.name || p.code || p.id}
                />
              ))}
            </RadioGroup>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No profiles yet. Create one in PTRS v2 → Profiles.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              const cur = getCurrentCustomer() || {};
              setCurrentCustomer({
                id: cur.id,
                name: cur.name,
                profileId: selectedProfileId || null,
              });
              setProfileDialogOpen(false);
            }}
            disabled={
              loadingProfiles || (!selectedProfileId && profiles.length > 0)
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
