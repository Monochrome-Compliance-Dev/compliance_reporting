import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { calculateFinalMetrics } from "../../lib/calculations/ptrs";
import { CheckBox } from "@mui/icons-material";
import { usePtrsContext } from "../../context";

export default function Step6() {
  const { records } = usePtrsContext();

  // Compute metrics from records if present, otherwise use empty/default
  const metrics = calculateFinalMetrics(records ?? []);

  const sections = [
    {
      title: "Declaration & Entity Details",
      fields: [
        {
          label:
            "I confirm the information in the Entity Information form is still true and correct.",
          value: "Checkbox",
          comment:
            "All reporting entities must ensure their entity information (provided to the Regulator in the Entity Information form) is accurate at the time of submitting a payment times report. Entity information can be updated via the Portal.",
        },
        {
          label: "Entity ABN",
          value: "82 663 593 093",
          comment:
            "Fields will be pre-populated based on entity's profile on the Portal.",
        },
        {
          label: "Entity ACN",
          value: "663 593 093",
          comment:
            "Fields will be pre-populated based on entity's profile on the Portal.",
        },
        {
          label: "Entity ARBN",
          value: "",
          comment:
            "Fields will be pre-populated based on entity's profile on the Portal.",
        },
      ],
    },
    {
      title: "Report Details",
      fields: [
        {
          label: "Report Period Start Date",
          value: "1 January 2025",
          comment:
            "The start date of the reporting period for which the report is being submitted.",
        },
        {
          label: "Report Period End Date",
          value: "30 June 2025",
          comment:
            "The end date of the reporting period for which the report is being submitted.",
        },
        {
          label: "Approving responsible member given name",
          value: "Reema",
          comment: "The first name of the person approving the report.",
        },
        {
          label: "Approving responsible member family name",
          value: "Shyamsukha",
          comment: "The last name of the person approving the report.",
        },
        {
          label: "Responsible member approval date",
          value: "15/07/2025",
          comment: "The date when the report was approved.",
        },
      ],
    },
    {
      title: "Payment Practices",
      fields: [
        {
          label:
            "Did the entity offer supply chain finance arrangements during the reporting period?",
          value: "",
          comment:
            "This will be determined by in conjunction with you. Any further details must be provided in the 'Report Comments' field later in the report.",
        },
        {
          label:
            "Did the entity charge fees as part of the procurement process?",
          value: "",
          comment:
            "This will be determined by in conjunction with you. Any further details must be provided in the 'Report Comments' field later in the report if required.",
        },
        {
          label:
            "Do any Australian laws, voluntary codes or agreements impose requirements on the entity's payment times and practices to small businesses?",
          value: "tbc",
          comment:
            "This will be determined by in conjunction with you. Any further details must be provided in the 'Report Comments' field later in the report.",
        },
      ],
    },
    {
      title: "Payment Terms",
      fields: [
        {
          label: "Most common payment term (statistical mode)",
          value: Math.round(metrics.mostCommonPaymentTerm), // Use the calculated metric
          comment:
            "This is the payment term that appears most frequently in the 'Payment Term' column in the Final Small Business TCP Dataset.",
        },
        {
          label: "Receivable terms compared to most common payment term",
          value: "",
          comment:
            "To be determined on review of all the policies for each entity.",
        },
        {
          label: "Range of most common payment terms - minimum",
          value: Math.round(metrics.rangeMin), // Use the calculated metric
          comment: "Calculated on an entity level and across the group.",
        },
        {
          label: "Range of most common payment terms - maximum",
          value: Math.round(metrics.rangeMax), // Use the calculated metric
          comment: "Calculated on an entity level and across the group.",
        },
        {
          label: "Expected most common payment term for next period (estimate)",
          value: Math.round(metrics.expectedMostCommonPaymentTerm), // Use the calculated metric
          comment:
            "This will be determined by in conjunction with you. Any further details can be provided in the 'Report Comments' field later in the report if required.",
        },
        {
          label:
            "Expected range of most common payment terms for next period - minimum (estimate)",
          value: Math.round(metrics.expectedRangeMin), // Use the calculated metric
          comment:
            "This will be determined by in conjunction with you. Any further details can be provided in the 'Report Comments' field later in the report if required.",
        },
        {
          label:
            "Expected range of most common payment terms for next period - maximum (estimate)",
          value: Math.round(metrics.expectedRangeMax), // Use the calculated metric
          comment:
            "This will be determined by in conjunction with you. Any further details can be provided in the 'Report Comments' field later in the report if required.",
        },
      ],
    },
    {
      title: "Payment Times",
      fields: [
        {
          label: "Average payment time",
          value:
            metrics.averagePaymentTime != null
              ? Math.round(metrics.averagePaymentTime)
              : "",
          // comment:
          //   "Calculated using AVERAGE() on all values in the 'Payment Time' column of the Final Small Business TCP Dataset.",
        },
        {
          label: "Median payment time",
          value: Math.round(metrics.medianPaymentTime), // Use the calculated metric
          // comment:
          //   "Calculated using MEDIAN() on all values in the 'Payment Time' column.",
        },
        {
          label: "80th percentile payment time",
          value: Math.round(metrics.percentile80), // Use the calculated metric
          // comment:
          //   "Calculated using PERCENTILE.INC() on the 'Payment Time' column with 0.8 input; result must be a real data point.",
        },
        {
          label: "95th percentile payment time",
          value: Math.round(metrics.percentile95), // Use the calculated metric
          // comment:
          //   "Calculated using PERCENTILE.INC() on the 'Payment Time' column with 0.95 input; interpolation not permitted.",
        },
        {
          label:
            "Percentage of small business trade credit arrangements paid within payment terms",
          value: Math.round(metrics.paidWithinTermsPercent), // Use the calculated metric
          // comment:
          //   "Payments where Payment Time ≤ Payment Term ÷ Total Payments × 100.",
        },
        {
          label: "Invoices paid within 30 days (%)",
          value: Math.round(metrics.paidWithin30DaysPercent), // Use the calculated metric
          // comment: "Payments where Payment Time ≤ 30 ÷ Total Payments × 100.",
        },
        {
          label: "Invoices paid in 31-60 days (%)",
          value: Math.round(metrics.paid31To60DaysPercent), // Use the calculated metric
          // comment:
          //   "Payments where Payment Time is between 31 and 60 ÷ Total Payments × 100.",
        },
        {
          label: "Invoices paid over 60 days (%)",
          value: Math.round(metrics.paidOver60DaysPercent), // Use the calculated metric
          // comment: "Payments where Payment Time > 60 ÷ Total Payments × 100.",
        },
      ],
    },
    {
      title: "Miscellaneous",
      fields: [
        {
          label:
            "Small business trade credit payments as a percentage of total trade credit payments",
          value: "",
          comment:
            "Total small business trade credit payment value ÷ Total trade credit payment value × 100.",
        },
        {
          label: "Percentage of Peppol enabled small business procurement",
          value: "",
          comment:
            "Payments marked 'Yes' in the 'Peppol invoice enabled' column ÷ Total Small Business TCP payments × 100, if applicable.",
        },
        {
          label: "Report comments",
          value: "To be determined.",
          comment:
            "Entities must provide additional details about material changes, controlled exclusions, or other important clarifications when Supply Chain Finance is reported.",
        },
      ],
    },
  ];

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        Step 6: Final Report Summary
      </Typography>
      {sections.map((section, sectionIndex) => (
        <Box sx={{ maxWidth: 1200, mx: "auto", mb: 2 }} key={sectionIndex}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{section.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} sx={{ marginBottom: 3 }}>
                <Table sx={{ tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ width: "33%", padding: 0, border: "none" }}
                      />
                      <TableCell
                        sx={{ width: "33%", padding: 0, border: "none" }}
                      />
                      <TableCell
                        sx={{ width: "34%", padding: 0, border: "none" }}
                      />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {section.fields.map((field, fieldIndex) => (
                      <TableRow key={fieldIndex}>
                        <TableCell sx={{ width: "33%" }}>
                          {field.label}
                        </TableCell>
                        <TableCell sx={{ width: "33%" }}>
                          {field.value === "Checkbox" ? (
                            <CheckBox checked={true} disabled />
                          ) : (
                            <TextField
                              variant="outlined"
                              size="small"
                              value={field.value ?? ""}
                              disabled
                              fullWidth
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ width: "34%" }}>
                          {field.comment}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Box>
      ))}
    </Box>
  );
}
