// PTRS v2 Layout: stepper + chrome only (no Create/Switch header button)
import { useEffect, useMemo } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import { useAlert } from "context";
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

  const isLanding = /\/v2\/ptrs\/landing(?:\/|$)/.test(location.pathname);

  const runId = params.get("runId") || null;

  useEffect(() => {
    if (typeof showAlert === "function")
      showAlert("PTRS v2 workspace loaded", "info");
  }, [showAlert]);

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
    const qs = params.toString(); // preserve all current query params (e.g., runId, profileId)
    navigate(`/v2/ptrs/${target}${qs ? `?${qs}` : ""}`);
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
          {/* Intentionally no header action buttons to avoid duplication with panel CTAs */}
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
        <Outlet />
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
    </Box>
  );
}
