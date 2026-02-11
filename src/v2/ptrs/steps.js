// Step	Route	Component	Description
// 1. Create run	/v2/ptrs/create	CreateRunPanel	User selects reporting period and uploads their main Transactions dataset (CSV) or imports it from Xero.
// 2. Link tables	/v2/ptrs/tables	TablesAndJoinsPanel	User uploads/links supporting datasets (vendor master, entities, etc.).
// 3. Map columns	/v2/ptrs/map	MapPanel	User maps columns across joined tables to PTRS schema.
// 4. Stage data	/v2/ptrs/stage	StagePanel	Combined dataset preview before applying rules.
// 5. Exclusions	/v2/ptrs/exclusions	Eligibility checks & deterministic exclusions (e.g. intra-company, gov, employees).
// 6. Apply rules	/v2/ptrs/rules	Transformations/adjustments applied to eligible records.
// 7. SBI check	/v2/ptrs/sbi	Extract/upload/return process for ABN small-business validation.
// 8. Validate	/v2/ptrs/validate	QA & error checks.
// 9. Metrics	/v2/ptrs/metrics	Payment time analytics.
// 10. Report	/v2/ptrs/report	Generate and web version of the report.
// 11. Board pack	/v2/ptrs/pack	Generate pdf of metrics and report (plus cover sheet).

export const STEPS = [
  { id: "data", label: "Upload files", order: 1 },
  { id: "tables", label: "Link tables", order: 2 },
  { id: "map", label: "Map columns", order: 3 },
  { id: "stage", label: "Stage data", order: 4 },
  { id: "exclusions", label: "Exclusions", order: 5 },
  { id: "rules", label: "Apply rules", order: 6 },
  { id: "sbi", label: "SBI check", order: 7 },
  { id: "validate", label: "Validate", order: 8 },
  { id: "metrics", label: "Metrics", order: 9 },
  { id: "report", label: "Report", order: 10 },
  { id: "pack", label: "Board Pack", order: 11 },
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
