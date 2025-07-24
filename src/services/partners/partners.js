import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/partners`;

export const partnerService = {
  getAll,
  create,
  update,
  remove,
};

// GET /partners
async function getAll() {
  return await fetchWrapper.get(`${baseUrl}`);
}

// POST /partners
async function create(params) {
  return await fetchWrapper.post(`${baseUrl}`, params);
}

// PUT /partners/:id
async function update(id, params) {
  return await fetchWrapper.put(`${baseUrl}/${id}`, params);
}

// DELETE /partners/:id
async function remove(id) {
  return await fetchWrapper.delete(`${baseUrl}/${id}`);
}
