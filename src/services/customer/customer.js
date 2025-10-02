import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/customers`;

export const customerService = {
  getAll,
  getById,
  create,
  update,
  patch,
  delete: _delete,
  getCustomersByAccess,
};

async function getAll() {
  return await fetchWrapper.get(baseUrl);
}

async function getById(id) {
  return await fetchWrapper.get(`${baseUrl}/${id}`);
}

async function create(params) {
  return await fetchWrapper.post(baseUrl, params);
}

async function update(id, params) {
  return await fetchWrapper.put(`${baseUrl}/${id}`, params);
}

async function patch(id, params) {
  return await fetchWrapper.patch(`${baseUrl}/${id}`, params);
}

async function _delete(id) {
  return await fetchWrapper.delete(`${baseUrl}/${id}`);
}

async function getCustomersByAccess(_userId) {
  // The backend derives the user from the auth token; no userId param is required.
  return fetchWrapper.get(`${baseUrl}/access`);
}
