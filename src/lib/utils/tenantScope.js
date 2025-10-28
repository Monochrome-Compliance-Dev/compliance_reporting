// Simple, framework-agnostic tenant scope utilities.
// Stores the user's currently selected customer in sessionStorage and emits a window event on change.

import { userService } from "../../services";

// Prefer the live user from userService; fall back to storage if unavailable.
function getCurrentUserSafe() {
  try {
    const live = userService?.userValue;
    if (live) return live;
    const raw =
      (typeof localStorage !== "undefined" && localStorage.getItem("user")) ||
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("user"));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const STORAGE_KEY = "mc.selectedCustomer";

/**
 * Persist the selected customer (only set by a Boss user after login).
 * Also stores the active profileId for PTRS v2 when provided.
 * @param {{ id: string, name?: string, profileId?: string|null }} customer
 */
export function setCurrentCustomer(customer) {
  if (!customer || !customer.id) return;
  const payload = {
    id: String(customer.id),
    name: customer.name || "",
    profileId: customer.profileId ?? null,
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

/** Returns the scoped customerId for header scoping (or null if not applicable).
 * Only Boss users can act on behalf of another customer, and we avoid sending the header
 * when the scoped id equals the user's home tenant.
 */
export function getScopedCustomerId() {
  const scoped = getCurrentCustomer();
  if (!scoped?.id) return null;

  const user = getCurrentUserSafe();
  const role = String(user?.role || "").toLowerCase();
  const homeId = user?.customerId ? String(user.customerId) : null;
  const scopedId = String(scoped.id);

  // Only Boss can act-on-behalf; Admin/User should never send X-Customer-Id
  if (role !== "boss") return null;

  // If no home id, be conservative and return the scoped id
  if (!homeId) return scopedId;

  // Do not send header if the scoped id is the same as the home tenant
  return scopedId === homeId ? null : scopedId;
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
  const elevated = ["boss"];
  return normalized.some((r) => elevated.includes(r));
}
