import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/files`;

export const fileService = {
  uploadFile,
  getFileById,
  getFiles,
  deleteFile,
};

async function uploadFile(params) {
  const formData = new FormData();
  if (params.file) formData.append("file", params.file);
  if (params.category) formData.append("category", params.category);
  if (params.indicatorId) formData.append("indicatorId", params.indicatorId);
  if (params.metricId) formData.append("metricId", params.metricId);

  return await fetchWrapper.postUpload(`${baseUrl}`, formData);
}

async function getFileById(id) {
  return await fetchWrapper.get(`${baseUrl}/${id}`);
}

async function getFiles(query) {
  if (!query || Object.keys(query).length === 0) {
    throw new Error("At least one identifier must be provided to fetch files.");
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return await fetchWrapper.get(`${baseUrl}?${params.toString()}`);
}

async function deleteFile(id) {
  return await fetchWrapper.delete(`${baseUrl}/${id}`);
}
