import { fetchWrapper } from "shared/utils";

// NOTE: REACT_APP_API_URL already includes `/api`
const baseUrl = `${process.env.REACT_APP_API_URL}/v2/customers`;

export async function getCustomerProfiles(customerId) {
  if (!customerId) {
    throw new Error("customerId is required to load profiles");
  }

  const url = `${baseUrl}/${customerId}/profiles`;
  const response = await fetchWrapper.get(url);
  return response;
}

export async function createCustomerProfile(customerId, payload) {
  if (!customerId) {
    throw new Error("customerId is required to create a profile");
  }

  const url = `${baseUrl}/${customerId}/profiles`;

  const body = {
    name: payload.name,
    description: payload.description ?? null,
    product: payload.product,
  };

  const response = await fetchWrapper.post(url, body);
  return response?.data;
}

export async function updateCustomerProfile(customerId, profileId, payload) {
  if (!customerId || !profileId) {
    throw new Error(
      "customerId and profileId are required to update a profile",
    );
  }

  const url = `${baseUrl}/${customerId}/profiles/${profileId}`;

  const body = {
    name: payload.name,
    description: payload.description ?? null,
    product: payload.product,
  };

  const response = await fetchWrapper.put(url, body);
  return response?.data;
}

export async function deleteCustomerProfile(customerId, profileId) {
  if (!customerId || !profileId) {
    throw new Error(
      "customerId and profileId are required to delete a profile",
    );
  }

  const url = `${baseUrl}/${customerId}/profiles/${profileId}`;
  const response = await fetchWrapper.delete(url);
  return response;
}
