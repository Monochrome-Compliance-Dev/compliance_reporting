import { useState, useEffect, useCallback } from "react";
import { useTcpContext } from "../../context/TcpContext";
import { getExclusionFlags, getIssueFlags } from "../../lib/utils";
import { usePtrsContext } from "../../context";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Tooltip,
} from "@mui/material";
import { useAlert } from "../../context/AlertContext";
import { LoadingSpinner } from "../../components/ui";

import StepView from "./StepView";
import Step3 from "./Step3";
import Step6 from "./Step6";
// import Payment from "../../payment/Payment";

import { ptrsService, tcpService } from "../../services";
import { glossary, ptrsGuidance } from "../../constants";
import { PtrsContext } from "../../context/PtrsContext";
import { stepConfigs } from "../../config/stepConfigs";
import { getExclusionRules as fetchExclusionRules } from "./exclusions";

const steps = [
  { label: "Step 1: Confirm TCPs", Component: StepView },
  { label: "Step 2: Finalise TCP Dataset", Component: StepView },
  { label: "Step 3: Export ABNs and upload returns for SBI", Component: Step3 },
  {
    label: "Step 4: Exclude partial payments and insert payment times",
    Component: StepView,
    canRecalculate: true,
  },
  { label: "Step 5: Summary & Submission", Component: Step6 },
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

// Primes records with __orig snapshot and wasChanged: false
function primeOriginals(records) {
  if (!Array.isArray(records)) return records;
  return records.map((r) => {
    const clone = { ...r };
    delete clone.wasChanged;
    delete clone.__orig;
    return {
      ...r,
      wasChanged: false,
      __orig: r.__orig ? r.__orig : clone,
    };
  });
}

// Returns changed fields between current and original, using normalization
function diffAgainstOrig(current, orig) {
  const changed = {};
  if (!current || !orig) return changed;
  const norm = (v) =>
    v === null || v === "" ? "" : v === true ? 1 : v === false ? 0 : v;
  for (const key in orig) {
    if (["wasChanged", "wasSaved", "original", "__orig"].includes(key))
      continue;
    if (norm(current[key]) !== norm(orig[key])) changed[key] = current[key];
  }
  return changed;
}

export default function PtrsWizard() {
  const { activePtrsId, ptrsDetails } = usePtrsContext();
  const { tcpRecords: ctxRecords, refresh } = useTcpContext();
  const [tcpRecords, setTcpRecords] = useState([]);

  useEffect(() => {
    if (!Array.isArray(ctxRecords)) return;
    setTcpRecords((prev) => {
      // If there are unsaved edits, do not clobber local changes
      const hasUnsaved = Array.isArray(prev) && prev.some((r) => r?.wasChanged);
      if (hasUnsaved) return prev;

      const next = primeOriginals(ctxRecords);

      // Avoid state updates if nothing effectively changed
      const sameLength = Array.isArray(prev) && prev.length === next.length;
      const sameKeys = sameLength
        ? prev.every(
            (r, i) =>
              r?.id === next[i]?.id && r?.updatedAt === next[i]?.updatedAt
          )
        : false;
      if (sameLength && sameKeys) return prev;

      return next;
    });
  }, [ctxRecords]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // Remove local alert state, use global AlertContext instead
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [exclusionRules, setExclusionRules] = useState(
    stepConfigs?.[`step${(currentStep || 0) + 1}`]?.exclusionRules || []
  );

  const { showAlert } = useAlert();

  const { Component } = steps[currentStep];
  const stepConfig = stepConfigs[`step${currentStep + 1}`];

  // Load BE-driven exclusion rules per step, with fallback to stepConfigs
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Only steps 1 and 2 use exclusions
      if (!(currentStep === 0 || currentStep === 1)) {
        if (!cancelled) setExclusionRules([]); // clear any previous rules
        return;
      }

      try {
        const rules = await fetchExclusionRules(currentStep + 1, { showAlert });
        // console.log("rules: ", rules);
        if (!cancelled) setExclusionRules(rules || []);
      } catch (e) {
        if (!cancelled) {
          const fallback =
            stepConfigs?.[`step${currentStep + 1}`]?.exclusionRules || [];
          setExclusionRules(fallback);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [currentStep, showAlert]);

  const updateRecordsWithFlags = useCallback(
    (records) => {
      if (!records || records.length === 0) return records;

      const hasExclusions =
        Array.isArray(exclusionRules) && exclusionRules.length > 0;
      const hasIssues =
        Array.isArray(stepConfig?.issueRules) &&
        stepConfig.issueRules.length > 0;
      if (!hasExclusions && !hasIssues) {
        // Skip flagging altogether for steps without any rules
        return records;
      }

      let flaggedRecords = records;

      if (hasExclusions) {
        flaggedRecords = getExclusionFlags(flaggedRecords, exclusionRules);
      } else if (
        Array.isArray(stepConfig?.exclusionRules) &&
        stepConfig.exclusionRules.length
      ) {
        // Safety: fallback to static config if dynamic rules are empty for some reason
        flaggedRecords = getExclusionFlags(
          flaggedRecords,
          stepConfig.exclusionRules
        );
      }

      if (hasIssues) {
        flaggedRecords = getIssueFlags(flaggedRecords, stepConfig.issueRules);
      }

      return flaggedRecords;
    },
    [exclusionRules, stepConfig]
  );

  useEffect(() => {
    async function loadRecords() {
      try {
        if (!activePtrsId) {
          setIsLoading(false);
          return;
        }
        // Recalc is deferred to the reporting step (Step 5 / index 4)

        // Fetch a sample page immediately so the UI can render
        await refresh();

        // (Optional) when recalc finishes, you can refresh again if you want:
        // recalcPromise.finally(() => refresh());

        // Derive current step from context instead of backend call
        const ctxPtr = Array.isArray(ptrsDetails)
          ? ptrsDetails.find((r) => r?.id === activePtrsId)
          : null;
        if (ctxPtr && ctxPtr.currentStep != null) {
          const next = Math.min(ctxPtr.currentStep, steps.length - 1);
          setCurrentStep((prev) => (prev === next ? prev : next));
        }
      } catch (error) {
        console.error("Error loading ptrs records:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecords();
  }, [activePtrsId, ptrsDetails, refresh]);

  useEffect(() => {
    if (currentStep === 3 && activePtrsId) {
      const forceRecalcAndReload = async () => {
        try {
          setIsRecalculating(true);
          await tcpService.recalculateMetrics(activePtrsId);
          try {
            const now = new Date().toISOString();
            localStorage.setItem(`lastRecalc_${activePtrsId}`, now);
          } catch {}
          const resp = await tcpService.getValidByPtrsId(activePtrsId, {
            page: 1,
            pageSize: 50,
          });
          const rows = Array.isArray(resp)
            ? resp
            : Array.isArray(resp?.data)
              ? resp.data
              : Array.isArray(resp?.rows)
                ? resp.rows
                : [];
          setTcpRecords(primeOriginals(rows));
          try {
            sessionStorage.setItem(
              `tcp_records_${activePtrsId}`,
              JSON.stringify(primeOriginals(rows))
            );
          } catch {}
        } catch (err) {
          console.error("Step 5 recalc failed", err);
        } finally {
          setIsRecalculating(false);
        }
      };
      forceRecalcAndReload();
    }
  }, [currentStep, activePtrsId]);

  const saveCurrentStep = async (step) => {
    try {
      if (!activePtrsId) throw new Error("No PTRS id available");
      await ptrsService.patch(activePtrsId, { currentStep: step });
      showAlert("Progress updated successfully.", "success");
    } catch (error) {
      console.error("Failed to save current step:", error);
      showAlert("Failed to save current step. Please try again.", "error");
    }
  };

  const goToNext = () => {
    // Save any changes before moving to the next step
    const changedCount = (tcpRecords || []).filter(
      (rec) => rec.wasChanged
    ).length;
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

    const nextStep = Math.min(currentStep + 1, steps.length - 1);
    setCurrentStep(nextStep);
    // saveCurrentStep(nextStep);
  };

  const goToBack = () => {
    const prevStep = Math.max(currentStep - 1, 0);
    setCurrentStep(prevStep);
    // saveCurrentStep(prevStep);
  };

  const handleSaveUpdates = async () => {
    try {
      const changed = Array.isArray(tcpRecords)
        ? tcpRecords.filter((r) => r && r.wasChanged)
        : [];
      if (changed.length === 0) {
        showAlert("No changes to save.", "info");
        return;
      }

      // Build diff payloads per record
      const diffs = changed.map((r) => ({
        id: r.id,
        fields: diffAgainstOrig(r, r.__orig),
      }));

      // Prefer bulk update when available
      let successes = 0;
      let failures = 0;

      const hasBulk = typeof tcpService.patchRecords === "function";
      const hasSingle = typeof tcpService.patchRecord === "function";

      try {
        if (hasBulk) {
          // Common bulk shape: [{ id, ...fields }] or [{ id, fields: {...} }]
          // We’ll support both by trying spread form first, and if it fails, retry with {id, fields}
          const spreadPayload = diffs.map(({ id, fields }) => ({
            id,
            ...fields,
          }));
          await tcpService.patchRecords(spreadPayload);
          successes = spreadPayload.length;
        } else {
          throw new Error("Bulk patch not available");
        }
      } catch (bulkErr) {
        // Fallback: either bulk not available or payload shape mismatch; try {id, fields}
        if (hasBulk) {
          try {
            await tcpService.patchRecords(diffs);
            successes = diffs.length;
          } catch (bulkShapeErr) {
            // Final fallback: per-record
            if (!hasSingle) throw bulkShapeErr;
            const results = await Promise.allSettled(
              diffs.map(({ id, fields }) => tcpService.patchRecord(id, fields))
            );
            failures = results.filter((r) => r.status === "rejected").length;
            successes = results.length - failures;
          }
        } else if (hasSingle) {
          const results = await Promise.allSettled(
            diffs.map(({ id, fields }) => tcpService.patchRecord(id, fields))
          );
          failures = results.filter((r) => r.status === "rejected").length;
          successes = results.length - failures;
        } else {
          throw bulkErr;
        }
      }

      // If at least one success, merge saved fields back into __orig and clear wasChanged
      if (successes > 0) {
        const successfulIds = new Set(
          changed.slice(0, successes).map((r) => r.id)
        );
        setTcpRecords((rows) =>
          rows.map((r) => {
            if (!r.wasChanged || !successfulIds.has(r.id)) return r;
            const fields = diffAgainstOrig(r, r.__orig);
            if (Object.keys(fields).length === 0)
              return { ...r, wasChanged: false };
            const newOrig = { ...r.__orig, ...fields };
            return { ...r, __orig: newOrig, wasChanged: false };
          })
        );
      }

      if (failures > 0) {
        showAlert(
          `${successes} record(s) saved, ${failures} failed.`,
          "warning"
        );
      } else {
        showAlert(`${successes} record(s) saved.`, "success");
      }
    } catch (error) {
      console.error("Failed to save updated records:", error);
      showAlert("Failed to save updates.", "error");
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
    setTcpRecords((rows) =>
      Array.isArray(rows)
        ? rows.map((r) => {
            if (r?.id !== id) return r;
            const next = { ...r, [field]: value };
            // compute diff vs original snapshot
            const changed = diffAgainstOrig(next, r.__orig);
            next.wasChanged = Object.keys(changed).length > 0;
            return next;
          })
        : rows
    );
  };
  const editTcpRecord = handleRecordChange; // alias for downstream consumers expecting this name

  // Recompute flags/derived fields for current PTRS
  async function recomputeFlags() {
    if (!activePtrsId) return;
    try {
      await tcpService.recalculateMetrics(activePtrsId);
      const resp = await tcpService.getValidByPtrsId(activePtrsId, {
        page: 1,
        pageSize: 50,
      });
      const rows = Array.isArray(resp)
        ? resp
        : Array.isArray(resp?.data)
          ? resp.data
          : Array.isArray(resp?.rows)
            ? resp.rows
            : [];
      setTcpRecords(primeOriginals(rows));
      try {
        sessionStorage.setItem(
          `tcp_records_${activePtrsId}`,
          JSON.stringify(primeOriginals(rows))
        );
      } catch {}
    } catch (err) {
      console.error("Recompute flags failed", err);
      // leave state unchanged
    }
  }

  // Apply exclusion/issue flags to records when rules or step change (Steps 1 & 2)
  useEffect(() => {
    const isStepNeedingFlags = currentStep === 0 || currentStep === 1;
    if (!isStepNeedingFlags) return;
    setTcpRecords((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;
      // Recompute flags only; does not clobber edits or __orig
      const next = updateRecordsWithFlags(prev);
      return next;
    });
  }, [currentStep, exclusionRules, updateRecordsWithFlags]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasUnsavedChanges = Array.isArray(tcpRecords)
        ? tcpRecords.some((rec) => rec?.wasChanged)
        : false;
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [tcpRecords]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <LoadingSpinner />
      </Box>
    );
  }

  const changedCount = (tcpRecords || []).filter(
    (rec) => rec.wasChanged
  ).length;
  return (
    <PtrsContext.Provider
      value={{
        ptrsId: activePtrsId,
        currentStep: currentStep + 1,
        records: tcpRecords,
        handleRecordChange,
        editTcpRecord,
        handleSaveUpdates,
        updateRecordsWithFlags,
      }}
    >
      <Box sx={{ pt: 2, px: 3 }}>
        {stepConfig.canRecalculate && (tcpRecords?.length || 0) > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="outlined"
              onClick={async () => {
                setIsRecalculating(true);
                try {
                  await recomputeFlags();
                  showAlert(
                    "Derived fields recalculated successfully.",
                    "success"
                  );
                } catch (err) {
                  console.error("Recalculation failed", err);
                  showAlert("Recalculation failed. Please try again.", "error");
                } finally {
                  setIsRecalculating(false);
                }
              }}
              disabled={isRecalculating}
            >
              {isRecalculating
                ? "Recalculating..."
                : "Recalculate Derived Fields"}
            </Button>
            <Typography
              variant="caption"
              sx={{ mt: 1, color: "text.secondary" }}
            >
              Last recalculated:{" "}
              {new Date(
                localStorage.getItem(`lastRecalc_${activePtrsId}`)
              ).toLocaleString()}
            </Typography>
          </Box>
        )}

        {/* Main content */}
        <Typography
          variant="subtitle1"
          sx={{ mb: 0.5, color: "text.secondary" }}
        >
          Step {currentStep + 1} of {steps.length}
        </Typography>
        <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
          {Array.isArray(tcpRecords)
            ? `${tcpRecords.length} record(s) loaded`
            : "0 records"}
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
          {typeof Component === "function" ? (
            Component === StepView ? (
              <StepView
                stepId={currentStep + 1}
                tcpRecords={tcpRecords}
                editTcpRecord={editTcpRecord}
                saveTcpUpdates={handleSaveUpdates}
                recomputeFlags={recomputeFlags}
              />
            ) : (
              <Component stepId={currentStep + 1} />
            )
          ) : (
            <Typography color="error">
              Unable to render step: invalid component
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button
            disabled={currentStep === 0}
            onClick={goToBack}
            variant="outlined"
          >
            Back
          </Button>
          {currentStep !== 2 && currentStep !== 5 && (
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
          )}
          <Button
            onClick={goToNext}
            variant="contained"
            color="primary"
            disabled={currentStep === steps.length}
          >
            {currentStep === steps.length - 1 ? "Finish" : "Next"}
          </Button>
        </Box>
      </Box>
    </PtrsContext.Provider>
  );
}
