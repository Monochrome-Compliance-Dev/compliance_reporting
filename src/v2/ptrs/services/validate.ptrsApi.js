// PTRS v2 Validate service — aligned to /api/v2/ptrs endpoints
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects. .js only.

import { fetchWrapper } from "lib/utils/fetch-wrapper";
import { pickData } from "./ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

export const getValidate = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/${ptrsId}/validate`);

  const d = pickData(res);
  const data = d?.data || d || {};

  return {
    ptrsId: data?.ptrsId || ptrsId,
    status: data?.status || "unknown",
    mode: data?.mode || "read",
    counts: data?.counts || {},
    blockers: Array.isArray(data?.blockers) ? data.blockers : [],
    warnings: Array.isArray(data?.warnings) ? data.warnings : [],
  };
};

export const runValidate = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/validate`,
    {}
  );

  const d = pickData(res);
  const data = d?.data || d || {};

  return {
    ptrsId: data?.ptrsId || ptrsId,
    status: data?.status || "unknown",
    mode: data?.mode || "run",
    counts: data?.counts || {},
    blockers: Array.isArray(data?.blockers) ? data.blockers : [],
    warnings: Array.isArray(data?.warnings) ? data.warnings : [],
  };
};
