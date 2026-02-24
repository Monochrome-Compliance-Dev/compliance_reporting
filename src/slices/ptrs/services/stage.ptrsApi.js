// PTRS service — aligned to /api/v2/ptrs endpoints required for stage
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects. .js only.

import { fetchWrapper } from "shared/utils";
import { normPreview, pickData } from "./ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

// -------------------- Staging (route: /ptrs/:id/stage) -------
export const stagePtrs = async (
  ptrsId,
  { profileId = "", persist = false } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  // Build payload: always include profileId, optionally include persist
  const payload = { profileId };
  if (persist != null) payload.persist = Boolean(persist);

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/stage`,
    payload,
  );

  // Normalise the response so the UI can rely on a stable shape
  const d = pickData(res) || {};
  const rowsIn = d.rowsIn ?? d.affectedCount ?? d.inputCount ?? d.inCount ?? 0;
  const rowsOut =
    d.rowsOut ?? d.persistedCount ?? d.outputCount ?? d.outCount ?? 0;

  return {
    rowsIn,
    rowsOut,
    tookMs: d.tookMs ?? d.durationMs ?? null,
    sample: d.sample || null,
    stats: d.stats || null,
  };
};

// New function: getStagePreview
export const getStagePreview = async (
  ptrsId,
  { limit = 20, profileId = null } = {},
) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  if (profileId) q.set("profileId", String(profileId));
  try {
    const res = await fetchWrapper.get(
      `${API_ROOT}/v2/ptrs/${ptrsId}/stage/preview?${q.toString()}`,
    );
    // BE returns { headers, rows, totalRows, stats }
    return normPreview(pickData(res));
  } catch (err) {
    // fallback to generic preview if BE doesn't expose stage/preview yet
    const body = { steps: ["stage"], limit };
    if (profileId) body.profileId = profileId;
    const res2 = await fetchWrapper.post(
      `${API_ROOT}/v2/ptrs/${ptrsId}/preview`,
      body,
    );
    return normPreview(pickData(res2));
  }
};

// -------------------- Execution runs (route: /ptrs/:id/execution-runs) -------
export const getLatestExecutionRun = async (ptrsId, { step } = {}) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const q = new URLSearchParams();
  if (step) q.set("step", String(step));

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/execution-runs/latest?${q.toString()}`,
  );

  return pickData(res) || null;
};
