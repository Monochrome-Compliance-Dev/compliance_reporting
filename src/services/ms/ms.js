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
  deleteSupplierRisk,
  getTrainingRecords,
  createTrainingRecord,
  deleteTrainingRecord,
  getGrievances,
  createGrievance,
  deleteGrievance,
  generateStatement,
  getSupplierRiskSummary,
  getTrainingStats,
  getGrievanceSummary,
};

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
async function getSupplierRisks(reportingPeriodId) {
  return await fetchWrapper.get(
    `${baseUrl}/reporting-periods/${reportingPeriodId}/supplier-risks`
  );
}

async function createSupplierRisk(reportingPeriodId, params) {
  return await fetchWrapper.post(
    `${baseUrl}/reporting-periods/${reportingPeriodId}/supplier-risks`,
    params
  );
}

async function deleteSupplierRisk(reportingPeriodId, riskId) {
  return await fetchWrapper.delete(
    `${baseUrl}/reporting-periods/${reportingPeriodId}/supplier-risks/${riskId}`
  );
}

// Training Records
async function getTrainingRecords(reportingPeriodId) {
  return await fetchWrapper.get(
    `${baseUrl}/reporting-periods/${reportingPeriodId}/training`
  );
}

async function createTrainingRecord(reportingPeriodId, params) {
  return await fetchWrapper.post(
    `${baseUrl}/reporting-periods/${reportingPeriodId}/training`,
    params
  );
}

async function deleteTrainingRecord(reportingPeriodId, recordId) {
  return await fetchWrapper.delete(
    `${baseUrl}/reporting-periods/${reportingPeriodId}/training/${recordId}`
  );
}

// Grievances
async function getGrievances(reportingPeriodId) {
  return await fetchWrapper.get(
    `${baseUrl}/reporting-periods/${reportingPeriodId}/grievances`
  );
}

async function createGrievance(reportingPeriodId, params) {
  return await fetchWrapper.post(
    `${baseUrl}/reporting-periods/${reportingPeriodId}/grievances`,
    params
  );
}

async function deleteGrievance(reportingPeriodId, grievanceId) {
  return await fetchWrapper.delete(
    `${baseUrl}/reporting-periods/${reportingPeriodId}/grievances/${grievanceId}`
  );
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
