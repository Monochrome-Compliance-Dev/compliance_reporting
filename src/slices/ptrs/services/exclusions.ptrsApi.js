// PTRS v2 Exclusions API
// Mirrors rules.ptrsApi.js patterns but scoped to exclusions only.

import { fetchWrapper } from "shared/utils";
import { pickData } from "./ptrsApi";

const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

const buildExclusionsUrl = (ptrsId, path = "", query = null) => {
  const suffix = path ? `/${path.replace(/^\/+/, "")}` : "";
  const qs = query ? `?${query.toString()}` : "";
  return `${API_ROOT}/v2/ptrs/${ptrsId}/exclusions${suffix}${qs}`;
};

const buildQuery = (params = {}) => {
  const q = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return;
    q.set(key, String(value));
  });

  return q;
};

const pickExclusionsData = async (request) => {
  const res = await request;
  return pickData(res);
};

export const applyExclusions = async (
  ptrsId,
  { profileId = null, category = "all" } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const body = {};
  if (profileId) body.profileId = profileId;
  if (category) body.category = category;

  return pickExclusionsData(
    fetchWrapper.post(buildExclusionsUrl(ptrsId, "apply"), body),
  ); // { persisted, stats, tookMs }
};

export const previewExclusions = async (
  ptrsId,
  { category = "all", limit = 10, profileId = null } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const q = buildQuery({ category, limit, profileId });

  return pickExclusionsData(
    fetchWrapper.get(buildExclusionsUrl(ptrsId, "preview", q)),
  );
};

export const getExclusionsSummary = async (
  ptrsId,
  { profileId = null } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const q = buildQuery({ profileId });

  return pickExclusionsData(
    fetchWrapper.get(buildExclusionsUrl(ptrsId, "summary", q)),
  );
};

export const listExclusionKeywords = async (ptrsId, { profileId } = {}) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!profileId) throw new Error("profileId is required");

  const q = buildQuery({ profileId });

  return pickExclusionsData(
    fetchWrapper.get(buildExclusionsUrl(ptrsId, "keywords", q)),
  ); // { rows: [] }
};

export const createExclusionKeyword = async (
  ptrsId,
  { profileId, keyword, field, matchType, notes } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!profileId) throw new Error("profileId is required");
  if (!field) throw new Error("field is required");
  if (!matchType) throw new Error("matchType is required");

  return pickExclusionsData(
    fetchWrapper.post(buildExclusionsUrl(ptrsId, "keywords"), {
      profileId,
      keyword,
      field,
      matchType,
      notes,
    }),
  );
};

export const updateExclusionKeyword = async (
  ptrsId,
  { profileId, keywordId, keyword, field, matchType, notes } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!profileId) throw new Error("profileId is required");
  if (!keywordId) throw new Error("keywordId is required");
  if (!field) throw new Error("field is required");
  if (!matchType) throw new Error("matchType is required");

  return pickExclusionsData(
    fetchWrapper.put(buildExclusionsUrl(ptrsId, `keywords/${keywordId}`), {
      profileId,
      keyword,
      field,
      matchType,
      notes,
    }),
  );
};

export const deleteExclusionKeyword = async (
  ptrsId,
  { profileId, keywordId } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!profileId) throw new Error("profileId is required");
  if (!keywordId) throw new Error("keywordId is required");

  const q = buildQuery({ profileId });

  return pickExclusionsData(
    fetchWrapper.delete(buildExclusionsUrl(ptrsId, `keywords/${keywordId}`, q)),
  );
};
