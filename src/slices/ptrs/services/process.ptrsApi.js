import { fetchWrapper } from "shared/utils";
import { pickData } from "./ptrsApi";

const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

export const runPtrsTransformations = async (
  ptrsId,
  { profileId = null } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const response = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/process`,
    { profileId },
  );
  const data = pickData(response) || {};

  return {
    ptrsId: data.ptrsId || ptrsId,
    profileId: data.profileId || profileId,
    executionRunId: data.executionRunId || null,
    tookMs: data.tookMs ?? null,
    counts: data.counts || {},
    steps: data.steps || {},
  };
};
