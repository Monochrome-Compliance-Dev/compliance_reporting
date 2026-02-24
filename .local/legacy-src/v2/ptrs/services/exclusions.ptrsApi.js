// PTRS v2 Exclusions API
// Mirrors rules.ptrsApi.js patterns but scoped to exclusions only.

import { fetchWrapper } from "lib/utils/fetch-wrapper";
import { pickData } from "./ptrsApi";

const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

export const applyExclusions = async (
  ptrsId,
  { profileId = null, category = "all" } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  const body = {};
  if (profileId) body.profileId = profileId;
  if (category) body.category = category;

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/exclusions/apply`,
    body,
  );
  return pickData(res); // { persisted, stats, tookMs }
};

export const previewExclusions = async (
  ptrsId,
  { category = "all", limit = 10, profileId = null } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  const q = new URLSearchParams();
  if (category) q.set("category", String(category));
  if (limit != null) q.set("limit", String(limit));
  if (profileId) q.set("profileId", String(profileId));

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/exclusions/preview?${q.toString()}`,
  );
  return pickData(res);
};

export const listExclusionKeywords = async (ptrsId, { profileId } = {}) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!profileId) throw new Error("profileId is required");

  const q = new URLSearchParams();
  q.set("profileId", String(profileId));

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/exclusions/keywords?${q.toString()}`,
  );
  return pickData(res); // { rows: [] }
};

export const createExclusionKeyword = async (
  ptrsId,
  { profileId, keyword, field, matchType, notes } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!profileId) throw new Error("profileId is required");
  if (!field) throw new Error("field is required");
  if (!matchType) throw new Error("matchType is required");

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/exclusions/keywords`,
    { profileId, keyword, field, matchType, notes },
  );
  return pickData(res);
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

  const res = await fetchWrapper.put(
    `${API_ROOT}/v2/ptrs/${ptrsId}/exclusions/keywords/${keywordId}`,
    { profileId, keyword, field, matchType, notes },
  );
  return pickData(res);
};

export const deleteExclusionKeyword = async (
  ptrsId,
  { profileId, keywordId } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!profileId) throw new Error("profileId is required");
  if (!keywordId) throw new Error("keywordId is required");

  const q = new URLSearchParams();
  q.set("profileId", String(profileId));

  const res = await fetchWrapper.del(
    `${API_ROOT}/v2/ptrs/${ptrsId}/exclusions/keywords/${keywordId}?${q.toString()}`,
  );
  return pickData(res);
};
