import { io } from "socket.io-client";

// IMPORTANT:
// - Do NOT hardcode localhost (breaks SIT/prod and causes endless CORS noise)
// - Do NOT auto-connect on import (public pages can import this file indirectly)
//
// Enable sockets explicitly when needed (e.g. full platform launch / specific panels):
//   REACT_APP_ENABLE_SOCKETS=true
const ENABLE_SOCKETS = process.env.REACT_APP_ENABLE_SOCKETS === "true";

// Socket.IO must connect to the server root (NOT the REST /api base).
// Priority:
//  1) REACT_APP_SOCKET_URL (explicit)
//  2) REACT_APP_API_URL with trailing /api stripped
//  3) window.location.origin (same-origin) as a safe default
const socketBaseUrl =
  process.env.REACT_APP_SOCKET_URL ||
  (process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, "")
    : typeof window !== "undefined"
      ? window.location.origin
      : "");

// Create the client but do not connect unless explicitly enabled.
const socket = io(socketBaseUrl, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  autoConnect: false,
});

if (ENABLE_SOCKETS) {
  socket.connect();
}

// --- Connection lifecycle events ---
socket.on("connect", () => {
  // console.log("✅ Connected to socket.io server with ID:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("🚫 Disconnected from socket.io server. Reason:", reason);
});

socket.on("connect_error", (err) => {
  console.error("🚨 Socket connection error:", err);
});

socket.on("reconnect_attempt", (attempt) => {
  console.log(`🔄 Reconnect attempt #${attempt}`);
});

socket.on("reconnect_failed", () => {
  console.error("❌ Reconnect failed");
});

/**
 * Handlers for different stages of the file upload and processing lifecycle.
 * This keeps each stage's logic modular and easy to maintain.
 */
const handlers = {
  scanStarted: ({ stage, payload }) => {
    console.log(`🔄 [${stage}] Scan started:`, payload);
    // e.g. show scanning spinner
  },
  scanSuccess: ({ stage, payload }) => {
    console.log(`✅ [${stage}] Scan success:`, payload);
    // e.g. indicate scan complete, ready to save
  },
  scanFailed: ({ stage, payload }) => {
    console.error(`🚨 [${stage}] Scan failed:`, payload);
    // e.g. show error and retry option
  },
  uploadProgress: ({ stage, payload }) => {
    console.log(`📤 [${stage}] Upload progress:`, payload);
    // e.g. update progress bar
  },
  uploadComplete: ({ stage, payload }) => {
    console.log(`🎉 [${stage}] Upload complete:`, payload);
    // e.g. refresh file list
  },
  auditComplete: ({ stage, payload }) => {
    console.log(`📄 [${stage}] Audit complete:`, payload);
    // e.g. mark report as audited
  },
};

// Generic socket listener for "statusUpdate" events coming from the backend.
// These should include { type, stage, payload } to indicate the kind of update.
socket.on("statusUpdate", ({ type, stage, payload }) => {
  console.log(
    `🔄 statusUpdate received | type: ${type} | stage: ${stage} | payload:`,
    payload,
  );

  if (handlers[type]) {
    handlers[type]({ stage, payload });
  } else {
    console.warn(
      "⚠️ Unhandled statusUpdate type:",
      type,
      "stage:",
      stage,
      payload,
    );
  }
});

/**
 * Catch-all socket event handler.
 *
 * This now enforces the { type, stage, payload } structure for *any* socket events as a fallback.
 * Ensures consistent logging and routing even if events come through other channels.
 */
socket.onAny((event, data) => {
  // console.log("🔄 Socket catch-all event:", event, "Data:", data);

  if (
    data &&
    typeof data === "object" &&
    typeof data.type === "string" &&
    typeof data.stage !== "undefined" &&
    typeof data.payload !== "undefined"
  ) {
    if (handlers[data.type]) {
      handlers[data.type]({ stage: data.stage, payload: data.payload });
    } else {
      // console.warn(
      //   "⚠️ Unhandled catch-all type:",
      //   data.type,
      //   "stage:",
      //   data.stage,
      //   data.payload
      // );
    }
  } else {
    console.log("⚠️ Received non-standard socket data on event:", event, data);
  }
});

export { socket };
