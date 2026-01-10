import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router";

import { useAlert } from "context";
import { usePtrsV2Context } from "v2/ptrs/context/PtrsV2Context";
import { LoadingSpinner } from "components/ui/";

import {
  usePtrsMetricsSummary,
  useUpdateMetricsDraftMutation,
  useUpdatePtrsMutation,
} from "v2/ptrs/hooks/usePtrsQueries";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object({
  supplyChainFinanceOffered: yup.boolean().nullable(),
  procurementFeesCharged: yup.boolean().nullable(),
  smallBusinessPaymentObligations: yup.boolean().nullable(),
  anzsicSubdivision: yup.string().nullable(),
  industryDivision: yup.string().nullable(),
  reportComments: yup.string().nullable(),
  descriptionOfChanges: yup.string().nullable(),
  revisedReport: yup.boolean().nullable(),
  redactedReport: yup.boolean().nullable(),
});

const fmt = (v) => {
  if (v == null || v === "") return "—";
  return String(v);
};

const fmtPct = (v) => {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
};

const fmtDays = (v) => {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n)}`;
};

const boolLabel = (v) => {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "—";
};

export default function MetricsPanel() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const { ptrsId: ctxPtrsId, profileId: ctxProfileId } = usePtrsV2Context();
  const ptrsId = ctxPtrsId || "";
  const profileId = ctxProfileId || null;

  const {
    status: loadStatus,
    data,
    error,
    refetch,
  } = usePtrsMetricsSummary(ptrsId);

  const updateDraft = useUpdateMetricsDraftMutation(ptrsId);
  const updatePtrsStep = useUpdatePtrsMutation(ptrsId);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const isBusy =
    loadStatus === "loading" ||
    updateDraft.isPending ||
    updatePtrsStep.isPending ||
    isManualRefreshing;

  const header = data?.header || {};
  const computed = useMemo(() => data?.computed || {}, [data?.computed]);
  const quality = data?.quality || {};

  const defaults = useMemo(() => {
    const d = data?.declarations || {};

    return {
      supplyChainFinanceOffered: d?.supplyChainFinanceOffered ?? null,
      procurementFeesCharged: d?.procurementFeesCharged ?? null,
      smallBusinessPaymentObligations:
        d?.smallBusinessPaymentObligations ?? null,
      anzsicSubdivision: d?.anzsicSubdivision ?? "",
      industryDivision: d?.industryDivision ?? "",
      reportComments: d?.reportComments ?? "",
      descriptionOfChanges: d?.descriptionOfChanges ?? "",
      revisedReport: header?.revisedReport ?? null,
      redactedReport: header?.redactedReport ?? null,
    };
  }, [data?.declarations, header?.revisedReport, header?.redactedReport]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    defaultValues: defaults,
    resolver: yupResolver(schema),
    mode: "onBlur",
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const missingInputs = Array.isArray(quality?.missingInputs)
    ? quality.missingInputs
    : [];
  const missingCount = missingInputs.length;

  const goBackToValidate = useCallback(() => {
    const qs = new URLSearchParams();
    if (ptrsId) qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    navigate(`/v2/ptrs/validate?${qs.toString()}`);
  }, [navigate, ptrsId, profileId]);

  const goToReport = useCallback(async () => {
    if (!ptrsId) {
      showAlert("Missing ptrsId", "error");
      return;
    }

    try {
      await updatePtrsStep.mutateAsync({ currentStep: "report" });
    } catch (err) {
      console.error(err);
      showAlert("Failed to update PTRS step. Continuing to Report.", "warning");
    }

    const qs = new URLSearchParams();
    if (ptrsId) qs.set("ptrsId", ptrsId);
    if (profileId) qs.set("profileId", profileId);
    navigate(`/v2/ptrs/report?${qs.toString()}`);
  }, [navigate, ptrsId, profileId, showAlert, updatePtrsStep]);

  const refresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      if (typeof refetch === "function") {
        await refetch();
        showAlert("Metrics refreshed.", "success");
      } else {
        showAlert("Refresh is unavailable (refetch missing).", "warning");
      }
    } catch (err) {
      showAlert(err?.message || "Failed to refresh metrics.", "error");
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetch, showAlert]);

  const onSave = useCallback(
    async (values) => {
      if (!ptrsId) {
        showAlert("Missing ptrsId", "error");
        return;
      }

      try {
        await updateDraft.mutateAsync({
          supplyChainFinanceOffered: values.supplyChainFinanceOffered ?? null,
          procurementFeesCharged: values.procurementFeesCharged ?? null,
          smallBusinessPaymentObligations:
            values.smallBusinessPaymentObligations ?? null,
          anzsicSubdivision: values.anzsicSubdivision || null,
          industryDivision: values.industryDivision || null,
          reportComments: values.reportComments || "",
          descriptionOfChanges: values.descriptionOfChanges || "",
          revisedReport: values.revisedReport ?? false,
          redactedReport: values.redactedReport ?? false,
        });

        showAlert("Metrics draft saved.", "success");
      } catch (err) {
        showAlert(err?.message || "Failed to save Metrics draft.", "error");
      }
    },
    [ptrsId, showAlert, updateDraft]
  );

  const computedRows = useMemo(
    () => [
      {
        label: "Common Payment Terms (days)",
        value: fmtDays(computed?.commonPaymentTermsDays),
      },
      {
        label: "Common Payment Term (minimum)",
        value: fmtDays(computed?.commonPaymentTermMinimum),
      },
      {
        label: "Common Payment Term (maximum)",
        value: fmtDays(computed?.commonPaymentTermMaximum),
      },
      {
        label: "Forecast Payment Term",
        value: fmtDays(computed?.forecastPaymentTerm),
      },
      {
        label: "Forecast Minimum Payment Term",
        value: fmtDays(computed?.forecastMinimumPaymentTerm),
      },
      {
        label: "Forecast Maximum Payment Term",
        value: fmtDays(computed?.forecastMaximumPaymentTerm),
      },
      {
        label: "Receivable terms compared to Common Payment Term",
        value: fmt(computed?.receivableTermsComparedToCommonPaymentTerm),
      },
      {
        label: "% of SB invoices paid within Payment Term",
        value: fmtPct(computed?.percentageOfSbInvoicesPaidWithinPaymentTerm),
      },
      {
        label: "Average Payment Time (days)",
        value: fmtDays(computed?.averagePaymentTimeDays),
      },
      {
        label: "Median Payment Time (days)",
        value: fmtDays(computed?.medianPaymentTimeDays),
      },
      {
        label: "80th Percentile Payment Time (days)",
        value: fmtDays(computed?.p80PaymentTimeDays),
      },
      {
        label: "95th Percentile Payment Time (days)",
        value: fmtDays(computed?.p95PaymentTimeDays),
      },
      {
        label: "Payments 30 days or less",
        value: fmtPct(computed?.payments30DaysOrLessPct),
      },
      {
        label: "Payments 31 - 60 days",
        value: fmtPct(computed?.payments31To60DaysPct),
      },
      {
        label: "Payments more than 60 days",
        value: fmtPct(computed?.paymentsMoreThan60DaysPct),
      },
      {
        label: "Percentage of Small Business Trade Credit Payments",
        value: fmtPct(computed?.percentageOfSmallBusinessTradeCreditPayments),
      },
      {
        label: "Percentage Peppol Enabled Small Business Procurement",
        value: fmtPct(
          computed?.percentagePeppolEnabledSmallBusinessProcurement
        ),
      },
    ],
    [computed]
  );

  const titleRight = useMemo(() => {
    const rid = header?.reportId || ptrsId || "—";
    return `Ptrs: ${rid}`;
  }, [header?.reportId, ptrsId]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={600}>
          Metrics
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          {titleRight}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        <Typography
          variant="body1"
          sx={{ color: theme.palette.text.secondary }}
        >
          This step shows the regulator-shaped values that will be used in the
          report. It does not change staged data.
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={goBackToValidate}
            disabled={isBusy}
          >
            Back: Validate
          </Button>

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit(onSave)}
            disabled={!ptrsId || isBusy || !isDirty}
          >
            Save draft
          </Button>

          <Button
            variant="contained"
            endIcon={<NavigateNextIcon />}
            onClick={handleSubmit(async (v) => {
              await onSave(v);
              await goToReport();
            })}
            disabled={!ptrsId || isBusy}
          >
            Next: Report
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refresh}
            disabled={!ptrsId || isBusy}
          >
            Refresh
          </Button>

          {isBusy ? <LoadingSpinner /> : null}
        </Stack>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Stack spacing={1}>
            <Typography variant="subtitle1" fontWeight={600}>
              Report header
            </Typography>

            {!ptrsId ? (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Select or resume a PTRS run to view metrics.
              </Typography>
            ) : loadStatus === "loading" ? (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Loading metrics…
              </Typography>
            ) : loadStatus === "error" ? (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.error.main }}
              >
                {error || "Failed to load metrics"}
              </Typography>
            ) : (
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  Business name: <b>{fmt(header?.businessName)}</b>
                </Typography>
                <Typography variant="body2">
                  ABN: <b>{fmt(header?.abn)}</b> • ACN:{" "}
                  <b>{fmt(header?.acn)}</b>
                </Typography>
                <Typography variant="body2">
                  Type: <b>{fmt(header?.type)}</b>
                </Typography>
                <Typography variant="body2">
                  Period: <b>{fmt(header?.reportingPeriodStartDate)}</b> to{" "}
                  <b>{fmt(header?.reportingPeriodEndDate)}</b>
                </Typography>
                <Typography variant="body2">
                  Revised report: <b>{boolLabel(header?.revisedReport)}</b> •
                  Redacted report: <b>{boolLabel(header?.redactedReport)}</b>
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>

        {missingCount ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <AlertTitle>Missing inputs</AlertTitle>
            {missingCount} declaration{missingCount === 1 ? " is" : "s are"} not
            set yet. You can continue for MVP, but the report may be incomplete.
          </Alert>
        ) : null}

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              Declarations
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Controller
                name="supplyChainFinanceOffered"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value === true}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label={`Supply Chain Finance offered: ${boolLabel(field.value)}`}
                  />
                )}
              />

              <Controller
                name="procurementFeesCharged"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value === true}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label={`Procurement fees charged: ${boolLabel(field.value)}`}
                  />
                )}
              />

              <Controller
                name="smallBusinessPaymentObligations"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value === true}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label={`SB obligations (legal/voluntary): ${boolLabel(field.value)}`}
                  />
                )}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="ANZSIC Industry subdivision"
                fullWidth
                {...register("anzsicSubdivision")}
              />
              <TextField
                label="Industry Division"
                fullWidth
                {...register("industryDivision")}
              />
            </Stack>

            <TextField
              label="Report Comments"
              fullWidth
              multiline
              minRows={3}
              {...register("reportComments")}
            />

            <TextField
              label="Description of Changes"
              fullWidth
              multiline
              minRows={3}
              {...register("descriptionOfChanges")}
            />
          </Stack>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Stack spacing={1}>
            <Typography variant="subtitle1" fontWeight={600}>
              Computed values
            </Typography>

            {loadStatus !== "success" ? (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Values will appear once metrics load successfully.
              </Typography>
            ) : (
              <Stack spacing={0.75}>
                {computedRows.map((r) => (
                  <Stack
                    key={r.label}
                    direction={{ xs: "column", md: "row" }}
                    spacing={1}
                    sx={{
                      py: 0.75,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {r.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {r.value}
                    </Typography>
                  </Stack>
                ))}

                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  Based on rows: {fmt(quality?.basedOnRowCount)} • SB rows:{" "}
                  {fmt(quality?.sbRowCount)} • Invoice date range:{" "}
                  {fmt(quality?.actualInvoiceDateRange?.min)} to{" "}
                  {fmt(quality?.actualInvoiceDateRange?.max)}
                </Typography>

                {Array.isArray(quality?.notes) && quality.notes.length ? (
                  <Stack spacing={0.5}>
                    {quality.notes.slice(0, 5).map((n, idx) => (
                      <Typography
                        key={`${idx}-${n}`}
                        variant="caption"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        • {n}
                      </Typography>
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
