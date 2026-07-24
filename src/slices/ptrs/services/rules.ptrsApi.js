// PTRS service — aligned to /api/v2/ptrs endpoints
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects. .js only.

import { fetchWrapper } from "shared/utils";
import { pickData } from "./ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

const normalisePreviewExample = (example) => {
  if (!example || typeof example !== "object") return null;

  const rowNo = example.rowNo ?? example.row_no ?? null;
  const documentType =
    example.documentType ?? example.document_type ?? example.doc ?? "";
  const ref = example.ref ?? example.reference ?? "";
  const supplierName =
    example.supplier_name ??
    example.payee_entity_name ??
    example.supplierName ??
    "";
  const excludeReason = example.exclude_reason ?? example.excludeReason ?? "";
  const excludeComment =
    example.exclude_comment ?? example.excludeComment ?? "";
  const baseBefore = example.baseBefore ?? example.base_before ?? "";
  const expectedDelta =
    example.expectedDelta ?? example.expected_delta ?? example.delta ?? "";
  const wouldBe = example.wouldBe ?? example.would_be ?? "";

  return {
    rowNo,
    documentType,
    ref,
    supplier_name: supplierName,
    exclude_reason: excludeReason,
    exclude_comment: excludeComment,
    baseBefore,
    expectedDelta,
    wouldBe,
  };
};

// -------------------- Rules (routes: /ptrs/:id/rules/...) ---
export const previewRules = async (
  ptrsId,
  { mode = "sample", limit = 30, groupName = null } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  const q = new URLSearchParams();
  q.set("mode", String(mode || "sample"));
  q.set("limit", String(limit));
  if (groupName) q.set("groupName", String(groupName));
  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/rules/preview?${q.toString()}`,
  );
  const d = pickData(res) || {};
  const data = d?.data || d || {};

  return {
    meta: data.meta || {},
    summary: data.summary || {},
    headers: Array.isArray(data.headers) ? data.headers : [],
    rows: Array.isArray(data.rows) ? data.rows : [],
    byRule: data.byRule || {},
    warning: data.warning || "",
    examples: Array.isArray(data.examples)
      ? data.examples.map(normalisePreviewExample).filter(Boolean)
      : [],
  };
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

export const applyRules = async (
  ptrsId,
  { profileId = null, groupName = null } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  const body = {};
  if (profileId) body.profileId = profileId;
  if (groupName) body.groupName = groupName;
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
