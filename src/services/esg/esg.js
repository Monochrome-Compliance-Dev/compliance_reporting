import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/esg`;

async function getReportingPeriodById(id) {
  return await fetchWrapper.get(`${baseUrl}/reporting-periods/${id}`);
}

export const esgService = {
  getReportingPeriods,
  createReportingPeriod,
  getIndicators,
  createIndicator,
  getMetrics,
  createMetric,
  getIndicatorsByReportingPeriodId,
  getMetricsByReportingPeriodId,
  deleteIndicator,
  deleteMetric,
  submitReportingPeriod,
  approveReportingPeriod,
  rollbackReportingPeriod,
  getReportingPeriodById,
};

async function getReportingPeriods() {
  return await fetchWrapper.get(`${baseUrl}/reporting-periods`);
}

async function createReportingPeriod(params) {
  return await fetchWrapper.post(`${baseUrl}/reporting-periods`, params);
}

async function getIndicators() {
  return await fetchWrapper.get(`${baseUrl}/indicators`);
}

async function createIndicator(params) {
  return await fetchWrapper.post(`${baseUrl}/indicators`, params);
}

async function getMetrics() {
  return await fetchWrapper.get(`${baseUrl}/metrics`);
}

async function createMetric(params) {
  return await fetchWrapper.post(`${baseUrl}/metrics`, params);
}

async function getIndicatorsByReportingPeriodId(reportingPeriodId) {
  return await fetchWrapper.get(`${baseUrl}/indicators/${reportingPeriodId}`);
}

async function getMetricsByReportingPeriodId(reportingPeriodId) {
  return await fetchWrapper.get(`${baseUrl}/metrics/${reportingPeriodId}`);
}

async function deleteIndicator(indicatorId) {
  return await fetchWrapper.delete(`${baseUrl}/indicators/${indicatorId}`);
}

async function deleteMetric(metricId) {
  return await fetchWrapper.delete(`${baseUrl}/metrics/${metricId}`);
}

async function submitReportingPeriod(id) {
  return await fetchWrapper.post(`${baseUrl}/reporting-periods/${id}/submit`);
}

async function approveReportingPeriod(id) {
  return await fetchWrapper.post(`${baseUrl}/reporting-periods/${id}/approve`);
}

async function rollbackReportingPeriod(id) {
  return await fetchWrapper.post(`${baseUrl}/reporting-periods/${id}/rollback`);
}
