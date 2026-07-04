import { fetchWrapper } from "shared/utils";

const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
const baseUrl = `${API_ROOT}/platform/foundation`;

export function normaliseFoundationResponse(response) {
  const data =
    response && typeof response === "object" && "data" in response
      ? response.data
      : response;

  return {
    success: Boolean(data?.success),
    foundationId: data?.foundationId || null,
    capability: data?.capability || "foundation",
    message: data?.message || "Platform foundation completed.",
    actor: data?.actor || null,
  };
}

export async function executePlatformFoundation() {
  const response = await fetchWrapper.post(baseUrl, {});
  return normaliseFoundationResponse(response);
}
