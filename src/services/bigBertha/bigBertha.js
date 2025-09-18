import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const bigBerthaBase = `${process.env.REACT_APP_API_URL}/big-bertha`;

export const bigBerthaService = {
  uploadLocal,
  startIngest,
  getIngestJob,
  getPtrsRows,
  getPtrsErrors,
};

async function uploadLocal(formData, ptrsId) {
  const url = new URL(`${bigBerthaBase}/uploads/local`);
  if (ptrsId) url.searchParams.set("ptrsId", ptrsId);
  // Use the same authenticated path/pattern as other API calls
  return await fetchWrapper.postUpload(url.toString(), formData);
}

async function startIngest(
  { filePath, customerId, ptrsId, originalName, sizeBytes, format = "csv" },
  extra = {}
) {
  const { selectedHeaders = [], columnMap = null } = extra || {};
  console.info("[PTRS] startIngest →", {
    filePath,
    customerId,
    ptrsId,
    originalName,
    sizeBytes,
    format,
    selectedHeaders,
    hasColumnMap: !!columnMap,
  });
  return await fetchWrapper.post(`${bigBerthaBase}/ingest/start`, {
    filePath,
    customerId,
    ptrsId,
    originalName,
    sizeBytes,
    format,
    selectedHeaders,
    columnMap,
  });
}

async function getIngestJob(jobId) {
  return await fetchWrapper.get(`${bigBerthaBase}/ingest/${jobId}`);
}

async function getPtrsRows(ptrsId, { page = 1, pageSize = 100 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return await fetchWrapper.get(
    `${bigBerthaBase}/ptrs/${ptrsId}/rows?${params.toString()}`
  );
}

async function getPtrsErrors(ptrsId, { page = 1, pageSize = 100 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return await fetchWrapper.get(
    `${bigBerthaBase}/ptrs/${ptrsId}/errors?${params.toString()}`
  );
}
