// PTRS v2 Dashboard service — UI-friendly contract for the dashboard screen.
// IMPORTANT: This does NOT recompute metrics. It reuses /v2/ptrs/:id/metrics as the source of truth
// and maps it into a CFO-friendly shape.

import { listPtrs } from "./ptrsApi";
import { getMetrics } from "./metrics.ptrsApi";

const buildReportLabel = (x = {}) => {
  const name =
    x.label || x.reportingEntityName || x.entityName || x.name || "PTRS report";

  const start = x.periodStart || x.reportingPeriodStart || x.startDate || null;
  const end = x.periodEnd || x.reportingPeriodEnd || x.endDate || null;

  if (start && end) return `${name} | ${start} – ${end}`;
  if (x.periodLabel) return `${name} | ${x.periodLabel}`;

  return name;
};

const mapMetricsToDashboard = (metrics) => {
  console.log("Mapping metrics to dashboard:", metrics);
  // The fetch wrapper and/or API may wrap payloads as { status, data: ... }.
  // In some flows this ends up double-wrapped. Unwrap defensively.
  let m = metrics;

  for (let i = 0; i < 3; i += 1) {
    if (!m || typeof m !== "object") break;

    // Common wrapper shapes
    if (m?.data && (m?.status || m?.success || m?.ok)) {
      m = m.data;
      continue;
    }

    if (m?.status === "success" && m?.data) {
      m = m.data;
      continue;
    }

    break;
  }

  const computed = m?.computed || {};

  return {
    ptrsId: m?.ptrsId || m?.header?.reportId || null,
    header: m?.header || {},

    outcomes: {
      sbOnTimePct:
        computed?.percentageOfSbInvoicesPaidWithinPaymentTerm ??
        computed?.sbInvoicesPaidWithinPaymentTermPct ??
        null,
      within30Pct:
        computed?.payments30DaysOrLessPct ??
        computed?.percentagePaidWithin30Days ??
        null,
      medianDays:
        computed?.medianPaymentTimeDays ?? computed?.medianPaymentTime ?? null,
      averageDays:
        computed?.averagePaymentTimeDays ??
        computed?.averagePaymentTime ??
        null,
    },

    drivers: {
      paymentTimeBands: computed?.paymentTimeBands ?? null,
      paymentTerms: computed?.paymentTerms ?? null,
    },

    context: {
      sbSpendPctOfTotal:
        computed?.percentageOfSmallBusinessTradeCreditPayments ??
        computed?.smallBusinessSpendPctOfTotal ??
        null,
      peppolEnabledPctSb:
        computed?.percentagePeppolEnabledSmallBusinessProcurement ??
        computed?.peppolEnabledSmallBusinessProcurementPct ??
        null,
    },

    insights: [],
    raw: m,
    rawResponse: metrics,
  };
};

export const listDashboardReports = async () => {
  const res = await listPtrs();
  const items = Array.isArray(res?.items) ? res.items : [];

  return items.map((x) => ({
    id: x.id,
    label: buildReportLabel(x),
    status: x.status || null,
    periodStart: x.periodStart || null,
    periodEnd: x.periodEnd || null,
    raw: x,
  }));
};

export const getDashboard = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const metrics = await getMetrics(ptrsId);
  return mapMetricsToDashboard(metrics);
};
