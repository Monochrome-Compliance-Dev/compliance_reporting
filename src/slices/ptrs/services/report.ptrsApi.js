// PTRS Report service — backed by the BE /ptrs/:id/report endpoint
// MVP: read-only report snapshot for the Report screen + Board Pack.
// This client NORMALISES responses so the FE never peels envelopes.

import { fetchWrapper } from "shared/utils";
import { pickData } from "./ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

const normalise = (raw = {}) => {
  const data = raw || {};

  return {
    ptrs: data?.ptrs || null,
    metrics: data?.metrics || null,
    header: data?.metrics?.header || {},
    // convenient derived fields (safe defaults)
    reportId: data?.metrics?.header?.reportId || null,
    periodStart:
      data?.ptrs?.periodStart || data?.metrics?.header?.periodStart || null,
    periodEnd:
      data?.ptrs?.periodEnd || data?.metrics?.header?.periodEnd || null,
  };
};

export const getReportSnapshot = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/${ptrsId}/report`);

  const d = pickData(res);
  const data = d?.data || d || {};

  return normalise(data);
};
