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
