import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/admin`;

export const adminService = {
  getAll,
  getBySlug,
  saveBlog,
  saveFaq,
  delete: _delete,
};

async function getAll() {
  return await fetchWrapper.get(`${baseUrl}/content`);
}

async function getBySlug(slug) {
  return await fetchWrapper.get(`${baseUrl}/content/${slug}`);
}

async function saveBlog(data) {
  return await fetchWrapper.post(`${baseUrl}/save-blog`, data);
}

async function saveFaq(data) {
  return await fetchWrapper.post(`${baseUrl}/save-faq`, data);
}

async function _delete(slug) {
  return await fetchWrapper.delete(`${baseUrl}/content/${slug}`);
}
