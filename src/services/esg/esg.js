import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/esg`;

export const esgService = {
  getReportingPeriods,
  createReportingPeriod,
  getIndicators,
  createIndicator,
  getMetrics,
  createMetric,
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
