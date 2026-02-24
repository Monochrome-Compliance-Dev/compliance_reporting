import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/xero`;
const wsBaseUrl = process.env.REACT_APP_WS_API_URL;

export const xeroService = {
  connect,
  subscribeToProgressUpdates,
  triggerExtraction,
  dumpContacts,
  // removeTenant,
  applyXeroContactPatch,
};

function connect(params) {
  console.log("Connecting to Xero with params:", params);
  const { ptrsId, createdBy, startDate, endDate } = params;
  return fetchWrapper.get(
    `${baseUrl}/connect/${ptrsId}/${createdBy}/${startDate}/${endDate}`
  );
}

function subscribeToProgressUpdates(onMessage, onError, onClose) {
  const ws = new WebSocket(wsBaseUrl);
  ws.onopen = () => {
    ws.send(JSON.stringify({ action: "subscribe", type: "xeroUpdates" }));
  };

  ws.onmessage = (event) => {
    try {
      const raw = JSON.parse(event.data);
      const payload = raw && raw.data ? raw.data : raw; // supports flat or { data: ... }
      if (onMessage) onMessage(payload);
    } catch (err) {
      console.error("WebSocket message parse error:", err);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    if (onError) onError(error);
  };

  ws.onclose = () => {
    if (onClose) onClose();
  };

  // Return an unsubscribe function for proper cleanup
  return () => {
    try {
      ws.close();
    } catch (_) {}
  };
}

function triggerExtraction(payload) {
  console.log("Triggering Xero extraction with payload:", payload);
  return fetchWrapper
    .post(`${baseUrl}/extract`, payload)
    .then((res) => {
      // console.log("Xero extraction response:", res);
      return res;
    })
    .catch((err) => {
      console.error("Xero extraction error:", err);
      throw err;
    });
}

function dumpContacts({ tenantIds } = {}) {
  const payload = {};
  if (Array.isArray(tenantIds) && tenantIds.length > 0) {
    payload.tenantIds = tenantIds;
  }
  return fetchWrapper
    .post(`${baseUrl}/contacts/dump`, payload)
    .then((res) => res)
    .catch((err) => {
      console.error("Dump contacts error:", err);
      throw err;
    });
}

// function removeTenant(tenantId) {
//   return fetchWrapper.delete(`${baseUrl}/tenants/${tenantId}`);
// }

async function applyXeroContactPatch({ tenantId, patchBody, dryRun = true }) {
  if (!tenantId) throw new Error("tenantId is required");
  if (!patchBody || typeof patchBody !== "object") {
    throw new Error(
      "patchBody must be an object containing the Xero Contacts payload"
    );
  }

  const url = `${baseUrl}/apply`;
  return await fetchWrapper.post(url, { tenantId, dryRun, payload: patchBody });
}
