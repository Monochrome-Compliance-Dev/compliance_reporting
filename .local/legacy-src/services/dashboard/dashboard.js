import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/tcp`;
const baseUrlDash = `${process.env.REACT_APP_API_URL}/tcp/dashboard`;

export const dashboardService = {
  getAll,
  getAllByReportId,
  getReportMetrics,
  getPreviousReportMetrics,
  getTcpByReportIdWithFilter,
  getFlaggedRecords,
  getMetricsSnapshot,
  getDashboardSignals,
  getDashboardExtendedMetrics,
};

async function getAll() {
  return await fetchWrapper.get(baseUrl);
}

async function getAllByReportId(reportId) {
  return await fetchWrapper.get(`${baseUrl}/report/${reportId}`);
}

async function getReportMetrics(reportId) {
  return await fetchWrapper.get(`${baseUrlDash}/${reportId}/metrics`);
}

async function getPreviousReportMetrics(reportId) {
  return await fetchWrapper.get(`${baseUrlDash}/${reportId}/metrics/previous`);
}

async function getTcpByReportIdWithFilter(reportId, filterParams = {}) {
  const query = new URLSearchParams(filterParams).toString();
  return await fetchWrapper.get(`${baseUrl}/report/${reportId}?${query}`);
}

async function getFlaggedRecords(reportId) {
  return await fetchWrapper.get(`${baseUrlDash}/${reportId}/flags`);
}

async function getMetricsSnapshot(reportId) {
  return await fetchWrapper.get(`${baseUrlDash}/${reportId}/snapshot`);
}

async function getDashboardSignals(reportId, params) {
  const qs =
    params?.start && params?.end
      ? `?start=${encodeURIComponent(params.start)}&end=${encodeURIComponent(params.end)}`
      : "";
  const response = await fetchWrapper.get(
    `${baseUrlDash}/${reportId}/signals${qs}`
  );
  return response;
}

async function getDashboardExtendedMetrics(reportId, params) {
  const qs =
    params?.start && params?.end
      ? `?start=${encodeURIComponent(params.start)}&end=${encodeURIComponent(params.end)}`
      : "";
  return await fetchWrapper.get(
    `${baseUrlDash}/${reportId}/extended-metrics${qs}`
  );
}
