import { fetchWrapper } from "shared/utils";

const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
const baseUrl = `${API_ROOT}/platform/interactions`;

export function normaliseInteractionResponse(response) {
  const data =
    response && typeof response === "object" && "data" in response
      ? response.data
      : response;

  return {
    success: Boolean(data?.success),
    interactionId: data?.interactionId || null,
    capability: data?.capability || "interactions",
    message: data?.message || "Platform interaction completed.",
    actor: data?.actor || null,
  };
}

export async function executePlatformInteraction() {
  const response = await fetchWrapper.post(baseUrl, {});
  return normaliseInteractionResponse(response);
}
