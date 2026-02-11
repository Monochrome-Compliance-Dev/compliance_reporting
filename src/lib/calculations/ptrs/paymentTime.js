// DEPRECATED: payment time is now computed on the backend and persisted on each TCP row.
// This passthrough remains to avoid breaking imports during the transition.
export const calculatePaymentTime = (record) => {
  if (!record) return null;
  // Prefer the backend-provided field if present
  if (typeof record.paymentTime === "number") return record.paymentTime;
  return null;
};
