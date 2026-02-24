// NOTE: Avoid importing route config into auth/session logic.
import { BehaviorSubject } from "rxjs";
import {
  fetchWrapper,
  getScopedCustomerId,
  onCustomerChange,
} from "shared/utils";

const userSubject = new BehaviorSubject(null);

const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
const baseUrl = `${API_ROOT}/v2/users`;

function unwrap(res) {
  // v2 responses are typically: { status: "success", data: ... }
  if (res && typeof res === "object" && "status" in res && "data" in res) {
    return res.data;
  }
  return res;
}

function unwrapItems(res) {
  const data = unwrap(res);
  if (data && typeof data === "object" && Array.isArray(data.items)) {
    return data.items;
  }
  return data;
}

let _refreshInFlight = null; // Promise or null

// --- Acting-as helpers & guards ---
let didWireTenantChange = false;
let lastAppliedKey = ""; // `${jwtToken}:${scopedId || ""}` to dedupe reloads

function getScopedIdIfBoss() {
  const u = userSubject.value;
  const role = String(u?.role || "").toLowerCase();
  if (role !== "boss") return null;
  try {
    return typeof getScopedCustomerId === "function"
      ? getScopedCustomerId()
      : null;
  } catch {
    return null;
  }
}

function makeKey(token, scopedId) {
  return `${token || ""}:${scopedId || ""}`;
}

function wireTenantChangeListener() {
  if (didWireTenantChange) return;
  didWireTenantChange = true;
  try {
    onCustomerChange(async (cust) => {
      const u = userSubject.value;
      const role = String(u?.role || "").toLowerCase();
      if (role !== "boss") return;
      const token = u?.jwtToken || "";
      const scopedId = cust?.id || "";
      const key = makeKey(token, scopedId);
      if (key === lastAppliedKey) return; // de-dupe
      lastAppliedKey = key;
      if (scopedId) {
        try {
          await reloadCustomerEntitlements(scopedId);
        } catch (e) {
          console.warn(
            "Failed to reload entitlements on tenant change:",
            e?.message || e,
          );
        }
      } else {
        // Acting cleared; leave current entitlements as-is (base entitlements from server).
      }
    });
  } catch (e) {
    console.warn("Failed wiring onCustomerChange listener:", e?.message || e);
  }
}

export const userService = {
  login,
  logout,
  refreshToken,
  register,
  registerFirstUser,
  verifyEmail,
  verifyToken,
  forgotPassword,
  validateResetToken,
  resetPassword,
  setNewPassword,
  deactivateUser,
  reactivateUser,
  resendInvitation,
  getAll,
  getAllByClientId,
  getById,
  create,
  inviteWithResource,
  update,
  delete: _delete,
  hasFeature,
  reloadCustomerEntitlements,
  user: userSubject.asObservable(),
  get userValue() {
    return userSubject.value;
  },
  _userSubject: userSubject, // Expose userSubject for testing
};

// Authenticate the user and start a refresh token timer
async function login(params) {
  return fetchWrapper
    .post(`${baseUrl}/authenticate`, params)
    .then(unwrap)
    .then(async (user) => {
      if (!user || typeof user !== "object") {
        throw new Error("Email or password is incorrect");
      }
      if (!user.jwtToken) {
        throw new Error("JWT not included in response");
      }
      // Backend is the source of truth for entitlements; user.entitlements should be included
      userSubject.next(user);
      // Ensure acting entitlements apply immediately on login if Boss is scoped
      wireTenantChangeListener();
      const scopedIdOnLogin = getScopedIdIfBoss();
      if (scopedIdOnLogin) {
        const key = makeKey(user.jwtToken, scopedIdOnLogin);
        if (lastAppliedKey !== key) {
          lastAppliedKey = key;
          try {
            await reloadCustomerEntitlements(scopedIdOnLogin);
          } catch (e) {
            console.warn(
              "Failed to load acting entitlements after login:",
              e?.message || e,
            );
          }
        }
      }
      startRefreshTokenTimer();
      return user;
    });
}

function logout() {
  const excludedPaths = ["/login", "/verify", "/reset-password"];
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search || "";
  const fullPath = `${currentPath}${currentSearch}`;

  // Only persist app paths (avoid marketing/public pages)
  const isAppPath =
    currentPath.startsWith("/app") || currentPath.startsWith("/boss");

  if (isAppPath && !excludedPaths.includes(currentPath)) {
    localStorage.setItem("lastVisitedPath", fullPath);
  } else {
    localStorage.removeItem("lastVisitedPath");
  }
  // Revoke the refresh token using the cookie
  fetchWrapper
    .post(`${baseUrl}/revoke-token`, {}, { retry: 0 })
    .catch((error) => {
      console.error(
        "Failed to revoke token during logout:",
        error.message || error,
      );
    });
  stopRefreshTokenTimer();
  userSubject.next(null);
}

// Refresh the user's JWT token
async function refreshToken() {
  if (_refreshInFlight) return _refreshInFlight;

  _refreshInFlight = fetchWrapper
    .post(`${baseUrl}/refresh-token`, {}, { retry: 0 })
    .then(unwrap)
    .then(async (user) => {
      if (!user.jwtToken) {
        throw new Error("JWT not included in response");
      }
      userSubject.next(user);
      wireTenantChangeListener();
      const scopedIdOnRefresh = getScopedIdIfBoss();
      if (scopedIdOnRefresh) {
        const key = makeKey(user.jwtToken, scopedIdOnRefresh);
        if (lastAppliedKey !== key) {
          lastAppliedKey = key;
          try {
            await reloadCustomerEntitlements(scopedIdOnRefresh);
          } catch (e) {
            console.warn(
              "Failed to load acting entitlements after refresh:",
              e?.message || e,
            );
          }
        }
      }
      startRefreshTokenTimer();
      return user;
    })
    .catch((error) => {
      const msg = String(error?.message || error || "").toLowerCase();
      const isAuthError =
        msg.includes("unauthorised") ||
        msg.includes("unauthorized") ||
        msg.includes("401");
      stopRefreshTokenTimer();
      userSubject.next(null);
      if (isAuthError) {
        // No active session — return null quietly
        return null;
      }
      console.error("Failed to refresh token:", error?.message || error);
      throw error;
    })
    .finally(() => {
      _refreshInFlight = null;
    });

  return _refreshInFlight;
}

// Register a new user
function register(params) {
  return fetchWrapper.post(`${baseUrl}/register`, params).then(unwrap);
}

// Register the first user in the system
function registerFirstUser(params) {
  return fetchWrapper
    .post(`${baseUrl}/register-first-user`, params)
    .then(unwrap);
}

// Verify the user's token
function verifyToken(token) {
  return fetchWrapper.post(`${baseUrl}/verify-token`, { token }).then(unwrap);
}

// Verify the user's email address
function verifyEmail(params) {
  return fetchWrapper.post(`${baseUrl}/verify-email`, params).then(unwrap);
}

// Send a password reset email
function forgotPassword({ customerId, email }) {
  if (!customerId) throw new Error("customerId is required");
  if (!email) throw new Error("email is required");
  return fetchWrapper
    .post(`${baseUrl}/forgot-password`, { customerId, email })
    .then(unwrap);
}

// Validate the password reset token
function validateResetToken(token) {
  return fetchWrapper
    .post(`${baseUrl}/validate-reset-token`, { token })
    .then(unwrap);
}

// Reset the user's password
function resetPassword({ customerId, token, password, confirmPassword }) {
  if (!customerId) throw new Error("customerId is required");
  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }
  return fetchWrapper
    .post(`${baseUrl}/reset-password`, {
      customerId,
      token,
      password,
    })
    .then(unwrap);
}

function setNewPassword() {
  throw new Error(
    "setNewPassword is not available on /api/v2/users yet. Add POST /api/v2/users/set-password (or remove this feature).",
  );
}

function deactivateUser() {
  throw new Error(
    "deactivateUser is not available on /api/v2/users yet. Add PUT /api/v2/users/deactivate/:id (or remove this feature).",
  );
}

function reactivateUser() {
  throw new Error(
    "reactivateUser is not available on /api/v2/users yet. Add PUT /api/v2/users/reactivate/:id (or remove this feature).",
  );
}

function resendInvitation() {
  throw new Error(
    "resendInvitation is not available on /api/v2/users yet. Add POST /api/v2/users/resend-invitation/:id (or remove this feature).",
  );
}

// Fetch all users
function getAll() {
  return fetchWrapper.get(baseUrl).then(unwrapItems);
}

// Fetch all users by client ID
function getAllByClientId() {
  throw new Error(
    "getAllByClientId is not available on /api/v2/users yet. Add GET /api/v2/users/by-client (or remove this feature).",
  );
}

// Fetch a user by ID
function getById(id) {
  return fetchWrapper.get(`${baseUrl}/${id}`).then(unwrap);
}

// Create a new user
function create(params) {
  return fetchWrapper.post(baseUrl, params).then(unwrap);
}

// Invite a user and create a linked resource (composite)
async function inviteWithResource(params) {
  const res = await fetchWrapper.post(
    `${baseUrl}/invite-with-resource`,
    params,
    {
      retry: 0,
    },
  );
  return unwrap(res);
}

// Update an existing user
function update(id, params) {
  return fetchWrapper
    .put(`${baseUrl}/${id}`, params)
    .then(unwrap)
    .then((user) => {
      if (
        user?.id &&
        userSubject.value?.id &&
        user.id === userSubject.value.id
      ) {
        user = { ...userSubject.value, ...user };
        userSubject.next(user);
      }
      return user;
    })
    .catch((error) => {
      console.error(`Failed to update user with ID ${id}:`, error.message);
      throw error;
    });
}

// Delete a user
function _delete(id) {
  return fetchWrapper
    .delete(`${baseUrl}/${id}`)
    .then(unwrap)
    .then((x) => {
      if (id === userSubject.value?.id) {
        logout();
      }
      return x;
    })
    .catch((error) => {
      console.error(`Failed to delete user with ID ${id}:`, error.message);
      throw error;
    });
}

function hasFeature(feature) {
  const u = userSubject.value;
  return Array.isArray(u?.entitlements) && u.entitlements.includes(feature);
}

async function reloadCustomerEntitlements(customerId) {
  const u = userSubject.value;
  if (!u) return [];

  // Prefer explicit argument, then currently scoped customer, then home tenant
  const scoped =
    typeof getScopedCustomerId === "function" ? getScopedCustomerId() : null;
  const id = customerId || scoped || u.customerId;

  if (!id) {
    const err = {
      status: 400,
      message: "No customerId available to load entitlements",
    };
    // eslint-disable-next-line no-console
    console.warn("reloadEntitlements: ", err.message);
    throw err;
  }

  try {
    const ents = await fetchWrapper
      .get(`${API_ROOT}/customers/${id}/customer-entitlements`)
      .then(unwrap);

    // Normalise to an array of feature slugs (strings)
    const list = Array.isArray(ents)
      ? ents
      : Array.isArray(ents?.data)
        ? ents.data
        : [];
    const features = list
      .map((e) => (typeof e === "string" ? e : e?.feature))
      .filter(Boolean);

    const updated = { ...u, entitlements: features };
    // eslint-disable-next-line no-console
    userSubject.next(updated);
    return updated.entitlements;
  } catch (e) {
    console.log("something has gone wrong: ", e);
    // Re-throw so callers (Dashboard) can surface alerts and/or rollback selection
    throw e;
  }
}

// Helper functions
let refreshTokenTimeout;

// Start the refresh token timer
function startRefreshTokenTimer() {
  const jwtToken = JSON.parse(atob(userSubject.value.jwtToken.split(".")[1]));
  const expires = new Date(jwtToken.exp * 1000);
  const timeout = Math.max(expires.getTime() - Date.now() - 60 * 1000, 5000);
  refreshTokenTimeout = setTimeout(refreshToken, timeout);
}

// Stop the refresh token timer
function stopRefreshTokenTimer() {
  clearTimeout(refreshTokenTimeout);
}
