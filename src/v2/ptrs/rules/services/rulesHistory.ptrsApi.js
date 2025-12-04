import { get } from "@/fetch-wrapper";

export const getPtrsHistory = (ptrsId) => get(`/api/v2/ptrs/${ptrsId}/history`);

export const getPtrsHistoryStep = (ptrsId, stepId) =>
  get(`/api/v2/ptrs/${ptrsId}/history/${stepId}`);

export const listRuleSources = (ptrsId, profileId) =>
  get(`/api/v2/ptrs/${ptrsId}/rules/sources?profileId=${profileId}`);
