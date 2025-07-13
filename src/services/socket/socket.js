import { io } from "socket.io-client";

// 🔥 This file handles the real-time socket.io connection for file upload progress and related events.
// It connects to the server, listens for various progress and result events, and dispatches them
// to specific handlers for clarity and maintainability.

console.log("🔥 socket.js loaded");

const socket = io("http://localhost:4000");

// --- Connection lifecycle events ---
socket.on("connect", () => {
  console.log("✅ Connected to socket.io server with ID:", socket.id);
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
    payload
  );

  if (handlers[type]) {
    handlers[type]({ stage, payload });
  } else {
    console.warn(
      "⚠️ Unhandled statusUpdate type:",
      type,
      "stage:",
      stage,
      payload
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
  console.log("🔄 Socket catch-all event:", event, "Data:", data);

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
      console.warn(
        "⚠️ Unhandled catch-all type:",
        data.type,
        "stage:",
        data.stage,
        data.payload
      );
    }
  } else {
    console.log("⚠️ Received non-standard socket data on event:", event, data);
  }
});

export { socket };
