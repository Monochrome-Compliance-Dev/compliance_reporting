import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/tcp`;

export const tcpService = {
  getAll,
  getAllByPtrsId,
  patchRecord,
  patchRecords,
  patchErrorRecord,
  getTcpByPtrsId,
  sbiUpdate,
  partialUpdate,
  getById,
  bulkCreate,
  bulkUpdate,
  delete: _delete,
  getIncompleteSmallBusinessFlags,
  submitFinalPtrs,
  downloadSummaryPtrs,
  upload,
  getErrorsByPtrsId,
  recalculateMetrics,
  resolveErrors,
};
async function resolveErrors(records) {
  return await fetchWrapper.post(`${baseUrl}/errors/resolve`, records);
}

async function getAll() {
  return await fetchWrapper.get(baseUrl);
}

async function getAllByPtrsId(ptrsId) {
  const response = await fetchWrapper.get(`${baseUrl}/ptrs/${ptrsId}`);
  // console.log("Fetched TCP records for ptrsId:", ptrsId, response);
  return response;
}

async function patchRecord(id, updates) {
  return fetchWrapper.patch(`${baseUrl}/${id}`, updates);
}

async function patchRecords(updates) {
  return fetchWrapper.patch(`${baseUrl}/bulk-patch`, updates);
}

async function patchErrorRecord(id, updates) {
  return fetchWrapper.patch(`${baseUrl}/error/${id}`, updates);
}

async function getTcpByPtrsId(ptrsId) {
  return await fetchWrapper.get(`${baseUrl}/tcp/${ptrsId}`);
}

async function sbiUpdate(ptrsId, params) {
  return await fetchWrapper.put(`${baseUrl}/sbi/${ptrsId}`, params);
}

async function partialUpdate(params) {
  return await fetchWrapper.put(`${baseUrl}/partial`, params);
}

async function getById(id) {
  return await fetchWrapper.get(`${baseUrl}/${id}`);
}

async function bulkCreate(params) {
  return await fetchWrapper.post(baseUrl, params);
}

async function bulkUpdate(params) {
  return await fetchWrapper.put(baseUrl, params);
}

async function _delete(id) {
  return await fetchWrapper.delete(`${baseUrl}/${id}`);
}

async function getIncompleteSmallBusinessFlags() {
  return await fetchWrapper.get(`${baseUrl}/missing-isSb`);
}

async function submitFinalPtrs() {
  return await fetchWrapper.put(`${baseUrl}/submit-final`);
}

async function downloadSummaryPtrs() {
  return await fetchWrapper.get(`${baseUrl}/download-summary`, null, "blob");
}

async function upload(formData, isFormData = false) {
  return fetchWrapper
    .postUpload(`${baseUrl}/upload`, formData, true)
    .then((res) => {
      // console.log("TCP upload response:", res);
      return res;
    })
    .catch((err) => {
      console.error("TCP upload error:", err);
      throw err;
    });
}

async function getErrorsByPtrsId(ptrsId) {
  return await fetchWrapper.get(`${baseUrl}/errors/${ptrsId}`);
}
//   for (const dir of modelDirs) {

async function recalculateMetrics(ptrsId) {
  return await fetchWrapper.put(`${baseUrl}/recalculate/${ptrsId}`);
}
