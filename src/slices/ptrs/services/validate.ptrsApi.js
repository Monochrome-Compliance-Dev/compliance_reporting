// PTRS Validate service — aligned to /api/v2/ptrs endpoints
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects. .js only.

import { fetchWrapper } from "shared/utils";
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
    {},
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

export const setStageRowExcluded = async (
  ptrsId,
  stageRowId,
  { exclude, comment } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!stageRowId) throw new Error("stageRowId is required");

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/stage-rows/${stageRowId}/exclude`,
    {
      exclude: Boolean(exclude),
      comment: comment != null ? String(comment) : null,
    },
  );

  const d = pickData(res);
  const data = d?.data || d || {};

  return data;
};

export const getStageRowById = async (ptrsId, stageRowId) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!stageRowId) throw new Error("stageRowId is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/stage-rows/${stageRowId}`,
  );

  const d = pickData(res);
  const data = d?.data || d || {};

  return data;
};
