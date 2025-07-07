import { useState, useEffect, useCallback } from "react";
import { getExclusionFlags, getIssueFlags } from "../../../lib/utils/";
import { useParams } from "react-router";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Tooltip,
  Alert,
} from "@mui/material";
import Loading from "../../../components/Loading";

import StepView from "./StepView";
import Step3 from "./Step3";
import Step6 from "./Step6";
// import Payment from "../../payment/Payment";

import { reportService, tcpService } from "../../../services";
import { glossary, ptrsGuidance } from "../../../constants/";
import { ReportContext } from "../../../context/ReportContext";
import { stepConfigs } from "../../../config/stepConfigs";
import {
  calculatePaymentTerm,
  calculatePaymentTime,
} from "../../../lib/calculations/ptrs";

const steps = [
  { label: "Step 1: Confirm TCPs", Component: StepView },
  { label: "Step 2: Finalise TCP Dataset", Component: StepView },
  { label: "Step 3: Export ABNs and upload returns for SBI", Component: Step3 },
  {
    label: "Step 4: Exclude parial payments and insert payment times",
    Component: StepView,
  },
  // { label: "Step 5: Process payment", Component: Payment },
  { label: "Step 6: Summary & Submission", Component: Step6 },
];

function enhanceWithGlossary(text) {
  if (!text) return "";
  // const terms = glossary.map((entry) => entry.term);
  const parts = text.split(/(\s+)/).map((word, index) => {
    const cleaned = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
    const match = glossary.find(
      (entry) => entry.term.toLowerCase() === cleaned
    );
    return match ? (
      <Tooltip key={index} title={match.definition}>
        <span style={{ textDecoration: "underline dotted", cursor: "help" }}>
          {word}
        </span>
      </Tooltip>
    ) : (
      word
    );
  });
  return <>{parts}</>;
}

function getChangedFields(record, original) {
  const changedFields = {};
  for (const key in original) {
    if (["wasChanged", "wasSaved", "original"].includes(key)) continue;
    const norm = (v) =>
      v === null || v === "" ? "" : v === true ? 1 : v === false ? 0 : v;
    const origVal = norm(original[key]);
    const currVal = norm(record[key]);
    if (origVal !== currVal) {
      changedFields[key] = record[key];
    }
  }
  return changedFields;
}

export default function ReportWizard() {
  const { reportId } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const params = useParams();

  const { Component } = steps[currentStep];
  const stepConfig = stepConfigs[`step${currentStep + 1}`];

  const updateRecordsWithFlags = useCallback(
    (records) => {
      if (!records || records.length === 0) return records;

      if (
        !stepConfig.exclusionRules?.length &&
        !stepConfig.issueRules?.length
      ) {
        return records; // Skip flagging altogether for steps 3 and 4
      }

      let flaggedRecords = records;

      if (stepConfig.exclusionRules?.length) {
        flaggedRecords = getExclusionFlags(
          flaggedRecords,
          stepConfig.exclusionRules
        );
      }

      if (stepConfig.issueRules?.length) {
        flaggedRecords = getIssueFlags(flaggedRecords, stepConfig.issueRules);
      }

      return flaggedRecords;
    },
    [stepConfig]
  );

  useEffect(() => {
    // Initial load logic (e.g. fetch report data)
    async function loadRecords() {
      try {
        const records = await tcpService.getAllByReportId(reportId);
        // console.log("Loaded records:", records);
        // Append wasChanged, wasSaved, and original object to each record
        const enhancedRecords = records.map((r) => {
          const { original, original_field, ...rest } = r; // Remove any original_ fields if exist
          // Calculate paymentTime and paymentTerm
          const paymentTime = calculatePaymentTime(rest);
          const paymentTerm = calculatePaymentTerm(rest);

          const originalCopy = JSON.parse(
            JSON.stringify({
              ...rest,
              paymentTime,
              paymentTerm,
            })
          );

          return {
            ...rest,
            paymentTime,
            paymentTerm,
            wasChanged: false,
            wasSaved: false,
            original: originalCopy,
          };
        });

        // Update the backend with the paymentTime and paymentTerm
        // Create the payload to update paymentTerm and paymentTime in the DB
        // const updatePayload = enhancedRecords.map((rec) => ({
        //   id: rec.id,
        //   paymentTime: rec.paymentTime,
        //   paymentTerm: rec.paymentTerm,
        // }));
        // console.log("Update payload:", updatePayload);

        // // Send the bulk patch request
        // if (updatePayload.length > 0)
        //   await tcpService.patchRecords(updatePayload);
        // setRecords(enhancedRecords || []);
        // setRecords((prev) => updateRecordsWithFlags(prev));

        // Until I can fix the bulk patch issue, we will just set the records
        setRecords(enhancedRecords || []);

        const report = await reportService.getById(params.reportId);
        // console.log("Report loaded:", report);
        if (report?.currentStep) {
          setCurrentStep(report.currentStep);
        }
      } catch (error) {
        console.error("Error loading report records:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecords();
  }, [reportId, updateRecordsWithFlags, params.reportId]);

  const goToNext = () => {
    // Save any changes before moving to the next step
    const changedCount = records.filter((rec) => rec.wasChanged).length;
    if (changedCount > 0) handleSaveUpdates();

    const currentStepIndex = currentStep;

    let hasErrors = false;

    if (currentStepIndex === 0) {
    }

    if (currentStepIndex === 1) {
    }

    if (currentStepIndex === 2) {
    }

    if (currentStepIndex === 3) {
    }

    if (currentStepIndex === 4) {
    }

    if (currentStepIndex === 5) {
    }

    if (hasErrors) return;

    setCurrentStep((prev) => {
      if (prev < steps.length - 1) return prev + 1;
      // report.currentStep = prev;
      return prev;
    });

    // Update the report's current step in the database
    // reportService
    //   .update(params.reportId, report)
    //   .then(() => {
    //     console.log("Report step updated successfully");
    //   })
    //   .catch((error) => {
    //     console.error("Failed to update report step:", error);
    //     setAlert({
    //       type: "error",
    //       message: "Failed to update report step.",
    //     });
    //   });
  };

  const goToBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSaveUpdates = async () => {
    try {
      const changedRecords = records.filter((rec) => rec.wasChanged);
      const payload = changedRecords.map((rec) => {
        const changedFields = getChangedFields(rec, rec.original);
        return { id: rec.id, ...changedFields, step: currentStep + 1 };
      });

      if (payload.length === 0) {
        setAlert({ type: "info", message: "No changes to save." });
        return;
      }

      const response = await tcpService.patchRecords(payload);

      // Handle updated records from response
      const updatedRecordsMap = {};
      if (Array.isArray(response?.results)) {
        response.results.forEach((updatedRec) => {
          updatedRecordsMap[updatedRec.id] = updatedRec;
        });
      } else if (response?.id) {
        updatedRecordsMap[response.id] = response;
      }

      setRecords((prevRecords) => {
        const newRecords = prevRecords.map((rec) => {
          if (updatedRecordsMap[rec.id]) {
            const updatedRec = updatedRecordsMap[rec.id];
            return {
              ...rec,
              wasChanged: false,
              wasSaved: true,
              updatedAt: updatedRec.updatedAt,
              original: JSON.parse(
                JSON.stringify({
                  ...rec,
                  ...updatedRec,
                  wasChanged: false,
                  wasSaved: true,
                })
              ),
            };
          }
          return rec;
        });
        return newRecords;
      });

      setAlert({ type: "success", message: "Changes saved successfully." });
    } catch (error) {
      console.error("Failed to save updated records:", error);
      setAlert({ type: "error", message: "Failed to save updates." });
    }
  };

  function renderGuidance() {
    const guidance = ptrsGuidance[currentStep];
    if (!guidance) return null;

    return (
      <Box
        sx={{
          mb: 4,
          p: 2,
          backgroundColor: "background.default",
          borderLeft: "4px solid #90caf9",
        }}
      >
        <Typography variant="subtitle1" gutterBottom>
          <strong>{guidance.name}</strong>
        </Typography>
        <Typography variant="body2" gutterBottom>
          {enhanceWithGlossary(guidance.description)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          <strong>Requirement:</strong>{" "}
          {enhanceWithGlossary(guidance.requirement)}
        </Typography>
      </Box>
    );
  }

  const handleRecordChange = (id, field, value) => {
    setRecords((prevRecords) =>
      prevRecords.map((record) => {
        if (record.id !== id) return record;

        const updatedRecord = { ...record, [field]: value, wasSaved: false };
        const changedFields = getChangedFields(updatedRecord, record.original);
        const result = {
          ...updatedRecord,
          wasChanged: Object.keys(changedFields).length > 0,
        };

        return result;
      })
    );
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasUnsavedChanges = Object.values(records).some(
        (records) =>
          Array.isArray(records) &&
          records.some((rec) => rec.updatedAt > rec.createdAt)
      );
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [records]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Loading />
      </Box>
    );
  }

  return (
    <ReportContext.Provider
      value={{
        reportId,
        currentStep: currentStep + 1,
        records,
        handleRecordChange,
        handleSaveUpdates,
        updateRecordsWithFlags, // add here
      }}
    >
      <Box sx={{ pt: 2, px: 3 }}>
        {alert && (
          <Alert
            severity={alert.severity}
            onClose={() => setAlert(null)}
            sx={{ mb: 2 }}
          >
            {alert.message}
          </Alert>
        )}
        {/* Main content */}
        <Typography
          variant="subtitle1"
          sx={{ mb: 0.5, color: "text.secondary" }}
        >
          Step {currentStep + 1} of {steps.length}
        </Typography>
        <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 2.5 }}>
          {steps.map((step, index) => (
            <Step key={step.label} completed={index < currentStep}>
              <Tooltip title={step.label} arrow>
                <StepLabel
                  // icon={
                  //   index < currentStep
                  //     ? stepErrors.includes(index)
                  //       ? "⚠️"
                  //       : "✓"
                  //     : undefined
                  // }
                  onClick={() => {
                    if (index < currentStep) setCurrentStep(index);
                  }}
                  sx={{
                    cursor: index < currentStep ? "pointer" : "default",
                    px: 1,
                  }}
                >
                  {step.label.replace(/^Step \d+: /, "")}
                </StepLabel>
              </Tooltip>
            </Step>
          ))}
        </Stepper>

        {renderGuidance()}
        <Box
          sx={{
            flexGrow: 1,
          }}
        >
          {records ? <Component stepId={currentStep + 1} /> : <Loading />}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button
            disabled={currentStep === 0}
            onClick={goToBack}
            variant="outlined"
          >
            Back
          </Button>
          {(() => {
            const changedCount = records.filter((rec) => rec.wasChanged).length;
            return (
              <Tooltip
                title={
                  changedCount === 0
                    ? "No changes to save"
                    : `Save the changes you made to ${changedCount} record${changedCount > 1 ? "s" : ""}`
                }
              >
                <span>
                  <Button
                    variant="outlined"
                    onClick={handleSaveUpdates}
                    disabled={changedCount === 0}
                  >
                    Save Updates
                  </Button>
                </span>
              </Tooltip>
            );
          })()}
          <Button
            onClick={goToNext}
            variant="contained"
            color="primary"
            disabled={currentStep === steps.length - 1}
          >
            {currentStep === steps.length - 2 ? "Finish" : "Next"}
          </Button>
        </Box>
      </Box>
    </ReportContext.Provider>
  );
}
