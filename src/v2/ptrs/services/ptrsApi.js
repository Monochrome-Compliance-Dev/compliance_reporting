// PTRS v2 service — thin, explicit endpoints
// Best practice: components/hooks call this service; service calls fetch-wrapper.
// No React imports here. .js only.

import { fetchWrapper } from "lib/utils/fetch-wrapper";

const API = process.env.REACT_APP_API_URL; // align with tcp service convention

// Note: Backend should scope by effective customer (middleware). Run IDs scope per PTRS run.

export const getRunStatus = (runId) =>
  fetchWrapper.get(`${API}/ptrs/${runId}/status`);

export const createRun = (payload) => fetchWrapper.post(`${API}/ptrs`, payload);

export const listRuns = ({ name, periodKey } = {}) => {
  const params = new URLSearchParams();
  if (name) params.append("name", name);
  if (periodKey) params.append("periodKey", periodKey);
  const qs = params.toString();
  return fetchWrapper.get(`${API}/ptrs${qs ? `?${qs}` : ""}`);
};

export const getUploadStatus = (runId) =>
  fetchWrapper.get(`${API}/ptrs/${runId}/upload/status`);

export const uploadCsv = (runId, file, columnMapId) => {
  const fd = new FormData();
  fd.append("file", file);
  if (columnMapId) fd.append("columnMapId", columnMapId);
  // Important: use postUpload so Content-Type boundary is set by the browser.
  return fetchWrapper.postUpload(`${API}/ptrs/${runId}/upload`, fd);
};

export const getMapStatus = (runId) =>
  fetchWrapper.get(`${API}/ptrs/${runId}/map/status`);

export const selectMap = (runId, mapId) =>
  fetchWrapper.post(`${API}/ptrs/${runId}/map/select`, { mapId });

export const getValidationStatus = (runId) =>
  fetchWrapper.get(`${API}/ptrs/${runId}/validation/status`);

export const startValidation = (runId) =>
  fetchWrapper.post(`${API}/ptrs/${runId}/validation/start`, {});

export const getRulesStatus = (runId) =>
  fetchWrapper.get(`${API}/ptrs/${runId}/rules/status`);

export const applyRules = (runId, payload) =>
  fetchWrapper.post(`${API}/ptrs/${runId}/rules/apply`, payload);

export const getSbiStatus = (runId) =>
  fetchWrapper.get(`${API}/ptrs/${runId}/sbi/status`);

export const exportSbi = (runId) =>
  fetchWrapper.get(`${API}/ptrs/${runId}/sbi/export`); // server returns URL or signed link string

export const importSbi = (runId, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return fetchWrapper.postUpload(`${API}/ptrs/${runId}/sbi/import`, fd);
};

export const getSummary = (runId) =>
  fetchWrapper.get(`${API}/ptrs/${runId}/summary`);

export const recomputeMetrics = (runId) =>
  fetchWrapper.post(`${API}/ptrs/${runId}/summary/recompute`, {});

export const getReportStatus = (runId) =>
  fetchWrapper.get(`${API}/ptrs/${runId}/report/status`);

export const createReportDraft = (runId, payload) =>
  fetchWrapper.post(`${API}/ptrs/${runId}/report/draft`, payload);

export const setReportState = (runId, state) =>
  fetchWrapper.post(`${API}/ptrs/${runId}/report/state`, { state });

export const downloadReportPdf = (runId) =>
  fetchWrapper.get(`${API}/ptrs/${runId}/report/pdf`);
