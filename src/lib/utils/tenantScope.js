// Simple, framework-agnostic tenant scope utilities.
// Stores the user's currently selected customer in sessionStorage and emits a window event on change.

const STORAGE_KEY = "mc.selectedCustomer";

/**
 * Persist the selected customer (typically set by a Boss/Admin user after login).
 * @param {{ id: string, name?: string }} customer
 */
export function setCurrentCustomer(customer) {
  if (!customer || !customer.id) return;
  const payload = {
    id: String(customer.id),
    name: customer.name || "",
    ts: Date.now(),
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // storage might fail in private mode or if disabled; ignore
  }
  dispatchTenantChanged(payload);
}

/** Clear any explicit customer selection (falls back to server/user default). */
export function clearCurrentCustomer() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  dispatchTenantChanged(null);
}

/** Returns the full stored customer object or null. */
export function getCurrentCustomer() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Returns only the scoped customerId string or null if none selected. */
export function getScopedCustomerId() {
  const c = getCurrentCustomer();
  return c?.id || null;
}

/**
 * Subscribe to tenant change events. Returns an unsubscribe function.
 * @param {(detail: {id: string, name?: string} | null) => void} cb
 */
export function onCustomerChange(cb) {
  const handler = (e) => cb(e.detail);
  window.addEventListener("tenant:changed", handler);
  return () => window.removeEventListener("tenant:changed", handler);
}

function dispatchTenantChanged(detail) {
  try {
    const evt = new CustomEvent("tenant:changed", { detail });
    window.dispatchEvent(evt);
  } catch {
    // ignore
  }
}

/**
 * Helper for UI logic: who is allowed to switch customers?
 * Accepts either a single role (string) or common shapes: user.role.name, user.roles[].
 */
export function canSwitchCustomers(user) {
  if (!user) return false;
  // Accept common shapes:
  // - user.role: string (e.g., "Boss")
  // - user.role: object with name
  // - user.roles: array of strings/objects
  const collected = [];
  if (typeof user.role === "string") {
    collected.push(user.role);
  } else if (user.role && typeof user.role === "object" && user.role.name) {
    collected.push(user.role.name);
  }
  if (Array.isArray(user.roles)) {
    for (const r of user.roles) {
      if (typeof r === "string") collected.push(r);
      else if (r && typeof r === "object" && r.name) collected.push(r.name);
    }
  }
  const normalized = collected.map((r) => String(r).toLowerCase());
  const elevated = ["boss", "owner", "admin", "superadmin"];
  return normalized.some((r) => elevated.includes(r));
}
