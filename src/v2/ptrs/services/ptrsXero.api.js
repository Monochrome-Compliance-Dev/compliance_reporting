// PTRS v2 Xero service client.
// Normalises responses so components/hooks don't need to peel envelopes.

// Must include these routes:
// 	•	/v2/ptrs/xero/import → XeroImportPanel (entry point)
// 	•	/v2/ptrs/xero/callback → NEW XeroCallbackPanel (landing)
// 	•	/v2/ptrs/xero/select → XeroTenantSelectionPanel
// 	•	/v2/ptrs/xero/progress → XeroConnectProgressPanel (optional / MVP)

import { fetchWrapper } from "lib/utils/fetch-wrapper";
import { pickData } from "./ptrsApi";

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
    payload
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
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/organisations`
  );

  const d = pickData(res);
  return normaliseStatus(d, ptrsId);
};

export const selectXeroOrganisations = async (ptrsId, tenantIds = []) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/organisations`,
    { tenantIds }
  );

  const d = pickData(res);
  return normaliseStatus(d, ptrsId);
};

export const startXeroImport = async (ptrsId, { forceRefresh } = {}) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.post(
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/import`,
    { forceRefresh: Boolean(forceRefresh) }
  );

  const d = pickData(res);
  return normaliseStatus(d, ptrsId);
};

export const getXeroImportStatus = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/status`
  );

  const d = pickData(res);
  return normaliseStatus(d, ptrsId);
};

export const removeXeroOrganisation = async (ptrsId, tenantId) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!tenantId) throw new Error("tenantId is required");

  const res = await fetchWrapper.del(
    `${API_ROOT}/v2/ptrs/${ptrsId}/xero/organisations/${encodeURIComponent(
      tenantId
    )}`
  );

  const d = pickData(res);
  return normaliseStatus(d, ptrsId);
};
