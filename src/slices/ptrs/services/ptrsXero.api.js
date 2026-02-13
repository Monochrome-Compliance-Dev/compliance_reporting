// PTRS v2 Xero service client.
// Normalises responses so components/hooks don't need to peel envelopes.

import { fetchWrapper } from "shared/utils";
import { pickData } from "./ptrsApi";

// Must include these routes:
// 	•	../xero/import → XeroImportPanel (entry point)
// 	•	../xero/callback → NEW XeroCallbackPanel (landing)
// 	•	../xero/select → XeroTenantSelectionPanel
// 	•	../xero/progress → XeroConnectProgressPanel (optional / MVP)

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

function normaliseStatus(data, fallbackPtrsId) {
  const d = data?.data || data || {};
  return {
    ptrsId: d?.ptrsId || d?.id || fallbackPtrsId || null,
    status: d?.status || d?.state || d?.stage || "unknown",
    message: d?.message || null,
    progress: d?.progress ?? null,
    updatedAt: d?.updatedAt || d?.updated_at || null,
    organisations: d?.organisations || d?.tenants || null,
  };
}

export const connectXero = async (ptrsId, payload = {}) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/connect`,
    payload,
  );

  const d = pickData(res);
  const data = d?.data || d || {};
  const authUrl = data?.authUrl || data?.url || null;

  if (!authUrl) throw new Error("Authorisation URL not provided by server");
  return { authUrl, organisations: data?.organisations || null };
};

export const getXeroOrganisations = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/organisations`,
  );

  const d = pickData(res);
  return normaliseStatus(d, ptrsId);
};

export const selectXeroOrganisations = async (ptrsId, tenantIds = []) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/organisations`,
    { tenantIds },
  );

  const d = pickData(res);
  return normaliseStatus(d, ptrsId);
};

export const startXeroImport = async (ptrsId, { forceRefresh } = {}) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/import`,
    { forceRefresh: Boolean(forceRefresh) },
  );

  const d = pickData(res);
  return normaliseStatus(d, ptrsId);
};

export const getXeroImportStatus = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/status`,
  );

  const d = pickData(res);
  return normaliseStatus(d, ptrsId);
};

export const removeXeroOrganisation = async (ptrsId, tenantId) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!tenantId) throw new Error("tenantId is required");

  const res = await fetchWrapper.del(
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/organisations/${encodeURIComponent(
      tenantId,
    )}`,
  );

  const d = pickData(res);
  return normaliseStatus(d, ptrsId);
};

export const downloadXeroImportExceptions = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/import/exceptions.csv`,
  );

  // fetchWrapper.get returns parsed JSON if ct is json, otherwise returns raw text.
  // Our export endpoint is `text/csv`, so this should be the CSV string.
  if (typeof res !== "string") {
    const d = pickData(res);
    return d?.data || d || "";
  }

  return res;
};

export const getXeroImportExceptionsSummary = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/import/exceptions/summary`,
  );

  const d = pickData(res);
  const data = d?.data || d || {};

  const rawCount = data?.count;
  const count = Number(rawCount);
  return { count: Number.isFinite(count) ? count : 0 };
};
