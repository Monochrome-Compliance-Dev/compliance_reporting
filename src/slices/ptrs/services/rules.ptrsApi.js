// PTRS service — aligned to /api/v2/ptrs endpoints
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects. .js only.

import { fetchWrapper } from "shared/utils";
import { pickData } from "./ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

// -------------------- Rules (routes: /ptrs/:id/rules/...) ---
export const previewRules = async (ptrsId, { limit = 50 } = {}) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/rules/preview?${q.toString()}`,
  );
  return pickData(res); // returns the full preview contract as is
};

export const listRuleSources = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/rules/sources`,
  );
  const d = pickData(res);
  const data = d?.data || d || [];
  return Array.isArray(data) ? data : [];
};

export const applyRules = async (ptrsId, { profileId = null } = {}) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  const body = {};
  if (profileId) body.profileId = profileId;
  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/rules/apply`,
    body,
  );
  return pickData(res); // { ok, stats, persisted }
};

export const getPtrsRules = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  const res = await fetchWrapper.get(`${API_ROOT}/v2/ptrs/${ptrsId}/rules`);
  const d = pickData(res);
  const data = d?.data || d || {};
  return {
    rowRules: data.rowRules || [],
    crossRowRules: data.crossRowRules || [],
  };
};

export const getProfileRules = async (profileId) => {
  if (!profileId) throw new Error("profileId is required");
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/rules/profiles/${profileId}`,
  );
  const d = pickData(res);
  const data = d?.data || d || {};
  return {
    rowRules: data.rowRules || [],
    crossRowRules: data.crossRowRules || [],
  };
};

export const savePtrsRules = async (
  ptrsId,
  { rowRules = [], crossRowRules = [] } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  const res = await fetchWrapper.post(`${API_ROOT}/v2/ptrs/${ptrsId}/rules`, {
    rowRules,
    crossRowRules,
  });
  const d = pickData(res);
  const data = d?.data || d || {};
  return {
    rowRules: data.rowRules || [],
    crossRowRules: data.crossRowRules || [],
  };
};

export const previewRulesSandbox = async (
  ptrsId,
  { filters = [], limit = 50 } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/rules/sandbox/preview`,
    { filters, limit },
  );
  const d = pickData(res);
  return d || {};
};
