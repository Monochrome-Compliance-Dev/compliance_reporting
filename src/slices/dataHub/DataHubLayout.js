import { useEffect, useMemo } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import {
  Box,
  Button,
  Divider,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import PageMeta from "shared/ui/PageMeta";
import { useDataHubContext } from "./context/DataHubContext";
import { STEPS } from "./steps";

export default function DataHubLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { selectedDataset, selectDataset } = useDataHubContext();

  const isLanding = /^\/app\/data-hub(?:\/landing)?\/?$/.test(
    location.pathname,
  );
  const isWizard = !isLanding;

  useEffect(() => {
    const datasetId = params.get("datasetId");
    if (datasetId) selectDataset(datasetId);
  }, [params, selectDataset]);

  const currentStepId = useMemo(() => {
    if (isLanding) return "landing";

    const parts = location.pathname.split("/").filter(Boolean);
    const dataHubIndex = parts.indexOf("data-hub");
    const maybe =
      dataHubIndex >= 0 ? parts[dataHubIndex + 1] : parts[parts.length - 1];

    return STEPS.some((step) => step.id === maybe) ? maybe : "landing";
  }, [isLanding, location.pathname]);

  const currentIndex = useMemo(
    () =>
      Math.max(
        0,
        STEPS.findIndex((step) => step.id === currentStepId),
      ),
    [currentStepId],
  );

  function goToStep(index) {
    const target = STEPS[index]?.id || "landing";
    const datasetId = params.get("datasetId");
    const suffix = datasetId
      ? `?datasetId=${encodeURIComponent(datasetId)}`
      : "";
    const path =
      target === "landing"
        ? "/app/data-hub"
        : `/app/data-hub/${target}${suffix}`;
    navigate(path);
  }

  return (
    <Box sx={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <PageMeta title="Data Hub" />

      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6" fontWeight={700}>
            Data Hub
          </Typography>
          {selectedDataset && (
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" color="text.secondary">
                Active dataset
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {selectedDataset.name}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {isWizard && (
        <Box sx={{ px: 3, py: 2 }}>
          <Stepper activeStep={currentIndex} alternativeLabel>
            {STEPS.map((step, index) => (
              <Step key={step.id} completed={index < currentIndex}>
                <StepLabel
                  onClick={() => goToStep(index)}
                  sx={{ cursor: "pointer" }}
                >
                  {step.label}
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

      {isWizard && (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
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
              disabled={currentIndex >= STEPS.length - 1}
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
