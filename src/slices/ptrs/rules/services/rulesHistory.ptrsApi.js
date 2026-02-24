import { fetchWrapper } from "shared/utils";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

export const getPtrsHistory = (ptrsId) => {
  // returning [] until backend is ready
  return [];
  // fetchWrapper.get(`${API_ROOT}/v2/ptrs/${ptrsId}/history`);
};

export const getPtrsHistoryStep = (ptrsId, stepId) =>
  fetchWrapper.get(`${API_ROOT}/v2/ptrs/${ptrsId}/history/${stepId}`);

export const listRuleSources = (ptrsId, profileId) =>
  fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/rules/sources?profileId=${profileId}`,
  );
