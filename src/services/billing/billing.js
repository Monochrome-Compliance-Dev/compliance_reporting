import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/billing`;

export const billingService = {
  createCheckoutSession,
  verifySession,
  createPortalSession,
};

async function createCheckoutSession(payload) {
  return await fetchWrapper.post(`${baseUrl}/checkout-session`, payload);
}

async function verifySession(sessionId) {
  return await fetchWrapper.get(
    `${baseUrl}/verify-session?session_id=${encodeURIComponent(sessionId)}`
  );
}

async function createPortalSession() {
  return await fetchWrapper.post(`${baseUrl}/portal-session`);
}
