import { fetchWrapper } from "shared/utils";

const baseUrl = `${process.env.REACT_APP_API_URL}/v2/customers`;

// GET /customers -> expects an array of customers
export async function listCustomers() {
  const response = await fetchWrapper.get(baseUrl);
  return response;
}

// POST /customers -> expects { status, data }
export async function createCustomer(payload) {
  const response = await fetchWrapper.post(baseUrl, payload);
  return response?.data;
}

// PUT /customers/:id -> expects { status, data }
export async function updateCustomer(id, payload) {
  const response = await fetchWrapper.put(`${baseUrl}/${id}`, payload);
  return response?.data;
}

// DELETE /customers/:id -> expects { status, message }
export async function deleteCustomer(id) {
  const response = await fetchWrapper.delete(`${baseUrl}/${id}`);
  return response;
}
