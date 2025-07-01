import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/tcp`;

export const tcpService = {
  getAll,
  getAllByReportId,
  patchRecord,
  patchRecords,
  patchErrorRecord,
  getTcpByReportId,
  sbiUpdate,
  partialUpdate,
  getById,
  bulkCreate,
  bulkUpdate,
  delete: _delete,
  getIncompleteSmallBusinessFlags,
  submitFinalReport,
  downloadSummaryReport,
  upload,
  getErrorsByReportId,
  recalculateMetrics,
};

async function getAll() {
  return await fetchWrapper.get(baseUrl);
}

async function getAllByReportId(reportId) {
  const response = await fetchWrapper.get(`${baseUrl}/report/${reportId}`);
  // console.log("Fetched TCP records for reportId:", reportId, response);
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

async function getTcpByReportId(reportId) {
  return await fetchWrapper.get(`${baseUrl}/tcp/${reportId}`);
}

async function sbiUpdate(reportId, params) {
  return await fetchWrapper.put(`${baseUrl}/sbi/${reportId}`, params);
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

async function submitFinalReport() {
  return await fetchWrapper.put(`${baseUrl}/submit-final`);
}

async function downloadSummaryReport() {
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

async function getErrorsByReportId(reportId) {
  return await fetchWrapper.get(`${baseUrl}/errors/${reportId}`);
}
//   for (const dir of modelDirs) {

async function recalculateMetrics(reportId) {
  return await fetchWrapper.put(`${baseUrl}/recalculate/${reportId}`);
}
