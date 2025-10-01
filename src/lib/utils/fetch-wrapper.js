import { userService } from "../../services";
import { getScopedCustomerId } from "./tenantScope";

export const fetchWrapper = {
  get,
  getDocument,
  post,
  postEmail,
  put,
  patch,
  delete: _delete,
  postUpload,
  postExternal,
};

async function withTimeout(promise, ms = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const response = await promise({ signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function handleRequestWithRetry(
  requestFn,
  args,
  retries = 3,
  baseDelay = 800
) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await requestFn(...args);
    } catch (error) {
      const shouldRetry = isTransientError(error) && attempt < retries - 1;
      if (!shouldRetry) {
        throw error;
      }
      const jitter = Math.floor(Math.random() * 250);
      const delay = baseDelay * Math.pow(2, attempt) + jitter;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function isTransientError(error) {
  // Browser fetch network errors are usually TypeError; our handleResponse rejects with {status, message}
  const transientStatus = [408, 429, 500, 502, 503, 504];
  if (error && typeof error === "object") {
    if (
      typeof error.status === "number" &&
      transientStatus.includes(error.status)
    )
      return true;
    if (error.name === "FetchError") return true;
    if (error.name === "TypeError") return true; // network error / CORS / timeout
  }
  return false;
}

async function get(url) {
  return await handleRequestWithRetry(_get, [url]);
}

async function _get(url, { signal } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...authHeader(url),
    ...tenantHeader(url),
    "X-CSRF-Token": sessionStorage.getItem("csrfToken") || "",
  };
  const requestOptions = {
    method: "GET",
    headers,
    credentials: "include",
    signal,
  };
  return withTimeout((opts) => fetch(url, { ...requestOptions, ...opts })).then(
    handleResponse
  );
}

function getDocument(url, location) {
  const headers = {
    Accept: "application/json, application/x-www-form-urlencoded",
    "Content-Type": "application/json",
    ...authHeader(url),
    ...tenantHeader(url),
    "X-CSRF-Token": sessionStorage.getItem("csrfToken") || "",
  };
  const requestOptions = {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(location),
  };

  return withTimeout((opts) => fetch(url, { ...requestOptions, ...opts })).then(
    handleResponseForDocuments
  );
}

async function post(url, body) {
  return await _post(url, body);
}

async function _post(url, body, { signal } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...authHeader(url),
    ...tenantHeader(url),
    "X-CSRF-Token": sessionStorage.getItem("csrfToken") || "",
  };
  const requestOptions = {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
    signal,
  };
  const response = await withTimeout((opts) =>
    fetch(url, { ...requestOptions, ...opts })
  );
  return handleResponse(response);
}

async function postExternal(url, body) {
  return await _postExternal(url, body);
}

async function _postExternal(url, body, { signal } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };
  const requestOptions = {
    method: "POST",
    headers,
    credentials: "omit", // IMPORTANT: no cookies/credentials for cross-origin Lambda
    mode: "cors",
    body: JSON.stringify(body),
    signal,
  };
  const response = await withTimeout((opts) =>
    fetch(url, { ...requestOptions, ...opts })
  );
  return handleResponse(response);
}

async function postUpload(url, formData) {
  const headers = {
    ...authHeader(url),
    ...tenantHeader(url),
    "X-CSRF-Token": sessionStorage.getItem("csrfToken") || "",
  }; // Don't set Content-Type explicitly for FormData

  const requestOptions = {
    method: "POST",
    headers,
    credentials: "include",
  };

  const response = await withTimeout((opts) =>
    fetch(url, { ...requestOptions, body: formData, ...opts })
  );
  return handleResponse(response);
}

async function postEmail(url, formData) {
  const headers = {
    ...authHeader(url),
    ...tenantHeader(url),
    "X-CSRF-Token": sessionStorage.getItem("csrfToken") || "",
  }; // Don't set Content-Type explicitly for FormData

  // Re-append file using Blob to ensure buffer is available in multer
  const file = formData.get("attachment");
  if (file instanceof File) {
    formData.delete("attachment");
    formData.append(
      "attachment",
      new Blob([await file.arrayBuffer()], { type: file.type }),
      file.name
    );
  }

  const requestOptions = {
    method: "POST",
    headers,
    credentials: "include",
  };

  const response = await withTimeout((opts) =>
    fetch(url, { ...requestOptions, body: formData, ...opts })
  );
  return handleResponse(response);
}

async function put(url, body) {
  return await _put(url, body);
}

async function _put(url, body, { signal } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...authHeader(url),
    ...tenantHeader(url),
    "X-CSRF-Token": sessionStorage.getItem("csrfToken") || "",
  };
  const requestOptions = {
    method: "PUT",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
    signal,
  };
  return withTimeout((opts) => fetch(url, { ...requestOptions, ...opts })).then(
    handleResponse
  );
}

async function patch(url, body) {
  return await _patch(url, body);
}

async function _patch(url, body, { signal } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...authHeader(url),
    ...tenantHeader(url),
    "X-CSRF-Token": sessionStorage.getItem("csrfToken") || "",
  };
  const requestOptions = {
    method: "PATCH",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
    signal,
  };
  const response = await withTimeout((opts) =>
    fetch(url, { ...requestOptions, ...opts })
  );
  return handleResponse(response);
}

async function _delete(url) {
  return await _deleteRequest(url);
}

async function _deleteRequest(url, { signal } = {}) {
  const headers = {
    Accept: "application/json",
    ...authHeader(url),
    ...tenantHeader(url),
    "X-CSRF-Token": sessionStorage.getItem("csrfToken") || "",
  };
  const requestOptions = {
    method: "DELETE",
    headers,
    credentials: "include",
    signal,
  };
  return withTimeout((opts) => fetch(url, { ...requestOptions, ...opts })).then(
    handleResponse
  );
}

// helper functions

function authHeader(url) {
  // return auth header with jwt if user is logged in and request is to the api url
  // const user = await firstValueFrom(userService.user);
  const user = userService.userValue;
  const isLoggedIn = user && user.jwtToken;
  const isApiUrl = url.startsWith(process.env.REACT_APP_API_URL);
  if (isLoggedIn && isApiUrl) {
    return { Authorization: `Bearer ${user.jwtToken}` };
  } else {
    return {};
  }
}

function tenantHeader(url) {
  // Attach the acting customer header for API calls when scoped.
  // If the route already carries /customers/:id and that id differs, let the URL param win
  // to avoid 400 "conflicting tenant IDs" from the backend contract.
  const isApiUrl = url.startsWith(process.env.REACT_APP_API_URL);
  if (!isApiUrl) return {};

  const customerId = getScopedCustomerId();
  if (!customerId) return {};

  // If URL has an explicit customer id, prefer that and suppress header when mismatched
  const match = url.match(/\/customers\/([^\/\?]+)/);
  const paramId = match && match[1];
  if (paramId && paramId !== customerId) {
    return {};
  }

  return { "X-Customer-Id": customerId };
}

function handleResponse(response) {
  const contentType = response.headers.get("content-type");
  const csrf = response.headers.get("x-csrf-token");
  if (csrf) {
    try {
      sessionStorage.setItem("csrfToken", csrf);
    } catch {
      // ignore storage failures
    }
  }

  return response.text().then((text) => {
    let data;
    try {
      data =
        contentType && contentType.includes("application/json") && text
          ? JSON.parse(text)
          : text;
    } catch {
      data = text;
    }

    if (!response.ok) {
      if (response.status === 401 && userService.userValue) {
        // auto logout only for real unauthorised
        userService.logout();
      }

      if (response.status === 403 && data?.reason) {
        if (process.env.NODE_ENV === "development") {
          console.log("response: ", response);
        }
        // Structured forbidden response from BE (tenantContext etc.)
        return Promise.reject({
          status: 403,
          reason: data.reason,
          message: data.message || "Forbidden",
        });
      }

      if (response.status === 404) {
        return data;
      }

      const message =
        (typeof data === "string" ? data.trim() : data?.message?.trim?.()) ||
        response.statusText ||
        "An unexpected error occurred";
      return Promise.reject({ status: response.status, message });
    }

    return data;
  });
}

function handleResponseForDocuments(response) {
  //return response;
  return response.text().then((text) => {
    const data = text; // && JSON.parse(text);

    if (!response.ok) {
      if ([401, 403].includes(response.status) && userService.userValue) {
        // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
        userService.logout();
      }

      const error = (data && data.message) || response.statusText;
      return Promise.reject(error);
    }
    return data;
  });
}
