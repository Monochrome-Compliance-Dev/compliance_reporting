// PTRS v2 Layout: stepper + chrome only (no Create/Switch header button)
import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
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
} from "@mui/material";
import { getCurrentCustomer } from "lib/utils";
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
import { usePtrsV2Context } from "./context/PtrsV2Context";

export default function PtrsV2Layout() {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const location = useLocation();

  const { loadProfilesForCustomer, ptrsId, profileId, setProfileId, profiles } =
    usePtrsV2Context();

  const profilesArray = Array.isArray(profiles) ? profiles : [];

  const isLanding = /^\/v2\/ptrs(?:\/landing)?\/?$/.test(location.pathname);

  useEffect(() => {
    if (typeof showAlert === "function")
      showAlert("PTRS v2 workspace loaded", "info");
  }, [showAlert]);

  useEffect(() => {
    const customer = getCurrentCustomer();
    const customerId = customer?.id || null;

    if (customerId) {
      loadProfilesForCustomer(customerId);
    } else {
      // No scoped customer – let the context clear profiles via its own logic
      loadProfilesForCustomer(null);
    }
  }, [loadProfilesForCustomer]);

  const currentStepId = useMemo(() => {
    if (isLanding) return "landing";
    const parts = location.pathname.split("/").filter(Boolean);
    const maybe = parts[parts.length - 1];
    return STEPS.some((s) => s.id === maybe) ? maybe : "create";
  }, [location.pathname, isLanding]);

  const { gates } = useStepStatuses(ptrsId, currentStepId);

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
    const allowed = new URLSearchParams();
    if (ptrsId) allowed.set("ptrsId", ptrsId);
    const tail = allowed.toString();
    navigate(`/v2/ptrs/${target}${tail ? `?${tail}` : ""}`);
  }

  const stepDisabled = (id) => {
    if (id === "create") return false;
    if (!ptrsId) return true;
    const order = STEPS.map((s) => s.id);
    const targetIdx = order.indexOf(id);
    for (let i = 0; i < targetIdx; i++) {
      if (!gates[order[i]]) return true;
    }
    return false;
  };

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

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
                profilesArray.length
                  ? `Profile: ${profilesArray.find((p) => String(p.id) === String(profileId))?.name || "None"}`
                  : "Profile: None"
              }
            />
            <Link
              component="button"
              type="button"
              underline="hover"
              sx={{ fontSize: 12 }}
              onClick={() => setProfileDialogOpen(true)}
            >
              {profilesArray.length ? "Change" : "Choose"}
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
            profileId,
            profiles: profilesArray,
            setProfileId,
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
          {!profilesArray.length ? (
            <Typography variant="body2" color="text.secondary">
              No profiles yet. Create one in PTRS v2 → Profiles.
            </Typography>
          ) : (
            <RadioGroup
              name="profileChoice"
              value={profileId || ""}
              onChange={(e) => setProfileId(e.target.value || null)}
            >
              {profilesArray.map((p) => (
                <FormControlLabel
                  key={p.id}
                  value={p.id}
                  control={<Radio />}
                  label={p.name || p.code || p.id}
                />
              ))}
            </RadioGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              const cur = getCurrentCustomer() || {};
              // setCurrentCustomer({
              //   id: cur.id,
              //   name: cur.name,
              //   profileId: profileId || null,
              // });
              setProfileDialogOpen(false);
            }}
            disabled={!profileId && profilesArray.length > 0}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
