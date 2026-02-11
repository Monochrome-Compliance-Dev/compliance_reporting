import {
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import PrintIcon from "@mui/icons-material/Print";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { useAlert } from "context";
import { LoadingSpinner } from "components/ui/";
import { usePtrsV2Context } from "v2/ptrs/context/PtrsV2Context";
import {
  usePtrsReportSummary,
  useUpdatePtrsMutation,
} from "../hooks/usePtrsQueries";

export default function ReportPanel() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const { ptrsId: ctxPtrsId, profileId: ctxProfileId } = usePtrsV2Context();
  const ptrsId = ctxPtrsId || "";
  const profileId = ctxProfileId || null;

  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  const reportQ = usePtrsReportSummary(ptrsId);
  const snapshot = reportQ.data;
  const metrics = snapshot?.metrics || null;
  const ptrs = snapshot?.ptrs || null;

  const reportingEntityName =
    ptrs?.reportingEntityName ||
    ptrs?.entityName ||
    ptrs?.legalName ||
    ptrs?.name ||
    ptrs?.label ||
    "—";

  const reportId = metrics?.header?.reportId || "—";
  const basedOnRowCount = metrics?.quality?.basedOnRowCount || 0;

  const getByPath = (obj, path) => {
    if (!obj || !path) return undefined;
    return path.split(".").reduce((acc, key) => {
      if (acc === null || acc === undefined) return undefined;
      return acc[key];
    }, obj);
  };

  const formatDateAU = (iso) => {
    if (typeof iso !== "string") return iso;
    // YYYY-MM-DD
    const m = iso.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
    if (!m) return iso;
    const [, yyyy, mm, dd] = m;
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatValue = (v, format) => {
    if (v === null || v === undefined || v === "") return "—";

    if (format === "date") {
      return formatDateAU(v);
    }

    // Auto-format ISO dates even when not explicitly tagged
    if (typeof v === "string") {
      const maybeDate = formatDateAU(v);
      if (maybeDate !== v) return maybeDate;
    }

    if (format === "yesno") {
      if (typeof v === "boolean") return v ? "Yes" : "No";
      return String(v);
    }

    if (format === "number0") {
      if (typeof v === "number" && Number.isFinite(v))
        return `${Math.round(v)}`;
      return String(v);
    }

    if (format === "number2") {
      if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(2);
      return String(v);
    }

    // Workbook shows % fields as raw numeric (e.g. 64.52) with (%) in the label
    if (format === "percent") {
      if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(2);
      return String(v);
    }

    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (typeof v === "number")
      return Number.isFinite(v) ? v.toLocaleString() : String(v);
    if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  // Read-only mapping of portal fields -> values derived from the metrics snapshot.
  // IMPORTANT: This is intentionally conservative. If a field is missing, we show "—".
  // Once we confirm the exact metrics output shape, we tighten these paths.
  const regulatorMapping = [
    {
      section: "Declaration & Entity Details",
      fields: [
        {
          label:
            "I confirm the information in the Entity Information form is still true and correct.",
          path: "metrics.header.entityInfoConfirmed",
          format: "yesno",
        },
        { label: "Entity name", path: "metrics.header.businessName" },
        { label: "Entity ABN", path: "metrics.header.abn" },
        { label: "Entity ACN", path: "metrics.header.acn" },
        { label: "Entity ARBN", path: "metrics.header.arbn" },
      ],
    },
    {
      section: "Report Details",
      fields: [
        {
          label: "Reporting period start date",
          path: "metrics.header.reportingPeriodStartDate",
        },
        {
          label: "Reporting period end date",
          path: "metrics.header.reportingPeriodEndDate",
        },
        {
          label: "Approving responsible member given name",
          path: "metrics.declarations.approvingResponsibleMemberGivenName",
        },
        {
          label: "Approving responsible member family name",
          path: "metrics.declarations.approvingResponsibleMemberFamilyName",
        },
        {
          label: "Responsible member approval date",
          path: "metrics.declarations.responsibleMemberApprovalDate",
        },
      ],
    },
    {
      section: "Payment Practices",
      fields: [
        {
          label:
            "Did the entity offer supply chain finance arrangements during the reporting period?",
          path: "metrics.declarations.supplyChainFinanceOffered",
          format: "yesno",
        },
        {
          label:
            "Did the entity charge fees as part of the procurement process?",
          path: "metrics.declarations.procurementFeesCharged",
          format: "yesno",
        },
        {
          label:
            "Do any Australian laws, voluntary codes or agreements impose requirements on the entity's payment times and practices to small businesses?",
          path: "metrics.declarations.smallBusinessPaymentObligations",
          format: "yesno",
        },
      ],
    },
    {
      section: "Payment Terms",
      fields: [
        {
          label: "Most common payment term (statistical mode)",
          path: "metrics.computed.commonPaymentTermsDays",
          format: "number0",
        },
        {
          label: "Receivable terms compared to most common payment term",
          path: "metrics.computed.receivableTermsComparedToCommonPaymentTerm",
        },
        {
          label: "Range of most common payment terms - minimum",
          path: "metrics.computed.commonPaymentTermMinimum",
          format: "number0",
        },
        {
          label: "Range of most common payment terms - maximum",
          path: "metrics.computed.commonPaymentTermMaximum",
          format: "number0",
        },
        {
          label: "Expected most common payment term for next period (estimate)",
          path: "metrics.computed.forecastPaymentTerm",
          format: "number0",
        },
        {
          label:
            "Expected range of most common payment terms for next period - minimum (estimate)",
          path: "metrics.computed.forecastMinimumPaymentTerm",
          format: "number0",
        },
        {
          label:
            "Expected range of most common payment terms for next period - maximum (estimate)",
          path: "metrics.computed.forecastMaximumPaymentTerm",
          format: "number0",
        },
      ],
    },
    {
      section: "Payment Times",
      fields: [
        {
          label: "Average payment time",
          path: "metrics.computed.averagePaymentTimeDays",
          format: "number2",
        },
        {
          label: "Median payment time",
          path: "metrics.computed.medianPaymentTimeDays",
          format: "number2",
        },
        {
          label: "80th percentile payment time",
          path: "metrics.computed.p80PaymentTimeDays",
          format: "number0",
        },
        {
          label: "95th percentile payment time",
          path: "metrics.computed.p95PaymentTimeDays",
          format: "number0",
        },
        {
          label:
            "Percentage of small business trade credit arrangements paid within payment terms",
          path: "metrics.computed.percentageOfSbInvoicesPaidWithinPaymentTerm",
          format: "percent",
        },
        {
          label: "Invoices paid within 30 days (%)",
          path: "metrics.computed.payments30DaysOrLessPct",
          format: "percent",
        },
        {
          label: "Invoices paid in 31-60 days (%)",
          path: "metrics.computed.payments31To60DaysPct",
          format: "percent",
        },
        {
          label: "Invoices paid over 60 days (%)",
          path: "metrics.computed.paymentsMoreThan60DaysPct",
          format: "percent",
        },
      ],
    },
    {
      section: "Miscellaneous",
      fields: [
        {
          label:
            "Small business trade credit payments as a percentage of total trade credit payments",
          path: "metrics.computed.percentageOfSmallBusinessTradeCreditPayments",
          format: "percent",
        },
        {
          label: "Percentage of Peppol enabled small business procurement",
          path: "metrics.computed.percentagePeppolEnabledSmallBusinessProcurement",
          format: "percent",
        },
        {
          label: "Report comments",
          path: "metrics.declarations.reportComments",
        },
        {
          label: "Description of changes",
          path: "metrics.declarations.descriptionOfChanges",
        },
      ],
    },
  ];

  const regulatorRows = useMemo(() => {
    const root = { ptrs, metrics };

    const missingRequiredSet = new Set(
      (metrics?.quality?.missingInputs || []).map((x) => x.field),
    );

    const isMissingRequired = (fieldPath, value) => {
      if (value !== undefined && value !== null && value !== "") return false;
      if (!fieldPath) return false;
      // missingInputs uses paths like declarations.supplyChainFinanceOffered
      const normalised = fieldPath.startsWith("metrics.")
        ? fieldPath.replace(/^metrics\./, "")
        : fieldPath;
      return missingRequiredSet.has(normalised);
    };

    const resolveValue = (field) => {
      const primary = getByPath(root, field.path);
      if (primary !== undefined && primary !== null && primary !== "")
        return primary;

      const fallbacks = field.fallbackPaths || [];
      for (const fp of fallbacks) {
        const v = getByPath(root, fp);
        if (v !== undefined && v !== null && v !== "") return v;
      }
      return undefined;
    };

    const rows = [];
    for (const section of regulatorMapping) {
      for (const field of section.fields) {
        const resolved = resolveValue(field);
        rows.push({
          section: section.section,
          label: field.label,
          value: resolved,
          format: field.format || null,
          source: field.path,
          required: isMissingRequired(field.path, resolved),
        });
      }
    }
    return rows;
  }, [metrics, ptrs]);

  const [isManualBusy, setIsManualBusy] = useState(false);
  const isBusy =
    updatePtrsStep.isPending || isManualBusy || reportQ.status === "loading";

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (ptrsId) p.set("ptrsId", ptrsId);
    if (profileId) p.set("profileId", profileId);
    return p.toString();
  }, [ptrsId, profileId]);

  const goBackToMetrics = useCallback(() => {
    navigate(`/v2/ptrs/metrics?${qs}`);
  }, [navigate, qs]);

  const goToBoardPack = useCallback(async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    try {
      await updatePtrsStep.mutateAsync({ currentStep: "pack" });
    } catch (err) {
      console.error(err);
      showAlert(
        "Failed to update PTRS step. Continuing to Board Pack.",
        "warning",
      );
    }

    navigate(`/v2/ptrs/pack?${qs}`);
  }, [navigate, ptrsId, qs, showAlert, updatePtrsStep]);

  const onPrintBoardPack = useCallback(async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    // MVP: placeholder until we wire the real printable layout + window.print
    setIsManualBusy(true);
    try {
      showAlert(
        "Board Pack export is coming next. For now this is a placeholder.",
        "info",
      );
    } finally {
      setTimeout(() => setIsManualBusy(false), 250);
    }
  }, [ptrsId, showAlert]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={600}>
          Report
        </Typography>
        <Stack spacing={0.25} alignItems="flex-end">
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            {reportingEntityName}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary }}
          >
            Ptrs: {ptrsId || "—"} • Report: {reportId}
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        {reportQ.status === "error" ? (
          <Typography variant="body1" sx={{ color: theme.palette.error.main }}>
            {reportQ.error}
          </Typography>
        ) : (
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary }}
          >
            This is a read-only preview of your Payment Times report. If
            anything looks wrong, go back and fix the source data, mappings, or
            rules. Then re-run the process and regenerate the report.
            <br />
            <br />
            Metrics are currently based on{" "}
            <strong>{basedOnRowCount.toLocaleString()}</strong> rows.
          </Typography>
        )}

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={goBackToMetrics}
            disabled={isBusy}
          >
            Back: Metrics
          </Button>

          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={onPrintBoardPack}
            disabled={!ptrsId || isBusy}
          >
            Print Board Pack
          </Button>

          <Button
            variant="contained"
            endIcon={<NavigateNextIcon />}
            onClick={goToBoardPack}
            disabled={!ptrsId || isBusy}
          >
            Next: Board Pack
          </Button>

          {isBusy ? <LoadingSpinner /> : null}
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Executive summary
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Report snapshot ID: <strong>{reportId}</strong>
              <br />
              Rows included in metrics:{" "}
              <strong>{basedOnRowCount.toLocaleString()}</strong>
            </Typography>

            <Divider />

            <Typography variant="subtitle1" fontWeight={700}>
              Regulator input preview
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Read-only preview of portal fields populated from your report
              snapshot. If any value is incorrect, fix the source data/rules and
              regenerate. Fields marked “Required” must be provided before
              submission.
            </Typography>

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                mt: 1,
                overflow: "hidden",
                borderRadius: 1.5,
                borderColor: theme.palette.divider,
              }}
            >
              <Table size="small" aria-label="Regulator input preview">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Field</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 220 }}>
                      Value
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {regulatorRows.reduce((acc, row, idx) => {
                    const prev = idx > 0 ? regulatorRows[idx - 1] : null;
                    const isNewSection = !prev || prev.section !== row.section;

                    if (isNewSection) {
                      acc.push(
                        <TableRow
                          key={`section__${row.section}`}
                          sx={{
                            backgroundColor: theme.palette.action.selected,
                          }}
                        >
                          <TableCell colSpan={2} sx={{ py: 1.25 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight={800}
                              sx={{
                                letterSpacing: 0.4,
                                textTransform: "uppercase",
                              }}
                            >
                              {row.section}
                            </Typography>
                          </TableCell>
                        </TableRow>,
                      );
                    }

                    acc.push(
                      <TableRow key={`${row.section}__${row.label}`}>
                        <TableCell sx={{ pr: 3 }}>
                          <Typography variant="body2">{row.label}</Typography>
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: "monospace", whiteSpace: "nowrap" }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Box component="span">
                              {formatValue(row.value, row.format)}
                            </Box>
                            {row.required ? (
                              <Chip
                                size="small"
                                label="Required"
                                variant="outlined"
                                sx={{
                                  height: 20,
                                  fontSize: 11,
                                  color: theme.palette.warning.main,
                                  borderColor: theme.palette.warning.main,
                                }}
                              />
                            ) : null}
                          </Stack>
                        </TableCell>
                      </TableRow>,
                    );

                    return acc;
                  }, [])}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary, display: "block" }}
            >
              Note: “—” means the value isn’t available yet (usually because the
              customer must provide it, or a required input is missing).
            </Typography>

            <Divider />

            <Typography variant="subtitle1" fontWeight={700}>
              Exceptions & warnings
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Coming next: exclusions, SBI outcomes, and validation warnings.
              For now:
              <br />
              Computed sections available:{" "}
              <strong>{Object.keys(metrics?.computed || {}).length}</strong>
              <br />
              Quality sections available:{" "}
              <strong>{Object.keys(metrics?.quality || {}).length}</strong>
            </Typography>

            <Divider />

            <Typography variant="subtitle1" fontWeight={700}>
              Declaration preview
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              The declaration is made in the regulator portal. This report
              exists to support review and approval before submission.
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
