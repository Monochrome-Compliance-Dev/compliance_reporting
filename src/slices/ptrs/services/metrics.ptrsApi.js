// PTRS v2 Metrics service — aligned to /api/v2/ptrs endpoints
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects. .js only.

import { fetchWrapper } from "shared/utils";
import { pickData } from "./ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

const normalise = (ptrsId, raw) => {
  const data = raw || {};

  return {
    ptrsId: data?.header?.reportId || data?.ptrsId || ptrsId,
    header: data?.header || {},
    declarations: data?.declarations || {},
    computed: data?.computed || {},
    quality: data?.quality || {},
  };
};

export const getMetrics = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/${ptrsId}/metrics`);

  const d = pickData(res);
  const data = d?.data || d || {};

  return normalise(ptrsId, data);
};

export const updateMetricsDraft = async (ptrsId, patch) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.patch(
    `${API_ROOT}/v2/ptrs/${ptrsId}/metrics`,
    patch || {},
  );

  const d = pickData(res);
  const data = d?.data || d || {};

  return normalise(ptrsId, data);
};
