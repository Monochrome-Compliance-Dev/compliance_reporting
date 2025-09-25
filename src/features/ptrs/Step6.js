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
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CheckBox } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { tcpService } from "../../services/";

// --- helpers to coerce BE metrics to the FE shape we render ---
const num = (v) =>
  v === null || v === undefined || v === "" ? null : Number(v);
const pct = (count, total) => {
  const c = num(count);
  const t = num(total);
  if (c === null || t === null || !isFinite(c) || !isFinite(t) || t <= 0)
    return null;
  return (c / t) * 100;
};
const fmt2 = (v) => {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (!isFinite(n)) return "";
  return n.toFixed(2);
};

function normalizeMetrics(raw = {}) {
  // --- Totals (often strings from SQL) ---
  const totalInvoices =
    num(raw.total_invoices) ?? num(raw.totalInvoices) ?? num(raw.total) ?? null;

  // If the BE scopes to SB-only, it may also return a separate SB total
  const sbTotalPayments =
    num(raw.sb_total_payments) ?? num(raw.sbTotalPayments) ?? totalInvoices;

  // --- Core day metrics ---
  const averagePaymentTime =
    num(raw.avg_days) ?? num(raw.average_days) ?? num(raw.avgDays) ?? null;

  const medianPaymentTime =
    num(raw.median_days) ?? num(raw.median) ?? num(raw.medianDays) ?? null;

  const percentile80 =
    num(raw.p80_days) ?? num(raw.percentile80) ?? num(raw.p80) ?? null;

  const percentile95 =
    num(raw.p95_days) ?? num(raw.percentile95) ?? num(raw.p95) ?? null;

  // --- Payment term stats ---
  const mostCommonPaymentTerm =
    num(raw.mode_term) ?? num(raw.most_common_term) ?? null;

  const rangeMin = num(raw.term_min) ?? num(raw.range_min) ?? null;
  const rangeMax = num(raw.term_max) ?? num(raw.range_max) ?? null;

  // --- Buckets / within terms ---
  // Accept multiple naming variants from BE; prefer SB-scoped fields when present
  const withinTermsCount =
    num(raw.sb_within_terms_count) ??
    num(raw.count_within_terms) ??
    num(raw.within_terms_count) ??
    null;

  const leq20 = num(raw.count_leq_20) ?? null;
  const leq30 = num(raw.count_leq_30) ?? null;
  const btw21to30 = num(raw.count_21_30) ?? null;
  const btw31to60 = num(raw.count_31_60) ?? num(raw.count_31to60) ?? null;
  const over60 = num(raw.count_gt_60) ?? num(raw.count_over_60) ?? null;

  // Derive 30-day bucket if only 20 + 21-30 provided
  const derivedLeq30 =
    leq30 ?? (leq20 !== null && btw21to30 !== null ? leq20 + btw21to30 : null);

  // --- Percentages ---
  // Prefer pre-computed BE percentage if present, otherwise compute from counts
  const paidWithinTermsPercent =
    num(raw.pct_within_terms) ??
    (withinTermsCount !== null && sbTotalPayments
      ? (withinTermsCount / sbTotalPayments) * 100
      : null);

  const paidWithin30DaysPercent = pct(derivedLeq30, sbTotalPayments);
  const paid31To60DaysPercent = pct(btw31to60, sbTotalPayments);
  const paidOver60DaysPercent = pct(over60, sbTotalPayments);

  return {
    // Terms
    mostCommonPaymentTerm,
    rangeMin,
    rangeMax,
    expectedMostCommonPaymentTerm: null,
    expectedRangeMin: null,
    expectedRangeMax: null,

    // Times
    averagePaymentTime,
    medianPaymentTime,
    percentile80,
    percentile95,

    // Buckets
    paidWithinTermsPercent,
    paidWithin30DaysPercent,
    paid31To60DaysPercent,
    paidOver60DaysPercent,
  };
}

export default function Step6() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function fetchMetrics() {
      try {
        const ptrsId = localStorage.getItem("activePtrsId");
        if (!ptrsId) {
          if (!cancelled) {
            setLoading(false);
            setLoadError("No active PTRS ID found.");
          }
          return;
        }
        const res = await tcpService.recalculateMetrics(ptrsId);
        const raw = res?.data?.metrics ?? res?.metrics ?? {};
        // eslint-disable-next-line no-console
        console.log("[PTRS] Step6 recalc metrics response:", res);
        const m = normalizeMetrics(raw);
        if (!cancelled) {
          setMetrics(m || {});
          setLoading(false);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[PTRS] Step6 recalc metrics failed:", err);
        if (!cancelled) {
          setLoadError(err?.message || "Failed to load metrics");
          setLoading(false);
        }
      }
    }
    fetchMetrics();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2">Calculating metrics…</Typography>
      </Box>
    );
  }

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
          value:
            metrics?.mostCommonPaymentTerm != null
              ? Math.round(metrics.mostCommonPaymentTerm)
              : "",
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
          value: metrics?.rangeMin != null ? Math.round(metrics.rangeMin) : "",
          comment: "Calculated on an entity level and across the group.",
        },
        {
          label: "Range of most common payment terms - maximum",
          value: metrics?.rangeMax != null ? Math.round(metrics.rangeMax) : "",
          comment: "Calculated on an entity level and across the group.",
        },
        {
          label: "Expected most common payment term for next period (estimate)",
          value:
            metrics?.expectedMostCommonPaymentTerm != null
              ? Math.round(metrics.expectedMostCommonPaymentTerm)
              : "",
          comment:
            "This will be determined by in conjunction with you. Any further details can be provided in the 'Report Comments' field later in the report if required.",
        },
        {
          label:
            "Expected range of most common payment terms for next period - minimum (estimate)",
          value:
            metrics?.expectedRangeMin != null
              ? Math.round(metrics.expectedRangeMin)
              : "",
          comment:
            "This will be determined by in conjunction with you. Any further details can be provided in the 'Report Comments' field later in the report if required.",
        },
        {
          label:
            "Expected range of most common payment terms for next period - maximum (estimate)",
          value:
            metrics?.expectedRangeMax != null
              ? Math.round(metrics.expectedRangeMax)
              : "",
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
          value: fmt2(metrics?.averagePaymentTime),
          // comment:
          //   "Calculated using AVERAGE() on all values in the 'Payment Time' column of the Final Small Business TCP Dataset.",
        },
        {
          label: "Median payment time",
          value: fmt2(metrics?.medianPaymentTime),
          // comment:
          //   "Calculated using MEDIAN() on all values in the 'Payment Time' column.",
        },
        {
          label: "80th percentile payment time",
          value:
            metrics?.percentile80 != null
              ? String(Math.round(Number(metrics.percentile80)))
              : "",
          // comment:
          //   "Calculated using PERCENTILE.INC() on the 'Payment Time' column with 0.8 input; result must be a real data point.",
        },
        {
          label: "95th percentile payment time",
          value:
            metrics?.percentile95 != null
              ? String(Math.round(Number(metrics.percentile95)))
              : "",
          // comment:
          //   "Calculated using PERCENTILE.INC() on the 'Payment Time' column with 0.95 input; interpolation not permitted.",
        },
        {
          label:
            "Percentage of small business trade credit arrangements paid within payment terms",
          value: fmt2(metrics?.paidWithinTermsPercent),
          // comment:
          //   "Payments where Payment Time ≤ Payment Term ÷ Total Payments × 100.",
        },
        {
          label: "Invoices paid within 30 days (%)",
          value: fmt2(metrics?.paidWithin30DaysPercent),
          // comment: "Payments where Payment Time ≤ 30 ÷ Total Payments × 100.",
        },
        {
          label: "Invoices paid in 31-60 days (%)",
          value: fmt2(metrics?.paid31To60DaysPercent),
          // comment:
          //   "Payments where Payment Time is between 31 and 60 ÷ Total Payments × 100.",
        },
        {
          label: "Invoices paid over 60 days (%)",
          value: fmt2(metrics?.paidOver60DaysPercent),
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
      {loadError && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {loadError}
        </Typography>
      )}
      {!loadError && Object.keys(metrics || {}).length === 0 && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          No metrics were returned by the server. Check the console for the raw
          response.
        </Typography>
      )}
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
