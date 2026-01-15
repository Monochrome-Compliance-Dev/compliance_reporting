// PTRS v2 Xero import service — aligned to /v2/ptrs endpoints
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects. .js only.

import { fetchWrapper } from "lib/utils/fetch-wrapper";
import { pickData } from "./ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

export const startXeroImport = async (ptrsId, { forceRefresh } = {}) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/import`,
    {
      forceRefresh: Boolean(forceRefresh),
    }
  );

  const d = pickData(res);
  const data = d?.data || d || {};

  return {
    ptrsId: data?.ptrsId || ptrsId,
    status: data?.status || data?.state || "unknown",
    message: data?.message || null,
    progress: data?.progress ?? null,
    uploadId: data?.uploadId || null,
  };
};

export const getXeroImportStatus = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/status`
  );

  const d = pickData(res);
  const data = d?.data || d || {};

  return {
    ptrsId: data?.ptrsId || ptrsId,
    status: data?.status || data?.state || "unknown",
    message: data?.message || null,
    progress: data?.progress ?? null,
    updatedAt: data?.updatedAt || data?.updated_at || null,
  };
};
