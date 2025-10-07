import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/billing`;

export const billingService = {
  createCheckoutSession,
  verifySession,
  createPortalSession,
};

async function createCheckoutSession(payload) {
  const resp = await fetchWrapper.post(`${baseUrl}/checkout-session`, payload);
  // Normalize to wrapped shape for legacy callers
  return resp?.data ?? { data: resp }; // then callers can do result.data.url
}

async function verifySession(sessionId) {
  return await fetchWrapper.get(
    `${baseUrl}/verify-session?session_id=${encodeURIComponent(sessionId)}`
  );
}

async function createPortalSession() {
  return await fetchWrapper.post(`${baseUrl}/portal-session`);
}
