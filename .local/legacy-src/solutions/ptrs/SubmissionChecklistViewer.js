import { Box, Typography, List, ListItem, ListItemText } from "@mui/material";

// Submission Checklist – A step-by-step guide to double-check your data before submitting

const submissionChecklist = [
  {
    step: 1,
    title: "Verify Entity Details",
    description:
      "Ensure the reporting entity's ABN, name, and reporting period are correctly entered and consistent throughout the file.",
  },
  {
    step: 2,
    title: "Confirm Required Fields",
    description:
      "Check that all mandatory fields are filled — including payer and payee ABNs, invoice issue and payment dates, payment amount, and contract or PO reference where relevant.",
  },
  {
    step: 3,
    title: "Check Date Formats and Consistency",
    description:
      "Make sure all dates follow the YYYY-MM-DD format and are chronologically correct (e.g. payment date is not before invoice date).",
  },
  {
    step: 4,
    title: "Ensure Amount Accuracy",
    description:
      "Review payment amounts for rounding or formatting errors. Ensure values reflect the correct currency and are whole numbers if required.",
  },
  {
    step: 5,
    title: "Validate CSV Structure",
    description:
      "Ensure the file uses the correct headers from the official template and there are no missing columns or extra line breaks.",
  },
  {
    step: 6,
    title: "Use the SBI Tool",
    description:
      "Export ABNs and run them through the Small Business Identification tool. Re-import results and confirm small business flags have been updated.",
  },
  {
    step: 7,
    title: "Preview and Validate",
    description:
      "Use the platform’s preview mode to validate your data and review summary stats. Fix any flagged errors before proceeding.",
  },
  {
    step: 8,
    title: "Final Review",
    description:
      "Do a last sweep of all fields, cross-check against your source data, and confirm you’re submitting the correct version of your report.",
  },
];

export default submissionChecklist;

const SubmissionChecklistViewer = () => {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", my: 4 }}>
      <Typography variant="h4" gutterBottom>
        Submission Checklist
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        A step-by-step guide to double-check your data before submitting.
      </Typography>
      <List>
        {submissionChecklist.map((item) => (
          <ListItem key={item.step} alignItems="flex-start" sx={{ mb: 2 }}>
            <ListItemText
              primary={
                <Typography variant="h6">
                  {item.step}. {item.title}
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export { SubmissionChecklistViewer };
