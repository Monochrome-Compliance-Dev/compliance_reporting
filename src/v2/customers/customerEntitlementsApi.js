import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/v2/customers`;

export async function getCustomerEntitlements(customerId) {
  if (!customerId) {
    throw new Error("customerId is required to load entitlements");
  }

  const url = `${baseUrl}/${customerId}/entitlements`;
  const response = await fetchWrapper.get(url);
  return response;
}

export async function updateCustomerEntitlements(customerId, features) {
  if (!customerId) {
    throw new Error("customerId is required to update entitlements");
  }

  const url = `${baseUrl}/${customerId}/entitlements`;
  const payload = { features };
  const response = await fetchWrapper.put(url, payload);
  return response?.data;
}
