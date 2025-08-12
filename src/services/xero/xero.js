import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/xero`;
const wsBaseUrl = process.env.REACT_APP_WS_API_URL;

export const xeroService = {
  connect,
  subscribeToProgressUpdates,
  triggerExtraction,
  // removeTenant,
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
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    } catch (err) {
      console.error("WebSocket message parse error:", err);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    if (onError) onError(error);
  };

  ws.onclose = () => {
    // console.log("WebSocket closed.");
    if (onClose) onClose();
  };

  return ws;
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

// function removeTenant(tenantId) {
//   return fetchWrapper.delete(`${baseUrl}/tenants/${tenantId}`);
// }
