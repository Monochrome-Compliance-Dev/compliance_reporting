import React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

const steps = [
  {
    step: "Step 1",
    description:
      "Load full payment data and exclude payments that are not trade credit payments (TCPs)",
  },
  {
    step: "Step 2",
    description:
      "Capture additional required details for each TCP (Peppol enabled eInvoice, RCTI, Credit Card Payment, Credit Card Number, Partial Payment, Payment Term)",
  },
  {
    step: "Step 3",
    description:
      "Exclude TCPs that meet exclusion criteria (Entities without an ABN, Intra-group payments, Credit card payments of < $100 (optional), credit card payments using prohibited credit cards under a genuine internal policy (if applicable), others?",
  },
  {
    step: "Step 4",
    description:
      "Run TCP extract against SBI tool and upload SBI results to highlight Small Business TCPs",
  },
  {
    step: "Step 6",
    description:
      "Confirm small business trade credit payments - more to come here",
  },
  {
    step: "Step 7",
    description: "Export summary PDF + CSV datasets",
  },
  {
    step: "Step 8",
    description: "Upload final outputs via PTRS portal",
  },
];

export default function StepsOverview() {
  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <Box sx={{ maxWidth: 400 }}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.step}>
            <StepLabel
              optional={
                index === steps.length - 1 ? (
                  <Typography variant="caption">Last step</Typography>
                ) : null
              }
            >
              {step.label}
            </StepLabel>
            <StepContent>
              <Typography>{step.description}</Typography>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ mt: 1, mr: 1 }}
                >
                  {index === steps.length - 1 ? "Finish" : "Continue"}
                </Button>
                <Button
                  disabled={index === 0}
                  onClick={handleBack}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length && (
        <Paper square elevation={0} sx={{ p: 3 }}>
          <Typography>All steps completed - you&apos;re finished</Typography>
          <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
            Reset
          </Button>
        </Paper>
      )}
    </Box>
  );
}
