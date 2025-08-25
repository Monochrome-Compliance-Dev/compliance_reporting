// src/features/pulse/engagements/EngagementWizard.js
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Stack,
  Paper,
  Button,
  Typography,
  Chip,
} from "@mui/material";
import { nanoid } from "nanoid";
import { usePulseContext } from "../../../context/PulseContext";
import { useAlert } from "../../../context";
import { pulseService } from "../../../services/pulse/pulse";
import EngagementContainerForm from "./EngagementContainerForm";
import EngagementAssignmentsEditor from "./EngagementAssignmentsEditor";
import BudgetBuilder from "../budgets/BudgetBuilder"; // embedded

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
        <Box mt={2} display="flex" justifyContent="flex-end">
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
  engagement,
  onBudgetSaved,
  onNext,
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
        <Box mt={2} display="flex" justifyContent="flex-end">
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
  onNext,
  canProceed,
}) {
  return (
    <Paper variant="outlined">
      <Box p={2}>
        <EngagementAssignmentsEditor
          engagementId={engagementId || ""}
          resources={resources}
          initialAssignments={engagement?.assignments || []}
          onSave={onAssignmentsSaved}
        />
        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button variant="text" onClick={onNext} disabled={!canProceed}>
            Next: Review
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

function ReviewStep({ engagement, onActivate, activating }) {
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
        <Box mt={2}>
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

export default function EngagementWizard() {
  const { clients, resources, engagements, upsertEngagement } =
    usePulseContext();
  const { showAlert } = useAlert();
  const [searchParams] = useSearchParams();
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

  // derive status gates
  const hasBudget =
    (engagement?.budgetItems?.length || 0) > 0 ||
    Number(engagement?.budgetAmount || 0) > 0;
  const hasAssignments = (engagement?.assignments?.length || 0) > 0;

  const [activeStep, setActiveStep] = useState(0);

  // initial step in edit mode
  useEffect(() => {
    if (!engagementId) return;
    if (!engagement) return;
    if (engagement.status === "active") setActiveStep(3);
    else if (hasAssignments) setActiveStep(2);
    else if (hasBudget) setActiveStep(1);
    else setActiveStep(0);
  }, [engagementId, engagement, hasBudget, hasAssignments]);

  // Step 1 save
  const saveDetails = async (values, isEdit) => {
    const payload = {
      id: isEdit ? engagement.id : nanoid(10),
      name: values.name,
      clientId: values.clientId,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      budgetHours: engagement?.budgetHours || 0,
      budgetAmount: engagement?.budgetAmount || 0,
      status: engagement?.status || "draft",
    };
    const saved = isEdit
      ? await pulseService.engagements.update(String(engagement.id), payload)
      : await pulseService.engagements.create(payload);
    upsertEngagement(saved);
    if (!isEdit) setEngagementId(saved.id);
    showAlert(isEdit ? "Changes saved" : "Engagement created", "success");
    setActiveStep(1);
  };

  // Step 3 save assignments
  const saveAssignments = async (assignments) => {
    const updated = { ...engagement, assignments, status: "ready" };
    const saved = await pulseService.engagements.update(
      String(engagement.id),
      updated
    );
    upsertEngagement(saved);
    showAlert("Assignments saved", "success");
    setActiveStep(3);
  };

  // Step 4 activate
  const activate = async () => {
    const updated = { ...engagement, status: "active" };
    const saved = await pulseService.engagements.update(
      String(engagement.id),
      updated
    );
    upsertEngagement(saved);
    showAlert("Engagement activated", "success");
    navigate("/pulse/engagements");
  };

  return (
    <Stack spacing={2}>
      <Paper variant="outlined">
        <Box p={2}>
          <Typography variant="h6">Engagement Wizard</Typography>
          {engagement && (
            <Typography variant="body2" color="text.secondary">
              {engagement.name} • Status{" "}
              <Chip size="small" label={engagement.status || "draft"} />
            </Typography>
          )}
          <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
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
          onBudgetSaved={() => {
            pulseService.engagements
              .update(String(engagementId), {
                ...engagement,
                status: "budgeted",
              })
              .then(upsertEngagement)
              .catch(() => {});
            setActiveStep(2);
          }}
          onNext={() => setActiveStep(2)}
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
          onNext={() => setActiveStep(3)}
          canProceed={hasAssignments}
        />
      )}

      {/* Step 4: Review */}
      {activeStep === 3 && (
        <ReviewStep engagement={engagement} onActivate={activate} />
      )}
    </Stack>
  );
}
