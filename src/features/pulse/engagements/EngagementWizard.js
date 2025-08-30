// src/features/pulse/engagements/EngagementWizard.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
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
import { usePulseContext } from "../../../context/PulseContext";
import { useAlert } from "../../../context";
import { pulseService } from "../../../services/pulse/pulse";
import EngagementContainerForm from "./EngagementContainerForm";
import EngagementAssignmentsEditor from "./EngagementAssignmentsEditor";
import BudgetBuilder from "../budgets/BudgetBuilder"; // embedded
import { userService } from "../../../services";

const unwrap = (res) =>
  res && typeof res === "object" && "data" in res ? res.data : res;

function DetailsStep({ engagement, clients, onSaved, onNext, canProceed }) {
  return (
    <Paper variant="outlined">
      <Box p={2}>
        <EngagementContainerForm
          mode={engagement ? "edit" : "create"}
          initialValues={
            engagement
              ? {
                  name: engagement.name || "",
                  clientId: String(engagement.clientId || ""),
                  startDate: engagement.startDate || "",
                  endDate: engagement.endDate || "",
                }
              : {
                  name: "",
                  clientId: "",
                  startDate: "",
                  endDate: "",
                }
          }
          clients={clients}
          onSubmit={onSaved}
          onQuickAddClient={() => {}}
        />
        <Box mt={2} display="flex" justifyContent="space-between">
          <Button variant="text" disabled>
            Back
          </Button>
          <Button variant="text" onClick={onNext} disabled={!canProceed}>
            Next: Budget
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

function BudgetStep({
  engagementId,
  onBudgetSaved,
  onNext,
  onBack,
  canProceed,
}) {
  return (
    <Paper variant="outlined">
      <Box p={2}>
        {engagementId ? (
          <BudgetBuilder engagementId={engagementId} onSaved={onBudgetSaved} />
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
  engagementId,
  engagement,
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
    if (!engagement) return { planned: 0, remaining: 0, budget: 0 };
    const budget = Number(engagement.budgetAmount || 0);
    const eStart = parseISO(engagement.startDate);
    const eEnd = parseISO(engagement.endDate);
    if (!Array.isArray(engagement.assignments) || !eStart || !eEnd)
      return { planned: 0, remaining: budget, budget };

    let planned = 0;
    engagement.assignments.forEach((a) => {
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
      const hours = days * 8 * (Number(a.allocationPct || 0) / 100);
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
        <EngagementAssignmentsEditor
          engagementId={engagementId || ""}
          resources={resources}
          initialAssignments={engagement?.assignments || []}
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

function ReviewStep({ engagement, onActivate, onBack, activating }) {
  if (!engagement) return null;
  return (
    <Paper variant="outlined">
      <Box p={2}>
        <Typography variant="subtitle1">Review & Activate</Typography>
        <Typography variant="body2" color="text.secondary">
          Budget: {engagement.budgetHours || 0} hrs • $
          {engagement.budgetAmount || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Assignments: {(engagement.assignments || []).length}
        </Typography>
        <Box mt={2} display="flex" justifyContent="space-between">
          <Button variant="text" onClick={onBack}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={onActivate}
            disabled={engagement.status === "active" || activating}
          >
            {engagement.status === "active" ? "Active" : "Activate engagement"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

const steps = ["Details", "Budget", "Resources", "Review"];

const canEnterStep = (idx, { engagementId, hasBudget, hasAssignments }) => {
  switch (idx) {
    case 0:
      return true;
    case 1:
      return !!engagementId; // need created engagement to build budget
    case 2:
      return !!engagementId && !!hasBudget; // need budget before resources
    case 3:
      return !!engagementId && !!hasBudget && !!hasAssignments; // final review
    default:
      return false;
  }
};

export default function EngagementWizard() {
  const { clients, resources, engagements, upsertEngagement } =
    usePulseContext();
  const { showAlert } = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // selection (edit mode if ?id=...)
  const [engagementId, setEngagementId] = useState(
    searchParams.get("id") || null
  );
  const engagement = useMemo(
    () =>
      engagements.find((e) => String(e.id) === String(engagementId)) || null,
    [engagements, engagementId]
  );

  const loadedAssignmentsRef = useRef(new Set());

  const [activeStep, setActiveStep] = useState(0);

  // Helper: Refresh budget items for current engagement and push to context
  const refreshBudgetSnapshot = async (id) => {
    if (!id) return;
    try {
      const res = await pulseService.budgetItems.listByEngagement(String(id));
      const items = unwrap(res) || [];
      const current = engagements.find((e) => String(e.id) === String(id)) || {
        id,
      };
      upsertEngagement({ ...current, budgetItems: items });
    } catch (e) {
      // ignore; button state will remain based on existing context
    }
  };
  // Refresh budget snapshot when entering Budget step or engagement changes
  useEffect(() => {
    if (!engagementId) return;
    if (activeStep !== 1) return; // only when viewing Budget step
    refreshBudgetSnapshot(engagementId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId, activeStep]);

  // derive status gates
  const hasBudget =
    (engagement?.budgetItems?.length || 0) > 0 ||
    Number(engagement?.budgetAmount || 0) > 0;
  const hasAssignments = (engagement?.assignments?.length || 0) > 0;

  // initial step selection: prefer ?step= if valid, else derive from status/gates
  useEffect(() => {
    if (!engagementId || !engagement) return;

    const gates = { engagementId, hasBudget, hasAssignments };
    const stepFromQuery = Number(searchParams.get("step"));
    const hasStepParam = !Number.isNaN(stepFromQuery);

    if (hasStepParam && canEnterStep(stepFromQuery, gates)) {
      setActiveStep(stepFromQuery);
      return;
    }

    if (engagement.status === "active" || engagement.status === "ready") {
      setActiveStep(3);
    } else if (hasAssignments) {
      setActiveStep(2);
    } else if (hasBudget) {
      setActiveStep(1);
    } else {
      setActiveStep(0);
    }
  }, [engagementId, engagement, hasBudget, hasAssignments, searchParams]);

  useEffect(() => {
    if (!engagementId) return;
    const params = new URLSearchParams(searchParams);
    params.set("id", String(engagementId));
    params.set("step", String(activeStep));
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, engagementId]);

  // Load persisted assignments for this engagement and attach to context entity
  const loadAssignments = async (id) => {
    if (!id) return;
    try {
      const res = await pulseService.assignments.listByEngagement(String(id));
      const rows = unwrap(res) || [];
      // derive current entity from context to avoid identity churn
      const current = engagements.find((e) => String(e.id) === String(id)) || {
        id,
      };
      upsertEngagement({ ...current, assignments: rows });
    } catch (e) {
      showAlert("Failed to load assignments", "error");
    }
  };

  // Load assignments only when entering the Resources step; prevent repeated loads
  useEffect(() => {
    if (!engagementId) return;
    if (activeStep !== 2) return; // Resources step only
    const key = String(engagementId);
    if (loadedAssignmentsRef.current.has(key)) return;
    loadedAssignmentsRef.current.add(key);
    loadAssignments(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId, activeStep]);

  useEffect(() => {
    if (!engagementId) return;
    const key = String(engagementId);
    loadedAssignmentsRef.current.delete(key);
  }, [engagementId]);

  // Step 1 save
  const saveDetails = async (values, isEdit) => {
    // --- Required fields gate for Step 1 ---
    const reqName = (values?.name || "").trim();
    const reqClientId = (values?.clientId || "").toString().trim();
    const reqStart = (values?.startDate || "").toString().trim();
    const reqEnd = (values?.endDate || "").toString().trim();
    if (!reqName || !reqClientId || !reqStart || !reqEnd) {
      showAlert(
        "Please fill in all required fields: Name, Client, Start Date, End Date.",
        "error"
      );
      return;
    }
    let payload = {
      name: values.name,
      clientId: values.clientId,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      budgetHours: engagement?.budgetHours || 0,
      budgetAmount: engagement?.budgetAmount || 0,
      status: engagement?.status || "draft",
      customerId: userService.userValue.customerId,
    };
    const saved = isEdit
      ? await pulseService.engagements.update(String(engagement.id), {
          ...payload,
          updatedBy: userService.userValue.id,
        })
      : await pulseService.engagements.create({
          ...payload,
          createdBy: userService.userValue.id,
        });

    const entity = unwrap(saved);
    upsertEngagement(entity);
    if (!isEdit && entity?.id) setEngagementId(entity.id);
    showAlert(isEdit ? "Changes saved" : "Engagement created", "success");
    setActiveStep(1);
  };

  // Step 3 save assignments (persist to /assignments) — no status change here
  const saveAssignments = async (rows) => {
    try {
      // server truth
      const serverRaw = await pulseService.assignments.listByEngagement(
        String(engagement.id)
      );
      const server = unwrap(serverRaw) || [];
      const serverIds = new Set(server.map((a) => String(a.id)));

      const ui = Array.isArray(rows) ? rows : [];
      const toCreate = ui.filter((r) => !r?.id);
      const toUpdate = ui.filter((r) => !!r?.id && serverIds.has(String(r.id)));
      const toDelete = server.filter(
        (s) => !ui.find((r) => String(r?.id || "") === String(s.id))
      );

      // CREATE: full payloads from editor
      const createResults = await Promise.allSettled(
        toCreate.map((row) => pulseService.assignments.create(row))
      );
      const createErr = createResults.find((r) => r.status === "rejected");
      if (createErr)
        throw createErr.reason || new Error("Failed to create assignments");

      // UPDATE: diff-only; strip id from body
      const updateResults = await Promise.allSettled(
        toUpdate.map((row) => {
          const { id, ...body } = row;
          return pulseService.assignments.patch(String(id), body);
        })
      );
      const updateErr = updateResults.find((r) => r.status === "rejected");
      if (updateErr)
        throw updateErr.reason || new Error("Failed to update assignments");

      // DELETE: any server rows not present in UI
      const deleteResults = await Promise.allSettled(
        toDelete.map((row) => pulseService.assignments.delete(String(row.id)))
      );
      const deleteErr = deleteResults.find((r) => r.status === "rejected");
      if (deleteErr)
        throw deleteErr.reason || new Error("Failed to delete assignments");

      // Refresh assignments in context
      const refreshed = await pulseService.assignments.listByEngagement(
        String(engagement.id)
      );
      const latest = unwrap(refreshed) || [];
      const existing = Array.isArray(engagement.assignments)
        ? engagement.assignments
        : [];
      const merged = latest && latest.length > 0 ? latest : existing;
      upsertEngagement({ ...engagement, assignments: merged });

      showAlert("Assignments saved", "success");
    } catch (err) {
      showAlert("Failed to save assignments", "error");
    }
  };

  const completeAssignments = async () => {
    try {
      const saved = await pulseService.engagements.patch(
        String(engagement.id),
        {
          status: "ready",
          updatedBy: userService.userValue.id,
          customerId: userService.userValue.customerId,
        }
      );
      const entity = unwrap(saved);
      upsertEngagement(entity);
      showAlert("Assignments completed", "success");
      setActiveStep(3);
    } catch (e) {
      showAlert("Failed to complete assignments", "error");
    }
  };

  // Step 4 activate
  const activate = async () => {
    const saved = await pulseService.engagements.patch(String(engagement.id), {
      status: "active",
      updatedBy: userService.userValue.id,
      customerId: userService.userValue.customerId,
    });
    upsertEngagement(saved);
    showAlert("Engagement activated", "success");
    navigate("/pulse-solution/engagements");
  };

  return (
    <Stack spacing={2}>
      <Paper variant="outlined">
        <Box p={2}>
          <Typography variant="h6">Engagement Wizard</Typography>
          {engagement && (
            <Typography variant="body2" color="text.secondary" component="div">
              {engagement.name} • Status{" "}
              <Chip size="small" label={engagement.status || "draft"} />
            </Typography>
          )}
          <Stepper activeStep={activeStep} nonLinear sx={{ mt: 2 }}>
            {steps.map((label, idx) => {
              const allowed =
                canEnterStep(idx, {
                  engagementId,
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
          engagement={engagement}
          clients={clients}
          onSaved={(vals) => saveDetails(vals, !!engagement)}
          onNext={() => setActiveStep(1)}
          canProceed={!!engagementId}
        />
      )}

      {/* Step 2: Budget (embed builder) */}
      {activeStep === 1 && (
        <BudgetStep
          engagementId={engagementId}
          engagement={engagement}
          onBudgetSaved={async () => {
            await refreshBudgetSnapshot(engagementId);
            try {
              const saved = await pulseService.engagements.patch(
                String(engagementId),
                {
                  status: "budgeted",
                  updatedBy: userService.userValue.id,
                  customerId: userService.userValue.customerId,
                }
              );
              upsertEngagement(saved);
            } catch (e) {
              // ignore patch error for navigation; user can retry later
            }
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
          engagementId={engagementId}
          engagement={engagement}
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
          engagement={engagement}
          onActivate={activate}
          onBack={() => setActiveStep(2)}
        />
      )}
    </Stack>
  );
}
