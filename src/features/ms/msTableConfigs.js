export const trainingFields = [
  {
    key: "employeeName",
    label: "Employee Name",
    editable: true,
    inputType: "text",
    required: true,
  },
  {
    key: "department",
    label: "Department",
    editable: true,
    inputType: "text",
    required: true,
  },
  {
    key: "completed",
    label: "Training Completed",
    editable: true,
    inputType: "checkbox",
  },
  {
    key: "completedAt",
    label: "Date Completed",
    editable: true,
    inputType: "date",
  },
];

export const supplierRiskFields = [
  {
    key: "name",
    label: "Supplier Name",
    editable: true,
    inputType: "text",
  },
  {
    key: "country",
    label: "Country",
    editable: true,
    inputType: "text",
  },
  {
    key: "risk",
    label: "Risk Level",
    editable: true,
    inputType: "select",
    options: ["Low", "Medium", "High"],
  },
  {
    key: "reviewed",
    label: "Last Reviewed",
    editable: true,
    inputType: "date",
  },
];

export const grievanceFields = [
  {
    key: "description",
    label: "Description",
    editable: true,
    inputType: "text",
  },
  {
    key: "status",
    label: "Status",
    editable: true,
    inputType: "select",
    options: ["Open", "In Progress", "Resolved", "Closed"],
  },
  {
    key: "reportedAt",
    label: "Date Reported",
    editable: true,
    inputType: "date",
  },
];
