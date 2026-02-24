import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/esg`;

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
  getMetricById,
  getCategoryTotals,
  getAllIndicatorsWithLatestMetrics,
  getTotalsByIndicator,
  cloneTemplatesForReportingPeriod,
  createTemplate,
  getTemplates,
  getTemplateById,
  deleteTemplate,
};

async function getReportingPeriods() {
  return await fetchWrapper.get(`${baseUrl}/reporting-periods`);
}

async function getReportingPeriodById(id) {
  return await fetchWrapper.get(`${baseUrl}/reporting-periods/${id}`);
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
  return await fetchWrapper.get(
    `${baseUrl}/metrics/by-reporting-period/${reportingPeriodId}`
  );
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

async function getMetricById(metricId) {
  return await fetchWrapper.get(`${baseUrl}/metrics/${metricId}`);
}

async function getCategoryTotals(reportingPeriodId) {
  return await fetchWrapper.get(
    `${baseUrl}/dashboard/category-totals/${reportingPeriodId}`
  );
}

async function getAllIndicatorsWithLatestMetrics(reportingPeriodId) {
  return await fetchWrapper.get(
    `${baseUrl}/dashboard/indicators-with-metrics/${reportingPeriodId}`
  );
}

async function getTotalsByIndicator(reportingPeriodId) {
  return await fetchWrapper.get(
    `${baseUrl}/dashboard/totals-by-indicator/${reportingPeriodId}`
  );
}

async function cloneTemplatesForReportingPeriod(reportingPeriodId) {
  return await fetchWrapper.post(
    `${baseUrl}/reporting-periods/${reportingPeriodId}/clone-templates`
  );
}

async function createTemplate(params) {
  return await fetchWrapper.post(`${baseUrl}/templates`, params);
}

async function getTemplates() {
  return await fetchWrapper.get(`${baseUrl}/templates`);
}

async function getTemplateById(id) {
  return await fetchWrapper.get(`${baseUrl}/templates/${id}`);
}

async function deleteTemplate(id) {
  return await fetchWrapper.delete(`${baseUrl}/templates/${id}`);
}
