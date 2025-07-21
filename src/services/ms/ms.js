import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/ms`;

export const msService = {
  getReportingPeriods,
  getReportingPeriodById,
  createReportingPeriod,
  getInterviewResponses,
  submitInterviewResponses,
  getSupplierRisks,
  createSupplierRisk,
  updateSupplierRisk,
  deleteSupplierRisk,
  getTrainingRecords,
  createTrainingRecord,
  updateTrainingRecord,
  deleteTrainingRecord,
  getGrievances,
  createGrievance,
  updateGrievanceRecord,
  deleteGrievance,
  generateStatement,
  getSupplierRiskSummary,
  getTrainingStats,
  getGrievanceSummary,
};

// Helper to build query params
function buildQueryParams(params) {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      searchParams.append(key, params[key]);
    }
  }
  return searchParams.toString();
}

// Reporting Periods
async function getReportingPeriods() {
  return await fetchWrapper.get(`${baseUrl}/reporting-periods`);
}

async function getReportingPeriodById(id) {
  return await fetchWrapper.get(`${baseUrl}/reporting-periods/${id}`);
}

async function createReportingPeriod(params) {
  return await fetchWrapper.post(`${baseUrl}/reporting-periods`, params);
}

// Interview Responses
async function getInterviewResponses(reportingPeriodId) {
  return await fetchWrapper.get(
    `${baseUrl}/reporting-periods/${reportingPeriodId}/interview`
  );
}

async function submitInterviewResponses(reportingPeriodId, params) {
  return await fetchWrapper.post(
    `${baseUrl}/reporting-periods/${reportingPeriodId}/interview`,
    params
  );
}

// Supplier Risks
async function getSupplierRisks(startDate, endDate) {
  const query = buildQueryParams({ startDate, endDate });
  return await fetchWrapper.get(
    `${baseUrl}/supplier-risks${query ? `?${query}` : ""}`
  );
}

async function createSupplierRisk(params) {
  return await fetchWrapper.post(`${baseUrl}/supplier-risks`, params);
}

async function updateSupplierRisk(id, params) {
  return await fetchWrapper.put(`${baseUrl}/supplier-risks/${id}`, params);
}

async function deleteSupplierRisk(riskId) {
  return await fetchWrapper.delete(`${baseUrl}/supplier-risks/${riskId}`);
}

// Training Records
async function getTrainingRecords(startDate, endDate) {
  const query = buildQueryParams({ startDate, endDate });
  return await fetchWrapper.get(
    `${baseUrl}/training${query ? `?${query}` : ""}`
  );
}

async function createTrainingRecord(params) {
  return await fetchWrapper.post(`${baseUrl}/training`, params);
}

async function updateTrainingRecord(recordId, params) {
  return await fetchWrapper.put(`${baseUrl}/training/${recordId}`, params);
}

async function deleteTrainingRecord(recordId) {
  return await fetchWrapper.delete(`${baseUrl}/training/${recordId}`);
}

// Grievances
async function getGrievances(startDate, endDate) {
  const query = buildQueryParams({ startDate, endDate });
  return await fetchWrapper.get(
    `${baseUrl}/grievances${query ? `?${query}` : ""}`
  );
}

async function createGrievance(params) {
  return await fetchWrapper.post(`${baseUrl}/grievances`, params);
}

async function updateGrievanceRecord(grievanceId, params) {
  return await fetchWrapper.put(`${baseUrl}/grievances/${grievanceId}`, params);
}

async function deleteGrievance(grievanceId) {
  return await fetchWrapper.delete(`${baseUrl}/grievances/${grievanceId}`);
}

// Generate Statement
async function generateStatement(reportingPeriodId) {
  return await fetchWrapper.post(
    `${baseUrl}/reporting-periods/${reportingPeriodId}/statement`
  );
}

// Analytics calls
async function getSupplierRiskSummary() {
  return await fetchWrapper.get(`${baseUrl}/dashboard/supplier-risk-summary`);
}

async function getTrainingStats() {
  return await fetchWrapper.get(`${baseUrl}/dashboard/training-stats`);
}

async function getGrievanceSummary() {
  return await fetchWrapper.get(`${baseUrl}/dashboard/grievance-summary`);
}
