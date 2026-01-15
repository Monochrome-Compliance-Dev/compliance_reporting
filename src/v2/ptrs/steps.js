// Step	Route	Component	Description
// 1. Create run	/v2/ptrs/create	CreateRunPanel	User selects reporting period and uploads their main Transactions dataset (CSV) or imports it from Xero.
// 2. Link tables	/v2/ptrs/tables	TablesAndJoinsPanel	User uploads/links supporting datasets (vendor master, entities, etc.).
// 3. Map columns	/v2/ptrs/map	MapPanel	User maps columns across joined tables to PTRS schema.
// 4. Stage data	/v2/ptrs/stage	StagePanel	Combined dataset preview before applying rules.
// 5. Apply rules	/v2/ptrs/rules	(future)	Transformations, exclusions, etc.
// 6. SBI check	/v2/ptrs/sbi	(future)	Extract/upload/return process for ABN small-business validation.
// 7. Validate	/v2/ptrs/validate	(future)	QA & error checks.
// 8. Metrics	/v2/ptrs/metrics	(future)	Payment time analytics.
// 9. Report	/v2/ptrs/report	(future)	Generate and export compliance report.

export const STEPS = [
  { id: "data", label: "Upload files", order: 1 },
  { id: "tables", label: "Link tables", order: 2 },
  { id: "map", label: "Map columns", order: 3 },
  { id: "stage", label: "Stage data", order: 4 },
  { id: "rules", label: "Apply rules", order: 5 },
  { id: "sbi", label: "SBI check", order: 6 },
  { id: "validate", label: "Validate", order: 7 },
  { id: "metrics", label: "Metrics", order: 8 },
  { id: "report", label: "Report", order: 9 },
];

export function getStepById(id) {
  return STEPS.find((s) => s.id === id) || null;
}

export function getNextStepId(currentStepId) {
  if (!currentStepId) {
    return STEPS[0]?.id ?? null;
  }
  const idx = STEPS.findIndex((s) => s.id === currentStepId);
  if (idx === -1) {
    return STEPS[0]?.id ?? null;
  }
  const next = STEPS[idx + 1];
  return next ? next.id : null;
}
