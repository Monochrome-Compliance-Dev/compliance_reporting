import { userService } from "../../services";

export const fetchWrapper = {
  get,
  getDocument,
  post,
  postEmail,
  put,
  patch,
  delete: _delete,
  postUpload,
};

async function handleRequestWithRetry(
  requestFn,
  args,
  retries = 3,
  delay = 1000
) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await requestFn(...args);
    } catch (error) {
      if (attempt < retries - 1 && isTransientError(error)) {
        await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
      } else {
        throw error; // Rethrow if retries are exhausted or error is not transient
      }
    }
  }
}

function isTransientError(error) {
  // Check for transient errors like network timeouts or 5xx server errors
  return (
    error.name === "FetchError" ||
    (error.response && error.response.status >= 500)
  );
}

async function get(url) {
  return await handleRequestWithRetry(_get, [url]);
}

async function _get(url) {
  const headers = {
    "Content-Type": "application/json",
    ...authHeader(url),
    "X-CSRF-Token": sessionStorage.getItem("csrfToken") || "",
  };
  const requestOptions = { method: "GET", headers, credentials: "include" };
  return fetch(url, requestOptions).then(handleResponse);
}

function getDocument(url, location) {
  const requestOptions = {
    method: "POST",
    headers: {
      Accept: "application/json, application/x-www-form-urlencoded",
      "Content-Type": "application/json",
      ...authHeader(url),
    },
    credentials: "include",
    body: JSON.stringify(location),
  };

  return fetch(url, requestOptions).then(handleResponseForDocuments);
}

async function post(url, body) {
  return await handleRequestWithRetry(_post, [url, body]);
}

async function _post(url, body) {
  const headers = {
    "Content-Type": "application/json",
    ...authHeader(url),
    "X-CSRF-Token": sessionStorage.getItem("csrfToken") || "",
  };
  const requestOptions = {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  };
  const response = await fetch(url, requestOptions);
  return handleResponse(response);
}

async function postUpload(url, formData) {
  const headers = authHeader(url); // Don't set Content-Type explicitly for FormData

  const requestOptions = {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  };

  const response = await fetch(url, requestOptions);
  return handleResponse(response);
}

async function postEmail(url, formData) {
  const headers = authHeader(url); // Don't set Content-Type explicitly for FormData

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
    body: formData,
  };

  const response = await fetch(url, requestOptions);
  return handleResponse(response);
}

async function put(url, body) {
  return await handleRequestWithRetry(_put, [url, body]);
}

async function _put(url, body) {
  const headers = {
    "Content-Type": "application/json",
    ...authHeader(url),
    "X-CSRF-Token": sessionStorage.getItem("csrfToken") || "",
  };
  const requestOptions = {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  };
  return fetch(url, requestOptions).then(handleResponse);
}

async function patch(url, body) {
  return await handleRequestWithRetry(_patch, [url, body]);
}

async function _patch(url, body) {
  const headers = {
    "Content-Type": "application/json",
    ...authHeader(url),
    "X-CSRF-Token": sessionStorage.getItem("csrfToken") || "",
  };
  const requestOptions = {
    method: "PATCH",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  };
  const response = await fetch(url, requestOptions);
  return handleResponse(response);
}

async function _delete(url) {
  return await handleRequestWithRetry(_deleteRequest, [url]);
}

async function _deleteRequest(url) {
  const headers = {
    ...authHeader(url),
    "X-CSRF-Token": sessionStorage.getItem("csrfToken") || "",
  };
  const requestOptions = {
    method: "DELETE",
    headers,
  };
  return fetch(url, requestOptions).then(handleResponse);
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

function handleResponse(response) {
  const contentType = response.headers.get("content-type");

  return response.text().then((text) => {
    let data;
    try {
      data =
        contentType && contentType.includes("application/json")
          ? JSON.parse(text)
          : text;
    } catch {
      data = text;
    }

    if (!response.ok) {
      if ([401, 403].includes(response.status) && userService.userValue) {
        userService.logout();
      }

      if (response.status === 404) {
        return data;
      }

      const error =
        (typeof data === "string" ? data.trim() : data?.message?.trim?.()) ||
        response.statusText ||
        "An unexpected error occurred";
      return Promise.reject({ status: response.status, message: error });
    }

    return data;
  });
}

function handleResponseForDocuments(response) {
  console.log("handleResponseForDocuments response: ", response);
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
    console.log("data: ", data);
    return data;
  });
}
