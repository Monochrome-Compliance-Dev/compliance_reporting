import React from "react";
import { Stepper, Step, Box, StepButton } from "@mui/material";
import { useLocation, useNavigate } from "react-router";

const steps = [
  "Step 1 – TCP Dataset", // Load and review full payment data
  "Step 2 – Exclude Ineligible TCP Records", // Apply filtering rules (e.g., credit card, <$100)
  "Step 3 – Final TCP Dataset", // Lock in valid trade credit payments
  "Step 4 – SBI Tool Matching", // Export ABNs for portal classification
  "Step 5 – Upload SBI Results", // Upload SBI results from regulator tool
  "Step 6 – Final SBTCP Dataset", // Confirm small business trade credit payments
  "Step 7 – Generate Summary + Reports", // Export summary PDF + CSV datasets
  "Step 8 – Submit to Regulator", // Upload final outputs via PTRS portal
];

const ProcessFlow = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveStep = () => {
    if (location.pathname.startsWith("/reports/ptrs/report/")) {
      return 2; // Step 2 for dynamic report URLs
    }

    switch (location.pathname) {
      case "/reports/ptrs/create":
        return 1;
      case "/reports/ptrs/update":
        return 2;
      case "/reports/ptrs/extract":
        return 3;
      case "/reports/ptrs/upload":
        return 4;
      case "/reports/ptrs/capture":
        return 5;
      case "/reports/ptrs/complete":
        return 6;
      default:
        return 0;
    }
  };

  const getStepUrl = (index) => {
    const urls = [
      "/user/dashboard",
      "/reports/ptrs/create",
      "/reports/ptrs/update",
      "/reports/ptrs/extract",
      "/reports/ptrs/upload",
      "/reports/ptrs/capture",
      "/reports/ptrs/complete",
    ];

    // Handle dynamic URLs for step 2
    if (index === 2 && location.pathname.startsWith("/reports/ptrs/report/")) {
      return location.pathname; // Preserve the current dynamic URL
    }

    return urls[index] || "/";
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Stepper activeStep={getActiveStep()} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepButton onClick={() => navigate(getStepUrl(index))}>
              {label}
            </StepButton>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default ProcessFlow;
