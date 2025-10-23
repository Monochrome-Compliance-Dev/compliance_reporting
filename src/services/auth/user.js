import { publicRoutes } from "routes/publicRoutes";
import { protectedRoutes } from "routes/routeConfig";
import { BehaviorSubject } from "rxjs";

import { fetchWrapper } from "lib/utils/fetch-wrapper";
import { getScopedCustomerId, onCustomerChange } from "lib/utils/tenantScope";

const userSubject = new BehaviorSubject(null);
const baseUrl = `${process.env.REACT_APP_API_URL}/users`;

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
          // eslint-disable-next-line no-console
          console.warn(
            "Failed to reload entitlements on tenant change:",
            e?.message || e
          );
        }
      } else {
        // Acting cleared; leave current entitlements as-is (base entitlements from server).
      }
    });
  } catch (e) {
    // eslint-disable-next-line no-console
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
            // eslint-disable-next-line no-console
            console.warn(
              "Failed to load acting entitlements after login:",
              e?.message || e
            );
          }
        }
      }
      startRefreshTokenTimer();
      return user;
    });
}

function logout() {
  const allPaths = [
    ...publicRoutes.map((r) => r.path),
    ...protectedRoutes.flatMap((r) =>
      r.children
        ? r.children.map((c) => `${r.path}/${c.path || ""}`.replace(/\/+$/, ""))
        : [r.path]
    ),
  ];

  // May need to update over time if routes change
  const excludedPaths = ["/login", "/verify", "/reset-password"];
  const currentPath = window.location.pathname;

  if (!excludedPaths.includes(currentPath) && allPaths.includes(currentPath)) {
    localStorage.setItem("lastVisitedPath", currentPath);
  } else {
    localStorage.removeItem("lastVisitedPath");
  }
  // Revoke the refresh token using the cookie
  fetchWrapper
    .post(`${baseUrl}/revoke-token`, {}, { retry: 0 })
    .catch((error) => {
      console.error(
        "Failed to revoke token during logout:",
        error.message || error
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
              e?.message || e
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
  return fetchWrapper.post(`${baseUrl}/register`, params);
}

// Register the first user in the system
function registerFirstUser(params) {
  return fetchWrapper.post(`${baseUrl}/register-first-user`, params);
}

// Verify the user's token
function verifyToken(token) {
  return fetchWrapper.post(`${baseUrl}/verify-token`, { token });
}

// Verify the user's email address
function verifyEmail(params) {
  return fetchWrapper.post(`${baseUrl}/verify-email`, params);
}

// Send a password reset email
function forgotPassword(email) {
  return fetchWrapper.post(`${baseUrl}/forgot-password`, { email });
}

// Validate the password reset token
function validateResetToken(token) {
  return fetchWrapper.post(`${baseUrl}/validate-reset-token`, { token });
}

// Reset the user's password
function resetPassword({ token, password, confirmPassword }) {
  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }
  return fetchWrapper.post(`${baseUrl}/reset-password`, {
    token,
    password,
    confirmPassword,
  });
}

function setNewPassword({ token, password, confirmPassword }) {
  return fetchWrapper.post(`/users/set-password`, {
    token,
    password,
    confirmPassword,
  });
}

function deactivateUser(id) {
  return fetchWrapper.put(`/users/deactivate/${id}`);
}

function reactivateUser(id) {
  return fetchWrapper.put(`/users/reactivate/${id}`);
}

function resendInvitation(id) {
  return fetchWrapper.post(`/users/resend-invitation/${id}`);
}

// Fetch all users
function getAll() {
  return fetchWrapper.get(baseUrl);
}

// Fetch all users by client ID
function getAllByClientId() {
  return fetchWrapper.get(`${baseUrl}/by-client`);
}

// Fetch a user by ID
function getById(id) {
  return fetchWrapper.get(`${baseUrl}/${id}`);
}

// Create a new user
function create(params) {
  return fetchWrapper.post(baseUrl, params);
}

// Invite a user and create a linked resource (composite)
async function inviteWithResource(params) {
  const res = await fetchWrapper.post(
    `${baseUrl}/invite-with-resource`,
    params,
    {
      retry: 0,
    }
  );
  return res;
}

// Update an existing user
function update(id, params) {
  return fetchWrapper
    .put(`${baseUrl}/${id}`, params)
    .then((user) => {
      if (user.id === userSubject.value.id) {
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
    .then((x) => {
      if (id === userSubject.value.id) {
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
    const ents = await fetchWrapper.get(
      `${process.env.REACT_APP_API_URL}/customers/${id}/customer-entitlements`
    );

    // Normalise to an array of feature slugs (strings)
    const list = Array.isArray(ents?.data)
      ? ents.data
      : Array.isArray(ents)
        ? ents
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
