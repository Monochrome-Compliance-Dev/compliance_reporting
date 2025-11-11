// Step	Route	Component	Description
// 1. Create run	/v2/ptrs/create	CreateRunPanel	User selects reporting period and uploads their main PTRS CSV.
// 2. Link tables	/v2/ptrs/tables	TablesAndJoinsPanel	User uploads/links supporting datasets (vendor master, entities, etc.).
// 3. Map columns	/v2/ptrs/map	MapPanel	User maps columns across joined tables to PTRS schema.
// 4. Stage data	/v2/ptrs/stage	StagePanel	Combined dataset preview before applying rules.
// 5. Apply rules	/v2/ptrs/rules	(future)	Transformations, exclusions, etc.
// 6. Validate	/v2/ptrs/validate	(future)	QA & error checks.
// 7. SBI check	/v2/ptrs/sbi	(future)	Extract/upload/return process for ABN small-business validation.
// 8. Metrics	/v2/ptrs/metrics	(future)	Payment time analytics.
// 9. Report	/v2/ptrs/report	(future)	Generate and export compliance report.

export const STEPS = [
  { id: "data", label: "Upload files" },
  { id: "tables", label: "Link tables" },
  { id: "map", label: "Map columns" },
  { id: "stage", label: "Stage data" },
  { id: "rules", label: "Apply rules" },
  { id: "validate", label: "Validate" },
  { id: "sbi", label: "SBI check" },
  { id: "metrics", label: "Metrics" },
  { id: "report", label: "Report" },
];
