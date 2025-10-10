// src/features/pulse/trackables/TrackableWizard.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router";
import {
  Stepper,
  Step,
  StepButton,
  Box,
  Stack,
  Paper,
  Button,
  Typography,
  Chip,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useAlert, usePulseContext } from "context";
import TrackableContainerForm from "./TrackableContainerForm";
import TrackableAssignmentsEditor from "./TrackablesAssignmentEditor";
import BudgetBuilder from "../budgets/BudgetBuilder";
import {
  listTrackables,
  listAssignmentsByTrackable,
  listClients,
  listResources,
} from "../../services/pulseApi";
import { useTrackableOps } from "./useTrackableOps";

import React from "react";
function DetailsStep({
  trackable,
  clients,
  onSaved,
  onAdvance,
  config,
  step,
  onBack,
}) {
  const [hasChanges, setHasChanges] = React.useState(false);
  const [formValues, setFormValues] = React.useState(null);
  const formRef = React.useRef();

  // Helpers to compare current form vs initial values
  const normalizeVals = (v = {}) => ({
    name: (v?.name || "").trim(),
    clientId: String(v?.clientId || ""),
    startDate: v?.startDate || "",
    endDate: v?.endDate || "",
  });
  const isSame = (a, b) => {
    const A = normalizeVals(a);
    const B = normalizeVals(b);
    return (
      A.name === B.name &&
      A.clientId === B.clientId &&
      A.startDate === B.startDate &&
      A.endDate === B.endDate
    );
  };

  // Memoized initial values for the form
  const memoInitialValues = React.useMemo(() => {
    if (trackable) {
      return {
        name: trackable.name || "",
        clientId: String(trackable.clientId || ""),
        startDate: trackable.startDate || "",
        endDate: trackable.endDate || "",
      };
    }
    return { name: "", clientId: "", startDate: "", endDate: "" };
  }, [trackable]);

  // Called when form fields change
  const handleFormChange = (values) => {
    setFormValues(values);
    setHasChanges(!isSame(values, memoInitialValues));
  };

  // Effect to re-evaluate hasChanges whenever memoInitialValues changes
  React.useEffect(() => {
    const current = formRef.current?.getValues?.() || {};
    setHasChanges(!isSame(current, memoInitialValues));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoInitialValues]);

  // Save handler for "Save Changes" and "Next"
  const handleSubmitAndNext = async (values) => {
    try {
      const ok = await onSaved?.(values);
      if (ok) {
        setHasChanges(false);
        onAdvance?.();
      }
    } catch (e) {
      // Errors are surfaced by onSaved/showAlert; do not advance here
    }
  };

  // "Next" only saves if there are changes, else just advances
  const handleNext = async () => {
    if (!hasChanges) {
      // No changes to persist; advance immediately
      onAdvance?.();
      return;
    }
    const vals = formValues || formRef.current?.getValues?.() || {};
    await handleSubmitAndNext(vals);
  };

  // "Save Changes" only enabled if hasChanges
  const handleSaveChanges = async () => {
    const vals = formValues || formRef.current?.getValues?.() || {};
    await handleSubmitAndNext(vals);
  };

  return (
    <Paper variant="outlined">
      <Box p={2}>
        <TrackableContainerForm
          ref={formRef}
          mode={trackable ? "edit" : "create"}
          config={config}
          initialValues={memoInitialValues}
          clients={clients}
          onSubmit={handleSubmitAndNext}
          onChange={handleFormChange}
          onQuickAddClient={() => {}}
        />
        <Box
          mt={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          {/* Hide Back button on step 1; show otherwise */}
          {step !== 1 ? (
            <Button variant="text" onClick={onBack}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              onClick={handleSaveChanges}
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
            <Button variant="text" onClick={handleNext}>
              Next
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

function BudgetStep({
  trackableId,
  onBudgetSaved,
  onNext,
  onBack,
  canProceed,
}) {
  return (
    <Paper variant="outlined">
      <Box p={2}>
        {trackableId ? (
          <BudgetBuilder trackableId={trackableId} onSaved={onBudgetSaved} />
        ) : (
          <Typography color="text.secondary">
            Save details first to build the budget.
          </Typography>
        )}
        <Box mt={2} display="flex" justifyContent="space-between">
          <Button variant="text" onClick={onBack}>
            Back
          </Button>
          <Button variant="text" onClick={onNext} disabled={!canProceed}>
            Next: Resources
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

function ResourcesStep({
  trackableId,
  trackable,
  resources,
  onAssignmentsSaved,
  onCompleteAssignments,
  onNext,
  onBack,
  canProceed,
}) {
  // --- Budget/Planned Cost helpers
  const parseISO = (s) => {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const dayDiffInclusive = (a, b) => {
    if (!a || !b) return 0;
    const ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
    return ms < 0 ? 0 : Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  };
  const estimatePlannedCost = () => {
    if (!trackable) return { planned: 0, remaining: 0, budget: 0 };
    const budget = Number(trackable.budgetAmount || 0);
    const eStart = parseISO(trackable.startDate);
    const eEnd = parseISO(trackable.endDate);
    if (!Array.isArray(trackable.assignments) || !eStart || !eEnd)
      return { planned: 0, remaining: budget, budget };

    let planned = 0;
    trackable.assignments.forEach((a) => {
      const res = (resources || []).find(
        (r) => String(r.id) === String(a.resourceId)
      );
      const rate = Number(a.rateOverride ?? res?.hourlyRate ?? 0);
      const aStart = parseISO(a.startDate);
      const aEnd = parseISO(a.endDate);
      if (!aStart || !aEnd) return; // require dates for estimate
      const start = aStart > eStart ? aStart : eStart;
      const end = aEnd < eEnd ? aEnd : eEnd;
      const days = dayDiffInclusive(new Date(start), new Date(end));
      if (days <= 0) return;
      const hours = days * 8 * (Number(a.assignmentPct || 0) / 100);
      planned += hours * rate;
    });
    return { planned, remaining: budget - planned, budget };
  };
  const { planned, remaining } = estimatePlannedCost();

  return (
    <Paper variant="outlined">
      <Box p={2}>
        <Box mb={1} display="flex" justifyContent="flex-end" gap={1}>
          <Chip
            size="small"
            label={`Planned: $${planned.toFixed(2)}`}
            variant="outlined"
          />
          <Chip
            size="small"
            label={`Budget remaining: $${remaining.toFixed(2)}`}
            color={remaining < 0 ? "error" : "success"}
            variant={remaining < 0 ? "filled" : "outlined"}
          />
        </Box>
        <TrackableAssignmentsEditor
          trackableId={trackableId || ""}
          resources={resources}
          initialAssignments={trackable?.assignments || []}
          onSave={onAssignmentsSaved}
        />
        <Box
          mt={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Button variant="text" onClick={onBack}>
            Back
          </Button>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              onClick={onCompleteAssignments}
              disabled={!canProceed}
            >
              Complete assignments
            </Button>
            <Button variant="text" onClick={onNext} disabled={!canProceed}>
              Next: Review
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

function ReviewStep({ trackable, onActivate, onBack, activating }) {
  if (!trackable) return null;
  return (
    <Paper variant="outlined">
      <Box p={2}>
        <Typography variant="subtitle1">Review & Activate</Typography>
        <Typography variant="body2" color="text.secondary">
          Budget: {trackable.budgetHours || 0} hrs • $
          {trackable.budgetAmount || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Assignments: {(trackable.assignments || []).length}
        </Typography>
        <Box mt={2} display="flex" justifyContent="space-between">
          <Button variant="text" onClick={onBack}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={onActivate}
            disabled={trackable.status === "active" || activating}
          >
            {trackable.status === "active" ? "Active" : "Activate trackable"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

const steps = ["Details", "Budget", "Resources", "Review"];

const canEnterStep = (idx, { trackableId, hasBudget, hasAssignments }) => {
  switch (idx) {
    case 0:
      return true;
    case 1:
      return !!trackableId; // need created trackable to build budget
    case 2:
      return !!trackableId && !!hasBudget; // need budget before resources
    case 3:
      return !!trackableId && !!hasBudget && !!hasAssignments; // final review
    default:
      return false;
  }
};

export default function TrackableWizard() {
  const { config } = usePulseContext();

  const { data: rawTrackables } = useQuery({
    queryKey: ["pulse", "trackables"],
    queryFn: listTrackables,
  });
  const trackables = useMemo(
    () => (Array.isArray(rawTrackables) ? rawTrackables : []),
    [rawTrackables]
  );

  const { data: rawClients } = useQuery({
    queryKey: ["pulse", "clients"],
    queryFn: listClients,
  });
  const clients = Array.isArray(rawClients) ? rawClients : [];

  const { data: rawResources } = useQuery({
    queryKey: ["pulse", "resources"],
    queryFn: listResources,
  });
  const resources = Array.isArray(rawResources) ? rawResources : [];

  // Use shared ops hook
  const { saveDetails: saveDetailsOp, saveAssignments: saveAssignmentsOp } =
    useTrackableOps();

  // Local cache for assignments keyed by trackable id (since we removed context mutations)
  const [assignmentsByTrackable, setAssignmentsByTrackable] = useState({});
  const { showAlert } = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { id: paramId } = useParams();

  // selection (edit mode if ?id=...)
  const [trackableId, setTrackableId] = useState(
    searchParams.get("id") || null
  );
  // Prefer route param (:id) over query (?id=) for edit mode
  useEffect(() => {
    const fromParam = paramId ? String(paramId) : null;
    const fromQuery = searchParams.get("id") || null;
    const preferred = fromParam || fromQuery;
    if (preferred && preferred !== trackableId) {
      setTrackableId(preferred);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId, searchParams]);
  const trackable = useMemo(
    () => trackables.find((e) => String(e.id) === String(trackableId)) || null,
    [trackables, trackableId]
  );

  const loadedAssignmentsRef = useRef(new Set());

  const [activeStep, setActiveStep] = useState(0);

  // derive status gates
  const hasBudget = Number(trackable?.budgetAmount || 0) > 0;
  const hasAssignments =
    (assignmentsByTrackable[String(trackableId)] || []).length > 0;

  // initial step selection: prefer ?step= if valid, else derive from status/gates
  useEffect(() => {
    // Do not auto-derive if the user (or code) has already navigated away from step 0
    if (activeStep !== 0) return;
    if (!trackableId || !trackable) return;

    const gates = { trackableId, hasBudget, hasAssignments };
    const stepFromQuery = Number(searchParams.get("step"));
    const hasStepParam = !Number.isNaN(stepFromQuery);

    if (hasStepParam && canEnterStep(stepFromQuery, gates)) {
      setActiveStep(stepFromQuery);
      return;
    }

    if (trackable.status === "active" || trackable.status === "ready") {
      setActiveStep(3);
    } else if (hasAssignments) {
      setActiveStep(2);
    } else if (hasBudget) {
      setActiveStep(1);
    } else {
      setActiveStep(0);
    }
  }, [
    trackableId,
    trackable,
    hasBudget,
    hasAssignments,
    searchParams,
    activeStep,
  ]);

  useEffect(() => {
    if (!trackableId) return;
    const params = new URLSearchParams(searchParams);
    params.set("id", String(trackableId));
    params.set("step", String(activeStep));
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, trackableId]);

  // Load persisted assignments for this trackable and attach to context entity
  const loadAssignments = async (id) => {
    if (!id) return;
    try {
      const rows = await listAssignmentsByTrackable(String(id));
      setAssignmentsByTrackable((prev) => ({
        ...prev,
        [String(id)]: Array.isArray(rows) ? rows : [],
      }));
    } catch (e) {
      showAlert("Failed to load assignments", "error");
    }
  };

  // Load assignments only when entering the Resources step; prevent repeated loads
  useEffect(() => {
    if (!trackableId) return;
    if (activeStep !== 2) return; // Resources step only
    const key = String(trackableId);
    if (loadedAssignmentsRef.current.has(key)) return;
    loadedAssignmentsRef.current.add(key);
    loadAssignments(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackableId, activeStep]);

  useEffect(() => {
    if (!trackableId) return;
    const key = String(trackableId);
    loadedAssignmentsRef.current.delete(key);
    setAssignmentsByTrackable((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [trackableId]);

  // Step 1 save (delegated to shared ops, with normalization/validation/advance)
  const saveDetails = async (values, isEdit) => {
    const name = (values?.name || "").trim();
    const startDate = values?.startDate || null;
    const endDate = values?.endDate || null;

    // Optional select normalization: empty string should be omitted
    const clientId = values?.clientId ? String(values.clientId) : undefined;

    if (!name || !startDate || !endDate) {
      showAlert("Name, start and end date are required", "error");
      return false; // do not advance
    }

    try {
      const saved = await saveDetailsOp({
        values: {
          name,
          clientId,
          startDate,
          endDate,
        },
        selected: isEdit ? trackable : null,
      });

      if (!saved || !saved.id) {
        showAlert("Failed to save trackable", "error");
        return false; // do not advance
      }

      if (!isEdit) setTrackableId(saved.id);
      setActiveStep(1); // advance only on confirmed success
      return true;
    } catch (e) {
      showAlert("Failed to save trackable", "error");
      return false; // do not advance
    }
  };

  // Step 3 save assignments (delegated to shared ops)
  const saveAssignments = async (rows) => {
    try {
      const latest = await saveAssignmentsOp(String(trackable.id), rows);
      setAssignmentsByTrackable((prev) => ({
        ...prev,
        [String(trackable.id)]: latest,
      }));
      showAlert("Assignments saved", "success");
    } catch (e) {
      showAlert("Failed to save assignments", "error");
    }
  };

  // Step: Complete assignments (no API call, just step forward)
  const completeAssignments = async () => {
    setActiveStep(3);
  };

  // Step 4 activate (placeholder for now)
  const activate = async () => {
    showAlert("Trackable activated (mock)", "info");
    navigate("/v2/pulse/trackables");
  };

  return (
    <Stack spacing={2}>
      <Paper variant="outlined">
        <Box p={2}>
          <Typography variant="h6">Trackable Wizard</Typography>
          {trackable && (
            <Typography variant="body2" color="text.secondary" component="div">
              {trackable.name} • Status{" "}
              <Chip size="small" label={trackable.status || "draft"} />
            </Typography>
          )}
          <Stepper activeStep={activeStep} nonLinear sx={{ mt: 2 }}>
            {steps.map((label, idx) => {
              const allowed =
                canEnterStep(idx, {
                  trackableId,
                  hasBudget,
                  hasAssignments,
                }) || idx <= activeStep;
              return (
                <Step
                  key={label}
                  completed={idx < activeStep}
                  disabled={!allowed}
                >
                  <StepButton onClick={() => allowed && setActiveStep(idx)}>
                    {label}
                  </StepButton>
                </Step>
              );
            })}
          </Stepper>
        </Box>
      </Paper>

      {/* Step 1: Details */}
      {activeStep === 0 && (
        <DetailsStep
          trackable={trackable}
          clients={clients}
          config={config}
          step={1}
          onBack={() => {}}
          onSaved={async (vals) => saveDetails(vals, !!trackable)}
          onAdvance={() => setActiveStep(1)}
        />
      )}

      {/* Step 2: Budget (embed builder) */}
      {activeStep === 1 && (
        <BudgetStep
          trackableId={trackableId}
          trackable={trackable}
          onBudgetSaved={() => {
            setActiveStep(2);
          }}
          onNext={() => setActiveStep(2)}
          onBack={() => setActiveStep(0)}
          canProceed={hasBudget}
        />
      )}

      {/* Step 3: Resources */}
      {activeStep === 2 && (
        <ResourcesStep
          trackableId={trackableId}
          trackable={{
            ...trackable,
            assignments: assignmentsByTrackable[String(trackableId)] || [],
          }}
          resources={resources}
          onAssignmentsSaved={saveAssignments}
          onCompleteAssignments={completeAssignments}
          onNext={() => setActiveStep(3)}
          onBack={() => setActiveStep(1)}
          canProceed={hasAssignments}
        />
      )}

      {/* Step 4: Review */}
      {activeStep === 3 && (
        <ReviewStep
          trackable={trackable}
          onActivate={activate}
          onBack={() => setActiveStep(2)}
        />
      )}
    </Stack>
  );
}
